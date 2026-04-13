import { Phone, Mail, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-3">
              Kids Athletics FEST
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Підтримуй легку атлетику! Приєднуйся до нас у справі підтримки та підйому юних спортсменів.
            </p>
            <a 
              href="https://www.instagram.com/kids_athletics_dnipro/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              <Instagram className="w-5 h-5 text-primary" />
              @kids_athletics_dnipro
            </a>
          </div>
          <div className="md:text-right">
            <h4 className="font-heading font-bold text-lg text-foreground mb-3">Контакти</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 md:justify-end text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+380973670219" className="hover:text-primary transition-colors">(097) 367 02 19</a>
              </p>
              <p className="flex items-center gap-2 md:justify-end text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+380937942393" className="hover:text-primary transition-colors">(093) 794 23 93</a>
              </p>
              <p className="flex items-center gap-2 md:justify-end text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:kids.athletics.dn@gmail.com" className="hover:text-primary transition-colors">kids.athletics.dn@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">© 2026 Kids Athletics FEST. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
