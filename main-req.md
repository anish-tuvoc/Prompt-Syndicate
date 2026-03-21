# Product Requirements Document (PRD)

## TicketHub - Real-Time Ticket Booking System

### 1. Overview

**Product Name:** TicketHub
**Platform:** Web (React SPA + FastAPI backend)
**Goal:** Enable users to browse events, view seat availability in real-time, temporarily lock seats on selection, and securely complete bookings — preventing double-booking through pessimistic row-level database locking.

### 2. Objectives

- Prevent double booking using database-level pessimistic locking (`SELECT FOR UPDATE`)
- Provide near real-time seat availability via 3-second polling
- Deliver a smooth, interactive seat selection UX with immediate visual feedback
- Handle lock expiration and automatic seat recovery
- Support concurrent users on multiple devices

### 3. Users

**End Users**
- Browse and filter events by category
- Select seats interactively on a theater/stadium layout
- Lock seats on selection (1-minute hold)
- Confirm bookings
- View booking history

**Admin Users**
- View dashboard with booking/revenue stats
- Manage venues and seating
- Monitor active seat locks
- View all bookings and users

### 4. Implemented Features

#### 4.1 Event Discovery
- 10 seeded events across 6 categories: Movie, Concert, Theatre, Comedy, Sports, Festival
- Category filter bar (Movie fully functional; others marked WIP)
- Sort by date, rating, price
- Event detail page with venue info, timing, tags, description, and "More events" section

#### 4.2 Movie Seat Selection (Fully Functional)
- Interactive 12-row x 14-column theater layout (168 seats per movie)
- Three price categories: Front (Rows A-D), Middle (Rows E-H), Rear (Rows I-L)
- Category filter panel with availability counts
- Color-coded seats: grey (available), green (selected/locked by you), red X (booked/locked by others)
- Screen visualization with curved SVG arc
- Smooth scroll-to-focus animation on the recommended category

#### 4.3 Real-Time Seat Locking (Core Feature)
- **Lock on click:** Selecting a seat immediately sends `POST /lock-seats/` to the backend
- **Row-level database lock:** Uses `SELECT FOR UPDATE` to prevent race conditions
- **1-minute hold:** Locks expire automatically after 1 minute
- **Unlock on deselect:** Clicking a selected seat sends `DELETE /lock-seats/{seat_id}`
- **Expired lock cleanup:** `GET /seats/event/{id}` automatically cleans up expired locks
- **3-second polling:** Frontend polls every 3s to reflect other users' locks
- **Auto-deselect:** When a user's own lock expires, the seat is automatically deselected in their UI
- **Conflict handling:** If two users try to lock the same seat, the second gets a 409 Conflict error

#### 4.4 Booking Confirmation
- "Proceed to Pay" re-locks (extends) all selected seats, then confirms the booking
- Seats transition from LOCKED to BOOKED (permanent)
- Success screen shows confirmed seats, total price, and event details

#### 4.5 Session Timer
- 4-minute countdown timer on the booking page
- Visual warning when under 1 minute remaining
- Auto-redirects to homepage when time expires

#### 4.6 Authentication
- Manual implementation (no third-party auth services)
- Sign up with name, email, password (bcrypt hashing)
- Login via modal popup (not a separate page)
- JWT tokens (PyJWT) with Bearer auth
- Auth gate: seat selection requires login (prompted on first click)
- Admin login via separate `/auth` page with admin toggle

#### 4.7 Booking History
- `/bookings` page showing user's past bookings
- Table with booking ID, event name, date, seat numbers, status
- Accessible via "My Bookings" in the user dropdown menu

#### 4.8 Admin Panel
- Dashboard with stats (total events, bookings, revenue, users)
- Venue management (CRUD)
- Seat management per event (block/unblock, force-unlock)
- Booking list with cancellation
- Active lock monitoring
- User list with booking history
- Activity feed

#### 4.9 Sports/Concert/Other Events (UI Only - WIP)
- Stadium layout with SVG ring visualization
- Section-based seat selection with arc geometry
- Category accordion for tier selection
- Ticket quantity selector for general admission events
- These use generated/mock data (not wired to backend booking)

### 5. Technical Implementation

#### 5.1 Seat State Machine

```
AVAILABLE ──(lock)──> LOCKED ──(confirm)──> BOOKED
    ^                    │
    └──(expire/unlock)───┘
```

