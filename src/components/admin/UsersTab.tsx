import { useState } from "react";
import { Eye, EyeOff, Trash2, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import type { MockUser, UserRole } from "@/contexts/AuthContext";

const roleBadge: Record<UserRole, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-accent/15 text-accent border-accent/30" },
  admin: { label: "Admin", className: "bg-destructive/15 text-destructive border-destructive/30" },
  afiliada: { label: "Afiliada", className: "bg-secondary/15 text-secondary border-secondary/30" },
  cliente: { label: "Cliente", className: "bg-primary/15 text-primary border-primary/30" },
};

const loyaltyTiers = [
  { name: "Bronze", color: "text-amber-700", bg: "bg-amber-100", borderColor: "border-amber-300" },
  { name: "Prata", color: "text-slate-500", bg: "bg-slate-100", borderColor: "border-slate-300" },
  { name: "Ouro", color: "text-yellow-600", bg: "bg-yellow-100", borderColor: "border-yellow-400" },
  { name: "Diamante", color: "text-secondary", bg: "bg-secondary/10", borderColor: "border-secondary/40" },
];

type TierName = "Bronze" | "Prata" | "Ouro" | "Diamante";

const getTierByName = (name: TierName) => loyaltyTiers.find(t => t.name === name) || loyaltyTiers[0];

const initialLoyaltyData: Record<string, { points: number; purchases: number; procedures: number }> = {
  "2": { points: 1358, purchases: 5, procedures: 8 },
  "4": { points: 620, purchases: 3, procedures: 4 },
};

const defaultLoyalty = { points: 0, purchases: 0, procedures: 0 };

