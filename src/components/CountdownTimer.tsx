import { useState, useEffect } from "react";
import { useEdition } from "@/editions";
import { isFestOver } from "@/lib/registration-open";

const CountdownTimer = () => {
  const { edition } = useEdition();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const festOver = isFestOver(edition, now);
  const diff = edition.eventDate.getTime() - now.getTime();
  const expired = festOver || diff <= 0;

  if (expired) {
    return (
      <div className="text-center py-6">
        <p className="text-2xl font-heading font-bold text-primary">
          {festOver ? "🎉 Фест завершено!" : "🎉 Фестиваль розпочався!"}
        </p>
        {festOver && (
          <p className="text-sm text-primary-foreground/80 mt-2">Дякуємо всім учасникам</p>
        )}
      </div>
    );
  }

  const units = [
    { value: Math.floor(diff / (1000 * 60 * 60 * 24)), label: "днів" },
    { value: Math.floor((diff / (1000 * 60 * 60)) % 24), label: "годин" },
    { value: Math.floor((diff / (1000 * 60)) % 60), label: "хвилин" },
    { value: Math.floor((diff / 1000) % 60), label: "секунд" },
  ];

  return (
    <div className="flex justify-center gap-3 md:gap-5">
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <div className="bg-card rounded-lg shadow-md w-14 h-14 md:w-18 md:h-18 flex items-center justify-center animate-count-pulse">
            <span className="text-xl md:text-3xl font-heading font-black text-primary">
              {String(unit.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-sm md:text-base mt-2 text-primary-foreground/80 font-semibold drop-shadow">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
