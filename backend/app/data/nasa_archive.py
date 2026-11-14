"""ARCHIVED space-weather items: a few famous, well documented events used ONLY when no live or cached data exists.

These are short summaries, not DONKI records. They link to the DONKI home page, not to an event record, so a
learner (or a judge) can look the event up themselves. Each item says what to verify.
"""

DONKI_HOME = "https://ccmc.gsfc.nasa.gov/tools/DONKI/"

ARCHIVE = [
    {
        "id": "archive-2017-09-06-flare", "type": "FLR", "start_time": "2017-09-06",
        "headline": "X9.3 solar flare, 6 September 2017",
        "detail": "One of the strongest solar flares of the last solar cycle.",
        "link": DONKI_HOME,
        "verify": "Search DONKI solar flares for 2017-09-06.",
    },
    {
        "id": "archive-2024-05-10-storm", "type": "GST", "start_time": "2024-05-10",
        "headline": "Extreme geomagnetic storm, 10-11 May 2024",
        "detail": "The strongest geomagnetic storm in about 20 years. It lit up skies far from the poles.",
        "link": DONKI_HOME,
        "verify": "Search DONKI geomagnetic storms for 2024-05-10.",
    },
    {
        "id": "archive-2003-11-04-flare", "type": "FLR", "start_time": "2003-11-04",
        "headline": "Giant solar flare, 4 November 2003",
        "detail": "The biggest flare measured since X-ray satellites began watching the Sun.",
        "link": DONKI_HOME,
        "verify": "Check NASA's records for the 'Halloween storms' of 2003.",
    },
]
