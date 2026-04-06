import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrbitalClouds from "@/components/OrbitalClouds";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Upload, Video, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useServices, pages, type ServiceCard } from "@/contexts/ServicesContext";
import { useEffect } from "react";

const emptyForm: Omit<ServiceCard, "id"> = {
  title: "", description: "", benefits: [], price: 0, duration: "", page: "", category: "", videoUrl: "", images: [],
};

const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminServicos = () => {
  const { user } = useAuth();
  const { services, addService, updateService, deleteService, getCategoriesForPage, customCategories, setCustomCategories } = useServices();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin" && user.role !== "super_admin") navigate("/dashboard");
  }, [user, navigate]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ServiceCard, "id">>(emptyForm);
  const [filterPage, setFilterPage] = useState<string>("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newBenefit, setNewBenefit] = useState("");

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return null;

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: ServiceCard) => {
    setEditingId(s.id);
    setForm({ title: s.title, description: s.description, benefits: s.benefits || [], price: s.price, duration: s.duration, page: s.page || "", category: s.category || "", videoUrl: s.videoUrl || "", images: s.images || [] });
    setDialogOpen(true);
  };
  const handleSave = () => {
    if (!form.title || !form.description || !form.price || !form.duration || !form.page) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" }); return;
    }
    if (editingId) {
      updateService(editingId, form);
      toast({ title: "Serviço atualizado!" });
    } else {
      addService(form);
      toast({ title: "Serviço criado!" });
    }
    setDialogOpen(false);
  };
  const handleDeleteService = (id: string) => { deleteService(id); toast({ title: "Serviço removido" }); };

  const handleVideoUpload = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "video/mp4,video/quicktime,video/webm";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: "Tamanho máximo: 50MB", variant: "destructive" }); return; }
      setForm((prev) => ({ ...prev, videoUrl: URL.createObjectURL(file) }));
      toast({ title: "Vídeo carregado!", description: file.name });
    };
    input.click();
  };
  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/jpeg,image/png,image/webp"; input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        if (file.size > 10 * 1024 * 1024) { toast({ title: "Imagem muito grande", description: `${file.name} excede 10MB`, variant: "destructive" }); return; }
        newImages.push(URL.createObjectURL(file));
      });
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
      toast({ title: `${newImages.length} imagem(ns) adicionada(s)!` });
    };
    input.click();
  };
  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const filtered = filterPage === "all" ? services : services.filter((s) => s.page === filterPage);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(40,35%,93%)] via-[hsl(38,30%,90%)] to-[hsl(35,25%,85%)]" />
      <OrbitalClouds />
      <div className="relative z-10 bg-card/60 backdrop-blur-xl border-b border-white/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/admin"><Button size="icon" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="font-heading font-bold text-lg text-foreground">Serviços</h1>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-heading font-medium text-muted-foreground">Página:</span>
            <button onClick={() => setFilterPage("all")} className={`text-sm px-3 py-1.5 rounded-full font-heading transition-all ${filterPage === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Todas ({services.length})</button>
            {pages.map((pg) => (
              <button key={pg.value} onClick={() => setFilterPage(pg.value)} className={`text-sm px-3 py-1.5 rounded-full font-heading transition-all ${filterPage === pg.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{pg.label} ({services.filter((s) => s.page === pg.value).length})</button>
            ))}
          </div>
          <Button onClick={openNew} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full px-5 shadow-md shadow-secondary/20"><Plus className="h-4 w-4 mr-1.5" /> Novo Serviço</Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((service) => (
            <Card key={service.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-foreground text-sm truncate">{service.title}</h3>
                    <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider">{pages.find(p => p.value === service.page)?.label || "Sem página"}</span>
                    {service.category && <span className="text-[10px] text-primary/70 font-heading block">• {service.category}</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(service)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDeleteService(service.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-heading font-bold text-foreground">{formatPrice(service.price)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">• {service.duration}</span>
                  </div>
                  {service.videoUrl && <div className="flex items-center gap-1 text-primary text-[10px] font-heading"><Video className="h-3 w-3" /> Vídeo</div>}
                  {service.images.length > 0 && <div className="flex items-center gap-1 text-primary text-[10px] font-heading"><ImagePlus className="h-3 w-3" /> {service.images.length} foto(s)</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="font-heading">Título *</Label>
              <Input placeholder="Nome do serviço" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Descrição *</Label>
              <Textarea placeholder="Descreva o serviço/produto..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Benefícios</Label>
              {(form.benefits || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(form.benefits || []).map((b, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-xs text-foreground font-heading">
                      {b}
                      <button type="button" onClick={() => setForm({ ...form, benefits: (form.benefits || []).filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Digite um benefício e adicione" value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newBenefit.trim()) { e.preventDefault(); setForm({ ...form, benefits: [...(form.benefits || []), newBenefit.trim()] }); setNewBenefit(""); } }} className="rounded-xl flex-1" />
                <Button type="button" size="sm" onClick={() => { if (newBenefit.trim()) { setForm({ ...form, benefits: [...(form.benefits || []), newBenefit.trim()] }); setNewBenefit(""); } }} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl"><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading">Preço (R$) *</Label>
                <Input type="number" placeholder="0.00" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading">Duração *</Label>
                <Input placeholder="Ex: 60 min" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Página *</Label>
              <Select value={form.page} onValueChange={(v) => setForm({ ...form, page: v, category: "" })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a página" /></SelectTrigger>
                <SelectContent>{pages.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {form.page && (
              <div className="space-y-2">
                <Label className="font-heading">Categoria</Label>
                {!showNewCategoryInput ? (
                  <div className="space-y-2">
                    <Select value={form.category || ""} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                      <SelectContent>{getCategoriesForPage(form.page).map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCategoryInput(true)} className="text-xs text-foreground hover:text-foreground border-border hover:bg-muted px-3"><Plus className="h-3 w-3 mr-1" /> Criar nova categoria</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Nome da nova categoria" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="rounded-xl flex-1" autoFocus />
                    <Button type="button" size="sm" onClick={() => { if (newCategoryName.trim()) { setCustomCategories((prev) => ({ ...prev, [form.page]: [...(prev[form.page] || []), newCategoryName.trim()] })); setForm({ ...form, category: newCategoryName.trim() }); setNewCategoryName(""); setShowNewCategoryInput(false); toast({ title: "Categoria criada!", description: newCategoryName.trim() }); } }} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl"><Save className="h-3.5 w-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(""); }} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <Label className="font-heading flex items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /> Fotos do procedimento</Label>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" onClick={handleImageUpload} className="w-full rounded-xl border-dashed border-2 py-4 hover:border-primary/40 hover:bg-primary/5"><ImagePlus className="h-4 w-4 mr-2" /> Adicionar fotos</Button>
              <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP. Máx: 10MB por imagem</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="font-heading flex items-center gap-2"><Video className="h-4 w-4 text-primary" /> Vídeo do procedimento</Label>
              {form.videoUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-border bg-black">
                    <video src={form.videoUrl} controls className="w-full max-h-48 object-contain" />
                    <button onClick={() => setForm({ ...form, videoUrl: "" })} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={handleVideoUpload} className="w-full rounded-xl border-dashed border-2 py-4 hover:border-primary/40 hover:bg-primary/5"><Upload className="h-4 w-4 mr-2" /> Enviar vídeo</Button>
              )}
              <p className="text-[10px] text-muted-foreground">MP4, MOV, WebM. Máx: 50MB</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20"><Save className="h-4 w-4 mr-1.5" /> {editingId ? "Salvar" : "Criar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServicos;
