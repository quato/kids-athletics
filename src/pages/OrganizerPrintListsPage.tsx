import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPrintLists } from "@/lib/admin-api";
import type { PrintListParticipant } from "@/lib/admin-api";

const STORAGE_KEY = "organizer_token";

const AGE_GROUPS = [
  { key: "2022-2023", label: "2022 – 2023", event: "Біг на 60 м" },
  { key: "2020-2021", label: "2020 – 2021", event: "Біг на 100 м (50м гладкий біг + 50м з бар'єрами)" },
  { key: "2018-2019", label: "2018 – 2019", event: "Біг на 150 м (100м гладкий біг + 50м з перешкодами)" },
  { key: "2016-2017", label: "2016 – 2017", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
  { key: "2014-2015", label: "2014 – 2015", event: "Біг на 200 м (150м гладкий біг + 50м з перешкодами)" },
] as const;

function ParticipantsTable({ participants }: { participants: PrintListParticipant[] }) {
  if (participants.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">Немає учасників</p>;
  }

  return (
    <table className="print-table w-full border-collapse">
      <thead>
        <tr>
          <th className="text-center w-12">№</th>
          <th className="text-left">Фамилия и Имя</th>
          <th className="text-center w-28">Год рождения</th>
          <th className="text-center w-28">Стартовый номер</th>
          <th className="text-left w-32">Примітки</th>
        </tr>
      </thead>
      <tbody>
        {participants.map((p, i) => (
          <tr key={p.startNumber}>
            <td className="text-center">{i + 1}</td>
            <td>{p.childName}</td>
            <td className="text-center">{p.birthYear}</td>
            <td className="text-center font-semibold">{p.startNumber}</td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const OrganizerPrintListsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem(STORAGE_KEY);

  useEffect(() => {
    if (!token) navigate("/organizers", { replace: true });
  }, [token, navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-print-lists", token],
    queryFn: () => fetchPrintLists(token!),
    enabled: !!token,
  });

  if (!token) return null;

  const generatedLabel = data
    ? new Date(data.generatedAt).toLocaleString("uk-UA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 18mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-document {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }

          .print-page {
            page-break-after: always;
            margin-bottom: 0 !important;
          }

          .print-page:last-child {
            page-break-after: auto;
          }

          .print-table {
            width: 100% !important;
          }

          .print-table thead {
            display: table-header-group;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #333;
            padding: 5px 8px;
            font-size: 11pt;
          }

          .print-table th {
            background: #eee !important;
            font-weight: 700;
          }

          h1 {
            font-size: 16pt !important;
          }
        }

        @media screen {
          .print-page {
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px dashed #ccc;
          }
        }

        .print-table th,
        .print-table td {
          border: 1px solid #333;
          padding: 6px 10px;
          font-size: 12pt;
        }

        .print-table th {
          background: #f0f0f0;
          font-weight: 700;
        }

        .print-table thead {
          display: table-header-group;
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/organizers">
              <ArrowLeft className="w-4 h-4" />
              Назад до адмінки
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {generatedLabel && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Згенеровано: {generatedLabel}
              </span>
            )}
            <Button size="sm" onClick={() => window.print()} className="gap-2" disabled={isLoading || isError}>
              <Printer className="w-4 h-4" />
              Друк
            </Button>
          </div>
        </div>
      </div>

      <div className="print-document max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Завантаження списків…
          </div>
        )}

        {isError && (
          <p className="text-destructive text-center py-20">
            Не вдалося завантажити списки. Перевірте вхід у{" "}
            <Link to="/organizers" className="underline">
              адмінку
            </Link>
            .
          </p>
        )}

        {data &&
          AGE_GROUPS.map((group, index) => {
            const participants = data.groups[group.key] ?? [];
            const isLast = index === AGE_GROUPS.length - 1;

            return (
              <section
                key={group.key}
                className={`print-page ${isLast ? "mb-0" : "mb-12"}`}
              >
                <header className="mb-4">
                  <h1 className="text-xl font-bold font-heading">
                    Вікова категорія {group.label}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">{group.event}</p>
                  {generatedLabel && (
                    <p className="text-xs text-muted-foreground mt-2 no-print sm:hidden">
                      Згенеровано: {generatedLabel}
                    </p>
                  )}
                </header>
                <ParticipantsTable participants={participants} />
              </section>
            );
          })}
      </div>
    </>
  );
};

export default OrganizerPrintListsPage;
