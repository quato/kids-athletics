import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock } from "lucide-react";
import { fetchOrderStatus } from "@/lib/registration-api";

interface ChildSummary {
  id?: number;
  childName: string;
  eventName?: string;
}

interface Props {
  orderId: number;
  paymentCode: string;
  totalAmount: number;
  children: ChildSummary[];
}

const POLL_INTERVAL_MS = 10_000;

const PaymentInstructions = ({ paymentCode, amount }: { paymentCode: string; amount: number }) => (
  <div className="bg-accent/20 border border-accent rounded-xl p-5 space-y-3">
    <p className="font-heading font-bold text-foreground text-lg">Як оплатити?</p>
    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
      <li>Відкрийте Monobank, Privatbank або будь-який інтернет-банкінг.</li>
      <li>
        Виконайте переказ на картку організатора (реквізити надсилаються на email після
        реєстрації).
      </li>
      <li>
        У призначенні платежу вкажіть ваш код:{" "}
        <span className="font-mono font-bold text-primary">{paymentCode}</span>
      </li>
      <li>
        Сума до сплати:{" "}
        <span className="font-bold text-secondary">{amount} грн</span>
      </li>
    </ol>
    <p className="text-xs text-muted-foreground">
      Статус оплати оновиться автоматично на цій сторінці протягом кількох хвилин після
      надходження платежу.
    </p>
  </div>
);

const PaymentStatusCard = ({ orderId, paymentCode, totalAmount, children }: Props) => {
  const { data, isError } = useQuery({
    queryKey: ["order-status", orderId],
    queryFn: () => fetchOrderStatus(orderId),
    refetchInterval: (query) =>
      query.state.data?.status === "paid" ? false : POLL_INTERVAL_MS,
    retry: 2,
  });

  const isPaid = data?.status === "paid";
  const childNames = children.map((c) => c.childName).join(", ");

  return (
    <div className="space-y-3">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border-2 font-semibold text-base transition-all ${
          isPaid
            ? "border-success bg-success/10 text-success"
            : "border-muted bg-muted/30 text-muted-foreground"
        }`}
      >
        {isPaid ? (
          <>
            <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span>Оплата підтверджена!</span>
              <span className="text-sm font-normal mt-0.5">{childNames}</span>
            </div>
          </>
        ) : (
          <>
            <Clock className="w-6 h-6 shrink-0 animate-pulse mt-0.5" />
            <div className="flex flex-col">
              <span>Очікуємо оплату…</span>
              <span className="text-sm font-normal mt-0.5">{childNames}</span>
            </div>
          </>
        )}
      </div>

      {isError && (
        <p className="text-xs text-destructive">
          Не вдалося перевірити статус. Спробуйте оновити сторінку.
        </p>
      )}

      {!isPaid && (
        <PaymentInstructions paymentCode={paymentCode} amount={totalAmount} />
      )}

      {isPaid && data?.paidAt && (
        <p className="text-sm text-muted-foreground">
          Сплачено:{" "}
          {new Date(data.paidAt).toLocaleString("uk-UA", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
};

export default PaymentStatusCard;
