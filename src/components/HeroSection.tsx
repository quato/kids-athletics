import heroBackground from "@/assets/hero-background.png";
import CountdownTimer from "./CountdownTimer";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-foreground/40" />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1
          className="text-5xl md:text-7xl font-heading font-black text-primary-foreground mb-4 drop-shadow-lg"
          style={{ animationDelay: "0.1s" }}
        >
          Kids Athletics{" "}
          <span className="text-accent">FEST</span>
        </h1>
        <p className="text-xl md:text-2xl text-primary-foreground/90 font-heading font-semibold mb-2 drop-shadow">
          Фестиваль дитячої легкої атлетики!
        </p>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 drop-shadow">
          📅 24 травня 2026 р. &nbsp;·&nbsp; 📍 Дніпро
        </p>

        <div className="mb-10">
          <CountdownTimer />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#info"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Що на тебе чекає?
          </a>
          <a
            href="#program"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-accent text-accent-foreground font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            🕐 Розклад змагань
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
