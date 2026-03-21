# Prompt Syndicate

Hackathon project — March 21, 2026

## Team

| Name | Role |
|------|------|
|      | Frontend |
|      | Frontend |
|      | Backend |
|      | Backend / Floater |
|      | Floater |

## Getting Started

### Frontend

**Stack:** Vite, React 19, **TypeScript** (`.tsx`), **Tailwind CSS** (PostCSS).

Requires **Node.js 24+** (see `client/.nvmrc`). With [nvm](https://github.com/nvm-sh/nvm): `nvm install` / `nvm use` from `client/`.

```bash
cd client
npm install
npm run dev
```

`npm run typecheck` runs `tsc -b`; `npm run build` runs TypeScript then Vite.

### Backend Setup (Docker)

To run the entire system (PostgreSQL Database, FastAPI Backend, and React Frontend), simply run Docker Compose from the root directory:

```bash
sudo docker compose up -d --build
```
*Note: The database seamlessly boots up and is automatically seeded with an initial Admin user (`username: admin`, `password: admin`).*

You can view the interactive Swagger API documentation locally at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

## API Contract

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup` | Register a new user account | None |
| `POST` | `/api/auth/login` | Login and receive a JWT token | None |
| `POST` | `/api/auth/admin-login` | Login as an admin (`admin`/`admin`) | None |
| `GET`  | `/api/events/`     | List all events                  | None |
| `POST` | `/api/events/`     | Create a new event               | Admin JWT |
| `GET`  | `/api/seats/event/{event_id}`| Get all seats for an event | None |
| `POST` | `/api/seats/`      | Create a new seat manually       | Admin JWT |
| `POST` | `/api/lock-seats/` | Lock a seat for 5 mins (row-lock) | User JWT |
| `POST` | `/api/bookings/confirm` | Convert a held seat lock into a Booking | User JWT |
