import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { ClinicalRecord } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { calcGestationalAge } from "./constants";

interface ClinicalRecordListProps {
  records: ClinicalRecord[];
  onOpenRecord: (record: ClinicalRecord) => void;
  onEditRecord: (record: ClinicalRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNewRecord: () => void;
}

const ClinicalRecordList = ({ records, onOpenRecord, onEditRecord, onDeleteRecord, onNewRecord }: ClinicalRecordListProps) => {
  const { user, users } = useAuth();
  const professionals = users.filter(u => u.role === "admin" || u.role === "super_admin");

  const [search, setSearch] = useState("");
  const [filterProfessionalId, setFilterProfessionalId] = useState<string>(user?.role === "admin" ? user.id : "all");

  const filteredRecords = useMemo(() => {
    let result = records;
    if (filterProfessionalId !== "all") {
      result = result.filter(r => r.assignedProfessionals?.some(p => p.id === filterProfessionalId));
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r => r.patientName.toLowerCase().includes(s) || r.prontuarioNumber.toLowerCase().includes(s) || r.cpf?.includes(s));
    }
    return result;
  }, [records, filterProfessionalId, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          <Input placeholder="Buscar por nome, registro ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-xl max-w-sm" />
          <Select value={filterProfessionalId} onValueChange={setFilterProfessionalId}>
            <SelectTrigger className="rounded-xl w-[220px]"><SelectValue placeholder="Filtrar por profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="secondary" onClick={onNewRecord}>Nova Ficha Gestacional</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: filteredRecords.length, label: "Total de Fichas" },
          { value: filteredRecords.filter(r => r.status === "ativo").length, label: "Ativas" },
          { value: filteredRecords.reduce((sum, r) => sum + r.prenatalConsultations.length, 0), label: "Consultas" },
          { value: filteredRecords.reduce((sum, r) => sum + r.gestationalExams.length, 0), label: "Exames" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center"><p className="text-sm text-muted-foreground font-heading">Nenhum registro encontrado</p></CardContent>
          </Card>
        ) : filteredRecords.map(record => (
          <Card key={record.id} className="border-border/50 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onOpenRecord(record)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                    <span className="text-xs text-muted-foreground font-heading">{record.patientName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-heading font-bold text-foreground text-sm">{record.patientName}</h3>
                      <Badge variant={record.status === "ativo" ? "default" : "secondary"} className="text-[10px] font-heading">{record.status === "ativo" ? "Ativo" : "Arquivado"}</Badge>
                      {record.gestationalCard.riskClassification === "alto_risco" && <Badge variant="destructive" className="text-[10px] font-heading">Alto Risco</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{record.prontuarioNumber} {record.cpf ? `• CPF: ${record.cpf}` : ""}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                      {record.gestationalCard.dum && <span>IG: {calcGestationalAge(record.gestationalCard.dum)}</span>}
                      {record.gestationalCard.dpp && <span>DPP: {format(new Date(record.gestationalCard.dpp), "dd/MM/yyyy")}</span>}
                      <span>{record.prenatalConsultations.length} consulta(s)</span>
                    </div>
                    {record.assignedProfessionals?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {record.assignedProfessionals.map(p => <Badge key={p.id} variant="outline" className="text-[10px] font-heading">{p.name}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => onEditRecord(record)}>Editar</Button>
                  <Button size="sm" variant="ghost" className="text-xs font-heading hover:text-destructive" onClick={() => onDeleteRecord(record.id)}>Excluir</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClinicalRecordList;
