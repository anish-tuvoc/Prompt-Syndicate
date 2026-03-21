import { motion } from "framer-motion";
import type { EventCategory } from "../data/events";

export type SortOption = "date" | "rating" | "price-asc" | "price-desc";

export const ALL_CATEGORIES = "All" as const;
export type CategoryFilter = typeof ALL_CATEGORIES | EventCategory;

interface FilterBarProps {
  activeCategory: CategoryFilter;
  sortBy: SortOption;
  onCategoryChange: (cat: CategoryFilter) => void;
  onSortChange: (sort: SortOption) => void;
}

const CATEGORIES: CategoryFilter[] = ["All", "Movie", "Concert", "Theatre", "Comedy", "Sports", "Festival"];
const WIP_CATEGORIES = new Set<CategoryFilter>(["Concert", "Theatre", "Comedy", "Sports", "Festival"]);

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date",       label: "Date (soonest)" },
  { value: "rating",     label: "Top rated" },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
];

export function FilterBar({ activeCategory, sortBy, onCategoryChange, onSortChange }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="group relative shrink-0">
            <button
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {activeCategory === cat && (
                <motion.span
                  layoutId="category-pill"
                  className="absolute inset-0 rounded-full bg-brand-600"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
            {WIP_CATEGORIES.has(cat) && (
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                WIP - Booking coming soon
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
