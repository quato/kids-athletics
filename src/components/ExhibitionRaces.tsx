import { Link } from "react-router-dom";
import { resultsPathFor, useEdition } from "@/editions";
import { FEST_OVER_MESSAGE, isFestOver, isRegistrationOpen } from "@/lib/registration-open";

const ExhibitionRaces = () => {
  const { edition, mode } = useEdition();
  const archived = mode === "archive" || isFestOver(edition);
  const registrationOpen = isRegistrationOpen(edition);
  const individualResultsPath = resultsPathFor(edition, "individual");

  return (
    <section className="section-padding bg-muted">
      <div className="container mx-auto max-w-4xl">
        <h2 className="section-heading">Програма змагань</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Програма змагань охоплює дві секції:{" "}
          <a href="#team" className="text-secondary font-semibold hover:underline">командні</a> та{" "}
          <strong>виставкові (особисті) виступи</strong>.
        </p>

        <h3 className="text-xl font-heading font-bold mb-4 text-foreground">Виставкові забіги</h3>
        <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary text-secondary-foreground">
                <th className="px-4 py-3 text-left font-bold">Вікова група</th>
                <th className="px-4 py-3 text-left font-bold">Дистанція / Подія</th>
              </tr>
            </thead>
            <tbody>
              {edition.exhibitionRaces.map((r, i) => (
                <tr
                  key={i}
                  className={`${i % 2 === 0 ? "bg-card" : "bg-muted"} border-b border-border`}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{r.age}</td>
                  <td className="px-4 py-3 text-foreground">{r.event}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-l-4 rounded-xl p-4 mb-6 bg-muted border-muted-foreground/30">
          <p className="text-foreground font-semibold text-sm">
            {archived ? (
              <>{FEST_OVER_MESSAGE}</>
            ) : registrationOpen ? (
              <>Реєстрація на виставкові забіги <span className="text-success">відкрита</span>!</>
            ) : (
              <>Реєстрація на виставкові забіги відкриється <span className="text-primary">{edition.registrationOpenLabel}</span>.</>
            )}
          </p>
          {archived && individualResultsPath ? (
            <Link
              to={individualResultsPath}
              className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
            >
              Переглянути результати
            </Link>
          ) : registrationOpen ? (
            <Link
              to="/registration"
              className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
            >
              Зареєструватись на виставковий забіг
            </Link>
          ) : null}
        </div>

        <p className="text-muted-foreground text-sm">
          <strong>Виставкові забіги</strong> організовуються з метою створення спортивної події, відкритої і доступної для всіх дітей відповідної вікової категорії ({edition.birthYears[0]}–{edition.birthYears[1]} року народження).
        </p>
      </div>
    </section>
  );
};

export default ExhibitionRaces;
