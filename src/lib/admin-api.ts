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
