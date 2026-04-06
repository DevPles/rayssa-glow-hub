import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Star } from "lucide-react";
import HeroBookingDialog from "@/components/HeroBookingDialog";
import heroBg from "@/assets/hero-bg.jpg";
import rayssaPortrait from "@/assets/rayssa-portrait.jpg";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const words = ["Parto Privado", "Parto Humanizado"];

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
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm text-primary px-4 py-2 rounded-full text-sm font-heading font-medium mb-6 border border-primary/30">
              <MapPin className="h-4 w-4" />
              Ribeirão Preto, SP
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-card mb-6 leading-[1.1]">
              <span className="inline-block animate-fade-in text-primary" style={{ animationDelay: '0ms' }}>Sistema de Experiência Exclusiva</span>{" "}
              <span className="inline-block animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>de Parto Privado</span>
            </h1>

            <p className="text-lg text-card/70 mb-8 leading-relaxed max-w-lg">
              {settings.heroDescription || "Acompanhamento gestacional completo com consultas pré-natal, linha do tempo da gestação, registro clínico digital e serviços especializados para gestantes e puérperas."}
            </p>

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

          {/* Right - Portrait */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="w-80 h-96 rounded-3xl overflow-hidden border-4 border-primary/30 shadow-2xl shadow-primary/20 relative">
                <img src={settings.heroPhotoUrl || rayssaPortrait} alt={settings.heroCardName || "Profissional"} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-card/40 backdrop-blur-md border-t border-white/20 px-5 py-4">
                  <p className="font-heading font-semibold text-foreground text-sm">{settings.heroCardName}</p>
                  <p className="text-xs text-muted-foreground">{settings.heroCardSubtitle}</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground rounded-2xl px-4 py-2 shadow-lg">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-heading font-bold text-sm">5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HeroBookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </section>
  );
};

export default HeroSection;
