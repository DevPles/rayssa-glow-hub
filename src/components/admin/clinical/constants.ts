import { supabase } from "@/integrations/supabase/client";

// ===== UTILITY FUNCTIONS =====

export const calcGestationalAge = (dum: string): string => {
  if (!dum) return "—";
  const dumDate = new Date(dum);
  const today = new Date();
  const diffMs = today.getTime() - dumDate.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const days = Math.floor((diffMs % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  if (weeks < 0) return "—";
  return `${weeks}s ${days}d`;
};

export const calcGestationalWeeks = (dum: string, refDate?: string): number => {
  if (!dum) return 0;
  const ref = refDate ? new Date(refDate) : new Date();
  const diffMs = ref.getTime() - new Date(dum).getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
};

export const calcGestationalAgeAtDate = (dum: string, date: string): string => {
  if (!dum || !date) return "";
  const dumDate = new Date(dum);
  const refDate = new Date(date);
  const diffMs = refDate.getTime() - dumDate.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const days = Math.floor((diffMs % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  if (weeks < 0) return "";
  return `${weeks}s ${days}d`;
};

export const calcDPP = (dum: string): string => {
  if (!dum) return "";
  const d = new Date(dum);
  d.setDate(d.getDate() + 280);
  return d.toISOString().split("T")[0];
};

export const calcIMC = (weight: string, height: string): string => {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (!w || !h || h === 0) return "";
  return (w / (h * h)).toFixed(1);
};

export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const lookupCPF = async (cpf: string): Promise<{ name: string; birthDate: string; address: string } | null> => {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return null;
  try {
    const { data, error } = await supabase.functions.invoke("cpf-lookup", {
      body: { cpf: clean },
    });
    if (error || !data?.success) return null;
    return {
      name: data.data.name || "",
      birthDate: data.data.birthDate || "",
      address: data.data.address || "",
    };
  } catch {
    return null;
  }
};

export const suggestNextAppointment = (igWeeks: number): string => {
  const today = new Date();
  let daysToAdd = 30; // mensal
  if (igWeeks >= 36) daysToAdd = 7; // semanal
  else if (igWeeks >= 28) daysToAdd = 14; // quinzenal
  const next = new Date(today);
  next.setDate(next.getDate() + daysToAdd);
  return next.toISOString().split("T")[0];
};

export const getTrimesterFromIG = (igWeeks: number): "1" | "2" | "3" => {
  if (igWeeks <= 13) return "1";
  if (igWeeks <= 27) return "2";
  return "3";
};

export const parseBloodPressure = (bp: string): { systolic: number; diastolic: number } | null => {
  if (!bp) return null;
  const match = bp.match(/(\d+)\s*[\/x]\s*(\d+)/);
  if (!match) return null;
  return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
};

export const handleFileUpload = (accept: string, onFiles: (urls: string[]) => void) => {
  const input = document.createElement("input");
  input.type = "file"; input.accept = accept; input.multiple = true;
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    onFiles(urls);
  };
  input.click();
};

// ===== EXAMS BY TRIMESTER =====

export const EXAMS_BY_TRIMESTER: Record<string, string[]> = {
  "1": ["Hemograma Completo", "Tipagem Sanguínea", "Glicemia de Jejum", "Urina Tipo I", "Urocultura", "Toxoplasmose IgG/IgM", "Rubéola IgG/IgM", "HIV", "VDRL", "Hepatite B (HBsAg)", "TSH", "Ultrassom 1º Trimestre", "Coombs Indireto"],
  "2": ["Ultrassom Morfológico", "TOTG 75g", "Hemograma", "Coombs Indireto", "Urina Tipo I"],
  "3": ["Hemograma", "Glicemia", "VDRL", "HIV", "Hepatite B", "Urocultura", "Estreptococo Grupo B (GBS)", "Ultrassom 3º Trimestre"],
};

// ===== VACCINES =====

export type VaccineCategory = "recomendada" | "situacao" | "contraindicada";

export interface VaccineInfo {
  name: string;
  doses: string[];
  category: VaccineCategory;
  trimester: string;
  gestationalAlert: string;
  manufacturers: string[];
  commonReactions: string[];
}

export const VACCINES_BRAZIL: VaccineInfo[] = [
  // RECOMENDADAS
  { name: "Influenza (Gripe)", doses: ["Dose Única"], category: "recomendada", trimester: "Qualquer", gestationalAlert: "Recomendada em qualquer trimestre. Protege contra complicações respiratórias graves.", manufacturers: ["Sanofi Pasteur", "Butantan", "Seqirus", "Abbott"], commonReactions: ["Dor local", "Febre baixa", "Mialgia"] },
  { name: "dTpa (Tríplice Bacteriana)", doses: ["1ª Dose", "2ª Dose", "3ª Dose", "Reforço"], category: "recomendada", trimester: "2º/3º (20ª-36ª sem)", gestationalAlert: "Aplicar entre 20ª e 36ª semana. Protege o recém-nascido contra coqueluche.", manufacturers: ["GSK (Boostrix)", "Sanofi (Adacel)"], commonReactions: ["Dor local", "Cefaleia", "Fadiga"] },
  { name: "Hepatite B", doses: ["1ª Dose", "2ª Dose", "3ª Dose"], category: "recomendada", trimester: "Qualquer", gestationalAlert: "Indicada para gestantes não vacinadas. Esquema 0-1-6 meses.", manufacturers: ["Butantan", "Fiocruz", "GSK (Engerix-B)", "Merck (Recombivax)"], commonReactions: ["Dor local", "Febre baixa"] },
  { name: "COVID-19", doses: ["1ª Dose", "2ª Dose", "Reforço"], category: "recomendada", trimester: "Qualquer", gestationalAlert: "Gestantes são grupo prioritário. Pfizer (Comirnaty) e CoronaVac recomendadas.", manufacturers: ["Pfizer (Comirnaty)", "Sinovac (CoronaVac)", "AstraZeneca", "Janssen"], commonReactions: ["Dor local", "Fadiga", "Cefaleia", "Mialgia", "Febre"] },
  { name: "dT (Dupla Adulto)", doses: ["1ª Dose", "2ª Dose", "3ª Dose", "Reforço"], category: "recomendada", trimester: "Qualquer", gestationalAlert: "Alternativa à dTpa quando esta não estiver disponível.", manufacturers: ["Butantan", "Serum Institute"], commonReactions: ["Dor local", "Vermelhidão"] },
  // SITUAÇÕES ESPECIAIS
  { name: "Pneumocócica 23-valente", doses: ["Dose Única", "Reforço"], category: "situacao", trimester: "Qualquer (se indicada)", gestationalAlert: "Indicada para gestantes com comorbidades (diabetes, cardiopatias, pneumopatias).", manufacturers: ["Merck (Pneumovax 23)", "Sanofi"], commonReactions: ["Dor local", "Febre", "Mialgia"] },
  { name: "Meningocócica ACWY", doses: ["Dose Única"], category: "situacao", trimester: "Qualquer (se indicada)", gestationalAlert: "Considerar em situações epidemiológicas especiais.", manufacturers: ["GSK (Menveo)", "Sanofi (Menactra)", "Pfizer (Nimenrix)"], commonReactions: ["Dor local", "Cefaleia"] },
  { name: "Raiva", doses: ["1ª Dose", "2ª Dose", "3ª Dose", "4ª Dose", "5ª Dose"], category: "situacao", trimester: "Pós-exposição", gestationalAlert: "Indicada em pós-exposição (mordida animal). Pode ser aplicada na gestação.", manufacturers: ["Sanofi (Verorab)", "Butantan", "Serum Institute"], commonReactions: ["Dor local", "Cefaleia", "Náusea"] },
  { name: "Hepatite A", doses: ["1ª Dose", "2ª Dose"], category: "situacao", trimester: "Qualquer (se indicada)", gestationalAlert: "Pode ser aplicada quando houver indicação epidemiológica.", manufacturers: ["GSK (Havrix)", "Merck (Vaqta)"], commonReactions: ["Dor local", "Fadiga"] },
  // CONTRAINDICADAS
  { name: "Febre Amarela", doses: ["Dose Única", "Reforço"], category: "contraindicada", trimester: "CONTRAINDICADA", gestationalAlert: "⚠️ CONTRAINDICADA na gestação, exceto em surtos com alto risco epidemiológico.", manufacturers: ["Fiocruz/Bio-Manguinhos", "Sanofi (Stamaril)"], commonReactions: ["Febre", "Cefaleia", "Mialgia"] },
  { name: "Tríplice Viral (SCR)", doses: ["1ª Dose", "2ª Dose"], category: "contraindicada", trimester: "CONTRAINDICADA", gestationalAlert: "⚠️ CONTRAINDICADA na gestação. Vacinar no puerpério imediato se suscetível.", manufacturers: ["Fiocruz/Bio-Manguinhos", "Merck (M-M-R II)", "GSK (Priorix)"], commonReactions: ["Febre", "Exantema", "Artralgia"] },
  { name: "Varicela", doses: ["1ª Dose", "2ª Dose"], category: "contraindicada", trimester: "CONTRAINDICADA", gestationalAlert: "⚠️ CONTRAINDICADA na gestação. Vacinar no puerpério se suscetível.", manufacturers: ["Merck (Varivax)", "GSK (Varilrix)"], commonReactions: ["Dor local", "Febre baixa", "Exantema leve"] },
  { name: "HPV", doses: ["1ª Dose", "2ª Dose", "3ª Dose"], category: "contraindicada", trimester: "CONTRAINDICADA", gestationalAlert: "⚠️ CONTRAINDICADA na gestação. Completar esquema após o parto.", manufacturers: ["Merck (Gardasil 9)", "GSK (Cervarix)"], commonReactions: ["Dor local", "Cefaleia", "Febre"] },
  { name: "BCG", doses: ["Dose Única"], category: "contraindicada", trimester: "CONTRAINDICADA", gestationalAlert: "⚠️ CONTRAINDICADA na gestação. Vacina para o recém-nascido.", manufacturers: ["Fundação Ataulpho de Paiva"], commonReactions: ["Úlcera local", "Linfadenopatia"] },
];

// Category groupings for display
export const VACCINE_CATEGORIES: { key: VaccineCategory; label: string; color: string }[] = [
  { key: "recomendada", label: "✅ Recomendadas na Gestação", color: "text-green-600" },
  { key: "situacao", label: "⚠️ Situações Especiais", color: "text-amber-600" },
  { key: "contraindicada", label: "⛔ Contraindicadas", color: "text-destructive" },
];
