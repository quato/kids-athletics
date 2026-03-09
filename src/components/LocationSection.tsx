import stadion from "@/assets/stadion.jpg";

const LocationSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${stadion})` }}
      />
      <div className="absolute inset-0 bg-foreground/50" />
      <div className="relative z-10 container mx-auto max-w-4xl text-center px-4">
        <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-primary-foreground mb-8 drop-shadow-lg">
          Локація фестивалю
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-heading font-bold text-xl text-primary-foreground/90 mb-2 drop-shadow">Місто</h4>
            <p className="text-3xl font-heading font-black text-accent drop-shadow-lg">Дніпро</p>
          </div>
          <div>
            <h4 className="font-heading font-bold text-xl text-primary-foreground/90 mb-2 drop-shadow">Деталі локації</h4>
            <p className="text-primary-foreground/80 drop-shadow">
              Точна адреса стадіону буде повідомлена зареєстрованим учасникам.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
