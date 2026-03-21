import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getEventByIdFromApi } from "../EventDetailPage/service";
import { BookingHeader } from "../../components/booking/BookingHeader";
import { SeatGrid } from "../../components/booking/SeatGrid";
import { StadiumLayout } from "../../components/booking/StadiumLayout";
import { PriceAccordion } from "../../components/booking/PriceAccordion";
import { TicketSelector } from "../../components/booking/TicketSelector";
import { BookingSummary } from "../../components/booking/BookingSummary";
import {
  generateMovieRows,
  generateStadiumBlocks,
  generateTicketCategories,
  formatPrice,
} from "./service";
import type { EventData } from "../../data/events";
import type { MovieRow, StadiumBlock, EventTicketCategory, MovieSeat } from "./type";

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventData | null>(null);
  useEffect(() => {
    if (!id) return;
    getEventByIdFromApi(id).then((ev) => {
      setEvent(ev);
    });
  }, [id]);

  // ── Movie state ────────────────────────────────────────────
  const [movieRows, setMovieRows] = useState<MovieRow[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  // ── Sports state ───────────────────────────────────────────
  const [stadiumBlocks, setStadiumBlocks] = useState<StadiumBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [blockQuantity, setBlockQuantity] = useState(1);
  const [activeTier, setActiveTier] = useState<string | null>(null);

  // ── Event/Concert state ────────────────────────────────────
  const [tickets, setTickets] = useState<EventTicketCategory[]>([]);

  // ── UI state ───────────────────────────────────────────────
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!event) return;
    if (event.type === "movie")  setMovieRows(generateMovieRows(event));
    if (event.type === "sports") setStadiumBlocks(generateStadiumBlocks(event));
    if (event.type === "event")  setTickets(generateTicketCategories(event));
  }, [event]);

  const allSeats = useMemo(() => movieRows.flatMap((r) => r.seats), [movieRows]);

  const selectedSeatsData = useMemo<MovieSeat[]>(
    () => allSeats.filter((s) => selectedSeats.has(s.id)),
    [allSeats, selectedSeats],
  );

  const selectedBlock = useMemo(
    () => stadiumBlocks.find((b) => b.id === selectedBlockId) ?? null,
    [stadiumBlocks, selectedBlockId],
  );

  const totalPrice = useMemo(() => {
    if (!event) return 0;
    if (event.type === "movie")  return selectedSeatsData.reduce((s, seat) => s + seat.price, 0);
    if (event.type === "sports") return (selectedBlock?.price ?? 0) * blockQuantity;
    return tickets.reduce((s, t) => s + t.price * t.quantity, 0);
  }, [event, selectedSeatsData, selectedBlock, blockQuantity, tickets]);

  const selectedCount = useMemo(() => {
    if (!event) return 0;
    if (event.type === "movie")  return selectedSeats.size;
    if (event.type === "sports") return selectedBlockId ? blockQuantity : 0;
    return tickets.reduce((s, t) => s + t.quantity, 0);
  }, [event, selectedSeats.size, selectedBlockId, blockQuantity, tickets]);

  function handleToggleSeat(seatId: string) {
    setSelectedSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  }

  function handleSelectBlock(blockId: string) {
    setSelectedBlockId((prev) => (prev === blockId ? null : blockId));
    setBlockQuantity(1);
  }

  function handleTicketUpdate(ticketId: string, delta: number) {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const qty = Math.max(0, Math.min(t.maxPerBooking, t.available, t.quantity + delta));
        return { ...t, quantity: qty };
      }),
    );
  }

  function handleProceed() {
    setIsSuccess(true);
  }

  // ── Not found ──────────────────────────────────────────────
  if (!event) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
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

  // ── Success screen ─────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
        >
          <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Booking Confirmed!</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{event.title}</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{formatPrice(totalPrice)}</p>
          {event.type === "movie" && selectedSeatsData.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Seats: {selectedSeatsData.map((s) => s.id).join(", ")}
            </p>
          )}
          {event.type === "sports" && selectedBlock && (
            <p className="mt-2 text-sm text-slate-500">
              Block {selectedBlock.label} — {blockQuantity} seat{blockQuantity > 1 ? "s" : ""}
            </p>
          )}
          {event.type === "event" && (
            <p className="mt-2 text-sm text-slate-500">
              {tickets.filter((t) => t.quantity > 0).map((t) => `${t.quantity}× ${t.label}`).join(", ")}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">A confirmation has been sent to your email.</p>
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

  // ── Main booking page ──────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="booking"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex min-h-screen flex-col"
      >
        <BookingHeader event={event} selectedCount={selectedCount} />

        <div className="flex-1 overflow-auto pb-24">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">

            {/* ── MOVIE BOOKING ─────────────────────────────── */}
            {event.type === "movie" && (
              <SeatGrid
                rows={movieRows}
                selectedSeats={selectedSeats}
                onToggleSeat={handleToggleSeat}
                priceCategories={event.priceCategories}
              />
            )}

            {/* ── SPORTS BOOKING ────────────────────────────── */}
            {event.type === "sports" && (
              <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                <div className="space-y-2">
                  <PriceAccordion
                    categories={event.priceCategories}
                    blocks={stadiumBlocks}
                    activeTier={activeTier}
                    onSelectTier={setActiveTier}
                  />
                  {selectedBlock && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-xl border border-emerald-600/40 bg-emerald-600/10 p-4"
                    >
                      <p className="text-sm font-semibold text-emerald-400">
                        Selected: Block {selectedBlock.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {selectedBlock.availableSeats} seats available &middot;{" "}
                        {formatPrice(selectedBlock.price)}/seat
                      </p>
                    </motion.div>
                  )}
                </div>

                <StadiumLayout
                  blocks={stadiumBlocks}
                  selectedBlockId={selectedBlockId}
                  highlightTier={activeTier}
                  onSelectBlock={handleSelectBlock}
                />
              </div>
            )}

            {/* ── EVENT / CONCERT BOOKING ───────────────────── */}
            {event.type === "event" && (
              <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Choose your tickets
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {event.title} &middot; {event.venue}
                  </p>
                </div>
                <TicketSelector tickets={tickets} onUpdate={handleTicketUpdate} />
              </div>
            )}
          </div>
        </div>

        {/* ── BOOKING SUMMARY BAR ─────────────────────────────── */}
        {event.type === "movie" && (
          <BookingSummary
            type="movie"
            selectedSeats={selectedSeatsData}
            totalPrice={totalPrice}
            onProceed={handleProceed}
          />
        )}
        {event.type === "sports" && (
          <BookingSummary
            type="sports"
            selectedBlock={selectedBlock}
            blockQuantity={blockQuantity}
            onBlockQuantityChange={setBlockQuantity}
            totalPrice={totalPrice}
            onProceed={handleProceed}
          />
        )}
        {event.type === "event" && (
          <BookingSummary
            type="event"
            tickets={tickets}
            totalPrice={totalPrice}
            onProceed={handleProceed}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
