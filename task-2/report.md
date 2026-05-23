# Task 2 — Report

## Tools & techniques

| Tool | Role |
|------|------|
| **Lovable** | AI-assisted build, UI, Supabase wiring, Cloudflare deploy |
| **TanStack Start + Router** | Full-stack React (SSR) |
| **Supabase** | Auth, Postgres, RLS, Storage, `promote_waitlist` RPC |
| **Tailwind + shadcn/ui** | UI components |
| **qrcode.react** | Ticket QR codes |

## Approach

Built **EventPass** as a single Lovable project from a structured requirements prompt. Iterated in Lovable until core flows worked, then synced to GitHub ([`share-the-event`](https://github.com/spaceragga/share-the-event)) and copied into `task-2/` of the challenge repo.

## What worked

- Self-serve host registration (`/host/register`) with logo upload
- Event CRUD: draft/publish/unpublish/duplicate, public vs unlisted, cover image
- Explore: text search, location filter, Include past toggle, Ended badge
- RSVP with auth redirect + return path; capacity → waitlist
- FIFO waitlist promotion via `promote_waitlist()` on cancel
- Promotion toast when `promoted_at` is set on event page load
- Tickets: QR code, Add to Calendar (.ics), My Tickets (upcoming only)
- Host dashboard: stats, CSV export (UTF-8 BOM), invite links (Host / Checker)
- Check-in: manual ticket code, live counters, duplicate guard, undo last scan
- Post-event feedback (1–5 stars + comment) for attendees who were Going
- Gallery uploads with Host approval queue
- Report flow + review queue (hide event/photo)
- My Events with role badge and role-based quick actions (Edit for Host, Check-in for both)

## Limitations (verified in code)

| Gap | Detail |
|-----|--------|
| **No SQL seed** | Migrations create schema only; demo Host + upcoming/past events must be created manually in the deployed app |
| **Host page: no contact email** | `hosts_public` view exposes `id, slug, name, bio, logo_url` only — `contact_email` intentionally hidden from public page (`hosts.$slug.tsx`) |
| **Explore: no date range picker** | Default upcoming = `end_at >= now`; "Include past" toggle exists, but no custom from/to date range filter |
| **My Events: partial filters** | Text search only — no Host dropdown or date range filter |
| **Per-page social preview** | OG/Twitter meta is global in `__root.tsx`; individual Event/Host pages don't set dynamic `og:title` / `og:image` from event cover |
| **Paid toggle** | Static label + tooltip in `EventEditor`, not an interactive disabled Switch |
| **Waitlist on capacity increase** | `promote_waitlist` runs on RSVP cancel, not when Host raises capacity in editor |
| **Photo report UI** | Users can report events; gallery photos have no per-photo Report button (DB supports `target_type: photo`) |
| **Check-in route guard** | No explicit React role check on check-in page — relies on Supabase RLS for `check_in_log` inserts |
| **Review queue scope** | Loads all pending photos / open reports globally, not scoped per Host org |
| **QR camera scan** | Not implemented (manual code entry only — allowed by spec) |
| **No email notifications** | Waitlist promotion is in-app toast only |

## Notable decisions

- **Supabase RLS** + security-definer RPCs for waitlist promotion and invite acceptance
- **Unlisted events** excluded from Explore; accessible via direct `/events/{slug}` link
- Deploy on **Lovable/Cloudflare** ([live app](https://share-the-event.lovable.app/)), not GitHub Pages — app requires Supabase + SSR
- Source mirrored to challenge repo under `task-2/` for submission

## Deploy URL

**https://share-the-event.lovable.app/**
