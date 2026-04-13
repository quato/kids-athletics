import { Zap, Users, Gift, Smile } from "lucide-react";
import finishLine from "@/assets/finish-line.png";

const features = [
  { icon: Zap, text: "Динамічні змагання з бігу, стрибків, метання" },
  { icon: Users, text: "Атмосфера спортивного свята та нових друзів" },
  { icon: Gift, text: "Медалі, сертифікати та приємні сюрпризи учасникам" },
  { icon: Smile, text: "Яскраві емоції та незабутні враження" },
];

const goals = [
  "Розвиток та популяризація дитячої легкої атлетики",
  "Залучення дітей до регулярних тренувань та активного способу життя",
];

const InfoSection = () => {
  return (
    <section id="info" className="section-padding bg-background">
      <div className="container mx-auto max-w-6xl">
        <h2 className="section-heading">Що на тебе чекає?</h2>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-foreground font-medium">{f.text}</p>
              </div>
            ))}

            <div className="pt-4 text-center">
              <a
                href="/reglament_kids_athletics_fest_05-2026.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
              >
                📄 Подивитись регламент
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-heading font-bold mb-4 text-foreground">Мета заходу</h3>
            <ul className="space-y-3 mb-6">
              {goals.map((g, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-success mt-0.5">✓</span>
                  <span className="text-foreground">{g}</span>
                </li>
              ))}
            </ul>
            <img
              src={finishLine}
              alt="Діти біжать до фінішу"
              className="rounded-2xl shadow-lg w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
