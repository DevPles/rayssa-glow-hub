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

  const stats = [
    { value: filteredRecords.length, label: "Total de Fichas" },
    { value: filteredRecords.filter(r => r.status === "ativo").length, label: "Ativas" },
    { value: filteredRecords.reduce((sum, r) => sum + r.prenatalConsultations.length, 0), label: "Consultas" },
    { value: filteredRecords.reduce((sum, r) => sum + r.gestationalExams.length, 0), label: "Exames" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <Button onClick={onNewRecord} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
          Nova Ficha Gestacional
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Record list */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-heading">Nenhum registro encontrado</p>
            </CardContent>
          </Card>
        ) : filteredRecords.map(record => (
          <Card key={record.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => onOpenRecord(record)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
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
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {record.prontuarioNumber}
                    {record.cpf ? ` • CPF: ${record.cpf}` : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {record.gestationalCard.dum && <span className="text-[10px] text-muted-foreground">IG: {calcGestationalAge(record.gestationalCard.dum)}</span>}
                    {record.gestationalCard.dpp && <span className="text-[10px] text-muted-foreground">DPP: {format(new Date(record.gestationalCard.dpp), "dd/MM/yyyy")}</span>}
                    <span className="text-[10px] text-muted-foreground">{record.prenatalConsultations.length} consulta(s)</span>
                    {record.gestationalExams.length > 0 && <span className="text-[10px] text-muted-foreground">{record.gestationalExams.length} exame(s)</span>}
                    {record.assignedProfessionals?.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{record.assignedProfessionals.map(p => p.name).join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => onOpenRecord(record)}>Ver</Button>
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
