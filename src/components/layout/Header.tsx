import { useState } from "react";
import { Menu, UserCircle, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const navLinks = [
  { label: "Início", href: "#" },
  { label: "Serviços", href: "#servicos" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Blog", href: "#blog" },
  { label: "Contato", href: "#contato" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const { setCartOpen, totalItems } = useCart();
  const { settings, logoSrc } = useSystemSettings();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/40 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="container mx-auto flex items-center justify-between h-18 px-4 py-3">
        <a href="#" className="flex items-center gap-2.5">
          <img src={logoSrc} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <span className="font-heading text-base font-bold text-foreground leading-none block">
              {settings.companyShortName}
            </span>
            <span className="text-[10px] text-muted-foreground font-heading tracking-wide uppercase">
              {settings.companySubtitle}
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-foreground/80 hover:text-secondary px-3 py-2 rounded-lg hover:bg-secondary/5 transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setCartOpen(true)} className="rounded-full relative text-foreground/80 hover:text-secondary hover:bg-secondary/5">
            <ShoppingBag className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{totalItems}</span>
            )}
          </Button>
          <Link to="/login">
            <Button variant="outline" className="rounded-full font-heading text-secondary border-secondary/30 hover:bg-secondary hover:text-secondary-foreground px-5 gap-2 transition-all">
              <UserCircle className="h-4 w-4" />
              Entrar
            </Button>
          </Link>
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <nav className="flex flex-col gap-2 mt-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-heading font-medium text-foreground hover:text-secondary hover:bg-secondary/5 px-4 py-3 rounded-xl transition-all"
                >
                  {link.label}
                </a>
              ))}
              <button onClick={() => { setCartOpen(true); setOpen(false); }} className="w-full flex items-center text-base font-heading font-medium text-foreground hover:text-secondary hover:bg-secondary/5 px-4 py-3 rounded-xl transition-all">
                <ShoppingBag className="h-5 w-5 mr-2" /> Carrinho {totalItems > 0 && `(${totalItems})`}
              </button>
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start font-heading text-foreground hover:text-secondary px-4 py-3">
                  <UserCircle className="h-5 w-5 mr-2" /> Entrar
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
