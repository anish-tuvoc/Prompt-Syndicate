import { api } from './client';

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export interface SeatResponse {
  id: string;
  event_id: string;
  seat_number: string;
  status: SeatStatus;
}

export interface LockResponse {
  id: string;
  seat_id: string;
  user_id: string;
  locked_at: string;
  expires_at: string;
}

export function getEventSeats(eventId: string) {
  return api.get<SeatResponse[]>(`/seats/event/${eventId}`);
}

export function lockSeat(seatId: string) {
  return api.post<LockResponse>('/lock-seats/', { seat_id: seatId });
}

export function unlockSeat(seatId: string) {
  return api.delete<{ ok: boolean }>(`/lock-seats/${seatId}`);
}
