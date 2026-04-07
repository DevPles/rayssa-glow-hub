import { createContext, useContext, useState, ReactNode } from "react";

// ===== TYPES =====

export interface Vaccine {
  id: string;
  name: string;
  customName?: string;
  dose: string;
  date: string;
  lot: string;
  professional: string;
  manufacturer: string;
  reaction: string;
}

export interface ConsultationExamRequest {
  id: string;
  examName: string;
  trimester: "1" | "2" | "3";
  observations: string;
  status: "solicitado" | "realizado" | "cancelado";
}

export interface PrenatalConsultation {
  id: string;
  date: string;
  gestationalAge: string;
  weight: string;
  bloodPressure: string;
  uterineHeight: string;
  fetalHeartRate: string;
  edema: string;
  fetalPresentation: string;
  observations: string;
  conduct: string;
  professional: string;
  nextAppointment: string;
  status: "agendada" | "realizada" | "cancelada";
  requestedExams?: ConsultationExamRequest[];
}

export interface GestationalExam {
  id: string;
  date: string;
  type: string;
  result: string;
  observations: string;
  fileUrl: string;
  trimester: "1" | "2" | "3";
  interpretation: "normal" | "alterado" | "inconclusivo" | "";
  referenceValues: string;
  requestedBy: string;
  laboratory: string;
}

export interface GestationalCard {
  bloodType: string;
  rh: string;
  gravida: string;
  para: string;
  abortions: string;
  dum: string;
  dpp: string;
  preGestationalWeight: string;
  height: string;
  preGestationalBmi: string;
  allergies: string;
  medications: string;
  preExistingConditions: string;
  previousSurgeries: string;
  familyHistory: string;
  birthPlan: string;
  riskClassification: "habitual" | "alto_risco";
  companion: string;
  companionPhone: string;
  pediatrician: string;
  hospital: string;
}

export interface VitalSigns {
  weight: string;
  height: string;
  bmi: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  bust: string;
  waist: string;
  abdomen: string;
  hips: string;
  leftArm: string;
  rightArm: string;
  leftThigh: string;
  rightThigh: string;
  leftCalf: string;
  rightCalf: string;
  posture: string;
}

export interface ProcedureRecord {
  id: string;
  date: string;
  protocolName: string;
  parameters: string;
  intraObservations: string;
  postObservations: string;
  homeInstructions: string;
  professional: string;
  results: string;
  photosBefore: string[];
  photosAfter: string[];
  popFile: string;
  vitalSigns: VitalSigns;
}

export interface FollowUp {
  id: string;
  date: string;
  notes: string;
  nextVisit: string;
}

export interface AssignedProfessional {
  id: string;
  name: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhoto: string;
  cpf: string;
  createdAt: string;
  updatedAt: string;
  prontuarioNumber: string;
  assignedProfessionals: AssignedProfessional[];
  fullName: string;
  birthDate: string;
  address: string;
  phone: string;
  emergencyContact: string;
  maritalStatus: string;
  profession: string;
  consentSigned: boolean;
  consentFile: string;
  consultationReason: string;
  expectations: string;
  preExistingConditions: string;
  medications: string;
  allergies: string;
  habits: string;
  previousProcedures: string;
  obstetricHistory: string;
  lastMenstruation: string;
  vitalSigns: VitalSigns;
  procedures: ProcedureRecord[];
  followUps: FollowUp[];
  status: "ativo" | "arquivado";
  gestationalCard: GestationalCard;
  prenatalConsultations: PrenatalConsultation[];
  gestationalExams: GestationalExam[];
  vaccines: Vaccine[];
}

// ===== DEFAULTS =====

export const emptyVitalSigns: VitalSigns = {
  weight: "", height: "", bmi: "", bloodPressure: "", heartRate: "", temperature: "",
  bust: "", waist: "", abdomen: "", hips: "",
  leftArm: "", rightArm: "", leftThigh: "", rightThigh: "", leftCalf: "", rightCalf: "",
  posture: "",
};

export const emptyGestationalCard: GestationalCard = {
  bloodType: "", rh: "", gravida: "", para: "", abortions: "",
  dum: "", dpp: "", preGestationalWeight: "", height: "", preGestationalBmi: "",
  allergies: "", medications: "", preExistingConditions: "", previousSurgeries: "",
  familyHistory: "", birthPlan: "", riskClassification: "habitual",
  companion: "", companionPhone: "", pediatrician: "", hospital: "",
};

export const createEmptyRecord = (patientId: string, patientName: string, nextNumber: number, professionals: AssignedProfessional[] = []): Omit<ClinicalRecord, "id"> => ({
  patientId, patientName, patientPhoto: "", cpf: "",
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  prontuarioNumber: `RC-${String(nextNumber).padStart(3, "0")}`,
  assignedProfessionals: professionals,
  fullName: patientName, birthDate: "", address: "", phone: "", emergencyContact: "",
  maritalStatus: "", profession: "", consentSigned: false, consentFile: "",
  consultationReason: "", expectations: "",
  preExistingConditions: "", medications: "", allergies: "", habits: "",
  previousProcedures: "", obstetricHistory: "", lastMenstruation: "",
  vitalSigns: { ...emptyVitalSigns },
  procedures: [], followUps: [],
  status: "ativo",
  gestationalCard: { ...emptyGestationalCard },
  prenatalConsultations: [],
  gestationalExams: [],
  vaccines: [],
});

