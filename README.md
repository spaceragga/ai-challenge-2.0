# AI Challenge 2.0

Repository for [AI Challenge 2.0](https://github.com/spaceragga/ai-challenge-2.0) submissions.

**Site:** https://spaceragga.github.io/ai-challenge-2.0/

## Task 1 — The Clone Wars (Vibe Coding)

Static replica of the internal company leaderboard.

| | |
|---|---|
| **Live demo** | https://spaceragga.github.io/ai-challenge-2.0/task-1/ |
| **Source** | [`task-1/`](./task-1/) |
| **Report** | [`task-1/report.md`](./task-1/report.md) |

### Local development

```bash
cd task-1
npm install
npm run dev
```

### Deploy (all tasks)

Each task is published under its own path (`/task-1/`, `/task-2/`, …) so later tasks do not overwrite earlier ones.

```bash
bash scripts/deploy-pages.sh
```

Or push to `main` — GitHub Actions runs [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml).

## Upcoming tasks

- `task-2` — Prototyping with Lovable → `/task-2/`
- `task-3` — Workflowing with n8n → `/task-3/`
- `task-4` — MCPing → `/task-4/`
