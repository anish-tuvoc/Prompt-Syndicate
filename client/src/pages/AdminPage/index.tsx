import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  blockSeat,
  cancelBookingByAdmin,
  createVenue,
  deleteVenue,
  forceUnlockSeat,
  getActiveLocks,
  getActivity,
  getAdminBookings,
  getAdminSeatsByEvent,
  getAdminUsers,
  getDashboard,
  getUserBookings,
  getVenues,
  type ActiveLock,
  type AdminBooking,
  type AdminSeatView,
  type AdminUser,
  type DashboardMetrics,
  type Venue,
} from "../../api/admin";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  fetchEventsFiltered,
  updateEvent,
  type EventPayload,
} from "../../api/events";
import type { EventData } from "../../data/events";

type TabKey = "dashboard" | "events" | "venues" | "seats" | "bookings" | "locks" | "users";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "events", label: "Event Management" },
  { key: "venues", label: "Venue & Layout" },
  { key: "seats", label: "Seat Management" },
  { key: "bookings", label: "Bookings" },
  { key: "locks", label: "Lock Monitoring" },
  { key: "users", label: "Users" },
];

const defaultEventPayload: EventPayload = {
  title: "",
  description: "",
  date: "",
  time: "",
  venue: "",
  image: "",
  category: "Concert",
  location: "",
  event_type: "event",
  price: 0,
  total_seats: 40,
  price_categories: [{ id: "general", label: "General", price: 0, color: "#22C55E" }],
};

