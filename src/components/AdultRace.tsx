import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { useEdition } from "@/editions";
import { FEST_OVER_MESSAGE, isFestOver, isRegistrationOpen } from "@/lib/registration-open";

const AdultRace = () => {
  const { edition, mode } = useEdition();
  const race = edition.adultRace;
  if (!race) return null;

  const archived = mode === "archive" || isFestOver(edition);
  const registrationOpen = isRegistrationOpen(edition);

  return (
    <section id="adults" className="section-padding bg-background">
      <div className="container mx-auto max-w-4xl">
        <h2 className="section-heading">{race.name}</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          {race.tagline}
        </p>

        <div className="bg-card rounded-2xl shadow-md p-6 md:p-8">
          <p className="text-foreground mb-6">{race.description}</p>

          <ul className="grid sm:grid-cols-3 gap-4 mb-6">
            {race.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 bg-muted rounded-xl p-4 text-sm font-semibold text-foreground"
              >
                <Flame className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
            <span>
              Стартовий внесок:{" "}
              <strong className="text-secondary">{race.fee} грн</strong>
            </span>
            <span>
              Кількість місць: <strong className="text-foreground">{race.placeLimit}</strong>
            </span>
            <span>
              Дата: <strong className="text-foreground">{edition.eventDateLabel}</strong>
            </span>
          </div>

          <div className="border-l-4 rounded-xl p-4 bg-muted border-muted-foreground/30">
            <p className="text-foreground font-semibold text-sm">
              {archived ? (
                <>{FEST_OVER_MESSAGE}</>
              ) : registrationOpen ? (
                <>Реєстрація на {race.name} <span className="text-success">відкрита</span>!</>
              ) : (
                <>
                  Реєстрація на {race.name} відкриється{" "}
                  <span className="text-primary">{edition.registrationOpenLabel}</span>.
                </>
              )}
            </p>
            {!archived && registrationOpen && (
              <Link
                to="/registration"
                className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
              >
                Зареєструватись на {race.name}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdultRace;
