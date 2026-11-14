# ASTRA – Junior Astronaut Mission Trainer

*Your mission. Your decisions. Their survival.*

A consequence-driven lunar outpost simulator for children aged 7–12, built for the
NASA Space Apps Challenge "Build a Junior Astronaut Mission Trainer".

## Status

Phase 1 (Foundation) – project structure, backend skeleton, frontend shell,
design system, landing page and navigation.

Not built yet: simulation engine, events, NASA integration, What If? Lab,
reports, advisor. Pages for these exist only as clearly marked placeholders.

## Requirements

- Python 3.10+
- Node.js 18+ and npm

## Run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Check it: open http://localhost:8000/api/health  
Expected: `{"status":"ok","app":"ASTRA", ...}`  
Interactive API docs: http://localhost:8000/docs

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on
port 8000, so no CORS setup is needed during development. The landing page shows
a "Mission Control link" indicator that turns green when the backend is reachable.

## Project layout

```
astra/
  frontend/   React + Vite + Tailwind (UI only, no simulation maths)
  backend/    FastAPI + SQLAlchemy + SQLite (authoritative simulation state)
```

## Data honesty rule

Every value shown in ASTRA is labelled as one of: LIVE, CACHED, ARCHIVED
(NASA data) or SIMULATED (game scenario / normalized game units). Game values
are never presented as NASA engineering measurements.

## Audio attribution

Ambient track: ["Breathing Space Sparse Ambient Drone" by Alex Morgan](https://freemusicarchive.org/music/alex-morgan/ambient-relaxation-vol-1/breathing-space-sparse-ambient-drone/), licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). The track is re-encoded in mono at 22.05 kHz and 32 kbps for compact use in the game.
