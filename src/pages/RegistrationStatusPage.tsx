import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PaymentStatusCard from "@/components/registration/PaymentStatusCard";
import { fetchOrderStatus } from "@/lib/registration-api";

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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RegistrationStatusPage;
