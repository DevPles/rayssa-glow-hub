import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useClinicalRecords } from "@/contexts/ClinicalRecordContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimelineTab from "@/components/admin/clinical/TimelineTab";

const AdminRegistroClinicoTimeline = () => {
  const { records } = useClinicalRecords();
  const [selectedId, setSelectedId] = useState<string>(records[0]?.id || "");

  const record = records.find(r => r.id === selectedId);

  return (
    <AdminLayout title="Timeline" backTo="/admin/registro-clinico">
      <div className="space-y-4">
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

        {record ? (
          <TimelineTab record={record} />
        ) : (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-heading">Selecione uma gestante para visualizar a timeline</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRegistroClinicoTimeline;
