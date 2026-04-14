import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const hashLinks = [
  { href: "#info", label: "Про фест" },
  { href: "#program", label: "Програма" },
  { href: "#team", label: "Команди" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // On inner pages (non-homepage) always use solid navbar
  const isHome = pathname === "/";
  const solid = !isHome || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid ? "bg-card/95 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-heading font-black text-xl text-primary">
          Kids Athletics <span className="text-accent">FEST</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {hashLinks.map((l) => (
            <a
              key={l.href}
              href={isHome ? l.href : `/${l.href}`}
              className={`font-medium transition-colors ${
                solid ? "text-foreground hover:text-primary" : "text-primary-foreground/90 hover:text-accent"
              }`}
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/registration"
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow hover:shadow-md transition-all hover:scale-105"
          >
            Реєстрація
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden ${solid ? "text-foreground" : "text-primary-foreground"}`}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-t border-border px-4 py-4 space-y-3">
          {hashLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-foreground font-medium hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/registration"
            onClick={() => setMenuOpen(false)}
            className="block text-primary font-bold hover:text-primary/80 transition-colors"
          >
            Реєстрація
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
