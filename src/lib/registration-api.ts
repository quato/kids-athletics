import type {
  Event,
  RegistrationRequest,
  RegistrationResponse,
  OrderStatus,
} from "@/types/registration";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export interface EventsResponse {
  events: Event[];
  registrationOpen: boolean;
}

export async function fetchEvents(): Promise<EventsResponse> {
  return apiFetch<EventsResponse>("/api/events");
}

export async function createRegistration(
  payload: RegistrationRequest,
): Promise<RegistrationResponse> {
  return apiFetch<RegistrationResponse>("/api/registration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchOrderStatus(orderId: number): Promise<OrderStatus> {
  return apiFetch<OrderStatus>(`/api/registration-status?id=${orderId}`);
}
