import { createContext, useContext, useState, type ReactNode } from "react";

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  benefits?: string[];
  price: number;
  duration: string;
  page: string;
  category?: string;
  videoUrl?: string;
  images: string[];
}

const pages = [
  { value: "estetica-avancada", label: "Estética Avançada Feminina" },
  { value: "nucleo-materno", label: "Núcleo Materno Especializado" },
  { value: "produtos-programas", label: "Produtos & Programas" },
  { value: "parceria-rosangela", label: "Parceria Rosângela" },
];

const defaultCategoriesByPage: Record<string, string[]> = {
  "estetica-avancada": ["Facial", "Corporal", "Tratamentos Avançados"],
  "nucleo-materno": ["Pré-Natal", "Pós-Parto", "Tratamentos Especializados"],
  "produtos-programas": ["Cosméticos Profissionais", "Linha Própria de Semijoias e Joias em Ouro", "Kits Maternidade", "Programas Online & Afiliadas Leslie"],
  "parceria-rosangela": ["Cabelos", "Unhas & Mãos", "Estética Facial & Corporal"],
};

const initialServices: ServiceCard[] = [
  // Estética Avançada Feminina
  { id: "f1", title: "Limpeza de Pele Profunda", description: "Remoção de impurezas, cravos e células mortas com técnica profissional para uma pele renovada.", price: 180, duration: "60 min", page: "estetica-avancada", category: "Facial", images: [] },
  { id: "f2", title: "Microagulhamento", description: "Estímulo de colágeno com microagulhas para tratar cicatrizes, rugas finas e melasma.", price: 350, duration: "45 min", page: "estetica-avancada", category: "Facial", images: [] },
  { id: "f3", title: "Harmonização Facial", description: "Protocolos de harmonização para equilíbrio e simetria facial com técnicas avançadas.", price: 500, duration: "90 min", page: "estetica-avancada", category: "Facial", images: [] },
  { id: "f4", title: "Peeling Químico", description: "Renovação celular controlada para uniformizar tom de pele, reduzir manchas e melhorar textura.", price: 250, duration: "40 min", page: "estetica-avancada", category: "Facial", images: [] },
  { id: "c1", title: "Radiofrequência", description: "Aquecimento profundo dos tecidos para estimular colágeno, combater flacidez e melhorar contorno corporal.", price: 280, duration: "50 min", page: "estetica-avancada", category: "Corporal", images: [] },
  { id: "c2", title: "Drenagem Linfática", description: "Técnica manual para redução de retenção de líquidos, inchaço e melhora da circulação.", price: 200, duration: "60 min", page: "estetica-avancada", category: "Corporal", images: [] },
  { id: "c3", title: "Criolipólise", description: "Redução de gordura localizada por resfriamento controlado, sem procedimento invasivo.", price: 450, duration: "60 min", page: "estetica-avancada", category: "Corporal", images: [] },
  { id: "c4", title: "Massagem Modeladora", description: "Técnica vigorosa para redução de medidas, ativação da circulação e melhora do contorno corporal.", price: 180, duration: "50 min", page: "estetica-avancada", category: "Corporal", images: [] },
  { id: "a1", title: "Laser Fracionado", description: "Tecnologia laser para rejuvenescimento profundo, cicatrizes de acne e estrias.", price: 600, duration: "45 min", page: "estetica-avancada", category: "Tratamentos Avançados", images: [] },
  { id: "a2", title: "LED Terapia", description: "Fototerapia com luz LED para cicatrização, anti-inflamatório e estímulo celular.", price: 150, duration: "30 min", page: "estetica-avancada", category: "Tratamentos Avançados", images: [] },
  { id: "a3", title: "Eletroterapia", description: "Correntes elétricas terapêuticas para tonificação muscular e recuperação tecidual.", price: 220, duration: "40 min", page: "estetica-avancada", category: "Tratamentos Avançados", images: [] },
  { id: "a4", title: "Protocolo Personalizado", description: "Avaliação completa e criação de protocolo exclusivo combinando múltiplas técnicas.", price: 800, duration: "120 min", page: "estetica-avancada", category: "Tratamentos Avançados", images: [] },
  // Núcleo Materno
  { id: "pn1", title: "Acompanhamento Pré-Natal Estético", description: "Avaliação e protocolo personalizado para cada trimestre da gestação.", price: 250, duration: "60 min", page: "nucleo-materno", category: "Pré-Natal", images: [] },
  { id: "pn2", title: "Drenagem Linfática Gestacional", description: "Técnica suave para aliviar inchaço e retenção de líquidos na gestação.", price: 180, duration: "60 min", page: "nucleo-materno", category: "Pré-Natal", images: [] },
  { id: "pn3", title: "Massagem Gestacional Relaxante", description: "Massagem adaptada para gestantes com foco em conforto e alívio de tensões.", price: 200, duration: "60 min", page: "nucleo-materno", category: "Pré-Natal", images: [] },
  { id: "pn4", title: "Limpeza de Pele Gestacional", description: "Limpeza facial segura com produtos liberados para o período gestacional.", price: 150, duration: "50 min", page: "nucleo-materno", category: "Pré-Natal", images: [] },
  { id: "pp1", title: "Consultoria Pós-Parto", description: "Orientação completa sobre cuidados estéticos seguros no puerpério.", price: 200, duration: "45 min", page: "nucleo-materno", category: "Pós-Parto", images: [] },
  { id: "pp2", title: "Drenagem Pós-Parto", description: "Drenagem especializada para redução de edema e recuperação pós-parto.", price: 200, duration: "60 min", page: "nucleo-materno", category: "Pós-Parto", images: [] },
  { id: "pp3", title: "Tratamento de Diástase", description: "Protocolo para recuperação da separação dos músculos abdominais.", price: 300, duration: "50 min", page: "nucleo-materno", category: "Pós-Parto", images: [] },
  { id: "pp4", title: "Tratamento Corporal Pós-Parto", description: "Protocolo completo para modelagem e firmeza corporal após a gestação.", price: 250, duration: "60 min", page: "nucleo-materno", category: "Pós-Parto", images: [] },
  { id: "te1", title: "Tratamento de Estrias", description: "Protocolo seguro para prevenção e redução de estrias gestacionais.", price: 250, duration: "45 min", page: "nucleo-materno", category: "Tratamentos Especializados", images: [] },
  { id: "te2", title: "Harmonização Facial Gestacional", description: "Técnicas seguras de harmonização adaptadas para gestantes.", price: 350, duration: "60 min", page: "nucleo-materno", category: "Tratamentos Especializados", images: [] },
  { id: "te3", title: "Protocolo Anti-Melasma", description: "Tratamento para manchas de pele comuns na gestação com ativos seguros.", price: 280, duration: "50 min", page: "nucleo-materno", category: "Tratamentos Especializados", images: [] },
  { id: "te4", title: "Pacote Mamãe Completo", description: "Combo exclusivo com avaliação, drenagem, massagem e cuidados faciais.", price: 700, duration: "120 min", page: "nucleo-materno", category: "Tratamentos Especializados", images: [] },
  // Produtos & Programas
  { id: "cos1", title: "Sérum Vitamina C", description: "Sérum antioxidante com vitamina C pura para luminosidade e uniformidade da pele.", price: 189, duration: "—", page: "produtos-programas", category: "Cosméticos Profissionais", images: [] },
  { id: "cos2", title: "Hidratante Facial Anti-Idade", description: "Creme facial com ácido hialurônico e peptídeos para firmeza e hidratação profunda.", price: 159, duration: "—", page: "produtos-programas", category: "Cosméticos Profissionais", images: [] },
  { id: "cos3", title: "Protetor Solar FPS 60", description: "Proteção solar de alta performance com toque seco e acabamento matte.", price: 89, duration: "—", page: "produtos-programas", category: "Cosméticos Profissionais", images: [] },
  { id: "cos4", title: "Óleo Corporal Nutritivo", description: "Blend de óleos naturais para nutrição intensa e prevenção de estrias.", price: 119, duration: "—", page: "produtos-programas", category: "Cosméticos Profissionais", images: [] },
  { id: "semi1", title: "Colar Ponto de Luz", description: "Colar banhado a ouro 18k com zircônia cristal, ideal para uso diário.", price: 129, duration: "—", page: "produtos-programas", category: "Linha Própria de Semijoias e Joias em Ouro", images: [] },
  { id: "semi2", title: "Brinco Argola Cravejada", description: "Argola média com microzircônias, brilho sofisticado e fecho seguro.", price: 99, duration: "—", page: "produtos-programas", category: "Linha Própria de Semijoias e Joias em Ouro", images: [] },
  { id: "semi3", title: "Pulseira Riviera", description: "Pulseira ajustável com cristais em linha, elegância para qualquer ocasião.", price: 149, duration: "—", page: "produtos-programas", category: "Linha Própria de Semijoias e Joias em Ouro", images: [] },
  { id: "semi4", title: "Anel Solitário Delicado", description: "Anel banhado a ouro rosé com pedra central em tom rosa.", price: 79, duration: "—", page: "produtos-programas", category: "Linha Própria de Semijoias e Joias em Ouro", images: [] },
  { id: "kit1", title: "Kit Gestante Essencial", description: "Óleo anti-estrias, hidratante corporal e nécessaire exclusiva.", price: 249, duration: "—", page: "produtos-programas", category: "Kits Maternidade", images: [] },
  { id: "kit2", title: "Kit Pós-Parto Recuperação", description: "Creme para diástase, óleo de massagem e chá relaxante.", price: 279, duration: "—", page: "produtos-programas", category: "Kits Maternidade", images: [] },
  { id: "kit3", title: "Kit Presente Mamãe & Bebê", description: "Conjunto com produtos para a mãe e itens delicados para o bebê.", price: 329, duration: "—", page: "produtos-programas", category: "Kits Maternidade", images: [] },
  { id: "kit4", title: "Kit Spa em Casa", description: "Máscara facial, sais de banho, vela aromática e esfoliante corporal.", price: 199, duration: "—", page: "produtos-programas", category: "Kits Maternidade", images: [] },
  { id: "prog1", title: "Curso Skincare na Gestação", description: "Programa online completo sobre cuidados seguros com a pele durante a gravidez.", price: 197, duration: "—", page: "produtos-programas", category: "Programas Online & Afiliadas Leslie", images: [] },
  { id: "prog2", title: "Mentoria Estética Empreendedora", description: "Acompanhamento mensal para profissionais de estética que querem escalar.", price: 497, duration: "—", page: "produtos-programas", category: "Programas Online & Afiliadas Leslie", images: [] },
  { id: "prog3", title: "Programa Afiliadas Leslie", description: "Torne-se afiliada e ganhe comissões vendendo os produtos e serviços da marca.", price: 0, duration: "—", page: "produtos-programas", category: "Programas Online & Afiliadas Leslie", images: [] },
  { id: "prog4", title: "Workshop Autocuidado Feminino", description: "Evento online ao vivo sobre rotinas de autocuidado, beleza e bem-estar.", price: 97, duration: "—", page: "produtos-programas", category: "Programas Online & Afiliadas Leslie", images: [] },
  // Parceria Rosângela
  { id: "rs1", title: "Corte Feminino", description: "Corte personalizado com visagismo para valorizar o formato do rosto e estilo pessoal.", price: 80, duration: "45 min", page: "parceria-rosangela", category: "Cabelos", images: [] },
  { id: "rs5", title: "Coloração Capilar", description: "Coloração profissional com produtos premium para cobertura perfeita e brilho duradouro.", price: 150, duration: "90 min", page: "parceria-rosangela", category: "Cabelos", images: [] },
  { id: "rs6", title: "Mechas & Luzes", description: "Técnicas de iluminação capilar para efeito natural e dimensional nos fios.", price: 250, duration: "120 min", page: "parceria-rosangela", category: "Cabelos", images: [] },
  { id: "rs7", title: "Tratamento Capilar Profundo", description: "Hidratação e reconstrução intensiva para fios danificados, ressecados ou quebradiços.", price: 120, duration: "60 min", page: "parceria-rosangela", category: "Cabelos", images: [] },
  { id: "rs8", title: "Escova & Penteado", description: "Escova modeladora ou penteado para eventos, com acabamento profissional e duradouro.", price: 80, duration: "45 min", page: "parceria-rosangela", category: "Cabelos", images: [] },
  { id: "rs9", title: "Manicure Completa", description: "Cuidado completo das unhas com cutilagem, esmaltação e hidratação das mãos.", price: 45, duration: "40 min", page: "parceria-rosangela", category: "Unhas & Mãos", images: [] },
  { id: "rs10", title: "Pedicure Completa", description: "Tratamento completo dos pés com esfoliação, cutilagem e esmaltação profissional.", price: 55, duration: "50 min", page: "parceria-rosangela", category: "Unhas & Mãos", images: [] },
  { id: "rs11", title: "Alongamento em Gel", description: "Unhas alongadas com técnica em gel para durabilidade e acabamento natural ou artístico.", price: 150, duration: "90 min", page: "parceria-rosangela", category: "Unhas & Mãos", images: [] },
  { id: "rs12", title: "Nail Art & Decoração", description: "Arte personalizada nas unhas com técnicas de decoração, adesivos e pedrarias.", price: 30, duration: "20 min", page: "parceria-rosangela", category: "Unhas & Mãos", images: [] },
  { id: "rs13", title: "Limpeza de Pele Express", description: "Limpeza facial rápida para remoção de impurezas e renovação da pele.", price: 100, duration: "40 min", page: "parceria-rosangela", category: "Estética Facial & Corporal", images: [] },
  { id: "rs14", title: "Depilação com Cera", description: "Depilação profissional com cera quente ou fria para diversas regiões do corpo.", price: 70, duration: "30 min", page: "parceria-rosangela", category: "Estética Facial & Corporal", images: [] },
  { id: "rs15", title: "Massagem Relaxante", description: "Massagem corporal com óleos essenciais para alívio de tensões e relaxamento profundo.", price: 120, duration: "50 min", page: "parceria-rosangela", category: "Estética Facial & Corporal", images: [] },
  { id: "rs16", title: "Pacote Dia da Noiva", description: "Combo completo com maquiagem, penteado, manicure e tratamento facial para o grande dia.", price: 500, duration: "180 min", page: "parceria-rosangela", category: "Estética Facial & Corporal", images: [] },
];

