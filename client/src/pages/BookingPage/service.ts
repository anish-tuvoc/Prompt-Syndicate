import type { EventData } from "../../data/events";
import type { MovieRow, StadiumBlock, StadiumTier, EventTicketCategory } from "./type";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const SEATS_PER_ROW = 14;
const BOOKED_RATE = 0.22;

function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  return str.split("").reduce((h, c) => (((h << 5) - h) + c.charCodeAt(0)) | 0, 5381);
}

function sectionForRow(row: string): "front" | "middle" | "rear" {
  const i = ROWS.indexOf(row);
  if (i <= 3) return "front";
  if (i <= 7) return "middle";
  return "rear";
}

export function generateMovieRows(event: EventData): MovieRow[] {
  const rand = seededRandom(hashString(event.id));
  const getPriceForSection = (section: string) =>
    event.priceCategories.find((p) => p.id === section)?.price ?? 200;

  return ROWS.map((rowLabel) => {
    const section = sectionForRow(rowLabel);
    const price = getPriceForSection(section);
    return {
      label: rowLabel,
      section,
      seats: Array.from({ length: SEATS_PER_ROW }, (_, i) => ({
        id: `${rowLabel}${i + 1}`,
        row: rowLabel,
        col: i + 1,
        section,
        status: rand() < BOOKED_RATE ? "booked" : "available",
        price,
      })),
    };
  });
}

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
    const end = start + span;
    const total = 120 + Math.floor(rand() * 80);
    const available = Math.floor(total * (0.4 + rand() * 0.5));
    return {
      id: `${prefix}${i + 1}`,
      label: `${prefix}${i + 1}`,
      tier,
      priceId,
      price,
      startAngle: start,
      endAngle: end,
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

const TICKET_DESCRIPTIONS: Record<string, string> = {
  general:  "Standard entry with excellent sightlines",
  vip:      "Dedicated VIP zone with premium amenities",
  premium:  "Best seats with exclusive hospitality",
  front:    "Close to stage / screen",
  middle:   "Perfect central position",
  rear:     "Great elevated view",
  budget:   "General stand — great atmosphere",
  standard: "Comfortable numbered seating",
};

export function generateTicketCategories(event: EventData): EventTicketCategory[] {
  const rand = seededRandom(hashString(event.id));
  return event.priceCategories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    description: TICKET_DESCRIPTIONS[cat.id] ?? "Great experience awaits",
    price: cat.price,
    quantity: 0,
    maxPerBooking: 8,
    available: 30 + Math.floor(rand() * 70),
  }));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
