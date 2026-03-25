import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  buildMovieRowsFromApi,
  generateSportsSections,
  generateStadiumBlocks,
  generateTicketCategories,
  formatPrice,
} from "./service";
import { getEventSeats, lockSeat, unlockSeat, type SeatResponse } from "../../api/seats";
import { confirmBooking } from "../../api/bookings";
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
  const [sportsSeatsFromApi, setSportsSeatsFromApi] = useState<SeatResponse[]>(
    [],
  );
  const [sportsSelectedSeatIds, setSportsSelectedSeatIds] = useState<Set<string>>(
    new Set(),
  );

  // ── EVENT / CONCERT state ─────────────────────────────────────────────
  const [tickets, setTickets] = useState<EventTicketCategory[]>([]);

  // ── Success ───────────────────────────────────────────────────────────
  const [isSuccess, setIsSuccess] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [lockingInProgress, setLockingInProgress] = useState(false);

  // ── Fetch movie seats from API ─────────────────────────────────────
  const movieSelectedSeatIdsRef = useRef(movieSelectedSeatIds);
  movieSelectedSeatIdsRef.current = movieSelectedSeatIds;

  // Sports: used for expiry cleanup without recreating polling intervals.
  const sportsSelectedSeatIdsRef = useRef(sportsSelectedSeatIds);
  sportsSelectedSeatIdsRef.current = sportsSelectedSeatIds;

  const fetchMovieSeats = useCallback(async () => {
    if (!event || event.type !== "movie") return;
    try {
      const seats = await getEventSeats(event.id);
      // Auto-deselect seats whose locks have expired (status reverted to AVAILABLE)
      const selected = movieSelectedSeatIdsRef.current;
      if (selected.size > 0) {
        const seatMap = new Map(seats.map((s) => [s.id, s]));
        const expired: string[] = [];
        for (const id of selected) {
          const s = seatMap.get(id);
          // If seat is AVAILABLE in backend, our lock expired
          if (s && s.status === "AVAILABLE") expired.push(id);
        }
        if (expired.length > 0) {
          setMovieSelectedSeatIds((prev) => {
            const next = new Set(prev);
            for (const id of expired) next.delete(id);
            return next;
          });
        }
      }
      setMovieRows(buildMovieRowsFromApi(seats, event, movieSelectedSeatIdsRef.current));
    } catch {
      // Fallback on error
    }
  }, [event]);

  // ── Poll seat statuses every 3s for movies (see other users' locks) ──
  useEffect(() => {
    if (!event || event.type !== "movie") return;
    const interval = setInterval(fetchMovieSeats, 3000);
    return () => clearInterval(interval);
  }, [event, fetchMovieSeats]);

  // ── Fetch + poll sports seats (real locks live in backend) ─────────
  const parseSportsSeatIndex = (seatNumber: string): number => {
    // sports seat_number: "S####"
    const digits = seatNumber.replace(/\D/g, "");
    return parseInt(digits || "0", 10);
  };

  const fetchSportsSeats = useCallback(async () => {
    if (!event || event.type !== "sports") return;
    try {
      const seats = await getEventSeats(event.id);
      const sorted = [...seats].sort(
        (a, b) => parseSportsSeatIndex(a.seat_number) - parseSportsSeatIndex(b.seat_number),
      );

      // Auto-deselect seats whose locks expired (status reverted to AVAILABLE)
      const selected = sportsSelectedSeatIdsRef.current;
      if (selected.size > 0) {
        const seatMap = new Map(sorted.map((s) => [s.id, s]));
        const expired: string[] = [];
        for (const id of selected) {
          const s = seatMap.get(id);
          if (s && s.status === "AVAILABLE") expired.push(id);
        }
        if (expired.length > 0) {
          setSportsSelectedSeatIds((prev) => {
            const next = new Set(prev);
            for (const id of expired) next.delete(id);
            return next;
          });
        }
      }

      setSportsSeatsFromApi(sorted);
    } catch {
      // ignore (keep last state)
    }
  }, [event]);

  useEffect(() => {
    if (!event || event.type !== "sports") return;
    fetchSportsSeats();
    const interval = setInterval(fetchSportsSeats, 3000);
    return () => clearInterval(interval);
  }, [event, fetchSportsSeats]);

  // ── Real-time seat updates (WebSocket) ─────────────────────────────────
  useEffect(() => {
    if (!event || (event.type !== "movie" && event.type !== "sports")) return;

    const wsBase =
      import.meta.env.VITE_API_URL?.toString() ?? "http://localhost:8000";
    const wsUrlBase = wsBase.replace(/^http/, "ws");
    const wsUrl = `${wsUrlBase}/api/ws/seats/${event.id}`;

    const ws = new WebSocket(wsUrl);
    ws.onmessage = () => {
      // Refresh seat status immediately when someone locks/unlocks/bookeds.
      fetchMovieSeats();
      fetchSportsSeats();
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [event?.id, event?.type, fetchMovieSeats, fetchSportsSeats]);

  // ── Auth-guarded proceed handler — seats already locked, just confirm ──
  const handleProceed = useCallback(async () => {
    if (!isLoggedIn) {
      setShowAuthToast(true);
      setIsLoginModalOpen(true);
      return;
    }
    if (!event) return;

    if (event.type === "movie") {
      const selectedIds = Array.from(movieSelectedSeatIds);
      if (selectedIds.length === 0) return;

      setIsBooking(true);
      setBookingError("");
      try {
        // Re-lock to extend expiry before confirming
        for (const seatId of selectedIds) {
          await lockSeat(seatId);
        }
        // Confirm booking
        await confirmBooking(event.id, selectedIds);
        setIsSuccess(true);
      } catch (err) {
        setBookingError(err instanceof Error ? err.message : "Booking failed. Please try again.");
        // Payment/confirmation failed -> release locks best-effort.
        for (const seatId of selectedIds) {
          try {
            await unlockSeat(seatId);
          } catch {
            // ignore
          }
        }
        // Refresh seats to show updated state
        fetchMovieSeats();
      } finally {
        setIsBooking(false);
      }
    } else if (event.type === "sports") {
      // Sports
      const selectedIds = Array.from(sportsSelectedSeatIdsRef.current);
      if (selectedIds.length === 0) return;

      setIsBooking(true);
      setBookingError("");
      try {
        // Re-lock to extend expiry before confirming
        for (const seatId of selectedIds) {
          await lockSeat(seatId);
        }
        await confirmBooking(event.id, selectedIds);
        setIsSuccess(true);
      } catch (err) {
        setBookingError(err instanceof Error ? err.message : "Booking failed. Please try again.");
        for (const seatId of selectedIds) {
          try {
            await unlockSeat(seatId);
          } catch {
            // ignore
          }
        }
        fetchSportsSeats();
      } finally {
        setIsBooking(false);
      }
    } else {
      // Event / concert (mock ticket flow)
      setIsSuccess(true);
    }
  }, [isLoggedIn, event, movieSelectedSeatIds, fetchMovieSeats, fetchSportsSeats]);

  // ── Initialise by event type ──────────────────────────────────────────
  useEffect(() => {
    if (!event) return;
    if (event.type === "movie") {
      // Fetch real seats from backend
      fetchMovieSeats();
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

  // ── SPORTS seat mapping constants ───────────────────────────────────────
  const SPORTS_ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
  const SPORTS_ROW_SEAT_COUNTS = [8, 9, 10, 11, 12, 13, 14, 15] as const;
  const SPORTS_SEATS_PER_BLOCK = SPORTS_ROW_SEAT_COUNTS.reduce((a, b) => a + b, 0);

  const currentSectionSeats: SectionSeat[] = useMemo(() => {
    if (!event || !activeSection) return [];
    if (!sportsSeatsFromApi || sportsSeatsFromApi.length === 0) return [];

    const blockIndex = stadiumBlocks.findIndex((b) => b.id === activeSection.id);
    if (blockIndex < 0) return [];

    const start = blockIndex * SPORTS_SEATS_PER_BLOCK;
    const end = start + SPORTS_SEATS_PER_BLOCK;
    const blockSeats = sportsSeatsFromApi.slice(start, end);

    const price =
      event.priceCategories.find((c) => c.id === activeSection.categoryId)?.price ?? 0;

    // Map backend seat index → row/col positions expected by StadiumSectionView.
    const sectionSeats: SectionSeat[] = [];
    let cursor = 0;
    for (let rowIdx = 0; rowIdx < SPORTS_ROW_SEAT_COUNTS.length; rowIdx++) {
      const rowLabel = SPORTS_ROW_LABELS[rowIdx];
      const seatCount = SPORTS_ROW_SEAT_COUNTS[rowIdx];

      for (let col = 1; col <= seatCount; col++) {
        const seat = blockSeats[cursor];
        cursor += 1;
        if (!seat) continue;

        const isSelected = sportsSelectedSeatIds.has(seat.id);
        sectionSeats.push({
          id: seat.id,
          rowLabel,
          colIndex: col,
            status:
              seat.status === "AVAILABLE" ||
              (isSelected && seat.status === "LOCKED")
                ? "available"
                : "booked",
          price,
          categoryId: activeSection.categoryId,
        });
      }
    }

    return sectionSeats;
  }, [
    event,
    activeSection,
    sportsSeatsFromApi,
    stadiumBlocks,
    sportsSelectedSeatIds,
    SPORTS_SEATS_PER_BLOCK,
  ]);

  const sportsSelectedSeats = useMemo(() => {
    if (!event || sportsSeatsFromApi.length === 0) return [];
    if (sportsSelectedSeatIds.size === 0) return [];

    const idSet = sportsSelectedSeatIds;
    const selectedSeats: SectionSeat[] = [];

    for (let seatIndex = 0; seatIndex < sportsSeatsFromApi.length; seatIndex++) {
      const seat = sportsSeatsFromApi[seatIndex];
      if (!idSet.has(seat.id)) continue;

      const blockIndex = Math.floor(seatIndex / SPORTS_SEATS_PER_BLOCK);
      const withinBlock = seatIndex % SPORTS_SEATS_PER_BLOCK;
      const block = stadiumBlocks[blockIndex];
      if (!block) continue;

      // Convert within-block offset → (rowIdx, colIndex)
      let rem = withinBlock;
      let rowIdx = 0;
      for (; rowIdx < SPORTS_ROW_SEAT_COUNTS.length; rowIdx++) {
        const cnt = SPORTS_ROW_SEAT_COUNTS[rowIdx];
        if (rem < cnt) break;
        rem -= cnt;
      }

      const rowLabel = SPORTS_ROW_LABELS[rowIdx] ?? "A";
      const colIndex = rem + 1;

      selectedSeats.push({
        id: seat.id,
        rowLabel,
        colIndex,
        status: "available",
        price: block.price,
        categoryId: block.priceId,
      });
    }

    return selectedSeats;
  }, [
    event,
    sportsSeatsFromApi,
    sportsSelectedSeatIds,
    stadiumBlocks,
    SPORTS_SEATS_PER_BLOCK,
  ]);

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

  const handleToggleMovieSeat = useCallback(async (seatId: string) => {
    if (lockingInProgress) return;

    const isCurrentlySelected = movieSelectedSeatIds.has(seatId);

    if (!isLoggedIn) {
      // If not logged in, show auth modal on first seat click
      setShowAuthToast(true);
      setIsLoginModalOpen(true);
      return;
    }

    setLockingInProgress(true);
    try {
      if (isCurrentlySelected) {
        // Deselect → unlock
        await unlockSeat(seatId);
        setMovieSelectedSeatIds((prev) => {
          const next = new Set(prev);
          next.delete(seatId);
          return next;
        });
      } else {
        // Select → lock
        await lockSeat(seatId);
        setMovieSelectedSeatIds((prev) => {
          const next = new Set(prev);
          next.add(seatId);
          return next;
        });
      }
      // Refresh seats to get latest statuses
      fetchMovieSeats();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not lock seat";
      setBookingError(msg);
      fetchMovieSeats();
    } finally {
      setLockingInProgress(false);
    }
  }, [movieSelectedSeatIds, isLoggedIn, lockingInProgress, fetchMovieSeats]);

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

  const handleToggleSportsSeat = useCallback(
    async (seatId: string) => {
      if (lockingInProgress) return;

      const isCurrentlySelected = sportsSelectedSeatIdsRef.current.has(seatId);

      if (!isLoggedIn) {
        setShowAuthToast(true);
        setIsLoginModalOpen(true);
        return;
      }

      setLockingInProgress(true);
      try {
        if (isCurrentlySelected) {
          await unlockSeat(seatId);
          setSportsSelectedSeatIds((prev) => {
            const next = new Set(prev);
            next.delete(seatId);
            return next;
          });
        } else {
          await lockSeat(seatId);
          setSportsSelectedSeatIds((prev) => {
            const next = new Set(prev);
            next.add(seatId);
            return next;
          });
        }

        // Refresh to update statuses for this user's selection.
        await fetchSportsSeats();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not lock seat";
        setBookingError(msg);
        await fetchSportsSeats();
      } finally {
        setLockingInProgress(false);
      }
    },
    [lockingInProgress, isLoggedIn, fetchSportsSeats],
  );

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
        <BookingHeader
          event={event}
          selectedCount={selectedCount}
          onSessionExpire={() => {
            void (async () => {
              try {
                // Best-effort unlock on timeout so other users can proceed immediately.
                for (const seatId of movieSelectedSeatIdsRef.current) {
                  try {
                    await unlockSeat(seatId);
                  } catch {
                    // ignore
                  }
                }
                for (const seatId of sportsSelectedSeatIdsRef.current) {
                  try {
                    await unlockSeat(seatId);
                  } catch {
                    // ignore
                  }
                }
              } finally {
                navigate("/");
              }
            })();
          }}
        />

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
          isLoading={isBooking}
        />

        {/* ── Booking error ── */}
        <Toast
          isVisible={!!bookingError}
          message="Booking failed"
          subMessage={bookingError}
          variant="error"
          onDismiss={() => setBookingError("")}
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
            handleProceed();
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
