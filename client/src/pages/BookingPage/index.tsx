import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getEventByIdFromApi } from "../EventDetailPage/service";
import { BookingHeader } from "../../components/booking/BookingHeader";
import { MovieTheaterLayout } from "../../components/booking/MovieTheaterLayout";
import { MovieCategoryPanel } from "../../components/booking/MovieCategoryPanel";
import { CategoryAccordion } from "../../components/booking/CategoryAccordion";
import { StadiumSectionView } from "../../components/booking/StadiumSectionView";
import { StadiumLayout } from "../../components/booking/StadiumLayout";
import { TicketSelector } from "../../components/booking/TicketSelector";
import { BookingSummary } from "../../components/booking/BookingSummary";
import { LoginModal } from "../../components/LoginModal";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/useAuth";
import {
  generateFullMovieRows,
  generateSportsSections,
  generateStadiumBlocks,
  generateTicketCategories,
  generateSectionSeats,
  formatPrice,
} from "./service";
import type {
  FullMovieRow,
  SectionData,
  SectionSeat,
  StadiumBlock,
  EventTicketCategory,
} from "./type";
import type { EventData } from "../../data/events";

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);

  // ── Auth gate state ────────────────────────────────────────────────────
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  useEffect(() => {
    if (!id) return;
    getEventByIdFromApi(id).then((ev) => {
      setEvent(ev);
    });
  }, [id]);

  // ── MOVIE state ───────────────────────────────────────────────────────
  // All 12 rows generated upfront; no section drill-down needed
  const [movieRows, setMovieRows] = useState<FullMovieRow[]>([]);
  const [selectedMovieCategory, setSelectedMovieCategory] = useState<
    string | null
  >(null);
  const [movieSelectedSeatIds, setMovieSelectedSeatIds] = useState<Set<string>>(
    new Set(),
  );

  // ── SPORTS state ──────────────────────────────────────────────────────
  const [stadiumBlocks, setStadiumBlocks] = useState<StadiumBlock[]>([]);
  const [sportsSections, setSportsSections] = useState<SectionData[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionData | null>(null);
  const [sectionSeatsCache, setSectionSeatsCache] = useState<
    Record<string, SectionSeat[]>
  >({});
  const [sportsSelectedSeatIds, setSportsSelectedSeatIds] = useState<
    Set<string>
  >(new Set());

  // ── EVENT / CONCERT state ─────────────────────────────────────────────
  const [tickets, setTickets] = useState<EventTicketCategory[]>([]);

  // ── Success ───────────────────────────────────────────────────────────
  const [isSuccess, setIsSuccess] = useState(false);

  // ── Auth-guarded proceed handler ─────────────────────────────────────
  const handleProceed = useCallback(() => {
    if (!isLoggedIn) {
      setShowAuthToast(true);
      setIsLoginModalOpen(true);
      return;
    }
    setIsSuccess(true);
  }, [isLoggedIn]);

  // ── Initialise by event type ──────────────────────────────────────────
  useEffect(() => {
    if (!event) return;
    if (event.type === "movie") {
      setMovieRows(generateFullMovieRows(event));
    }
    if (event.type === "sports") {
      const blocks = generateStadiumBlocks(event);
      setStadiumBlocks(blocks);
      setSportsSections(generateSportsSections(blocks));
    }
    if (event.type === "event") {
      setTickets(generateTicketCategories(event));
    }
  }, [event]);

  // ── Lazy-load section seats for sports when a section is activated ────
  useEffect(() => {
    if (!activeSection || !event) return;
    if (sectionSeatsCache[activeSection.id]) return;
    const price =
      event.priceCategories.find((c) => c.id === activeSection.categoryId)
        ?.price ?? 0;
    const seats = generateSectionSeats(activeSection, price, event.id);
    setSectionSeatsCache((prev) => ({ ...prev, [activeSection.id]: seats }));
  }, [activeSection, event, sectionSeatsCache]);

  // ── Derived values ────────────────────────────────────────────────────
  const currentSectionSeats: SectionSeat[] = activeSection
    ? (sectionSeatsCache[activeSection.id] ?? [])
    : [];

  const allCachedSportsSeats = useMemo(
    () => Object.values(sectionSeatsCache).flat(),
    [sectionSeatsCache],
  );

  const sportsSelectedSeats = useMemo(
    () => allCachedSportsSeats.filter((s) => sportsSelectedSeatIds.has(s.id)),
    [allCachedSportsSeats, sportsSelectedSeatIds],
  );

  const movieSelectedSeats = useMemo(
    () =>
      movieRows
        .flatMap((r) => r.seats)
        .filter((s) => movieSelectedSeatIds.has(s.id)),
    [movieRows, movieSelectedSeatIds],
  );

  const totalPrice = useMemo(() => {
    if (!event) return 0;
    if (event.type === "movie")
      return movieSelectedSeats.reduce((s, seat) => s + seat.price, 0);
    if (event.type === "sports")
      return sportsSelectedSeats.reduce((s, seat) => s + seat.price, 0);
    return tickets.reduce((s, t) => s + t.price * t.quantity, 0);
  }, [event, movieSelectedSeats, sportsSelectedSeats, tickets]);

  const selectedCount = useMemo(() => {
    if (!event) return 0;
    if (event.type === "movie") return movieSelectedSeatIds.size;
    if (event.type === "sports") return sportsSelectedSeatIds.size;
    return tickets.reduce((s, t) => s + t.quantity, 0);
  }, [event, movieSelectedSeatIds.size, sportsSelectedSeatIds.size, tickets]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleMovieCategorySelect = useCallback(
    (catId: string | null) => {
      setSelectedMovieCategory(catId);
      // Clear seats that no longer belong to newly selected category
      if (catId !== null) {
        setMovieSelectedSeatIds((prev) => {
          const allSeats = movieRows.flatMap((r) => r.seats);
          const next = new Set<string>();
          for (const seatId of prev) {
            const seat = allSeats.find((s) => s.id === seatId);
            if (seat?.categoryId === catId) next.add(seatId);
          }
          return next;
        });
      }
    },
    [movieRows],
  );

  const handleToggleMovieSeat = useCallback((seatId: string) => {
    setMovieSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  }, []);

  // Sports accordion category toggle
  const handleToggleSportsCategory = useCallback((catId: string) => {
    setActiveCategoryId((prev) => (prev === catId ? null : catId));
  }, []);

  // Sports section selection (from accordion or stadium map)
  const handleSelectSportsSection = useCallback(
    (sectionOrBlockId: string | SectionData) => {
      if (typeof sectionOrBlockId === "string") {
        // Called from StadiumLayout SVG map
        const section = sportsSections.find((s) => s.id === sectionOrBlockId);
        if (section) {
          setActiveSection(section);
          setActiveCategoryId(section.categoryId);
        }
      } else {
        // Called from CategoryAccordion
        setActiveSection(sectionOrBlockId);
        setActiveCategoryId(sectionOrBlockId.categoryId);
      }
    },
    [sportsSections],
  );

  const handleToggleSportsSeat = useCallback((seatId: string) => {
    setSportsSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  }, []);

  const handleTicketUpdate = useCallback((ticketId: string, delta: number) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const qty = Math.max(
          0,
          Math.min(t.maxPerBooking, t.available, t.quantity + delta),
        );
        return { ...t, quantity: qty };
      }),
    );
  }, []);

  // ── Selected seats for summary bar ────────────────────────────────────
  const summarySeats: SectionSeat[] =
    event?.type === "movie" ? movieSelectedSeats : sportsSelectedSeats;

  // ── Not found ─────────────────────────────────────────────────────────
  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-400">Event not found.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-slate-950">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-900/40 ring-4 ring-emerald-500/30"
        >
          <svg
            className="h-10 w-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
          <p className="mt-2 text-slate-400">{event.title}</p>
          <p className="mt-1 text-2xl font-bold text-brand-400">
            {formatPrice(totalPrice)}
          </p>
          {event.type !== "event" && summarySeats.length > 0 && (
            <p className="mt-2 text-sm text-slate-400">
              Seats:{" "}
              {summarySeats.map((s) => `${s.rowLabel}${s.colIndex}`).join(", ")}
            </p>
          )}
          {event.type === "event" && (
            <p className="mt-2 text-sm text-slate-400">
              {tickets
                .filter((t) => t.quantity > 0)
                .map((t) => `${t.quantity}× ${t.label}`)
                .join(", ")}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            A confirmation has been sent to your email.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          type="button"
          onClick={() => navigate("/")}
          className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-500"
        >
          Back to Home
        </motion.button>
      </div>
    );
  }

  // ── Main booking layout ───────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="booking"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100"
      >
        <BookingHeader event={event} selectedCount={selectedCount} />

        <div className="flex-1 overflow-auto pb-28">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
            {/* ════════════════════════════════════════════════
                MOVIE — full theater always visible
                Left: category filter panel
                Right: complete seat layout (all 12 rows)
            ════════════════════════════════════════════════ */}
            {event.type === "movie" && (
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Left panel: category filter */}
                <aside className="lg:sticky lg:top-6 lg:h-fit">
                  <MovieCategoryPanel
                    categories={event.priceCategories}
                    rows={movieRows}
                    selectedCategoryId={selectedMovieCategory}
                    selectedSeatIds={movieSelectedSeatIds}
                    onSelectCategory={handleMovieCategorySelect}
                  />
                </aside>

                {/* Right panel: full theater (always shown) */}
                <main>
                  <AnimatePresence mode="wait">
                    {movieRows.length === 0 ? (
                      <motion.div
                        key="loading"
                        className="flex h-60 items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="theater"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {/* Category context banner */}
                        <AnimatePresence mode="wait">
                          {selectedMovieCategory !== null && (
                            <motion.div
                              key={selectedMovieCategory}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-4 overflow-hidden"
                            >
                              <div className="flex items-center justify-between rounded-xl border border-brand-500/30 bg-brand-50 px-4 py-2.5 dark:bg-brand-950/30">
                                <p className="text-xs text-brand-700 dark:text-brand-300">
                                  Showing:{" "}
                                  <span className="font-bold">
                                    {event.priceCategories.find(
                                      (c) => c.id === selectedMovieCategory,
                                    )?.label ?? ""}{" "}
                                    seats
                                  </span>{" "}
                                  — other categories are dimmed
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMovieCategorySelect(null)
                                  }
                                  className="text-[10px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                >
                                  Clear filter ×
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <MovieTheaterLayout
                          rows={movieRows}
                          priceCategories={event.priceCategories}
                          selectedCategoryId={selectedMovieCategory}
                          selectedSeatIds={movieSelectedSeatIds}
                          onToggleSeat={handleToggleMovieSeat}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                SPORTS — accordion + stadium map OR section view
                ORIENTATION: pitch ALWAYS at bottom of section view
            ════════════════════════════════════════════════ */}
            {event.type === "sports" && (
              <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Left panel: sports category accordion */}
                <aside className="lg:sticky lg:top-6 lg:h-fit lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto lg:pr-1">
                  <CategoryAccordion
                    categories={event.priceCategories}
                    sections={sportsSections}
                    activeCategoryId={activeCategoryId}
                    activeSectionId={activeSection?.id ?? null}
                    onToggleCategory={handleToggleSportsCategory}
                    onSelectSection={(section) =>
                      handleSelectSportsSection(section)
                    }
                  />
                </aside>

                {/* Right panel */}
                <main className="min-h-[480px]">
                  <AnimatePresence mode="wait">
                    {/* Stadium map overview — shown when no section is selected */}
                    {!activeSection && (
                      <motion.div
                        key="stadium-map"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <p className="text-sm text-slate-400">
                          Select a category on the left, then click a block to
                          see seats
                        </p>
                        <StadiumLayout
                          blocks={stadiumBlocks}
                          selectedBlockId={null}
                          highlightTier={activeCategoryId}
                          onSelectBlock={(blockId) =>
                            handleSelectSportsSection(blockId)
                          }
                        />
                      </motion.div>
                    )}

                    {/* Section seat view — PITCH ALWAYS AT BOTTOM */}
                    {activeSection && (
                      <motion.div
                        key={activeSection.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {/* Back-to-map control */}
                        <div className="mb-4 flex items-center justify-between">
                          <motion.button
                            type="button"
                            onClick={() => setActiveSection(null)}
                            whileHover={{ x: -2 }}
                            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                            Back to stadium map
                          </motion.button>

                          {/* Orientation badge */}
                        </div>

                        {/* Section seats */}
                        {currentSectionSeats.length === 0 ? (
                          <div className="flex h-60 items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent"
                            />
                          </div>
                        ) : (
                          <StadiumSectionView
                            section={activeSection}
                            seats={currentSectionSeats}
                            selectedSeatIds={sportsSelectedSeatIds}
                            onToggleSeat={handleToggleSportsSeat}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                EVENT / CONCERT — ticket quantity selection
            ════════════════════════════════════════════════ */}
            {event.type === "event" && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Choose your tickets
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {event.venue} · {event.date}
                  </p>
                </div>
                <TicketSelector
                  tickets={tickets}
                  onUpdate={handleTicketUpdate}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky bottom summary bar ─────────────────────────────── */}
        <BookingSummary
          eventType={event.type}
          selectedSeats={summarySeats}
          tickets={tickets}
          totalPrice={totalPrice}
          onProceed={handleProceed}
        />

        {/* ── Auth gate ── */}
        <Toast
          isVisible={showAuthToast}
          message="Sign in required"
          subMessage="Please log in to confirm your booking."
          variant="warning"
          onDismiss={() => setShowAuthToast(false)}
        />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsLoginModalOpen(false);
            setIsSuccess(true);
          }}
          contextMessage={
            selectedCount > 0
              ? `to confirm your ${selectedCount} ticket${selectedCount === 1 ? "" : "s"}`
              : `to book ${event.title}`
          }
        />
      </motion.div>
    </AnimatePresence>
  );
}
