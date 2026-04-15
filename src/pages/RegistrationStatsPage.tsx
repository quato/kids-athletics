import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AGE_GROUPS = [
  { key: "special",   age: "Інваліди",    event: "Біг по прямій 60 м" },
  { key: "2022-2023", age: "2022 – 2023", event: "Біг на 60 м" },
  { key: "2020-2021", age: "2020 – 2021", event: "Біг на 100 м (50м гладкий біг + 50м з бар'єрами)" },
  { key: "2018-2019", age: "2018 – 2019", event: "Біг на 150 м (100м гладкий біг + 50м з перешкодами)" },
  { key: "2016-2017", age: "2016 – 2017", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
  { key: "2014-2015", age: "2014 – 2015", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
] as const;

interface Starter {
  childName: string;
  startNumber: number;
}

interface StatsData {
  counts: Record<string, number>;
  starters: Record<string, Starter[]>;
}

async function fetchStats(): Promise<StatsData> {
  const res = await fetch("/api/registration-stats");
  if (!res.ok) throw new Error("Не вдалося завантажити статистику");
  return res.json() as Promise<StatsData>;
}

function AgeGroupRow({ groupKey, age, event, count, starters }: {
  groupKey: string;
  age: string;
  event: string;
  count: number;
  starters: Starter[];
}) {
  const [open, setOpen] = useState(false);
  const hasStarters = starters.length > 0;

  return (
    <>
      <tr
        className={`border-b border-border transition-colors ${hasStarters ? "cursor-pointer hover:bg-muted/50" : ""} ${open ? "bg-muted/30" : ""}`}
        onClick={() => hasStarters && setOpen((v) => !v)}
      >
        <td className="px-5 py-3 font-semibold text-foreground text-sm">
          {age}
          <span className="block sm:hidden text-xs font-normal text-muted-foreground mt-0.5">{event}</span>
        </td>
        <td className="px-5 py-3 text-foreground text-sm hidden sm:table-cell">{event}</td>
        <td className="px-5 py-3 text-right">
          <span className={`inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full font-bold text-sm px-2 ${count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {count}
          </span>
        </td>
        <td className="px-3 py-3 text-muted-foreground w-8">
          {hasStarters && (open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
        </td>
      </tr>
      {open && hasStarters && (
        <tr className="border-b border-border bg-muted/20">
          <td colSpan={4} className="px-5 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-1">
              {starters.map((s) => (
                <div key={s.startNumber} className="flex items-center gap-2 text-sm py-0.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-black text-xs shrink-0">
                    {s.startNumber}
                  </span>
                  <span className="text-foreground font-medium truncate">{s.childName}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const RegistrationStatsPage = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["registration-stats"],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  const total = data
    ? Object.values(data.counts).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-3xl px-4 pt-28 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На головну
        </Link>

        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-heading font-black text-3xl text-foreground mb-1">
              Реєстрації учасників
            </h1>
            <p className="text-muted-foreground text-sm">
              Оновлюється автоматично кожну хвилину
            </p>
          </div>
          {!isLoading && !isError && (
            <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-bold text-primary text-xl">{total}</span>
              <span className="text-sm text-muted-foreground">учасників</span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Завантаження…
          </div>
        )}

        {isError && (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground">Не вдалося завантажити статистику.</p>
            <button onClick={() => refetch()} className="text-sm text-primary hover:underline">
              Спробувати ще раз
            </button>
          </div>
        )}

        {data && (
          <div className="bg-card rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary text-secondary-foreground text-sm">
                  <th className="px-5 py-3 text-left font-bold">Вікова група</th>
                  <th className="px-5 py-3 text-left font-bold hidden sm:table-cell">Дистанція / Подія</th>
                  <th className="px-5 py-3 text-right font-bold">Зареєстровано</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {AGE_GROUPS.map((group, i) => (
                  <AgeGroupRow
                    key={group.key}
                    groupKey={group.key}
                    age={group.age}
                    event={group.event}
                    count={data.counts[group.key] ?? 0}
                    starters={data.starters[group.key] ?? []}
                  />
                ))}
                <tr className="bg-muted border-t-2 border-border">
                  <td className="px-5 py-3 font-bold text-foreground" colSpan={2}>Разом</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm px-2">
                      {total}
                    </span>
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RegistrationStatsPage;