// ===== CONTEXT =====

interface ClinicalRecordContextType {
  records: ClinicalRecord[];
  addRecord: (record: Omit<ClinicalRecord, "id">) => ClinicalRecord;
  updateRecord: (id: string, data: Partial<ClinicalRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByPatient: (patientId: string) => ClinicalRecord[];
  addProcedure: (recordId: string, procedure: Omit<ProcedureRecord, "id">) => void;
  addFollowUp: (recordId: string, followUp: Omit<FollowUp, "id">) => void;
  addPrenatalConsultation: (recordId: string, consultation: Omit<PrenatalConsultation, "id">) => void;
  updatePrenatalConsultation: (recordId: string, consultationId: string, data: Partial<PrenatalConsultation>) => void;
  addGestationalExam: (recordId: string, exam: Omit<GestationalExam, "id">) => void;
  updateGestationalExam: (recordId: string, examId: string, data: Partial<GestationalExam>) => void;
  addVaccine: (recordId: string, vaccine: Omit<Vaccine, "id">) => void;
}

const ClinicalRecordContext = createContext<ClinicalRecordContextType | null>(null);

const mockRecords: ClinicalRecord[] = [
  {
    id: "cr1",
    patientId: "2",
    patientName: "Maria Silva",
    patientPhoto: "",
    cpf: "123.456.789-00",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-04-01T14:30:00Z",
    prontuarioNumber: "RC-001",
    assignedProfessionals: [{ id: "1b", name: "Admin Rayssa" }],
    fullName: "Maria Silva",
    birthDate: "1990-05-12",
    address: "Rua das Flores, 123 - São Paulo",
    phone: "(11) 98888-1111",
    emergencyContact: "João Silva - (11) 97777-0000",
    maritalStatus: "Casada",
    profession: "Professora",
    consentSigned: true, consentFile: "",
    consultationReason: "Acompanhamento gestacional completo",
    expectations: "Parto humanizado e acompanhamento personalizado",
    preExistingConditions: "Nenhuma",
    medications: "Ácido fólico, Sulfato ferroso",
    allergies: "Nenhuma conhecida",
    habits: "Não fumante, pratica yoga para gestantes",
    previousProcedures: "", obstetricHistory: "G2P1A0", lastMenstruation: "2025-10-15",
    vitalSigns: { weight: "68kg", height: "1.65m", bmi: "25.0", bloodPressure: "110/70", heartRate: "78bpm", temperature: "36.5°C", bust: "", waist: "", abdomen: "92cm", hips: "", leftArm: "", rightArm: "", leftThigh: "", rightThigh: "", leftCalf: "", rightCalf: "", posture: "Normal" },
    procedures: [], followUps: [],
    status: "ativo",
    gestationalCard: {
      bloodType: "O", rh: "+", gravida: "2", para: "1", abortions: "0",
      dum: "2025-10-15", dpp: "2026-07-22", preGestationalWeight: "60", height: "1.65", preGestationalBmi: "22.0",
      allergies: "Nenhuma", medications: "Ácido fólico 5mg, Sulfato ferroso", preExistingConditions: "Nenhuma",
      previousSurgeries: "Cesariana (2022)", familyHistory: "Mãe com hipertensão",
      birthPlan: "Parto normal humanizado, com acompanhante, em banheira",
      riskClassification: "habitual", companion: "João Silva", companionPhone: "(11) 97777-0000",
      pediatrician: "Dr. Carlos Mendes", hospital: "Hospital São Lucas",
    },
    prenatalConsultations: [
      { id: "pc1", date: "2026-01-15", gestationalAge: "13 semanas", weight: "62", bloodPressure: "110/70", uterineHeight: "12", fetalHeartRate: "150", edema: "Ausente", fetalPresentation: "-", observations: "Gestação tópica, feto único, vitalidade preservada", conduct: "Solicitar exames do 1º trimestre", professional: "Dra. Rayssa", nextAppointment: "2026-02-12", status: "realizada" },
      { id: "pc2", date: "2026-02-12", gestationalAge: "17 semanas", weight: "63.5", bloodPressure: "108/68", uterineHeight: "16", fetalHeartRate: "148", edema: "Ausente", fetalPresentation: "-", observations: "Exames do 1º trimestre normais. Morfológico agendado.", conduct: "Suplementação de ferro", professional: "Dra. Rayssa", nextAppointment: "2026-03-12", status: "realizada" },
      { id: "pc3", date: "2026-03-12", gestationalAge: "21 semanas", weight: "65", bloodPressure: "112/72", uterineHeight: "20", fetalHeartRate: "145", edema: "Ausente", fetalPresentation: "Cefálica", observations: "Morfológico sem alterações. Desenvolvimento adequado.", conduct: "Manter suplementação", professional: "Dra. Rayssa", nextAppointment: "2026-04-09", status: "realizada" },
    ],
    gestationalExams: [
      { id: "ge1", date: "2026-01-20", type: "Ultrassom 1º Trimestre", result: "Gestação tópica, feto único, BCF+, IG compatível", observations: "TN 1.2mm - normal", fileUrl: "", trimester: "1", interpretation: "normal", referenceValues: "TN < 2.5mm", requestedBy: "Dra. Rayssa", laboratory: "Lab São Paulo" },
      { id: "ge2", date: "2026-01-22", type: "Hemograma Completo", result: "Hb 12.5 g/dL, Ht 37%, sem alterações", observations: "", fileUrl: "", trimester: "1", interpretation: "normal", referenceValues: "Hb > 11 g/dL", requestedBy: "Dra. Rayssa", laboratory: "Lab São Paulo" },
      { id: "ge3", date: "2026-01-22", type: "Tipagem Sanguínea", result: "O Rh+", observations: "Coombs indireto negativo", fileUrl: "", trimester: "1", interpretation: "normal", referenceValues: "", requestedBy: "Dra. Rayssa", laboratory: "Lab São Paulo" },
      { id: "ge4", date: "2026-03-05", type: "Ultrassom Morfológico", result: "Anatomia fetal preservada, peso estimado 380g", observations: "Sexo: feminino. Placenta anterior grau 0", fileUrl: "", trimester: "2", interpretation: "normal", referenceValues: "", requestedBy: "Dra. Rayssa", laboratory: "Clínica Imagem" },
    ],
    vaccines: [
      { id: "v1", name: "Influenza (Gripe)", dose: "Dose Única", date: "2026-02-10", lot: "FL2026A", professional: "Dra. Rayssa", manufacturer: "Butantan", reaction: "" },
      { id: "v2", name: "dTpa (Tríplice Bacteriana)", dose: "1ª Dose", date: "2026-03-15", lot: "DT2026B", professional: "Dra. Rayssa", manufacturer: "GSK", reaction: "" },
    ],
  },
];

export const ClinicalRecordProvider = ({ children }: { children: ReactNode }) => {
  const [records, setRecords] = useState<ClinicalRecord[]>(mockRecords);

  const addRecord = (record: Omit<ClinicalRecord, "id">): ClinicalRecord => {
    const newRecord: ClinicalRecord = { ...record, id: `cr${Date.now()}` };
    setRecords((prev) => [...prev, newRecord]);
    return newRecord;
  };

  const updateRecord = (id: string, data: Partial<ClinicalRecord>) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const getRecordsByPatient = (patientId: string) => records.filter((r) => r.patientId === patientId);

  const addProcedure = (recordId: string, procedure: Omit<ProcedureRecord, "id">) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, procedures: [...r.procedures, { ...procedure, id: `p${Date.now()}` }], updatedAt: new Date().toISOString(),
    } : r));
  };

  const addFollowUp = (recordId: string, followUp: Omit<FollowUp, "id">) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, followUps: [...r.followUps, { ...followUp, id: `f${Date.now()}` }], updatedAt: new Date().toISOString(),
    } : r));
  };

  const addPrenatalConsultation = (recordId: string, consultation: Omit<PrenatalConsultation, "id">) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, prenatalConsultations: [...r.prenatalConsultations, { ...consultation, id: `pc${Date.now()}` }], updatedAt: new Date().toISOString(),
    } : r));
  };

  const updatePrenatalConsultation = (recordId: string, consultationId: string, data: Partial<PrenatalConsultation>) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r,
      prenatalConsultations: r.prenatalConsultations.map((c) => c.id === consultationId ? { ...c, ...data } : c),
      updatedAt: new Date().toISOString(),
    } : r));
  };

  const addGestationalExam = (recordId: string, exam: Omit<GestationalExam, "id">) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, gestationalExams: [...r.gestationalExams, { ...exam, id: `ge${Date.now()}` }], updatedAt: new Date().toISOString(),
    } : r));
  };

  const updateGestationalExam = (recordId: string, examId: string, data: Partial<GestationalExam>) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r,
      gestationalExams: r.gestationalExams.map((e) => e.id === examId ? { ...e, ...data } : e),
      updatedAt: new Date().toISOString(),
    } : r));
  };

  const addVaccine = (recordId: string, vaccine: Omit<Vaccine, "id">) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, vaccines: [...(r.vaccines || []), { ...vaccine, id: `v${Date.now()}` }], updatedAt: new Date().toISOString(),
    } : r));
  };

  return (
    <ClinicalRecordContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, getRecordsByPatient, addProcedure, addFollowUp, addPrenatalConsultation, updatePrenatalConsultation, addGestationalExam, updateGestationalExam, addVaccine }}>
      {children}
    </ClinicalRecordContext.Provider>
  );
};

export const useClinicalRecords = () => {
  const ctx = useContext(ClinicalRecordContext);
  if (!ctx) throw new Error("useClinicalRecords must be used within ClinicalRecordProvider");
  return ctx;
};
