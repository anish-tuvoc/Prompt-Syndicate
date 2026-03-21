# TicketHub - Real-Time Ticket Booking System

A full-stack ticket booking platform (BookMyShow-style) with real-time seat locking, built for a hackathon.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS, Framer Motion |
| Backend | FastAPI, SQLAlchemy ORM, Pydantic |
| Database | PostgreSQL 15 |
| Auth | JWT (PyJWT) + bcrypt - manually implemented, no third-party auth services |
| Infra | Docker Compose (3 services) |

## Key Features

- **Real-Time Seat Locking** - BookMyShow-style: selecting a seat instantly locks it in the database (1-min hold via `SELECT FOR UPDATE` row-level locks). Other users see it as unavailable within 3 seconds (polling). Locks auto-expire, and the UI auto-deselects expired seats.
- **Concurrency-Safe Booking** - Pessimistic locking prevents double-booking even under concurrent requests. Seats transition through AVAILABLE -> LOCKED -> BOOKED states atomically.
- **Movie Seat Selection** - Interactive 12-row x 14-seat theater layout (168 seats) with category-based pricing (Front/Middle/Rear), real-time availability counts, and smooth scroll-to-focus animations.
- **Session Timer** - 4-minute booking session countdown. When it expires, the user is redirected to the homepage.
- **Auth Flow** - Sign up (name + email + password), login via modal popup, JWT-based session. Seat selection requires authentication (auth gate on first click).
- **Booking History** - Users can view their past bookings with event details, seat numbers, and status.
- **Admin Panel** - Dashboard with venue management, seat management, booking oversight, user list, active lock monitoring, and activity feed. Accessible via `/auth` (admin login) then `/admin`.
- **Dark Mode** - Full dark/light theme support across all pages.
- **Event Discovery** - 10 seeded events across 6 categories (Movie, Concert, Theatre, Comedy, Sports, Festival) with filtering, sorting, and event detail pages.

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose

### Run

```bash
docker compose up -d --build
```

The database auto-creates tables and seeds 10 sample events, 168 seats per movie event, and an admin user.

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:8001 |
| Swagger Docs | http://localhost:8001/docs |
| Admin Login | http://localhost:5174/auth |
| Admin Panel | http://localhost:5174/admin |

**Admin credentials:** `admin` / `admin`

### Stop

```bash
docker compose down       # keep data
docker compose down -v    # wipe data (fresh start)
```

### Multi-Device Testing

Both phones must be on the same Wi-Fi network as the host machine.

```bash
# Find your local IP
hostname -I | awk '{print $1}'
```

Open `http://<your-ip>:5174` on each phone. Sign up with different accounts to test concurrent seat locking.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React     │────>│   FastAPI   │────>│  PostgreSQL  │
│  (Vite)     │<────│  (Uvicorn)  │<────│   (Alpine)   │
│  port 5174  │     │  port 8001  │     │  port 5433   │
└─────────────┘     └─────────────┘     └──────────────┘
     Vite proxy         REST API          Row-level locks
     /api -> backend    JWT auth          SELECT FOR UPDATE
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/signup` | Register (name, email, password) | - |
| `POST` | `/api/auth/login` | Login, receive JWT | - |
| `POST` | `/api/auth/admin-login` | Admin login | - |
| `GET` | `/api/events/` | List all events | - |
| `GET` | `/api/events/{id}` | Get event details | - |
| `GET` | `/api/seats/event/{id}` | Get seats + auto-cleanup expired locks | - |
| `POST` | `/api/lock-seats/` | Lock a seat (1-min hold, row-level lock) | User |
| `DELETE` | `/api/lock-seats/{seat_id}` | Unlock a seat (deselect) | User |
| `POST` | `/api/bookings/confirm` | Confirm booking (LOCKED -> BOOKED) | User |
| `GET` | `/api/bookings/me` | User's booking history | User |
| `GET` | `/api/admin/dashboard` | Admin dashboard stats | Admin |
| `GET` | `/api/admin/locks/active` | View active seat locks | Admin |

## Database Schema

```
users            events           seats              seat_locks         bookings          booking_seats
─────            ──────           ─────              ──────────         ────────          ─────────────
id (PK)          id (PK)          id (PK)            id (PK)           id (PK)           id (PK)
name             title            event_id (FK)      seat_id (FK)      user_id (FK)      booking_id (FK)
email (unique)   description      seat_number        user_id (FK)      event_id (FK)     seat_id (FK)
password_hash    event_type       status (enum)      locked_at         status (enum)
role             event_date       AVAILABLE|LOCKED   expires_at        CONFIRMED|
is_admin         ...              |BOOKED                              CANCELLED
```

## Seat Locking Flow

```
User clicks seat
       │
       ▼
POST /lock-seats/ ──► SELECT FOR UPDATE (row lock)
       │                     │
       │              ┌──────┴──────┐
       │              │  Available? │
       │              └──────┬──────┘
       │                Yes  │  No
       │                 │   │──► 409 Conflict
       │                 ▼
       │          Create SeatLock
       │          seat.status = LOCKED
       │          expires_at = now + 1 min
       │                 │
       ▼                 ▼
UI shows green      Other users see
(selected)          red X (booked)
       │
       │ (within 1 min)
       ▼
POST /bookings/confirm
       │
       ▼
seat.status = BOOKED (permanent)
```

## Project Structure

```
├── client/                    # React frontend
│   └── src/
│       ├── api/               # API client functions
│       ├── components/        # Shared UI components
│       │   └── booking/       # Seat, Theater, Stadium, Timer, Summary
│       ├── context/           # AuthContext (JWT + user state)
│       ├── pages/             # HomePage, EventDetail, Booking, Admin, Auth, History
│       └── data/              # Event type definitions
├── server/                    # FastAPI backend
│   └── app/
│       ├── api/routes/        # auth, events, seats, lock, booking, admin
│       ├── models/            # SQLAlchemy models (user, event, seat, booking, seat_lock, venue)
│       ├── schemas/           # Pydantic request/response schemas
│       ├── core/              # JWT security, dependencies, config
│       └── db/                # Session, base, init_db (seeding)
├── docker-compose.yml
└── .env
```

## Running Without Docker

**Frontend:**
```bash
cd client && npm install && npm run dev
```

**Backend:**
```bash
cd server && pip install -r requirements.txt
DATABASE_URL=postgresql://... SECRET_KEY=... uvicorn app.main:app --reload
```

Requires Node.js 24+ and Python 3.11+.
