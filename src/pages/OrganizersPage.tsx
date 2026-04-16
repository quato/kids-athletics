import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Phone, Mail, ChevronDown, ChevronUp, LogOut, Loader2, Users, CheckCircle2, Clock, Banknote, PlusCircle, Trash2, X, AlertTriangle, Download, Link2, FileJson } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { login, fetchOrders, fetchAdminEvents, manualRegistration, updateOrder, updateOrderStatus, updateChild, deleteOrder, fetchUnlinkedTransactions, linkTransaction, fetchLinkedTransactions } from "@/lib/admin-api";
import type { Order, AdminEvent, OrderChild, UnlinkedTransaction, LinkedTransaction } from "@/lib/admin-api";

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

// ── Inline editable text field ────────────────────────────────────────────────

function InlineEditField({
  value,
  onSave,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) { setEditing(false); setDraft(value); return; }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className={`group flex items-center gap-1 hover:text-primary transition-colors ${className}`}
        title="Натисніть щоб редагувати"
      >
        <span>{value || placeholder}</span>
        <span className="opacity-0 group-hover:opacity-60 text-xs">✏️</span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setDraft(value); } }}
        onBlur={commit}
        className={`border border-primary bg-background rounded-md px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
      />
      {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
    </span>
  );
}

// ── Child editable row ───────────────────────────────────────────────────────

function ChildEditRow({ child, token }: { child: OrderChild; token: string }) {
  const queryClient = useQueryClient();
  const [startNumber, setStartNumber] = useState(
    child.startNumber != null ? String(child.startNumber) : "",
  );
  const [isPresent, setIsPresent] = useState<boolean | null>(child.isPresent ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistChild = async (fields: {
    startNumber?: number | null;
    isPresent?: boolean | null;
    childName?: string;
    birthYear?: number;
  }) => {
    setSaving(true);
    setSaved(false);
    try {
      await updateChild(token, child.id, fields);
      queryClient.invalidateQueries({ queryKey: ["admin-orders", token] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently ignore — row will revert on next refresh
    } finally {
      setSaving(false);
    }
  };

  const handleStartNumberChange = (val: string) => {
    setStartNumber(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const num = val.trim() === "" ? null : parseInt(val, 10);
      if (val.trim() === "" || (!isNaN(num!) && num! > 0)) {
        persistChild({ startNumber: num });
      }
    }, 800);
  };

  const handlePresenceToggle = () => {
    const next = isPresent === true ? false : isPresent === false ? null : true;
    setIsPresent(next);
    persistChild({ isPresent: next });
  };

  const presenceLabel =
    isPresent === true ? "✅ Присутній" : isPresent === false ? "❌ Відсутній" : "— невідомо";
  const presenceClass =
    isPresent === true
      ? "bg-success/15 text-success"
      : isPresent === false
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 border-b border-border/50 last:border-0">
      <InlineEditField
        value={child.childName}
        onSave={(v) => persistChild({ childName: v })}
        className="font-semibold text-foreground text-sm min-w-[140px]"
      />
      <InlineEditField
        value={String(child.birthYear || "")}
        onSave={(v) => persistChild({ birthYear: parseInt(v, 10) })}
        type="number"
        placeholder="рік"
        className="w-20 text-xs text-muted-foreground"
      />
      <span className="text-xs text-muted-foreground">{child.eventName}</span>

      <div className="flex items-center gap-1 ml-auto flex-wrap gap-y-1">
        {/* Start number */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap"># старт:</span>
          <input
            type="number"
            min={1}
            value={startNumber}
            onChange={(e) => handleStartNumberChange(e.target.value)}
            placeholder="—"
            className="w-16 border border-input bg-background rounded-md px-2 py-1 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Presence toggle */}
        <button
          onClick={handlePresenceToggle}
          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${presenceClass}`}
        >
          {presenceLabel}
        </button>

        {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        {saved && !saving && <span className="text-xs text-success">Збережено</span>}
      </div>
    </div>
  );
}

// ── Confirm delete button ────────────────────────────────────────────────────

