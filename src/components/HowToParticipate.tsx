import { PenSquare, CreditCard, Footprints } from "lucide-react";

const steps = [
  {
    icon: PenSquare,
    title: "Крок 1",
    description: "Заповніть реєстраційну форму",
    action: { label: "Реєстрацію завершено", disabled: true },
  },
  {
    icon: CreditCard,
    title: "Крок 2",
    description: "Сплатіть реєстраційний внесок",
    price: "150 UAH",
  },
  {
    icon: Footprints,
    title: "Крок 3",
    description: "Підготуйте кросівки та гарний настрій!",
  },
];

const HowToParticipate = () => {
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
                <span className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium cursor-not-allowed">
                  {step.action.label}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="max-w-xl mx-auto bg-accent/20 border-l-4 border-accent rounded-xl p-5 mb-8">
          <p className="font-bold text-foreground mb-1">⚠️ Важливо!</p>
          <p className="text-muted-foreground text-sm">
            Реєстрація буде відкрита до 20 травня, за наявності місць. Ліміт — 90 осіб.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://docs.google.com/spreadsheets/d/10aQrIEH_1BCZGl6QEUi5cSMj4laq9FNUYfKxCQ5Uc-0/edit?usp=drivesdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-success text-success-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
          >
            🏆 Результати виставкових забігів
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowToParticipate;
