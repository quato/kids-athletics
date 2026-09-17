import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { editionDisplayName, pastEditions } from "@/editions";

const ArchivePage = () => {
  const past = pastEditions();

  useEffect(() => {
    const previous = document.title;
    document.title = "Архів фестивалів — Kids Athletics FEST";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 pt-28 pb-16">
        <h1 className="font-heading font-black text-3xl text-foreground mb-2">
          Архів фестивалів
        </h1>
        <p className="text-muted-foreground mb-10">
          Минулі видання Kids Athletics FEST зі програмою та результатами.
        </p>

        {past.length === 0 ? (
          <p className="text-muted-foreground">Архів поки порожній.</p>
        ) : (
          <div className="grid gap-6">
            {past.map((edition) => (
              <article
                key={edition.slug}
                className="bg-card rounded-2xl shadow-md p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h2 className="font-heading font-bold text-xl text-foreground">
                    {editionDisplayName(edition)}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {edition.eventDateLabel} · {edition.city}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/fest/${edition.slug}`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all"
                  >
                    Сторінка фесту
                  </Link>
                  {edition.results && (
                    <Link
                      to={`/results/${edition.slug}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-bold shadow hover:shadow-md transition-all"
                    >
                      Результати
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ArchivePage;
