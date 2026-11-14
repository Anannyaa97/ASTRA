from datetime import datetime, timezone

import httpx
import pytest

from app.services import nasa_service as ns
from tests.test_api import client  # noqa: F401  (fixture; gives an in-memory database)

NOW = datetime(2026, 11, 7, 12, 0, tzinfo=timezone.utc)

FLR = {"flrID": "2026-11-01T01:00:00-FLR-001", "beginTime": "2026-11-01T01:00Z", "classType": "M2.1",
       "sourceLocation": "N10W20", "link": "https://webtools.ccmc.gsfc.nasa.gov/DONKI/view/FLR/1/-1"}
CME = {"activityID": "2026-11-02T03:00:00-CME-001", "startTime": "2026-11-02T03:00Z", "note": "Fast CME."}
SEP = {"sepID": "2026-11-03T05:00:00-SEP-001", "eventTime": "2026-11-03T05:00Z"}
GST = {"gstID": "2026-11-04T09:00:00-GST-001", "startTime": "2026-11-04T09:00Z"}


def fake_ok(url, params):
    return {"FLR": [FLR], "CME": [CME], "SEP": [SEP], "GST": [GST]}[url.rsplit("/", 1)[1]]


def fake_down(url, params):
    raise ns.FetchError("down")


def test_live_success_normalises_and_labels(client):
    with client.Session() as db:
        view = ns.get_space_weather(db, 30, http_get=fake_ok, now=NOW)
    assert view["status"] == "LIVE" and view["failed_types"] == []
    assert view["retrieved_at"] == NOW.isoformat()
    assert [e["type"] for e in view["events"]] == ["GST", "SEP", "CME", "FLR"]   # newest first
    flare = view["events"][-1]
    assert "Class M2.1" in flare["detail"] and "medium" in flare["detail"]
    assert flare["link"].startswith("https://") and view["counts"] == {"FLR": 1, "CME": 1, "SEP": 1, "GST": 1}


def test_request_uses_the_official_base_url_and_date_window(client):
    seen = []

    def spy(url, params):
        seen.append((url, params))
        return []

    with client.Session() as db:
        ns.get_space_weather(db, 10, http_get=spy, now=NOW)
    assert seen[0][0] == "https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR"
    assert seen[0][1] == {"startDate": "2026-10-28", "endDate": "2026-11-07"}


def test_empty_live_answer_is_still_live(client):
    with client.Session() as db:
        view = ns.get_space_weather(db, 30, http_get=lambda u, p: [], now=NOW)
    assert view["status"] == "LIVE" and view["events"] == [] and "Quiet" in view["message"]


def test_failure_with_no_cache_gives_archived(client):
    with client.Session() as db:
        view = ns.get_space_weather(db, 30, http_get=fake_down, now=NOW)
    assert view["status"] == "ARCHIVED" and view["retrieved_at"] is None and len(view["events"]) == 3
    assert all(e["link"].startswith("https://") and e["kid_text"] for e in view["events"])


def test_failure_after_success_gives_cached_with_real_time(client):
    with client.Session() as db:
        ns.get_space_weather(db, 30, http_get=fake_ok, now=NOW)
    with client.Session() as db:
        view = ns.get_space_weather(db, 30, http_get=fake_down, now=datetime(2026, 11, 9, tzinfo=timezone.utc))
    assert view["status"] == "CACHED" and len(view["events"]) == 4
    assert view["retrieved_at"].startswith("2026-11-07T12:00")          # the time it was really fetched


def test_partial_failure_is_live_but_names_what_failed_and_is_not_cached(client):
    def flaky(url, params):
        if url.endswith("/CME"):
            raise ns.FetchError("timeout")
        return fake_ok(url, params)

    with client.Session() as db:
        view = ns.get_space_weather(db, 30, http_get=flaky, now=NOW)
        assert view["status"] == "LIVE" and view["failed_types"] == ["CME"] and "CME" in view["message"]
        assert ns._cache_get(db, "donki:30") is None


@pytest.mark.parametrize("bad", ["not a list", {"error": "x"}, None, 5])
def test_non_list_response_counts_as_failure(client, bad):
    with client.Session() as db:
        view = ns.get_space_weather(db, 30, http_get=lambda u, p: bad, now=NOW)
    assert view["status"] == "ARCHIVED"


def test_unusable_items_are_skipped_not_crashing(client):
    raw = [FLR, {"flrID": "x"}, "junk", 7, {"beginTime": "2026-11-01"}]
    with client.Session() as db:
        view = ns.get_space_weather(
            db, 30, http_get=lambda u, p: raw if u.endswith("/FLR") else [], now=NOW)
    assert view["status"] == "LIVE" and len(view["events"]) == 1 and view["skipped_items"] == 4


def test_untrusted_links_fall_back_to_donki_home():
    event = ns.normalize_event("FLR", {**FLR, "link": "http://evil.example/x"})
    assert event["link"] == ns.DONKI_HOME


