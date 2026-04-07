import AdminLayout from "./AdminLayout";
import { useClinicalRecords } from "@/contexts/ClinicalRecordContext";
import { Card, CardContent } from "@/components/ui/card";
import AlertsPanel from "@/components/admin/clinical/AlertsPanel";

const AdminRegistroClinicoAlertas = () => {
  const { records } = useClinicalRecords();
  const activeRecords = records.filter(r => r.status === "ativo");

  return (
    <AdminLayout title="Alertas Clínicos" backTo="/admin/registro-clinico">
      <div className="space-y-4">
        {activeRecords.length === 0 ? (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-heading">Nenhuma ficha ativa para exibir alertas</p>
            </CardContent>
          </Card>
        ) : (
          activeRecords.map(record => (
            <div key={record.id} className="space-y-2">
              <p className="text-sm font-heading font-bold text-foreground">{record.patientName} — {record.prontuarioNumber}</p>
              <AlertsPanel record={record} onNavigateTab={() => {}} />
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRegistroClinicoAlertas;
