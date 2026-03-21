import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DURATION_SECONDS = 4 * 60;

export function BookingTimer() {
  const [remaining, setRemaining] = useState(DURATION_SECONDS);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    const id = setInterval(() => setRemaining((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 60 && !expired;

  return (
    <AnimatePresence mode="wait">
      {expired ? (
        <motion.div
          key="expired"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
        >
          Time's up!
        </motion.div>
      ) : (
        <motion.div
          key="timer"
          animate={isWarning ? { scale: [1, 1.05, 1] } : {}}
          transition={isWarning ? { repeat: Infinity, duration: 1 } : {}}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold tabular-nums ${
            isWarning
              ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}
        >
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
