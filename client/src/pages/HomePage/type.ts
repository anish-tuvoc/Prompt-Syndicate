import type { EventData, EventCategory } from "../../data/events";

export type { EventCategory };

export interface HomePageState {
  events: EventData[];
  featuredEvents: EventData[];
  isLoading: boolean;
}
