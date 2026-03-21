import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { EventCard } from "../../components/EventCard";
import { cardVariants } from "../../components/cardVariants";
import { getEventByIdFromApi, getRelatedEventsFromApi } from "./service";
import type { EventData } from "../../data/events";

const relatedContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const CATEGORY_COLORS: Record<string, string> = {
  Concert:  "bg-violet-600",
  Theatre:  "bg-rose-600",
  Comedy:   "bg-amber-500",
  Sports:   "bg-emerald-600",
  Festival: "bg-pink-600",
  Movie:    "bg-orange-600",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${i < full ? "text-amber-400" : "text-slate-400"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="font-semibold text-amber-500">{rating.toFixed(1)}</span>
      <span className="text-slate-400">/5</span>
    </div>
  );
}

function InfoPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
      <span className="text-brand-500">{icon}</span>
      <span className="text-sm text-slate-700 dark:text-slate-300">{children}</span>
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [related, setRelated] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getEventByIdFromApi(id),
      getRelatedEventsFromApi(id),
    ]).then(([ev, rel]) => {
      setEvent(ev);
      setRelated(rel);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Event not found.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Hero banner */}
        <div className="relative aspect-[21/8] w-full overflow-hidden md:aspect-[21/7]">
          <img
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main info */}
            <div className="lg:col-span-2">
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white ${CATEGORY_COLORS[event.category] ?? "bg-brand-600"}`}
              >
                {event.category}
              </span>

              <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                {event.title}
              </h1>

              <div className="mt-3">
                <StarRating rating={event.rating} />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoPill
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                >
                  {event.venue}, {event.location}
                </InfoPill>

                <InfoPill
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  {formattedDate}
                </InfoPill>

                <InfoPill
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  {event.time} &middot; {event.duration}
                </InfoPill>

                <InfoPill
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  }
                >
                  Language: {event.language}
                </InfoPill>
              </div>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="mt-6">
                <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">About this event</h2>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">{event.description}</p>
              </div>
            </div>

            {/* Booking sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Starting from</p>
                <p className="mt-1 text-3xl font-bold text-brand-600">{formatPrice(event.price)}</p>
                <p className="text-xs text-slate-400">per seat</p>

                <div className="my-4 border-t border-slate-200 dark:border-slate-700" />

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time</span>
                    <span className="font-medium text-slate-900 dark:text-white">{event.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-medium text-slate-900 dark:text-white">{event.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Venue</span>
                    <span className="font-medium text-right text-slate-900 dark:text-white">{event.venue}</span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/event/${event.id}/book`)}
                  className="mt-6 w-full rounded-xl bg-brand-600 py-3 text-base font-bold text-white shadow-md shadow-brand-600/30 transition hover:bg-brand-500"
                >
                  {event.type === "movie" ? "Select Seats" : event.type === "sports" ? "Choose Stand" : "Buy Tickets"}
                </motion.button>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Secure checkout &middot; Instant confirmation
                </p>
              </div>
            </div>
          </div>

          {/* Related events */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-5 text-xl font-bold text-slate-900 dark:text-white">
                More {event.category} events
              </h2>
              <motion.div
              initial="hidden"
              animate="show"
              variants={relatedContainerVariants}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              >
                {related.map((rel) => (
                  <motion.div key={rel.id} variants={cardVariants}>
                    <EventCard event={rel} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </div>
      </motion.div>

    </>
  );
}
