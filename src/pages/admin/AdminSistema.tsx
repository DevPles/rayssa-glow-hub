import { useState, useRef, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { useSystemSettings, type Tenant, type Plan, type PageConfig } from "@/contexts/SystemSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TenantBillingSection } from "@/components/admin/TenantBillingSection";
import { ConsolidatedBillingView } from "@/components/admin/ConsolidatedBillingView";

const AdminSistema = () => {
  const { user, users, addUser, updateUser, deleteUser } = useAuth();
  const {
    settings, tenants, plans, activeTenantId, logoSrc,
    setActiveTenantId, updateSettings, uploadLogo, uploadHeroPhoto,
    uploadPagePhoto, updatePageConfig, updateSectionVisibility,
    addPlan, updatePlan, deletePlan,
    addTenant, updateTenant, deleteTenant,
  } = useSystemSettings();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = user?.role === "super_admin";
  const [view, setView] = useState<"tenants" | "plans" | "faturamento">(isSuperAdmin ? "tenants" : "tenants");
  const [searchTerm, setSearchTerm] = useState("");

  // ---- Tenant dialog state ----
  const [tenantDialog, setTenantDialog] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [tf, setTf] = useState({ name: "", email: "", phone: "", plan: "", adminName: "", adminPassword: "123456", pixKey: "", bankName: "", bankAgency: "", bankAccount: "", holderName: "", holderDocument: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [tenantTab, setTenantTab] = useState("dados");

  // Branding fields
  const [brandCompanyName, setBrandCompanyName] = useState("");
  const [brandShortName, setBrandShortName] = useState("");
  const [brandSubtitle, setBrandSubtitle] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [brandHeroPhotoUrl, setBrandHeroPhotoUrl] = useState<string | null>(null);
  const [brandHeroCardName, setBrandHeroCardName] = useState("Rayssa Leslie");
  const [brandHeroCardSubtitle, setBrandHeroCardSubtitle] = useState("Esteticista & Enfermeira Obstetra");
  const [brandHeroDescription, setBrandHeroDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingPage, setUploadingPage] = useState<string | null>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const pageFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ---- Plan dialog state ----
  const [planDialog, setPlanDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [pf, setPf] = useState({ name: "", price: "", description: "", features: "", active: true });

  const getAdminForTenant = (tenantId: string) => users.find((u) => u.role === "admin" && u.tenantId === tenantId);
  const getPlanForTenant = (planId: string) => plans.find((p) => p.id === planId);

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---- Tenant handlers ----
  const openNewTenant = () => {
    setEditTenant(null);
    setTf({ name: "", email: "", phone: "", plan: plans[0]?.id || "", adminName: "", adminPassword: "123456", pixKey: "", bankName: "", bankAgency: "", bankAccount: "", holderName: "", holderDocument: "" });
    setBrandCompanyName("");
    setBrandShortName("");
    setBrandSubtitle("Estética & Saúde");
    setBrandLogoUrl(null);
    setBrandHeroPhotoUrl(null);
    setBrandHeroCardName("Rayssa Leslie");
    setBrandHeroCardSubtitle("Esteticista & Enfermeira Obstetra");
    setBrandHeroDescription("");
    setTenantTab("dados");
    setShowPassword(false);
    setTenantDialog(true);
  };

  const openEditTenant = async (t: Tenant) => {
    const adminUser = getAdminForTenant(t.id);
    setEditTenant(t);
    setTf({
      name: t.name, email: t.ownerEmail, phone: adminUser?.phone || "", plan: t.plan,
      adminName: adminUser?.name || t.name, adminPassword: adminUser?.password || "123456",
      pixKey: t.pixKey, bankName: t.bankName, bankAgency: t.bankAgency,
      bankAccount: t.bankAccount, holderName: t.holderName, holderDocument: t.holderDocument,
    });
    setActiveTenantId(t.id);
    setTimeout(() => {
      setBrandCompanyName(settings.companyName);
      setBrandShortName(settings.companyShortName);
      setBrandSubtitle(settings.companySubtitle);
      setBrandLogoUrl(settings.logoUrl);
      setBrandHeroPhotoUrl(settings.heroPhotoUrl);
      setBrandHeroCardName(settings.heroCardName);
      setBrandHeroCardSubtitle(settings.heroCardSubtitle);
      setBrandHeroDescription(settings.heroDescription || "");
    }, 300);
    setTenantTab("dados");
    setShowPassword(false);
    setTenantDialog(true);
  };

  // Sync branding when settings change while dialog is open
  const [lastBrandSync, setLastBrandSync] = useState("");
  if (tenantDialog && editTenant && settings.tenantId === editTenant.id && settings.id && settings.id !== lastBrandSync) {
    setBrandCompanyName(settings.companyName);
    setBrandShortName(settings.companyShortName);
    setBrandSubtitle(settings.companySubtitle);
    setBrandLogoUrl(settings.logoUrl);
    setBrandHeroPhotoUrl(settings.heroPhotoUrl);
    setBrandHeroCardName(settings.heroCardName);
    setBrandHeroCardSubtitle(settings.heroCardSubtitle);
    setBrandHeroDescription(settings.heroDescription || "");
    setLastBrandSync(settings.id);
  }

  const handleSaveTenant = async () => {
    if (!tf.name.trim() || !tf.email.trim()) return;
    const bankData = { pixKey: tf.pixKey, bankName: tf.bankName, bankAgency: tf.bankAgency, bankAccount: tf.bankAccount, holderName: tf.holderName, holderDocument: tf.holderDocument };
    if (editTenant) {
      await updateTenant(editTenant.id, { name: tf.name, ownerEmail: tf.email, plan: tf.plan, ...bankData });
      if (settings.tenantId === editTenant.id) {
        await updateSettings({ companyName: brandCompanyName, companyShortName: brandShortName, companySubtitle: brandSubtitle, heroCardName: brandHeroCardName, heroCardSubtitle: brandHeroCardSubtitle, heroDescription: brandHeroDescription });
      }
      const adminUser = getAdminForTenant(editTenant.id);
      if (adminUser) updateUser(adminUser.id, { name: tf.adminName || tf.name, email: tf.email, phone: tf.phone, password: tf.adminPassword });
      toast({ title: "Cliente atualizado." });
    } else {
      const newTenant = await addTenant({ name: tf.name, ownerEmail: tf.email, plan: tf.plan, ...bankData });
      setActiveTenantId(newTenant.id);
      setTimeout(async () => {
        await updateSettings({ companyName: brandCompanyName || tf.name, companyShortName: brandShortName || tf.name.split(" ")[0], companySubtitle: brandSubtitle || "Estética & Saúde" });
      }, 500);
      addUser({ name: tf.adminName || tf.name, email: tf.email, phone: tf.phone, password: tf.adminPassword || "123456", role: "admin", tenantId: newTenant.id });
      toast({ title: "Cliente cadastrado!", description: `Admin: ${tf.email}` });
    }
    setTenantDialog(false);
  };

  const handleDeleteTenant = async (id: string) => {
    const adminUser = getAdminForTenant(id);
    if (adminUser) deleteUser(adminUser.id);
    await deleteTenant(id);
    setTenantDialog(false);
    toast({ title: "Cliente removido." });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setBrandLogoUrl(url);
      toast({ title: "Logo atualizada!" });
    } catch { toast({ title: "Erro ao enviar logo.", variant: "destructive" }); }
    setUploading(false);
  };

  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const url = await uploadHeroPhoto(file);
      setBrandHeroPhotoUrl(url);
      toast({ title: "Foto da página inicial atualizada!" });
    } catch { toast({ title: "Erro ao enviar foto.", variant: "destructive" }); }
    setUploadingHero(false);
  };

  // ---- Plan handlers ----
  const openNewPlan = () => {
    setEditPlan(null);
    setPf({ name: "", price: "", description: "", features: "", active: true });
    setPlanDialog(true);
  };

  const openEditPlan = (p: Plan) => {
    setEditPlan(p);
    setPf({ name: p.name, price: p.priceMonthly.toFixed(2), description: p.description, features: p.features.join("\n"), active: p.active });
    setPlanDialog(true);
  };

  const handleSavePlan = async () => {
    if (!pf.name.trim() || !pf.price.trim()) return;
    const features = pf.features.split("\n").map(f => f.trim()).filter(Boolean);
    if (editPlan) {
      await updatePlan(editPlan.id, { name: pf.name, priceMonthly: parseFloat(pf.price), description: pf.description, features, active: pf.active });
      toast({ title: "Plano atualizado." });
    } else {
      await addPlan({ name: pf.name, priceMonthly: parseFloat(pf.price), description: pf.description, features, active: pf.active });
      toast({ title: "Plano criado!" });
    }
    setPlanDialog(false);
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <AdminLayout title="ADM Sistema">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with stats */}
        {isSuperAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{tenants.length}</p>
                <p className="text-xs text-muted-foreground">Clientes</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{tenants.filter(t => t.active).length}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{plans.length}</p>
                <p className="text-xs text-muted-foreground">Planos</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(tenants.reduce((sum, t) => {
                    const plan = getPlanForTenant(t.plan);
                    return sum + (t.active && plan ? plan.priceMonthly : 0);
                  }, 0))}
                </p>
                <p className="text-xs text-muted-foreground">Receita/mês</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        {isSuperAdmin && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant={view === "tenants" ? "default" : "secondary"} onClick={() => setView("tenants")} className="rounded-xl">
              Clientes
            </Button>
            <Button variant={view === "plans" ? "default" : "secondary"} onClick={() => setView("plans")} className="rounded-xl">
              Planos
            </Button>
            <Button variant={view === "faturamento" ? "default" : "secondary"} onClick={() => setView("faturamento")} className="rounded-xl">
              Faturamento
            </Button>
          </div>
        )}

        {/* ===== TENANTS VIEW ===== */}
        {view === "tenants" && isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="rounded-xl"
                />
              </div>
              <Button onClick={openNewTenant} className="rounded-xl">
                Novo Cliente
              </Button>
            </div>

            {filteredTenants.length === 0 && (
              <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-3xl shadow-lg">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">{searchTerm ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}</p>
                </CardContent>
              </Card>
            )}

            {/* Client table */}
            {filteredTenants.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-xl border-border/30 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs">Cliente</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">Plano</th>
                        <th className="text-left p-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Admin</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-center p-3 font-medium text-muted-foreground text-xs hidden sm:table-cell">PIX</th>
                        <th className="text-right p-3 font-medium text-muted-foreground text-xs">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map((t) => {
                        const plan = getPlanForTenant(t.plan);
                        const adminUser = getAdminForTenant(t.id);
                        return (
                          <tr key={t.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => openEditTenant(t)}>
                            <td className="p-3">
                              <p className="font-medium text-foreground">{t.name}</p>
                              <p className="text-xs text-muted-foreground">{t.ownerEmail}</p>
                            </td>
                            <td className="p-3 hidden sm:table-cell">
                              <Badge className="bg-secondary/15 text-secondary text-[10px] border-0">{plan?.name || "—"}</Badge>
                              {plan && <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(plan.priceMonthly)}/mês</p>}
                            </td>
                            <td className="p-3 hidden md:table-cell">
                              <p className="text-xs text-foreground">{adminUser?.name || "—"}</p>
                            </td>
                            <td className="p-3 text-center">
                              <Badge className={`text-[10px] border-0 ${t.active ? "bg-green-100 text-green-700" : "bg-destructive/15 text-destructive"}`}>
                                {t.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </td>
                            <td className="p-3 text-center hidden sm:table-cell">
                              {t.pixKey ? <span className="text-xs text-green-600">Sim</span> : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); openEditTenant(t); }}>
                                  Editar
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={async (e) => {
                                  e.stopPropagation();
                                  await updateTenant(t.id, { active: !t.active });
                                  toast({ title: t.active ? "Cliente desativado" : "Cliente ativado" });
                                }}>
                                  {t.active ? "Desativar" : "Ativar"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ===== TENANT DIALOG ===== */}
            <Dialog open={tenantDialog} onOpenChange={setTenantDialog}>
              <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg">
                    {editTenant ? `Gerenciar — ${editTenant.name}` : "Novo Cliente"}
                  </DialogTitle>
                </DialogHeader>

                <Tabs value={tenantTab} onValueChange={setTenantTab} className="w-full">
                  <TabsList className="w-full grid grid-cols-4 rounded-xl">
                    <TabsTrigger value="dados" className="rounded-lg text-xs">
                      Dados & Contrato
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="rounded-lg text-xs">
                      Personalização
                    </TabsTrigger>
                    <TabsTrigger value="paginas" className="rounded-lg text-xs">
                      Páginas & Seções
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" className="rounded-lg text-xs">
                      Financeiro
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB: Dados & Contrato */}
                  <TabsContent value="dados" className="space-y-5 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Empresa</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nome da Empresa</Label>
                          <Input value={tf.name} onChange={(e) => setTf(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Studio Beleza Maria" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Plano Contratado</Label>
                          <Select value={tf.plan} onValueChange={(v) => setTf(p => ({ ...p, plan: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                            <SelectContent>
                              {plans.filter(p => p.active).map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.priceMonthly)}/mês</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Credenciais do Administrador</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nome do Administrador</Label>
                          <Input value={tf.adminName} onChange={(e) => setTf(p => ({ ...p, adminName: e.target.value }))} placeholder="Ex: Maria da Silva" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">E-mail de Acesso</Label>
                          <Input value={tf.email} onChange={(e) => setTf(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" type="email" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Telefone</Label>
                          <Input value={tf.phone} onChange={(e) => setTf(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-0000" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Senha de Acesso</Label>
                          <div className="relative">
                            <Input value={tf.adminPassword} onChange={(e) => setTf(p => ({ ...p, adminPassword: e.target.value }))} type={showPassword ? "text" : "password"} />
                            <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB: Personalização */}
                  <TabsContent value="branding" className="space-y-5 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Identidade Visual</p>
                      <p className="text-[11px] text-muted-foreground mb-3">Logo e foto exibidas no site, relatórios e PDFs.</p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Logo upload */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden bg-background/30">
                            {brandLogoUrl ? <img src={brandLogoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-xs text-muted-foreground">Logo</span>}
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || !editTenant} className="rounded-xl w-full">
                            {uploading ? "Enviando..." : "Enviar Logo"}
                          </Button>
                          {!editTenant && <p className="text-[10px] text-muted-foreground text-center">Salve primeiro</p>}
                          <p className="text-[10px] text-muted-foreground text-center">PNG transparente, 200x200px</p>
                        </div>

                        {/* Hero photo upload */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden bg-background/30">
                            {brandHeroPhotoUrl ? <img src={brandHeroPhotoUrl} alt="Foto Hero" className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground text-center">Foto</span>}
                          </div>
                          <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={handleHeroPhotoUpload} />
                          <Button variant="secondary" size="sm" onClick={() => heroFileRef.current?.click()} disabled={uploadingHero || !editTenant} className="rounded-xl w-full">
                            {uploadingHero ? "Enviando..." : "Enviar Foto"}
                          </Button>
                          {!editTenant && <p className="text-[10px] text-muted-foreground text-center">Salve primeiro</p>}
                          <p className="text-[10px] text-muted-foreground text-center">JPG/PNG retrato, 400x500px</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nome no Card</Label>
                          <Input value={brandHeroCardName} onChange={(e) => setBrandHeroCardName(e.target.value)} placeholder="Rayssa Leslie" />
                          <p className="text-[10px] text-muted-foreground">Nome exibido no card da página inicial.</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Subtítulo no Card</Label>
                          <Input value={brandHeroCardSubtitle} onChange={(e) => setBrandHeroCardSubtitle(e.target.value)} placeholder="Esteticista & Enfermeira Obstetra" />
                          <p className="text-[10px] text-muted-foreground">Subtítulo abaixo do nome no card.</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Descrição da Página Inicial</Label>
                        <Textarea value={brandHeroDescription} onChange={(e) => setBrandHeroDescription(e.target.value)} placeholder="Texto descritivo exibido na seção principal do site..." rows={3} />
                        <p className="text-[10px] text-muted-foreground">Texto exibido abaixo do título na página inicial.</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs">Nome Completo da Empresa</Label>
                        <Input value={brandCompanyName} onChange={(e) => setBrandCompanyName(e.target.value)} placeholder="Rayssa Leslie Estética & Saúde da Mulher" />
                        <p className="text-[10px] text-muted-foreground">Usado em relatórios, PDFs e documentos oficiais.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nome Curto (Cabeçalho)</Label>
                        <Input value={brandShortName} onChange={(e) => setBrandShortName(e.target.value)} placeholder="Rayssa Leslie" />
                        <p className="text-[10px] text-muted-foreground">Exibido no cabeçalho e menu do sistema.</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Subtítulo</Label>
                        <Input value={brandSubtitle} onChange={(e) => setBrandSubtitle(e.target.value)} placeholder="Estética & Saúde da Mulher" />
                        <p className="text-[10px] text-muted-foreground">Exibido abaixo do nome curto.</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB: Páginas & Seções */}
                  <TabsContent value="paginas" className="space-y-5 mt-4">
                    {/* Section visibility */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Seções da Landing Page</p>
                      <p className="text-[11px] text-muted-foreground mb-3">Controle quais seções aparecem na página inicial.</p>
                      <div className="space-y-3">
                        {[
                          { key: "services", label: "Serviços" },
                          { key: "testimonials", label: "Depoimentos" },
                          { key: "blog", label: "Blog" },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/20">
                            <span className="text-sm text-foreground">{label}</span>
                            <Switch
                              checked={settings.sectionVisibility?.[key as keyof typeof settings.sectionVisibility] ?? true}
                              onCheckedChange={(v) => updateSectionVisibility({ [key]: v })}
                              disabled={!editTenant}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Page configs */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Páginas de Catálogo</p>
                      <p className="text-[11px] text-muted-foreground mb-3">Personalize título, descrição, foto e dados do expert de cada página.</p>
                      <div className="space-y-4">
                        {[
                          { key: "estetica-avancada", label: "Estética Avançada" },
                          { key: "nucleo-materno", label: "Núcleo Materno" },
                          { key: "produtos-programas", label: "Produtos & Programas" },
                          { key: "parceria-rosangela", label: "Parceria Rosângela" },
                        ].map(({ key, label }) => {
                          const cfg = settings.pageConfigs?.[key] || { photoUrl: null, expertName: "", expertSubtitle: "", pageTitle: label, pageDescription: "" };
                          return (
                            <div key={key} className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-3">
                              <p className="text-xs font-semibold text-foreground">{label}</p>
                              <div className="grid grid-cols-[80px_1fr] gap-3 items-start">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-16 h-20 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden bg-background/30">
                                    {cfg.photoUrl ? <img src={cfg.photoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] text-muted-foreground">Foto</span>}
                                  </div>
                                  <input ref={el => { pageFileRefs.current[key] = el; }} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingPage(key);
                                    try { await uploadPagePhoto(key, file); toast({ title: "Foto atualizada!" }); } catch { toast({ title: "Erro ao enviar.", variant: "destructive" }); }
                                    setUploadingPage(null);
                                  }} />
                                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => pageFileRefs.current[key]?.click()} disabled={uploadingPage === key || !editTenant}>
                                    {uploadingPage === key ? "..." : "Trocar"}
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Título da Página</Label>
                                      <Input className="h-8 text-xs" value={cfg.pageTitle} onChange={(e) => updatePageConfig(key, { pageTitle: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Nome do Expert</Label>
                                      <Input className="h-8 text-xs" value={cfg.expertName} onChange={(e) => updatePageConfig(key, { expertName: e.target.value })} />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Subtítulo Expert</Label>
                                      <Input className="h-8 text-xs" value={cfg.expertSubtitle} onChange={(e) => updatePageConfig(key, { expertSubtitle: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[10px]">Descrição</Label>
                                      <Input className="h-8 text-xs" value={cfg.pageDescription} onChange={(e) => updatePageConfig(key, { pageDescription: e.target.value })} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="financeiro" className="space-y-5 mt-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dados Bancários</p>
                      <p className="text-[11px] text-muted-foreground mb-3">Dados para gestão financeira e integração de pagamentos.</p>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs">Chave PIX</Label>
                          <Input value={tf.pixKey} onChange={(e) => setTf(p => ({ ...p, pixKey: e.target.value }))} placeholder="CPF, CNPJ, e-mail ou telefone" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nome do Titular</Label>
                          <Input value={tf.holderName} onChange={(e) => setTf(p => ({ ...p, holderName: e.target.value }))} placeholder="Nome completo" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">CPF/CNPJ do Titular</Label>
                          <Input value={tf.holderDocument} onChange={(e) => setTf(p => ({ ...p, holderDocument: e.target.value }))} placeholder="000.000.000-00" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Banco</Label>
                          <Input value={tf.bankName} onChange={(e) => setTf(p => ({ ...p, bankName: e.target.value }))} placeholder="Ex: Nubank, Itaú" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Agência</Label>
                          <Input value={tf.bankAgency} onChange={(e) => setTf(p => ({ ...p, bankAgency: e.target.value }))} placeholder="0001" />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs">Conta</Label>
                          <Input value={tf.bankAccount} onChange={(e) => setTf(p => ({ ...p, bankAccount: e.target.value }))} placeholder="00000-0" />
                        </div>
                      </div>
                    </div>

                    {editTenant && (
                      <>
                        {/* Resumo do Contrato */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Resumo do Contrato</p>
                          <Card className="bg-muted/30 border-border/20 rounded-xl">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Plano</span>
                                <span className="font-medium text-foreground">{getPlanForTenant(editTenant.plan)?.name || "—"}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Valor mensal</span>
                                <span className="font-medium text-foreground">{formatCurrency(getPlanForTenant(editTenant.plan)?.priceMonthly || 0)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Cliente desde</span>
                                <span className="font-medium text-foreground">{new Date(editTenant.createdAt).toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className={`text-[10px] border-0 ${editTenant.active ? "bg-green-100 text-green-700" : "bg-destructive/15 text-destructive"}`}>
                                  {editTenant.active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Gerar Cobrança MP */}
                        <TenantBillingSection tenantId={editTenant.id} tenantEmail={editTenant.ownerEmail} tenantName={editTenant.name} holderName={tf.holderName} holderDocument={tf.holderDocument} plan={getPlanForTenant(editTenant.plan)} />
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveTenant} className="flex-1 rounded-xl">
                    Salvar
                  </Button>
                  {editTenant && (
                    <Button variant="destructive" className="rounded-xl" onClick={() => handleDeleteTenant(editTenant.id)}>
                      Excluir
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ===== FATURAMENTO VIEW ===== */}
        {view === "faturamento" && isSuperAdmin && (
          <ConsolidatedBillingView />
        )}

        {/* ===== PLANS VIEW ===== */}
        {view === "plans" && isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-lg text-foreground">Gestão de Planos</h2>
                <p className="text-sm text-muted-foreground">Crie e edite os planos oferecidos aos seus clientes</p>
              </div>
              <Button onClick={openNewPlan} className="rounded-xl">Novo Plano</Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p) => {
                const clientsCount = tenants.filter(t => t.plan === p.id).length;
                return (
                  <Card key={p.id} className="bg-card/50 backdrop-blur-xl border-border/30 rounded-3xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer" onClick={() => openEditPlan(p)}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading font-bold text-sm text-foreground">{p.name}</h3>
                          <p className="text-lg font-bold text-secondary">{formatCurrency(p.priceMonthly)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                        </div>
                        <Badge className={`text-[10px] border-0 ${p.active ? "bg-green-100 text-green-700" : "bg-destructive/15 text-destructive"}`}>
                          {p.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      {p.features.length > 0 && (
                        <ul className="space-y-1">
                          {p.features.map((f, i) => <li key={i} className="text-[11px] text-muted-foreground">• {f}</li>)}
                        </ul>
                      )}
                      <p className="text-[10px] text-muted-foreground">{clientsCount} cliente{clientsCount !== 1 ? "s" : ""}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Dialog open={planDialog} onOpenChange={setPlanDialog}>
              <DialogContent className="rounded-3xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading">{editPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome do Plano</Label>
                    <Input value={pf.name} onChange={(e) => setPf(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Premium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor Mensal (R$)</Label>
                    <Input value={pf.price} onChange={(e) => setPf(p => ({ ...p, price: e.target.value }))} placeholder="199.90" type="number" step="0.01" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descrição</Label>
                    <Input value={pf.description} onChange={(e) => setPf(p => ({ ...p, description: e.target.value }))} placeholder="Breve descrição" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Funcionalidades (uma por linha)</Label>
                    <Textarea value={pf.features} onChange={(e) => setPf(p => ({ ...p, features: e.target.value }))} placeholder={"Agenda completa\nClientes ilimitados"} rows={4} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={pf.active} onCheckedChange={(v) => setPf(p => ({ ...p, active: v }))} />
                    <Label className="text-xs">Plano ativo</Label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSavePlan} className="flex-1 rounded-xl">Salvar</Button>
                    {editPlan && (
                      <Button variant="destructive" className="rounded-xl" onClick={async () => { await deletePlan(editPlan.id); setPlanDialog(false); toast({ title: "Plano removido." }); }}>
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSistema;
