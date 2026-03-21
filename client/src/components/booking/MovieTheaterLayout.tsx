import { Fragment, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Seat } from "./Seat";
import type { FullMovieRow } from "../../pages/BookingPage/type";
import type { PriceCategory } from "../../data/events";

interface MovieTheaterLayoutProps {
  rows: FullMovieRow[];
  priceCategories: PriceCategory[];
  selectedCategoryId: string | null;
  selectedSeatIds: Set<string>;
  /** Category to auto-scroll into view on first render. Default: middle category. */
  focusCategoryId?: string;
  onToggleSeat: (id: string) => void;
}

const AISLE_AFTER = 7; // 14-seat rows split 7|gap|7

// A=0, B=1, ..., L=11
function absRowIdx(rowLabel: string): number {
  return rowLabel.charCodeAt(0) - 65;
}

// Parabolic curvature: seats at edges of a row are pushed DOWN slightly.
// Row A (index 0, closest to screen at BOTTOM) has the most curvature.
function seatYOffset(colIndex: number, rowAbsIdx: number): number {
  const distFromCenter = Math.abs(colIndex - 7.5); // 7.5 = center of 14 seats
  const curvature = Math.max(0.028, 0.15 - rowAbsIdx * 0.011);
  return distFromCenter * distFromCenter * curvature;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.032 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: -6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
  },
};

