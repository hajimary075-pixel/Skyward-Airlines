# Skyward Airlines — Airline Booking Website

An original, fictional airline site built to the functional depth of a real
commercial booking platform, structured to reproduce the observable customer
journey of a Kenya-based regional carrier (Wilson-Airport hub, 12-destination
domestic + one regional network, WhatsApp-completed payment): live search,
a full fare/tax engine, real inventory that decrements on booking,
manage-booking with identity verification, simulated flight status, a
working admin dashboard, and a config file that drives all branding and
contact info. Zero npm dependencies — runs with just `node`.

**No code, private APIs, credentials, databases, or copyrighted assets were
copied from any real airline.** Airport IATA codes are real published codes
(so the network behaves correctly); flight numbers, times, capacities and
fares are fictional, inspired by realistic public fare tiers for the region.
See the `_note` field in `data/seed.json` for full detail, including the one
destination (Migori) that has no officially assigned IATA code.

## Run it

```
node server.js
```

Then open http://localhost:3000. Admin dashboard: http://localhost:3000/admin
(token defaults to `demo-admin-token`, set in `config/site.config.js` or via
`ADMIN_DEMO_TOKEN` — change it before deploying anywhere reachable).

## The 12 destinations

Dar es Salaam, Vipingo Ridge, Mombasa, Lodwar, Ukunda, Malindi, Eldoret,
Kitale, Lamu, Migori, Nairobi, Kisumu — exactly this list, no others. Eleven
are served hub-and-spoke from Nairobi (Wilson Airport, `WIL`); Dar es Salaam
is the one international route, flown from JKIA (`NBO`), matching how this
kind of regional network is actually structured. All 12 use the identical
destination template/component/data shape — nothing about Kisumu (the added
destination) is special-cased anywhere in the code.

## Architecture

- `server.js` — static file server + API dispatcher (Node `http`, no framework)
- `api.js` — all REST endpoints
- `lib/db.js` — JSON-file data layer with a write-lock queue that prevents
  double-booking under concurrent requests. This is the **only** module that
  touches the data file — swapping in Postgres/MySQL means reimplementing
  the functions this module exports, not rewriting the app.
- `lib/pricing.js` — **the single fare-calculation function**, used by the
  live quote endpoint, booking creation, the ticket page, Manage Booking,
  and the WhatsApp payment message. This is what keeps the total identical
  at every step of the journey (search → selection → passenger details →
  fare breakdown → booking → ticket → Manage Booking → WhatsApp message →
  admin dashboard) — they all read from the same calculation, never
  recompute independently.
- `lib/flightDataProvider.js` — the `FlightDataProvider` abstraction.
  Everything else calls `provider.searchFlights()` / `provider.getStatus()`
  etc. and never touches a GDS SDK directly. Flip
  `config.flags.liveAviationDataConnected` and implement
  `LiveFlightDataProvider` to go live without touching the frontend.
- `config/site.config.js` — single source of truth for branding, contact
  info, fare/tax/fee rates, and integration placeholders. Reads from
  environment variables first (see `.env.example`), falls back to demo
  defaults.
- `data/seed.json` — the 12-destination network, aircraft, deals, FAQs.
  Clearly labeled placeholder data (see `_note`). Replace via the admin
  dashboard or by editing this file before going live.
- `public/` — the customer-facing site (plain HTML/CSS/JS, no build step)
- `public/admin/` — the admin dashboard
- `PHOTO_CHECKLIST.md` — every image slot the site supports, with the
  exact filename/path to use for each, organized by destination and page.

## The fare/pricing engine

Every monetary element runs through `lib/pricing.js`:

- Adult / child (-25%) / infant (-90%) fares, configurable
- Per-passenger government tax and airport charge
- Flat per-booking service fee and booking fee
- Optional extra-baggage charge
- Deal/discount application (percentage off, tied to a destination)
- A single `grand_total` that is what gets stored on the booking, shown on
  the ticket, shown in Manage Booking, sent in the WhatsApp message, and
  summed in the admin revenue figure

Rates live in `config/site.config.js` → `fares` (also overridable via env
vars — see `.env.example`). Change a rate once; every page picks it up.

## WhatsApp payment

The booking flow does **not** use a card gateway. After a booking is
created (status `PENDING`), the ticket/confirmation page and Manage Booking
both show a **Pay via WhatsApp** button that opens a pre-filled message to
`config.contact.whatsapp` containing the booking reference, passenger names,
route, date, and the full fare breakdown. Clicking it **never** changes the
booking's payment status — only an administrator can do that, from the
Bookings tab in the admin dashboard (`PENDING → PAID`, or `FAILED` /
`CANCELLED` / `REFUND_REQUESTED` / `REFUNDED`). This is enforced server-side
in `api.js`, not just hidden in the UI.

