import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  contextMessage?: string;
}

export function LoginModal({ isOpen, onSuccess, onClose, contextMessage }: LoginModalProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailInvalid =
    touched && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
  const passwordInvalid = touched && password.length < 4;

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setTouched(false);
    setIsLoading(false);
  }

  function handleClose() {
    resetForm();
    setMode("signin");
    onClose();
  }

  function toggleMode() {
    resetForm();
    setMode((m) => (m === "signin" ? "signup" : "signin"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    if (password.length < 4) return;
    if (mode === "signup" && !name.trim()) return;

    setIsLoading(true);
    try {
      if (mode === "signin") {
        await login(email.trim(), password);
      } else {
        await signup(name.trim(), email.trim(), password);
      }
      resetForm();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:ring-2 disabled:opacity-50";
  const validBorder = "border-slate-700/70 focus:border-brand-500 focus:ring-brand-500/20";
  const errorBorder = "border-red-500/70 focus:border-red-500 focus:ring-red-500/20";

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
            <div className="h-0.5 w-full bg-gradient-to-r from-brand-700 via-brand-400 to-violet-400" />

            <div className="p-6">
              {/* Header */}
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
                  <h2 className="text-[17px] font-bold text-slate-100">
                    {mode === "signin" ? "Sign in to continue" : "Create your account"}
                  </h2>
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

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {/* Name — only on signup */}
                {mode === "signup" && (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      disabled={isLoading}
                      className={`${inputClass} ${touched && !name.trim() ? errorBorder : validBorder}`}
                    />
                    <AnimatePresence>
                      {touched && !name.trim() && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1.5 overflow-hidden text-xs text-red-400"
                        >
                          Name is required.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

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
                    className={`${inputClass} ${emailInvalid ? errorBorder : validBorder}`}
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

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    disabled={isLoading}
                    className={`${inputClass} ${passwordInvalid ? errorBorder : validBorder}`}
                  />
                  <AnimatePresence>
                    {passwordInvalid && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 overflow-hidden text-xs text-red-400"
                      >
                        Password must be at least 4 characters.
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
                      {mode === "signin" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </motion.button>
              </form>

              {/* Toggle sign in / sign up */}
              <p className="mt-4 text-center text-xs text-slate-400">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={isLoading}
                  className="font-semibold text-brand-400 transition hover:text-brand-300 disabled:opacity-50"
                >
                  {mode === "signin" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
