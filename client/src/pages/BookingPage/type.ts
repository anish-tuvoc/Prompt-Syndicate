export type SeatStatus = "available" | "selected" | "booked";
export type StadiumTier = "vip" | "premium" | "standard" | "budget";

// ── Individual seat ───────────────────────────────────────────────────────
export interface SectionSeat {
  id: string;
  rowLabel: string; // "A".."L" for movie, "A".."H" for sports section
  colIndex: number;
  status: SeatStatus;
  price: number;
  categoryId?: string; // used by movie category-filtering
}

// ── Full movie theater row (12 rows A–L generated upfront) ────────────────
export interface FullMovieRow {
  rowLabel: string;
  categoryId: string; // "classic" | "prime" | "prime_plus" | "recliner"
  price: number;
  seats: SectionSeat[];
}

// ── Sports section (simplified — row layout is handled by StadiumSectionView) ──
export interface SectionData {
  id: string;
  label: string;      // "Block V1"
  shortLabel: string; // "V1"
  categoryId: string; // "vip" | "premium" | "standard" | "budget"
  eventType: "sports";
  availablePercent: number; // 0..1
  /** Midpoint angle of this block on the stadium ring (degrees, 0 = top, clockwise) */
  angle: number;
}

// ── Stadium block (for the SVG overview map) ──────────────────────────────
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

// ── Event / concert ticket categories ─────────────────────────────────────
export interface EventTicketCategory {
  id: string;
  label: string;
  description: string;
  price: number;
  quantity: number;
  maxPerBooking: number;
  available: number;
}
