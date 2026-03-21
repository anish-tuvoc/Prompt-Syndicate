import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  /** Short context line shown under the title, e.g. "to book Coldplay – Music of the Spheres" */
  contextMessage?: string;
}

export function LoginModal({ isOpen, onSuccess, onClose, contextMessage }: LoginModalProps) {
  const { mockLogin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailInvalid =
    touched && (
      !email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    );

  function resetForm() {
    setName("");
    setEmail("");
    setTouched(false);
    setIsLoading(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSuccess(email: string, name?: string) {
    mockLogin(email, name);
    setIsLoading(false);
    resetForm();
    onSuccess();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    setIsLoading(true);
    // Simulate brief network round-trip
    setTimeout(() => handleSuccess(email.trim(), name.trim() || undefined), 750);
  }

  function handleGoogleLogin() {
    setIsLoading(true);
    setTimeout(() => handleSuccess("user@gmail.com", "Google User"), 500);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="login-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            key="login-card"
            initial={{ opacity: 0, scale: 0.88, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 28 }}
            transition={{ type: "spring", stiffness: 310, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/70"
          >
            {/* Top accent gradient bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-brand-700 via-brand-400 to-violet-400" />

            <div className="p-6">
              {/* ── Header ──────────────────────────────────────────── */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                      </svg>
                    </span>
                    <span className="text-base font-extrabold text-white">
                      Ticket<span className="text-brand-400">Hub</span>
                    </span>
                  </div>
                  <h2 className="text-[17px] font-bold text-slate-100">Sign in to continue</h2>
                  {contextMessage && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-brand-400">{contextMessage}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  aria-label="Close"
                  className="mt-0.5 flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ── Google SSO ───────────────────────────────────────── */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50"
              >
                <GoogleSVG />
                Continue with Google
              </button>

              {/* ── Divider ──────────────────────────────────────────── */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">or</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* ── Email form ───────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Name&nbsp;<span className="font-normal normal-case text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setTouched(false); }}
                    onBlur={() => setTouched(true)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    className={[
                      "w-full rounded-xl border bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:ring-2 disabled:opacity-50",
                      emailInvalid
                        ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-700/70 focus:border-brand-500 focus:ring-brand-500/20",
                    ].join(" ")}
                  />
                  <AnimatePresence>
                    {emailInvalid && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 overflow-hidden text-xs text-red-400"
                      >
                        {!email.trim() ? "Email is required." : "Enter a valid email address."}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.97 }}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <SpinnerSVG />
                      Signing in…
                    </>
                  ) : (
                    "Continue →"
                  )}
                </motion.button>
              </form>

              <p className="mt-4 text-center text-[10px] text-slate-600">
                Demo app — any email works. No real data is stored.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoogleSVG() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function SpinnerSVG() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      className="block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
    />
  );
}