export function MovieTheaterLayout({
  rows,
  priceCategories,
  selectedCategoryId,
  selectedSeatIds,
  focusCategoryId,
  onToggleSeat,
}: MovieTheaterLayoutProps) {
  const catMap = new Map(priceCategories.map((c) => [c.id, c]));

  // Determine which category to auto-focus (default: middle category by index)
  const focusId =
    focusCategoryId ??
    priceCategories[Math.floor(priceCategories.length / 2)]?.id ??
    null;

  // Ref attached to the first row that belongs to the focus category
  const focusRowRef = useRef<HTMLDivElement>(null);

  // Initial highlight: show a pulsing glow on the focus section for 3s on mount
  const [isInitialGlow, setIsInitialGlow] = useState(true);

  useEffect(() => {
    // Smooth scroll to the focus section after initial animations settle
    const scrollTimer = setTimeout(() => {
      focusRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 750);

    // Remove the initial glow after 3s
    const glowTimer = setTimeout(() => setIsInitialGlow(false), 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(glowTimer);
    };
  }, []);

  // Render rows in REVERSED order: L (top) → A (bottom, closest to screen)
  const displayRows = [...rows].reverse();

  // Section boundary dividers (only between category groups, not at the very top)
  const boundaryRows = new Set<string>();
  let lastCat = "";
  for (const row of displayRows) {
    if (row.categoryId !== lastCat && lastCat !== "") {
      boundaryRows.add(row.rowLabel);
    }
    lastCat = row.categoryId;
  }

  // Stats for legend
  const allSeats = rows.flatMap((r) => r.seats);
  const totalAvail = allSeats.filter((s) => s.status === "available").length;
  const totalBooked = allSeats.filter((s) => s.status === "booked").length;
  const totalSelected = allSeats.filter((s) =>
    selectedSeatIds.has(s.id),
  ).length;

  // Track whether we've attached the focusRef for this render pass
  let focusRefAttached = false;

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Scrollable seat area */}
      <div className="w-full overflow-x-auto">
        <div className="mx-auto min-w-fit px-6 pt-2 pb-1">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-[4px] flex flex-col items-center justify-center"
          >
            {displayRows.map((row) => {
              const cat = catMap.get(row.categoryId);
              const absIdx = absRowIdx(row.rowLabel);
              const isDimmedRow =
                selectedCategoryId !== null &&
                row.categoryId !== selectedCategoryId;
              const catColor = cat?.color ?? "#94a3b8";

              // Focus glow: applied when this row belongs to the focus category
              const isFocusRow = row.categoryId === focusId && !isDimmedRow;

              // Attach the scroll-target ref to the FIRST row of the focus category
              let rowRef: React.RefObject<HTMLDivElement | null> | undefined;
              if (isFocusRow && !focusRefAttached) {
                rowRef = focusRowRef;
                focusRefAttached = true;
              }

              return (
                <Fragment key={row.rowLabel}>
                  {/* Section divider between category groups */}
                  {boundaryRows.has(row.rowLabel) && (
                    <motion.div
                      variants={rowVariants}
                      className="flex items-center gap-2 py-2"
                    >
                      <div className="h-px flex-1 bg-slate-800" />
                      <motion.span
                        animate={{ opacity: isDimmedRow ? 0.3 : 1 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          color: catColor,
                          backgroundColor: `${catColor}18`,
                          border: `1px solid ${catColor}30`,
                        }}
                      >
                        {cat?.label} · ₹{cat?.price}
                      </motion.span>
                      <div className="h-px flex-1 bg-slate-800" />
                    </motion.div>
                  )}

                  {/* Seat row */}
                  <motion.div
                    ref={rowRef}
                    variants={rowVariants}
                    animate={{ opacity: isDimmedRow ? 0.18 : 1 }}
                    transition={{ duration: 0.22 }}
                    className="relative"
                  >
                    {/* Initial glow highlight on focus section */}
                    <AnimatePresence>
                      {isFocusRow && isInitialGlow && (
                        <motion.div
                          key="glow"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.18, 0.1, 0.18, 0.08] }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 2.5,
                            times: [0, 0.3, 0.6, 0.8, 1],
                          }}
                          className="pointer-events-none absolute inset-0 -mx-2 rounded-lg"
                          style={{
                            background: `radial-gradient(ellipse at center, ${catColor}40 0%, transparent 70%)`,
                            boxShadow: `0 0 20px ${catColor}25`,
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="flex items-start gap-1.5">
                      {/* Row label – left */}
                      <span
                        className="w-5 shrink-0 pt-1 text-right text-[9px] font-bold transition-colors duration-200"
                        style={{ color: isDimmedRow ? "#1e293b" : catColor }}
                      >
                        {row.rowLabel}
                      </span>

                      {/* Left half of seats */}
                      <div className="flex items-start gap-[3px]">
                        {row.seats.slice(0, AISLE_AFTER).map((seat) => (
                          <div
                            key={seat.id}
                            style={{
                              marginTop: `${seatYOffset(seat.colIndex, absIdx)}px`,
                            }}
                          >
                            <Seat
                              seat={seat}
                              isSelected={selectedSeatIds.has(seat.id)}
                              isDimmed={isDimmedRow}
                              onToggle={onToggleSeat}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Center aisle gap */}
                      <div className="w-4 shrink-0" />

                      {/* Right half of seats */}
                      <div className="flex items-start gap-[3px]">
                        {row.seats.slice(AISLE_AFTER).map((seat) => (
                          <div
                            key={seat.id}
                            style={{
                              marginTop: `${seatYOffset(seat.colIndex, absIdx)}px`,
                            }}
                          >
                            <Seat
                              seat={seat}
                              isSelected={selectedSeatIds.has(seat.id)}
                              isDimmed={isDimmedRow}
                              onToggle={onToggleSeat}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Row label – right */}
                      <span
                        className="w-5 shrink-0 pt-1 text-left text-[9px] font-bold transition-colors duration-200"
                        style={{ color: isDimmedRow ? "#1e293b" : catColor }}
                      >
                        {row.rowLabel}
                      </span>
                    </div>
                  </motion.div>
                </Fragment>
              );
            })}
          </motion.div>

          {/* ── Curved screen at BOTTOM ──────────────────────────────────── */}
          <div className="mt-5">
            <TheaterScreen />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-[2px] border border-slate-600/70 bg-slate-700/80" />
          Available ({totalAvail})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-[2px] border border-emerald-400 bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.4)]" />
          Selected ({totalSelected})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-[2px] border border-red-900/40 bg-red-950/60 opacity-40" />
          Booked ({totalBooked})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-[2px] border border-slate-700 bg-slate-800 opacity-20" />
          Other category
        </span>
      </div>
    </div>
  );
}

// ── Curved theater screen — positioned at BOTTOM, bows upward toward audience ──
function TheaterScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
    >
      <svg
        viewBox="0 0 620 68"
        className="mx-auto w-full max-w-[620px] overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outermost halo */}
        <path
          d="M 45,50 Q 310,20 575,50"
          fill="none"
          stroke="rgba(139,92,246,0.08)"
          strokeWidth="28"
          strokeLinecap="round"
        />
        {/* Wide glow */}
        <path
          d="M 45,50 Q 310,20 575,50"
          fill="none"
          stroke="rgba(139,92,246,0.22)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Inner glow */}
        <path
          d="M 45,50 Q 310,20 575,50"
          fill="none"
          stroke="rgba(167,139,250,0.48)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Screen surface */}
        <path
          d="M 45,50 Q 310,20 575,50"
          fill="none"
          stroke="rgba(255,255,255,0.86)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* End caps */}
        <circle cx="45" cy="50" r="3.5" fill="rgba(167,139,250,0.7)" />
        <circle cx="575" cy="50" r="3.5" fill="rgba(167,139,250,0.7)" />

        {/* "All eyes this way please" text */}
        <text
          x="310"
          y="64"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="2.5"
          fill="rgba(255,255,255,0.38)"
        >
          ALL EYES THIS WAY PLEASE
        </text>

        {/* Subtle scan line */}
        <line
          x1="185"
          y1="57"
          x2="435"
          y2="57"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.5"
        />
      </svg>
    </motion.div>
  );
}
