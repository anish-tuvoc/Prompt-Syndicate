import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/useTheme";
import { useAuth } from "../context/useAuth";
import { LoginModal } from "./LoginModal";

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

export function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
    <LoginModal
      isOpen={isLoginOpen}
      onClose={() => setIsLoginOpen(false)}
      onSuccess={() => setIsLoginOpen(false)}
    />
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
            </svg>
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            Ticket<span className="text-brand-600">Hub</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 md:gap-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hidden text-sm font-medium transition md:block ${
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`
            }
          >
            Browse Events
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `hidden text-sm font-medium transition md:block ${
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`
              }
            >
              Admin
            </NavLink>
          )}

          {/* ── Logged-in user pill ── */}
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-600"
              >
                {/* Avatar */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {user.initials}
                </span>
                <span className="max-w-[100px] truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {user.name}
                </span>
                <svg
                  className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    {/* User info */}
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    {/* My Bookings */}
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); navigate("/bookings"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                      </svg>
                      My Bookings
                    </button>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); logout(); navigate("/"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* ── Sign In button → opens modal ── */
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-brand-600 hover:border-brand-600 hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-600 dark:hover:border-brand-600 dark:hover:text-white"
            >
              Sign In
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle colour theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition hover:border-slate-300 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </div>
    </header>
    </>
  );
}
