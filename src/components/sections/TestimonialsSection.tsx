import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { testimonials } from "@/data/mock";
import Autoplay from "embla-carousel-autoplay";

const TestimonialsSection = () => {
  return (
    <section id="depoimentos" className="py-24 md:py-32 relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/3" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-heading font-semibold text-accent tracking-widest uppercase mb-4 bg-accent/10 px-4 py-1.5 rounded-full">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-5">
            O que Nossas Gestantes <span className="text-accent">Dizem</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Histórias reais de acompanhamento e cuidado.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-12">
          <Carousel opts={{ align: "start", loop: true }}>
            <CarouselContent>
              {testimonials.map((t) => (
                <CarouselItem key={t.id} className="md:basis-1/2 lg:basis-1/2">
                  <Card className="border-0 shadow-lg h-full bg-card">
                    <CardContent className="p-8 flex flex-col h-full">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-5">
                        <Quote className="h-6 w-6 text-primary" />
                      </div>

                      <p className="text-foreground leading-relaxed mb-6 flex-1 italic">
                        "{t.text}"
                      </p>

                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-card font-heading font-bold text-sm">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-foreground text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role} · {t.date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="border-secondary/30 text-secondary hover:bg-secondary/10" />
            <CarouselNext className="border-secondary/30 text-secondary hover:bg-secondary/10" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
