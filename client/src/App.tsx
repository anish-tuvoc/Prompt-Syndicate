import { Navigate, Route, Routes } from "react-router-dom";
import { CommonLayout } from "./layout/CommonLayout";
import { EventDetailPage } from "./pages/EventDetailPage";
import { HomePage } from "./pages/HomePage";
import { BookingPage } from "./pages/BookingPage";

function App() {
  return (
    <Routes>
      <Route element={<CommonLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
      </Route>
      {/* Booking page has its own full-screen layout */}
      <Route path="/event/:id/book" element={<BookingPage />} />
      {/* Redirect /auth and anything unknown back to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
