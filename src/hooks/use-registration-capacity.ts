import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/registration-api";
import type { EventsResponse } from "@/lib/registration-api";

/**
 * Live capacity of the active fest, as reported by /api/events. Landing-page
 * sections use it so they stop inviting registrations that can no longer be made.
 * Shares the "events" query key with the registration form, so it costs no extra
 * request when a visitor moves between the two.
 */
export function useRegistrationCapacity() {
  const { data, isLoading } = useQuery<EventsResponse>({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  return {
    isLoading,
    /** Undefined until loaded, so callers can avoid flashing the wrong state. */
    childrenPlacesOpen: data ? data.registrationOpen : undefined,
    adultPlacesLeft: data?.adultPlacesLeft ?? 0,
  };
}
