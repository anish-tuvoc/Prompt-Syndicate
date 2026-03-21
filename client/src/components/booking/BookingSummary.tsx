import { AnimatePresence, motion } from "framer-motion";
import type { EventType } from "../../data/events";
import type { SectionSeat, EventTicketCategory } from "../../pages/BookingPage/type";
import { formatPrice } from "../../pages/BookingPage/service";

interface BookingSummaryProps {
  eventType: EventType;
  selectedSeats: SectionSeat[];
  tickets: EventTicketCategory[];
  totalPrice: number;
  onProceed: () => void;
  isLoading?: boolean;
}

export function BookingSummary({
  eventType,
  selectedSeats,
  tickets,
  totalPrice,
  onProceed,
  isLoading = false,
}: BookingSummaryProps) {
  const hasSelection =
    eventType === "event"
      ? tickets.some((t) => t.quantity > 0)
      : selectedSeats.length > 0;

  const totalTicketCount =
    eventType === "event"
      ? tickets.reduce((s, t) => s + t.quantity, 0)
      : selectedSeats.length;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/95"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Left: selection details */}
        <div className="flex min-w-0 flex-col gap-0.5">
          {hasSelection ? (
            <>
              {eventType === "event" ? (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {tickets
                    .filter((t) => t.quantity > 0)
                    .map((t) => (
                      <span key={t.id} className="text-xs text-slate-200">
                        {t.label} × {t.quantity}
                      </span>
                    ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-300"
                    >
                      {s.rowLabel}
                      {s.colIndex}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-500">
                {totalTicketCount} {totalTicketCount === 1 ? "ticket" : "tickets"} selected
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">
              {eventType === "event"
                ? "Select ticket quantities above"
                : "Select a section then click seats"}
            </p>
          )}
        </div>

        {/* Right: price + button */}
        <div className="flex shrink-0 items-center gap-4">
          <AnimatePresence mode="wait">
            {hasSelection && (
              <motion.div
                key={totalPrice}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-right"
              >
                <p className="text-[10px] text-slate-500">Total</p>
                <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {formatPrice(totalPrice)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            disabled={!hasSelection || isLoading}
            onClick={onProceed}
            whileHover={hasSelection && !isLoading ? { scale: 1.04 } : {}}
            whileTap={hasSelection && !isLoading ? { scale: 0.96 } : {}}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              hasSelection && !isLoading
                ? "bg-brand-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.45)] hover:bg-brand-400"
                : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
            }`}
          >
            {isLoading ? "Booking..." : "Proceed to Pay"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
