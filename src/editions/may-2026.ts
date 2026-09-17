import icon1 from "@/assets/icon-1-2026.png";
import icon2 from "@/assets/icon-2-2026.png";
import icon3 from "@/assets/icon-3-2026.png";
import icon4 from "@/assets/icon-4-2026.png";
import icon5 from "@/assets/icon-5-2026.png";
import icon6 from "@/assets/icon-6-2026.png";
import { ageCategoryRuns, teamDisciplines, teamStandings } from "./results/may-2026";
import type { Edition } from "./types";

export const may2026: Edition = {
  slug: "may-2026",
  shortName: "Kids Athletics",
  accentWord: "FEST",
  eventDate: new Date("2026-05-24T09:00:00+03:00"),
  eventDateLabel: "24 травня 2026 р.",
  festOverAt: new Date("2026-05-25T00:00:00+03:00"),
  registrationOpensAt: new Date("2026-04-19T16:00:00+03:00"),
  registrationOpenLabel: "19 квітня о 16:00 (за Києвом)",
  statsOpensAt: new Date("2026-04-19T16:10:00+03:00"),
  registrationDeadlineLabel: "до 20 травня 2026 року",
  city: "Дніпро",
  venue: "Точна адреса стадіону буде повідомлена зареєстрованим учасникам.",
  participantLimit: 200,
  fees: { exhibition: 350, team: 400 },
  birthYears: [2014, 2023],
  teamComposition: [
    "2 дітей 2014–2015 року народження",
    "2 дітей 2016–2017 року народження",
    "2 дітей 2018–2019 року народження",
  ],
  teamRegistrationClosed: true,
  teamRegistrationClosedReason: "набрано 10 команд",
  teamDisciplines: [
    { id: "sprint", name: "Естафета «Спринт»", icon: icon1 },
    { id: "jump", name: "Стрибки «Гумова стрічка»", icon: icon2 },
    { id: "agility", name: "Естафета «Квадрат спритності»", icon: icon3 },
    { id: "slalom", name: "Естафета «Слалом ланцюг»", icon: icon4 },
    { id: "medball", name: "Метання назад через голову (1 кг)", icon: icon5 },
    { id: "endurance", name: "Гонка «Супер-перегони» 3 хв", icon: icon6 },
  ],
  exhibitionRaces: [
    { age: "Інваліди", event: "Біг по прямій 60 м" },
    { age: "2022 – 2023", event: "Біг на 60 м" },
    { age: "2020 – 2021", event: "Біг на 100 м (50м гладкий біг + 50м з бар'єрами)" },
    { age: "2018 – 2019", event: "Біг на 150 м (100м гладкий біг + 50м з перешкодами)" },
    { age: "2016 – 2017", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
    { age: "2014 – 2015", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
  ],
  reglamentPdf: "/reglament_kids_athletics_fest_05-2026.pdf",
  results: { teamDisciplines, teamStandings, ageCategoryRuns },
};