const mockPurchaseHistory: Record<string, { date: string; item: string; value: string; type: string }[]> = {
  "2": [
    { date: "18/02/2026", item: "Limpeza de Pele Profunda", value: "R$ 189,00", type: "Procedimento" },
    { date: "05/02/2026", item: "Radiofrequência Facial", value: "R$ 320,00", type: "Procedimento" },
    { date: "22/01/2026", item: "Drenagem Linfática", value: "R$ 150,00", type: "Procedimento" },
    { date: "10/01/2026", item: "Kit Skincare Premium", value: "R$ 249,00", type: "Compra" },
    { date: "28/12/2025", item: "Microagulhamento", value: "R$ 450,00", type: "Procedimento" },
  ],
  "4": [
    { date: "10/02/2026", item: "Limpeza de Pele", value: "R$ 189,00", type: "Procedimento" },
    { date: "20/01/2026", item: "Peeling Químico", value: "R$ 250,00", type: "Procedimento" },
    { date: "05/01/2026", item: "Kit Hidratação", value: "R$ 181,00", type: "Compra" },
  ],
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

  const openEdit = (u: MockUser) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, phone: u.phone, password: u.password });
    setFormRole(u.role);
    setFormTier(getUserTier(u.id));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingUser) return;
    if (!form.name || !form.email) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    updateUser(editingUser.id, { name: form.name, email: form.email, phone: form.phone, password: form.password });
    if (formRole !== editingUser.role) updateUserRole(editingUser.id, formRole);
    setUserTiers(prev => ({ ...prev, [editingUser.id]: formTier }));
    toast({ title: "Usuário atualizado!" });
    setDialogOpen(false);
  };

  const togglePassword = (userId: string) => {
    setShowPassword(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Ranking data
  const clientUsers = users.filter(u => u.role === "cliente");
  const ranked = clientUsers
    .map(u => ({
      id: u.id,
      name: u.name,
      points: (initialLoyaltyData[u.id] || defaultLoyalty).points,
      tier: getUserTier(u.id),
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-foreground">Controle de Usuários</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{users.length} usuários</span>
          <Button
            onClick={() => { setNewUser({ name: "", email: "", phone: "", password: "123456" }); setNewUserRole("cliente"); setNewUserTier("Bronze"); setCreateDialogOpen(true); }}
            className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading gap-1.5"
            size="sm"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      {/* TABLE LIST */}
      <div className="rounded-xl border border-white/50 overflow-hidden bg-white/40 backdrop-blur-xl shadow-lg shadow-black/5">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-heading text-xs">Nome</TableHead>
              <TableHead className="font-heading text-xs">E-mail</TableHead>
              <TableHead className="font-heading text-xs">Telefone</TableHead>
              <TableHead className="font-heading text-xs">Tipo</TableHead>
              <TableHead className="font-heading text-xs">Nível</TableHead>
              <TableHead className="font-heading text-xs">Senha</TableHead>
              <TableHead className="font-heading text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const badge = roleBadge[u.role];
              const pwVisible = showPassword[u.id] || false;
              const tierName = getUserTier(u.id);
              const tier = getTierByName(tierName);

              return (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="font-heading font-semibold text-sm">{u.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.role === "cliente" ? (
                      <Badge className={`${tier.bg} ${tier.color} border ${tier.borderColor} text-[10px] font-heading font-bold py-0 px-1.5`}>
                        {tierName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {pwVisible ? u.password : "••••••"}
                      <button onClick={() => togglePassword(u.id)} className="hover:text-foreground transition-colors">
                        {pwVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => { deleteUser(u.id); toast({ title: "Usuário removido" }); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingUser ? `Editar — ${editingUser.name}` : "Editar Usuário"}
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <Tabs defaultValue="dados" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
                <TabsTrigger value="classificacao" className="flex-1">Classificação</TabsTrigger>
                {formRole === "cliente" && (
                  <TabsTrigger value="fidelidade" className="flex-1">Fidelidade</TabsTrigger>
                )}
              </TabsList>

              {/* TAB: Dados */}
              <TabsContent value="dados" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs">Nome *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs">E-mail *</Label>
                    <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs">Telefone</Label>
                    <Input placeholder="(00) 00000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs">Senha</Label>
                    <Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Classificação */}
              <TabsContent value="classificacao" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs">Tipo de Usuário</Label>
                    <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="afiliada">Afiliada</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-heading text-xs">Nível de Fidelidade</Label>
                    <Select value={formTier} onValueChange={(v) => setFormTier(v as TierName)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {loyaltyTiers.map(t => (
                          <SelectItem key={t.name} value={t.name}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${t.bg} border ${t.borderColor}`} />
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
                    <p className="font-heading font-semibold text-xs text-foreground">Ranking de Clientes</p>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-heading text-[10px] w-10">#</TableHead>
                            <TableHead className="font-heading text-[10px]">Nome</TableHead>
                            <TableHead className="font-heading text-[10px]">Nível</TableHead>
                            <TableHead className="font-heading text-[10px] text-right">Pontos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ranked.map((r, i) => {
                            const rTier = getTierByName(r.tier);
                            return (
                              <TableRow
                                key={r.id}
                                className={r.id === editingUser.id ? "bg-secondary/10" : ""}
                              >
                                <TableCell className={`font-heading font-bold text-xs ${i === 0 ? "text-yellow-600" : i === 1 ? "text-slate-500" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                                  {i + 1}
                                </TableCell>
                                <TableCell className={`text-xs ${r.id === editingUser.id ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                                  {r.name}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${rTier.bg} ${rTier.color} border ${rTier.borderColor} text-[9px] py-0 px-1`}>
                                    {r.tier}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs font-heading font-semibold">
                                  {r.points.toLocaleString("pt-BR")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* TAB: Fidelidade */}
              {formRole === "cliente" && (
                <TabsContent value="fidelidade" className="space-y-4 mt-4">
                  {(() => {
                    const loyalty = initialLoyaltyData[editingUser.id] || defaultLoyalty;
                    const currentTier = getTierByName(formTier);
                    const userHistory = mockPurchaseHistory[editingUser.id] || [];

                    return (
                      <>
                        {/* Tier badge + metrics */}
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${currentTier.bg} ${currentTier.color} border ${currentTier.borderColor} text-sm font-heading font-bold px-3 py-1`}>
                            {formTier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            #{ranked.findIndex(r => r.id === editingUser.id) + 1} de {ranked.length} clientes
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Pontos (R$)", value: loyalty.points.toLocaleString("pt-BR") },
                            { label: "Compras", value: loyalty.purchases },
                            { label: "Procedimentos", value: loyalty.procedures },
                          ].map(m => (
                            <div key={m.label} className="text-center p-3 rounded-xl bg-muted/60 border border-border/40">
                              <p className="text-xl font-heading font-bold text-foreground">{m.value}</p>
                              <p className="text-[10px] text-muted-foreground">{m.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* History table */}
                        {userHistory.length > 0 && (
                          <>
                            <Separator />
                            <p className="font-heading font-semibold text-xs text-foreground">Histórico</p>
                            <div className="rounded-xl border border-border overflow-hidden max-h-[200px] overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="font-heading text-[10px]">Data</TableHead>
                                    <TableHead className="font-heading text-[10px]">Item</TableHead>
                                    <TableHead className="font-heading text-[10px]">Tipo</TableHead>
                                    <TableHead className="font-heading text-[10px] text-right">Valor</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {userHistory.map((h, i) => (
                                    <TableRow key={i}>
                                      <TableCell className="text-xs text-muted-foreground">{h.date}</TableCell>
                                      <TableCell className="text-xs font-heading font-semibold">{h.item}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-[9px]">{h.type}</Badge>
                                      </TableCell>
                                      <TableCell className="text-right text-xs font-heading font-semibold">{h.value}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>
              )}

              <Separator className="mt-4" />
              <Button onClick={handleSave} className="w-full rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading mt-2">
                Salvar Alterações
              </Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Adicionar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Nome *</Label>
                <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="rounded-xl" placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">E-mail *</Label>
                <Input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="rounded-xl" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Telefone</Label>
                <Input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} className="rounded-xl" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Senha</Label>
                <Input value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Tipo de Usuário</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="afiliada">Afiliada</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-heading text-xs">Nível de Fidelidade</Label>
                <Select value={newUserTier} onValueChange={(v) => setNewUserTier(v as TierName)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {loyaltyTiers.map(t => (
                      <SelectItem key={t.name} value={t.name}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${t.bg} border ${t.borderColor}`} />
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => {
                if (!newUser.name || !newUser.email) {
                  toast({ title: "Preencha nome e e-mail", variant: "destructive" });
                  return;
                }
                const created = addUser({ name: newUser.name, email: newUser.email, phone: newUser.phone, password: newUser.password, role: newUserRole });
                setUserTiers(prev => ({ ...prev, [created.id]: newUserTier }));
                toast({ title: "Usuário adicionado!", description: `${created.name} foi cadastrado como ${roleBadge[newUserRole].label}.` });
                setCreateDialogOpen(false);
              }}
              className="w-full rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading"
            >
              Criar Usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
