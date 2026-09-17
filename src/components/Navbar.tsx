import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { getUpcomingEdition, resultsPathFor, useEdition } from "@/editions";
import { isFestOver, isRegistrationOpen } from "@/lib/registration-open";

const hashLinks = [
  { href: "#info", label: "Про фест" },
  { href: "#program", label: "Програма" },
  { href: "#team", label: "Команди" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { edition } = useEdition();
  const upcoming = getUpcomingEdition();

  const isFestHome = pathname === "/" || pathname.startsWith("/fest/");
  const solid = !isFestHome || scrolled;
  const festOver = isFestOver(upcoming);
  const registrationOpen = isRegistrationOpen(upcoming);
  const resultsPath = resultsPathFor(edition);
  const links = edition.adultRace
    ? [...hashLinks, { href: "#adults", label: "Дорослі" }]
    : hashLinks;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hashHref = (href: string) => (isFestHome ? href : `/${href}`);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid ? "bg-card/95 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-heading font-black text-xl text-primary">
          {edition.shortName} <span className="text-accent">{edition.accentWord}</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.href}
              href={hashHref(l.href)}
              className={`font-medium transition-colors ${
                solid ? "text-foreground hover:text-primary" : "text-primary-foreground/90 hover:text-accent"
              }`}
            >
              {l.label}
            </a>
          ))}
          {resultsPath && (
            <Link
              to={resultsPath}
              className={`font-medium transition-colors ${
                solid ? "text-foreground hover:text-primary" : "text-primary-foreground/90 hover:text-accent"
              }`}
            >
              Результати
            </Link>
          )}
          <Link
            to="/archive"
            className={`font-medium transition-colors ${
              solid ? "text-foreground hover:text-primary" : "text-primary-foreground/90 hover:text-accent"
            }`}
          >
            Архів
          </Link>
          {festOver || !registrationOpen ? (
            <span className="px-4 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-bold cursor-not-allowed">
              {festOver ? "Реєстрація закрита" : "Реєстрація скоро"}
            </span>
          ) : (
            <Link
              to="/registration"
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
            >
              Реєстрація
            </Link>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden ${solid ? "text-foreground" : "text-primary-foreground"}`}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-t border-border px-4 py-4 space-y-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={hashHref(l.href)}
              onClick={() => setMenuOpen(false)}
              className="block text-foreground font-medium hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
          {resultsPath && (
            <Link
              to={resultsPath}
              onClick={() => setMenuOpen(false)}
              className="block text-foreground font-medium hover:text-primary transition-colors"
            >
              Результати
            </Link>
          )}
          <Link
            to="/archive"
            onClick={() => setMenuOpen(false)}
            className="block text-foreground font-medium hover:text-primary transition-colors"
          >
            Архів
          </Link>
          {festOver || !registrationOpen ? (
            <span className="block text-muted-foreground font-medium cursor-not-allowed">
              {festOver ? "Реєстрація закрита" : "Реєстрація скоро"}
            </span>
          ) : (
            <Link
              to="/registration"
              onClick={() => setMenuOpen(false)}
              className="block text-primary font-bold hover:text-primary/80 transition-colors"
            >
              Реєстрація
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