export { pages, defaultCategoriesByPage };

interface ServicesContextType {
  services: ServiceCard[];
  setServices: React.Dispatch<React.SetStateAction<ServiceCard[]>>;
  getServicesByPage: (page: string) => ServiceCard[];
  getCategoriesForPage: (page: string) => string[];
  customCategories: Record<string, string[]>;
  setCustomCategories: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  addService: (service: Omit<ServiceCard, "id">) => void;
  updateService: (id: string, data: Omit<ServiceCard, "id">) => void;
  deleteService: (id: string) => void;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const [services, setServices] = useState<ServiceCard[]>(initialServices);
  const [customCategories, setCustomCategories] = useState<Record<string, string[]>>({});

  const getServicesByPage = (page: string) => services.filter((s) => s.page === page);

  const getCategoriesForPage = (page: string): string[] => {
    const defaults = defaultCategoriesByPage[page] || [];
    const custom = customCategories[page] || [];
    const fromServices = services.filter((s) => s.page === page && s.category).map((s) => s.category!);
    return [...new Set([...defaults, ...custom, ...fromServices])];
  };

  const addService = (data: Omit<ServiceCard, "id">) => {
    setServices((prev) => [...prev, { id: `s${Date.now()}`, ...data }]);
  };

  const updateService = (id: string, data: Omit<ServiceCard, "id">) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <ServicesContext.Provider value={{ services, setServices, getServicesByPage, getCategoriesForPage, customCategories, setCustomCategories, addService, updateService, deleteService }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
};
