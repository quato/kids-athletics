import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, AlertCircle, Phone, MessageCircle, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentStatusCard from "@/components/registration/PaymentStatusCard";
import { fetchOrderStatus } from "@/lib/registration-api";

const VIBER_CHAT_URL = "viber://chat?number=380973670219";

const RegistrationStatusPage = () => {
  const { id } = useParams<{ id: string }>();
  const numId = id ? parseInt(id, 10) : NaN;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order-status", numId],
    queryFn: () => fetchOrderStatus(numId),
    enabled: !isNaN(numId),
    retry: 2,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-lg px-4 pt-28 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На головну
        </Link>

        <h1 className="font-heading font-black text-3xl text-foreground mb-2">
          Статус реєстрації
        </h1>

        {isNaN(numId) && (
          <div className="flex items-center gap-2 text-destructive mt-4">
            <AlertCircle className="w-5 h-5" />
            <p>Некоректний ідентифікатор.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground mt-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            Завантаження…
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-destructive mt-8">
            <AlertCircle className="w-5 h-5" />
            <p>Замовлення не знайдено або сталася помилка.</p>
          </div>
        )}

        {data && (
          <div className="space-y-5 mt-4">
            {/* Order summary */}
            <div className="bg-card rounded-2xl shadow-md p-6 space-y-4">
              <p className="text-muted-foreground text-sm">Замовлення #{data.id}</p>

              {/* Children list */}
              <div className="space-y-2">
                {data.children.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{c.childName}</span>
                    <span className="text-muted-foreground">{c.eventName}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Разом до сплати:</span>
                  <span className="font-bold text-secondary text-xl">{data.expectedAmount} грн</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-muted-foreground">Код платежу:</span>
                  <span className="font-mono font-bold text-primary tracking-wider">
                    {data.paymentCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Live status */}
            <PaymentStatusCard
              orderId={data.id}
              paymentCode={data.paymentCode}
              totalAmount={data.expectedAmount}
              children={data.children}
            />

            {/* Payment guidance */}
            <div className="bg-card rounded-2xl shadow-md p-6 space-y-4">
              <h2 className="font-heading font-bold text-lg text-foreground">Важливо щодо підтвердження оплати</h2>

              <div className="inline-flex items-center rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 px-3 py-1 text-xs font-semibold">
                Після оплати в іншому банку обов'язково напишіть у Viber
              </div>

              <div className="space-y-2 text-sm text-foreground/90 leading-relaxed">
                <p>
                  При оплаті з <strong>MonoBank</strong> реєстрація відбувається автоматично.
                </p>
                <p>
                  При оплаті з <strong>Приват24</strong> або іншого банку потрібно надіслати скріншот оплати
                  та прізвище й ім'я учасника у Viber за номером{" "}
                  <a
                    href="tel:+380973670219"
                    className="font-semibold text-primary hover:underline"
                  >
                    +380973670219
                  </a>.
                </p>
                <p>
                  Підтвердження оплати буде надіслано на вказану вами електронну пошту.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={VIBER_CHAT_URL}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Написати у Viber
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="tel:+380973670219"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-semibold text-foreground hover:bg-muted transition"
                >
                  <Phone className="w-4 h-4" />
                  Зателефонувати
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RegistrationStatusPage;
