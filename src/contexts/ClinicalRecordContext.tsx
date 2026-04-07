import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

// ===== HELPERS: DB <-> App mapping =====

const mapDbRecordToApp = (
  dbRec: any,
  consultations: any[],
  exams: any[],
  vaccines: any[]
): ClinicalRecord => ({
  id: dbRec.id,
  patientId: dbRec.id,
  patientName: dbRec.full_name,
  patientPhoto: dbRec.patient_photo || "",
  cpf: dbRec.cpf || "",
  createdAt: dbRec.created_at,
  updatedAt: dbRec.updated_at,
  prontuarioNumber: dbRec.prontuario_number,
  assignedProfessionals: [],
  fullName: dbRec.full_name,
  birthDate: dbRec.birth_date || "",
  address: dbRec.address || "",
  phone: dbRec.phone || "",
  emergencyContact: dbRec.emergency_contact || "",
  maritalStatus: dbRec.marital_status || "",
  profession: "",
  consentSigned: dbRec.consent_signed || false,
  consentFile: "",
  consultationReason: "",
  expectations: "",
  preExistingConditions: (dbRec.gestational_card as any)?.preExistingConditions || "",
  medications: (dbRec.gestational_card as any)?.medications || "",
  allergies: (dbRec.gestational_card as any)?.allergies || "",
  habits: "",
  previousProcedures: "",
  obstetricHistory: "",
  lastMenstruation: (dbRec.gestational_card as any)?.dum || "",
  vitalSigns: emptyVitalSigns,
  procedures: [],
  followUps: [],
  status: (dbRec.status as "ativo" | "arquivado") || "ativo",
  gestationalCard: {
    ...emptyGestationalCard,
    ...((dbRec.gestational_card as any) || {}),
  },
  prenatalConsultations: consultations.map(c => ({
    id: c.id,
    date: c.date,
    gestationalAge: c.gestational_age || "",
    weight: c.weight ? String(c.weight) : "",
    bloodPressure: c.blood_pressure || "",
    uterineHeight: c.uterine_height ? String(c.uterine_height) : "",
    fetalHeartRate: c.fetal_heart_rate || "",
    edema: c.edema || "",
    fetalPresentation: c.fetal_presentation || "",
    observations: c.notes || "",
    conduct: c.conduct || "",
    professional: "",
    nextAppointment: "",
    status: (c.status as "agendada" | "realizada" | "cancelada") || "agendada",
    requestedExams: [],
  })),
  gestationalExams: exams.map(e => ({
    id: e.id,
    date: e.date,
    type: e.type,
    result: e.result || "",
    observations: e.notes || "",
    fileUrl: "",
    trimester: (String(e.trimester || "1") as "1" | "2" | "3"),
    interpretation: "" as any,
    referenceValues: "",
    requestedBy: "",
    laboratory: "",
  })),
  vaccines: vaccines.map(v => ({
    id: v.id,
    name: v.name,
    dose: v.dose || "",
    date: v.date,
    lot: v.lot || "",
    professional: "",
    manufacturer: "",
    reaction: "",
  })),
});

// ===== CONTEXT =====