## What's fully functional right now, locally, with zero setup

- Flight search across the full 12-destination network, sort/filter, backed
  by real inventory
- Live fare quoting (adult/child/infant, taxes, fees, applicable deal) shown
  on the booking form before submission, using the exact same calculation
  the booking will be charged
- Booking creation → real seat decrement, unique non-sequential booking
  reference, server-side validation (including travel date)
- Overselling prevention (tested against the 37-seat turboprop routes
  specifically, since those are the tightest capacity in the network;
  concurrent bookings are serialized so two requests can't both claim the
  last seat)
- Manage Booking: reference + surname lookup (won't return a booking to the
  wrong surname), full fare breakdown, WhatsApp payment button,
  cancellation with inventory release
- Simulated Flight Status page (schedule + time-of-day driven; clearly
  labeled as not a live feed)
- Destinations (all 12, gallery-ready), Deals, Fleet, FAQ (searchable),
  Contact form → stored enquiries
- Admin dashboard: overview stats, flight schedule/fare editing, inventory
  view, bookings list with inline payment-status control, destinations
  overview, enquiries list, audit log
- Config-driven branding/contact/social/fares everywhere (no hard-coded
  company identity or pricing anywhere in the code)
- Basic security: input validation, rate limiting, path-traversal
  protection on static files, security headers, no secrets sent to the
  frontend, write-serialized inventory updates

## What requires you to connect something before it's real

| Feature | Requires | Where |
|---|---|---|
| Actual WhatsApp number | Your business WhatsApp number | `config/site.config.js` → `contact.whatsapp` (or `WHATSAPP_NUMBER` env var) — already wired into every WhatsApp link on the site |
| Real, current flight schedules | Your actual published routes/fares | via the admin dashboard's Flights tab, or by editing `data/seed.json` directly |
| A card/mobile-money gateway (if you ever want one alongside WhatsApp) | A provider (Stripe/Flutterwave/Paystack/M-Pesa Daraja/etc), keys, and a verified webhook handler | `config/site.config.js` → `payment.*`; the `/api/payments/webhook` stub in `api.js` returns 501 until `PAYMENT_PROVIDER` is set to something other than `WHATSAPP` |
| Live flight status / GDS inventory | A real aviation-data or reservation-system API | implement `LiveFlightDataProvider` in `lib/flightDataProvider.js`, then set `flags.liveAviationDataConnected = true` |
| Outbound email (booking confirmations, enquiry replies) | An SMTP or transactional-email provider | `config/site.config.js` → `email.*`; hook the send call in at the marked points in `api.js` |
| Real admin authentication | Hashed passwords, sessions, and the roles the full spec calls for (Super Admin, Ops, Booking Staff, Content Editor, Support) | replace the single demo bearer token in `requireAdmin()` (`api.js`) — the single most important thing to fix before real deployment |
| A real database | Postgres/MySQL/etc for durability and reporting at scale | reimplement `lib/db.js`'s exported functions against your DB; nothing else changes |
| Analytics | A Google Analytics (or similar) property ID | `config/site.config.js` → `analytics.googleAnalyticsId` |
| Destination CRUD in the admin UI | A small form added to the existing Destinations tab | the tab currently reads/displays; editing is via `data/seed.json` for now — flagged rather than rushed |
| Photographs | See `PHOTO_CHECKLIST.md` | exact filenames/paths for every hero, gallery, fleet, and logo/favicon slot |
| News, Careers, deeper Travel Information CMS pages | Not built out in this pass | same architecture (JSON store + admin CRUD) extends cleanly — flagged here rather than padded out with placeholder content |

## Known simplifications (intentional, documented, not hidden)

- **No sessions/cookies for admin auth** — a single bearer token is used
  for the demo. It is genuinely gated (401 without it), but it is not
  role-based and not meant to survive contact with real users.
- **Inventory has no per-date dimension** — seats are tracked per flight
  number, not per flight *instance* on a specific date. The travel date is
  captured and stored on every booking (and shown on the ticket, in Manage
  Booking, and in the WhatsApp message), but doesn't yet gate inventory
  separately per date. A real deployment needs `flight_id + date` as the
  inventory key.
- **No temporary seat holds with expiry timer** — seats go straight to
  "booked" on submission. The `held` field and admin inventory view already
  model this for when a real hold/timeout flow is added.
- **Vipingo Ridge and Migori airport codes** — VPG is a real, confirmed
  IATA code; Migori has no official IATA code (only ICAO `HKMM`), so `MGR`
  used here is an internal placeholder, clearly flagged in `data/seed.json`.

## Deployment

This is a single Node process with no build step. Any host that runs
Node 18+ works. Put `data/runtime.json` on persistent storage (or swap
`lib/db.js` for a real database) — it's gitignored on purpose since it's
generated at first run.
