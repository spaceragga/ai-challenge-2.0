# Task 1 — Report

## Approach

Task 1 asked for a static replica of the internal Vention EDU Leaderboard (SharePoint SPFx web part): same UI elements, filters, sorting, and expandable activity rows — without real corporate data.

I used **Cursor** with agentic prompting: describe the target layout and behavior, iterate on components, then verify locally with `npm run dev`.

## Tools & techniques

| Tool | Role |
|------|------|
| **Cursor (Agent mode)** | Scaffolded the app, wrote React components, filter logic, and synthetic dataset |
| **Vite + React + TypeScript** | Component structure and type-safe data model |
| **Tailwind CSS** | Matched original palette (slate background, white cards, sky-500 accents) |
| **GitHub Actions + gh-pages** | Static deploy to GitHub Pages |

Techniques:
- Reverse-engineered the page structure from public task discussions and participant write-ups (filters, podium order 2-1-3, expandable rows, category icons).
- Built filter pipeline as pure functions (`computeUserUnderFilters`) — year × quarter × category × search in AND mode.
- Fixed sort: descending by total points (no sort UI in original).
- Seeded RNG for reproducible synthetic data.

## Data replacement

No real names, titles, departments, or photos were used.

| Original field | Replacement |
|--------------|-------------|
| Employee names | Star Wars characters (fits “Clone Wars” theme) |
| Job titles | Fictional ranks (`Jedi Master`, `Senator`, `Captain`, …) |
| Department codes | Planet/base codes (`CSN.JCN.HC`, `KMN.GAR.501`, …) |
| Categories | Same labels as original: **Education**, **Public Speaking**, **University Partnerships** |
| Activities | Generic workshop/talk/partnership descriptions |
| Avatars | Initials on colored circles (original fallback pattern) |
| Points | 4 / 8 / 16 / 32 / 64 |

~75 characters, each with 5–16 activities across 2023–2025.

## Deploy

Live demo: **https://spaceragga.github.io/ai-challenge-2.0/task-1/**

Site index (all tasks): **https://spaceragga.github.io/ai-challenge-2.0/**

Local run:

```bash
cd task-1
npm install
npm run dev
```

Build:

```bash
npm run build
```
