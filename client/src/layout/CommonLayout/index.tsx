import { Outlet } from "react-router-dom";
import { Navbar } from "../../components/Navbar";

export function CommonLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-slate-200 py-8 text-center dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-500">
          &copy; {new Date().getFullYear()} TicketHub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
