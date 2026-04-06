import AdminLayout from "./AdminLayout";
import { UsersTab } from "@/components/admin/UsersTab";
import { useAuth } from "@/contexts/AuthContext";

const AdminUsuarios = () => {
  const { user, users, updateUserRole, updateUser, deleteUser, addUser } = useAuth();

  if (!user) return null;

  return (
    <AdminLayout title="Usuários">
      <UsersTab users={users} currentUserId={user.id} updateUserRole={updateUserRole} updateUser={updateUser} deleteUser={deleteUser} addUser={addUser} />
    </AdminLayout>
  );
};

export default AdminUsuarios;
