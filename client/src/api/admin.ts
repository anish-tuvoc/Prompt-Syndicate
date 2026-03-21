import { api } from "./client";
import type { SeatStatus } from "./seats";

export interface MetricPoint {
  label: string;
  value: number;
}

export interface DashboardMetrics {
  total_events: number;
  total_bookings: number;
  total_revenue: number;
  bookings_per_day: MetricPoint[];
  revenue_trend: MetricPoint[];
}

export interface ActivityItem {
  booking_id: string;
  user_id: string;
  event_id: string;
  status: string;
  created_at: string;
}

export interface VenueSection {
  id: string;
  label: string;
  seat_type: string;
  price: number;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  total_rows: number;
  total_columns: number;
  sections: VenueSection[];
}

export interface AdminSeatView {
  id: string;
  seat_number: string;
  status: SeatStatus;
  is_locked: boolean;
  locked_by: string | null;
  lock_expires_at: string | null;
}

export interface BookingSeatItem {
  seat_id: string;
  seat_number: string;
}

export interface AdminBooking {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  created_at: string;
  payment_status: "SUCCESS" | "FAILED" | "PENDING";
  seats: BookingSeatItem[];
}

export interface ActiveLock {
  seat_id: string;
  user_id: string;
  expires_at: string;
  seconds_remaining: number;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export function getDashboard() {
  return api.get<DashboardMetrics>("/admin/dashboard");
}

export function getActivity(limit = 20) {
  return api.get<ActivityItem[]>(`/admin/activity?limit=${limit}`);
}

export function getVenues() {
  return api.get<Venue[]>("/admin/venues");
}

export function createVenue(payload: Omit<Venue, "id">) {
  return api.post<Venue>("/admin/venues", payload);
}

export function deleteVenue(venueId: string) {
  return api.delete<{ ok: boolean }>(`/admin/venues/${venueId}`);
}

export function getAdminSeatsByEvent(eventId: string) {
  return api.get<AdminSeatView[]>(`/admin/seats/event/${eventId}`);
}

export function forceUnlockSeat(seatId: string) {
  return api.post<{ ok: boolean }>(`/admin/seats/${seatId}/force-unlock`);
}

export function blockSeat(seatId: string) {
  return api.post<{ ok: boolean }>(`/admin/seats/${seatId}/block`);
}

export function getAdminBookings(params: { eventId?: string; date?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.eventId) query.set("event_id", params.eventId);
  if (params.date) query.set("date", params.date);
  if (params.status) query.set("status", params.status);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return api.get<AdminBooking[]>(`/admin/bookings${suffix}`);
}

export function cancelBookingByAdmin(bookingId: string) {
  return api.post<{ ok: boolean }>(`/admin/bookings/${bookingId}/cancel`);
}

export function getActiveLocks() {
  return api.get<ActiveLock[]>("/admin/locks/active");
}

export function getAdminUsers() {
  return api.get<AdminUser[]>("/admin/users");
}

export function getUserBookings(userId: string) {
  return api.get<AdminBooking[]>(`/admin/users/${userId}/bookings`);
}
