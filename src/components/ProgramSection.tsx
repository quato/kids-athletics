import { Link } from "react-router-dom";
import { resultsPathFor, useEdition } from "@/editions";
import { isStatsOpen } from "@/lib/registration-open";

const ProgramSection = () => {
  const { edition, mode } = useEdition();
  const statsOpen = mode === "live" && isStatsOpen(edition);
  const resultsPath = resultsPathFor(edition);

  return (
    <section id="program" className="section-padding bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="section-heading">Програма командної першості</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {edition.teamDisciplines.map((d) => (
            <div
              key={d.id}
              className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 p-5 flex flex-col items-center text-center"
            >
              <img src={d.icon} alt={d.name} className="object-contain mb-4" />
              <span className="font-heading font-bold text-sm text-foreground">{d.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {resultsPath && (
            <Link
              to={resultsPath}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
            >
              🏆 Результати фесту
            </Link>
          )}
          {mode === "live" && (
            statsOpen ? (
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
            )
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
