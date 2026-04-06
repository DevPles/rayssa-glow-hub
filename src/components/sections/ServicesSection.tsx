import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import servicesBg from "@/assets/services-bg.jpg";

const serviceCards = [
  {
    title: "Pré-Natal & Consultas",
    description:
      "Acompanhamento gestacional completo com consultas periódicas, monitoramento fetal e orientações personalizadas para cada trimestre.",
    services: ["Consulta Pré-Natal", "Ultrassonografia", "Exames Laboratoriais", "Monitoramento Fetal"],
    gradient: "from-secondary/20 to-primary/10",
    link: "/estetica-avancada",
  },
  {
    title: "Linha do Tempo Gestacional",
    description:
      "Acompanhe semana a semana o desenvolvimento do seu bebê, marcos importantes e cuidados recomendados para cada fase da gestação.",
    services: ["Desenvolvimento Fetal", "Marcos por Semana", "Dicas de Cuidados", "Plano de Parto"],
    gradient: "from-accent/20 to-primary/10",
    link: "/nucleo-materno",
  },
  {
    title: "Produtos para Gestantes",
    description:
      "Loja com produtos selecionados para gestantes e mamães: kits maternidade, cosméticos seguros, enxoval e itens de bem-estar.",
    services: ["Kits Maternidade", "Cosméticos Gestacionais", "Enxoval do Bebê", "Bem-estar da Mamãe"],
    gradient: "from-primary/20 to-secondary/10",
    link: "/produtos-programas",
  },
  {
    title: "Serviços Especializados",
    description:
      "Drenagem gestacional, massagem para gestantes, cuidados pós-parto e tratamentos estéticos seguros durante a gravidez.",
    services: ["Drenagem Gestacional", "Massagem Gestacional", "Cuidados Pós-Parto", "Preparação para o Parto"],
    gradient: "from-secondary/20 to-accent/10",
    link: "/parceria-rosangela",
  },
];

const servicesWords = ["especializadas", "personalizadas"];

const ServicesSection = () => {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState(servicesWords[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = servicesWords[wordIndex];

    if (!isDeleting && displayText === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % servicesWords.length);
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

  return (
    <section id="servicos" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={servicesBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-heading font-semibold text-primary tracking-widest uppercase mb-4 bg-primary/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-primary/30">
            Nossos Serviços
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-card mb-5">
            Quatro pilares de atuação{" "}
            <span className="text-primary">{displayText}<span className="animate-pulse">|</span></span>
          </h2>
          <p className="text-card/70 max-w-2xl mx-auto text-lg">
            Cuidado integral para cada fase da gestação e do pós-parto, com profissionalismo e acolhimento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {serviceCards.map((card) => (
            <Card
              key={card.title}
              className="group border border-white/10 shadow-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden bg-white/5 backdrop-blur-md cursor-pointer"
              onClick={() => card.link ? navigate(card.link) : undefined}
            >
              {/* Gradient top strip */}
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />

              <CardContent className="p-8 flex flex-col h-full">

                <h3 className="text-xl font-heading font-bold text-card mb-3">
                  {card.title}
                </h3>
                <p className="text-card/60 text-sm leading-relaxed mb-6">
                  {card.description}
                </p>

                <ul className="space-y-3 flex-grow">
                  {card.services.map((s) => (
                    <li key={s} className="flex items-center gap-2.5 text-sm text-card/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
