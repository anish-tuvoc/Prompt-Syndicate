import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { EventData } from "../data/events";

interface CarouselProps {
  events: EventData[];
}

const SLIDE_INTERVAL_MS = 4500;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

const CATEGORY_COLORS: Record<string, string> = {
  Concert:  "bg-violet-600",
  Theatre:  "bg-rose-600",
  Comedy:   "bg-amber-500",
  Sports:   "bg-emerald-600",
  Festival: "bg-pink-600",
};

export function Carousel({ events }: CarouselProps) {
  const [[current, direction], setSlide] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const isDragging = useRef(false);
  const navigate = useNavigate();

  const slideTo = useCallback(
    (index: number, dir: number) => {
      if (events.length === 0) return;
      setSlide([(index + events.length) % events.length, dir]);
    },
    [events.length],
  );

  const next = useCallback(() => slideTo(current + 1, 1), [current, slideTo]);
  const prev = useCallback(() => slideTo(current - 1, -1), [current, slideTo]);

  useEffect(() => {
    if (isPaused || events.length === 0) return;
    const id = setInterval(next, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [next, isPaused, events.length]);

  if (events.length === 0) return null;

  function handleDragStart() {
    isDragging.current = true;
  }

  function handleDragEnd(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setTimeout(() => { isDragging.current = false; }, 50);
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  }

  function handleSlideClick() {
    if (!isDragging.current) {
      navigate(`/event/${events[current].id}`);
    }
  }

  const event = events[current];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide area */}
      <div className="relative aspect-[21/8] w-full overflow-hidden md:aspect-[21/7]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", ease: "easeInOut", duration: 0.55 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleSlideClick}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <img
              src={event.image}
              alt={event.title}
              className="h-full w-full select-none object-cover"
              draggable={false}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10">
              <span
                className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${CATEGORY_COLORS[event.category] ?? "bg-brand-600"}`}
              >
                {event.category}
              </span>
              <h2 className="text-xl font-bold leading-tight text-white md:text-4xl">
                {event.title}
              </h2>
              <p className="mt-1 text-sm text-slate-300 md:text-base">
                {event.venue} &middot; {event.location}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.id}`); }}
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-500"
                >
                  Book Now
                </motion.button>
                <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                  From {formatPrice(event.price)}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Arrow buttons */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
        {events.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => slideTo(idx, idx > current ? 1 : -1)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`rounded-full transition-all duration-300 ${
              idx === current
                ? "h-2 w-6 bg-white"
                : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
