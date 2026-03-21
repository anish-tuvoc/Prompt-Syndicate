import { api } from './client';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface BookingResponse {
  id: string;
  user_id: string;
  event_id: string;
  status: BookingStatus;
  created_at: string;
}

export function confirmBooking(eventId: string, seatIds: string[]) {
  return api.post<BookingResponse>('/bookings/confirm', {
    event_id: eventId,
    seat_ids: seatIds,
  });
}

export interface UserBookingSeatItem {
  seat_id: string;
  seat_number: string;
}

export interface UserBookingItem {
  id: string;
  event_id: string;
  status: BookingStatus;
  created_at: string;
  seats: UserBookingSeatItem[];
}

export function getMyBookings() {
  return api.get<UserBookingItem[]>('/bookings/me');
}
