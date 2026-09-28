# Admin Portal

React web app for administrators. Talks to the FastAPI backend in
[`../sproutly-backend`](../sproutly-backend).

## Stack

- React 19 + Vite
- React Router (data router, `src/router.jsx`)
- Tailwind CSS v4 — brand colours in `src/index.css`, shared with the mobile app
- oxlint

## Getting started

```bash
cp .env.example .env      # point VITE_API_URL at the backend
npm install
npm run dev               # http://localhost:5173
```

The backend must allow this origin — `CORS_ORIGINS` in `sproutly-backend/.env`
defaults to `http://localhost:5173`. The home page shows whether the backend is reachable.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Layout

```
src/
├── main.jsx          entry point
├── router.jsx        route table
├── index.css         Tailwind + theme colours
├── api/client.js     fetch wrapper: base URL, JSON, bearer token, errors
├── components/       shared UI (AppLayout)
└── pages/            one file per route
```
