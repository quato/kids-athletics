export interface OrderChild {
  id: number;
  childName: string;
  birthYear: number;
  eventName: string;
  startNumber: number | null;
  isPresent: boolean | null;
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

export async function updateOrder(
  token: string,
  orderId: number,
  fields: {
    status?: "paid" | "pending";
    parentName?: string;
    phone?: string;
    email?: string;
  },
): Promise<void> {
  const res = await fetch("/api/admin/update-order", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, ...fields }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося оновити замовлення");
}

/** @deprecated use updateOrder */
export async function updateOrderStatus(
  token: string,
  orderId: number,
  status: "paid" | "pending",
): Promise<void> {
  return updateOrder(token, orderId, { status });
}

export async function updateChild(
  token: string,
  childId: number,
  fields: {
    startNumber?: number | null;
    isPresent?: boolean | null;
    childName?: string;
    birthYear?: number;
  },
): Promise<void> {
  const res = await fetch("/api/admin/update-child", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ childId, ...fields }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося оновити дані дитини");
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
