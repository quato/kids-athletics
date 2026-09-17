import iconMixed from "@/assets/icon-1-2026.png";
import iconAgility from "@/assets/icon-3-2026.png";
import iconEndurance from "@/assets/icon-6-2026.png";
import iconTripleJump from "@/assets/icon-triple-jump-2026-10.png";
import iconZigzag from "@/assets/icon-zigzag-2026-10.png";
import iconVortex from "@/assets/icon-vortex-2026-10.png";
import type { Edition } from "./types";

export const october2026: Edition = {
  slug: "october-2026",
  shortName: "Kids athletics",
  accentWord: "OCTOBER FEST",
  eventDate: new Date("2026-10-11T09:00:00+03:00"),
  eventDateLabel: "11 жовтня 2026 р.",
  festOverAt: new Date("2026-10-11T21:00:00+03:00"),
  registrationOpensAt: new Date("2026-09-01T00:00:00+03:00"),
  registrationOpenLabel: "вже відкрита",
  statsOpensAt: new Date("2026-09-01T00:00:00+03:00"),
  registrationDeadlineLabel: "до 5 жовтня 2026 року",
  city: "Дніпро",
  venue: "Точна адреса стадіону буде повідомлена зареєстрованим учасникам.",
  participantLimit: 200,
  fees: { exhibition: 400, team: 500 },
  birthYears: [2014, 2023],
  teamComposition: [
    "2 дітей 2015–2016 року народження",
    "2 дітей 2017–2018 року народження",
    "2 дітей 2019–2020 року народження",
  ],
  teamRegistrationClosed: false,
  teamDisciplines: [
    { id: "mixed", name: "Естафета «Змішана»", icon: iconMixed },
    { id: "triple-jump", name: "Стрибки «Потрійний з місця»", icon: iconTripleJump },
    { id: "agility", name: "Естафета «Квадрат спритності»", icon: iconAgility },
    { id: "zigzag", name: "Метання «Зигзаг»", icon: iconZigzag },
    { id: "vortex", name: "Метання «Вортексу»", icon: iconVortex },
    { id: "endurance", name: "Гонка «Супер-перегони» 3 хв", icon: iconEndurance },
  ],
  exhibitionRaces: [
    { age: "Інваліди", event: "Біг по прямій 60 м" },
    { age: "2022 – 2023", event: "Біг на 60 м" },
    { age: "2020 – 2021", event: "Біг на 100 м (50м гладкий біг + 50м з бар'єрами)" },
    { age: "2018 – 2019", event: "Біг на 150 м (100м гладкий біг + 50м з перешкодами)" },
    { age: "2016 – 2017", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
    { age: "2014 – 2015", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
  ],
  reglamentPdf: "/reglament_kids_athletics_october-fest_10-2026.pdf",
  results: null,
};
