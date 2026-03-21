import { motion } from "framer-motion";
import type { PriceCategory } from "../../data/events";
import type { FullMovieRow } from "../../pages/BookingPage/type";
import { formatPrice } from "../../pages/BookingPage/service";

interface MovieCategoryPanelProps {
  categories: PriceCategory[];
  rows: FullMovieRow[];
  selectedCategoryId: string | null;
  selectedSeatIds: Set<string>;
  onSelectCategory: (catId: string | null) => void;
}

export function MovieCategoryPanel({
  categories,
  rows,
  selectedCategoryId,
  selectedSeatIds,
  onSelectCategory,
}: MovieCategoryPanelProps) {
  return (
    <div className="space-y-2">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Filter by Price
      </p>

      {/* All seats option */}
      <CategoryButton
        isActive={selectedCategoryId === null}
        color="#8b5cf6"
        label="All Seats"
        subtitle="View complete layout — all categories"
        price={null}
        rowRange={null}
        available={null}
        selectedCount={null}
        onClick={() => onSelectCategory(null)}
      />

      {/* Individual categories */}
      {categories.map((cat) => {
        const catRows = rows.filter((r) => r.categoryId === cat.id);
        const catSeats = catRows.flatMap((r) => r.seats);
        const available = catSeats.filter((s) => s.status === "available").length;
        const selected = catSeats.filter((s) => selectedSeatIds.has(s.id)).length;
        const rowLabels = catRows.map((r) => r.rowLabel);
        const rowRange =
          rowLabels.length > 0
            ? `Rows ${rowLabels[0]}–${rowLabels[rowLabels.length - 1]}`
            : "";
        const isActive = selectedCategoryId === cat.id;

        return (
          <CategoryButton
            key={cat.id}
            isActive={isActive}
            color={cat.color}
            label={cat.label}
            subtitle={rowRange}
            price={cat.price}
            available={available}
            selectedCount={selected}
            onClick={() => onSelectCategory(isActive ? null : cat.id)}
          />
        );
      })}

      {/* Instructions */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-3 text-[10px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">How to book:</p>
        <p>1. Choose a price category above</p>
        <p>2. Click available seats in the layout</p>
        <p>3. Click "Proceed to Pay" below</p>
      </div>

      {/* Legend */}
      <div className="mt-2 space-y-1.5 border-t border-slate-800 pt-3">
        <LegendItem color="bg-slate-600/80 border-slate-500/70" label="Available" />
        <LegendItem color="bg-emerald-500 border-emerald-400" label="Selected" glow />
        <LegendItem color="bg-red-950/60 border-red-900/40 opacity-40" label="Booked" />
        <LegendItem color="opacity-20 bg-slate-600/80 border-slate-500/70" label="Other category" />
      </div>
    </div>
  );
}

interface CategoryButtonProps {
  isActive: boolean;
  color: string;
  label: string;
  subtitle: string | null;
  price: number | null;
  available: number | null;
  selectedCount: number | null;
  onClick: () => void;
}

function CategoryButton({
  isActive,
  color,
  label,
  subtitle,
  price,
  available,
  selectedCount,
  onClick,
}: CategoryButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
        isActive
          ? "border-opacity-60 shadow-lg"
          : "border-slate-700/50 bg-slate-900/50 hover:border-slate-600"
      }`}
      style={
        isActive
          ? {
              borderColor: `${color}80`,
              backgroundColor: `${color}12`,
              boxShadow: `0 0 20px ${color}20`,
            }
          : {}
      }
    >
      {/* Active left accent bar */}
      {isActive && (
        <motion.div
          layoutId="category-accent"
          className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
          style={{ backgroundColor: color }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-slate-100">{label}</span>
        </div>
        {price !== null && (
          <span className="text-sm font-bold text-white">{formatPrice(price)}</span>
        )}
      </div>

      {(subtitle || available !== null) && (
        <div className="mt-1.5 flex items-center justify-between pl-[22px]">
          <span className="text-[10px] text-slate-400">{subtitle}</span>
          <div className="flex items-center gap-2">
            {available !== null && (
              <span className="text-[10px] text-slate-500">{available} avail.</span>
            )}
            {selectedCount !== null && selectedCount > 0 && (
              <span className="text-[10px] font-bold text-emerald-400">
                {selectedCount} selected
              </span>
            )}
          </div>
        </div>
      )}
    </motion.button>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  glow?: boolean;
}

function LegendItem({ color, label, glow }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-500">
      <span
        className={`h-3 w-4 shrink-0 rounded-[2px] border ${color} ${
          glow ? "shadow-[0_0_4px_rgba(52,211,153,0.4)]" : ""
        }`}
      />
      {label}
    </div>
  );
}
