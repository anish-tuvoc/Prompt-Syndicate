import { motion, AnimatePresence } from "framer-motion";
import type { EventType } from "../../data/events";
import type { MovieSeat, StadiumBlock, EventTicketCategory } from "../../pages/BookingPage/type";
import { formatPrice } from "../../pages/BookingPage/service";

interface MovieSummaryProps {
  type: "movie";
  selectedSeats: MovieSeat[];
  totalPrice: number;
  onProceed: () => void;
}

interface SportsSummaryProps {
  type: "sports";
  selectedBlock: StadiumBlock | null;
  blockQuantity: number;
  onBlockQuantityChange: (qty: number) => void;
  totalPrice: number;
  onProceed: () => void;
}

interface EventSummaryProps {
  type: "event";
  tickets: EventTicketCategory[];
  totalPrice: number;
  onProceed: () => void;
}

type BookingSummaryProps = MovieSummaryProps | SportsSummaryProps | EventSummaryProps;

function canProceed(props: BookingSummaryProps): boolean {
  if (props.type === "movie")  return props.selectedSeats.length > 0;
  if (props.type === "sports") return props.selectedBlock !== null && props.blockQuantity > 0;
  return props.tickets.some((t) => t.quantity > 0);
}

export function BookingSummary(props: BookingSummaryProps) {
  const { totalPrice, onProceed } = props;
  const enabled = canProceed(props);

  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200/70 bg-white/95 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        {/* Selected info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {props.type === "movie" && props.selectedSeats.length > 0 && (
            <p className="truncate text-sm text-slate-600 dark:text-slate-400">
              {props.selectedSeats.map((s) => s.id).join(", ")}
            </p>
          )}

          {props.type === "sports" && props.selectedBlock && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Block {props.selectedBlock.label} &middot;{" "}
                <span className="font-medium">{formatPrice(props.selectedBlock.price)}/seat</span>
              </p>
              {/* quantity stepper */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={props.blockQuantity <= 1}
                  onClick={() => (props as SportsSummaryProps).onBlockQuantityChange(props.blockQuantity - 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 text-sm text-slate-300 hover:border-slate-400 disabled:opacity-30"
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-bold text-slate-900 dark:text-white">
                  {props.blockQuantity}
                </span>
                <button
                  type="button"
                  disabled={props.blockQuantity >= Math.min(10, props.selectedBlock.availableSeats)}
                  onClick={() => (props as SportsSummaryProps).onBlockQuantityChange(props.blockQuantity + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-sm text-white hover:bg-brand-500 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {props.type === "event" && props.tickets.some((t) => t.quantity > 0) && (
            <p className="truncate text-sm text-slate-600 dark:text-slate-400">
              {props.tickets
                .filter((t) => t.quantity > 0)
                .map((t) => `${t.quantity}× ${t.label}`)
                .join(", ")}
            </p>
          )}

          {!enabled && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {props.type === "movie"  ? "Select seats above" :
               props.type === "sports" ? "Click a section on the map" :
               "Select ticket quantities above"}
            </p>
          )}

          <AnimatePresence>
            {enabled && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                Total: {formatPrice(totalPrice)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Proceed button */}
        <motion.button
          type="button"
          disabled={!enabled}
          whileHover={enabled ? { scale: 1.04 } : {}}
          whileTap={enabled ? { scale: 0.97 } : {}}
          onClick={onProceed}
          className="shrink-0 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
          Proceed to Pay
        </motion.button>
      </div>
    </div>
  );
}

export type { EventType };
