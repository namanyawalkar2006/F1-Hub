# F1 Hub

> F1 Hub is an independent Formula 1 fan project focused on making race schedules, championship standings, results, and available live/historical F1 information fast and beautiful.
>
> F1 Hub uses publicly available F1 data APIs and clearly distinguishes live, delayed, historical, and unavailable data.
>
> The project never fabricates race information.

---

## 🏎️ Zero-Cost Data Strategy ($0 Mandatory Cost)

F1 Hub is engineered from the ground up to operate with **$0 mandatory subscription cost**:

1. **Jolpica F1 (Primary Free Provider)**:
   - Official 2026 World Championship race calendars and session schedules (Practice 1, 2, 3, Sprint, Qualifying, Grand Prix).
   - Driver & Constructor World Championship Standings.
   - Race classifications, podiums, and qualifying session results.
2. **OpenF1 Community Tier (Free Historical Telemetry)**:
   - Recorded session lap times, sector durations, pit stop records.
   - Tyre compound usage, stint lengths, and tyre age.
   - Track environment weather (temperatures, wind, rainfall).
   - Race control incident messages and flag records.
3. **Strict Data Integrity Policy**:
   - **Never fake data**: No random lap times, fake car coordinates, or simulated race positions.
   - If an authorized live feed is not connected: explicitly displays `LIVE TIMING UNAVAILABLE`.
   - If scheduled start time has passed without live feed: displays `SESSION EXPECTED TO HAVE STARTED • Live session data unavailable`.
   - Historical sessions are explicitly badged as `HISTORICAL DATA • SESSION COMPLETED`.

---

## Driver and Constructor Profiles

Driver and constructor profiles combine championship standings with qualifying, race, podium, win, sprint, and race-by-race results from the connected providers. Driver headshots use the high-resolution Formula 1 image variant when available. The 2026 constructor profiles include publicly identified power-unit suppliers and FIA-regulation specifications. The 350 kW MGU-K limit is shown as approximately 469 hp; undisclosed manufacturer-specific combined output is explicitly marked as unpublished. Power-unit references are linked in each profile.

---

## 🛠️ Architecture

```text
                  FREE F1 APIs ($0)
                          │
          ┌───────────────┴───────────────┐
          │                               │
      Jolpica F1                  OpenF1 Free Tier
   (Schedules, Standings,           (Historical Laps,
    Classifications)                 Weather, Telemetry)
          │                               │
          └───────────────┬───────────────┘
                          │
                   Provider Adapters
                          │
                  Data Integrity Guard
                          │
               Normalized Internal Models
                          │
                 F1 Hub Full-Stack Backend
                 (Express + WebSockets + REST)
                          │
                          ▼
                 Next-Gen React Frontend
           (Tailwind v4 + Motion + Tabular Timing)
```

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run dev server (Express + Vite on port 3000)
npm run dev

# 3. Run unit tests (Node:test via tsx)
npm test
```
To check the test which is the 13 test in the node server

### Environment Variables
F1 Hub works immediately out-of-the-box with **zero credentials needed**.
Optional configurations are documented in `.env.example`.

To start F1 Hub again in VS Code:

Open a terminal in the project folder.
Run:
npm run dev

Open the URL printed in the terminal. The default is http://localhost:3000. Keep the terminal open while you use the app; press Ctrl+C to stop it.
If port 3000 is already taken, start it on another port:
$env:PORT = "3001"
npm run dev


Then open http://localhost:3001. If that port is taken too, try 3002, and so on. The PORT setting applies only to that terminal session. The server reads it in server.ts.

## Deploying on Render

The repository includes a Render Blueprint in `render.yaml`. Push the project to a Git provider, then in Render choose **New → Blueprint**, connect that repository, and review the service before creating it. The Blueprint uses Node 22, builds the frontend and production server, and uses `/api/health` for health checks.

The server warms the Jolpica schedule and championship caches before it reports healthy, so the first page requests can use cached real data. Successful data requests are also cached in memory and use short browser cache headers.

This Blueprint uses Render's Free plan. Free web services can spin down after inactivity, so the first visit after a sleep can take noticeably longer; an always-on paid instance is needed to avoid that cold start. The current app has no authorized live-timing feed: it shows real schedules, standings, results, and available historical data, and clearly marks live timing unavailable when no live feed is supplied.

Do not commit `.env` files or provider credentials. Current APIs work without required secrets.