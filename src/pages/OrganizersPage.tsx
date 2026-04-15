import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Phone, Mail, ChevronDown, ChevronUp, LogOut, Loader2, Users, CheckCircle2, Clock, Banknote, PlusCircle, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { login, fetchOrders, fetchAdminEvents, manualRegistration } from "@/lib/admin-api";
import type { Order, AdminEvent } from "@/lib/admin-api";

const STORAGE_KEY = "organizer_token";

function useToken() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const save = (t: string) => {
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  };

  return { token, save, clear };
}

// ── Login form ─────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(password);
      onSuccess(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка входу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h1 className="font-heading font-black text-2xl text-foreground">Організатори</h1>
              <p className="text-sm text-muted-foreground">Введіть пароль для доступу</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || !password}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Увійти
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success">
        <CheckCircle2 className="w-3 h-3" /> Оплачено
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
      <Clock className="w-3 h-3" /> Очікує
    </span>
  );
}

// ── Order row ───────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(order.createdAt).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{date}</td>
        <td className="px-3 py-3 font-semibold text-foreground text-sm">{order.parentName}</td>
        <td className="px-3 py-3 text-sm">
          <a
            href={`tel:${order.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Phone className="w-3 h-3" />
            {order.phone}
          </a>
        </td>
        <td className="px-3 py-3 text-sm hidden md:table-cell">
          <a
            href={`mailto:${order.email}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Mail className="w-3 h-3" />
            {order.email}
          </a>
        </td>
        <td className="px-3 py-3 text-center text-sm text-muted-foreground">{order.children.length}</td>
        <td className="px-3 py-3 text-sm font-semibold text-secondary whitespace-nowrap">
          {order.expectedAmount} грн
        </td>
        <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
        <td className="px-3 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">
          {order.paymentCode}
        </td>
        <td className="px-3 py-3 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/30 border-b border-border">
          <td colSpan={9} className="px-4 py-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Діти</p>
              {order.children.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{c.childName}</span>
                  <span className="text-muted-foreground">— {c.eventName}</span>
                </div>
              ))}
              {order.children.length === 0 && (
                <p className="text-sm text-muted-foreground">Немає даних про дітей</p>
              )}
              <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Email: <a href={`mailto:${order.email}`} className="text-primary hover:underline">{order.email}</a></span>
                <span>Код платежу: <span className="font-mono font-bold text-foreground">{order.paymentCode}</span></span>
                {order.paidAt && (
                  <span>Оплачено: {new Date(order.paidAt).toLocaleString("uk-UA")}</span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Manual registration modal ───────────────────────────────────────────────

interface ChildRow {
  childName: string;
  birthYear: string;
  eventId: number;
}

function ManualRegistrationModal({
  token,
  events,
  onClose,
  onSuccess,
}: {
  token: string;
  events: AdminEvent[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [note, setNote] = useState("");
  const [children, setChildren] = useState<ChildRow[]>([
    { childName: "", birthYear: "", eventId: events[0]?.id ?? 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addChild = () =>
    setChildren((prev) => [...prev, { childName: "", birthYear: "", eventId: events[0]?.id ?? 0 }]);

  const removeChild = (i: number) =>
    setChildren((prev) => prev.filter((_, idx) => idx !== i));

  const updateChild = (i: number, field: keyof ChildRow, value: string | number) =>
    setChildren((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await manualRegistration(token, {
        parentName,
        phone,
        email,
        status,
        note: note.trim() || undefined,
        children: children.map((c) => ({
          childName: c.childName,
          birthYear: parseInt(c.birthYear, 10),
          eventId: c.eventId,
        })),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg text-foreground">Ручна реєстрація</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                Ім'я батька/матері *
              </label>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Іваненко Олена"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                  Телефон *
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380501234567"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Діти ({children.length})
            </p>
            {children.map((child, i) => (
              <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">Дитина {i + 1}</span>
                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={child.childName}
                    onChange={(e) => updateChild(i, "childName", e.target.value)}
                    placeholder="Ім'я дитини"
                    required
                  />
                  <Input
                    value={child.birthYear}
                    onChange={(e) => updateChild(i, "birthYear", e.target.value)}
                    placeholder="Рік народж. *"
                    type="number"
                    min={2000}
                    max={2025}
                    required
                  />
                </div>
                <select
                  value={child.eventId}
                  onChange={(e) => updateChild(i, "eventId", parseInt(e.target.value, 10))}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} — {ev.feeAmount} грн
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={addChild}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary border border-dashed border-border rounded-xl py-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Додати ще дитину
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Статус оплати</p>
            <div className="flex gap-3">
              {(["paid", "pending"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-semibold">
                    {s === "paid" ? "✅ Оплачено" : "⏳ Очікує оплату"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              Примітка (необов'язково)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Наприклад: оплата готівкою на місці"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !parentName || !phone || children.some((c) => !c.birthYear)}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Зберегти
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Stats card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, className }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div className={`bg-card rounded-xl shadow p-4 flex items-center gap-3 ${className ?? ""}`}>
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-lg text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────

type Filter = "all" | "pending" | "paid";

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: orders, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-orders", token],
    queryFn: () => fetchOrders(token),
    retry: false,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events", token],
    queryFn: () => fetchAdminEvents(token),
    retry: false,
  });

  if (isError && error instanceof Error && error.message === "UNAUTHORIZED") {
    onLogout();
    return null;
  }

  const totalOrders = orders?.length ?? 0;
  const paidOrders = orders?.filter((o) => o.status === "paid").length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status !== "paid").length ?? 0;
  const totalCollected = orders?.filter((o) => o.status === "paid").reduce((s, o) => s + o.expectedAmount, 0) ?? 0;

  const filtered = orders?.filter((o) => {
    if (filter === "paid") return o.status === "paid";
    if (filter === "pending") return o.status !== "paid";
    return true;
  }) ?? [];

  const handleRegistrationSuccess = () => {
    setShowModal(false);
    queryClient.invalidateQueries({ queryKey: ["admin-orders", token] });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showModal && events.length > 0 && (
        <ManualRegistrationModal
          token={token}
          events={events}
          onClose={() => setShowModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
      <Navbar />
      <main className="flex-1 container mx-auto max-w-6xl px-4 pt-28 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-black text-2xl text-foreground">Реєстрації</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Додати вручну
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Вийти
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Усього заявок" value={totalOrders} icon={Users} />
          <StatCard label="Оплачено" value={paidOrders} icon={CheckCircle2} />
          <StatCard label="Очікує оплату" value={pendingOrders} icon={Clock} />
          <StatCard label="Зібрано" value={`${totalCollected} грн`} icon={Banknote} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "pending", "paid"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Всі" : f === "pending" ? "Очікують" : "Оплачені"}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="ml-auto px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground bg-muted transition-colors"
          >
            Оновити
          </button>
        </div>

        {/* Table */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Завантаження…
          </div>
        )}
        {isError && !isLoading && (
          <p className="text-destructive text-sm py-4">
            Не вдалося завантажити дані. {error instanceof Error ? error.message : ""}
          </p>
        )}
        {orders && (
          <div className="bg-card rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-3 py-3">Дата</th>
                  <th className="px-3 py-3">Батько/Мати</th>
                  <th className="px-3 py-3">Телефон</th>
                  <th className="px-3 py-3 hidden md:table-cell">Email</th>
                  <th className="px-3 py-3 text-center">Діти</th>
                  <th className="px-3 py-3">Сума</th>
                  <th className="px-3 py-3">Статус</th>
                  <th className="px-3 py-3 hidden lg:table-cell">Код платежу</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground text-sm">
                      Реєстрацій не знайдено
                    </td>
                  </tr>
                )}
                {filtered.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// ── Page root ───────────────────────────────────────────────────────────────

const OrganizersPage = () => {
  const { token, save, clear } = useToken();

  if (!token) {
    return <LoginForm onSuccess={save} />;
  }

  return <Dashboard token={token} onLogout={clear} />;
};

export default OrganizersPage;
