import AdminLayout from "./AdminLayout";
import { AfiliadosTab } from "@/components/admin/AfiliadosTab";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/contexts/ServicesContext";

const AdminAfiliados = () => {
  const { users } = useAuth();
  const { services } = useServices();

  return (
    <AdminLayout title="Afiliados">
      <AfiliadosTab users={users} services={services.map(s => ({ id: s.id, title: s.title, price: s.price, page: s.page, category: s.category }))} />
    </AdminLayout>
  );
};

export default AdminAfiliados;
