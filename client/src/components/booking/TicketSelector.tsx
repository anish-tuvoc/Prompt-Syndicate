import { motion, AnimatePresence } from "framer-motion";
import type { EventTicketCategory } from "../../pages/BookingPage/type";
import { formatPrice } from "../../pages/BookingPage/service";

interface TicketSelectorProps {
  tickets: EventTicketCategory[];
  onUpdate: (id: string, delta: number) => void;
}

const CARD_ACCENTS: Record<number, string> = {
  0: "from-emerald-600/10 border-emerald-600/30",
  1: "from-violet-600/10 border-violet-600/30",
  2: "from-amber-600/10 border-amber-600/30",
  3: "from-pink-600/10 border-pink-600/30",
};

const ICON_BG: Record<number, string> = {
  0: "bg-emerald-600/20 text-emerald-400",
  1: "bg-violet-600/20 text-violet-400",
  2: "bg-amber-600/20 text-amber-400",
  3: "bg-pink-600/20 text-pink-400",
};

export function TicketSelector({ tickets, onUpdate }: TicketSelectorProps) {
  return (
    <div className="space-y-4">
      {tickets.map((ticket, idx) => {
        const isSoldOut = ticket.available === 0;
        const accent = CARD_ACCENTS[idx % 4] ?? CARD_ACCENTS[0];
        const iconBg = ICON_BG[idx % 4] ?? ICON_BG[0];

        return (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.35, ease: "easeOut" }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent ${accent} p-5`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Info */}
              <div className="flex items-start gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{ticket.label}</h3>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{ticket.description}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatPrice(ticket.price)}
                    </span>
                    {isSoldOut ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400">
                        Sold Out
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {ticket.available} left
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  disabled={ticket.quantity === 0}
                  onClick={() => onUpdate(ticket.id, -1)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 text-slate-300 transition hover:border-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </motion.button>

                <AnimatePresence mode="wait">
                  <motion.span
                    key={ticket.quantity}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-8 text-center text-xl font-bold text-slate-900 dark:text-white"
                  >
                    {ticket.quantity}
                  </motion.span>
                </AnimatePresence>

                <motion.button
                  type="button"
                  disabled={isSoldOut || ticket.quantity >= Math.min(ticket.maxPerBooking, ticket.available)}
                  onClick={() => onUpdate(ticket.id, 1)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Sub-total for this category */}
            {ticket.quantity > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 flex justify-between border-t border-slate-200/30 pt-3 text-sm dark:border-slate-700/50"
              >
                <span className="text-slate-400">
                  {ticket.quantity} × {formatPrice(ticket.price)}
                </span>
                <span className="font-semibold text-brand-500">
                  {formatPrice(ticket.price * ticket.quantity)}
                </span>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
