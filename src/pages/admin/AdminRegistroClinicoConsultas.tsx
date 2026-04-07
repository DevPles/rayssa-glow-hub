import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useClinicalRecords } from "@/contexts/ClinicalRecordContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConsultationsTab from "@/components/admin/clinical/ConsultationsTab";
import { format } from "date-fns";

const AdminRegistroClinicoConsultas = () => {
  const { records, updateRecord } = useClinicalRecords();
  const [selectedId, setSelectedId] = useState<string>(records[0]?.id || "");

  const record = records.find(r => r.id === selectedId);

  return (
    <AdminLayout title="Consultas Pré-Natal">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="rounded-xl max-w-sm">
              <SelectValue placeholder="Selecione a gestante" />
            </SelectTrigger>
            <SelectContent>
              {records.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.patientName} — {r.prontuarioNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {record && (
            <Badge variant="outline" className="font-heading text-xs">
              {record.prenatalConsultations.length} consulta(s)
            </Badge>
          )}
        </div>

        {record ? (
          <ConsultationsTab record={record} onRecordUpdate={(r) => updateRecord(r.id, r)} />
        ) : (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-heading">Selecione uma gestante para visualizar as consultas</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRegistroClinicoConsultas;
