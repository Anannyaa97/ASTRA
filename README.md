# ASTRA – Junior Astronaut Mission Trainer

*Your mission. Your decisions. Their survival.*

A consequence-driven lunar outpost simulator for children aged 7–12, built for the
**NASA Space Apps Challenge 2026**, challenge: *"Build a Junior Astronaut Mission Trainer."*

Team **Orbitelle** · [Space Apps team page](https://www.spaceappschallenge.org/2026/find-a-team/orbitelle/)

- **Anannya A K** — designer and developer · [GitHub](https://github.com/Anannyaa97)
- **Saaniga Santosh** — researcher

---

## What it is

ASTRA puts a child in command of a small lunar research outpost near the Moon's South
Pole. They manage power, oxygen, water, food, radiation protection and the link to
Earth across a 20-day mission, responding to events that force real engineering
trade-offs — there is no single "correct" choice, only choices with costs.

Every decision runs through a **deterministic Python simulation engine**: the same
seed and the same decisions always produce the same outcome, and the frontend never
calculates a single resource value itself — it only displays what the backend
computes.

## Features

- **Mission Simulator** — the core gameplay loop: a habitat view, daily events with
  real trade-offs, a predictive preview of each option's effects before you commit,
  and a daily report explaining what changed and why.
- **Mission Ladder** — four ordered missions, each unlocked by finishing the one
  before it:
  1. **First Landing** – a friendly first mission
  2. **Storm Season** – solar storms hit harder; shielding matters more
  3. **The Long Night** – a tighter power budget, no spare sunlight
  4. **Commander** – smaller supplies and two extra engineering problems
- **Communication delay** — the link to Earth is a real piece of equipment, not
  decoration. Below 70% it's *weak* (advice may be stale); below 25% it's a full
  *blackout* and the Mission Advisor goes silent until power or repairs restore it —
  reflecting the real light-time delay and line-of-sight challenges of the lunar
  South Pole.
- **What If? Lab** — change a parameter (sunlight, shielding, recycler efficiency…)
  and run it against an isolated copy of the simulation, with before/after charts.
  It never touches your real mission.
- **Mission Advisor** — four rule-based expert voices (Commander, Systems Engineer,
  Life Support Scientist, Space Weather Specialist) that read the real simulation
  numbers and explain consequences. They never change mission state.
- **NASA Reality Hub** — real NASA data, clearly separated from the game's fictional
  scenarios:
  - **Space Weather** — live solar flare / CME / SEP events from NASA's DONKI.
  - **Radiation** — real ISS radiation-dose history from NASA's RadLab, plus a
    "Real Sun check" that links current DONKI activity to the strength of the
    game's training storm (a game rule, never presented as an actual dose).
  - **Lunar Environment** — South Pole sunlight/shadow conditions and exploration
    challenges.
  - **Space Biology** — curated NASA OSDR research cards on spaceflight biology.
- **Mission Investigation Report** — failures are explained, not just displayed:
  primary cause, contributing decisions, resource history, and how it could have
  been avoided.
- **Astronaut Academy** — child-friendly lessons connecting each game mechanic to
  the real science behind it.
- **Achievements** — badges computed from real mission history, never randomly
  awarded.
- **Honest data labels everywhere** — every number on screen is tagged **LIVE**,
  **CACHED**, **ARCHIVED**, or **SIMULATED**, so a game value is never mistaken for
  a NASA measurement.

## Tech stack

| | |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Framer Motion, Recharts, Lucide icons |
| Backend | FastAPI, SQLAlchemy 2 + SQLite, Pydantic v2 |
| Testing | pytest (166 backend tests) |

## Requirements

- Python 3.10+
- Node.js 18+ and npm

## Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env         # macOS/Linux: cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Check it: open http://localhost:8000/api/health
Expected: `{"status":"ok","app":"ASTRA", ...}`
Interactive API docs: http://localhost:8000/docs

The database (`astra.db`, SQLite) is created automatically on first run.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on
port 8000, so no CORS setup is needed in development.

## Run the tests

```bash
cd backend
.venv\Scripts\activate
python -m pytest -q
```

166 tests cover the simulation formulas, resource limits, decision validation,
deterministic replay, the NASA API adapters (including their fallback behavior),
and the API layer end to end.

## NASA data sources

| Source | Used for | Status label when down |
|---|---|---|
| [DONKI](https://ccmc.gsfc.nasa.gov/DONKI/) | Space weather events (CME, FLR, SEP) | CACHED / ARCHIVED |
| [RadLab](https://radlab.nasa.gov/) | Real ISS radiation-dose history | CACHED / ARCHIVED |
| [OSDR](https://osdr.nasa.gov/) | Space biology research cards | ARCHIVED |
| [NASA Image and Video Library](https://images.nasa.gov/) | Imagery, with attribution | — |

If a live call fails, ASTRA falls back to a curated archived snapshot rather than
showing nothing or inventing data, and always says which one you're looking at.

## Project layout

```
astra/
  frontend/
    src/
      pages/        One file per screen (Mission Home, Simulator, NASA Hub, …)
      components/   Reusable UI pieces, grouped by area
      game/          The full-screen playable mission (/play)
      context/       MissionContext: the only place that talks to the backend
      utils/         Small pure helpers (formatting, the mission ladder, …)
      data/          Static content: Academy lessons, dataset descriptions
  backend/
    app/
      api/           FastAPI routes
      services/      The simulation engine and everything else that matters
      data/          Event library and archived NASA fallback data
      models/        SQLAlchemy tables
      schemas/       Pydantic request/response models
    tests/           166 tests
```

## Design principles this project follows

1. The simulation engine is the only authority on resource values — the frontend
   never computes game state, only displays it.
2. Real NASA data and fictional training scenarios are always labelled and never
   conflated. A DONKI solar storm classification is never presented as an actual
   astronaut radiation dose.
3. Every mission is deterministic and replayable: the same seed and decisions
   always produce the same result.
4. A failed mission is explained, not just scored.

## Known limitations

- All game values are normalized educational units, not real NASA engineering
  measurements.
- Live NASA calls depend on NASA's own API availability; ASTRA degrades to cached
  or archived data rather than failing silently.
- The "Real Sun check" link between live solar activity and the training storm's
  strength is a simplified game rule for teaching purposes, not a scientific
  radiation-dose calculation.

## Audio attribution

Ambient track: ["Breathing Space Sparse Ambient Drone" by Alex Morgan](https://freemusicarchive.org/music/alex-morgan/ambient-relaxation-vol-1/breathing-space-sparse-ambient-drone/), licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Re-encoded in mono at 22.05 kHz / 32 kbps for compact use in the game.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Team Orbitelle.