interface ClinicalRecordContextType {
  records: ClinicalRecord[];
  loading: boolean;
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

// Mock data for fallback
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
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  // Load from Supabase on mount
  const loadFromSupabase = useCallback(async () => {
    try {
      setLoading(true);
      const { data: dbRecords, error } = await supabase
        .from("clinical_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !dbRecords || dbRecords.length === 0) {
        // Keep mock data as fallback
        setLoading(false);
        return;
      }

      const recordIds = dbRecords.map(r => r.id);

      const [consultsRes, examsRes, vaccinesRes] = await Promise.all([
        supabase.from("prenatal_consultations").select("*").in("clinical_record_id", recordIds),
        supabase.from("gestational_exams").select("*").in("clinical_record_id", recordIds),
        supabase.from("vaccines").select("*").in("clinical_record_id", recordIds),
      ]);

      const allConsults = consultsRes.data || [];
      const allExams = examsRes.data || [];
      const allVaccines = vaccinesRes.data || [];

      const mapped = dbRecords.map(dbRec =>
        mapDbRecordToApp(
          dbRec,
          allConsults.filter(c => c.clinical_record_id === dbRec.id),
          allExams.filter(e => e.clinical_record_id === dbRec.id),
          allVaccines.filter(v => v.clinical_record_id === dbRec.id),
        )
      );

      setRecords(mapped);
    } catch (err) {
      console.error("Error loading clinical records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  // ===== CRUD with Supabase sync =====

  const addRecord = (record: Omit<ClinicalRecord, "id">): ClinicalRecord => {
    const newRecord: ClinicalRecord = { ...record, id: `cr${Date.now()}` };
    setRecords((prev) => [...prev, newRecord]);

    // Async save to Supabase
    (async () => {
      try {
        const { data, error } = await supabase.from("clinical_records").insert({
          tenant_id: tenantId || undefined,
          prontuario_number: record.prontuarioNumber,
          full_name: record.fullName,
          cpf: record.cpf || null,
          birth_date: record.birthDate || null,
          phone: record.phone || null,
          email: null,
          address: record.address || null,
          marital_status: record.maritalStatus || null,
          profession: record.profession || null,
          emergency_contact: record.emergencyContact || null,
          patient_photo: record.patientPhoto || null,
          status: record.status,
          consent_signed: record.consentSigned,
          gestational_card: record.gestationalCard as any,
          notes: null,
        }).select().single();

        if (data && !error) {
          // Update local ID to the Supabase UUID
          setRecords(prev => prev.map(r => r.id === newRecord.id ? { ...r, id: data.id } : r));
        }
      } catch (err) {
        console.error("Error saving record to DB:", err);
      }
    })();

    return newRecord;
  };

  const updateRecord = (id: string, data: Partial<ClinicalRecord>) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));

    // Async update
    (async () => {
      try {
        const updateData: any = {};
        if (data.fullName) updateData.full_name = data.fullName;
        if (data.cpf !== undefined) updateData.cpf = data.cpf;
        if (data.birthDate !== undefined) updateData.birth_date = data.birthDate || null;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.maritalStatus !== undefined) updateData.marital_status = data.maritalStatus;
        if (data.emergencyContact !== undefined) updateData.emergency_contact = data.emergencyContact;
        if (data.patientPhoto !== undefined) updateData.patient_photo = data.patientPhoto;
        if (data.status) updateData.status = data.status;
        if (data.consentSigned !== undefined) updateData.consent_signed = data.consentSigned;
        if (data.gestationalCard) updateData.gestational_card = data.gestationalCard;

        if (Object.keys(updateData).length > 0) {
          await supabase.from("clinical_records").update(updateData).eq("id", id);
        }
      } catch (err) {
        console.error("Error updating record in DB:", err);
      }
    })();
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    supabase.from("clinical_records").delete().eq("id", id).then(() => {});
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
    const newId = `pc${Date.now()}`;
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, prenatalConsultations: [...r.prenatalConsultations, { ...consultation, id: newId }], updatedAt: new Date().toISOString(),
    } : r));

    // Async save
    (async () => {
      try {
        const { data } = await supabase.from("prenatal_consultations").insert({
          clinical_record_id: recordId,
          tenant_id: tenantId || undefined,
          date: consultation.date,
          status: consultation.status,
          gestational_age: consultation.gestationalAge || null,
          weight: consultation.weight ? parseFloat(consultation.weight) : null,
          blood_pressure: consultation.bloodPressure || null,
          uterine_height: consultation.uterineHeight ? parseFloat(consultation.uterineHeight) : null,
          fetal_heart_rate: consultation.fetalHeartRate || null,
          fetal_presentation: consultation.fetalPresentation || null,
          edema: consultation.edema || null,
          complaints: consultation.observations || null,
          conduct: consultation.conduct || null,
          notes: consultation.observations || null,
        }).select().single();

        if (data) {
          setRecords(prev => prev.map(r => r.id === recordId ? {
            ...r,
            prenatalConsultations: r.prenatalConsultations.map(c => c.id === newId ? { ...c, id: data.id } : c),
          } : r));
        }
      } catch (err) {
        console.error("Error saving consultation:", err);
      }
    })();
  };

  const updatePrenatalConsultation = (recordId: string, consultationId: string, data: Partial<PrenatalConsultation>) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r,
      prenatalConsultations: r.prenatalConsultations.map((c) => c.id === consultationId ? { ...c, ...data } : c),
      updatedAt: new Date().toISOString(),
    } : r));

    // Async update
    (async () => {
      try {
        const updateData: any = {};
        if (data.status) updateData.status = data.status;
        if (data.weight !== undefined) updateData.weight = data.weight ? parseFloat(data.weight) : null;
        if (data.bloodPressure !== undefined) updateData.blood_pressure = data.bloodPressure;
        if (data.uterineHeight !== undefined) updateData.uterine_height = data.uterineHeight ? parseFloat(data.uterineHeight) : null;
        if (data.fetalHeartRate !== undefined) updateData.fetal_heart_rate = data.fetalHeartRate;
        if (data.edema !== undefined) updateData.edema = data.edema;
        if (data.conduct !== undefined) updateData.conduct = data.conduct;
        if (data.observations !== undefined) updateData.notes = data.observations;

        if (Object.keys(updateData).length > 0) {
          await supabase.from("prenatal_consultations").update(updateData).eq("id", consultationId);
        }
      } catch (err) {
        console.error("Error updating consultation:", err);
      }
    })();
  };

  const addGestationalExam = (recordId: string, exam: Omit<GestationalExam, "id">) => {
    const newId = `ge${Date.now()}`;
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, gestationalExams: [...r.gestationalExams, { ...exam, id: newId }], updatedAt: new Date().toISOString(),
    } : r));

    // Async save
    (async () => {
      try {
        const { data } = await supabase.from("gestational_exams").insert({
          clinical_record_id: recordId,
          tenant_id: tenantId || undefined,
          type: exam.type,
          date: exam.date,
          result: exam.result || null,
          status: exam.result ? "completo" : "pendente",
          notes: exam.observations || null,
          trimester: parseInt(exam.trimester) || null,
        }).select().single();

        if (data) {
          setRecords(prev => prev.map(r => r.id === recordId ? {
            ...r,
            gestationalExams: r.gestationalExams.map(e => e.id === newId ? { ...e, id: data.id } : e),
          } : r));
        }
      } catch (err) {
        console.error("Error saving exam:", err);
      }
    })();
  };

  const updateGestationalExam = (recordId: string, examId: string, data: Partial<GestationalExam>) => {
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r,
      gestationalExams: r.gestationalExams.map((e) => e.id === examId ? { ...e, ...data } : e),
      updatedAt: new Date().toISOString(),
    } : r));

    // Async update
    (async () => {
      try {
        const updateData: any = {};
        if (data.result !== undefined) updateData.result = data.result;
        if (data.observations !== undefined) updateData.notes = data.observations;
        if (data.result) updateData.status = "completo";

        if (Object.keys(updateData).length > 0) {
          await supabase.from("gestational_exams").update(updateData).eq("id", examId);
        }
      } catch (err) {
        console.error("Error updating exam:", err);
      }
    })();
  };

  const addVaccine = (recordId: string, vaccine: Omit<Vaccine, "id">) => {
    const newId = `v${Date.now()}`;
    setRecords((prev) => prev.map((r) => r.id === recordId ? {
      ...r, vaccines: [...(r.vaccines || []), { ...vaccine, id: newId }], updatedAt: new Date().toISOString(),
    } : r));

    // Async save
    (async () => {
      try {
        const { data } = await supabase.from("vaccines").insert({
          clinical_record_id: recordId,
          tenant_id: tenantId || undefined,
          name: vaccine.name,
          date: vaccine.date,
          dose: vaccine.dose || null,
          lot: vaccine.lot || null,
          status: "aplicada",
          notes: vaccine.reaction || null,
        }).select().single();

        if (data) {
          setRecords(prev => prev.map(r => r.id === recordId ? {
            ...r,
            vaccines: (r.vaccines || []).map(v => v.id === newId ? { ...v, id: data.id } : v),
          } : r));
        }
      } catch (err) {
        console.error("Error saving vaccine:", err);
      }
    })();
  };

  return (
    <ClinicalRecordContext.Provider value={{ records, loading, addRecord, updateRecord, deleteRecord, getRecordsByPatient, addProcedure, addFollowUp, addPrenatalConsultation, updatePrenatalConsultation, addGestationalExam, updateGestationalExam, addVaccine }}>
      {children}
    </ClinicalRecordContext.Provider>
  );
};


export const useClinicalRecords = () => {
  const ctx = useContext(ClinicalRecordContext);
  if (!ctx) throw new Error("useClinicalRecords must be used within ClinicalRecordProvider");
  return ctx;
};
