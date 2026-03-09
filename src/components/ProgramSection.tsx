import icon1 from "@/assets/icon-1.png";
import icon2 from "@/assets/icon-2.png";
import icon3 from "@/assets/icon-3.png";
import icon4 from "@/assets/icon-4.png";
import icon5 from "@/assets/icon-5.png";

const disciplines = [
  { icon: icon1, name: "Естафета (Спринт / бар'єри)" },
  { icon: icon2, name: "Стрибок у довжину з місця" },
  { icon: icon3, name: "Естафета Формула 1" },
  { icon: icon4, name: "Метання в ціль через перешкоду" },
  { icon: icon5, name: "Метання вортексу (120 гр)" },
];

const ProgramSection = () => {
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
              <img src={d.icon} alt={d.name} className="w-24 h-24 object-contain mb-3" />
              <span className="font-heading font-bold text-sm text-foreground">{d.name}</span>
            </div>
          ))}

          {/* 6th — endurance */}
          <div className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 p-5 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-4xl">
              🏃
            </div>
            <span className="font-heading font-bold text-sm text-foreground">Гонка «Витривалість» 3 хв</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <a
            href="https://docs.google.com/spreadsheets/d/12AUHis7QH2Ng8aLjNabwUbKY6LQJ1pVmFHJUa-BKZuI/edit?usp=drivesdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-success text-success-foreground font-bold shadow hover:shadow-lg transition-all hover:scale-105"
          >
            📋 Список зареєстрованих учасників
          </a>
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
