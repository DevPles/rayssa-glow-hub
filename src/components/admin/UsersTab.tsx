import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { MockUser, UserRole } from "@/contexts/AuthContext";

const roleMeta: Record<UserRole, { label: string }> = {
  super_admin: { label: "Super Admin" },
  admin: { label: "Administrador" },
  afiliada: { label: "Profissional" },
  cliente: { label: "Gestante" },
};

interface UsersTabProps {
  users: MockUser[];
  currentUserId: string;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUser: (userId: string, data: Partial<Pick<MockUser, "name" | "email" | "phone" | "password">>) => void;
  deleteUser: (userId: string) => void;
  addUser: (data: { name: string; email: string; phone?: string; password?: string; role?: UserRole }) => MockUser;
}

export const UsersTab = ({ users, currentUserId, updateUserRole, updateUser, deleteUser, addUser }: UsersTabProps) => {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [formRole, setFormRole] = useState<UserRole>("cliente");

  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", password: "123456" });
  const [newUserRole, setNewUserRole] = useState<UserRole>("cliente");

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filterRole !== "all") result = result.filter((u) => u.role === filterRole);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.phone.includes(s));
    }
    return result;
  }, [users, filterRole, search]);

  const stats = useMemo(() => ({
    total: users.length,
    gestantes: users.filter((u) => u.role === "cliente").length,
    profissionais: users.filter((u) => u.role === "admin" || u.role === "afiliada").length,
    admins: users.filter((u) => u.role === "super_admin").length,
  }), [users]);

  const openEdit = (u: MockUser) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone, password: u.password });
    setFormRole(u.role);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingUser) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    updateUser(editingUser.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
    if (formRole !== editingUser.role) updateUserRole(editingUser.id, formRole);
    toast({ title: "Usuário atualizado!" });
    setDialogOpen(false);
  };

  const handleCreate = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    const created = addUser({
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      phone: newUser.phone.trim(),
      password: newUser.password,
      role: newUserRole,
    });
    toast({ title: "Usuário criado!", description: `${created.name} cadastrado como ${roleMeta[newUserRole].label}.` });
    setCreateDialogOpen(false);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0][0] || "?";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Gestantes", value: stats.gestantes },
          { label: "Profissionais", value: stats.profissionais },
          { label: "Admins", value: stats.admins },
        ].map((s) => (
          <Card key={s.label} className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-4">
              <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-sm rounded-xl"
        />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="rounded-xl w-[180px]">
            <SelectValue placeholder="Filtrar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="cliente">Gestantes</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="afiliada">Profissionais</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          onClick={() => {
            setNewUser({ name: "", email: "", phone: "", password: "123456" });
            setNewUserRole("cliente");
            setCreateDialogOpen(true);
          }}
          className="ml-auto font-heading"
        >
          Novo Usuário
        </Button>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <Card className="bg-card/60 backdrop-blur border-border/40">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((u) => {
            const meta = roleMeta[u.role];
            const pwVisible = showPassword[u.id] || false;

            return (
              <Card key={u.id} className="bg-card/60 backdrop-blur border-border/40 hover:bg-card/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-xs bg-muted text-muted-foreground">
                      {getInitials(u.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-heading font-bold text-sm text-foreground truncate">{u.name}</span>
                        <Badge variant="outline" className="text-[10px] font-heading border-border text-muted-foreground">
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="truncate">{u.email}</span>
                        {u.phone && <span className="hidden sm:inline">{u.phone}</span>}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground min-w-[100px]">
                      <span className="font-mono">{pwVisible ? u.password : "••••••"}</span>
                      <button onClick={() => setShowPassword((p) => ({ ...p, [u.id]: !p[u.id] }))} className="hover:text-foreground transition-colors text-[10px] underline">
                        {pwVisible ? "ocultar" : "ver"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      <button className="text-muted-foreground hover:text-foreground underline transition-colors" onClick={() => openEdit(u)}>
                        editar
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          className="text-muted-foreground hover:text-destructive underline transition-colors"
                          onClick={() => { deleteUser(u.id); toast({ title: "Usuário removido" }); }}
                        >
                          excluir
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingUser ? `Editar — ${editingUser.name}` : "Editar Usuário"}
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">E-mail *</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">Telefone</Label>
                  <Input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-heading text-xs">Senha</Label>
                  <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Tipo de Usuário</Label>
                <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Gestante</SelectItem>
                    <SelectItem value="afiliada">Profissional</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="secondary" onClick={handleSave} className="w-full font-heading">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE DIALOG ===== */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Nome *</Label>
                <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="rounded-xl" placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">E-mail *</Label>
                <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="rounded-xl" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Telefone</Label>
                <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="rounded-xl" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Senha</Label>
                <Input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label className="font-heading text-xs">Tipo de Usuário</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Gestante</SelectItem>
                  <SelectItem value="afiliada">Profissional</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" onClick={handleCreate} className="w-full font-heading">
              Criar Usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
