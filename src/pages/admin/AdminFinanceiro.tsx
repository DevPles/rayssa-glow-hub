import AdminLayout from "./AdminLayout";
import { FinanceiroTab } from "@/components/admin/FaturamentoTab";

const AdminFinanceiro = () => (
  <AdminLayout title="Financeiro">
    <FinanceiroTab />
  </AdminLayout>
);

export default AdminFinanceiro;
