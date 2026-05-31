import { useState } from "react";
import { Trophy, Medal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ageCategoryRuns,
  teamDisciplines,
  teamStandings,
  type AgeCategoryRun,
} from "@/data/results";

type Tab = "teams" | "individual";

const medalStyles: Record<number, string> = {
  1: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
  2: "border-slate-300 bg-slate-50 dark:bg-slate-900/40",
  3: "border-amber-600/60 bg-amber-50 dark:bg-amber-950/20",
};

function TeamStandingsTab() {
  const sorted = [...teamStandings].sort((a, b) => a.finalPlace - b.finalPlace);
  const topThree = sorted.filter((t) => t.finalPlace <= 3);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Загальний залік команд
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Перемагає команда з меншою сумою балів за всі види програми (24.05.2026, м. Дніпро).
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {topThree.map((team) => (
            <div
              key={team.team}
              className={`rounded-2xl border-2 p-5 shadow-sm ${medalStyles[team.finalPlace] ?? "border-border bg-card"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Medal
                  className={`w-6 h-6 ${
                    team.finalPlace === 1
                      ? "text-yellow-500"
                      : team.finalPlace === 2
                        ? "text-slate-400"
                        : "text-amber-700"
                  }`}
                />
                <span className="text-2xl font-black text-foreground">{team.finalPlace}</span>
                <span className="text-sm text-muted-foreground">місце</span>
              </div>
              <p className="font-heading font-bold text-lg text-foreground">{team.team}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Сума балів: <strong className="text-foreground">{team.totalPoints}</strong>
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 whitespace-nowrap">Місце</th>
                <th className="px-4 py-3">Команда</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Сума балів</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team) => (
                <tr
                  key={team.team}
                  className={`border-b border-border last:border-0 ${
                    team.finalPlace <= 3 ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-foreground">{team.finalPlace}</td>
                  <td className="px-4 py-3 font-semibold">{team.team}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{team.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">
          Розподіл місць за видами
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          У клітинках — зайняте місце команди в кожній дисципліні (менше — краще).
        </p>
        <div className="bg-card rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-3 sticky left-0 bg-card z-10">Команда</th>
                {teamDisciplines.map((d) => (
                  <th key={d.id} className="px-3 py-3 text-center whitespace-nowrap">
                    {d.name}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-bold">Σ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team) => (
                <tr key={team.team} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-semibold sticky left-0 bg-card z-10 whitespace-nowrap">
                    {team.team}
                  </td>
                  {teamDisciplines.map((d) => (
                    <td key={d.id} className="px-3 py-2.5 text-center font-mono">
                      {team.perDiscipline[d.id]}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center font-bold font-mono">{team.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IndividualRunsTable({ category }: { category: AgeCategoryRun }) {
  const rows = category.rows.filter((r) => r.name.trim() !== "");

  return (
    <div className="bg-card rounded-2xl shadow overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
            <th className="px-4 py-3 w-12">№</th>
            <th className="px-4 py-3">ПІ</th>
            {category.showBirthYear && (
              <th className="px-4 py-3 whitespace-nowrap">Рік нар.</th>
            )}
            <th className="px-4 py-3">Результат</th>
            <th className="px-4 py-3 whitespace-nowrap">Стартовий №</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.bib}-${row.no}`} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 text-muted-foreground">{row.no}</td>
              <td className="px-4 py-2.5 font-medium">{row.name}</td>
              {category.showBirthYear && (
                <td className="px-4 py-2.5 text-muted-foreground">{row.birthYear ?? "—"}</td>
              )}
              <td className="px-4 py-2.5 font-mono font-semibold">
                {row.result ?? <span className="text-muted-foreground font-normal">—</span>}
              </td>
              <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.bib}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IndividualRunsTab() {
  const [categoryId, setCategoryId] = useState(ageCategoryRuns[0].id);
  const category = ageCategoryRuns.find((c) => c.id === categoryId) ?? ageCategoryRuns[0];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Результати індивідуальних забігів у порядку стартових списків (без перерахунку місць).
      </p>

      <div className="flex flex-wrap gap-2">
        {ageCategoryRuns.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              categoryId === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div>
        <h2 className="font-heading font-bold text-lg text-foreground mb-1">
          Вікова категорія {category.label}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{category.event}</p>
        <IndividualRunsTable category={category} />
      </div>
    </div>
  );
}

const ResultsPage = () => {
  const [tab, setTab] = useState<Tab>("teams");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-6xl px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="font-heading font-black text-3xl text-foreground mb-2">
            Результати <span className="text-accent">FEST</span>
          </h1>
          <p className="text-muted-foreground">
            Kids Athletics FEST · 24 травня 2026 · м. Дніпро
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setTab("teams")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === "teams"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Командний залік
          </button>
          <button
            type="button"
            onClick={() => setTab("individual")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              tab === "individual"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Індивідуальні забіги
          </button>
        </div>

        {tab === "teams" ? <TeamStandingsTab /> : <IndividualRunsTab />}
      </main>
      <Footer />
    </div>
  );
};

export default ResultsPage;
