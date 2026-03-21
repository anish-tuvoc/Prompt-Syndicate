import { motion } from "framer-motion";
import type { SectionData, SectionSeat } from "../../pages/BookingPage/type";

// ── SVG canvas ─────────────────────────────────────────────────────────────
const SVG_W = 440;
const SVG_H = 320;
const ARC_CX = SVG_W / 2; // 220

// Arc center is BELOW the SVG — this is the "pitch direction".
// Rows positioned on arcs around this center:
//   inner row (A) has smallest R → sits at BOTTOM of SVG (closest to pitch)
//   outer row (H) has largest  R → sits at TOP of SVG   (farthest from pitch)
const ARC_CY = SVG_H + 120; // 440 — 120px below the SVG bottom

// ── Seat dimensions ────────────────────────────────────────────────────────
const SEAT_W = 14;
const SEAT_H = 11;
const SEAT_RX = 2;

// ── Row configuration (A = inner/bottom, H = outer/top) ───────────────────
// R:         arc radius (130 inner → 390 outer)
// seatCount: seats per row (8 inner → 15 outer) — WIDER outer rows
// theta:     half-angle in radians — derived from target physical width
interface RowConfig {
  label: string;
  R: number;
  seatCount: number;
  theta: number; // radians
}

const ROW_CONFIGS: RowConfig[] = (() => {
  const configs: RowConfig[] = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7; // 0 (inner) → 1 (outer)
    const R = 130 + t * 260; // 130 → 390
    const seatCount = 8 + i; // 8 → 15

    // Target physical half-width: 58px (inner row A) → 158px (outer row H)
    // Outer rows span more of the SVG width — realistic stadium geometry
    const targetHalfWidth = 58 + t * 100;
    const theta = Math.asin(Math.min(0.97, targetHalfWidth / R));

    configs.push({
      label: String.fromCharCode(65 + i), // A–H
      R,
      seatCount,
      theta,
    });
  }
  return configs;
})();

// ── Arc seat position ──────────────────────────────────────────────────────
// Seats are placed along the arc from −theta to +theta.
// The EDGE seats are lower on screen (closer to pitch at bottom) — "∩" curve.
// This is geometrically correct: the ends of each stadium row are physically
// closer to the pitch line than the center seat.
function seatPos(cfg: RowConfig, seatIdx: number) {
  const { R, seatCount, theta } = cfg;
  const angle =
    seatCount > 1 ? -theta + (seatIdx / (seatCount - 1)) * 2 * theta : 0;
  return {
    x: ARC_CX + R * Math.sin(angle) - SEAT_W / 2,
    y: ARC_CY - R * Math.cos(angle) - SEAT_H / 2,
  };
}

// Row label x position (to the left of the leftmost seat)
function rowLabelX(cfg: RowConfig): number {
  return ARC_CX - cfg.R * Math.sin(cfg.theta) - SEAT_W / 2 - 14;
}

// ── Component ──────────────────────────────────────────────────────────────
interface StadiumSectionViewProps {
  section: SectionData;
  seats: SectionSeat[];
  selectedSeatIds: Set<string>;
  onToggleSeat: (id: string) => void;
}

