# Contributing to ClimateRisk Sentinel

This project aims for **clear separation of concerns** and **honest communication** about what the software does and does not predict.

## Principles

- **Routes stay thin** — Parse input, call services, map to Pydantic responses. No heavy geometry or raster logic in handlers.
- **Analysis stays testable** — Pure numerical helpers (indices, deltas, heuristic weights) live in `backend/app/services/analysis/` with unit tests under `backend/tests/`.
- **UI stays truthful** — Do not imply calibrated hazard probabilities or fake precision. Prefer caveats, definitions, and partial results when data is missing.
- **Avoid speculative scaffolding** — Unused “future job queue” or duplicate domain layers were removed on purpose; add complexity only when wired end-to-end.

## Development workflow

```bash
# Backend
cd backend && uv sync && uv run pytest

# Frontend
cd frontend && npm run lint && npm run build
```

## Naming

- Prefer **climate-risk / infrastructure context** in user-facing copy.
- **Heuristic** / **screening** / **proxy** for indices; avoid “prediction” unless you introduce a validated model with documented calibration.

## Pull requests

- Describe **what changed** and **why** (especially behavior or limits affecting reviewers).
- Keep diffs focused; unrelated refactors belong in separate PRs.
