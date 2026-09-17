export type EditionMode = "live" | "archive";

export type IndividualRow = {
  no: number;
  name: string;
  birthYear?: number | null;
  result: string | null;
  bib: number;
};

export type AgeCategoryRun = {
  id: string;
  label: string;
  event: string;
  showBirthYear: boolean;
  rows: IndividualRow[];
};

export type ResultTeamDiscipline = {
  id: string;
  name: string;
};

export type TeamStanding = {
  team: string;
  finalPlace: number;
  totalPoints: number;
  perDiscipline: Record<string, number>;
};

export type EditionResults = {
  teamDisciplines: ResultTeamDiscipline[];
  teamStandings: TeamStanding[];
  ageCategoryRuns: AgeCategoryRun[];
};

export type TeamProgramDiscipline = {
  id: string;
  name: string;
  icon: string;
};

export type ExhibitionRace = {
  age: string;
  event: string;
};

export type AdultRace = {
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  fee: number;
  placeLimit: number;
  minAge: number;
};

export type Edition = {
  slug: string;
  shortName: string;
  accentWord: string;
  eventDate: Date;
  eventDateLabel: string;
  festOverAt: Date;
  registrationOpensAt: Date;
  registrationOpenLabel: string;
  statsOpensAt: Date;
  registrationDeadlineLabel: string;
  city: string;
  venue: string;
  participantLimit: number;
  fees: {
    exhibition: number;
    team: number;
  };
  birthYears: [number, number];
  teamComposition: string[];
  teamRegistrationClosed: boolean;
  teamRegistrationClosedReason?: string;
  teamDisciplines: TeamProgramDiscipline[];
  exhibitionRaces: ExhibitionRace[];
  /** Optional adult race running alongside the children's programme. */
  adultRace?: AdultRace;
  reglamentPdf: string;
  results: EditionResults | null;
};