def test_real_http_layer_turns_timeouts_and_bad_json_into_fetch_errors(monkeypatch):
    def timeout(*a, **k):
        raise httpx.ReadTimeout("slow")
    monkeypatch.setattr(httpx, "get", timeout)
    with pytest.raises(ns.FetchError):
        ns._http_get("https://x", {})

    class BadJson:
        def raise_for_status(self): pass
        def json(self): raise ValueError("bad")
    monkeypatch.setattr(httpx, "get", lambda *a, **k: BadJson())
    with pytest.raises(ns.FetchError):
        ns._http_get("https://x", {})


def test_endpoint_never_errors_when_nasa_is_unreachable(client, monkeypatch):
    monkeypatch.setattr(ns, "_http_get", fake_down)
    r = client.get("/api/nasa/space-weather?days=7")
    assert r.status_code == 200 and r.json()["status"] == "ARCHIVED"
    assert client.get("/api/nasa/space-weather?days=0").status_code == 422


def test_long_notes_are_cut_at_a_word_and_marked():
    long_note = "word " * 200
    event = ns.normalize_event("CME", {**CME, "note": long_note})
    assert len(event["note"]) <= ns.NOTE_LIMIT + 1 and event["note"].endswith("…")
    assert not event["note"][:-1].endswith("wor")           # never stops inside a word
    assert event["note"][:-1].split()[-1] == "word"


def test_short_note_is_kept_and_missing_note_is_empty():
    assert ns.normalize_event("CME", CME)["note"] == "Fast CME."
    assert ns.normalize_event("SEP", SEP)["note"] == ""


# ---------- RadLab (real ISS radiation readings) ----------
from app.services import radlab_service as rl  # noqa: E402

RAD_OK = {"columns": ["timestamp", "instrument_id", "absorbed_dose_rate", "instrument", "instrument_family", "spacecraft"],
          "index": [0, 1, 2, 3],
          "data": [["2022-04-01T00:00:00", "DosTel2", 2.0, "DosTel2", "DosTel", "ISS"],
                   ["2022-04-01T00:30:00", "DosTel1", 4.0, "DosTel1", "DosTel", "ISS"],
                   ["2022-04-01T05:00:00", "DosTel1", 100.0, "DosTel1", "DosTel", "ISS"]]}


def rad_ok(url, params):
    return RAD_OK


def rad_down(url, params):
    raise ns.FetchError("down")


def test_radlab_request_uses_the_query_form_that_nasa_accepts():
    url = rl.build_url("2022-04-01")
    assert url.startswith("https://visualization.osdr.nasa.gov/radlab/api/?query=")
    assert "(timestamp>=2022-04-01)AND(timestamp<2022-04-02)" in url and "fields+=absorbed_dose_rate" in url


def test_radlab_live_averages_per_hour_and_labels(client):
    with client.Session() as db:
        view = rl.get_iss_radiation(db, http_get=rad_ok, now=NOW)
    assert view["status"] == "LIVE" and view["retrieved_at"] == NOW.isoformat()
    assert view["hourly"] == [{"hour": 0, "readings": 2, "average": 3.0}, {"hour": 5, "readings": 1, "average": 100.0}]
    assert view["summary"] == {"readings": 3, "average": 35.3333, "minimum": 2.0, "maximum": 100.0}
    assert "not on the Moon" in view["disclaimer"]


def test_radlab_skips_bad_rows_and_rejects_bad_shapes(client):
    messy = {"columns": RAD_OK["columns"], "data": RAD_OK["data"] + [["bad", "x", "oops", "", "", ""],
                                                                      ["2022-04-01T07:00:00", "x", -5, "", "", ""],
                                                                      ["2022-04-01T08:00:00", "x", float("nan"), "", "", ""]]}
    hourly, summary, skipped = rl.summarise(messy)
    assert skipped == 3 and summary["readings"] == 3
    for bad in ({}, [], {"columns": ["timestamp"], "data": []}, {"columns": RAD_OK["columns"], "data": []}, "text"):
        with pytest.raises(ns.FetchError):
            rl.summarise(bad)


def test_radlab_falls_back_to_cache_then_to_the_real_archive(client):
    with client.Session() as db:
        archived = rl.get_iss_radiation(db, http_get=rad_down, now=NOW)
        assert archived["status"] == "ARCHIVED" and len(archived["hourly"]) == 24 and archived["retrieved_at"] is None
        assert archived["summary"]["readings"] == 2389 and archived["data_day"] == "2022-04-01"
        rl.get_iss_radiation(db, http_get=rad_ok, now=NOW)
        cached = rl.get_iss_radiation(db, http_get=rad_down, now=NOW)
        assert cached["status"] == "CACHED" and cached["retrieved_at"].startswith("2026-11-07T12:00:00")


def test_radlab_endpoint_always_answers(client):
    r = client.get("/api/nasa/radiation")
    assert r.status_code == 200 and r.json()["status"] in ("LIVE", "CACHED", "ARCHIVED")
