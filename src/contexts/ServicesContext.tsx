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
  { value: "estetica-avancada", label: "Pré-Natal & Consultas" },
  { value: "nucleo-materno", label: "Linha do Tempo & Cuidados Gestacionais" },
  { value: "produtos-programas", label: "Produtos para Gestantes" },
  { value: "parceria-rosangela", label: "Serviços Especializados" },
];

const defaultCategoriesByPage: Record<string, string[]> = {
  "estetica-avancada": ["Consultas", "Exames", "Avaliações"],
  "nucleo-materno": ["1º Trimestre", "2º Trimestre", "3º Trimestre", "Pós-Parto"],
  "produtos-programas": ["Kits Maternidade", "Cosméticos Gestacionais", "Enxoval", "Bem-estar"],
  "parceria-rosangela": ["Drenagem & Massagem", "Preparação para o Parto", "Cuidados Pós-Parto"],
};

const initialServices: ServiceCard[] = [
  // Pré-Natal & Consultas
  { id: "f1", title: "Consulta Pré-Natal Completa", description: "Avaliação completa da saúde da gestante e do bebê com orientações personalizadas.", price: 250, duration: "60 min", page: "estetica-avancada", category: "Consultas", images: [] },
  { id: "f2", title: "Ultrassonografia Obstétrica", description: "Ultrassom para acompanhamento detalhado do desenvolvimento fetal.", price: 180, duration: "30 min", page: "estetica-avancada", category: "Exames", images: [] },
  { id: "f3", title: "Exames Laboratoriais Gestacionais", description: "Pacote completo de exames laboratoriais essenciais para cada trimestre.", price: 150, duration: "20 min", page: "estetica-avancada", category: "Exames", images: [] },
  { id: "f4", title: "Monitoramento Fetal (CTG)", description: "Cardiotocografia para monitoramento dos batimentos cardíacos fetais.", price: 200, duration: "40 min", page: "estetica-avancada", category: "Exames", images: [] },
  { id: "c1", title: "Avaliação Nutricional Gestacional", description: "Orientação nutricional especializada para cada fase da gestação.", price: 180, duration: "45 min", page: "estetica-avancada", category: "Avaliações", images: [] },
  { id: "c2", title: "Avaliação Psicológica Gestacional", description: "Suporte emocional e acompanhamento psicológico durante a gestação.", price: 200, duration: "50 min", page: "estetica-avancada", category: "Avaliações", images: [] },
  { id: "c3", title: "Consulta de Retorno Pré-Natal", description: "Acompanhamento periódico com revisão de exames e orientações.", price: 150, duration: "30 min", page: "estetica-avancada", category: "Consultas", images: [] },
  { id: "c4", title: "Consulta de Alto Risco", description: "Acompanhamento especializado para gestações de alto risco.", price: 350, duration: "60 min", page: "estetica-avancada", category: "Consultas", images: [] },
  // Linha do Tempo & Cuidados Gestacionais
  { id: "pn1", title: "Acompanhamento 1º Trimestre", description: "Consultas e orientações para as primeiras 12 semanas de gestação.", price: 250, duration: "60 min", page: "nucleo-materno", category: "1º Trimestre", images: [] },
  { id: "pn2", title: "Drenagem Linfática Gestacional", description: "Técnica suave para aliviar inchaço e retenção de líquidos na gestação.", price: 180, duration: "60 min", page: "nucleo-materno", category: "2º Trimestre", images: [] },
  { id: "pn3", title: "Massagem Gestacional Relaxante", description: "Massagem adaptada para gestantes com foco em conforto e alívio de tensões.", price: 200, duration: "60 min", page: "nucleo-materno", category: "2º Trimestre", images: [] },
  { id: "pn4", title: "Preparação para o Parto", description: "Curso preparatório com técnicas de respiração, relaxamento e plano de parto.", price: 300, duration: "90 min", page: "nucleo-materno", category: "3º Trimestre", images: [] },
  { id: "pp1", title: "Consultoria Pós-Parto", description: "Orientação completa sobre cuidados no puerpério e recuperação.", price: 200, duration: "45 min", page: "nucleo-materno", category: "Pós-Parto", images: [] },
  { id: "pp2", title: "Drenagem Pós-Parto", description: "Drenagem especializada para redução de edema e recuperação pós-parto.", price: 200, duration: "60 min", page: "nucleo-materno", category: "Pós-Parto", images: [] },
  { id: "pp3", title: "Consultoria em Amamentação", description: "Apoio e orientação especializada em aleitamento materno.", price: 180, duration: "60 min", page: "nucleo-materno", category: "Pós-Parto", images: [] },
  { id: "pp4", title: "Acompanhamento 3º Trimestre", description: "Consultas intensivas com monitoramento do bem-estar materno-fetal.", price: 280, duration: "60 min", page: "nucleo-materno", category: "3º Trimestre", images: [] },
  // Produtos para Gestantes
  { id: "kit1", title: "Kit Gestante Essencial", description: "Óleo anti-estrias, hidratante corporal e nécessaire exclusiva.", price: 249, duration: "—", page: "produtos-programas", category: "Kits Maternidade", images: [] },
  { id: "kit2", title: "Kit Pós-Parto Recuperação", description: "Creme para diástase, óleo de massagem e chá relaxante.", price: 279, duration: "—", page: "produtos-programas", category: "Kits Maternidade", images: [] },
  { id: "kit3", title: "Kit Presente Mamãe & Bebê", description: "Conjunto com produtos para a mãe e itens delicados para o bebê.", price: 329, duration: "—", page: "produtos-programas", category: "Kits Maternidade", images: [] },
  { id: "cos1", title: "Óleo Anti-Estrias Gestacional", description: "Blend de óleos naturais para prevenção de estrias durante a gestação.", price: 119, duration: "—", page: "produtos-programas", category: "Cosméticos Gestacionais", images: [] },
  { id: "cos2", title: "Hidratante Corporal para Gestantes", description: "Hidratação profunda com fórmula segura para uso durante a gestação.", price: 89, duration: "—", page: "produtos-programas", category: "Cosméticos Gestacionais", images: [] },
  { id: "cos3", title: "Protetor Solar Gestacional FPS 60", description: "Proteção solar segura para gestantes com toque seco.", price: 79, duration: "—", page: "produtos-programas", category: "Cosméticos Gestacionais", images: [] },
  { id: "env1", title: "Kit Enxoval Básico", description: "Itens essenciais para os primeiros dias do bebê: body, manta e touca.", price: 199, duration: "—", page: "produtos-programas", category: "Enxoval", images: [] },
  { id: "bem1", title: "Almofada de Amamentação", description: "Almofada ergonômica para conforto durante a amamentação.", price: 149, duration: "—", page: "produtos-programas", category: "Bem-estar", images: [] },
  // Serviços Especializados
  { id: "rs1", title: "Drenagem Gestacional Completa", description: "Sessão completa de drenagem linfática adaptada para gestantes.", price: 180, duration: "60 min", page: "parceria-rosangela", category: "Drenagem & Massagem", images: [] },
  { id: "rs2", title: "Massagem Relaxante Gestacional", description: "Massagem corporal adaptada para o conforto da gestante.", price: 200, duration: "60 min", page: "parceria-rosangela", category: "Drenagem & Massagem", images: [] },
  { id: "rs3", title: "Yoga para Gestantes", description: "Prática de yoga adaptada para cada trimestre da gestação.", price: 120, duration: "60 min", page: "parceria-rosangela", category: "Preparação para o Parto", images: [] },
  { id: "rs4", title: "Curso de Preparação para o Parto", description: "Aulas práticas sobre tipos de parto, respiração e relaxamento.", price: 350, duration: "120 min", page: "parceria-rosangela", category: "Preparação para o Parto", images: [] },
  { id: "rs5", title: "Tratamento de Diástase Abdominal", description: "Protocolo para recuperação da separação dos músculos abdominais.", price: 300, duration: "50 min", page: "parceria-rosangela", category: "Cuidados Pós-Parto", images: [] },
  { id: "rs6", title: "Tratamento Corporal Pós-Parto", description: "Protocolo completo para modelagem e firmeza corporal após a gestação.", price: 250, duration: "60 min", page: "parceria-rosangela", category: "Cuidados Pós-Parto", images: [] },
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
