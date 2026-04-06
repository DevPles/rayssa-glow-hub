import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClinicalRecord, PrenatalConsultation, GestationalExam } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { calcGestationalAge } from "./constants";
import AlertsPanel from "./AlertsPanel";
import GestationalCard from "./GestationalCard";
import ConsultationsTab from "./ConsultationsTab";
import ExamsTab from "./ExamsTab";
import VaccinesTab from "./VaccinesTab";
import TimelineTab from "./TimelineTab";

interface ClinicalRecordDetailProps {
  record: ClinicalRecord;
  onBack: () => void;
  onEdit: () => void;
  onRecordUpdate: (r: ClinicalRecord) => void;
}

const ClinicalRecordDetail = ({ record, onBack, onEdit, onRecordUpdate }: ClinicalRecordDetailProps) => {
  const gc = record.gestationalCard;
  const igAtual = calcGestationalAge(gc.dum);

  // For timeline click handlers
  const [activeTab, setActiveTab] = useState("cartao");

  const handleConsultClick = (c: PrenatalConsultation) => {
    setActiveTab("consultas");
  };

  const handleExamClick = (e: GestationalExam) => {
    setActiveTab("exames");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>← Voltar</Button>
        <Button variant="outline" onClick={onEdit}>Editar</Button>
      </div>

      {/* Header */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0">
                {record.patientPhoto ? (
                  <img src={record.patientPhoto} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-lg text-muted-foreground font-heading font-bold">{record.fullName.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="font-heading font-bold text-xl text-foreground">{record.fullName}</h2>
                <p className="text-sm text-muted-foreground">{record.prontuarioNumber} {record.cpf ? `• CPF: ${record.cpf}` : ""}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant={record.status === "ativo" ? "default" : "secondary"} className="font-heading text-xs">{record.status}</Badge>
                  {gc.riskClassification === "alto_risco" && <Badge variant="destructive" className="font-heading text-xs">Alto Risco</Badge>}
                  {gc.bloodType && <Badge variant="outline" className="font-heading text-xs">{gc.bloodType}{gc.rh}</Badge>}
                </div>
                {record.assignedProfessionals?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {record.assignedProfessionals.map(p => <Badge key={p.id} variant="outline" className="text-[10px] font-heading">{p.name}</Badge>)}
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

      {/* Alerts */}
      <AlertsPanel record={record} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-6 bg-white/40 backdrop-blur-xl rounded-xl">
          <TabsTrigger value="cartao" className="rounded-lg font-heading text-xs">Cartão</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg font-heading text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="consultas" className="rounded-lg font-heading text-xs">Consultas ({record.prenatalConsultations.length})</TabsTrigger>
          <TabsTrigger value="exames" className="rounded-lg font-heading text-xs">Exames ({record.gestationalExams.length})</TabsTrigger>
          <TabsTrigger value="vacinas" className="rounded-lg font-heading text-xs">Vacinas ({(record.vaccines || []).length})</TabsTrigger>
          <TabsTrigger value="dados" className="rounded-lg font-heading text-xs">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="cartao" className="mt-4">
          <GestationalCard record={record} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineTab record={record} onConsultClick={handleConsultClick} onExamClick={handleExamClick} />
        </TabsContent>

        <TabsContent value="consultas" className="mt-4">
          <ConsultationsTab record={record} onRecordUpdate={onRecordUpdate} />
        </TabsContent>

        <TabsContent value="exames" className="mt-4">
          <ExamsTab record={record} onRecordUpdate={onRecordUpdate} />
        </TabsContent>

        <TabsContent value="vacinas" className="mt-4">
          <VaccinesTab record={record} onRecordUpdate={onRecordUpdate} />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "CPF", value: record.cpf || "—" },
                  { label: "Nascimento", value: record.birthDate ? format(new Date(record.birthDate), "dd/MM/yyyy") : "—" },
                  { label: "Telefone", value: record.phone || "—" },
                  { label: "Estado Civil", value: record.maritalStatus || "—" },
                  { label: "Profissão", value: record.profession || "—" },
                  { label: "Endereço", value: record.address || "—" },
                  { label: "Emergência", value: record.emergencyContact || "—" },
                  { label: "Consentimento", value: record.consentSigned ? "Assinado" : "Pendente" },
                ].map(item => (
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
    </div>
  );
};

export default ClinicalRecordDetail;
