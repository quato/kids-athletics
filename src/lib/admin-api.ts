export interface OrderChild {
  childName: string;
  eventName: string;
}

export interface Order {
  id: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  parentName: string;
  phone: string;
  email: string;
  paymentCode: string;
  expectedAmount: number;
  children: OrderChild[];
}

export async function login(password: string): Promise<void> {
  const res = await fetch("/api/admin/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Невірний пароль");
  }
}

export interface AdminEvent {
  id: number;
  name: string;
  feeAmount: number;
}

export interface ManualRegistrationInput {
  parentName: string;
  phone: string;
  email: string;
  status: "paid" | "pending";
  note?: string;
  children: Array<{
    childName: string;
    birthYear?: number;
    eventId: number;
  }>;
}

export async function fetchAdminEvents(token: string): Promise<AdminEvent[]> {
  const res = await fetch("/api/admin/events", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося завантажити події");

  const data = (await res.json()) as { events: AdminEvent[] };
  return data.events;
}

export async function manualRegistration(
  token: string,
  input: ManualRegistrationInput,
): Promise<void> {
  const res = await fetch("/api/admin/manual-registration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Помилка при збереженні");
  }
}

export async function fetchOrders(token: string): Promise<Order[]> {
  const res = await fetch("/api/admin/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("Не вдалося завантажити реєстрації");
  }

  const data = (await res.json()) as { orders: Order[] };
  return data.orders;
}
