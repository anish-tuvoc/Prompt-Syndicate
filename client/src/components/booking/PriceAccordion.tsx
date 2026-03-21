import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PriceCategory } from "../../data/events";
import type { StadiumBlock } from "../../pages/BookingPage/type";
import { formatPrice } from "../../pages/BookingPage/service";

interface PriceAccordionProps {
  categories: PriceCategory[];
  blocks: StadiumBlock[];
  activeTier: string | null;  // used by parent to highlight stadium - kept for API consistency
  onSelectTier: (tier: string | null) => void;
}

const TIER_BADGE: Record<string, string> = {
  vip:      "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  premium:  "bg-violet-500/20 text-violet-400 ring-violet-500/30",
  standard: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
  budget:   "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
};

export function PriceAccordion({ categories, blocks, activeTier: _activeTier, onSelectTier }: PriceAccordionProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleToggle(id: string) {
    const next = expanded === id ? null : id;
    setExpanded(next);
    onSelectTier(next);
  }

  return (
    <div className="space-y-2">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Price Categories
      </p>
      {categories.map((cat) => {
        const isOpen = expanded === cat.id;
        const blocksInTier = blocks.filter((b) => b.priceId === cat.id);
        const totalAvailable = blocksInTier.reduce((s, b) => s + b.availableSeats, 0);
        const badgeClass = TIER_BADGE[cat.id] ?? "bg-slate-500/20 text-slate-400 ring-slate-500/30";

        return (
          <div
            key={cat.id}
            className={`overflow-hidden rounded-xl border transition-colors ${
              isOpen
                ? "border-brand-500/50 bg-brand-600/5"
                : "border-slate-700/50 bg-slate-900/50 hover:border-slate-600"
            }`}
          >
            {/* Header row */}
            <button
              type="button"
              onClick={() => handleToggle(cat.id)}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-semibold text-slate-100">{cat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{formatPrice(cat.price)}</span>
                <motion.svg
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="h-4 w-4 text-slate-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-700/50 px-4 py-3">
                    <p className="mb-2 text-xs text-slate-400">
                      {totalAvailable.toLocaleString()} seats available across{" "}
                      {blocksInTier.length} section{blocksInTier.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {blocksInTier.map((b) => (
                        <span
                          key={b.id}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${badgeClass}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
