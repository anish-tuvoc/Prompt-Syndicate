import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyBookings, type UserBookingItem } from "../../api/bookings";
import { useAuth } from "../../context/useAuth";
import { fetchEvents, type EventData } from "../../api/events";

export function BookingHistoryPage() {
  const { isLoggedIn } = useAuth();
  const [bookings, setBookings] = useState<UserBookingItem[]>([]);
  const [eventsById, setEventsById] = useState<Record<string, EventData>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    async function load() {
      try {
        setLoading(true);
        const [items, events] = await Promise.all([getMyBookings(), fetchEvents()]);
        setBookings(items);
        const map: Record<string, EventData> = {};
        for (const ev of events) map[ev.id] = ev;
        setEventsById(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed loading bookings");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [isLoggedIn]);

  if (!isLoggedIn) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Bookings</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View your booking history across events.</p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No bookings yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left">Booking</th>
                <th className="px-3 py-2 text-left">Event</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Seats</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const ev = eventsById[b.event_id];
                return (
                  <tr key={b.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 font-mono text-xs">{b.id.slice(0, 8)}</td>
                    <td className="px-3 py-2">
                      {ev ? (
                        <span className="font-medium">{ev.title}</span>
                      ) : (
                        <span className="text-slate-500">{b.event_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{b.seats.map((s) => s.seat_number).join(", ") || "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : b.status === "CANCELLED"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