export function AdminPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<{ booking_id: string; created_at: string; status: string }[]>([]);

  const [events, setEvents] = useState<EventData[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [eventFilters, setEventFilters] = useState({ q: "", venue: "" });
  const [eventForm, setEventForm] = useState<EventPayload>(defaultEventPayload);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [seatEventId, setSeatEventId] = useState("");
  const [seatMap, setSeatMap] = useState<AdminSeatView[]>([]);

  const [bookingFilters, setBookingFilters] = useState({ eventId: "", date: "", status: "" });
  const [bookings, setBookings] = useState<AdminBooking[]>([]);

  const [locks, setLocks] = useState<ActiveLock[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserBookings, setSelectedUserBookings] = useState<AdminBooking[]>([]);

  const [venueForm, setVenueForm] = useState({
    name: "",
    location: "",
    total_rows: 10,
    total_columns: 12,
  });

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([loadDashboard(), loadEvents(), loadVenues()]);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || activeTab !== "locks") return;
    loadLocks();
    const id = window.setInterval(loadLocks, 3000);
    return () => window.clearInterval(id);
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (!isAdmin || activeTab !== "dashboard") return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/admin/ws/activity`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          dashboard?: DashboardMetrics;
          activity?: { booking_id: string; created_at: string; status: string }[];
        };
        if (data.dashboard) setDashboard(data.dashboard);
        if (data.activity) setActivity(data.activity);
      } catch {
        // keep polling fallback data if message parsing fails
      }
    };
    ws.onerror = () => {
      void loadDashboard();
    };
    return () => {
      ws.close();
    };
  }, [activeTab, isAdmin]);

  async function loadDashboard() {
    try {
      const [metrics, items] = await Promise.all([getDashboard(), getActivity(20)]);
      setDashboard(metrics);
      setActivity(items.map((item) => ({ booking_id: item.booking_id, created_at: item.created_at, status: item.status })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading dashboard");
    }
  }

  async function loadEvents() {
    try {
      setEvents(await fetchEvents());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading events");
    }
  }

  async function loadVenues() {
    try {
      setVenues(await getVenues());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading venues");
    }
  }

  async function loadSeatMap() {
    if (!seatEventId) return;
    try {
      setSeatMap(await getAdminSeatsByEvent(seatEventId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading seat map");
    }
  }

  async function loadBookings() {
    try {
      setBookings(
        await getAdminBookings({
          eventId: bookingFilters.eventId || undefined,
          date: bookingFilters.date || undefined,
          status: bookingFilters.status || undefined,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading bookings");
    }
  }

  async function loadLocks() {
    try {
      setLocks(await getActiveLocks());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading locks");
    }
  }

  async function loadUsers() {
    try {
      setUsers(await getAdminUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading users");
    }
  }

  async function submitEventForm() {
    try {
      if (editingEventId) {
        await updateEvent(editingEventId, eventForm);
      } else {
        await createEvent(eventForm);
      }
      setEventForm(defaultEventPayload);
      setEditingEventId(null);
      await loadEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed saving event");
    }
  }

  async function applyEventFilters() {
    try {
      if (!eventFilters.q && !eventFilters.venue) {
        setEvents(await fetchEvents());
        return;
      }
      setEvents(await fetchEventsFiltered({ q: eventFilters.q || undefined, venue: eventFilters.venue || undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed filtering events");
    }
  }

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId]);

  if (!isAdmin) return <Navigate to="/auth" replace />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage operations across events, venues, bookings, locks, and users.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setError("");
              setActiveTab(tab.key);
              if (tab.key === "bookings") void loadBookings();
              if (tab.key === "users") void loadUsers();
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${activeTab === tab.key ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <section className="mt-6 space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Total Events</p>
              <p className="text-2xl font-semibold">{dashboard?.total_events ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Total Bookings</p>
              <p className="text-2xl font-semibold">{dashboard?.total_bookings ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Revenue</p>
              <p className="text-2xl font-semibold">INR {Math.round(dashboard?.total_revenue ?? 0)}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-2 text-sm font-medium">Bookings Per Day</p>
              {dashboard?.bookings_per_day.map((point) => (
                <div key={point.label} className="mb-2">
                  <div className="flex justify-between text-xs"><span>{point.label}</span><span>{point.value}</span></div>
                  <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded bg-brand-500" style={{ width: `${Math.min(100, point.value * 10)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-2 text-sm font-medium">Revenue Trend</p>
              {dashboard?.revenue_trend.map((point) => (
                <div key={point.label} className="mb-2">
                  <div className="flex justify-between text-xs"><span>{point.label}</span><span>{Math.round(point.value)}</span></div>
                  <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded bg-emerald-500" style={{ width: `${Math.min(100, point.value / 200)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-sm font-medium">Live Booking Activity</p>
            <div className="space-y-2 text-sm">
              {activity.map((item) => (
                <div key={item.booking_id} className="flex justify-between rounded bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <span className="font-mono text-xs">{item.booking_id.slice(0, 8)}</span>
                  <span>{item.status}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "events" && (
        <section className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Search event title" value={eventFilters.q} onChange={(e) => setEventFilters((p) => ({ ...p, q: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Venue filter" value={eventFilters.venue} onChange={(e) => setEventFilters((p) => ({ ...p, venue: e.target.value }))} />
            <button type="button" onClick={applyEventFilters} className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white">Apply Filters</button>
            <button type="button" onClick={loadEvents} className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">Reset</button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Event name" value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Poster URL" value={eventForm.image ?? ""} onChange={(e) => setEventForm((p) => ({ ...p, image: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Description" value={eventForm.description ?? ""} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Venue" value={eventForm.venue ?? ""} onChange={(e) => setEventForm((p) => ({ ...p, venue: e.target.value }))} />
            <input type="date" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Time" value={eventForm.time ?? ""} onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))} />
            <input type="number" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Base price" value={eventForm.price ?? 0} onChange={(e) => setEventForm((p) => ({ ...p, price: Number(e.target.value) }))} />
            <input type="number" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Total seats" value={eventForm.total_seats ?? 0} onChange={(e) => setEventForm((p) => ({ ...p, total_seats: Number(e.target.value) }))} />
          </div>
          <button type="button" onClick={submitEventForm} className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white">{editingEventId ? "Update Event" : "Create Event"}</button>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Venue</th><th className="px-3 py-2 text-left">Actions</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">{event.title}</td>
                    <td className="px-3 py-2">{event.date} {event.time}</td>
                    <td className="px-3 py-2">{event.venue}</td>
                    <td className="px-3 py-2">
                      <button type="button" className="mr-2 text-brand-600" onClick={() => { setEditingEventId(event.id); setEventForm({ title: event.title, image: event.image, rating: event.rating, description: event.description, location: event.location, venue: event.venue, date: event.date, time: event.time, category: event.category, featured: event.featured, price: event.price, duration: event.duration, language: event.language, tags: event.tags, total_seats: event.totalSeats, event_type: event.type, price_categories: event.priceCategories }); }}>Edit</button>
                      <button type="button" className="text-red-600" onClick={async () => { await deleteEvent(event.id); await loadEvents(); }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "venues" && (
        <section className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Name" value={venueForm.name} onChange={(e) => setVenueForm((p) => ({ ...p, name: e.target.value }))} />
            <input className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Location" value={venueForm.location} onChange={(e) => setVenueForm((p) => ({ ...p, location: e.target.value }))} />
            <input type="number" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Rows" value={venueForm.total_rows} onChange={(e) => setVenueForm((p) => ({ ...p, total_rows: Number(e.target.value) }))} />
            <input type="number" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Columns" value={venueForm.total_columns} onChange={(e) => setVenueForm((p) => ({ ...p, total_columns: Number(e.target.value) }))} />
          </div>
          <button type="button" onClick={async () => { await createVenue({ ...venueForm, sections: [{ id: "regular", label: "Regular", seat_type: "REGULAR", price: 0 }] }); setVenueForm({ name: "", location: "", total_rows: 10, total_columns: 12 }); await loadVenues(); }} className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white">Create Venue</button>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Location</th><th className="px-3 py-2 text-left">Grid</th><th className="px-3 py-2 text-left">Actions</th></tr></thead>
              <tbody>
                {venues.map((venue) => (
                  <tr key={venue.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">{venue.name}</td>
                    <td className="px-3 py-2">{venue.location}</td>
                    <td className="px-3 py-2">{venue.total_rows} x {venue.total_columns}</td>
                    <td className="px-3 py-2"><button type="button" className="text-red-600" onClick={async () => { await deleteVenue(venue.id); await loadVenues(); }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "seats" && (
        <section className="mt-6 space-y-4">
          <div className="flex gap-2">
            <select className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={seatEventId} onChange={(e) => setSeatEventId(e.target.value)}>
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
            <button type="button" onClick={loadSeatMap} className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white">Load Seat Map</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {seatMap.map((seat) => (
              <div key={seat.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="font-medium">{seat.seat_number}</p>
                <p className="text-xs text-slate-500">State: {seat.status}{seat.is_locked ? " (LOCKED)" : ""}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white" onClick={async () => { await forceUnlockSeat(seat.id); await loadSeatMap(); }}>Force Unlock</button>
                  <button type="button" className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white" onClick={async () => { await blockSeat(seat.id); await loadSeatMap(); }}>Block</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "bookings" && (
        <section className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <select className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={bookingFilters.eventId} onChange={(e) => setBookingFilters((p) => ({ ...p, eventId: e.target.value }))}>
              <option value="">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
            <input type="date" className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={bookingFilters.date} onChange={(e) => setBookingFilters((p) => ({ ...p, date: e.target.value }))} />
            <select className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={bookingFilters.status} onChange={(e) => setBookingFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="PENDING">PENDING</option>
            </select>
            <button type="button" onClick={loadBookings} className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white">Apply</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="px-3 py-2 text-left">Booking</th><th className="px-3 py-2 text-left">User</th><th className="px-3 py-2 text-left">Seats</th><th className="px-3 py-2 text-left">Payment</th><th className="px-3 py-2 text-left">Action</th></tr></thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">{booking.id.slice(0, 8)} ({booking.status})</td>
                    <td className="px-3 py-2">{booking.user_id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{booking.seats.map((seat) => seat.seat_number).join(", ") || "-"}</td>
                    <td className="px-3 py-2">{booking.payment_status}</td>
                    <td className="px-3 py-2">
                      <button type="button" className="text-red-600" onClick={async () => { await cancelBookingByAdmin(booking.id); await loadBookings(); }}>Cancel Booking</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "locks" && (
        <section className="mt-6">
          <p className="mb-3 text-sm text-slate-500">Auto-refresh every 3 seconds</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="px-3 py-2 text-left">Seat ID</th><th className="px-3 py-2 text-left">User ID</th><th className="px-3 py-2 text-left">Expiry</th><th className="px-3 py-2 text-left">Countdown</th></tr></thead>
              <tbody>
                {locks.map((lock) => (
                  <tr key={lock.seat_id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 font-mono text-xs">{lock.seat_id}</td>
                    <td className="px-3 py-2 font-mono text-xs">{lock.user_id}</td>
                    <td className="px-3 py-2">{new Date(lock.expires_at).toLocaleTimeString()}</td>
                    <td className="px-3 py-2">{lock.seconds_remaining}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "users" && (
        <section className="mt-6 space-y-4">
          <div className="flex gap-2">
            <select className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.email}</option>
              ))}
            </select>
            <button type="button" onClick={async () => { if (!selectedUserId) return; setSelectedUserBookings(await getUserBookings(selectedUserId)); }} className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white">View Booking History</button>
          </div>
          {selectedUser && (
            <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p><span className="font-medium">User:</span> {selectedUser.email}</p>
              <p><span className="font-medium">Joined:</span> {new Date(selectedUser.created_at).toLocaleString()}</p>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800"><tr><th className="px-3 py-2 text-left">Booking</th><th className="px-3 py-2 text-left">Event</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Seats</th></tr></thead>
              <tbody>
                {selectedUserBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">{booking.id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{booking.event_id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{booking.status}</td>
                    <td className="px-3 py-2">{booking.seats.map((seat) => seat.seat_number).join(", ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