export function StadiumSectionView({
  section,
  seats,
  selectedSeatIds,
  onToggleSeat,
}: StadiumSectionViewProps) {
  // Group seats by row label
  const seatsByRow = new Map<string, SectionSeat[]>();
  for (const s of seats) {
    const row = seatsByRow.get(s.rowLabel) ?? [];
    row.push(s);
    seatsByRow.set(s.rowLabel, row);
  }

  const totalAvail = seats.filter((s) => s.status === "available").length;
  const totalSelected = seats.filter((s) => selectedSeatIds.has(s.id)).length;
  const totalBooked = seats.filter((s) => s.status === "booked").length;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-sm font-bold text-white">{section.label}</h3>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Row A = closest to pitch · {totalAvail} available · {totalSelected} selected
        </p>
      </div>

      {/* SVG seat map */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          className="mx-auto block overflow-visible"
        >
          <defs>
            {/* Pitch glow gradient */}
            <linearGradient id="ssv-pitchGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.65" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            {/* Selected seat glow */}
            <filter id="ssv-glow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Seat rows (rendered back-to-front: H first, A last) ─────── */}
          {[...ROW_CONFIGS].reverse().map((cfg, revIdx) => {
            const rowSeats = seatsByRow.get(cfg.label) ?? [];
            const centerY = ARC_CY - cfg.R;
            const labelX = rowLabelX(cfg);

            return (
              <motion.g
                key={cfg.label}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: revIdx * 0.05,
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Row label */}
                <text
                  x={labelX}
                  y={centerY + SEAT_H / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="rgba(148,163,184,0.65)"
                >
                  {cfg.label}
                </text>

                {/* Seats */}
                {Array.from({ length: cfg.seatCount }, (_, j) => {
                  const pos = seatPos(cfg, j);
                  const seat = rowSeats[j];
                  if (!seat) return null;

                  const isSelected = selectedSeatIds.has(seat.id);
                  const isBooked = seat.status === "booked";

                  return (
                    <motion.rect
                      key={seat.id}
                      x={pos.x}
                      y={pos.y}
                      width={SEAT_W}
                      height={SEAT_H}
                      rx={SEAT_RX}
                      initial={false}
                      animate={{
                        fill: isBooked
                          ? "#1e1b1b"
                          : isSelected
                          ? "#10B981"
                          : "#374151",
                        opacity: isBooked ? 0.45 : 1,
                      }}
                      whileHover={
                        !isBooked
                          ? { scale: 1.4, fill: isSelected ? "#34D399" : "#9CA3AF" }
                          : {}
                      }
                      whileTap={!isBooked ? { scale: 0.88 } : {}}
                      transition={{ duration: 0.14 }}
                      stroke={
                        isBooked
                          ? "#3B1212"
                          : isSelected
                          ? "#34D399"
                          : "#4B5563"
                      }
                      strokeWidth={isSelected ? 1.5 : 0.7}
                      filter={isSelected ? "url(#ssv-glow)" : undefined}
                      style={{
                        cursor: isBooked ? "not-allowed" : "pointer",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      }}
                      onClick={() => !isBooked && onToggleSeat(seat.id)}
                    >
                      <title>
                        {isBooked
                          ? "Seat booked"
                          : `Row ${cfg.label}, Seat ${j + 1} — ₹${seat.price}`}
                      </title>
                    </motion.rect>
                  );
                })}
              </motion.g>
            );
          })}

          {/* ── Pitch indicator at BOTTOM — always fixed, consistent across all blocks ── */}
          {/* Row A (inner, at bottom) is visually just above this pitch indicator */}
          <rect
            x={80}
            y={SVG_H - 20}
            width={SVG_W - 160}
            height={7}
            rx={3.5}
            fill="url(#ssv-pitchGrad)"
          />
          <text
            x={ARC_CX}
            y={SVG_H - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fontWeight="800"
            fill="rgba(52,211,153,0.65)"
            letterSpacing="2"
          >
            ← PITCH / GROUND →
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-3.5 rounded-[2px]"
            style={{ background: "#374151", border: "0.7px solid #4B5563" }}
          />
          Available ({totalAvail})
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-3.5 rounded-[2px]"
            style={{
              background: "#10B981",
              border: "1px solid #34D399",
              boxShadow: "0 0 5px rgba(52,211,153,0.45)",
            }}
          />
          Selected ({totalSelected})
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-3.5 rounded-[2px] opacity-45"
            style={{ background: "#1e1b1b", border: "0.7px solid #3B1212" }}
          />
          Booked ({totalBooked})
        </span>
      </div>
    </div>
  );
}
