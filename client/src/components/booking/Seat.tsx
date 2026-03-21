import { motion } from "framer-motion";
import type { MovieSeat } from "../../pages/BookingPage/type";

interface SeatProps {
  seat: MovieSeat;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const SECTION_AVAILABLE: Record<string, string> = {
  front:  "bg-sky-600 border-sky-500 hover:bg-sky-400",
  middle: "bg-violet-600 border-violet-500 hover:bg-violet-400",
  rear:   "bg-pink-600 border-pink-500 hover:bg-pink-400",
};

export function Seat({ seat, isSelected, onToggle }: SeatProps) {
  const isBooked = seat.status === "booked";

  const baseClass =
    "relative flex h-6 w-6 items-end justify-center rounded-t-[4px] border text-[8px] font-bold leading-none pb-0.5 outline-none transition-colors md:h-7 md:w-7";

  const stateClass = isBooked
    ? "cursor-not-allowed border-slate-600 bg-slate-700/70 text-slate-500"
    : isSelected
      ? "cursor-pointer border-emerald-400 bg-emerald-500 text-white ring-1 ring-emerald-300 ring-offset-1 ring-offset-slate-950"
      : `cursor-pointer ${SECTION_AVAILABLE[seat.section] ?? "bg-slate-600 border-slate-500"} text-white/80`;

  return (
    <motion.button
      type="button"
      disabled={isBooked}
      onClick={() => !isBooked && onToggle(seat.id)}
      whileHover={!isBooked ? { scale: 1.25, zIndex: 10 } : {}}
      whileTap={!isBooked ? { scale: 0.9 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      title={isBooked ? "Already booked" : `Seat ${seat.id} — ₹${seat.price}`}
      className={`${baseClass} ${stateClass}`}
    >
      {seat.col}
    </motion.button>
  );
}