#### 5.2 Concurrency Strategy
- **Pessimistic locking** via PostgreSQL `SELECT FOR UPDATE`
- Single seat lock per row — no two transactions can lock the same seat simultaneously
- Lock ownership validated on unlock (users can only unlock their own locks)
- Expired lock cleanup runs on every seat fetch request

#### 5.3 Real-Time Updates
- **Polling** (3-second interval) — chosen over WebSockets for simplicity
- Frontend uses `useRef` to avoid resetting the poll interval on seat selection state changes
- `myLockedSeatIds` parameter ensures the current user's locked seats render as "selected" (not "booked")

#### 5.4 Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | React 19 + TypeScript + Vite 6 | Fast dev, type safety |
| Styling | Tailwind CSS + Framer Motion | Rapid UI, smooth animations |
| Backend | FastAPI + SQLAlchemy | Async-ready, auto-docs, ORM |
| Database | PostgreSQL 15 | Row-level locking, ACID |
| Auth | bcrypt + PyJWT | Manual implementation per hackathon rules |
| Infra | Docker Compose | One-command setup |

### 6. Database Schema

| Table | Key Columns |
|-------|-------------|
| `users` | id, name, email, password_hash, role, is_admin |
| `events` | id, title, description, event_type, event_date, venue, city |
| `seats` | id, event_id (FK), seat_number, status (AVAILABLE/LOCKED/BOOKED) |
| `seat_locks` | id, seat_id (FK, unique active), user_id (FK), locked_at, expires_at |
| `bookings` | id, user_id (FK), event_id (FK), status (CONFIRMED/CANCELLED) |
| `booking_seats` | id, booking_id (FK), seat_id (FK) |
| `venues` | id, name, address, city, capacity |

### 7. API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /api/auth/signup | Register new user | - |
| POST | /api/auth/login | Login, get JWT | - |
| POST | /api/auth/admin-login | Admin login | - |
| GET | /api/events/ | List events | - |
| GET | /api/events/{id} | Event details | - |
| GET | /api/seats/event/{id} | Seats + expired lock cleanup | - |
| POST | /api/lock-seats/ | Lock seat (1-min, row lock) | User |
| DELETE | /api/lock-seats/{id} | Unlock seat | User |
| POST | /api/bookings/confirm | Confirm booking | User |
| GET | /api/bookings/me | Booking history | User |
| GET | /api/admin/dashboard | Admin stats | Admin |
| GET | /api/admin/venues | List venues | Admin |
| GET | /api/admin/locks/active | Active locks | Admin |
| GET | /api/admin/users | User list | Admin |

### 8. Booking Flow (End-to-End)

1. User browses events on homepage (filter by category, sort)
2. Clicks an event card -> Event detail page
3. Clicks "Select Seats" -> Auth gate (login if not authenticated)
4. Theater layout loads with real seat data from backend
5. User clicks a seat -> `POST /lock-seats/` -> seat turns green, locked for 1 min
6. Other users see the seat as unavailable (red X) within 3 seconds
7. User can deselect (unlock) or select more seats
8. "Proceed to Pay" -> re-locks to extend, then `POST /bookings/confirm`
9. Seats permanently marked BOOKED -> success screen
10. Booking appears in "My Bookings" history

### 9. Edge Cases Handled

| Scenario | Behaviour |
|----------|-----------|
| Two users click same seat simultaneously | First wins (row lock), second gets 409 |
| User's lock expires (1 min) | Seat auto-deselects in their UI, becomes available |
| Session timer expires (4 min) | User redirected to homepage |
| User refreshes page | Locked seats show as booked (user must re-select) |
| Network error on lock | Error toast shown, seats refreshed |
| User not logged in clicks seat | Auth modal appears |

### 10. Docker Setup

Three-service Docker Compose:
- `db` — PostgreSQL 15 Alpine (port 5433)
- `backend` — FastAPI/Uvicorn (port 8001 -> 8000 internal)
- `frontend` — Vite dev server (port 5174 -> 5173 internal)

Database auto-seeds on first run:
- 10 events with images and metadata
- 168 seats per movie event (A1-L14)
- Admin user (admin/admin)

### 11. What's Not Implemented (Out of Scope)

- Payment integration (booking confirms without payment)
- WebSocket real-time updates (using polling instead)
- Email confirmations
- Dynamic pricing
- Sports/concert backend booking (UI exists, backend not wired)
- Rate limiting
- Redis caching
