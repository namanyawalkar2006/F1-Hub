<p align="center">
  <img src="public/assets/f1-logo.jpg" alt="F1 Hub logo" width="150">
</p>

<h1 align="center">F1 Hub</h1>

<p align="center">
  <strong>Your fan-made home for Formula 1 schedules, circuits, standings, results, and recorded session data.</strong>
</p>

<p align="center">
  <a href="https://f1-hub-t8a5.onrender.com/">Open the live website</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/namanyawalkar2006/F1-Hub">View the source</a>
</p>

> F1 Hub is an independent fan project. It is not affiliated with, endorsed by, or an official product of Formula 1, the FIA, or any F1 team.

## Contents

- [Why F1 Hub?](#why-f1-hub)
- [What you can do](#what-you-can-do)
- [Screenshots and video](#screenshots-and-video)
- [Data sources and integrity](#data-sources-and-integrity)
- [Technology](#technology)
- [How it works](#how-it-works)
- [Run it locally](#run-it-locally)
- [API reference](#api-reference)
- [Deploy on Render](#deploy-on-render)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Credits and license](#credits-and-license)

## Why F1 Hub?

Formula 1 information is spread across calendars, circuit pages, results, standings, and session archives. F1 Hub brings those fan essentials together in one responsive, race-inspired interface, with quick navigation between race weekends, track guides, drivers, constructors, and results.

The goal is to make the sport easier to explore while being honest about where information comes from and whether it is live or historical. F1 Hub is a companion for fans, not a replacement for [Formula1.com](https://www.formula1.com/) or official race coverage.

## What you can do

- **Explore the season calendar** with Grand Prix dates and available session schedules.
- **Browse 24 circuit guides** with track maps and circuit details.
- **Follow driver and constructor standings** and open individual profiles.
- **Review race and qualifying results** from the connected data provider.
- **Explore recorded sessions** with historical timing, lap, tyre, weather, and race-control data where the archive provides it.
- **Use the live-session view** to see session context and data availability clearly.
- **Navigate a responsive interface** with animated transitions and lazy-loaded page views.

## Screenshots and video

Screenshots and a walkthrough video will be added here. Suggested locations:

- `docs/media/home.png`
- `docs/media/circuits.png`
- `docs/media/standings.png`
- `docs/media/f1-hub-demo.mp4`

When the captures are ready, add them to `docs/media/` and embed them in this section. For example:

```md
![F1 Hub home page](docs/media/home.png)

[Watch the F1 Hub walkthrough](docs/media/f1-hub-demo.mp4)
```

## Data sources and integrity

F1 Hub uses public data APIs for its core race information:

| Source | Used for |
| --- | --- |
| [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) | Season schedules, driver and constructor standings, race results, qualifying results, and profile statistics. |
| [OpenF1](https://openf1.org/) | Session information and recorded telemetry from completed sessions, where available. |

Circuit guides and some presentation details are maintained by the project. Provider data may be delayed, incomplete, unavailable, or updated after a session.

### Live timing is not currently connected

F1 Hub does **not** currently have an authorized real-time F1 timing feed. The live view must not be interpreted as a live leaderboard. When no live feed is available, the app says so; archived OpenF1 telemetry is labeled as historical. F1 Hub does not invent car positions, gaps, lap times, countdowns, or race-control messages.

Core features work without provider credentials. Optional provider credentials can be configured locally when needed; see `.env.example`. Never commit credentials or tokens.

## Technology

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Motion
- **Backend:** Node.js, Express, REST API, WebSockets
- **F1 data:** Jolpica F1 API and OpenF1
- **Build and checks:** esbuild, TypeScript, Node.js test runner via `tsx`
- **Hosting:** Render Web Service

## How it works

```text
                  Browser
        React + TypeScript + Tailwind
                 │       │
       REST /api/*       WebSocket /ws/live
                 │       │
           Express + Node.js
                 │
       Data provider adapters
          ┌──────┴──────┐
          │             │
       Jolpica        OpenF1
   schedule/results   recorded sessions
```

The production server serves the built frontend and API from one service. Provider adapters normalize external responses for the app. Short-lived caches and request deduplication reduce repeat upstream calls; in-memory caches are cleared when the server restarts.

## Run it locally

### Requirements

- Node.js **22.14.0** (the version in `.node-version`)
- npm
- Git

### Install and start the development server

```bash
git clone https://github.com/namanyawalkar2006/F1-Hub.git
cd F1-Hub
npm ci
npm run dev
```

Open the local URL printed in the terminal; the default is `http://localhost:3000`. Keep the terminal running while you use the app. Press `Ctrl+C` to stop it.

If port 3000 is already in use, set another port before starting:

**PowerShell**

```powershell
$env:PORT = "3001"
npm run dev
```

**macOS / Linux**

```bash
PORT=3001 npm run dev
```

### Production build

```bash
npm run build
npm start
```

The build creates the frontend in `dist/` and the bundled production server in `server-build/`.

### Useful checks

```bash
npm run lint
npm test
npm run build
```

## API reference

The Express API is mounted at `/api`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check used by Render. |
| `GET` | `/api/status` | Service and data-provider status. |
| `GET` | `/api/calendar` | Current season schedule. |
| `GET` | `/api/next-session` | Next scheduled session. |
| `GET` | `/api/standings` | Driver and constructor standings. |
| `GET` | `/api/results` | Latest available race results. |
| `GET` | `/api/results/qualifying` | Latest available qualifying results. |
| `GET` | `/api/drivers/:driverRef?season=current` | Driver profile and results. |
| `GET` | `/api/constructors/:constructorRef?season=current` | Constructor profile and results. |
| `GET` | `/api/live?session_key=:key` | Current availability state or a selected archived session. |
| `POST` | `/api/live/select-session` | Select an archived session; send `{"session_key": 123}`. |
| `GET` | `/api/historical-sessions` | Available sessions from the OpenF1 archive. |
| `WS` | `/ws/live` | WebSocket connection for session state updates. |

## Deploy on Render

The repository includes a Render Blueprint in [`render.yaml`](render.yaml). To deploy your own copy:

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and connect the repository.
3. Review the service settings and create the Blueprint.

The Blueprint uses Node.js 22.14.0, builds the frontend and production server, starts with `npm start`, and checks `/api/health`. Auto-deploy is enabled for updates pushed to the connected branch.

### Free plan behavior

The published site is hosted on Render's Free plan. Free web services can spin down after inactivity. The first visit after a sleep may take around 50 seconds or longer while the service starts; the browser may show a loading state until the server responds. Schedule and standings are warmed during startup, while other data may be fetched from providers when requested. An always-on paid service is needed to avoid Free-plan spin-downs.

## Project structure

```text
.
├── public/                 # Static assets, favicon, robots.txt
├── src/
│   ├── components/         # Home, calendar, circuits, live, results, profiles
│   ├── hooks/              # Frontend data and session hooks
│   └── utils/              # Shared formatting and data helpers
├── server/
│   ├── providers/          # Jolpica and OpenF1 adapters
│   ├── routes.ts           # REST API endpoints
│   ├── openf1Client.ts     # OpenF1 API client
│   └── websocket.ts        # /ws/live endpoint
├── server.ts               # Express entry point
├── render.yaml             # Render deployment Blueprint
├── package.json
└── README.md
```

## Contributing

Bug reports and focused improvements are welcome. Before opening a pull request:

1. Keep changes scoped and avoid adding fabricated or unlabeled race data.
2. Install from the lockfile with `npm ci`.
3. Run `npm run lint`, `npm test`, and `npm run build`.
4. Describe what changed and include screenshots for visible UI changes when possible.

Please do not commit `.env` files, API credentials, access tokens, or generated build output.

## Credits and license

Thanks to the Jolpica and OpenF1 projects for making F1 data accessible to fans. Formula 1, FIA, team, driver, and related names and marks belong to their respective owners; their appearance here does not imply endorsement.

Created by **Naman Yawalkar**.

This repository currently has no `LICENSE` file. Unless a license is added, do not assume the code or project assets are licensed for reuse; contact the author for permission.