import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HeroBookingDialog from "@/components/HeroBookingDialog";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const words = ["Privado", "Personalizado"];

const HeroSection = () => {
  const { settings } = useSystemSettings();
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting && displayText === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const speed = isDeleting ? 80 : 120;
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(currentWord.substring(0, displayText.length - 1));
      } else {
        setDisplayText(currentWord.substring(0, displayText.length + 1));
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex]);

  const handleAgendar = () => {
    setBookingOpen(true);
  };

  const scrollToServices = () => {
    const el = document.getElementById("servicos");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden pb-24 pt-16">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover scale-75 origin-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-12 items-center">
          {/* Left content */}
          <div className="relative">
            <img src={logo} alt="LeMater" className="absolute -top-[28rem] -left-10 w-[32rem] md:w-[40rem] lg:w-[48rem] object-contain opacity-60 pointer-events-none select-none drop-shadow-2xl" />
            <h1 className="relative z-10 text-2xl md:text-3xl lg:text-4xl font-heading font-extrabold text-card mb-6 leading-[1.15]">
              <span className="animate-fade-in" style={{ animationDelay: '0ms' }}>Sistema de </span>
              <span className="animate-fade-in text-primary" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>Experiência Exclusiva</span>
              <br />
              <span className="animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>de Parto </span>
              <span className="animate-fade-in text-accent" style={{ animationDelay: '900ms', animationFillMode: 'both' }}>{displayText}<span className="animate-pulse">|</span></span>
            </h1>


            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                onClick={handleAgendar}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading text-base px-8 h-14 shadow-lg shadow-secondary/30 rounded-full"
              >
                Agendar Consulta
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToServices}
                className="font-heading text-base px-8 h-14 border-foreground/30 text-foreground bg-card/80 hover:bg-card rounded-full"
              >
                Conhecer Serviços
              </Button>
            </div>
          </div>
        </div>
      </div>

      <HeroBookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </section>
  );
};

export default HeroSection;
