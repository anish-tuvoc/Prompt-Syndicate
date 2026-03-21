import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string;
  subMessage?: string;
  isVisible: boolean;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. Default: 3500 */
  duration?: number;
  variant?: "info" | "warning" | "error" | "success";
}

const VARIANT_STYLES = {
  info:    "border-brand-500/40 bg-slate-900 text-brand-300",
  warning: "border-amber-500/40 bg-slate-900 text-amber-300",
  error:   "border-red-500/40 bg-slate-900 text-red-300",
  success: "border-emerald-500/40 bg-slate-900 text-emerald-300",
};

const ICON_COLORS = {
  info:    "text-brand-400",
  warning: "text-amber-400",
  error:   "text-red-400",
  success: "text-emerald-400",
};

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

export function Toast({
  message,
  subMessage,
  isVisible,
  onDismiss,
  duration = 3500,
  variant = "warning",
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [isVisible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: -20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed left-1/2 top-5 z-[70] -translate-x-1/2"
          role="alert"
          aria-live="assertive"
        >
          <div
            className={`flex min-w-[260px] max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-md ${VARIANT_STYLES[variant]}`}
          >
            {/* Icon */}
            <span className={`mt-0.5 shrink-0 ${ICON_COLORS[variant]}`}>
              <LockIcon className="h-4 w-4" />
            </span>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{message}</p>
              {subMessage && (
                <p className="mt-0.5 text-[11px] text-slate-400">{subMessage}</p>
              )}
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="ml-1 mt-0.5 shrink-0 rounded p-0.5 text-slate-500 transition hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`mt-1 h-0.5 origin-left rounded-full ${
              variant === "warning" ? "bg-amber-400/60" : "bg-brand-400/60"
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
