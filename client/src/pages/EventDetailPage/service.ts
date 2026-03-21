import { EVENTS, type EventData } from "../../data/events";
import { fetchEvent, fetchEvents } from "../../api/events";

export function getEventById(id: string): EventData | null {
  return EVENTS.find((e) => e.id === id) ?? null;
}

export function getRelatedEvents(id: string, limit = 4): EventData[] {
  const event = getEventById(id);
  if (!event) return [];
  return EVENTS.filter((e) => e.id !== id && e.category === event.category).slice(0, limit);
}

export async function getEventByIdFromApi(id: string): Promise<EventData | null> {
  try {
    return await fetchEvent(id);
  } catch {
    return getEventById(id);
  }
}

export async function getRelatedEventsFromApi(id: string, limit = 4): Promise<EventData[]> {
  try {
    const event = await fetchEvent(id);
    if (!event) return [];
    const all = await fetchEvents();
    return all.filter((e) => e.id !== id && e.category === event.category).slice(0, limit);
  } catch {
    return getRelatedEvents(id, limit);
  }
}
