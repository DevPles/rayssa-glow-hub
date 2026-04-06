import { createContext, useContext, useState, ReactNode } from "react";

export interface AestheticEvaluation {
  skinType: string;
  conditions: string;
  spots: boolean;
  wrinkles: boolean;
  scars: boolean;
  stretchMarks: boolean;
  lesions: boolean;
  observations: string;
  photosBefore: string[];
  photosAfter: string[];
}

export interface ObstetricEvaluation {
  gestationalAge: string;
  pregnancyType: string;
  prenatalExams: string;
  symptoms: string;
  fetalHeartRate: string;
  emotionalState: string;
  birthPlan: string;
  riskConditions: string;
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

export interface ClinicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhoto: string;
  createdAt: string;
  updatedAt: string;
  prontuarioNumber: string;
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
  aestheticEval: AestheticEvaluation;
  vitalSigns: VitalSigns;
  obstetricEval: ObstetricEvaluation;
  procedures: ProcedureRecord[];
  followUps: FollowUp[];
  recordType: "estetica" | "maternidade" | "ambos";
  status: "ativo" | "arquivado";
}

export const emptyVitalSigns: VitalSigns = {
  weight: "", height: "", bmi: "", bloodPressure: "", heartRate: "", temperature: "",
  bust: "", waist: "", abdomen: "", hips: "",
  leftArm: "", rightArm: "", leftThigh: "", rightThigh: "", leftCalf: "", rightCalf: "",
  posture: "",
};

const emptyAestheticEval: AestheticEvaluation = {
  skinType: "", conditions: "", spots: false, wrinkles: false, scars: false, stretchMarks: false, lesions: false, observations: "", photosBefore: [], photosAfter: [],
};

const emptyObstetricEval: ObstetricEvaluation = {
  gestationalAge: "", pregnancyType: "", prenatalExams: "", symptoms: "", fetalHeartRate: "", emotionalState: "", birthPlan: "", riskConditions: "",
};

export const createEmptyRecord = (patientId: string, patientName: string, nextNumber: number): Omit<ClinicalRecord, "id"> => ({
  patientId, patientName, patientPhoto: "",
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  prontuarioNumber: `RC-${String(nextNumber).padStart(3, "0")}`,
  fullName: patientName, birthDate: "", address: "", phone: "", emergencyContact: "",
  maritalStatus: "", profession: "", consentSigned: false, consentFile: "",
  consultationReason: "", expectations: "",
  preExistingConditions: "", medications: "", allergies: "", habits: "",
  previousProcedures: "", obstetricHistory: "", lastMenstruation: "",
  aestheticEval: { ...emptyAestheticEval },
  vitalSigns: { ...emptyVitalSigns },
  obstetricEval: { ...emptyObstetricEval },
  procedures: [], followUps: [],
  recordType: "estetica", status: "ativo",
});

