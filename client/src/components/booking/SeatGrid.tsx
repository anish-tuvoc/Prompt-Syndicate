import type { MovieRow, SeatSection } from "../../pages/BookingPage/type";
import type { PriceCategory } from "../../data/events";
import { Seat } from "./Seat";

interface SeatGridProps {
  rows: MovieRow[];
  selectedSeats: Set<string>;
  onToggleSeat: (id: string) => void;
  priceCategories: PriceCategory[];
}

const SECTION_LABELS: Record<SeatSection, string> = {
  front:  "Front",
  middle: "Middle",
  rear:   "Rear",
};

const SECTION_DOT: Record<SeatSection, string> = {
  front:  "bg-sky-500",
  middle: "bg-violet-500",
  rear:   "bg-pink-500",
};

export function SeatGrid({ rows, selectedSeats, onToggleSeat, priceCategories }: SeatGridProps) {
  let lastSection: SeatSection | null = null;

  return (
    <div className="space-y-6">
      {/* Screen */}
      <div className="flex flex-col items-center gap-1">
        <div className="h-1.5 w-2/3 rounded-b-3xl bg-gradient-to-b from-white/70 to-white/10 shadow-[0_4px_30px_rgba(255,255,255,0.25)]" />
        <span className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Screen</span>
      </div>

      {/* Rows */}
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-fit space-y-1.5 px-2">
          {rows.map((row) => {
            const showSectionHeader = row.section !== lastSection;
            lastSection = row.section;
            const catPrice = priceCategories.find((p) => p.id === row.section)?.price ?? 0;

            return (
              <div key={row.label}>
                {showSectionHeader && (
                  <div className="my-3 flex items-center gap-3">
                    <div className="h-px flex-1 border-t border-dashed border-slate-700" />
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <span className={`h-2 w-2 rounded-full ${SECTION_DOT[row.section]}`} />
                      {SECTION_LABELS[row.section]} — ₹{catPrice}
                    </span>
                    <div className="h-px flex-1 border-t border-dashed border-slate-700" />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Row label */}
                  <span className="w-5 shrink-0 text-right text-[10px] font-bold text-slate-500">
                    {row.label}
                  </span>

                  {/* Seats split by aisle */}
                  <div className="flex gap-1">
                    {row.seats.slice(0, 7).map((seat) => (
                      <Seat
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeats.has(seat.id)}
                        onToggle={onToggleSeat}
                      />
                    ))}
                  </div>

                  {/* Aisle */}
                  <div className="w-4" />

                  <div className="flex gap-1">
                    {row.seats.slice(7).map((seat) => (
                      <Seat
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeats.has(seat.id)}
                        onToggle={onToggleSeat}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-t-[3px] bg-sky-600" /> Front
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-t-[3px] bg-violet-600" /> Middle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-t-[3px] bg-pink-600" /> Rear
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-t-[3px] bg-emerald-500" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-t-[3px] bg-slate-700/70 opacity-50" /> Booked
        </span>
      </div>
    </div>
  );
}
