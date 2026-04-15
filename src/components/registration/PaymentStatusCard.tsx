import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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

const CARD_NUMBER = "4874 0700 5666 0853";

function buildQrValue(paymentCode: string, amount: number): string {
  const monoKey = import.meta.env.VITE_MONO_SEND_KEY as string | undefined;
  if (monoKey) {
    // Monobank deep link: opens payment screen in browser or app with
    // amount (in kopecks) and payment code pre-filled.
    return `https://send.monobank.ua/${monoKey}?a=${amount}&t=${encodeURIComponent(paymentCode)}`;
  }
  // Fallback: plain text with all payment details.
  return `Картка: ${CARD_NUMBER}\nКод платежу: ${paymentCode}\nСума: ${amount} грн`;
}

const hasMonoLink = !!import.meta.env.VITE_MONO_SEND_KEY;

const PaymentInstructions = ({ paymentCode, amount }: { paymentCode: string; amount: number }) => (
  <div className="bg-accent/20 border border-accent rounded-xl p-5 space-y-4">
    <p className="font-heading font-bold text-foreground text-lg">Як оплатити?</p>

    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">Картка організатора:</p>
      <p className="font-mono font-black text-2xl tracking-widest text-foreground select-all">
        {CARD_NUMBER}
      </p>
    </div>

    <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 space-y-1">
      <p className="text-sm font-bold text-destructive">
        ⚠️ Обов'язково вкажіть код платежу у призначенні:
      </p>
      <p className="font-mono font-black text-2xl tracking-widest text-primary select-all">
        {paymentCode}
      </p>
      <p className="text-xs text-muted-foreground">
        Без коду платіж неможливо ідентифікувати — реєстрація залишиться непідтвердженою.
      </p>
    </div>

    {/* QR code + pay button */}
    <div className="flex flex-col items-center gap-3 py-2">
      <QRCodeSVG
        value={buildQrValue(paymentCode, amount)}
        size={180}
        level="M"
        includeMargin
        className="rounded-xl border border-border bg-white p-1"
      />
      <p className="text-xs text-muted-foreground text-center">
        {hasMonoLink
          ? "Скануйте QR-код — відкриється Monobank із заповленою сумою та кодом"
          : "Скануйте QR-код, щоб побачити реквізити для оплати"}
      </p>
      {hasMonoLink && (
        <a
          href={buildQrValue(paymentCode, amount)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:shadow-md transition-all hover:scale-105"
        >
          💳 Оплатити через Monobank
        </a>
      )}
    </div>

    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
      <li>Відкрийте Monobank, Privatbank або будь-який інтернет-банкінг.</li>
      <li>
        Виконайте переказ на картку{" "}
        <span className="font-mono font-semibold text-foreground">{CARD_NUMBER}</span>
      </li>
      <li>
        У призначенні платежу вкажіть код:{" "}
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
