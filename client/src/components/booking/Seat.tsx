import { motion } from "framer-motion";
import type { SectionSeat } from "../../pages/BookingPage/type";

interface SeatProps {
  seat: SectionSeat;
  isSelected: boolean;
  isDimmed?: boolean; // true when a different category is selected (movie only)
  onToggle: (id: string) => void;
}

export function Seat({ seat, isSelected, isDimmed = false, onToggle }: SeatProps) {
  const isBooked = seat.status === "booked";
  const isDisabled = isBooked || isDimmed;

  const stateClass = isBooked
    ? "cursor-not-allowed bg-red-100 border-red-200 dark:bg-red-950/60 dark:border-red-900/40"
    : isDimmed
    ? "cursor-not-allowed bg-slate-200/80 border-slate-300/60 dark:bg-slate-700/60 dark:border-slate-600/40"
    : isSelected
    ? "cursor-pointer bg-emerald-500 border-emerald-400 ring-1 ring-emerald-300 ring-offset-[2px] ring-offset-white shadow-[0_0_7px_rgba(52,211,153,0.6)] dark:ring-offset-slate-950"
    : "cursor-pointer bg-slate-300/90 border-slate-400/80 hover:bg-slate-400 hover:border-slate-500 dark:bg-slate-600/90 dark:border-slate-500/80 dark:hover:bg-slate-500 dark:hover:border-slate-400";

  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      onClick={() => !isDisabled && onToggle(seat.id)}
      whileHover={!isDisabled ? { scale: 1.32, zIndex: 20 } : {}}
      whileTap={!isDisabled ? { scale: 0.88 } : {}}
      animate={isSelected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 460, damping: 22 }}
      title={
        isBooked
          ? "Already booked"
          : isDimmed
          ? "Select this category to book these seats"
          : `${seat.rowLabel}${seat.colIndex}  ₹${seat.price}`
      }
      className={`relative flex h-5 w-6 items-end justify-center rounded-[3px] border pb-px text-[7px] font-bold leading-none text-slate-700/70 outline-none transition-colors duration-150 dark:text-white/60 ${stateClass}`}
    >
      {/* Seat-back visual bar */}
      <span className="absolute inset-x-0.5 top-0.5 h-[4px] rounded-t-[2px] bg-current opacity-20" />

      {isBooked ? (
        <svg
          className="mb-0.5 h-2.5 w-2.5 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        seat.colIndex
      )}
    </motion.button>
  );
}
