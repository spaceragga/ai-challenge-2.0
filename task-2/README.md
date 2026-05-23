




# Task 2 — EventPass (Share the Event)

Lightweight event hosting platform built with **Lovable** (TanStack Start + Supabase).

## Live app

**Deploy URL:** https://share-the-event.lovable.app/

## Video

https://github.com/user-attachments/assets/6613bc4d-1bab-4ecf-b66c-f1136c073688

https://github.com/user-attachments/assets/68251997-0e6e-47e8-aa80-39c51d77fd87

## Local development

```bash
cd task-2
cp .env.example .env   # fill Supabase keys from Lovable project settings
npm install            # or: bun install
npm run dev
```

## Usage guide (main flows)

### 1. Publish (Host)

1. Sign up / Sign in.
2. Open **Become a Host** (`/host/register`) — enter name, logo, bio, contact email.
3. Go to **Dashboard** → **New event**.
4. Fill title, description, dates/timezone, venue or online link, capacity, cover image.
5. Choose **Public** or **Unlisted**; leave **Paid** disabled (coming soon).
6. Click **Publish** (or Save draft → Publish from dashboard later).
7. Share event URL `/events/{slug}` or host page `/hosts/{slug}`.

### 2. RSVP (Attendee)

1. Browse **Explore** or open event link (works without sign-in).
2. Click **RSVP** — if signed out, you are redirected to sign-in and returned to the event.
3. If capacity available → **Going** + ticket code generated.
4. If full → **Waitlist** with queue position.
5. Cancel RSVP anytime; waitlist promotes automatically (FIFO).

### 3. Ticket

1. After RSVP, view ticket on the event page (QR + code).
2. **Add to Calendar** downloads `.ics`.
3. All upcoming tickets: **My Tickets** (`/tickets`).

### 4. Check-in (Checker / Host)

1. Host invites Checker via copyable link (Dashboard → invite).
2. Open **Check-in** for the event (`/dashboard/events/{id}/check-in`).
3. Enter ticket code manually → live counters update.
4. Duplicate scans are rejected; **Undo last scan** reverses the previous check-in.

## Seed data (required for submission)

In the **deployed** app, ensure:

| Item | How |
|------|-----|
| 1 Host | Register via `/host/register` (e.g. "Community Hub") |
| 1 upcoming event | Published, public, start date in the future |
| 1 past event | Published, public, end date in the past (shows **Ended**, no RSVP) |

Optional: create a few RSVPs + one check-in on the past event to demo CSV export.

## Submission artifacts in this folder

| File | Purpose |
|------|---------|
| `report.md` | Tools, what worked / didn't, decisions |
| `README.md` | This usage guide |
| `example-export.csv` | Sample CSV schema for graders |
| Source code | Full Lovable export |

## Deploy

This app **cannot** run on GitHub Pages (needs Supabase + SSR). Publish via **Lovable → Publish** or Cloudflare Workers (`wrangler`). Use the Lovable public URL in the submission form.
