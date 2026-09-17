import { PenSquare, CreditCard, Footprints } from "lucide-react";
import { Link } from "react-router-dom";
import { FEST_OVER_MESSAGE, isFestOver } from "@/lib/registration-open";

const steps = [
  {
    icon: PenSquare,
    title: "Крок 1",
    description: "Заповніть реєстраційну форму",
    action: { label: "Зареєструватися" },
  },
  {
    icon: CreditCard,
    title: "Крок 2",
    description: "Сплатіть реєстраційний внесок",
    price: "350 грн (виставкові) / 400 грн (командні)",
  },
  {
    icon: Footprints,
    title: "Крок 3",
    description: "Підготуйте кросівки та гарний настрій!",
  },
];

const HowToParticipate = () => {
  const festOver = isFestOver();

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="section-heading">Як взяти участь?</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl shadow-md p-6 text-center flex flex-col items-center hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-heading font-bold text-lg mb-2 text-foreground">{step.title}</h4>
              <p className="text-muted-foreground mb-4 flex-1">{step.description}</p>
              {step.price && (
                <span className="text-2xl font-heading font-black text-secondary">{step.price}</span>
              )}
              {step.action && (
                festOver ? (
                  <span className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-bold cursor-not-allowed">
                    {step.action.label}
                  </span>
                ) : (
                  <Link
                    to="/registration"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
                  >
                    {step.action.label}
                  </Link>
                )
              )}
            </div>
          ))}
        </div>

        <div className="max-w-xl mx-auto bg-accent/20 border-l-4 border-accent rounded-xl p-5 mb-8">
          <p className="font-bold text-foreground mb-1">⚠️ Важливо!</p>
          <p className="text-muted-foreground text-sm">
            {festOver
              ? FEST_OVER_MESSAGE
              : "Реєстрація буде відкрита до 20 травня 2026 року, за наявності місць. Загальний ліміт — 200 осіб."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/results?tab=individual"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-success text-success-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
          >
            🏆 Результати виставкових забігів
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowToParticipate;
