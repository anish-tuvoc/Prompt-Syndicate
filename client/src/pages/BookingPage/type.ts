export type SeatStatus = "available" | "selected" | "booked";
export type SeatSection = "front" | "middle" | "rear";
export type StadiumTier = "vip" | "premium" | "standard" | "budget";

export interface MovieSeat {
  id: string;
  row: string;
  col: number;
  section: SeatSection;
  status: SeatStatus;
  price: number;
}

export interface MovieRow {
  label: string;
  section: SeatSection;
  seats: MovieSeat[];
}

export interface StadiumBlock {
  id: string;
  label: string;
  tier: StadiumTier;
  priceId: string;
  price: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  totalSeats: number;
  availableSeats: number;
}

export interface EventTicketCategory {
  id: string;
  label: string;
  description: string;
  price: number;
  quantity: number;
  maxPerBooking: number;
  available: number;
}
