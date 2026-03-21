import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Carousel } from "../../components/Carousel";
import { EventCard } from "../../components/EventCard";
import { cardVariants } from "../../components/cardVariants";
import { EventCardSkeleton } from "../../components/EventCardSkeleton";
import { FilterBar, type CategoryFilter, type SortOption } from "../../components/FilterBar";
import { getAllEventsFromApi, filterAndSortEvents } from "./service";
import type { EventData } from "../../data/events";

const SKELETON_COUNT = 8;

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

export function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("date");

  useEffect(() => {
    getAllEventsFromApi().then((events) => {
      setAllEvents(events);
      setIsLoading(false);
    });
  }, []);

  const featuredEvents = useMemo(() => allEvents.filter((e) => e.featured), [allEvents]);

  const visibleEvents = useMemo(
    () => filterAndSortEvents(allEvents, activeCategory, sortBy),
    [allEvents, activeCategory, sortBy],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-6xl px-4 py-8 md:px-6"
    >
      {/* Hero carousel */}
      <section className="mb-10">
        <Carousel events={featuredEvents} />
      </section>

      {/* All events */}
      <section>
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
              Browse Events
            </h2>
            {!isLoading && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <FilterBar
            activeCategory={activeCategory}
            sortBy={sortBy}
            onCategoryChange={setActiveCategory}
            onSortChange={setSortBy}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <svg
              className="h-12 w-12 text-slate-300 dark:text-slate-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400">No events found for this filter.</p>
          </div>
        ) : (
          <motion.div
            key={`${activeCategory}-${sortBy}`}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {visibleEvents.map((event) => (
              <motion.div key={event.id} variants={cardVariants}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </motion.div>
  );
}
