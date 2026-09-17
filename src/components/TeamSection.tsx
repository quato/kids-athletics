import { Link } from "react-router-dom";
import { resultsPathFor, useEdition } from "@/editions";
import { FEST_OVER_MESSAGE, isFestOver, isRegistrationOpen } from "@/lib/registration-open";

const TeamSection = () => {
  const { edition, mode } = useEdition();
  const archived = mode === "archive" || isFestOver(edition);
  const registrationOpen = isRegistrationOpen(edition);
  const teamClosed = edition.teamRegistrationClosed;

  return (
    <section id="team" className="section-padding bg-muted">
      <div className="container mx-auto max-w-4xl">
        <h2 className="section-heading">Командна першість</h2>

        <div className="bg-card rounded-2xl shadow-md p-6 md:p-8 mb-8">
          <h4 className="font-heading font-bold text-lg mb-3 text-foreground">Вікові категорії</h4>
          <p className="text-muted-foreground mb-4">Склад команди — 6 учасників:</p>
          <ul className="space-y-2 mb-6">
            {edition.teamComposition.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-foreground">
                <span className="text-primary font-bold">—</span> <strong>{item}</strong>{" "}
                <span className="text-muted-foreground">(без урахування статті)</span>
              </li>
            ))}
          </ul>

          <div
            className={`border-l-4 rounded-xl p-4 mb-6 ${
              archived
                ? "bg-muted border-muted-foreground/30"
                : teamClosed
                  ? "bg-destructive/10 border-destructive"
                  : registrationOpen
                    ? "bg-success/10 border-success"
                    : "bg-muted border-muted-foreground/30"
            }`}
          >
            <p className="text-foreground font-semibold text-sm">
              {archived ? (
                <>{FEST_OVER_MESSAGE}</>
              ) : teamClosed ? (
                <>
                  Реєстрація на командну першість{" "}
                  <span className="text-destructive">закрита</span>
                  {edition.teamRegistrationClosedReason
                    ? ` — ${edition.teamRegistrationClosedReason}.`
                    : "."}
                </>
              ) : registrationOpen ? (
                <>Реєстрація на командні забіги <span className="text-success">відкрита</span>!</>
              ) : (
                <>Реєстрація на командні забіги відкриється <span className="text-primary">{edition.registrationOpenLabel}</span>.</>
              )}
            </p>
            {!archived && registrationOpen && !teamClosed && (
              <Link
                to="/registration"
                className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
              >
                Зареєструвати команду
              </Link>
            )}
          </div>

          <div className="text-center">
            <Link
              to={resultsPathFor(edition, "teams")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-success text-success-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
            >
              🏆 Результати командної першості
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
