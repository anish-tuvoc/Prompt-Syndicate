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

export async function fetchEvent(eventId: string): Promise<EventData | null> {
  try {
    const data = await api.get<ApiEventResponse>(`/events/${eventId}`);
    return mapApiEvent(data);
  } catch {
    return null;
  }
}
