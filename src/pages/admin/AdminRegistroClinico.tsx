import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useClinicalRecords } from "@/contexts/ClinicalRecordContext";

const clinicalCards = [
  { key: "fichas", label: "Fichas Gestacionais", description: "Cadastro e prontuários das gestantes", route: "/admin/registro-clinico/fichas" },
  { key: "consultas", label: "Consultas", description: "Consultas pré-natal realizadas e agendadas", route: "/admin/registro-clinico/consultas" },
  { key: "exames", label: "Exames", description: "Exames gestacionais por trimestre", route: "/admin/registro-clinico/exames" },
  { key: "vacinas", label: "Vacinas", description: "Calendário vacinal e registros", route: "/admin/registro-clinico/vacinas" },
  { key: "timeline", label: "Timeline", description: "Cronologia unificada de eventos", route: "/admin/registro-clinico/timeline" },
  { key: "alertas", label: "Alertas", description: "Alertas e pendências clínicas", route: "/admin/registro-clinico/alertas" },
];

const AdminRegistroClinico = () => {
  const { records } = useClinicalRecords();

  const stats: Record<string, number> = {
    fichas: records.length,
    consultas: records.reduce((s, r) => s + r.prenatalConsultations.length, 0),
    exames: records.reduce((s, r) => s + r.gestationalExams.length, 0),
    vacinas: records.reduce((s, r) => s + (r.vaccines || []).length, 0),
  };

  return (
    <AdminLayout title="Registro Clínico">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinicalCards.map((card) => {
          const count = stats[card.key];
          return (
            <Link key={card.key} to={card.route} className="group">
              <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-lg shadow-black/5 hover:bg-white/60 hover:shadow-2xl hover:shadow-secondary/15 hover:border-white/70 transition-all duration-300 hover:-translate-y-1 h-full">
                <h3 className="font-heading font-bold text-foreground text-base mb-1.5 group-hover:text-secondary transition-colors">
                  {card.label}
                  {count !== undefined && (
                    <span className="ml-2 text-[10px] font-heading text-muted-foreground">({count})</span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminRegistroClinico;
