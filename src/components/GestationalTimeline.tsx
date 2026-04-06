import { Baby, Heart, Stethoscope, Calendar, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TimelineMilestone {
  week: number;
  title: string;
  description: string;
  icon: React.ElementType;
  category: "exame" | "desenvolvimento" | "consulta" | "marco";
}

const milestones: TimelineMilestone[] = [
  { week: 6, title: "Primeira Consulta Pré-Natal", description: "Confirmação da gravidez, exames iniciais e orientações.", icon: Stethoscope, category: "consulta" },
  { week: 8, title: "Primeiro Ultrassom", description: "Visualização do embrião e batimentos cardíacos.", icon: Heart, category: "exame" },
  { week: 12, title: "Ultrassom Morfológico 1º Tri", description: "Translucência nucal e rastreamento de anomalias.", icon: Baby, category: "exame" },
  { week: 16, title: "Movimentos Fetais", description: "Início da percepção dos primeiros movimentos do bebê.", icon: Star, category: "marco" },
  { week: 20, title: "Ultrassom Morfológico 2º Tri", description: "Avaliação detalhada da anatomia fetal e sexo do bebê.", icon: Baby, category: "exame" },
  { week: 24, title: "Teste de Tolerância à Glicose", description: "Rastreamento de diabetes gestacional.", icon: Stethoscope, category: "exame" },
  { week: 28, title: "Início do 3º Trimestre", description: "Consultas mais frequentes e monitoramento intensivo.", icon: Calendar, category: "consulta" },
  { week: 32, title: "Ultrassom de Crescimento", description: "Avaliação do crescimento fetal e posição do bebê.", icon: Baby, category: "exame" },
  { week: 36, title: "Preparação para o Parto", description: "Plano de parto, preparação e orientações finais.", icon: Star, category: "marco" },
  { week: 40, title: "Data Provável do Parto", description: "Monitoramento e preparo para o nascimento.", icon: Heart, category: "marco" },
];

const categoryColors = {
  exame: "bg-primary/15 text-primary border-primary/30",
  desenvolvimento: "bg-accent/15 text-accent border-accent/30",
  consulta: "bg-secondary/15 text-secondary border-secondary/30",
  marco: "bg-warning/15 text-warning border-warning/30",
};

const categoryLabels = {
  exame: "Exame",
  desenvolvimento: "Desenvolvimento",
  consulta: "Consulta",
  marco: "Marco",
};

const GestationalTimeline = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-heading font-semibold text-accent tracking-widest uppercase mb-4 bg-accent/10 px-4 py-1.5 rounded-full">
            Linha do Tempo
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Sua Gestação <span className="text-accent">Semana a Semana</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Acompanhe os marcos importantes, exames e consultas em cada fase da sua gestação.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-accent/30 to-secondary/30 hidden md:block" />

          <div className="space-y-8">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              const isLeft = index % 2 === 0;
              return (
                <div key={milestone.week} className={`flex items-center gap-6 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <Card className={`flex-1 border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${isLeft ? "md:text-right" : ""}`}>
                    <CardContent className="p-5">
                      <div className={`flex items-center gap-2 mb-2 ${isLeft ? "md:justify-end" : ""}`}>
                        <span className={`text-xs font-heading font-medium px-2 py-0.5 rounded-full border ${categoryColors[milestone.category]}`}>
                          {categoryLabels[milestone.category]}
                        </span>
                        <span className="text-xs font-heading font-bold text-muted-foreground">
                          Semana {milestone.week}
                        </span>
                      </div>
                      <h3 className="text-base font-heading font-bold text-foreground mb-1">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </CardContent>
                  </Card>

                  {/* Center dot */}
                  <div className="hidden md:flex w-10 h-10 rounded-full bg-card border-2 border-primary/30 items-center justify-center shrink-0 shadow-md z-10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  {/* Spacer for the other side */}
                  <div className="hidden md:block flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GestationalTimeline;