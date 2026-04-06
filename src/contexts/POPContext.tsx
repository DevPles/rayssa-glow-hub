import { createContext, useContext, useState, ReactNode } from "react";

export interface POPDocument {
  id: string;
  name: string;
  description: string;
  patientName: string;
  patientCpf: string;
  materials: string[];
  techniques: string[];
  steps: string[];
  observations: string;
  createdAt: string;
  updatedAt: string;
}

interface POPContextType {
  pops: POPDocument[];
  addPOP: (pop: Omit<POPDocument, "id">) => void;
  updatePOP: (id: string, data: Partial<POPDocument>) => void;
  deletePOP: (id: string) => void;
}

const POPContext = createContext<POPContextType | null>(null);

const mockPOPs: POPDocument[] = [
  {
    id: "pop1",
    name: "Limpeza de Pele Profunda",
    description: "Procedimento de limpeza de pele com extração e aplicação de ativos para renovação celular.",
    patientName: "Maria Silva",
    patientCpf: "123.456.789-00",
    materials: ["Algodão", "Gaze estéril", "Peeling enzimático", "Máscara calmante", "Protetor solar FPS 50"],
    techniques: ["Higienização com sabonete específico", "Esfoliação enzimática", "Vapor de ozônio por 10 min", "Extração manual com luvas estéreis", "Aplicação de máscara calmante"],
    steps: [
      "1. Higienizar a face com sabonete facial adequado ao tipo de pele",
      "2. Aplicar esfoliante enzimático por 5 minutos",
      "3. Submeter ao vapor de ozônio por 10 minutos",
      "4. Realizar extração manual cuidadosa",
      "5. Aplicar máscara calmante por 15 minutos",
      "6. Finalizar com protetor solar FPS 50",
    ],
    observations: "Contraindicado para peles com lesões ativas ou inflamação severa. Orientar paciente sobre uso de protetor solar e evitar exposição solar por 48h.",
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "pop2",
    name: "Peeling Químico Superficial",
    description: "Aplicação controlada de ácido para promover renovação celular e tratamento de manchas.",
    patientName: "Maria Silva",
    patientCpf: "123.456.789-00",
    materials: ["Ácido glicólico 30%", "Neutralizante", "Gaze", "Pincel de silicone", "Hidratante calmante", "Protetor solar FPS 50"],
    techniques: ["Aplicação uniforme com pincel de silicone", "Cronometragem precisa do tempo de ação", "Neutralização imediata ao primeiro sinal de eritema excessivo"],
    steps: [
      "1. Limpar e desengordurar a pele",
      "2. Aplicar ácido glicólico 30% com pincel de silicone em movimentos uniformes",
      "3. Cronometrar 3 minutos de ação",
      "4. Neutralizar com solução específica",
      "5. Aplicar hidratante calmante",
      "6. Finalizar com protetor solar FPS 50",
    ],
    observations: "Paciente deve evitar sol, maquiagem e produtos ácidos por 72h. Descamação fina é esperada entre 3-5 dias pós-procedimento.",
    createdAt: "2026-01-12T10:00:00Z",
    updatedAt: "2026-01-12T10:00:00Z",
  },
];

export const POPProvider = ({ children }: { children: ReactNode }) => {
  const [pops, setPops] = useState<POPDocument[]>(mockPOPs);

  const addPOP = (pop: Omit<POPDocument, "id">) => {
    setPops((prev) => [...prev, { ...pop, id: `pop${Date.now()}` }]);
  };

  const updatePOP = (id: string, data: Partial<POPDocument>) => {
    setPops((prev) => prev.map((p) => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  };

  const deletePOP = (id: string) => {
    setPops((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <POPContext.Provider value={{ pops, addPOP, updatePOP, deletePOP }}>
      {children}
    </POPContext.Provider>
  );
};

export const usePOPs = () => {
  const ctx = useContext(POPContext);
  if (!ctx) throw new Error("usePOPs must be used within POPProvider");
  return ctx;
};
