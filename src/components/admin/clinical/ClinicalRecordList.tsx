import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      {/* Header: search + filter + button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          <Input
            placeholder="Buscar por nome, registro ou CPF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl max-w-sm bg-white/80 border-border/40"
          />
          <Select value={filterProfessionalId} onValueChange={setFilterProfessionalId}>
            <SelectTrigger className="rounded-xl w-[220px] bg-white/80 border-border/40">
              <SelectValue placeholder="Filtrar por profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={onNewRecord}
          className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading"
        >
          Nova Ficha Gestacional
        </Button>
      </div>

      {/* KPI cards - horizontal row with gradient */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-5 text-center"
            style={{
              background: "linear-gradient(135deg, hsl(40,35%,93%) 0%, hsl(38,30%,90%) 50%, hsl(35,25%,85%) 100%)",
            }}
          >
            <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Record list */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "linear-gradient(135deg, hsl(40,35%,96%) 0%, hsl(38,30%,93%) 100%)",
            }}
          >
            <p className="text-sm text-muted-foreground font-heading">Nenhum registro encontrado</p>
          </div>
        ) : filteredRecords.map(record => (
          <div
            key={record.id}
            className="rounded-2xl p-5 transition-shadow hover:shadow-lg cursor-pointer"
            style={{
              background: "linear-gradient(135deg, hsl(40,35%,96%) 0%, hsl(38,30%,93%) 50%, hsl(35,25%,88%) 100%)",
            }}
            onClick={() => onOpenRecord(record)}
          >
            <div className="flex items-start justify-between gap-4">
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
                <p className="text-xs text-muted-foreground">
                  {record.prontuarioNumber}
                  {record.cpf ? ` • CPF: ${record.cpf}` : ""}
                </p>
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap mt-1">
                  {record.gestationalCard.dum && <span>IG: {calcGestationalAge(record.gestationalCard.dum)}</span>}
                  {record.gestationalCard.dpp && <span>DPP: {format(new Date(record.gestationalCard.dpp), "dd/MM/yyyy")}</span>}
                  <span>{record.prenatalConsultations.length} consulta(s)</span>
                  {record.gestationalExams.length > 0 && <span>{record.gestationalExams.length} exame(s)</span>}
                  {record.assignedProfessionals?.length > 0 && (
                    <span>
                      {record.assignedProfessionals.map(p => p.name).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground font-heading transition-colors"
                  onClick={() => onOpenRecord(record)}
                >
                  Ver
                </button>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground font-heading transition-colors"
                  onClick={() => onEditRecord(record)}
                >
                  Editar
                </button>
                <button
                  className="text-xs text-muted-foreground hover:text-destructive font-heading transition-colors"
                  onClick={() => onDeleteRecord(record.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicalRecordList;
