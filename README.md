# CalcFlow

CalcFlow is a full-stack, visual calculus-learning app focused on antiderivatives and the reverse power rule.

## Run locally

Requirements: Node.js 20 or later. No dependency install is required.

```bash
npm start
```

Open [http://localhost:4173](http://localhost:4173). Use `npm run dev` during development to restart the server after edits.

## What is included

- Responsive browser app: home dashboard, visual lesson, guided practice, Math Lab, and a curriculum map.
- JSON HTTP API for learner profile, practice problems, answer validation, attempts, XP, and mastery.
- File-backed persistence in `data/db.json`; it is intentionally easy to inspect and replace with a real database later.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server health check |
| `GET`, `PATCH` | `/api/profile` | Read or update the demo learner |
| `GET` | `/api/problems` | Get safe practice-problem data (answers excluded) |
| `POST` | `/api/attempts` | Validate and save an answer |
| `POST` | `/api/reset` | Reset demo progress |

`POST /api/attempts` expects `{ "problemId": "power-1", "answer": "2x^3 + C" }`.
