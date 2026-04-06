import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
export type UserRole = "cliente" | "afiliada" | "admin" | "super_admin";

export type ProfessionalSpecialty = "medico_obstetra" | "enfermeiro_obstetra" | "";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  specialty: ProfessionalSpecialty;
  tenantId?: string | null;
}

// Mock users database
const mockUsersDB: MockUser[] = [
  { id: "1", name: "Super Admin", email: "superadmin@sistema.com", phone: "(11) 99999-0000", password: "super123", role: "super_admin", specialty: "", tenantId: null },
  { id: "1b", name: "Admin Rayssa", email: "admin@123.com", phone: "(11) 99999-0001", password: "admin123", role: "admin", specialty: "medico_obstetra", tenantId: null },
  { id: "2", name: "Maria Silva", email: "maria@email.com", phone: "(11) 98888-1111", password: "123456", role: "cliente", specialty: "", tenantId: null },
  { id: "3", name: "Ana Souza", email: "ana@email.com", phone: "(11) 99999-0001", password: "123456", role: "admin", specialty: "enfermeiro_obstetra", tenantId: null },
  { id: "4", name: "Camila Costa", email: "camila@email.com", phone: "(21) 97777-2222", password: "123456", role: "cliente", specialty: "", tenantId: null },
  { id: "5", name: "Juliana Ferreira", email: "juliana@email.com", phone: "(11) 99999-0002", password: "123456", role: "admin", specialty: "medico_obstetra", tenantId: null },
];

interface AuthContextType {
  user: MockUser | null;
  users: MockUser[];
  login: (email: string, password: string) => MockUser | null;
  signup: (name: string, email: string) => MockUser;
  addUser: (data: { name: string; email: string; phone?: string; password?: string; role?: UserRole; tenantId?: string | null }) => MockUser;
  logout: () => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUser: (userId: string, data: Partial<Pick<MockUser, "name" | "email" | "phone" | "password" | "tenantId">>) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [users, setUsers] = useState<MockUser[]>(mockUsersDB);

  // Auto-resolve tenantId for admin users from the tenants table
  const resolveTenantId = useCallback(async (u: MockUser): Promise<MockUser> => {
    if (u.tenantId || u.role === "super_admin" || u.role === "cliente" || u.role === "afiliada") return u;
    try {
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_email", u.email)
        .maybeSingle();
      if (data?.id) {
        const updated = { ...u, tenantId: data.id };
        setUsers((prev) => prev.map((x) => x.id === u.id ? updated : x));
        return updated;
      }
    } catch { /* ignore */ }
    return u;
  }, []);

  const login = (email: string, _password: string): MockUser | null => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      // Resolve tenant async, set user immediately
      setUser(found);
      resolveTenantId(found).then((resolved) => {
        if (resolved !== found) setUser(resolved);
      });
      return found;
    }
    // Auto-create as cliente if not found
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name: email.split("@")[0],
      email,
      phone: "",
      password: _password,
      role: "cliente",
      tenantId: null,
    };
    setUsers((prev) => [...prev, newUser]);
    setUser(newUser);
    return newUser;
  };

  const signup = (name: string, email: string): MockUser => {
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name,
      email,
      phone: "",
      password: "123456",
      role: "cliente",
      tenantId: null,
    };
    setUsers((prev) => [...prev, newUser]);
    setUser(newUser);
    return newUser;
  };

  const addUser = (data: { name: string; email: string; phone?: string; password?: string; role?: UserRole; tenantId?: string | null }): MockUser => {
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      password: data.password || "123456",
      role: data.role || "cliente",
      tenantId: data.tenantId || null,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const logout = () => setUser(null);

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    if (user?.id === userId) setUser((prev) => prev ? { ...prev, role } : null);
  };

  const updateUser = (userId: string, data: Partial<Pick<MockUser, "name" | "email" | "phone" | "password" | "tenantId">>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <AuthContext.Provider value={{ user, users, login, signup, addUser, logout, updateUserRole, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
