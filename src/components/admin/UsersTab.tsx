import { useState, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { MockUser, UserRole, ProfessionalSpecialty } from "@/contexts/AuthContext";

const roleMeta: Record<UserRole, { label: string }> = {
  super_admin: { label: "Super Admin" },
  admin: { label: "Administrador" },
  afiliada: { label: "Profissional" },
  cliente: { label: "Gestante" },
};

const specialtyMeta: Record<string, string> = {
  medico_obstetra: "Médico(a) Obstetra",
  enfermeiro_obstetra: "Enfermeiro(a) Obstetra",
  "": "Nenhuma",
};

const brStates = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  cpf: string;
  birthDate: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
  photoUrl: string;
  specialty: ProfessionalSpecialty;
}

const emptyForm: UserFormData = {
  name: "", email: "", phone: "", password: "123456", cpf: "", birthDate: "",
  gender: "", address: "", city: "", state: "", zipCode: "", notes: "", photoUrl: "", specialty: "",
};

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

interface UsersTabProps {
  users: MockUser[];
  currentUserId: string;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUser: (userId: string, data: Partial<Omit<MockUser, "id" | "role">>) => void;
  deleteUser: (userId: string) => void;
  addUser: (data: any) => MockUser;
}

export const UsersTab = ({ users, currentUserId, updateUserRole, updateUser, deleteUser, addUser }: UsersTabProps) => {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState<MockUser | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [formRole, setFormRole] = useState<UserRole>("cliente");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const [newForm, setNewForm] = useState<UserFormData>(emptyForm);
  const [newFormRole, setNewFormRole] = useState<UserRole>("cliente");

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filterRole !== "all") result = result.filter((u) => u.role === filterRole);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((u) =>
        u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.phone.includes(s) || (u.cpf || "").includes(s)
      );
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
    setForm({
      name: u.name, email: u.email, phone: u.phone, password: u.password,
      cpf: u.cpf || "", birthDate: u.birthDate || "", gender: u.gender || "",
      address: u.address || "", city: u.city || "", state: u.state || "",
      zipCode: u.zipCode || "", notes: u.notes || "", photoUrl: u.photoUrl || "",
      specialty: u.specialty || "",
    });
    setFormRole(u.role);
    setDialogOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isCreate: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (isCreate) setNewForm((p) => ({ ...p, photoUrl: url }));
      else setForm((p) => ({ ...p, photoUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editingUser) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    updateUser(editingUser.id, {
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      password: form.password, cpf: form.cpf, birthDate: form.birthDate,
      gender: (form.gender as MockUser["gender"]) || "", address: form.address,
      city: form.city, state: form.state, zipCode: form.zipCode, notes: form.notes,
      photoUrl: form.photoUrl, specialty: form.specialty,
    });
    if (formRole !== editingUser.role) updateUserRole(editingUser.id, formRole);
    toast({ title: "Usuário atualizado!" });
    setDialogOpen(false);
  };

  const handleCreate = () => {
    if (!newForm.name.trim() || !newForm.email.trim()) {
      toast({ title: "Preencha nome e e-mail", variant: "destructive" });
      return;
    }
    const created = addUser({
      name: newForm.name.trim(), email: newForm.email.trim(), phone: newForm.phone.trim(),
      password: newForm.password, role: newFormRole, cpf: newForm.cpf, birthDate: newForm.birthDate,
      gender: newForm.gender, address: newForm.address, city: newForm.city, state: newForm.state,
      zipCode: newForm.zipCode, notes: newForm.notes, photoUrl: newForm.photoUrl,
      specialty: newForm.specialty,
    });
    toast({ title: "Usuário criado!", description: `${created.name} cadastrado como ${roleMeta[newFormRole].label}.` });
    setCreateDialogOpen(false);
    setNewForm(emptyForm);
    setNewFormRole("cliente");
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : (parts[0]?.[0] || "?").toUpperCase();
  };

  const renderPhotoSection = (photoUrl: string, isCreate: boolean) => (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
        {photoUrl ? (
          <img src={photoUrl} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-heading font-bold text-muted-foreground">?</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={isCreate ? createFileInputRef : fileInputRef}
        onChange={(e) => handlePhotoUpload(e, isCreate)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => (isCreate ? createFileInputRef : fileInputRef).current?.click()}
      >
        {photoUrl ? "Trocar foto" : "Adicionar foto"}
      </Button>
      {photoUrl && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => isCreate ? setNewForm((p) => ({ ...p, photoUrl: "" })) : setForm((p) => ({ ...p, photoUrl: "" }))}
        >
          Remover foto
        </Button>
      )}
    </div>
  );

  const renderFormFields = (data: UserFormData, setData: React.Dispatch<React.SetStateAction<UserFormData>>, role: UserRole, setRole: (r: UserRole) => void, isCreate: boolean) => (
    <Tabs defaultValue="pessoal" className="w-full">
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="pessoal" className="text-xs">Dados Pessoais</TabsTrigger>
        <TabsTrigger value="endereco" className="text-xs">Endereço</TabsTrigger>
        <TabsTrigger value="acesso" className="text-xs">Acesso</TabsTrigger>
      </TabsList>

      <TabsContent value="pessoal" className="space-y-4">
        {renderPhotoSection(data.photoUrl, isCreate)}
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="font-heading text-xs">CPF</Label>
            <Input
              value={data.cpf}
              onChange={(e) => setData((p) => ({ ...p, cpf: formatCPF(e.target.value) }))}
              className="rounded-xl"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Nome completo *</Label>
            <Input value={data.name} onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">E-mail *</Label>
            <Input value={data.email} onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))} className="rounded-xl" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Telefone</Label>
            <Input
              value={data.phone}
              onChange={(e) => setData((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
              className="rounded-xl"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Data de Nascimento</Label>
            <Input
              type="date"
              value={data.birthDate}
              onChange={(e) => setData((p) => ({ ...p, birthDate: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Sexo</Label>
            <Select value={data.gender || "none"} onValueChange={(v) => setData((p) => ({ ...p, gender: v === "none" ? "" : v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informado</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="font-heading text-xs">Observações</Label>
          <Textarea
            value={data.notes}
            onChange={(e) => setData((p) => ({ ...p, notes: e.target.value }))}
            className="rounded-xl resize-none"
            rows={3}
            placeholder="Informações adicionais..."
          />
        </div>
      </TabsContent>

      <TabsContent value="endereco" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">CEP</Label>
            <Input
              value={data.zipCode}
              onChange={(e) => setData((p) => ({ ...p, zipCode: formatCEP(e.target.value) }))}
              className="rounded-xl"
              placeholder="00000-000"
              maxLength={9}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Estado</Label>
            <Select value={data.state || "none"} onValueChange={(v) => setData((p) => ({ ...p, state: v === "none" ? "" : v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione</SelectItem>
                {brStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Cidade</Label>
            <Input value={data.city} onChange={(e) => setData((p) => ({ ...p, city: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="font-heading text-xs">Endereço</Label>
            <Input value={data.address} onChange={(e) => setData((p) => ({ ...p, address: e.target.value }))} className="rounded-xl" placeholder="Rua, número, complemento" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="acesso" className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Senha</Label>
            <Input value={data.password} onChange={(e) => setData((p) => ({ ...p, password: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Tipo de Usuário</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Gestante</SelectItem>
                <SelectItem value="afiliada">Profissional</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(role === "admin" || role === "afiliada") && (
          <div className="space-y-1.5">
            <Label className="font-heading text-xs">Especialidade</Label>
            <Select value={data.specialty || "none"} onValueChange={(v) => setData((p) => ({ ...p, specialty: (v === "none" ? "" : v) as ProfessionalSpecialty }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="medico_obstetra">Médico(a) Obstetra</SelectItem>
                <SelectItem value="enfermeiro_obstetra">Enfermeiro(a) Obstetra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Buscar por nome, e-mail, telefone ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:min-w-[200px] sm:max-w-sm sm:flex-1 rounded-xl"
        />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full rounded-xl sm:w-[180px]">
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
            setNewForm(emptyForm);
            setNewFormRole("cliente");
            setCreateDialogOpen(true);
          }}
          className="w-full sm:ml-auto sm:w-auto"
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
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-muted">
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-heading font-bold text-xs text-muted-foreground">{getInitials(u.name)}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-heading font-bold text-sm text-foreground truncate">{u.name}</span>
                          <Badge variant="outline" className="text-[10px] font-heading border-border text-muted-foreground">
                            {meta.label}
                          </Badge>
                          {u.specialty && (
                            <Badge variant="outline" className="text-[10px] font-heading border-border text-muted-foreground">
                              {specialtyMeta[u.specialty]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="truncate">{u.email}</span>
                          {u.phone && <span className="hidden sm:inline">{u.phone}</span>}
                          {u.cpf && <span className="hidden md:inline">{u.cpf}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
                      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground min-w-[120px] justify-end">
                        <span className="font-mono">{pwVisible ? u.password : "••••••"}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[11px]"
                          onClick={() => setShowPassword((p) => ({ ...p, [u.id]: !p[u.id] }))}
                        >
                          {pwVisible ? "Ocultar" : "Ver"}
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => { setViewUser(u); setViewOpen(true); }}>
                          Detalhes
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(u)}>
                          Editar
                        </Button>
                        {u.id !== currentUserId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { deleteUser(u.id); toast({ title: "Usuário removido" }); }}
                          >
                            Excluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ===== VIEW DIALOG ===== */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {viewUser.photoUrl ? (
                    <img src={viewUser.photoUrl} alt={viewUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-heading font-bold text-muted-foreground">{getInitials(viewUser.name)}</span>
                  )}
                </div>
                <div>
                  <p className="font-heading font-bold text-foreground">{viewUser.name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{roleMeta[viewUser.role].label}</Badge>
                    {viewUser.specialty && <Badge variant="outline" className="text-[10px]">{specialtyMeta[viewUser.specialty]}</Badge>}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">E-mail</p><p className="text-foreground">{viewUser.email}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Telefone</p><p className="text-foreground">{viewUser.phone || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">CPF</p><p className="text-foreground">{viewUser.cpf || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Data de Nascimento</p><p className="text-foreground">{viewUser.birthDate ? new Date(viewUser.birthDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Sexo</p><p className="text-foreground capitalize">{viewUser.gender || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Cadastro</p><p className="text-foreground">{viewUser.createdAt ? new Date(viewUser.createdAt + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p></div>
              </div>
              {(viewUser.address || viewUser.city || viewUser.state) && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Endereço</p>
                    <p className="text-foreground">
                      {[viewUser.address, viewUser.city, viewUser.state, viewUser.zipCode].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </>
              )}
              {viewUser.notes && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Observações</p>
                    <p className="text-foreground whitespace-pre-wrap">{viewUser.notes}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setViewOpen(false); openEdit(viewUser); }}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingUser ? `Editar — ${editingUser.name}` : "Editar Usuário"}
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 mt-2">
              {renderFormFields(form, setForm, formRole, setFormRole, false)}
              <Separator />
              <Button variant="secondary" onClick={handleSave} className="w-full font-heading">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE DIALOG ===== */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {renderFormFields(newForm, setNewForm, newFormRole, setNewFormRole, true)}
            <Separator />
            <Button variant="secondary" onClick={handleCreate} className="w-full font-heading">
              Criar Usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
