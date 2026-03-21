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
