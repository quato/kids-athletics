import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-05-25T09:00:00+03:00");

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = new Date();
    const diff = TARGET_DATE.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.expired) {
    return (
      <div className="text-center py-6">
        <p className="text-2xl font-heading font-bold text-primary">🎉 Фестиваль розпочався!</p>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: "днів" },
    { value: timeLeft.hours, label: "годин" },
    { value: timeLeft.minutes, label: "хвилин" },
    { value: timeLeft.seconds, label: "секунд" },
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
