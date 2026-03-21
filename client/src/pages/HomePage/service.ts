import { EVENTS, type EventData } from "../../data/events";
import type { SortOption } from "../../components/FilterBar";
import type { CategoryFilter } from "../../components/FilterBar";

export function getAllEvents(): EventData[] {
  return EVENTS;
}

export function getFeaturedEvents(): EventData[] {
  return EVENTS.filter((e) => e.featured);
}

export function filterAndSortEvents(
  events: EventData[],
  category: CategoryFilter,
  sort: SortOption,
): EventData[] {
  const filtered =
    category === "All" ? events : events.filter((e) => e.category === category);

  return [...filtered].sort((a, b) => {
    if (sort === "rating")      return b.rating - a.rating;
    if (sort === "price-asc")   return a.price - b.price;
    if (sort === "price-desc")  return b.price - a.price;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}
