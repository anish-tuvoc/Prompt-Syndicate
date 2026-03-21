import { motion } from "framer-motion";
import type { SectionData, SectionSeat } from "../../pages/BookingPage/type";

// ── Polar layout — seats arc around the pitch (centre) ───────────────────────
//
//  • Pitch sits at the exact SVG centre (CX, CY).
//  • Rows A–H are concentric circular arcs at increasing radii from the pitch.
//  • Seats are positioned at their TRUE angular location on the stadium ring
//    (blockAngle = midpoint of the block on the ring, 0°=top, clockwise).
//  • A fixed 72° visual span is used so seats are always comfortably spaced.
//  • Row labels are placed just past the clockwise edge of each row's arc.
//  • The mini-compass shows "you are here" with an arrow pointing to the pitch.

const SVG_SIZE = 560;
const CX = SVG_SIZE / 2; // 280
const CY = SVG_SIZE / 2; // 280

const PITCH_R = 52; // green pitch circle radius
const OUTER_WALL_R = 243; // faint outer boundary ring (25px tighter)

const R_INNER = 110; // Row A radius (closest to pitch)
const R_OUTER = 224; // Row H radius (farthest from pitch)

// Fixed visual angular span — independent of actual block width.
// 72° gives comfortable seat spacing for all tier types.
const VIEW_HALF_DEG = 36;

const ROW_SEAT_COUNTS = [8, 9, 10, 11, 12, 13, 14, 15]; // Row A → H
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// ── Helpers ───────────────────────────────────────────────────────────────────

// Clock-degrees (0=top, CW) → SVG math radians
function toRad(clockDeg: number): number {
  return ((clockDeg - 90) * Math.PI) / 180;
}

function rowRadius(rowIdx: number): number {
  return R_INNER + (rowIdx / 7) * (R_OUTER - R_INNER); // 92 → 202
}

function seatCircleR(rowIdx: number): number {
  return 4.5 + (rowIdx / 7) * 2; // 4.5 → 6.5 px
}

// (x, y) for a seat at the given row and seat index
function polarPos(
  rowIdx: number,
  seatIdx: number,
  seatCount: number,
  blockAngle: number,
) {
  const R = rowRadius(rowIdx);
  const startClk = blockAngle - VIEW_HALF_DEG;
  const clkAngle =
    seatCount > 1
      ? startClk + (seatIdx / (seatCount - 1)) * (2 * VIEW_HALF_DEG)
      : blockAngle;
  const r = toRad(clkAngle);
  return { x: CX + R * Math.cos(r), y: CY + R * Math.sin(r) };
}

// SVG arc path (clockwise, single radius)
function arcPath(R: number, startClk: number, endClk: number): string {
  const s = toRad(startClk),
    e = toRad(endClk);
  const large = endClk - startClk > 180 ? 1 : 0;
  const x1 = (CX + R * Math.cos(s)).toFixed(1);
  const y1 = (CY + R * Math.sin(s)).toFixed(1);
  const x2 = (CX + R * Math.cos(e)).toFixed(1);
  const y2 = (CY + R * Math.sin(e)).toFixed(1);
  return `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2}`;
}

// Filled sector (annular wedge) between two radii
function sectorPath(
  innerR: number,
  outerR: number,
  startClk: number,
  endClk: number,
): string {
  const s = toRad(startClk),
    e = toRad(endClk);
  const large = endClk - startClk > 180 ? 1 : 0;
  const ix1 = (CX + innerR * Math.cos(s)).toFixed(1);
  const iy1 = (CY + innerR * Math.sin(s)).toFixed(1);
  const ix2 = (CX + innerR * Math.cos(e)).toFixed(1);
  const iy2 = (CY + innerR * Math.sin(e)).toFixed(1);
  const ox1 = (CX + outerR * Math.cos(s)).toFixed(1);
  const oy1 = (CY + outerR * Math.sin(s)).toFixed(1);
  const ox2 = (CX + outerR * Math.cos(e)).toFixed(1);
  const oy2 = (CY + outerR * Math.sin(e)).toFixed(1);
  return [
    `M${ix1},${iy1}`,
    `A${innerR},${innerR} 0 ${large},1 ${ix2},${iy2}`,
    `L${ox2},${oy2}`,
    `A${outerR},${outerR} 0 ${large},0 ${ox1},${oy1}`,
    "Z",
  ].join(" ");
}

