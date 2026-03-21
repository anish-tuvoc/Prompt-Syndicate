import { api } from './client';
import type { EventData, PriceCategory } from '../data/events';

interface ApiEventResponse {
  id: string;
  title: string;
  image: string | null;
  rating: number;
  description: string | null;
  location: string | null;
  venue: string | null;
  date: string;
  time: string | null;
  category: string | null;
  featured: boolean;
  price: number;
  duration: string | null;
  language: string | null;
  tags: string[];
  total_seats: number;
  event_type: string | null;
  price_categories: PriceCategory[];
  created_at: string;
}

export interface EventPayload {
  title: string;
  image?: string | null;
  rating?: number;
  description?: string | null;
  location?: string | null;
  venue?: string | null;
  date: string;
  time?: string | null;
  category?: string | null;
  featured?: boolean;
  price?: number;
  duration?: string | null;
  language?: string | null;
  tags?: string[];
  total_seats?: number;
  event_type?: string | null;
  price_categories?: PriceCategory[];
}

function mapApiEvent(e: ApiEventResponse): EventData {
  return {
    id: e.id,
    title: e.title,
    image: e.image ?? '',
    rating: e.rating ?? 0,
    description: e.description ?? '',
    location: e.location ?? '',
    venue: e.venue ?? '',
    date: e.date,
    time: e.time ?? '',
    category: (e.category ?? 'Concert') as EventData['category'],
    featured: e.featured ?? false,
    price: e.price ?? 0,
    duration: e.duration ?? '',
    language: e.language ?? '',
    tags: e.tags ?? [],
    totalSeats: e.total_seats ?? 0,
    type: (e.event_type ?? 'event') as EventData['type'],
    priceCategories: e.price_categories ?? [],
  };
}

export async function fetchEvents(): Promise<EventData[]> {
  const data = await api.get<ApiEventResponse[]>('/events/');
  return data.map(mapApiEvent);
}

export async function fetchEventsFiltered(filters: { q?: string; venue?: string; category?: string }): Promise<EventData[]> {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.venue) query.set("venue", filters.venue);
  if (filters.category) query.set("category", filters.category);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await api.get<ApiEventResponse[]>(`/events/${suffix}`);
  return data.map(mapApiEvent);
}

export async function fetchEvent(eventId: string): Promise<EventData | null> {
  try {
    const data = await api.get<ApiEventResponse>(`/events/${eventId}`);
    return mapApiEvent(data);
  } catch {
    return null;
  }
}

export async function createEvent(payload: EventPayload) {
  const data = await api.post<ApiEventResponse>("/events/", payload);
  return mapApiEvent(data);
}

export async function updateEvent(eventId: string, payload: EventPayload) {
  const data = await api.put<ApiEventResponse>(`/events/${eventId}`, payload);
  return mapApiEvent(data);
}

export async function deleteEvent(eventId: string) {
  return api.delete<{ ok: boolean }>(`/events/${eventId}`);
}
