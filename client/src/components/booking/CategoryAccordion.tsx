import { AnimatePresence, motion } from "framer-motion";
import type { PriceCategory } from "../../data/events";
import type { SectionData } from "../../pages/BookingPage/type";
import { formatPrice } from "../../pages/BookingPage/service";

interface CategoryAccordionProps {
  categories: PriceCategory[];
  sections: SectionData[];
  activeCategoryId: string | null;
  activeSectionId: string | null;
  onToggleCategory: (id: string) => void;
  onSelectSection: (section: SectionData) => void;
}

function availabilityColor(pct: number): string {
  if (pct > 0.5) return "bg-emerald-400";
  if (pct > 0.2) return "bg-amber-400";
  return "bg-red-500";
}

function availabilityLabel(pct: number): string {
  if (pct > 0.5) return `${Math.round(pct * 100)}% avail.`;
  if (pct > 0.2) return `${Math.round(pct * 100)}% avail.`;
  return "Filling fast";
}

export function CategoryAccordion({
  categories,
  sections,
  activeCategoryId,
  activeSectionId,
  onToggleCategory,
  onSelectSection,
}: CategoryAccordionProps) {
  return (
    <div className="space-y-1.5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Select Category → Section
      </p>

      {categories.map((cat) => {
        const isOpen = activeCategoryId === cat.id;
        const catSections = sections.filter((s) => s.categoryId === cat.id);

        return (
          <div
            key={cat.id}
            className={`overflow-hidden rounded-xl border transition-colors ${
              isOpen
                ? "border-brand-500/60 bg-brand-950/40"
                : "border-slate-700/50 bg-slate-900/50 hover:border-slate-600"
            }`}
          >
            {/* Category header */}
            <button
              type="button"
              onClick={() => onToggleCategory(cat.id)}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-semibold text-slate-100">{cat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{formatPrice(cat.price)}</span>
                <motion.svg
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="h-4 w-4 text-slate-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </button>

            {/* Section list */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="sections"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 border-t border-slate-700/50 p-2">
                    {catSections.map((section) => {
                      const isActive = activeSectionId === section.id;
                      const dotColor = availabilityColor(section.availablePercent);
                      const label = availabilityLabel(section.availablePercent);

                      return (
                        <motion.button
                          key={section.id}
                          type="button"
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectSection(section)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                            isActive
                              ? "bg-emerald-600/20 ring-1 ring-emerald-500/50"
                              : "hover:bg-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Availability dot */}
                            <span className="relative flex h-2 w-2 shrink-0">
                              {isActive && (
                                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotColor} opacity-75`} />
                              )}
                              <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
                            </span>

                            <div>
                              <p className={`text-xs font-semibold ${isActive ? "text-emerald-300" : "text-slate-200"}`}>
                                {section.shortLabel}
                              </p>
                              <p className="text-[10px] text-slate-400 line-clamp-1">
                                {section.label.split("—")[1]?.trim() ?? section.label}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-slate-500">
                            <span>{label}</span>
                            <svg
                              className={`h-3.5 w-3.5 transition-colors ${isActive ? "text-emerald-400" : "text-slate-600"}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </motion.button>
                      );
                    })}
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
