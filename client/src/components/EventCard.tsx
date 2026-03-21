import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { EventData } from "../data/events";
import { cardVariants } from "./cardVariants";

interface EventCardProps {
  event: EventData;
}

const CATEGORY_COLORS: Record<string, string> = {
  Concert:  "bg-violet-600/90 text-violet-100",
  Theatre:  "bg-rose-600/90 text-rose-100",
  Comedy:   "bg-amber-500/90 text-amber-950",
  Sports:   "bg-emerald-600/90 text-emerald-100",
  Festival: "bg-pink-600/90 text-pink-100",
  Movie:    "bg-orange-600/90 text-orange-100",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`h-3 w-3 ${i < full ? "text-amber-400" : "text-slate-500 dark:text-slate-600"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-medium text-amber-500">{rating.toFixed(1)}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ scale: 1.025, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={() => navigate(`/event/${event.id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category badge */}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${CATEGORY_COLORS[event.category] ?? "bg-brand-600/90 text-white"}`}
        >
          {event.category}
        </span>

        {/* Price */}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          From {formatPrice(event.price)}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {event.title}
        </h3>

        <div className="mt-1.5">
          <StarRating rating={event.rating} />
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(event.date)} &middot; {event.time}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
