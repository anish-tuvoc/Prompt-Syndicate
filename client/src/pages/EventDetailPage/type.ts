import type { EventData } from "../../data/events";

export type { EventData };

export interface EventDetailPageState {
  event: EventData | null;
  showBookingModal: boolean;
}