// Text rotation that stays upright (not upside-down) at any clock angle
function readableRot(clockAngle: number): number {
  let t = (((clockAngle - 90) % 360) + 360) % 360;
  if (t > 90 && t < 270) t -= 180;
  return t;
}

// ── Mini compass ──────────────────────────────────────────────────────────────
function SectionCompass({ blockAngle }: { blockAngle: number }) {
  const cx = 30,
    cy = 30,
    ringR = 22,
    dotR = 5.5;
  const rad = toRad(blockAngle);
  const dotX = cx + ringR * Math.cos(rad);
  const dotY = cy + ringR * Math.sin(rad);
  return (
    <svg
      viewBox="0 0 60 60"
      width={52}
      height={52}
      className="shrink-0"
      aria-label="Your position on the stadium"
    >
      <circle
        cx={cx}
        cy={cy}
        r={ringR + 5}
        fill="none"
        stroke="#374151"
        strokeWidth={8}
      />
      <ellipse cx={cx} cy={cy} rx={7} ry={6} fill="#166534" />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="4"
        fontWeight="bold"
        fill="rgba(255,255,255,0.6)"
        letterSpacing="0.5"
      >
        GND
      </text>
      <circle cx={dotX} cy={dotY} r={dotR} fill="#F59E0B" />
      <line
        x1={dotX}
        y1={dotY}
        x2={cx + (dotX - cx) * 0.45}
        y2={cy + (dotY - cy) * 0.45}
        stroke="#F59E0B"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
  const blockAngle = section.angle ?? 180;

  const seatsByRow = new Map<string, SectionSeat[]>();
  for (const s of seats) {
    const arr = seatsByRow.get(s.rowLabel) ?? [];
    arr.push(s);
    seatsByRow.set(s.rowLabel, arr);
  }

  const totalAvail = seats.filter((s) => s.status === "available").length;
  const totalSelected = seats.filter((s) => selectedSeatIds.has(s.id)).length;
  const totalBooked = seats.filter((s) => s.status === "booked").length;

  // Angular range of the view
  const startClk = blockAngle - VIEW_HALF_DEG;
  const endClk = blockAngle + VIEW_HALF_DEG;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex w-full items-center gap-4 rounded-xl bg-slate-800/60 px-4 py-3 ring-1 ring-slate-700/40">
        {/* Section info — left */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-white">{section.label}</p>
          <p className="text-[10px] text-slate-400">
            Row A = nearest pitch · Row H = outer
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {totalAvail} available &middot; {totalSelected} selected
          </p>
        </div>

        {/* Pitch badge — centre */}
        <div className="hidden shrink-0 flex-col items-center gap-0.5 sm:flex">
          <span className="text-xl leading-none text-emerald-400">⬤</span>
          <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400">
            Pitch
          </span>
        </div>

        {/* Compass — right */}
        <div className="shrink-0">
          <SectionCompass blockAngle={blockAngle} />
        </div>
      </div>

      {/* ── Polar seat map ──────────────────────────────────────────────────── */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="mx-auto block w-full h-[600px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Radial glow for selected seats */}
            <filter id="ssv-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Pitch fill */}
            <radialGradient id="ssv-pitchFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#14532d" />
            </radialGradient>
            {/* Section highlight */}
            <radialGradient id="ssv-sectionGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.08" />
            </radialGradient>
          </defs>

          {/* ── Outer stadium wall ── */}
          <circle
            cx={CX}
            cy={CY}
            r={OUTER_WALL_R}
            fill="none"
            stroke="#1e293b"
            strokeWidth={12}
          />

          {/* ── Section highlight band (background glow for selected section) ── */}
          <motion.path
            key={blockAngle}
            d={sectorPath(PITCH_R + 1, OUTER_WALL_R - 4, startClk, endClk)}
            fill="rgba(30,64,175,0.10)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* ── Row band separators (faint arcs between rows) ── */}
          {ROW_LABELS.map((_, i) => {
            const R = rowRadius(i) + seatCircleR(i) + 2.5;
            return (
              <path
                key={i}
                d={arcPath(R, startClk - 1, endClk + 1)}
                fill="none"
                stroke="#334155"
                strokeWidth={1}
                opacity={0.4}
              />
            );
          })}

          {/* ── Pitch circle ── */}
          <circle cx={CX} cy={CY} r={PITCH_R} fill="url(#ssv-pitchFill)" />
          {/* Pitch strip */}
          <rect
            x={CX - 6}
            y={CY - 20}
            width={12}
            height={40}
            rx={2}
            fill="#92400e"
            opacity={0.75}
          />
          {/* Wicket dots */}
          <circle cx={CX} cy={CY - 17} r={2} fill="#fcd34d" />
          <circle cx={CX} cy={CY + 17} r={2} fill="#fcd34d" />
          {/* "GND" label */}
          <text
            x={CX}
            y={CY + 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fontWeight="bold"
            fill="rgba(255,255,255,0.5)"
            letterSpacing="1"
          >
            GND
          </text>
          {/* Boundary ring */}
          <circle
            cx={CX}
            cy={CY}
            r={PITCH_R}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="4,4"
          />

          {/* ── Seat rows A → H ── */}
          {ROW_SEAT_COUNTS.map((seatCount, rowIdx) => {
            const rowLabel = ROW_LABELS[rowIdx];
            const rowSeats = seatsByRow.get(rowLabel) ?? [];
            const sr = seatCircleR(rowIdx);

            return (
              <motion.g
                key={`${section.id}-${rowLabel}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: rowIdx * 0.04,
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                }}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: `${CX}px ${CY}px`,
                }}
              >
                {Array.from({ length: seatCount }, (_, j) => {
                  const { x, y } = polarPos(rowIdx, j, seatCount, blockAngle);
                  const seat = rowSeats[j];
                  if (!seat) return null;

                  const isSelected = selectedSeatIds.has(seat.id);
                  const isBooked = seat.status === "booked";

                  return (
                    <motion.circle
                      key={seat.id}
                      cx={x}
                      cy={y}
                      r={sr}
                      initial={false}
                      animate={{
                        fill: isBooked
                          ? "#1a1213"
                          : isSelected
                            ? "#10B981"
                            : "#374151",
                        opacity: isBooked ? 0.32 : 1,
                      }}
                      whileHover={
                        !isBooked
                          ? {
                              scale: 1.6,
                              fill: isSelected ? "#34d399" : "#94a3b8",
                            }
                          : {}
                      }
                      whileTap={!isBooked ? { scale: 0.78 } : {}}
                      transition={{ duration: 0.12 }}
                      stroke={
                        isBooked
                          ? "#3b1212"
                          : isSelected
                            ? "#34d399"
                            : "#4b5563"
                      }
                      strokeWidth={isSelected ? 1.5 : 0.5}
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
                          ? "Already booked"
                          : `Row ${rowLabel} · Seat ${j + 1} · ₹${seat.price}`}
                      </title>
                    </motion.circle>
                  );
                })}
              </motion.g>
            );
          })}

          {/* ── Row labels — at the clockwise edge of each arc ── */}
          {ROW_LABELS.map((label, rowIdx) => {
            const R = rowRadius(rowIdx);
            const labelAngle = endClk + 4; // just past the last seat
            const rad = toRad(labelAngle);
            const lx = CX + R * Math.cos(rad);
            const ly = CY + R * Math.sin(rad);
            const rot = readableRot(labelAngle);

            return (
              <text
                key={label}
                x={lx.toFixed(1)}
                y={ly.toFixed(1)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="700"
                fill="rgba(148,163,184,0.6)"
                transform={`rotate(${rot.toFixed(1)}, ${lx.toFixed(1)}, ${ly.toFixed(1)})`}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "#374151", border: "0.5px solid #4B5563" }}
          />
          Available ({totalAvail})
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background: "#10B981",
              border: "1px solid #34D399",
              boxShadow: "0 0 5px rgba(52,211,153,0.5)",
            }}
          />
          Selected ({totalSelected})
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full opacity-40"
            style={{ background: "#1a1213", border: "0.5px solid #3b1212" }}
          />
          Booked ({totalBooked})
        </span>
      </div>
    </div>
  );
}
