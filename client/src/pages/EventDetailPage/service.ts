import { EVENTS, type EventData } from "../../data/events";

export function getEventById(id: string): EventData | null {
  return EVENTS.find((e) => e.id === id) ?? null;
}

export function getRelatedEvents(id: string, limit = 4): EventData[] {
  const event = getEventById(id);
  if (!event) return [];
  return EVENTS.filter((e) => e.id !== id && e.category === event.category).slice(0, limit);
}
