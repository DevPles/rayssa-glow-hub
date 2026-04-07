import AdminLayout from "./AdminLayout";
import RegistroClinicoTab from "@/components/admin/RegistroClinicoTab";

const AdminRegistroClinicoFichas = () => (
  <AdminLayout title="Fichas Gestacionais" backTo="/admin/registro-clinico">
    <RegistroClinicoTab />
  </AdminLayout>
);

export default AdminRegistroClinicoFichas;
