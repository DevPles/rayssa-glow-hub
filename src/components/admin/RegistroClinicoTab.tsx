import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useClinicalRecords, createEmptyRecord, emptyGestationalCard,
  type ClinicalRecord, type PrenatalConsultation, type GestationalExam,
  type AssignedProfessional, type Vaccine,
} from "@/contexts/ClinicalRecordContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type View = "list" | "form" | "detail";

// ===== UTILS =====

const calcGestationalAge = (dum: string): string => {
  if (!dum) return "—";
  const dumDate = new Date(dum);
  const today = new Date();
  const diffMs = today.getTime() - dumDate.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const days = Math.floor((diffMs % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  if (weeks < 0) return "—";
  return `${weeks}s ${days}d`;
};

const calcGestationalWeeks = (dum: string, refDate?: string): number => {
  if (!dum) return 0;
  const ref = refDate ? new Date(refDate) : new Date();
  const diffMs = ref.getTime() - new Date(dum).getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
};

const calcGestationalAgeAtDate = (dum: string, date: string): string => {
  if (!dum || !date) return "";
  const dumDate = new Date(dum);
  const refDate = new Date(date);
  const diffMs = refDate.getTime() - dumDate.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const days = Math.floor((diffMs % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  if (weeks < 0) return "";
  return `${weeks}s ${days}d`;
};

const calcDPP = (dum: string): string => {
  if (!dum) return "";
  const d = new Date(dum);
  d.setDate(d.getDate() + 280);
  return d.toISOString().split("T")[0];
};

const calcIMC = (weight: string, height: string): string => {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (!w || !h || h === 0) return "";
  return (w / (h * h)).toFixed(1);
};

const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const lookupCPF = async (cpf: string): Promise<{ name: string; birthDate: string; address: string } | null> => {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return null;
  try {
    const { data, error } = await supabase.functions.invoke("cpf-lookup", {
      body: { cpf: clean },
    });
    if (error || !data?.success) {
      console.error("CPF lookup error:", error || data?.error);
      return null;
    }
    return {
      name: data.data.name || "",
      birthDate: data.data.birthDate || "",
      address: data.data.address || "",
    };
  } catch (e) {
    console.error("CPF lookup failed:", e);
    return null;
  }
};

// Exames padrão por trimestre (protocolo MS)
const EXAMS_BY_TRIMESTER: Record<string, string[]> = {
  "1": ["Hemograma Completo", "Tipagem Sanguínea", "Glicemia de Jejum", "Urina Tipo I", "Urocultura", "Toxoplasmose IgG/IgM", "Rubéola IgG/IgM", "HIV", "VDRL", "Hepatite B (HBsAg)", "TSH", "Ultrassom 1º Trimestre", "Coombs Indireto"],
  "2": ["Ultrassom Morfológico", "TOTG 75g", "Hemograma", "Coombs Indireto", "Urina Tipo I"],
  "3": ["Hemograma", "Glicemia", "VDRL", "HIV", "Hepatite B", "Urocultura", "Estreptococo Grupo B (GBS)", "Ultrassom 3º Trimestre"],
};

// Vacinas disponíveis no Brasil para gestantes - com período recomendado e categorização
type VaccineCategory = "recomendada" | "situacao" | "contraindicada";
interface VaccineInfo {
  name: string;
  doses: string[];
  category: VaccineCategory;
  trimester: string;
  gestationalAlert: string;
  manufacturers: string[];
  commonReactions: string[];
}

const VACCINES_BRAZIL: VaccineInfo[] = [
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

const handleFileUpload = (accept: string, onFiles: (urls: string[]) => void) => {
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

// ===== CHART WITH SMART DATE FILTER =====
const FilterableChart = ({ data, label, color = "hsl(var(--secondary))", currentWeek, dumDate }: { data: { week: number; value: number }[]; label: string; color?: string; currentWeek?: number; dumDate?: string }) => {
  const [fromWeek, setFromWeek] = useState<number | "">("");
  const [toWeek, setToWeek] = useState<number | "">("");

  const quickFilters = useMemo(() => {
    const cw = currentWeek || 40;
    const trim = cw <= 13 ? 1 : cw <= 27 ? 2 : 3;
    return [
      { label: "1º Tri", from: 1, to: 13 },
      { label: "2º Tri", from: 14, to: 27 },
      { label: "3º Tri", from: 28, to: 42 },
      { label: `Tri Atual (${trim}º)`, from: trim === 1 ? 1 : trim === 2 ? 14 : 28, to: trim === 1 ? 13 : trim === 2 ? 27 : 42 },
      { label: "Últ. 4 sem", from: Math.max(1, cw - 4), to: cw },
      { label: "Tudo", from: 1, to: 42 },
    ];
  }, [currentWeek]);

  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    const f = fromWeek === "" ? 1 : fromWeek;
    const t = toWeek === "" ? 42 : toWeek;
    if (f && t) return data.filter(d => d.week >= f && d.week <= t);
    return data;
  }, [data, fromWeek, toWeek]);

  const applyQuick = (from: number, to: number) => { setFromWeek(from); setToWeek(to); };

  if (data.length < 2) return <p className="text-xs text-muted-foreground text-center py-4">Dados insuficientes para gráfico</p>;

  const chartData = filteredData.length >= 2 ? filteredData : data;
  const minW = Math.min(...chartData.map(d => d.week));
  const maxW = Math.max(...chartData.map(d => d.week));
  const minV = Math.min(...chartData.map(d => d.value)) * 0.9;
  const maxV = Math.max(...chartData.map(d => d.value)) * 1.1;
  const w = 320, h = 160, px = 40, py = 20;
  const scaleX = (wk: number) => px + ((wk - minW) / (maxW - minW || 1)) * (w - 2 * px);
  const scaleY = (v: number) => h - py - ((v - minV) / (maxV - minV || 1)) * (h - 2 * py);
  const points = chartData.map(d => `${scaleX(d.week)},${scaleY(d.value)}`).join(" ");

  return (
    <div>
      <p className="text-xs font-heading font-semibold text-foreground mb-2">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {quickFilters.map((q) => (
          <button
            key={q.label}
            onClick={() => applyQuick(q.from, q.to)}
            className={`text-[10px] px-2 py-0.5 rounded-full font-heading transition-colors ${
              fromWeek === q.from && toWeek === q.to
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-[10px] text-muted-foreground">De semana</label>
        <input
          type="number" min={1} max={42} placeholder="1"
          value={fromWeek} onChange={e => setFromWeek(e.target.value ? Number(e.target.value) : "")}
          className="w-14 h-6 text-[10px] text-center rounded-md border border-border/50 bg-background/50 focus:outline-none focus:ring-1 focus:ring-secondary"
        />
        <label className="text-[10px] text-muted-foreground">até</label>
        <input
          type="number" min={1} max={42} placeholder="42"
          value={toWeek} onChange={e => setToWeek(e.target.value ? Number(e.target.value) : "")}
          className="w-14 h-6 text-[10px] text-center rounded-md border border-border/50 bg-background/50 focus:outline-none focus:ring-1 focus:ring-secondary"
        />
      </div>
      {filteredData.length < 2 && (fromWeek !== "" || toWeek !== "") ? (
        <p className="text-xs text-muted-foreground text-center py-4">Sem dados no intervalo selecionado</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = h - py - f * (h - 2 * py);
            const val = (minV + f * (maxV - minV)).toFixed(1);
            return <g key={f}><line x1={px} y1={y} x2={w - px} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" /><text x={px - 4} y={y + 3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="8">{val}</text></g>;
          })}
          {chartData.map((d) => (
            <text key={d.week} x={scaleX(d.week)} y={h - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8">{d.week}s</text>
          ))}
          <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
          {chartData.map((d, i) => (
            <circle key={i} cx={scaleX(d.week)} cy={scaleY(d.value)} r="3" fill={color} />
          ))}
        </svg>
      )}
    </div>
  );
};

// ===== MAIN COMPONENT =====
const RegistroClinicoTab = () => {
  const { user, users } = useAuth();
  const { records, addRecord, updateRecord, deleteRecord, addPrenatalConsultation, updatePrenatalConsultation, addGestationalExam, addVaccine } = useClinicalRecords();
  const professionals = users.filter((u) => u.role === "admin" || u.role === "super_admin");

  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [filterProfessionalId, setFilterProfessionalId] = useState<string>(
    user?.role === "admin" ? user.id : "all"
  );
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  const [formData, setFormData] = useState<Omit<ClinicalRecord, "id"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cpfLocked, setCpfLocked] = useState(false);
  const [cpfLoading, setCpfLoading] = useState(false);

  // Professional filter in form
  const [formSpecialtyFilter, setFormSpecialtyFilter] = useState<string>("all");

  // Consultation dialog
  const [consultDialogOpen, setConsultDialogOpen] = useState(false);
  const [consultDetailOpen, setConsultDetailOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<PrenatalConsultation | null>(null);
  const [consultForm, setConsultForm] = useState<Omit<PrenatalConsultation, "id">>({
    date: new Date().toISOString().split("T")[0], gestationalAge: "", weight: "", bloodPressure: "",
    uterineHeight: "", fetalHeartRate: "", edema: "Ausente", fetalPresentation: "",
    observations: "", conduct: "", professional: user?.name || "", nextAppointment: "", status: "agendada",
  });

  // Exam dialog
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [examDetailOpen, setExamDetailOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<GestationalExam | null>(null);
  const [examForm, setExamForm] = useState<Omit<GestationalExam, "id">>({
    date: new Date().toISOString().split("T")[0], type: "", result: "", observations: "", fileUrl: "",
    trimester: "1", interpretation: "", referenceValues: "", requestedBy: user?.name || "", laboratory: "",
  });

  // Vaccine dialog
  const [vaccineDialogOpen, setVaccineDialogOpen] = useState(false);
  const [vaccineForm, setVaccineForm] = useState<Omit<Vaccine, "id">>({
    name: "", dose: "", date: new Date().toISOString().split("T")[0], lot: "", professional: user?.name || "", manufacturer: "", reaction: "",
  });

  const filteredRecords = useMemo(() => {
    let result = records;
    if (filterProfessionalId !== "all") {
      result = result.filter((r) => r.assignedProfessionals?.some((p) => p.id === filterProfessionalId));
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) => r.patientName.toLowerCase().includes(s) || r.prontuarioNumber.toLowerCase().includes(s) || r.cpf?.includes(s));
    }
    return result;
  }, [records, filterProfessionalId, search]);

  const filteredProfessionals = useMemo(() => {
    if (formSpecialtyFilter === "all") return professionals;
    return professionals.filter((p) => p.specialty === formSpecialtyFilter);
  }, [professionals, formSpecialtyFilter]);

  // Auto-select if only one professional after filter
  useEffect(() => {
    if (formData && filteredProfessionals.length === 1) {
      const p = filteredProfessionals[0];
      if (!formData.assignedProfessionals?.some((ap) => ap.id === p.id)) {
        setFormData((prev) => prev ? { ...prev, assignedProfessionals: [{ id: p.id, name: p.name }] } : prev);
      }
    }
  }, [filteredProfessionals, formData]);

  const getNextRecordNumber = () => {
    const nums = records.map((r) => {
      const match = r.prontuarioNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return Math.max(0, ...nums) + 1;
  };

  const openNewRecord = () => {
    const defaultProfessionals: AssignedProfessional[] = user && user.role === "admin"
      ? [{ id: user.id, name: user.name }]
      : [];
    setFormData({ ...createEmptyRecord("", "", getNextRecordNumber(), defaultProfessionals) });
    setEditingId(null);
    setCpfLocked(false);
    setFormSpecialtyFilter("all");
    setView("form");
  };

  const openEditRecord = (record: ClinicalRecord) => {
    const { id, ...rest } = record;
    setFormData(rest);
    setEditingId(id);
    setCpfLocked(!!rest.cpf);
    setView("form");
  };

  const handleCPFChange = useCallback(async (value: string) => {
    const formatted = formatCPF(value);
    updateForm("cpf", formatted);
    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 11 && !cpfLocked) {
      setCpfLoading(true);
      toast({ title: "Consultando CPF...", description: "Buscando dados da gestante" });
      const data = await lookupCPF(formatted);
      setCpfLoading(false);
      if (data && data.name) {
        setFormData((prev) => prev ? {
          ...prev, cpf: formatted, fullName: data.name, patientName: data.name,
          birthDate: data.birthDate, address: data.address,
        } : prev);
        setCpfLocked(true);
        toast({ title: "Dados encontrados!", description: `${data.name}` });
      } else if (data) {
        setCpfLocked(true);
        toast({ title: "CPF válido", description: "Dados não encontrados. Preencha manualmente." });
      } else {
        toast({ title: "CPF inválido", description: "Verifique os dígitos informados.", variant: "destructive" });
      }
    }
  }, [cpfLocked]);

  const handleSave = () => {
    if (!formData || !formData.fullName) {
      toast({ title: "Preencha o nome completo da gestante", variant: "destructive" }); return;
    }
    if (!formData.assignedProfessionals || formData.assignedProfessionals.length === 0) {
      toast({ title: "Selecione ao menos um profissional responsável", variant: "destructive" }); return;
    }
    if (!formData.patientId) {
      formData.patientId = `new-${Date.now()}`;
      formData.patientName = formData.fullName;
    }
    if (formData.gestationalCard.dum && !formData.gestationalCard.dpp) {
      formData.gestationalCard.dpp = calcDPP(formData.gestationalCard.dum);
    }
    // Auto-calc IMC
    const imc = calcIMC(formData.gestationalCard.preGestationalWeight, formData.gestationalCard.height);
    if (imc) formData.gestationalCard.preGestationalBmi = imc;

    if (editingId) {
      updateRecord(editingId, formData);
      toast({ title: "Registro atualizado!" });
    } else {
      addRecord(formData);
      toast({ title: "Registro gestacional criado!" });
    }
    setView("list");
  };

  const handleDelete = (id: string) => { deleteRecord(id); toast({ title: "Registro removido" }); };

  const toggleProfessional = (profId: string, profName: string) => {
    if (!formData) return;
    const current = formData.assignedProfessionals || [];
    const exists = current.some((p) => p.id === profId);
    const updated = exists ? current.filter((p) => p.id !== profId) : [...current, { id: profId, name: profName }];
    setFormData({ ...formData, assignedProfessionals: updated });
  };

  const handleAddConsultation = () => {
    if (!selectedRecord || !consultForm.date) return;
    addPrenatalConsultation(selectedRecord.id, consultForm);
    setSelectedRecord((prev) => prev ? { ...prev, prenatalConsultations: [...prev.prenatalConsultations, { ...consultForm, id: `pc${Date.now()}` }] } : prev);
    setConsultDialogOpen(false);
    setConsultForm({ date: new Date().toISOString().split("T")[0], gestationalAge: "", weight: "", bloodPressure: "", uterineHeight: "", fetalHeartRate: "", edema: "Ausente", fetalPresentation: "", observations: "", conduct: "", professional: user?.name || "", nextAppointment: "", status: "agendada" });
    toast({ title: "Consulta registrada!" });
  };

  const handleRealizarConsulta = () => {
    if (!selectedRecord || !selectedConsultation) return;
    updatePrenatalConsultation(selectedRecord.id, selectedConsultation.id, { ...selectedConsultation, status: "realizada" });
    setSelectedRecord((prev) => prev ? {
      ...prev, prenatalConsultations: prev.prenatalConsultations.map((c) => c.id === selectedConsultation.id ? { ...selectedConsultation, status: "realizada" } : c),
    } : prev);
    setConsultDetailOpen(false);
    toast({ title: "Consulta realizada!" });
  };

  const handleCancelarConsulta = () => {
    if (!selectedRecord || !selectedConsultation) return;
    updatePrenatalConsultation(selectedRecord.id, selectedConsultation.id, { status: "cancelada" });
    setSelectedRecord((prev) => prev ? {
      ...prev, prenatalConsultations: prev.prenatalConsultations.map((c) => c.id === selectedConsultation.id ? { ...c, status: "cancelada" } : c),
    } : prev);
    setConsultDetailOpen(false);
    toast({ title: "Consulta cancelada" });
  };

  const handleAddExam = () => {
    if (!selectedRecord || !examForm.type) return;
    addGestationalExam(selectedRecord.id, examForm);
    setSelectedRecord((prev) => prev ? { ...prev, gestationalExams: [...prev.gestationalExams, { ...examForm, id: `ge${Date.now()}` }] } : prev);
    setExamDialogOpen(false);
    setExamForm({ date: new Date().toISOString().split("T")[0], type: "", result: "", observations: "", fileUrl: "", trimester: "1", interpretation: "", referenceValues: "", requestedBy: user?.name || "", laboratory: "" });
    toast({ title: "Exame registrado!" });
  };

  const handleAddVaccine = () => {
    if (!selectedRecord || !vaccineForm.name) return;
    addVaccine(selectedRecord.id, vaccineForm);
    setSelectedRecord((prev) => prev ? { ...prev, vaccines: [...(prev.vaccines || []), { ...vaccineForm, id: `v${Date.now()}` }] } : prev);
    setVaccineDialogOpen(false);
    setVaccineForm({ name: "", dose: "", date: new Date().toISOString().split("T")[0], lot: "", professional: user?.name || "", manufacturer: "", reaction: "" });
    toast({ title: "Vacina registrada!" });
  };

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const updateGestCard = (field: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, gestationalCard: { ...prev.gestationalCard, [field]: value } };
      // Auto-calc IMC
      if (field === "preGestationalWeight" || field === "height") {
        const w = field === "preGestationalWeight" ? value : updated.gestationalCard.preGestationalWeight;
        const h = field === "height" ? value : updated.gestationalCard.height;
        const imc = calcIMC(w, h);
        if (imc) updated.gestationalCard.preGestationalBmi = imc;
      }
      // Auto-calc DPP
      if (field === "dum" && value) {
        updated.gestationalCard.dpp = calcDPP(value);
      }
      return updated;
    });
  };

  const specialtyLabel = (s: string) => {
    if (s === "medico_obstetra") return "Médico(a) Obstetra";
    if (s === "enfermeiro_obstetra") return "Enfermeiro(a) Obstetra";
    return "Profissional";
  };

  // ===== LIST VIEW =====
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
            <Input placeholder="Buscar por nome, registro ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl max-w-sm" />
            <Select value={filterProfessionalId} onValueChange={setFilterProfessionalId}>
              <SelectTrigger className="rounded-xl w-[220px]"><SelectValue placeholder="Filtrar por profissional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={openNewRecord}>Nova Ficha Gestacional</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: filteredRecords.length, label: "Total de Fichas" },
            { value: filteredRecords.filter((r) => r.status === "ativo").length, label: "Ativas" },
            { value: filteredRecords.reduce((sum, r) => sum + r.prenatalConsultations.length, 0), label: "Consultas" },
            { value: filteredRecords.reduce((sum, r) => sum + r.gestationalExams.length, 0), label: "Exames" },
          ].map((s) => (
            <Card key={s.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground font-heading">Nenhum registro encontrado</p>
              </CardContent>
            </Card>
          ) : filteredRecords.map((record) => (
            <Card key={record.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => { setSelectedRecord(record); setView("detail"); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                      <span className="text-xs text-muted-foreground font-heading">{record.patientName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-heading font-bold text-foreground text-sm">{record.patientName}</h3>
                        <Badge variant={record.status === "ativo" ? "default" : "secondary"} className="text-[10px] font-heading">
                          {record.status === "ativo" ? "Ativo" : "Arquivado"}
                        </Badge>
                        {record.gestationalCard.riskClassification === "alto_risco" && (
                          <Badge variant="destructive" className="text-[10px] font-heading">Alto Risco</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{record.prontuarioNumber} {record.cpf ? `• CPF: ${record.cpf}` : ""}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                        {record.gestationalCard.dum && <span>IG: {calcGestationalAge(record.gestationalCard.dum)}</span>}
                        {record.gestationalCard.dpp && <span>DPP: {format(new Date(record.gestationalCard.dpp), "dd/MM/yyyy")}</span>}
                        <span>{record.prenatalConsultations.length} consulta(s)</span>
                      </div>
                      {record.assignedProfessionals?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {record.assignedProfessionals.map((p) => (
                            <Badge key={p.id} variant="outline" className="text-[10px] font-heading">{p.name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => openEditRecord(record)}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-xs font-heading hover:text-destructive" onClick={() => handleDelete(record.id)}>Excluir</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ===== FORM VIEW =====
  if (view === "form" && formData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setView("list")}>← Voltar</Button>
          <h2 className="font-heading font-bold text-foreground">{editingId ? "Editar Ficha" : "Nova Ficha Gestacional"}</h2>
          <Button variant="secondary" onClick={handleSave}>Salvar</Button>
        </div>

        {/* CPF First */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Identificação por CPF</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="space-y-1 flex-1 max-w-xs">
                <Label className="text-xs font-heading">CPF *</Label>
                <Input
                  value={formData.cpf || ""}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  className="rounded-xl"
                  placeholder="000.000.000-00"
                  disabled={(cpfLocked && !!editingId) || cpfLoading}
                />
                {cpfLoading && <span className="text-xs text-muted-foreground animate-pulse">Consultando CPF...</span>}
              </div>
              {cpfLocked && (
                <Button variant="outline" size="sm" onClick={() => setCpfLocked(false)}>Editar dados</Button>
              )}
            </div>
            {cpfLocked && <p className="text-xs text-muted-foreground">Dados preenchidos automaticamente. Clique em "Editar dados" para alterar.</p>}
          </CardContent>
        </Card>

        {/* Professionals */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Profissionais Responsáveis *</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <Label className="text-xs font-heading">Filtrar por categoria:</Label>
              <Select value={formSpecialtyFilter} onValueChange={setFormSpecialtyFilter}>
                <SelectTrigger className="rounded-xl w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="medico_obstetra">Médico(a) Obstetra</SelectItem>
                  <SelectItem value="enfermeiro_obstetra">Enfermeiro(a) Obstetra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredProfessionals.map((p) => {
                const isSelected = formData.assignedProfessionals?.some((ap) => ap.id === p.id);
                return (
                  <Button key={p.id} type="button" size="sm" variant={isSelected ? "default" : "outline"} onClick={() => toggleProfessional(p.id, p.name)}>
                    {p.name} {p.specialty ? `(${specialtyLabel(p.specialty)})` : ""}
                  </Button>
                );
              })}
              {filteredProfessionals.length === 0 && <p className="text-xs text-muted-foreground">Nenhum profissional nesta categoria</p>}
            </div>
          </CardContent>
        </Card>

        {/* Identification */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Dados da Gestante</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                {formData.patientPhoto ? <img src={formData.patientPhoto} alt="" className="w-16 h-16 rounded-full object-cover" /> : <span className="text-xs text-muted-foreground font-heading">Foto</span>}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => handleFileUpload("image/*", (urls) => { if (urls[0]) updateForm("patientPhoto", urls[0]); })}>
                {formData.patientPhoto ? "Trocar" : "Foto"}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="space-y-1 col-span-2"><Label className="text-xs font-heading">Nome Completo *</Label><Input value={formData.fullName} onChange={(e) => { updateForm("fullName", e.target.value); updateForm("patientName", e.target.value); }} className="rounded-xl" disabled={cpfLocked} /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Nº Registro</Label><Input value={formData.prontuarioNumber} readOnly className="rounded-xl bg-muted" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Nascimento</Label><Input type="date" value={formData.birthDate} onChange={(e) => updateForm("birthDate", e.target.value)} className="rounded-xl" disabled={cpfLocked} /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Telefone</Label><Input value={formData.phone} onChange={(e) => updateForm("phone", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Estado Civil</Label><Input value={formData.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Profissão</Label><Input value={formData.profession} onChange={(e) => updateForm("profession", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Contato Emergência</Label><Input value={formData.emergencyContact} onChange={(e) => updateForm("emergencyContact", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1 col-span-2 md:col-span-4"><Label className="text-xs font-heading">Endereço</Label><Input value={formData.address} onChange={(e) => updateForm("address", e.target.value)} className="rounded-xl" disabled={cpfLocked} /></div>
              <div className="col-span-2 md:col-span-4 flex items-center gap-3">
                <Checkbox checked={formData.consentSigned} onCheckedChange={(v) => updateForm("consentSigned", !!v)} />
                <Label className="text-xs font-heading font-semibold">Termo de consentimento assinado</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestational Card */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Cartão da Gestante</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-heading">Tipo Sanguíneo</Label>
                <Select value={formData.gestationalCard.bloodType} onValueChange={(v) => updateGestCard("bloodType", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{["A", "B", "AB", "O"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-heading">Rh</Label>
                <Select value={formData.gestationalCard.rh} onValueChange={(v) => updateGestCard("rh", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="+">Positivo (+)</SelectItem><SelectItem value="-">Negativo (-)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs font-heading">DUM</Label><Input type="date" value={formData.gestationalCard.dum} onChange={(e) => updateGestCard("dum", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">DPP (auto)</Label><Input value={formData.gestationalCard.dpp} readOnly className="rounded-xl bg-muted" /></div>
            </div>
            {formData.gestationalCard.dum && (
              <div className="text-xs text-muted-foreground">IG atual: <span className="font-semibold text-foreground">{calcGestationalAge(formData.gestationalCard.dum)}</span></div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
              <div className="space-y-1"><Label className="text-xs font-heading">G</Label><Input value={formData.gestationalCard.gravida} onChange={(e) => updateGestCard("gravida", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">P</Label><Input value={formData.gestationalCard.para} onChange={(e) => updateGestCard("para", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">A</Label><Input value={formData.gestationalCard.abortions} onChange={(e) => updateGestCard("abortions", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Peso Pré-gest. (kg)</Label><Input value={formData.gestationalCard.preGestationalWeight} onChange={(e) => updateGestCard("preGestationalWeight", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Altura (m)</Label><Input value={formData.gestationalCard.height} onChange={(e) => updateGestCard("height", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">IMC (auto)</Label><Input value={formData.gestationalCard.preGestationalBmi} readOnly className="rounded-xl bg-muted" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="space-y-1"><Label className="text-xs font-heading">Alergias</Label><Input value={formData.gestationalCard.allergies} onChange={(e) => updateGestCard("allergies", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Medicamentos</Label><Input value={formData.gestationalCard.medications} onChange={(e) => updateGestCard("medications", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Condições pré-existentes</Label><Input value={formData.gestationalCard.preExistingConditions} onChange={(e) => updateGestCard("preExistingConditions", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Cirurgias anteriores</Label><Input value={formData.gestationalCard.previousSurgeries} onChange={(e) => updateGestCard("previousSurgeries", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Histórico familiar</Label><Input value={formData.gestationalCard.familyHistory} onChange={(e) => updateGestCard("familyHistory", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1">
                <Label className="text-xs font-heading">Classificação de Risco</Label>
                <Select value={formData.gestationalCard.riskClassification} onValueChange={(v: any) => updateGestCard("riskClassification", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="habitual">Risco Habitual</SelectItem><SelectItem value="alto_risco">Alto Risco</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <p className="text-xs font-heading font-semibold text-foreground">Plano de Parto e Apoio</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="space-y-1"><Label className="text-xs font-heading">Acompanhante</Label><Input value={formData.gestationalCard.companion} onChange={(e) => updateGestCard("companion", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Tel. Acompanhante</Label><Input value={formData.gestationalCard.companionPhone} onChange={(e) => updateGestCard("companionPhone", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Pediatra</Label><Input value={formData.gestationalCard.pediatrician} onChange={(e) => updateGestCard("pediatrician", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="text-xs font-heading">Hospital/Maternidade</Label><Input value={formData.gestationalCard.hospital} onChange={(e) => updateGestCard("hospital", e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1 col-span-1 md:col-span-2"><Label className="text-xs font-heading">Plano de Parto</Label><Textarea value={formData.gestationalCard.birthPlan} onChange={(e) => updateGestCard("birthPlan", e.target.value)} className="rounded-xl min-h-[60px]" /></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-6">
          <Button variant="outline" onClick={() => setView("list")} className="flex-1">Cancelar</Button>
          <Button variant="secondary" onClick={handleSave} className="flex-1">{editingId ? "Salvar Alterações" : "Criar Registro"}</Button>
        </div>
      </div>
    );
  }

  // ===== DETAIL VIEW =====
  if (view === "detail" && selectedRecord) {
    const r = selectedRecord;
    const gc = r.gestationalCard;
    const igAtual = calcGestationalAge(gc.dum);
    const igWeeks = calcGestationalWeeks(gc.dum);

    // Chart data from consultations
    const weightData = r.prenatalConsultations
      .filter((c) => c.weight && c.gestationalAge)
      .map((c) => {
        const weekMatch = c.gestationalAge.match(/(\d+)/);
        return { week: weekMatch ? parseInt(weekMatch[1]) : 0, value: parseFloat(c.weight) };
      })
      .filter((d) => d.week > 0 && !isNaN(d.value))
      .sort((a, b) => a.week - b.week);

    const uterineHeightData = r.prenatalConsultations
      .filter((c) => c.uterineHeight && c.gestationalAge)
      .map((c) => {
        const weekMatch = c.gestationalAge.match(/(\d+)/);
        return { week: weekMatch ? parseInt(weekMatch[1]) : 0, value: parseFloat(c.uterineHeight) };
      })
      .filter((d) => d.week > 0 && !isNaN(d.value))
      .sort((a, b) => a.week - b.week);

    // Exams by trimester
    const examsByTrimester = (tri: string) => r.gestationalExams.filter((e) => e.trimester === tri);
    const getExamsDone = (tri: string) => examsByTrimester(tri).map((e) => e.type);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setView("list")}>← Voltar</Button>
          <Button variant="outline" onClick={() => openEditRecord(r)}>Editar</Button>
        </div>

        {/* Header */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0">
                  <span className="text-lg text-muted-foreground font-heading font-bold">{r.fullName.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl text-foreground">{r.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{r.prontuarioNumber} {r.cpf ? `• CPF: ${r.cpf}` : ""}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant={r.status === "ativo" ? "default" : "secondary"} className="font-heading text-xs">{r.status}</Badge>
                    {gc.riskClassification === "alto_risco" && <Badge variant="destructive" className="font-heading text-xs">Alto Risco</Badge>}
                    {gc.bloodType && <Badge variant="outline" className="font-heading text-xs">{gc.bloodType}{gc.rh}</Badge>}
                  </div>
                  {r.assignedProfessionals?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {r.assignedProfessionals.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] font-heading">{p.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {gc.dum && (
                <div className="text-right">
                  <div className="bg-secondary/10 rounded-xl px-4 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">Idade Gestacional</p>
                    <p className="text-lg font-heading font-bold text-secondary">{igAtual}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cartao" className="w-full">
          <TabsList className="w-full grid grid-cols-5 bg-white/40 backdrop-blur-xl rounded-xl">
            <TabsTrigger value="cartao" className="rounded-lg font-heading text-xs">Cartão</TabsTrigger>
            <TabsTrigger value="consultas" className="rounded-lg font-heading text-xs">Consultas ({r.prenatalConsultations.length})</TabsTrigger>
            <TabsTrigger value="exames" className="rounded-lg font-heading text-xs">Exames ({r.gestationalExams.length})</TabsTrigger>
            <TabsTrigger value="vacinas" className="rounded-lg font-heading text-xs">Vacinas ({(r.vaccines || []).length})</TabsTrigger>
            <TabsTrigger value="dados" className="rounded-lg font-heading text-xs">Dados</TabsTrigger>
          </TabsList>

          {/* CARTÃO DA GESTANTE */}
          <TabsContent value="cartao" className="space-y-4 mt-4">
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Cartão Digital da Gestante</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Tipo Sanguíneo", value: gc.bloodType ? `${gc.bloodType} ${gc.rh}` : "—" },
                    { label: "G / P / A", value: gc.gravida ? `G${gc.gravida}P${gc.para}A${gc.abortions}` : "—" },
                    { label: "DUM", value: gc.dum ? format(new Date(gc.dum), "dd/MM/yyyy") : "—" },
                    { label: "DPP", value: gc.dpp ? format(new Date(gc.dpp), "dd/MM/yyyy") : "—" },
                    { label: "Peso Pré-gest.", value: gc.preGestationalWeight ? `${gc.preGestationalWeight} kg` : "—" },
                    { label: "IMC Pré-gest.", value: gc.preGestationalBmi || "—" },
                    { label: "Classificação", value: gc.riskClassification === "habitual" ? "Risco Habitual" : "Alto Risco" },
                    { label: "IG Atual", value: igAtual },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm font-heading font-bold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FilterableChart data={weightData} label="Curva de Ganho de Peso (kg × semana)" currentWeek={igWeeks} />
                  <FilterableChart data={uterineHeightData} label="Curva de Altura Uterina (cm × semana)" color="hsl(var(--primary))" currentWeek={igWeeks} />
                </div>

                <Separator />
                <p className="text-xs font-heading font-semibold text-foreground">Saúde e Histórico</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Alergias", value: gc.allergies },
                    { label: "Medicamentos", value: gc.medications },
                    { label: "Condições pré-existentes", value: gc.preExistingConditions },
                    { label: "Cirurgias anteriores", value: gc.previousSurgeries },
                    { label: "Histórico familiar", value: gc.familyHistory },
                  ].filter(v => v.value).map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <Separator />
                <p className="text-xs font-heading font-semibold text-foreground">Plano de Parto e Apoio</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Acompanhante", value: gc.companion },
                    { label: "Tel. Acompanhante", value: gc.companionPhone },
                    { label: "Pediatra", value: gc.pediatrician },
                    { label: "Hospital", value: gc.hospital },
                  ].filter(v => v.value).map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                {gc.birthPlan && (
                  <div className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">Plano de Parto</p>
                    <p className="text-sm text-foreground">{gc.birthPlan}</p>
                  </div>
                )}

                {/* ===== CONSULTAS NO CARTÃO ===== */}
                {r.prenatalConsultations.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-heading font-semibold text-foreground">Consultas Pré-natal ({r.prenatalConsultations.length})</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/30">
                            {["#", "Data", "IG", "Peso", "PA", "AU", "BCF", "Edema", "Status"].map((h) => (
                              <th key={h} className="text-left py-1.5 px-2 text-[10px] text-muted-foreground font-heading uppercase whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {r.prenatalConsultations.map((c, idx) => (
                            <tr key={c.id} className="border-b border-border/10 hover:bg-white/20">
                              <td className="py-1.5 px-2 font-heading font-semibold">{idx + 1}</td>
                              <td className="py-1.5 px-2 whitespace-nowrap">{format(new Date(c.date), "dd/MM/yy")}</td>
                              <td className="py-1.5 px-2 whitespace-nowrap">{c.gestationalAge || "—"}</td>
                              <td className="py-1.5 px-2">{c.weight ? `${c.weight}kg` : "—"}</td>
                              <td className="py-1.5 px-2">{c.bloodPressure || "—"}</td>
                              <td className="py-1.5 px-2">{c.uterineHeight ? `${c.uterineHeight}cm` : "—"}</td>
                              <td className="py-1.5 px-2">{c.fetalHeartRate ? `${c.fetalHeartRate}bpm` : "—"}</td>
                              <td className="py-1.5 px-2">{c.edema || "—"}</td>
                              <td className="py-1.5 px-2">
                                <Badge variant={c.status === "realizada" ? "default" : c.status === "cancelada" ? "destructive" : "secondary"} className="text-[9px] font-heading">
                                  {c.status === "realizada" ? "Realiz." : c.status === "cancelada" ? "Cancel." : "Agend."}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ===== EXAMES NO CARTÃO ===== */}
                {r.gestationalExams.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-heading font-semibold text-foreground">Exames ({r.gestationalExams.length})</p>
                    <div className="space-y-1.5">
                      {(["1", "2", "3"] as const).map((tri) => {
                        const exams = r.gestationalExams.filter((e) => e.trimester === tri);
                        if (exams.length === 0) return null;
                        return (
                          <div key={tri}>
                            <p className="text-[10px] text-muted-foreground font-heading uppercase mb-1">{tri}º Trimestre</p>
                            {exams.map((exam) => (
                              <div key={exam.id} className="bg-white/20 rounded-lg p-2 mb-1 flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-heading font-semibold text-foreground">{exam.type}</span>
                                  <span className="text-[10px] text-muted-foreground ml-2">{format(new Date(exam.date), "dd/MM/yy")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {exam.interpretation && (
                                    <Badge variant={exam.interpretation === "normal" ? "default" : exam.interpretation === "alterado" ? "destructive" : "secondary"} className="text-[9px] font-heading">
                                      {exam.interpretation === "normal" ? "Normal" : exam.interpretation === "alterado" ? "Alterado" : "Inconcl."}
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground max-w-[150px] truncate">{exam.result}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* ===== VACINAS NO CARTÃO ===== */}
                {(r.vaccines || []).length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-heading font-semibold text-foreground">Vacinas ({(r.vaccines || []).length})</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/30">
                            {["Vacina", "Dose", "Data", "Lote", "Fabricante", "Profissional"].map((h) => (
                              <th key={h} className="text-left py-1.5 px-2 text-[10px] text-muted-foreground font-heading uppercase whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(r.vaccines || []).map((v) => (
                            <tr key={v.id} className="border-b border-border/10 hover:bg-white/20">
                              <td className="py-1.5 px-2 font-heading font-semibold whitespace-nowrap">{v.name === "Outra" ? v.customName || "Outra" : v.name}</td>
                              <td className="py-1.5 px-2">{v.dose}</td>
                              <td className="py-1.5 px-2 whitespace-nowrap">{format(new Date(v.date), "dd/MM/yy")}</td>
                              <td className="py-1.5 px-2">{v.lot || "—"}</td>
                              <td className="py-1.5 px-2">{v.manufacturer || "—"}</td>
                              <td className="py-1.5 px-2">{v.professional}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(r.vaccines || []).some((v) => v.reaction) && (
                      <div className="space-y-1 mt-2">
                        <p className="text-[10px] text-muted-foreground font-heading uppercase">Reações Adversas</p>
                        {(r.vaccines || []).filter((v) => v.reaction).map((v) => (
                          <div key={v.id} className="text-[11px] text-destructive">
                            <span className="font-semibold">{v.name === "Outra" ? v.customName : v.name} ({v.dose}):</span> {v.reaction}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONSULTAS */}
          <TabsContent value="consultas" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => {
                const dum = selectedRecord?.gestationalCard?.dum || "";
                const today = new Date().toISOString().split("T")[0];
                const autoIG = calcGestationalAgeAtDate(dum, today);
                setConsultForm((prev) => ({ ...prev, date: today, gestationalAge: autoIG || prev.gestationalAge }));
                setConsultDialogOpen(true);
              }}>Nova Consulta</Button>
            </div>
            {r.prenatalConsultations.length === 0 ? (
              <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
                <CardContent className="p-8 text-center"><p className="text-sm text-muted-foreground font-heading">Nenhuma consulta registrada</p></CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {r.prenatalConsultations.map((c, idx) => (
                  <Card key={c.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => { setSelectedConsultation({ ...c }); setConsultDetailOpen(true); }}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading font-bold text-sm text-foreground">Consulta #{idx + 1}</h4>
                            <Badge variant={c.status === "realizada" ? "default" : c.status === "cancelada" ? "destructive" : "secondary"} className="text-[10px] font-heading">
                              {c.status === "realizada" ? "Realizada" : c.status === "cancelada" ? "Cancelada" : "Agendada"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{format(new Date(c.date), "dd/MM/yyyy", { locale: ptBR })} • {c.gestationalAge}</p>
                        </div>
                        {c.professional && <span className="text-xs text-muted-foreground">{c.professional}</span>}
                      </div>
                      {c.status === "realizada" && (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {[
                            { label: "Peso", value: c.weight ? `${c.weight}kg` : "" },
                            { label: "PA", value: c.bloodPressure },
                            { label: "AU", value: c.uterineHeight ? `${c.uterineHeight}cm` : "" },
                            { label: "BCF", value: c.fetalHeartRate ? `${c.fetalHeartRate}bpm` : "" },
                            { label: "Edema", value: c.edema },
                            { label: "Apresentação", value: c.fetalPresentation },
                          ].filter(v => v.value).map((item) => (
                            <div key={item.label} className="bg-white/30 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground font-heading">{item.label}</p>
                              <p className="text-xs font-heading font-semibold text-foreground">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* EXAMES POR TRIMESTRE */}
          <TabsContent value="exames" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setExamDialogOpen(true)}>Novo Exame</Button>
            </div>
            {(["1", "2", "3"] as const).map((tri) => {
              const done = getExamsDone(tri);
              const expected = EXAMS_BY_TRIMESTER[tri];
              const exams = examsByTrimester(tri);
              return (
                <Card key={tri} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading flex items-center justify-between">
                      <span>{tri}º Trimestre</span>
                      <span className="text-xs text-muted-foreground font-normal">{done.length}/{expected.length} exames realizados</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Checklist */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {expected.map((examName) => {
                        const isDone = done.includes(examName);
                        return (
                          <Badge key={examName} variant={isDone ? "default" : "outline"} className="text-[10px] font-heading">
                            {isDone ? "✓ " : ""}{examName}
                          </Badge>
                        );
                      })}
                    </div>
                    {/* Exam cards */}
                    {exams.map((exam) => (
                      <div key={exam.id} className="bg-white/30 rounded-xl p-3 cursor-pointer hover:bg-white/50 transition-colors"
                        onClick={() => { setSelectedExam(exam); setExamDetailOpen(true); }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-heading font-semibold text-foreground">{exam.type}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(exam.date), "dd/MM/yyyy")} • {exam.laboratory || "—"}</p>
                          </div>
                          {exam.interpretation && (
                            <Badge variant={exam.interpretation === "normal" ? "default" : exam.interpretation === "alterado" ? "destructive" : "secondary"} className="text-[10px] font-heading">
                              {exam.interpretation === "normal" ? "Normal" : exam.interpretation === "alterado" ? "Alterado" : "Inconclusivo"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground mt-1">{exam.result}</p>
                      </div>
                    ))}
                    {exams.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum exame registrado neste trimestre</p>}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* VACINAS */}
          <TabsContent value="vacinas" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(["recomendada", "situacao", "contraindicada"] as VaccineCategory[]).map((cat) => {
                  const labels: Record<VaccineCategory, string> = { recomendada: "Recomendadas", situacao: "Situações Especiais", contraindicada: "Contraindicadas" };
                  const count = VACCINES_BRAZIL.filter(v => v.category === cat).length;
                  return (
                    <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full font-heading ${
                      cat === "recomendada" ? "bg-green-100 text-green-700" :
                      cat === "situacao" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {labels[cat]} ({count})
                    </span>
                  );
                })}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setVaccineDialogOpen(true)}>Registrar Vacina</Button>
            </div>

            {/* Summary cards */}
            {(() => {
              const totalVaccines = VACCINES_BRAZIL.filter(v => v.category !== "contraindicada").length;
              const appliedNames = new Set((r.vaccines || []).map(v => v.name));
              const appliedCount = VACCINES_BRAZIL.filter(v => v.category !== "contraindicada" && appliedNames.has(v.name)).length;
              const pendingCount = totalVaccines - appliedCount;
              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50/80 backdrop-blur-lg rounded-xl p-3 text-center">
                    <p className="text-[10px] text-green-600 font-heading uppercase">Aplicadas</p>
                    <p className="text-lg font-heading font-bold text-green-700">{appliedCount}</p>
                  </div>
                  <div className="bg-amber-50/80 backdrop-blur-lg rounded-xl p-3 text-center">
                    <p className="text-[10px] text-amber-600 font-heading uppercase">Pendentes</p>
                    <p className="text-lg font-heading font-bold text-amber-700">{pendingCount}</p>
                  </div>
                  <div className="bg-muted/30 backdrop-blur-lg rounded-xl p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">Total Doses</p>
                    <p className="text-lg font-heading font-bold text-foreground">{(r.vaccines || []).length}</p>
                  </div>
                </div>
              );
            })()}

            {/* RECOMENDADAS */}
            {(["recomendada", "situacao", "contraindicada"] as VaccineCategory[]).map((cat) => {
              const catLabels: Record<VaccineCategory, string> = { recomendada: "✅ Recomendadas na Gestação", situacao: "⚡ Situações Especiais", contraindicada: "⛔ Contraindicadas na Gestação" };
              const catVaccines = VACCINES_BRAZIL.filter(v => v.category === cat);
              return (
                <Card key={cat} className={`backdrop-blur-xl border shadow-lg ${
                  cat === "contraindicada" ? "bg-red-50/40 border-red-200/50" :
                  cat === "situacao" ? "bg-amber-50/40 border-amber-200/50" :
                  "bg-white/40 border-white/50"
                }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-heading">{catLabels[cat]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="text-left py-2 px-2 font-heading text-muted-foreground">Vacina</th>
                            <th className="text-left py-2 px-2 font-heading text-muted-foreground">Período</th>
                            <th className="text-center py-2 px-2 font-heading text-muted-foreground">Doses</th>
                            <th className="text-center py-2 px-2 font-heading text-muted-foreground">Status</th>
                            <th className="text-left py-2 px-2 font-heading text-muted-foreground">Detalhes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catVaccines.map((vac) => {
                            const applied = (r.vaccines || []).filter(v => v.name === vac.name);
                            const totalDoses = vac.doses.length;
                            const appliedDoses = applied.length;
                            const isComplete = appliedDoses >= totalDoses;
                            const statusColor = isComplete ? "text-green-600" : appliedDoses > 0 ? "text-amber-600" : cat === "contraindicada" ? "text-red-500" : "text-muted-foreground";
                            const statusLabel = isComplete ? "Completa" : appliedDoses > 0 ? `${appliedDoses}/${totalDoses}` : cat === "contraindicada" ? "N/A" : "Pendente";

                            return (
                              <Fragment key={vac.name}>
                                <tr className="border-b border-border/20 hover:bg-white/30 transition-colors">
                                  <td className="py-2 px-2">
                                    <p className="font-heading font-semibold text-foreground text-xs">{vac.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{vac.gestationalAlert.replace("⚠️ ", "")}</p>
                                  </td>
                                  <td className="py-2 px-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-heading ${
                                      cat === "contraindicada" ? "bg-red-100 text-red-600" : "bg-muted/50 text-foreground"
                                    }`}>{vac.trimester}</span>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <div className="flex justify-center gap-0.5">
                                      {vac.doses.map((dose, di) => {
                                        const doseApplied = applied.some(a => a.dose === dose);
                                        return (
                                          <span key={di} className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${
                                            doseApplied ? "bg-green-500 text-white" : "bg-muted/60 text-muted-foreground"
                                          }`}>{di + 1}</span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <span className={`text-[10px] font-heading font-semibold ${statusColor}`}>{statusLabel}</span>
                                  </td>
                                  <td className="py-2 px-2">
                                    {applied.length > 0 ? (
                                      <div className="space-y-1">
                                        {applied.map(v => (
                                          <div key={v.id} className="text-[10px] text-muted-foreground">
                                            <span className="font-medium text-foreground">{v.dose}</span> — {format(new Date(v.date), "dd/MM/yy")}
                                            {v.manufacturer && <span> · {v.manufacturer}</span>}
                                            {v.lot && <span> · Lote {v.lot}</span>}
                                            {v.reaction && <span className="text-destructive block">⚠ {v.reaction}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground">—</span>
                                    )}
                                  </td>
                                </tr>
                                {/* Reações comuns como tooltip/info */}
                                {applied.length > 0 && applied.some(v => v.reaction) && (
                                  <tr><td colSpan={5} className="px-4 pb-2"><p className="text-[10px] text-destructive/80 italic">Reações comuns desta vacina: {vac.commonReactions.join(", ")}</p></td></tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Vacinas personalizadas (Outra) */}
            {(r.vaccines || []).filter(v => v.name === "Outra" && v.customName).length > 0 && (
              <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-heading">Vacinas Adicionais (fora do calendário)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/30">
                          <th className="text-left py-2 px-2 font-heading text-muted-foreground">Vacina</th>
                          <th className="text-left py-2 px-2 font-heading text-muted-foreground">Dose</th>
                          <th className="text-left py-2 px-2 font-heading text-muted-foreground">Data</th>
                          <th className="text-left py-2 px-2 font-heading text-muted-foreground">Fabricante</th>
                          <th className="text-left py-2 px-2 font-heading text-muted-foreground">Lote</th>
                          <th className="text-left py-2 px-2 font-heading text-muted-foreground">Reação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(r.vaccines || []).filter(v => v.name === "Outra" && v.customName).map(v => (
                          <tr key={v.id} className="border-b border-border/20">
                            <td className="py-2 px-2 font-heading font-semibold text-foreground">{v.customName}</td>
                            <td className="py-2 px-2 text-muted-foreground">{v.dose}</td>
                            <td className="py-2 px-2 text-muted-foreground">{format(new Date(v.date), "dd/MM/yyyy")}</td>
                            <td className="py-2 px-2 text-muted-foreground">{v.manufacturer || "—"}</td>
                            <td className="py-2 px-2 text-muted-foreground">{v.lot || "—"}</td>
                            <td className="py-2 px-2 text-destructive">{v.reaction || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DADOS PESSOAIS */}
          <TabsContent value="dados" className="space-y-4 mt-4">
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "CPF", value: r.cpf || "—" },
                    { label: "Nascimento", value: r.birthDate ? format(new Date(r.birthDate), "dd/MM/yyyy") : "—" },
                    { label: "Telefone", value: r.phone || "—" },
                    { label: "Estado Civil", value: r.maritalStatus || "—" },
                    { label: "Profissão", value: r.profession || "—" },
                    { label: "Endereço", value: r.address || "—" },
                    { label: "Emergência", value: r.emergencyContact || "—" },
                    { label: "Consentimento", value: r.consentSigned ? "Assinado" : "Pendente" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ===== DIALOGS ===== */}

        {/* New Consultation Dialog */}
        <Dialog open={consultDialogOpen} onOpenChange={setConsultDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Agendar / Registrar Consulta Pré-natal</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Data *</Label><Input type="date" value={consultForm.date} onChange={(e) => {
                  const newDate = e.target.value;
                  const dum = selectedRecord?.gestationalCard?.dum || "";
                  const autoIG = calcGestationalAgeAtDate(dum, newDate);
                  setConsultForm({ ...consultForm, date: newDate, gestationalAge: autoIG || consultForm.gestationalAge });
                }} className="rounded-xl" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-heading">IG {selectedRecord?.gestationalCard?.dum ? "(automático)" : ""}</Label>
                  <Input value={consultForm.gestationalAge} onChange={(e) => setConsultForm({ ...consultForm, gestationalAge: e.target.value })} className="rounded-xl bg-muted/30" readOnly={!!selectedRecord?.gestationalCard?.dum} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Status</Label>
                <Select value={consultForm.status} onValueChange={(v: any) => setConsultForm({ ...consultForm, status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {consultForm.status === "realizada" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs font-heading">Peso (kg)</Label><Input value={consultForm.weight} onChange={(e) => setConsultForm({ ...consultForm, weight: e.target.value })} className="rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-heading">PA</Label><Input value={consultForm.bloodPressure} onChange={(e) => setConsultForm({ ...consultForm, bloodPressure: e.target.value })} className="rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-heading">AU (cm)</Label><Input value={consultForm.uterineHeight} onChange={(e) => setConsultForm({ ...consultForm, uterineHeight: e.target.value })} className="rounded-xl" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs font-heading">BCF (bpm)</Label><Input value={consultForm.fetalHeartRate} onChange={(e) => setConsultForm({ ...consultForm, fetalHeartRate: e.target.value })} className="rounded-xl" /></div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-heading">Edema</Label>
                      <Select value={consultForm.edema} onValueChange={(v) => setConsultForm({ ...consultForm, edema: v })}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Ausente">Ausente</SelectItem><SelectItem value="+">+</SelectItem><SelectItem value="++">++</SelectItem><SelectItem value="+++">+++</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-heading">Apresentação</Label><Input value={consultForm.fetalPresentation} onChange={(e) => setConsultForm({ ...consultForm, fetalPresentation: e.target.value })} className="rounded-xl" /></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-xs font-heading">Observações</Label><Textarea value={consultForm.observations} onChange={(e) => setConsultForm({ ...consultForm, observations: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-heading">Conduta</Label><Textarea value={consultForm.conduct} onChange={(e) => setConsultForm({ ...consultForm, conduct: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Profissional</Label><Input value={consultForm.professional} onChange={(e) => setConsultForm({ ...consultForm, professional: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Próxima Consulta</Label><Input type="date" value={consultForm.nextAppointment} onChange={(e) => setConsultForm({ ...consultForm, nextAppointment: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setConsultDialogOpen(false)} className="flex-1">Cancelar</Button>
                <Button variant="secondary" onClick={handleAddConsultation} className="flex-1">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Consultation Detail/Realizar Dialog */}
        <Dialog open={consultDetailOpen} onOpenChange={setConsultDetailOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Detalhes da Consulta</DialogTitle></DialogHeader>
            {selectedConsultation && (
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-heading">{format(new Date(selectedConsultation.date), "dd/MM/yyyy")} • {selectedConsultation.gestationalAge}</p>
                  <Badge variant={selectedConsultation.status === "realizada" ? "default" : selectedConsultation.status === "cancelada" ? "destructive" : "secondary"} className="text-xs font-heading">
                    {selectedConsultation.status === "realizada" ? "Realizada" : selectedConsultation.status === "cancelada" ? "Cancelada" : "Agendada"}
                  </Badge>
                </div>

                {selectedConsultation.status === "agendada" && (
                  <>
                    <Separator />
                    <p className="text-xs font-heading font-semibold">Preencha os dados para realizar a consulta:</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs font-heading">Peso (kg)</Label><Input value={selectedConsultation.weight} onChange={(e) => setSelectedConsultation({ ...selectedConsultation, weight: e.target.value })} className="rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-heading">PA</Label><Input value={selectedConsultation.bloodPressure} onChange={(e) => setSelectedConsultation({ ...selectedConsultation, bloodPressure: e.target.value })} className="rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-heading">AU (cm)</Label><Input value={selectedConsultation.uterineHeight} onChange={(e) => setSelectedConsultation({ ...selectedConsultation, uterineHeight: e.target.value })} className="rounded-xl" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs font-heading">BCF (bpm)</Label><Input value={selectedConsultation.fetalHeartRate} onChange={(e) => setSelectedConsultation({ ...selectedConsultation, fetalHeartRate: e.target.value })} className="rounded-xl" /></div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-heading">Edema</Label>
                        <Select value={selectedConsultation.edema} onValueChange={(v) => setSelectedConsultation({ ...selectedConsultation, edema: v })}>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Ausente">Ausente</SelectItem><SelectItem value="+">+</SelectItem><SelectItem value="++">++</SelectItem><SelectItem value="+++">+++</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label className="text-xs font-heading">Apresentação</Label><Input value={selectedConsultation.fetalPresentation} onChange={(e) => setSelectedConsultation({ ...selectedConsultation, fetalPresentation: e.target.value })} className="rounded-xl" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-heading">Observações</Label><Textarea value={selectedConsultation.observations} onChange={(e) => setSelectedConsultation({ ...selectedConsultation, observations: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-heading">Conduta</Label><Textarea value={selectedConsultation.conduct} onChange={(e) => setSelectedConsultation({ ...selectedConsultation, conduct: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={handleCancelarConsulta} className="flex-1">Cancelar Consulta</Button>
                      <Button variant="secondary" onClick={handleRealizarConsulta} className="flex-1">Realizar Consulta</Button>
                    </div>
                  </>
                )}

                {selectedConsultation.status === "realizada" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { label: "Peso", value: selectedConsultation.weight ? `${selectedConsultation.weight}kg` : "—" },
                        { label: "PA", value: selectedConsultation.bloodPressure || "—" },
                        { label: "AU", value: selectedConsultation.uterineHeight ? `${selectedConsultation.uterineHeight}cm` : "—" },
                        { label: "BCF", value: selectedConsultation.fetalHeartRate ? `${selectedConsultation.fetalHeartRate}bpm` : "—" },
                        { label: "Edema", value: selectedConsultation.edema || "—" },
                        { label: "Apresentação", value: selectedConsultation.fetalPresentation || "—" },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/30 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground font-heading">{item.label}</p>
                          <p className="text-xs font-heading font-semibold text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {selectedConsultation.observations && <div className="text-xs"><span className="text-muted-foreground">Observações:</span> {selectedConsultation.observations}</div>}
                    {selectedConsultation.conduct && <div className="text-xs"><span className="text-muted-foreground">Conduta:</span> {selectedConsultation.conduct}</div>}
                    {selectedConsultation.professional && <div className="text-xs text-muted-foreground">Profissional: {selectedConsultation.professional}</div>}
                  </div>
                )}

                {selectedConsultation.status === "cancelada" && (
                  <p className="text-sm text-muted-foreground text-center py-4">Esta consulta foi cancelada.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Exam Dialog */}
        <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Registrar Exame</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Data</Label><Input type="date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-heading">Trimestre *</Label>
                  <Select value={examForm.trimester} onValueChange={(v: any) => setExamForm({ ...examForm, trimester: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">1º Trimestre</SelectItem><SelectItem value="2">2º Trimestre</SelectItem><SelectItem value="3">3º Trimestre</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Tipo de Exame *</Label>
                <Select value={examForm.type} onValueChange={(v) => setExamForm({ ...examForm, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {EXAMS_BY_TRIMESTER[examForm.trimester].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Resultado</Label><Textarea value={examForm.result} onChange={(e) => setExamForm({ ...examForm, result: e.target.value })} className="rounded-xl min-h-[60px]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-heading">Interpretação</Label>
                  <Select value={examForm.interpretation || "none"} onValueChange={(v) => setExamForm({ ...examForm, interpretation: v === "none" ? "" : v as any })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">—</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="alterado">Alterado</SelectItem><SelectItem value="inconclusivo">Inconclusivo</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Laboratório</Label><Input value={examForm.laboratory} onChange={(e) => setExamForm({ ...examForm, laboratory: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Valores de Referência</Label><Input value={examForm.referenceValues} onChange={(e) => setExamForm({ ...examForm, referenceValues: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Solicitado por</Label><Input value={examForm.requestedBy} onChange={(e) => setExamForm({ ...examForm, requestedBy: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Observações</Label><Input value={examForm.observations} onChange={(e) => setExamForm({ ...examForm, observations: e.target.value })} className="rounded-xl" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setExamDialogOpen(false)} className="flex-1">Cancelar</Button>
                <Button variant="secondary" onClick={handleAddExam} className="flex-1">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exam Detail Dialog */}
        <Dialog open={examDetailOpen} onOpenChange={setExamDetailOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Detalhes do Exame</DialogTitle></DialogHeader>
            {selectedExam && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Exame", value: selectedExam.type },
                    { label: "Data", value: format(new Date(selectedExam.date), "dd/MM/yyyy") },
                    { label: "Trimestre", value: `${selectedExam.trimester}º` },
                    { label: "Laboratório", value: selectedExam.laboratory || "—" },
                    { label: "Solicitado por", value: selectedExam.requestedBy || "—" },
                    { label: "Interpretação", value: selectedExam.interpretation === "normal" ? "Normal" : selectedExam.interpretation === "alterado" ? "Alterado" : selectedExam.interpretation === "inconclusivo" ? "Inconclusivo" : "—" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/30 rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground font-heading uppercase">{item.label}</p>
                      <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                {selectedExam.referenceValues && (
                  <div className="bg-white/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">Valores de Referência</p>
                    <p className="text-sm text-foreground">{selectedExam.referenceValues}</p>
                  </div>
                )}
                <div className="bg-white/30 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground font-heading uppercase">Resultado</p>
                  <p className="text-sm text-foreground">{selectedExam.result || "—"}</p>
                </div>
                {selectedExam.observations && (
                  <div className="bg-white/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground font-heading uppercase">Observações</p>
                    <p className="text-sm text-foreground">{selectedExam.observations}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Vaccine Dialog */}
        <Dialog open={vaccineDialogOpen} onOpenChange={setVaccineDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Registrar Vacina</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Vacina *</Label>
                <Select value={vaccineForm.name} onValueChange={(v) => setVaccineForm({ ...vaccineForm, name: v, customName: v === "Outra" ? "" : undefined })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {VACCINES_BRAZIL.map((v) => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                    <SelectItem value="Outra">Outra (digitar nome)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {vaccineForm.name === "Outra" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-heading">Nome da Vacina *</Label>
                  <Input value={vaccineForm.customName || ""} onChange={(e) => setVaccineForm({ ...vaccineForm, customName: e.target.value })} className="rounded-xl" placeholder="Digite o nome da vacina" />
                </div>
              )}
              {vaccineForm.name && vaccineForm.name !== "Outra" && (() => {
                const info = VACCINES_BRAZIL.find((v) => v.name === vaccineForm.name);
                return info?.gestationalAlert ? (
                  <div className={`rounded-lg p-2.5 text-[11px] ${info.gestationalAlert.includes("⚠️") ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-secondary/10 text-secondary-foreground border border-secondary/20"}`}>
                    {info.gestationalAlert}
                  </div>
                ) : null;
              })()}
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Dose</Label>
                <Select value={vaccineForm.dose} onValueChange={(v) => setVaccineForm({ ...vaccineForm, dose: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(VACCINES_BRAZIL.find((v) => v.name === vaccineForm.name)?.doses || ["Dose Única", "1ª Dose", "2ª Dose", "3ª Dose", "Reforço"]).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Data</Label><Input type="date" value={vaccineForm.date} onChange={(e) => setVaccineForm({ ...vaccineForm, date: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Lote</Label><Input value={vaccineForm.lot} onChange={(e) => setVaccineForm({ ...vaccineForm, lot: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Fabricante</Label><Input value={vaccineForm.manufacturer} onChange={(e) => setVaccineForm({ ...vaccineForm, manufacturer: e.target.value })} className="rounded-xl" placeholder="Ex: Butantan, Pfizer" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Profissional</Label><Input value={vaccineForm.professional} onChange={(e) => setVaccineForm({ ...vaccineForm, professional: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Reação Adversa</Label>
                <Textarea
                  value={vaccineForm.reaction}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, reaction: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={2}
                  placeholder="Descreva reações observadas (dor local, febre, mal-estar, etc.)"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setVaccineDialogOpen(false)} className="flex-1">Cancelar</Button>
                <Button variant="secondary" onClick={handleAddVaccine} className="flex-1">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
};

export default RegistroClinicoTab;
