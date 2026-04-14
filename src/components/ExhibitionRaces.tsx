import { Link } from "react-router-dom";

const REGISTRATION_OPEN_DATE = new Date("2026-04-19T00:00:00");

const races = [
  { age: "Інваліди", event: "Біг по прямій 60 м" },
  { age: "2022 – 2023", event: "Біг на 60 м" },
  { age: "2020 – 2021", event: "Біг на 100 м (50м гладкий біг + 50м з бар'єрами)" },
  { age: "2018 – 2019", event: "Біг на 150 м (100м гладкий біг + 50м з перешкодами)" },
  { age: "2016 – 2017", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
  { age: "2014 – 2015", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
];

const ExhibitionRaces = () => {
  const isRegistrationOpen = new Date() >= REGISTRATION_OPEN_DATE;

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
              {races.map((r, i) => (
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

        <div className={`border-l-4 rounded-xl p-4 mb-6 ${isRegistrationOpen ? "bg-success/10 border-success" : "bg-muted border-muted-foreground/30"}`}>
          <p className="text-foreground font-semibold text-sm">
            {isRegistrationOpen ? (
              <>Реєстрація на виставкові забіги <span className="text-success">відкрита</span>!</>
            ) : (
              <>Реєстрація на виставкові забіги відкриється <span className="text-primary">19 квітня</span>.</>
            )}
          </p>
          {isRegistrationOpen && (
            <Link
              to="/registration"
              className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
            >
              Зареєструватись на виставковий забіг
            </Link>
          )}
        </div>

        <p className="text-muted-foreground text-sm">
          <strong>Виставкові забіги</strong> організовуються з метою створення спортивної події, відкритої і доступної для всіх дітей відповідної вікової категорії (2014–2023 року народження).
        </p>
      </div>
    </section>
  );
};

export default ExhibitionRaces;
