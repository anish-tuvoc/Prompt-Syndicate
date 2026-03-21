import type { EventData, PriceCategory } from "../../data/events";
import type {
  FullMovieRow,
  SectionData,
  SectionSeat,
  StadiumBlock,
  StadiumTier,
  EventTicketCategory,
} from "./type";

// ── Seeded PRNG ───────────────────────────────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  return str
    .split("")
    .reduce((h, c) => (((h << 5) - h) + c.charCodeAt(0)) | 0, 5381);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Movie: full theater (12 rows A–L, 4 categories) ──────────────────────
// Rows A–C = Classic (front rows, cheapest)
// Rows D–G = Prime (center rows, mid-price) ← auto-focus target
// Rows H–J = Prime Plus (upper-middle)
// Rows K–L = Recliner (top, most expensive)
export const MOVIE_ROW_MAP: Record<string, string[]> = {
  classic:    ["A", "B", "C"],
  prime:      ["D", "E", "F", "G"],
  prime_plus: ["H", "I", "J"],
  recliner:   ["K", "L"],
};

export function generateFullMovieRows(event: EventData): FullMovieRow[] {
  const rows: FullMovieRow[] = [];
  for (const cat of event.priceCategories) {
    const rowLabels = MOVIE_ROW_MAP[cat.id] ?? [];
    for (const rowLabel of rowLabels) {
      const rand = seededRandom(hashString(event.id + "mvrow" + rowLabel));
      const seats: SectionSeat[] = [];
      for (let col = 1; col <= 14; col++) {
        seats.push({
          id: `${event.id}-mv-${rowLabel}-${col}`,
          rowLabel,
          colIndex: col,
          status: rand() < 0.22 ? "booked" : "available",
          price: cat.price,
          categoryId: cat.id,
        });
      }
      rows.push({ rowLabel, categoryId: cat.id, price: cat.price, seats });
    }
  }
  return rows;
}

// ── Sports: simplified section data from blocks ───────────────────────────
export function generateSportsSections(blocks: StadiumBlock[]): SectionData[] {
  return blocks.map((block) => ({
    id: block.id,
    label: `Block ${block.label}`,
    shortLabel: block.label,
    categoryId: block.priceId,
    eventType: "sports" as const,
    availablePercent: block.availableSeats / block.totalSeats,
  }));
}

// ── Sports: arc seat layout — variable seats per row (8 inner → 15 outer) ─
// Matches the ROW_CONFIGS arc geometry in StadiumSectionView.tsx
const ARC_SEATS_PER_ROW = [8, 9, 10, 11, 12, 13, 14, 15]; // rows A → H

export function generateSectionSeats(
  section: SectionData,
  price: number,
  eventId: string,
): SectionSeat[] {
  const rand = seededRandom(hashString(eventId + section.id));
  const seats: SectionSeat[] = [];

  ARC_SEATS_PER_ROW.forEach((count, rowIdx) => {
    const rowLabel = String.fromCharCode(65 + rowIdx); // A, B, ..., H
    for (let col = 1; col <= count; col++) {
      seats.push({
        id: `${section.id}-${rowLabel}-${col}`,
        rowLabel,
        colIndex: col,
        status: rand() < 0.2 ? "booked" : "available",
        price,
        categoryId: section.categoryId,
      });
    }
  });

  return seats; // total: 8+9+10+11+12+13+14+15 = 96 seats
}

// ── Stadium block generation ──────────────────────────────────────────────
const BLOCK_GAP = 3;

function buildRing(
  count: number,
  innerR: number,
  outerR: number,
  tier: StadiumTier,
  priceId: string,
  price: number,
  prefix: string,
  rand: () => number,
): StadiumBlock[] {
  const step = 360 / count;
  const span = step - BLOCK_GAP;
  return Array.from({ length: count }, (_, i) => {
    const start = i * step + BLOCK_GAP / 2;
    const total = 96; // matches arc seat count
    const available = Math.floor(total * (0.4 + rand() * 0.5));
    return {
      id: `${prefix}${i + 1}`,
      label: `${prefix}${i + 1}`,
      tier,
      priceId,
      price,
      startAngle: start,
      endAngle: start + span,
      innerRadius: innerR,
      outerRadius: outerR,
      totalSeats: total,
      availableSeats: available,
    };
  });
}

export function generateStadiumBlocks(event: EventData): StadiumBlock[] {
  const rand = seededRandom(hashString(event.id));
  const getPrice = (id: string) =>
    event.priceCategories.find((p) => p.id === id)?.price ?? 999;
  return [
    ...buildRing(6,  58,  90,  "vip",      "vip",      getPrice("vip"),      "V", rand),
    ...buildRing(8,  98,  130, "premium",  "premium",  getPrice("premium"),  "P", rand),
    ...buildRing(10, 138, 163, "standard", "standard", getPrice("standard"), "S", rand),
    ...buildRing(10, 168, 188, "budget",   "budget",   getPrice("budget"),   "G", rand),
  ];
}

// ── Event / concert ticket categories ─────────────────────────────────────
const TICKET_DESC: Record<string, string> = {
  general:  "Standard entry with excellent sightlines",
  vip:      "Dedicated VIP zone with premium amenities",
  premium:  "Best seats with exclusive hospitality",
  budget:   "General stand — great atmosphere",
  standard: "Comfortable numbered seating",
};

export function generateTicketCategories(event: EventData): EventTicketCategory[] {
  const rand = seededRandom(hashString(event.id));
  return event.priceCategories.map((cat: PriceCategory) => ({
    id: cat.id,
    label: cat.label,
    description: TICKET_DESC[cat.id] ?? "Great experience awaits",
    price: cat.price,
    quantity: 0,
    maxPerBooking: 8,
    available: 30 + Math.floor(rand() * 70),
  }));
}
