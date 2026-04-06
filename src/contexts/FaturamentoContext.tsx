import { createContext, useContext, useState, type ReactNode } from "react";

export type RevenueType = "servico" | "produto" | "programa" | "parceria";

export interface RevenueEntry {
  id: string;
  description: string;
  type: RevenueType;
  amount: number;
  date: string;
}

export type ExpenseCategory =
  | "estoque_produtos"
  | "insumos_materiais"
  | "aluguel"
  | "salarios"
  | "marketing"
  | "impostos_fixos"
  | "manutencao"
  | "outros";

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  estoque_produtos: "Estoque / Produtos",
  insumos_materiais: "Insumos / Materiais",
  aluguel: "Aluguel",
  salarios: "Salários & Comissões",
  marketing: "Marketing & Publicidade",
  impostos_fixos: "Impostos Fixos",
  manutencao: "Manutenção & Equipamentos",
  outros: "Outros",
};

export const typeLabels: Record<string, string> = {
  servico: "Procedimento",
  produto: "Produto Vendido",
  programa: "Programa Online",
  parceria: "Parceria",
};

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
}

const initialExpenses: Expense[] = [
  { id: "e1", description: "Reposição Sérum Vitamina C (30 un)", category: "estoque_produtos", amount: 2670, date: "2026-02-01" },
  { id: "e2", description: "Agulhas microagulhamento (100 un)", category: "insumos_materiais", amount: 800, date: "2026-02-03" },
  { id: "e3", description: "Cera depilatória (5kg)", category: "insumos_materiais", amount: 325, date: "2026-02-05" },
  { id: "e4", description: "Aluguel Sala - Fevereiro", category: "aluguel", amount: 3500, date: "2026-02-01" },
  { id: "e5", description: "Salário Rosângela", category: "salarios", amount: 4200, date: "2026-02-05" },
  { id: "e6", description: "Instagram Ads", category: "marketing", amount: 800, date: "2026-02-10" },
  { id: "e7", description: "Simples Nacional - Janeiro", category: "impostos_fixos", amount: 1850, date: "2026-02-15" },
  { id: "e8", description: "Manutenção Laser Fracionado", category: "manutencao", amount: 1200, date: "2026-02-12" },
  { id: "e9", description: "Luvas e descartáveis", category: "insumos_materiais", amount: 450, date: "2026-02-08" },
  { id: "e10", description: "Gel condutor (10L)", category: "insumos_materiais", amount: 380, date: "2026-02-14" },
];

const initialRevenue: RevenueEntry[] = [
  { id: "r1", description: "Limpeza de Pele Profunda (x8)", type: "servico", amount: 1440, date: "2026-02-03" },
  { id: "r2", description: "Microagulhamento (x5)", type: "servico", amount: 1750, date: "2026-02-05" },
  { id: "r3", description: "Harmonização Facial (x3)", type: "servico", amount: 1500, date: "2026-02-07" },
  { id: "r4", description: "Radiofrequência (x6)", type: "servico", amount: 1680, date: "2026-02-10" },
  { id: "r5", description: "Criolipólise (x4)", type: "servico", amount: 1800, date: "2026-02-12" },
  { id: "r6", description: "Drenagem Gestacional (x7)", type: "servico", amount: 1260, date: "2026-02-08" },
  { id: "r7", description: "Sérum Vitamina C (x12)", type: "produto", amount: 2268, date: "2026-02-06" },
  { id: "r8", description: "Kit Gestante Essencial (x4)", type: "produto", amount: 996, date: "2026-02-09" },
  { id: "r9", description: "Protetor Solar FPS 60 (x15)", type: "produto", amount: 1335, date: "2026-02-11" },
  { id: "r10", description: "Colar Ponto de Luz (x6)", type: "produto", amount: 774, date: "2026-02-13" },
  { id: "r11", description: "Curso Skincare na Gestação (x3)", type: "programa", amount: 591, date: "2026-02-04" },
  { id: "r12", description: "Workshop Autocuidado (x8)", type: "programa", amount: 776, date: "2026-02-14" },
  { id: "r13", description: "Corte Feminino (x10)", type: "servico", amount: 800, date: "2026-02-06" },
  { id: "r14", description: "Mechas & Luzes (x4)", type: "servico", amount: 1000, date: "2026-02-15" },
  { id: "r15", description: "Pacote Dia da Noiva (x1)", type: "servico", amount: 500, date: "2026-02-20" },
  { id: "r16", description: "Parceria Lab Fleury - Exames", type: "parceria", amount: 320, date: "2026-02-18" },
];

interface FaturamentoContextType {
  revenue: RevenueEntry[];
  expenses: Expense[];
  monthlyGoals: Record<string, number>;
  addRevenue: (entry: Omit<RevenueEntry, "id">) => void;
  addExpense: (entry: Omit<Expense, "id">) => void;
  updateRevenue: (id: string, entry: Omit<RevenueEntry, "id">) => void;
  updateExpense: (id: string, entry: Omit<Expense, "id">) => void;
  deleteRevenue: (id: string) => void;
  deleteExpense: (id: string) => void;
  setMonthlyGoal: (period: string, amount: number) => void;
}

const FaturamentoContext = createContext<FaturamentoContextType | null>(null);

export const FaturamentoProvider = ({ children }: { children: ReactNode }) => {
  const [revenue, setRevenue] = useState<RevenueEntry[]>(initialRevenue);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [monthlyGoals, setMonthlyGoals] = useState<Record<string, number>>({ "2026-02": 25000 });

  const addRevenue = (entry: Omit<RevenueEntry, "id">) => {
    setRevenue((prev) => [...prev, { id: `r${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...entry }]);
  };

  const addExpense = (entry: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { id: `e${Date.now()}`, ...entry }]);
  };

  const updateRevenue = (id: string, entry: Omit<RevenueEntry, "id">) => setRevenue((p) => p.map((r) => r.id === id ? { ...entry, id } : r));
  const updateExpense = (id: string, entry: Omit<Expense, "id">) => setExpenses((p) => p.map((e) => e.id === id ? { ...entry, id } : e));
  const deleteRevenue = (id: string) => setRevenue((p) => p.filter((r) => r.id !== id));
  const deleteExpense = (id: string) => setExpenses((p) => p.filter((e) => e.id !== id));
  const setMonthlyGoal = (period: string, amount: number) => setMonthlyGoals((prev) => ({ ...prev, [period]: amount }));

  return (
    <FaturamentoContext.Provider value={{ revenue, expenses, monthlyGoals, addRevenue, addExpense, updateRevenue, updateExpense, deleteRevenue, deleteExpense, setMonthlyGoal }}>
      {children}
    </FaturamentoContext.Provider>
  );
};

export const useFaturamento = () => {
  const ctx = useContext(FaturamentoContext);
  if (!ctx) throw new Error("useFaturamento must be used within FaturamentoProvider");
  return ctx;
};