interface ClinicalRecordContextType {
  records: ClinicalRecord[];
  addRecord: (record: Omit<ClinicalRecord, "id">) => ClinicalRecord;
  updateRecord: (id: string, data: Partial<ClinicalRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByPatient: (patientId: string) => ClinicalRecord[];
  addProcedure: (recordId: string, procedure: Omit<ProcedureRecord, "id">) => void;
  addFollowUp: (recordId: string, followUp: Omit<FollowUp, "id">) => void;
}

const ClinicalRecordContext = createContext<ClinicalRecordContextType | null>(null);

const mockRecords: ClinicalRecord[] = [
  {
    id: "cr1",
    patientId: "2",
    patientName: "Maria Silva",
    patientPhoto: "",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-02-20T14:30:00Z",
    prontuarioNumber: "RC-001",
    fullName: "Maria Silva",
    birthDate: "1990-05-12",
    address: "Rua das Flores, 123 - São Paulo",
    phone: "(11) 98888-1111",
    emergencyContact: "João Silva - (11) 97777-0000",
    maritalStatus: "Casada",
    profession: "Professora",
    consentSigned: true,
    consentFile: "",
    consultationReason: "Tratamento de manchas faciais e rejuvenescimento",
    expectations: "Redução significativa das manchas e pele mais uniforme",
    preExistingConditions: "Nenhuma",
    medications: "Vitamina D",
    allergies: "Nenhuma conhecida",
    habits: "Não fumante, pratica exercícios 3x/semana",
    previousProcedures: "Limpeza de pele (2025)",
    obstetricHistory: "",
    lastMenstruation: "2026-02-01",
    aestheticEval: { skinType: "Mista", conditions: "Manchas de sol, poros dilatados na zona T", spots: true, wrinkles: false, scars: false, stretchMarks: false, lesions: false, observations: "Pele com fotodano leve", photosBefore: [], photosAfter: [] },
    vitalSigns: { weight: "62kg", height: "1.65m", bmi: "22.8", bloodPressure: "120/80", heartRate: "72bpm", temperature: "36.5°C", bust: "88cm", waist: "68cm", abdomen: "72cm", hips: "96cm", leftArm: "27cm", rightArm: "27cm", leftThigh: "52cm", rightThigh: "52cm", leftCalf: "35cm", rightCalf: "35cm", posture: "Normal" },
    obstetricEval: { gestationalAge: "", pregnancyType: "", prenatalExams: "", symptoms: "", fetalHeartRate: "", emotionalState: "", birthPlan: "", riskConditions: "" },
    procedures: [
      { id: "p1", date: "2026-01-15", protocolName: "Limpeza de Pele Profunda", parameters: "Extração manual, peeling enzimático", intraObservations: "Paciente tolerou bem", postObservations: "Leve vermelhidão esperada", homeInstructions: "Protetor solar FPS 50, evitar sol direto por 48h", professional: "Dra. Rayssa", results: "Pele mais limpa e luminosa", photosBefore: [], photosAfter: [], popFile: "", vitalSigns: { weight: "62kg", height: "1.65m", bmi: "22.8", bloodPressure: "118/78", heartRate: "70bpm", temperature: "36.4°C", bust: "", waist: "", abdomen: "", hips: "", leftArm: "", rightArm: "", leftThigh: "", rightThigh: "", leftCalf: "", rightCalf: "", posture: "" } },
      { id: "p2", date: "2026-02-10", protocolName: "Peeling Químico Superficial", parameters: "Ácido glicólico 30%, 3 min", intraObservations: "Ardência leve nos primeiros 30s", postObservations: "Descamação fina esperada em 3-5 dias", homeInstructions: "Hidratante calmante, FPS 50, não esfoliar", professional: "Dra. Rayssa", results: "Redução visível das manchas", photosBefore: [], photosAfter: [], popFile: "", vitalSigns: { weight: "61.5kg", height: "1.65m", bmi: "22.6", bloodPressure: "122/80", heartRate: "74bpm", temperature: "36.6°C", bust: "", waist: "", abdomen: "", hips: "", leftArm: "", rightArm: "", leftThigh: "", rightThigh: "", leftCalf: "", rightCalf: "", posture: "" } },
    ],
    followUps: [
      { id: "f1", date: "2026-02-20", notes: "Manchas reduziram ~40%. Paciente satisfeita. Agendar próxima sessão de peeling.", nextVisit: "2026-03-10" },
    ],
    recordType: "estetica",
    status: "ativo",
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

  return (
    <ClinicalRecordContext.Provider value={{ records, addRecord, updateRecord, deleteRecord, getRecordsByPatient, addProcedure, addFollowUp }}>
      {children}
    </ClinicalRecordContext.Provider>
  );
};

export const useClinicalRecords = () => {
  const ctx = useContext(ClinicalRecordContext);
  if (!ctx) throw new Error("useClinicalRecords must be used within ClinicalRecordProvider");
  return ctx;
};