function ConfirmDeleteButton({ onConfirm, disabled }: { onConfirm: () => Promise<void>; disabled?: boolean }) {
  const [stage, setStage] = useState<"idle" | "confirm" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);

  if (stage === "idle") {
    return (
      <button
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); setStage("confirm"); }}
        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
        title="Видалити запис"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  if (stage === "confirm") {
    return (
      <span className="inline-flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
        <span className="text-xs font-semibold text-destructive whitespace-nowrap">Видалити?</span>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            setStage("deleting");
            setError(null);
            try { await onConfirm(); }
            catch (err) { setError(err instanceof Error ? err.message : "Помилка"); setStage("idle"); }
          }}
          className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 transition"
        >
          Так
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setStage("idle"); }}
          className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-bold hover:opacity-90 transition"
        >
          Ні
        </button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </span>
    );
  }

  return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
}

// ── Order row ───────────────────────────────────────────────────────────────

function OrderRow({ order, token }: { order: Order; token: string }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const date = new Date(order.createdAt).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = order.status === "paid" ? "pending" : "paid";
    setStatusSaving(true);
    try {
      await updateOrderStatus(token, order.id, next);
      queryClient.invalidateQueries({ queryKey: ["admin-orders", token] });
    } catch {
      // ignore
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{date}</td>
        <td className="px-3 py-3 font-semibold text-foreground text-sm whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <InlineEditField
            value={order.parentName}
            onSave={(v) => updateOrder(token, order.id, { parentName: v }).then(() =>
              queryClient.invalidateQueries({ queryKey: ["admin-orders", token] })
            )}
            className="font-semibold text-sm"
          />
        </td>
        <td className="px-3 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-0.5">
            <a
              href={`tel:${order.phone}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Phone className="w-3 h-3 shrink-0" />
              {order.phone}
            </a>
            <a
              href={`mailto:${order.email}`}
              className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
            >
              <Mail className="w-3 h-3 shrink-0" />
              {order.email}
            </a>
          </div>
        </td>
        <td className="px-3 py-3 text-center text-sm text-muted-foreground">{order.children.length}</td>
        <td className="px-3 py-3 text-sm font-semibold text-secondary whitespace-nowrap">
          {order.expectedAmount} грн
        </td>
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleStatusToggle}
            disabled={statusSaving}
            className="flex items-center gap-1"
            title="Натисніть щоб змінити статус"
          >
            {statusSaving
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <StatusBadge status={order.status} />}
          </button>
        </td>
        <td className="px-3 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">
          {order.paymentCode}
        </td>
        <td className="px-3 py-3 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
          {order.status !== "paid" && (
            <ConfirmDeleteButton
              onConfirm={async () => {
                await deleteOrder(token, order.id);
                queryClient.invalidateQueries({ queryKey: ["admin-orders", token] });
              }}
            />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/30 border-b border-border">
          <td colSpan={9} className="px-4 py-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Діти — стартовий номер та присутність
              </p>
              {order.children.map((c) => (
                <ChildEditRow key={c.id} child={c} token={token} />
              ))}
              {order.children.length === 0 && (
                <p className="text-sm text-muted-foreground">Немає даних про дітей</p>
              )}
              <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground items-center">
                <span className="flex items-center gap-1">
                  Тел:
                  <InlineEditField
                    value={order.phone}
                    onSave={(v) => updateOrder(token, order.id, { phone: v }).then(() =>
                      queryClient.invalidateQueries({ queryKey: ["admin-orders", token] })
                    )}
                    className="text-xs"
                  />
                </span>
                <span className="flex items-center gap-1">
                  Email:
                  <InlineEditField
                    value={order.email}
                    onSave={(v) => updateOrder(token, order.id, { email: v }).then(() =>
                      queryClient.invalidateQueries({ queryKey: ["admin-orders", token] })
                    )}
                    type="email"
                    className="text-xs"
                  />
                </span>
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
  isDisabled: boolean;
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
    { childName: "", birthYear: "", eventId: events[0]?.id ?? 0, isDisabled: false },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addChild = () =>
    setChildren((prev) => [...prev, { childName: "", birthYear: "", eventId: events[0]?.id ?? 0, isDisabled: false }]);

  const removeChild = (i: number) =>
    setChildren((prev) => prev.filter((_, idx) => idx !== i));

  const updateChild = (i: number, field: keyof ChildRow, value: string | number | boolean) =>
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
          birthYear: c.isDisabled ? 0 : parseInt(c.birthYear, 10),
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
                  {child.isDisabled ? (
                    <div className="flex items-center px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                      Інвалід / особливі потреби
                    </div>
                  ) : (
                    <Input
                      value={child.birthYear}
                      onChange={(e) => updateChild(i, "birthYear", e.target.value)}
                      placeholder="Рік народж. *"
                      type="number"
                      min={2014}
                      max={2023}
                      required
                    />
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={child.isDisabled}
                    onChange={(e) => updateChild(i, "isDisabled", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-muted-foreground">Інвалід / з особливими потребами</span>
                </label>
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
            <Button type="submit" className="flex-1" disabled={loading || !parentName || !phone || children.some((c) => !c.isDisabled && !c.birthYear)}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Зберегти
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── JSON viewer modal ────────────────────────────────────────────────────────

function JsonModal({ data, onClose }: { data: unknown; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <FileJson className="w-4 h-4 text-muted-foreground" />
            JSON транзакції
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <pre className="overflow-auto flex-1 px-5 py-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ── Transactions tab ─────────────────────────────────────────────────────────

function TransactionsTab({ token, orders }: { token: string; orders: Order[] }) {
  const queryClient = useQueryClient();
  const pendingOrders = orders.filter((o) => o.status !== "paid");

  const { data: transactions, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-transactions", token],
    queryFn: () => fetchUnlinkedTransactions(token),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Завантаження…
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive text-sm py-4">Не вдалося завантажити транзакції.</p>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow p-8 text-center text-muted-foreground text-sm">
        Всі транзакції вже зв'язані з реєстраціями.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">
          Знайдено <strong>{transactions.length}</strong> транзакцій без реєстрації. Оберіть реєстрацію та натисніть «Зв'язати».
        </p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground bg-muted transition-colors"
        >
          Оновити
        </button>
      </div>
      {transactions.map((tx) => (
        <TransactionRow
          key={tx.id}
          transaction={tx}
          pendingOrders={pendingOrders}
          token={token}
          onLinked={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-transactions", token] });
            queryClient.invalidateQueries({ queryKey: ["admin-orders", token] });
          }}
        />
      ))}
    </div>
  );
}

function TransactionRow({
  transaction,
  pendingOrders,
  token,
  onLinked,
}: {
  transaction: UnlinkedTransaction;
  pendingOrders: Order[];
  token: string;
  onLinked: () => void;
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const txDate = transaction.time
    ? new Date(transaction.time * 1000).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(transaction.receivedAt).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const handleLink = async () => {
    if (!selectedOrderId) return;
    setLinking(true);
    setError(null);
    try {
      await linkTransaction(token, parseInt(selectedOrderId, 10), transaction.id);
      onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLinking(false);
    }
  };

  const senderLabel = transaction.counterName || transaction.description || "—";

  return (
    <>
      {showJson && <JsonModal data={transaction.rawPayload} onClose={() => setShowJson(false)} />}
      <div className="bg-card rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground truncate">{senderLabel}</span>
            <span className="font-bold text-sm text-secondary whitespace-nowrap">{transaction.amount} грн</span>
            <button
              onClick={() => setShowJson(true)}
              title="Переглянути JSON"
              className="ml-1 p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
            >
              <FileJson className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{txDate}</p>
            {transaction.comment && (
              <p>Призначення: <span className="font-mono text-foreground">{transaction.comment}</span></p>
            )}
            {transaction.description && transaction.description !== senderLabel && (
              <p>Опис: {transaction.description}</p>
            )}
            <p className="font-mono text-[10px] opacity-60">{transaction.id}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:min-w-[320px]">
          <select
            value={selectedOrderId}
            onChange={(e) => { setSelectedOrderId(e.target.value); setError(null); }}
            className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={linking}
          >
            <option value="">— Оберіть реєстрацію —</option>
            {pendingOrders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.id} {o.parentName} — {o.expectedAmount} грн ({o.children.length} дит.)
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!selectedOrderId || linking}
            onClick={handleLink}
            className="gap-1.5 whitespace-nowrap"
          >
            {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
            Зв'язати
          </Button>
        </div>

        {error && (
          <p className="text-xs text-destructive w-full">{error}</p>
        )}
      </div>
    </>
  );
}

// ── Linked transactions tab ──────────────────────────────────────────────────

function LinkedTransactionsTab({ token }: { token: string }) {
  const [jsonModal, setJsonModal] = useState<Record<string, unknown> | null>(null);

  const { data: linked, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-linked-transactions", token],
    queryFn: () => fetchLinkedTransactions(token),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Завантаження…
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive text-sm py-4">Не вдалося завантажити дані.</p>;
  }

  if (!linked || linked.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow p-8 text-center text-muted-foreground text-sm">
        Прив'язаних платежів ще немає.
      </div>
    );
  }

  const mismatches = linked.filter((t) => !t.amountMatch).length;

  return (
    <>
      {jsonModal && <JsonModal data={jsonModal} onClose={() => setJsonModal(null)} />}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          Всього: <strong>{linked.length}</strong>
          {mismatches > 0 && (
            <span className="ml-2 text-destructive font-semibold">
              ⚠ {mismatches} з розбіжністю суми
            </span>
          )}
        </p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground bg-muted transition-colors"
        >
          Оновити
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-3 py-3 whitespace-nowrap">Дата оплати</th>
              <th className="px-3 py-3 whitespace-nowrap">Замов.</th>
              <th className="px-3 py-3 whitespace-nowrap">Платник (банк)</th>
              <th className="px-3 py-3 whitespace-nowrap">Батько/Мати</th>
              <th className="px-3 py-3 whitespace-nowrap">Очікувалось</th>
              <th className="px-3 py-3 whitespace-nowrap">Надійшло</th>
              <th className="px-3 py-3 whitespace-nowrap">Призначення</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {linked.map((tx) => {
              const paidDate = new Date(tx.paidAt).toLocaleString("uk-UA", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const senderLabel = tx.counterName || tx.description || "—";

              return (
                <tr
                  key={tx.transactionId}
                  className={`border-b border-border last:border-0 ${!tx.amountMatch ? "bg-destructive/5" : ""}`}
                >
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{paidDate}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{tx.orderId}</td>
                  <td className="px-3 py-2.5 text-xs max-w-[160px] truncate" title={senderLabel}>{senderLabel}</td>
                  <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{tx.parentName}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{tx.expectedAmount} грн</td>
                  <td className={`px-3 py-2.5 font-bold whitespace-nowrap ${tx.amountMatch ? "text-success" : "text-destructive"}`}>
                    {tx.actualAmount} грн
                    {!tx.amountMatch && <span className="ml-1 text-xs font-normal">⚠</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate" title={tx.comment ?? tx.description ?? ""}>
                    {tx.comment || tx.description || <span className="opacity-40 italic">відсутнє</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {tx.rawStatement && (
                      <button
                        onClick={() => setJsonModal(tx.rawStatement!)}
                        title="Переглянути JSON"
                        className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
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
type Tab = "registrations" | "transactions" | "linked";

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("registrations");
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

  const handleExportCsv = async () => {
    try {
      const res = await fetch("/api/admin/orders?format=csv", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Не вдалося експортувати дані");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "registrations.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Помилка експорту CSV");
    }
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
          <h1 className="font-heading font-black text-2xl text-foreground">Організатори</h1>
          <div className="flex flex-wrap gap-2 justify-end">
            {activeTab === "registrations" && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
                  <Download className="w-4 h-4" />
                  Експорт CSV
                </Button>
                <Button size="sm" onClick={() => setShowModal(true)} className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Додати вручну
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Вийти
            </Button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("registrations")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "registrations"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Реєстрації
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "transactions"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Нерозпізнані платежі
          </button>
          <button
            onClick={() => setActiveTab("linked")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "linked"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Прив'язані платежі
          </button>
        </div>

        {activeTab === "linked" ? (
          <LinkedTransactionsTab token={token} />
        ) : activeTab === "transactions" ? (
          <TransactionsTab token={token} orders={orders ?? []} />
        ) : (
          <>
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
                      <th className="px-3 py-3 whitespace-nowrap">Батько/Мати</th>
                      <th className="px-3 py-3">Контакти</th>
                      <th className="px-3 py-3 text-center">Діти</th>
                      <th className="px-3 py-3">Сума</th>
                      <th className="px-3 py-3">Статус</th>
                      <th className="px-3 py-3 hidden lg:table-cell">Код платежу</th>
                      <th className="px-3 py-3" />
                      <th className="px-2 py-3" />
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
                      <OrderRow key={order.id} order={order} token={token} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
