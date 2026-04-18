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
  monoTransactionId: string | null;
  children: OrderChild[];
}

export interface AdminOrdersData {
  orders: Order[];
  registeredChildren: number;
  childrenLimit: number;
  remainingPlaces: number;
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
  const res = await fetch("/api/admin/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, ...fields }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося оновити замовлення");
}

export async function deleteOrder(token: string, orderId: number): Promise<void> {
  const res = await fetch("/api/admin/update", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 409) throw new Error("Не можна видалити оплачене замовлення");
  if (!res.ok) throw new Error("Не вдалося видалити запис");
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
  const res = await fetch("/api/admin/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ childId, ...fields }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося оновити дані дитини");
}

export interface UnlinkedTransaction {
  id: string;
  receivedAt: string;
  time?: number;
  description: string;
  comment: string | null;
  counterName: string | null;
  amount: number;
  rawPayload: Record<string, unknown>;
}

export interface LinkedTransaction {
  orderId: number;
  parentName: string;
  phone: string;
  email: string;
  paymentCode: string;
  expectedAmount: number;
  actualAmount: number;
  amountMatch: boolean;
  paidAt: string;
  transactionId: string;
  description: string | null;
  comment: string | null;
  counterName: string | null;
  rawStatement: Record<string, unknown> | null;
}

export async function fetchLinkedTransactions(token: string): Promise<LinkedTransaction[]> {
  const res = await fetch("/api/admin/transactions?linked=true", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося завантажити прив'язані платежі");
  const data = (await res.json()) as { linked: LinkedTransaction[] };
  return data.linked;
}

export async function fetchUnlinkedTransactions(token: string): Promise<UnlinkedTransaction[]> {
  const res = await fetch("/api/admin/transactions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося завантажити транзакції");
  const data = (await res.json()) as { transactions: UnlinkedTransaction[] };
  return data.transactions;
}

export async function unlinkTransaction(token: string, orderId: number): Promise<void> {
  const res = await fetch("/api/admin/transactions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Не вдалося відв'язати транзакцію");
  }
}

export async function linkTransaction(
  token: string,
  orderId: number,
  transactionId: string,
): Promise<void> {
  const res = await fetch("/api/admin/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, transactionId }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Не вдалося зв'язати транзакцію");
  }
}

export interface WebhookEvent {
  id: number;
  eventType: string;
  account: string | null;
  statementItemId: string | null;
  processed: boolean;
  processedAt: string | null;
  error: string | null;
  payload: Record<string, unknown>;
  receivedAt: string;
}

export async function fetchWebhooks(token: string, limit = 100): Promise<WebhookEvent[]> {
  const res = await fetch(`/api/admin/transactions?tab=webhooks&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Не вдалося завантажити логи webhooks");
  const data = (await res.json()) as { events: WebhookEvent[] };
  return data.events;
}

export async function fetchOrders(token: string): Promise<AdminOrdersData> {
  const res = await fetch("/api/admin/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("Не вдалося завантажити реєстрації");
  }

  return (await res.json()) as AdminOrdersData;
}
