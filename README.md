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

## Prerequisites

### Install Docker (if not installed)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

**macOS:**
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Windows:**
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (requires WSL2)

Verify installation:
```bash
docker --version
docker compose version
```

## Getting Started (Docker — Recommended)

Run the entire stack (PostgreSQL + FastAPI Backend + React Frontend) with a single command:

```bash
docker compose up -d --build
```

That's it. The database auto-creates tables and seeds:
- 10 sample events
- Admin user (`username: admin`, `password: admin`)

To use the admin panel, go to `/auth`, switch to **admin auth**, sign in with `admin/admin`, then open `/admin`.

### Access Points

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:5174](http://localhost:5174) |
| Admin Panel | [http://localhost:5174/admin](http://localhost:5174/admin) |
| Backend API | [http://localhost:8001](http://localhost:8001) |
| Swagger Docs | [http://localhost:8001/docs](http://localhost:8001/docs) |

To stop everything:
```bash
docker compose down
```

To stop and wipe all data (fresh start):
```bash
docker compose down -v
```

## Getting Started (Without Docker)

### Frontend

**Stack:** Vite, React 19, **TypeScript** (`.tsx`), **Tailwind CSS** (PostCSS).

Requires **Node.js 24+** (see `client/.nvmrc`). With [nvm](https://github.com/nvm-sh/nvm): `nvm install` / `nvm use` from `client/`.

```bash
cd client
npm install
npm run dev
```

`npm run typecheck` runs `tsc -b`; `npm run build` runs TypeScript then Vite.

### Backend

Requires **Python 3.11+** and a running **PostgreSQL** instance.

```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set these environment variables (or use the `.env` file at root):
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing key

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
