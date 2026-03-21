import { useNavigate } from "react-router-dom";
import type { EventData } from "../../data/events";
import { BookingTimer } from "./BookingTimer";

interface BookingHeaderProps {
  event: EventData;
  selectedCount: number;
  onSessionExpire?: () => void;
}

export function BookingHeader({ event, selectedCount, onSessionExpire }: BookingHeaderProps) {
  const navigate = useNavigate();

  const formattedDate = new Date(event.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Left: back + event info */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/event/${event.id}`)}
            aria-label="Back to event"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white md:text-base">
              {event.title}
            </h1>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {formattedDate} &middot; {event.time} &middot; {event.venue}
            </p>
          </div>
        </div>

        {/* Right: selected count + timer */}
        <div className="flex shrink-0 items-center gap-3">
          {selectedCount > 0 && (
            <span className="hidden rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 sm:inline">
              {selectedCount} selected
            </span>
          )}
          <BookingTimer onExpire={onSessionExpire} />
        </div>
      </div>
    </header>
  );
}
