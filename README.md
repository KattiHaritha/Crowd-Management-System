# Crowd Management System

A responsive React and TypeScript dashboard built for the Kloudspot Crowd Management System frontend assessment. It provides authenticated access to live venue analytics, visitor records, and real-time crowd alerts.

## Features

- Secure login with inline error handling and password visibility toggle
- Protected dashboard and crowd-entry routes using a session token
- Dashboard cards for live occupancy, today's footfall, and average dwell time
- Occupancy and demographic visualizations powered by backend analytics APIs
- Paginated visitor entry and exit records with dwell time details
- Visitor search within the currently loaded entries page
- Socket.IO connection for real-time alert and occupancy updates
- Responsive sidebar and layouts for desktop and mobile viewports
- Loading, empty, and API-error states throughout the application

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Socket.IO Client
- Lucide React

## Prerequisites

- Node.js 20 LTS or a compatible current LTS version
- npm

## Local Setup

1. Clone the repository and open the project directory.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Vite in your browser.

## Environment Variables

Create a `.env` file from `.env.example`:

```env
VITE_API_BASE_URL=https://hiring-dev.internal.kloudspot.com/api
VITE_SOCKET_URL=https://hiring-dev.internal.kloudspot.com
```

Do not commit `.env`, since it may contain environment-specific values.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Type-checks the project and creates a production build. |
| `npm run preview` | Serves the production build locally. |

## API Integration

The application follows the supplied Swagger specification and integrates with:

- `POST /auth/login`
- `GET /sites`
- `POST /analytics/dwell`
- `POST /analytics/footfall`
- `POST /analytics/occupancy`
- `POST /analytics/demographics`
- `POST /analytics/entry-exit`
- `GET /sim/start` and `GET /sim/stop`

All authenticated requests include the JWT token received from login. Dashboard values are loaded from APIs; no mock analytics data is used.

## Verification

- `npm run build` completes successfully.
- Live login, sites, dwell, footfall, paginated entry/exit, and Socket.IO connection were verified using the supplied test account.
- The dashboard remains usable if an individual analytics request fails, showing available metrics together with an error message.

## Known Backend Limitation

At the time of verification, the live service returned `404` for the Swagger-documented `POST /analytics/occupancy` and `POST /analytics/demographics` endpoints. The frontend uses the documented paths and handles these unavailable chart APIs gracefully. Once the backend routes are available, the occupancy and demographics charts will load automatically.

## Build for Production

```bash
npm run build
npm run preview
```
