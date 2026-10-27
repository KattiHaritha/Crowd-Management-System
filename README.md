# Crowd Management System — Frontend Assessment

Responsive React + TypeScript single-page dashboard for the Kloudspot Crowd Management System assessment.

## Features
- Login page with password visibility toggle and API error display
- Sidebar navigation and responsive header
- Live overview metrics with occupancy and demographic charts
- Crowd entries table with gender, dwell time, search, and API pagination
- Authenticated Axios API integration and Socket.IO live alerts

## Requirements
- Node.js 20 LTS (recommended) or a compatible current LTS
- npm

## Run locally
```bash
npm install
cp .env.example .env
npm run dev
```
On Windows PowerShell, copy the environment file with:
```powershell
Copy-Item .env.example .env
```
Open the localhost URL shown by Vite.

## API integration
The assessment brief names these endpoints:
- `POST /auth/login`
- `POST /analytics/dwell`
- `POST /analytics/footfall`
- `POST /analytics/occupancy`
- `POST /analytics/demographics`
- `POST /analytics/entry-exit`

Base API URL and Socket.IO URL are configured in `.env`. The login, site, analytics, entry/exit pagination, and live `alert` event integrations have been verified against the provided Swagger service. Dashboard values are loaded from the backend; no demo metrics are used.

## Build
```bash
npm run build
npm run preview
```

## Before submission
- [x] Verify login request body and token response in Swagger
- [x] Implement token/session persistence and protected routes
- [x] Connect dashboard analytics endpoints and entries pagination
- [x] Verify Socket.IO connection and live alert payloads
- [x] Handle loading, error, and empty states
- [ ] Test responsive layouts manually
- [ ] Deploy frontend and add live URL here
- [ ] Push source code to GitHub/GitLab
