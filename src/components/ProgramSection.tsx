import icon1 from "@/assets/icon-1-2026.png";
import icon2 from "@/assets/icon-2-2026.png";
import icon3 from "@/assets/icon-3-2026.png";
import icon4 from "@/assets/icon-4-2026.png";
import icon5 from "@/assets/icon-5-2026.png";
import icon6 from "@/assets/icon-6-2026.png";
import { Link } from "react-router-dom";

const disciplines = [
  { icon: icon1, name: "Естафета «Спринт»" },
  { icon: icon2, name: "Стрибки «Гумова стрічка»" },
  { icon: icon3, name: "Естафета «Квадрат спритності»" },
  { icon: icon4, name: "Естафета «Слалом ланцюг»" },
  { icon: icon5, name: "Метання назад через голову (1 кг)" },
  { icon: icon6, name: "Гонка «Супер-перегони» 3 хв" },
];

// 19 Apr 2026, 16:10 Kyiv time (UTC+3)
const STATS_OPEN_DATE = new Date(Date.UTC(2026, 3, 19, 13, 10, 0));
const STATS_OPEN_LABEL = "19 квітня о 16:10 (за Києвом)";

const ProgramSection = () => {
  const statsOpen = new Date() >= STATS_OPEN_DATE;

  return (
    <section id="program" className="section-padding bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="section-heading">Програма командної першості</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {disciplines.map((d, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 p-5 flex flex-col items-center text-center"
            >
              <img src={d.icon} alt={d.name} className="w-32 h-32 md:w-40 md:h-40 object-contain mb-4" />
              <span className="font-heading font-bold text-sm text-foreground">{d.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          {statsOpen ? (
            <Link
              to="/stats"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-success text-success-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
            >
              📋 Список зареєстрованих учасників
            </Link>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-muted-foreground font-bold shadow cursor-not-allowed"
              >
                📋 Список зареєстрованих учасників
              </button>
              <p className="text-xs text-muted-foreground">
                Список буде доступний незабаром після відкриття реєстрації.
              </p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 shadow-sm max-w-2xl mx-auto">
          <h4 className="font-heading font-bold mb-2 text-foreground">Визначення переможців:</h4>
          <p className="text-muted-foreground text-sm">
            В загальному заліку перемагає команда, яка набрала <strong>меншу кількість балів</strong> за всі види програм. При рівній кількості балів перевага надається тій команді, яка найбільше зайняла перших місць.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProgramSection;
