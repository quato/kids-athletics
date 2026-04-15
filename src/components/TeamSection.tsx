import { isRegistrationOpen } from "@/lib/registration-open";

const TEAM_REGISTRATION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSc_3zxVmhIOG7egWtnjBXDTwgRPrdRD8wj3ryfbqh2sqiOGxA/viewform?usp=header";

const TeamSection = () => {
  const registrationOpen = isRegistrationOpen();

  return (
    <section id="team" className="section-padding bg-muted">
      <div className="container mx-auto max-w-4xl">
        <h2 className="section-heading">Командна першість</h2>

        <div className="bg-card rounded-2xl shadow-md p-6 md:p-8 mb-8">
          <h4 className="font-heading font-bold text-lg mb-3 text-foreground">Вікові категорії</h4>
          <p className="text-muted-foreground mb-4">Склад команди — 6 учасників:</p>
          <ul className="space-y-2 mb-6">
            {[
              "2 дітей 2014–2015 року народження",
              "2 дітей 2016–2017 року народження",
              "2 дітей 2018–2019 року народження",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-foreground">
                <span className="text-primary font-bold">—</span> <strong>{item}</strong>{" "}
                <span className="text-muted-foreground">(без урахування статті)</span>
              </li>
            ))}
          </ul>

          <div className={`border-l-4 rounded-xl p-4 mb-6 ${registrationOpen ? "bg-success/10 border-success" : "bg-muted border-muted-foreground/30"}`}>
            <p className="text-foreground font-semibold text-sm">
              {registrationOpen ? (
                <>Реєстрація на командні забіги <span className="text-success">відкрита</span>!</>
              ) : (
                <>Реєстрація на командні забіги відкриється <span className="text-primary">19 квітня</span>.</>
              )}
            </p>
            {registrationOpen && (
              <a
                href={TEAM_REGISTRATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
              >
                Зареєструвати команду
              </a>
            )}
          </div>

          <div className="text-center">
            <a
              href="https://docs.google.com/spreadsheets/d/1tkSU3Vx6aTYudozzGhJtx_ALBgD97r2URsjnAirldlY/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-success text-success-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
            >
              🏆 Результати командної першості
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
