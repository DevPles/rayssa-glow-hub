import { useState, useMemo } from "react";
import { Eye, EyeOff, Trash2, Pencil, Plus, Search, Users, UserCheck, UserPlus, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { MockUser, UserRole } from "@/contexts/AuthContext";

const roleMeta: Record<UserRole, { label: string; color: string; icon: typeof Users }> = {
  super_admin: { label: "Super Admin", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Shield },
  admin: { label: "Administrador", color: "bg-purple-100 text-purple-800 border-purple-300", icon: UserCheck },
  afiliada: { label: "Parceiro(a)", color: "bg-blue-100 text-blue-800 border-blue-300", icon: UserPlus },
  cliente: { label: "Gestante", color: "bg-pink-100 text-pink-800 border-pink-300", icon: Users },
};

const loyaltyTiers = [
  { name: "Bronze", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", dot: "bg-amber-400" },
  { name: "Prata", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-300", dot: "bg-slate-400" },
  { name: "Ouro", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-400", dot: "bg-yellow-500" },
  { name: "Diamante", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-400", dot: "bg-violet-500" },
];

type TierName = "Bronze" | "Prata" | "Ouro" | "Diamante";
const getTier = (name: TierName) => loyaltyTiers.find((t) => t.name === name) || loyaltyTiers[0];

const initialLoyaltyData: Record<string, { points: number; purchases: number; procedures: number }> = {
  "2": { points: 1358, purchases: 5, procedures: 8 },
  "4": { points: 620, purchases: 3, procedures: 4 },
};
const defaultLoyalty = { points: 0, purchases: 0, procedures: 0 };

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
  const [formTier, setFormTier] = useState<TierName>("Bronze");
  const [userTiers, setUserTiers] = useState<Record<string, TierName>>({});

  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", password: "123456" });
  const [newUserRole, setNewUserRole] = useState<UserRole>("cliente");
  const [newUserTier, setNewUserTier] = useState<TierName>("Bronze");

  const getUserTier = (userId: string): TierName => {
    if (userTiers[userId]) return userTiers[userId];
    const pts = (initialLoyaltyData[userId] || defaultLoyalty).points;
    if (pts >= 3500) return "Diamante";
    if (pts >= 1500) return "Ouro";
    if (pts >= 500) return "Prata";
    return "Bronze";
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filterRole !== "all") {
      result = result.filter((u) => u.role === filterRole);
    }
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
    setFormTier(getUserTier(u.id));
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
    setUserTiers((prev) => ({ ...prev, [editingUser.id]: formTier }));
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
    setUserTiers((prev) => ({ ...prev, [created.id]: newUserTier }));
    toast({ title: "Usuário criado!", description: `${created.name} cadastrado como ${roleMeta[newUserRole].label}.` });
    setCreateDialogOpen(false);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0][0] || "?";
  };

  const initialsColor = (role: UserRole) => {
    switch (role) {
      case "super_admin": return "bg-amber-200 text-amber-800";
      case "admin": return "bg-purple-200 text-purple-800";
      case "afiliada": return "bg-blue-200 text-blue-800";
      default: return "bg-pink-200 text-pink-800";
    }
  };

  // Ranking for fidelity tab
  const ranked = users
    .filter((u) => u.role === "cliente")
    .map((u) => ({ id: u.id, name: u.name, points: (initialLoyaltyData[u.id] || defaultLoyalty).points, tier: getUserTier(u.id) }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Total", value: stats.total, accent: "text-foreground" },
          { icon: Users, label: "Gestantes", value: stats.gestantes, accent: "text-pink-600" },
          { icon: UserCheck, label: "Profissionais", value: stats.profissionais, accent: "text-purple-600" },
          { icon: Shield, label: "Admins", value: stats.admins, accent: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-muted/60">
                <s.icon className={`h-4 w-4 ${s.accent}`} />
              </div>
              <div>
                <p className={`text-xl font-heading font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
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
          onClick={() => {
            setNewUser({ name: "", email: "", phone: "", password: "123456" });
            setNewUserRole("cliente");
            setNewUserTier("Bronze");
            setCreateDialogOpen(true);
          }}
          className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading gap-1.5 shadow-md shadow-secondary/20 ml-auto"
        >
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* User Cards */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-heading">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((u) => {
            const meta = roleMeta[u.role];
            const tierName = getUserTier(u.id);
            const tier = getTier(tierName);
            const pwVisible = showPassword[u.id] || false;

            return (
              <Card key={u.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-sm ${initialsColor(u.role)}`}>
                      {getInitials(u.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-heading font-bold text-sm text-foreground truncate">{u.name}</h3>
                        <Badge variant="outline" className={`text-[10px] font-heading border ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        {u.role === "cliente" && (
                          <Badge className={`${tier.bg} ${tier.color} border ${tier.border} text-[10px] font-heading font-bold py-0 px-1.5`}>
                            {tierName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="truncate">{u.email}</span>
                        {u.phone && <span className="hidden sm:inline">{u.phone}</span>}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground min-w-[100px]">
                      <span className="font-mono">{pwVisible ? u.password : "••••••"}</span>
                      <button onClick={() => setShowPassword((p) => ({ ...p, [u.id]: !p[u.id] }))} className="hover:text-foreground transition-colors p-0.5">
                        {pwVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUserId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => { deleteUser(u.id); toast({ title: "Usuário removido" }); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-3">
              {editingUser && (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-xs ${initialsColor(editingUser.role)}`}>
                  {getInitials(editingUser.name)}
                </div>
              )}
              {editingUser ? editingUser.name : "Editar Usuário"}
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <Tabs defaultValue="dados" className="mt-2">
              <TabsList className="w-full grid grid-cols-3 bg-muted/40 rounded-xl">
                <TabsTrigger value="dados" className="rounded-lg font-heading text-xs">Dados</TabsTrigger>
                <TabsTrigger value="classificacao" className="rounded-lg font-heading text-xs">Classificação</TabsTrigger>
                {formRole === "cliente" && (
                  <TabsTrigger value="fidelidade" className="rounded-lg font-heading text-xs">Fidelidade</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="dados" className="space-y-4 mt-4">
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
              </TabsContent>

              <TabsContent value="classificacao" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs">Nível de Fidelidade</Label>
                    <Select value={formTier} onValueChange={(v) => setFormTier(v as TierName)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {loyaltyTiers.map((t) => (
                          <SelectItem key={t.name} value={t.name}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                              {t.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Ranking */}
                {ranked.length > 0 && (
                  <>
                    <Separator />
                    <p className="font-heading font-semibold text-xs text-foreground">Ranking de Gestantes</p>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {ranked.map((r, i) => {
                        const rTier = getTier(r.tier);
                        const isCurrentUser = r.id === editingUser.id;
                        return (
                          <div
                            key={r.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${isCurrentUser ? "bg-secondary/10 border border-secondary/30" : "bg-muted/30"}`}
                          >
                            <span className={`font-heading font-bold w-5 text-center ${i === 0 ? "text-yellow-600" : i === 1 ? "text-slate-500" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                              {i + 1}
                            </span>
                            <span className={`flex-1 ${isCurrentUser ? "font-bold text-foreground" : "text-muted-foreground"}`}>{r.name}</span>
                            <Badge className={`${rTier.bg} ${rTier.color} border ${rTier.border} text-[9px] py-0 px-1.5`}>{r.tier}</Badge>
                            <span className="font-heading font-semibold w-12 text-right">{r.points.toLocaleString("pt-BR")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              {formRole === "cliente" && (
                <TabsContent value="fidelidade" className="space-y-4 mt-4">
                  {(() => {
                    const loyalty = initialLoyaltyData[editingUser.id] || defaultLoyalty;
                    const currentTier = getTier(formTier);
                    return (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${currentTier.bg} ${currentTier.color} border ${currentTier.border} text-sm font-heading font-bold px-3 py-1`}>
                            {formTier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            #{ranked.findIndex((r) => r.id === editingUser.id) + 1} de {ranked.length} gestantes
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Pontos", value: loyalty.points.toLocaleString("pt-BR") },
                            { label: "Consultas", value: loyalty.purchases },
                            { label: "Procedimentos", value: loyalty.procedures },
                          ].map((m) => (
                            <div key={m.label} className="text-center p-3 rounded-xl bg-muted/40 border border-border/30">
                              <p className="text-xl font-heading font-bold text-foreground">{m.value}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </TabsContent>
              )}

              <Separator className="mt-4" />
              <Button onClick={handleSave} className="w-full rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading mt-2 shadow-md shadow-secondary/20">
                Salvar Alterações
              </Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE DIALOG ===== */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/10">
                <UserPlus className="h-4 w-4 text-secondary" />
              </div>
              Novo Usuário
            </DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Nível de Fidelidade</Label>
                <Select value={newUserTier} onValueChange={(v) => setNewUserTier(v as TierName)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {loyaltyTiers.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="w-full rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading shadow-md shadow-secondary/20"
            >
              Criar Usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
