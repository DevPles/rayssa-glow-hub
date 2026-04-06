import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinicalRecords, createEmptyRecord, emptyVitalSigns, type ClinicalRecord, type ProcedureRecord, type FollowUp, type VitalSigns } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type View = "list" | "form" | "detail";

const handleFileUpload = (accept: string, onFiles: (urls: string[]) => void) => {
  const input = document.createElement("input");
  input.type = "file"; input.accept = accept; input.multiple = true;
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    const urls: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: `${file.name} excede 10MB`, variant: "destructive" }); return; }
      urls.push(URL.createObjectURL(file));
    });
    onFiles(urls);
  };
  input.click();
};

const PhotoGrid = ({ photos, onRemove, label, onPhotoClick }: { photos: string[]; onRemove?: (i: number) => void; label: string; onPhotoClick?: (photos: string[], index: number) => void }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-heading">{label}</Label>
    {photos.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {photos.map((img, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group cursor-pointer" onClick={() => onPhotoClick?.(photos, i)}>
            <img src={img} alt="" className="w-full h-full object-cover" />
            {onRemove && (
              <button onClick={(e) => { e.stopPropagation(); onRemove(i); }} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">×</button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const VitalSignsForm = ({ vitals, onChange }: { vitals: VitalSigns; onChange: (field: string, value: string) => void }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className="space-y-1.5"><Label className="text-xs font-heading">Peso</Label><Input value={vitals.weight} onChange={(e) => onChange("weight", e.target.value)} className="rounded-xl" placeholder="kg" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Altura</Label><Input value={vitals.height} onChange={(e) => onChange("height", e.target.value)} className="rounded-xl" placeholder="m" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">IMC</Label><Input value={vitals.bmi} onChange={(e) => onChange("bmi", e.target.value)} className="rounded-xl" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Pressão Arterial</Label><Input value={vitals.bloodPressure} onChange={(e) => onChange("bloodPressure", e.target.value)} className="rounded-xl" placeholder="mmHg" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Freq. Cardíaca</Label><Input value={vitals.heartRate} onChange={(e) => onChange("heartRate", e.target.value)} className="rounded-xl" placeholder="bpm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Temperatura</Label><Input value={vitals.temperature} onChange={(e) => onChange("temperature", e.target.value)} className="rounded-xl" placeholder="°C" /></div>
    </div>
    <Separator />
    <p className="text-xs font-heading font-semibold text-foreground">Medidas Corporais Detalhadas</p>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="space-y-1.5"><Label className="text-xs font-heading">Busto</Label><Input value={vitals.bust} onChange={(e) => onChange("bust", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Cintura</Label><Input value={vitals.waist} onChange={(e) => onChange("waist", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Abdômen</Label><Input value={vitals.abdomen} onChange={(e) => onChange("abdomen", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Quadril</Label><Input value={vitals.hips} onChange={(e) => onChange("hips", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Postura</Label><Input value={vitals.posture} onChange={(e) => onChange("posture", e.target.value)} className="rounded-xl" /></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className="space-y-1.5"><Label className="text-xs font-heading">Braço Esq.</Label><Input value={vitals.leftArm} onChange={(e) => onChange("leftArm", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Braço Dir.</Label><Input value={vitals.rightArm} onChange={(e) => onChange("rightArm", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Coxa Esq.</Label><Input value={vitals.leftThigh} onChange={(e) => onChange("leftThigh", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Coxa Dir.</Label><Input value={vitals.rightThigh} onChange={(e) => onChange("rightThigh", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Panturrilha Esq.</Label><Input value={vitals.leftCalf} onChange={(e) => onChange("leftCalf", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
      <div className="space-y-1.5"><Label className="text-xs font-heading">Panturrilha Dir.</Label><Input value={vitals.rightCalf} onChange={(e) => onChange("rightCalf", e.target.value)} className="rounded-xl" placeholder="cm" /></div>
    </div>
  </div>
);

const VitalSignsDisplay = ({ vitals, label }: { vitals: VitalSigns; label?: string }) => {
  const mainItems = [
    { label: "Peso", value: vitals.weight }, { label: "Altura", value: vitals.height },
    { label: "IMC", value: vitals.bmi }, { label: "PA", value: vitals.bloodPressure },
    { label: "FC", value: vitals.heartRate }, { label: "Temp", value: vitals.temperature },
  ].filter(v => v.value);
  const bodyItems = [
    { label: "Busto", value: vitals.bust }, { label: "Cintura", value: vitals.waist },
    { label: "Abdômen", value: vitals.abdomen }, { label: "Quadril", value: vitals.hips },
    { label: "Braço E", value: vitals.leftArm }, { label: "Braço D", value: vitals.rightArm },
    { label: "Coxa E", value: vitals.leftThigh }, { label: "Coxa D", value: vitals.rightThigh },
    { label: "Pant. E", value: vitals.leftCalf }, { label: "Pant. D", value: vitals.rightCalf },
    { label: "Postura", value: vitals.posture },
  ].filter(v => v.value);
  if (mainItems.length === 0 && bodyItems.length === 0) return null;
  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-muted-foreground font-heading font-medium">{label}</p>}
      {mainItems.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
          {mainItems.map((item) => (
             <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-lg p-2 text-center">
              <p className="text-[11px] text-muted-foreground font-heading">{item.label}</p>
              <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}
      {bodyItems.length > 0 && (
        <>
          <p className="text-[11px] text-muted-foreground font-heading font-medium">Medidas Corporais</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
            {bodyItems.map((item) => (
              <div key={item.label} className="bg-white/30 backdrop-blur-lg rounded-lg p-2 text-center">
                <p className="text-[11px] text-muted-foreground font-heading">{item.label}</p>
                <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const RegistroClinicoTab = () => {
  const { users } = useAuth();
  const { records, addRecord, updateRecord, deleteRecord, addProcedure, addFollowUp } = useClinicalRecords();
  const patients = users.filter((u) => u.role === "cliente");

  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);
  const [formData, setFormData] = useState<Omit<ClinicalRecord, "id"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identification: true, motives: false, health: false, aesthetic: false, vitals: false, obstetric: false,
  });

  const [procDialogOpen, setProcDialogOpen] = useState(false);
  const [procForm, setProcForm] = useState<Omit<ProcedureRecord, "id">>({
    date: new Date().toISOString().split("T")[0], protocolName: "", parameters: "", intraObservations: "",
    postObservations: "", homeInstructions: "", professional: "", results: "", photosBefore: [], photosAfter: [],
    popFile: "", vitalSigns: { ...emptyVitalSigns },
  });

  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState<Omit<FollowUp, "id">>({
    date: new Date().toISOString().split("T")[0], notes: "", nextVisit: "",
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxCompare, setLightboxCompare] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxCompare([]);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openLightboxCompare = (before: string[], after: string[], index: number) => {
    setLightboxPhotos(before);
    setLightboxCompare(after);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const toggleSection = (key: string) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredRecords = records.filter((r) => {
    const matchSearch = r.patientName.toLowerCase().includes(search.toLowerCase()) || r.prontuarioNumber.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || r.recordType === filterType;
    return matchSearch && matchType;
  });

  const getNextRecordNumber = () => {
    const nums = records.map((r) => {
      const match = r.prontuarioNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return Math.max(0, ...nums) + 1;
  };

  const openNewRecord = () => {
    setFormData(createEmptyRecord("", "", getNextRecordNumber()));
    setEditingId(null);
    setExpandedSections({ identification: true, motives: false, health: false, aesthetic: false, vitals: false, obstetric: false });
    setView("form");
  };

  const openEditRecord = (record: ClinicalRecord) => {
    const { id, ...rest } = record;
    setFormData(rest);
    setEditingId(id);
    setView("form");
  };

  const handleSave = () => {
    if (!formData || !formData.fullName) {
      toast({ title: "Preencha o nome completo da paciente", variant: "destructive" });
      return;
    }
    if (!formData.patientId) {
      formData.patientId = `new-${Date.now()}`;
      formData.patientName = formData.fullName;
    }
    if (editingId) {
      updateRecord(editingId, formData);
      toast({ title: "Registro atualizado!" });
    } else {
      addRecord(formData);
      toast({ title: "Registro clínico criado!" });
    }
    setView("list");
  };

  const handleDelete = (id: string) => { deleteRecord(id); toast({ title: "Registro removido" }); };

  const handleAddProcedure = () => {
    if (!selectedRecord || !procForm.protocolName) return;
    addProcedure(selectedRecord.id, procForm);
    const newProc = { ...procForm, id: `p${Date.now()}` };
    setSelectedRecord((prev) => prev ? { ...prev, procedures: [...prev.procedures, newProc] } : prev);
    setProcDialogOpen(false);
    setProcForm({ date: new Date().toISOString().split("T")[0], protocolName: "", parameters: "", intraObservations: "", postObservations: "", homeInstructions: "", professional: "", results: "", photosBefore: [], photosAfter: [], popFile: "", vitalSigns: { ...emptyVitalSigns } });
    toast({ title: "Procedimento registrado!" });
  };

  const handleAddFollowUp = () => {
    if (!selectedRecord || !followUpForm.notes) return;
    addFollowUp(selectedRecord.id, followUpForm);
    setSelectedRecord((prev) => prev ? { ...prev, followUps: [...prev.followUps, { ...followUpForm, id: `f${Date.now()}` }] } : prev);
    setFollowUpDialogOpen(false);
    setFollowUpForm({ date: new Date().toISOString().split("T")[0], notes: "", nextVisit: "" });
    toast({ title: "Follow-up registrado!" });
  };

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const updateNestedForm = (parent: string, field: string, value: any) => {
    setFormData((prev) => prev ? { ...prev, [parent]: { ...(prev as any)[parent], [field]: value } } : prev);
  };

  const SectionHeader = ({ title, sectionKey }: { title: string; sectionKey: string }) => (
    <button onClick={() => toggleSection(sectionKey)} className="flex items-center justify-between w-full py-3 text-left">
      <span className="font-heading font-semibold text-sm text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{expandedSections[sectionKey] ? "▲" : "▼"}</span>
    </button>
  );

  const maxPhotos = Math.max(lightboxPhotos.length, lightboxCompare.length);
  const isCompare = lightboxCompare.length > 0;

  const lightboxDialog = (
    <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
      <DialogContent className={`bg-black/95 border-none p-4 ${isCompare ? "sm:max-w-5xl" : "sm:max-w-3xl"}`}>
        <DialogHeader className="sr-only"><DialogTitle>Visualizar Foto</DialogTitle></DialogHeader>
        {lightboxPhotos.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            {isCompare ? (
              <div className="flex gap-4 w-full">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-white/60 text-xs font-heading uppercase tracking-wider">Antes</span>
                  {lightboxPhotos[lightboxIndex] ? (
                    <img src={lightboxPhotos[lightboxIndex]} alt="Antes" className="max-h-[65vh] max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex items-center justify-center h-40 text-white/30 text-xs">Sem foto</div>
                  )}
                </div>
                <div className="w-px bg-white/20" />
                <div className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-white/60 text-xs font-heading uppercase tracking-wider">Depois</span>
                  {lightboxCompare[lightboxIndex] ? (
                    <img src={lightboxCompare[lightboxIndex]} alt="Depois" className="max-h-[65vh] max-w-full object-contain rounded-lg" />
                  ) : (
                    <div className="flex items-center justify-center h-40 text-white/30 text-xs">Sem foto</div>
                  )}
                </div>
              </div>
            ) : (
              <img src={lightboxPhotos[lightboxIndex]} alt="" className="max-h-[75vh] max-w-full object-contain rounded-lg" />
            )}
            {(isCompare ? maxPhotos : lightboxPhotos.length) > 1 && (
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 font-heading" onClick={() => setLightboxIndex((prev) => (prev - 1 + maxPhotos) % maxPhotos)}>
                  ← Anterior
                </Button>
                <span className="text-white text-xs font-heading">{lightboxIndex + 1} / {maxPhotos}</span>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 font-heading" onClick={() => setLightboxIndex((prev) => (prev + 1) % maxPhotos)}>
                  Próxima →
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // ===== LIST VIEW =====
  if (view === "list") {
    return (
      <>{lightboxDialog}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <Input placeholder="Buscar por nome ou registro..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl max-w-sm" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="estetica">Estética</SelectItem>
                <SelectItem value="maternidade">Maternidade</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openNewRecord} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
            Nova Ficha
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: records.length, label: "Total de Fichas" },
            { value: records.filter((r) => r.status === "ativo").length, label: "Ativas" },
            { value: records.filter((r) => r.recordType === "estetica" || r.recordType === "ambos").length, label: "Estética" },
            { value: records.filter((r) => r.recordType === "maternidade" || r.recordType === "ambos").length, label: "Maternidade" },
          ].map((s) => (
            <Card key={s.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-heading">Nenhum registro encontrado</p>
            </CardContent></Card>
          ) : filteredRecords.map((record) => (
            <Card key={record.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {record.patientPhoto ? (
                      <img src={record.patientPhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                        <span className="text-xs text-muted-foreground font-heading">{record.patientName.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-foreground text-sm">{record.patientName}</h3>
                      <Badge variant="outline" className="text-[10px] font-heading">
                        {record.recordType === "estetica" ? "Estética" : record.recordType === "maternidade" ? "Maternidade" : "Ambos"}
                      </Badge>
                      <Badge variant={record.status === "ativo" ? "default" : "secondary"} className="text-[10px] font-heading">
                        {record.status === "ativo" ? "Ativo" : "Arquivado"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Registro: {record.prontuarioNumber}</p>
                    <p className="text-xs text-muted-foreground">{record.procedures.length} procedimento(s) • {record.followUps.length} follow-up(s)</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Atualizado: {format(new Date(record.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => { setSelectedRecord(record); setView("detail"); }}>Ver</Button>
                    <Button size="sm" variant="ghost" className="text-xs font-heading" onClick={() => openEditRecord(record)}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-xs font-heading hover:text-destructive" onClick={() => handleDelete(record.id)}>Excluir</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </>
    );
  }

  // ===== FORM VIEW =====
  if (view === "form" && formData) {
    return (
      <>{lightboxDialog}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button onClick={() => setView("list")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">← Voltar</Button>
          <h2 className="font-heading font-bold text-foreground">{editingId ? "Editar Registro Clínico Digital" : "Novo Registro Clínico Digital"}</h2>
          <Button onClick={handleSave} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
            Salvar
          </Button>
        </div>

        {/* Identification + Record Type merged */}
         <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
          <SectionHeader title="Identificação e Dados Gerais" sectionKey="identification" />
          {expandedSections.identification && (
            <div className="space-y-3 pt-2">
              {/* Patient Photo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {formData.patientPhoto ? (
                    <img src={formData.patientPhoto} alt="Foto da paciente" className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                      <span className="text-xs text-muted-foreground font-heading">Foto</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Button type="button" size="sm" variant="outline" className="rounded-xl text-xs font-heading" onClick={() => handleFileUpload("image/*", (urls) => { if (urls[0]) updateForm("patientPhoto", urls[0]); })}>
                    {formData.patientPhoto ? "Trocar Foto" : "Adicionar Foto"}
                  </Button>
                  {formData.patientPhoto && (
                    <Button type="button" size="sm" variant="ghost" className="rounded-xl text-xs font-heading text-destructive" onClick={() => updateForm("patientPhoto", "")}>
                      Remover
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="space-y-1 col-span-2"><Label className="text-xs font-heading">Nome Completo *</Label><Input value={formData.fullName} onChange={(e) => { updateForm("fullName", e.target.value); updateForm("patientName", e.target.value); }} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Nº Registro Clínico</Label><Input value={formData.prontuarioNumber} readOnly className="rounded-xl bg-muted" /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Tipo de Registro</Label>
                  <Select value={formData.recordType} onValueChange={(v: any) => updateForm("recordType", v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estetica">Estética</SelectItem>
                      <SelectItem value="maternidade">Maternidade</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs font-heading">Nascimento</Label><Input type="date" value={formData.birthDate} onChange={(e) => updateForm("birthDate", e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Telefone</Label><Input value={formData.phone} onChange={(e) => updateForm("phone", e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Estado Civil</Label><Input value={formData.maritalStatus} onChange={(e) => updateForm("maritalStatus", e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Profissão</Label><Input value={formData.profession} onChange={(e) => updateForm("profession", e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-1 col-span-2 md:col-span-4"><Label className="text-xs font-heading">Endereço</Label><Input value={formData.address} onChange={(e) => updateForm("address", e.target.value)} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Contato de Emergência</Label><Input value={formData.emergencyContact} onChange={(e) => updateForm("emergencyContact", e.target.value)} className="rounded-xl" /></div>
                <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                  <Checkbox checked={formData.consentSigned} onCheckedChange={(v) => updateForm("consentSigned", !!v)} />
                  <Label className="text-xs font-heading font-semibold text-foreground">Termo de consentimento assinado</Label>
                  <Button type="button" size="sm" className="rounded-xl text-xs font-heading ml-auto bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handleFileUpload("image/*,.pdf", (urls) => { if (urls[0]) updateForm("consentFile", urls[0]); })}>
                    Enviar termo
                  </Button>
                  {formData.consentFile && (
                    <a href={formData.consentFile} download="termo-consentimento" target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" className="rounded-xl text-xs font-heading bg-secondary text-secondary-foreground hover:bg-secondary/90">Baixar</Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent></Card>

        {/* Motives + Health merged into 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
            <SectionHeader title="Motivos e Expectativas" sectionKey="motives" />
            {expandedSections.motives && (
              <div className="space-y-2.5 pt-1">
                <div className="space-y-1"><Label className="text-xs font-heading">Motivo da Consulta</Label><Textarea value={formData.consultationReason} onChange={(e) => updateForm("consultationReason", e.target.value)} className="rounded-xl min-h-[50px]" placeholder="O que trouxe a paciente à clínica..." /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Expectativas</Label><Textarea value={formData.expectations} onChange={(e) => updateForm("expectations", e.target.value)} className="rounded-xl min-h-[50px]" placeholder="O que espera alcançar..." /></div>
              </div>
            )}
          </CardContent></Card>

           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
            <SectionHeader title="Histórico de Saúde e Hábitos" sectionKey="health" />
            {expandedSections.health && (
              <div className="space-y-2.5 pt-1">
                <div className="space-y-1"><Label className="text-xs font-heading">Doenças Pré-existentes</Label><Textarea value={formData.preExistingConditions} onChange={(e) => updateForm("preExistingConditions", e.target.value)} className="rounded-xl min-h-[40px]" placeholder="Hipertensão, diabetes..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs font-heading">Medicamentos</Label><Input value={formData.medications} onChange={(e) => updateForm("medications", e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">Alergias</Label><Input value={formData.allergies} onChange={(e) => updateForm("allergies", e.target.value)} className="rounded-xl" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs font-heading">Hábitos</Label><Textarea value={formData.habits} onChange={(e) => updateForm("habits", e.target.value)} className="rounded-xl min-h-[40px]" /></div>
                <div className="space-y-1"><Label className="text-xs font-heading">Procedimentos Anteriores</Label><Textarea value={formData.previousProcedures} onChange={(e) => updateForm("previousProcedures", e.target.value)} className="rounded-xl min-h-[40px]" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs font-heading">Hist. Obstétrico</Label><Input value={formData.obstetricHistory} onChange={(e) => updateForm("obstetricHistory", e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">Última Menstruação</Label><Input type="date" value={formData.lastMenstruation} onChange={(e) => updateForm("lastMenstruation", e.target.value)} className="rounded-xl" /></div>
                </div>
              </div>
            )}
          </CardContent></Card>
        </div>

        {/* Aesthetic Evaluation */}
         <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
          <SectionHeader title="Avaliação Estética" sectionKey="aesthetic" />
          {expandedSections.aesthetic && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="space-y-1"><Label className="text-xs font-heading">Tipo de Pele</Label><Input value={formData.aestheticEval.skinType} onChange={(e) => updateNestedForm("aestheticEval", "skinType", e.target.value)} className="rounded-xl" placeholder="Oleosa, seca, mista..." /></div>
                <div className="space-y-1 col-span-1 md:col-span-3"><Label className="text-xs font-heading">Condições Cutâneas</Label><Input value={formData.aestheticEval.conditions} onChange={(e) => updateNestedForm("aestheticEval", "conditions", e.target.value)} className="rounded-xl" /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: "spots", label: "Manchas" }, { key: "wrinkles", label: "Rugas" },
                  { key: "scars", label: "Cicatrizes" }, { key: "stretchMarks", label: "Estrias" },
                  { key: "lesions", label: "Lesões" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <Checkbox checked={(formData.aestheticEval as any)[key]} onCheckedChange={(v) => updateNestedForm("aestheticEval", key, !!v)} />
                    <Label className="text-xs font-heading">{label}</Label>
                  </div>
                ))}
              </div>
              <div className="space-y-1"><Label className="text-xs font-heading">Observações</Label><Textarea value={formData.aestheticEval.observations} onChange={(e) => updateNestedForm("aestheticEval", "observations", e.target.value)} className="rounded-xl min-h-[40px]" /></div>

              <Separator />
              <p className="text-xs font-heading font-semibold text-foreground">Registro Fotográfico</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <PhotoGrid photos={formData.aestheticEval.photosBefore} label="Fotos ANTES" onRemove={(i) => updateNestedForm("aestheticEval", "photosBefore", formData.aestheticEval.photosBefore.filter((_, idx) => idx !== i))} onPhotoClick={openLightbox} />
                  <Button type="button" variant="outline" onClick={() => handleFileUpload("image/*", (urls) => updateNestedForm("aestheticEval", "photosBefore", [...formData.aestheticEval.photosBefore, ...urls]))} className="w-full rounded-xl border-dashed border-2 py-2 hover:border-primary/40 hover:bg-primary/5 text-xs">
                    Adicionar fotos ANTES
                  </Button>
                </div>
                <div className="space-y-2">
                  <PhotoGrid photos={formData.aestheticEval.photosAfter} label="Fotos DEPOIS" onRemove={(i) => updateNestedForm("aestheticEval", "photosAfter", formData.aestheticEval.photosAfter.filter((_, idx) => idx !== i))} onPhotoClick={openLightbox} />
                  <Button type="button" variant="outline" onClick={() => handleFileUpload("image/*", (urls) => updateNestedForm("aestheticEval", "photosAfter", [...formData.aestheticEval.photosAfter, ...urls]))} className="w-full rounded-xl border-dashed border-2 py-2 hover:border-primary/40 hover:bg-primary/5 text-xs">
                    Adicionar fotos DEPOIS
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent></Card>

        {/* Vital Signs */}
         <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
          <SectionHeader title="Exame Físico e Antropometria (Inicial)" sectionKey="vitals" />
          {expandedSections.vitals && (
            <div className="pt-1">
              <VitalSignsForm vitals={formData.vitalSigns} onChange={(field, value) => updateNestedForm("vitalSigns", field, value)} />
            </div>
          )}
        </CardContent></Card>

        {/* Obstetric */}
        {(formData.recordType === "maternidade" || formData.recordType === "ambos") && (
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
            <SectionHeader title="Avaliação Obstétrica e Materna" sectionKey="obstetric" />
            {expandedSections.obstetric && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="space-y-1"><Label className="text-xs font-heading">Idade Gestacional</Label><Input value={formData.obstetricEval.gestationalAge} onChange={(e) => updateNestedForm("obstetricEval", "gestationalAge", e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">Tipo de Gestação</Label><Input value={formData.obstetricEval.pregnancyType} onChange={(e) => updateNestedForm("obstetricEval", "pregnancyType", e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">FC Fetal</Label><Input value={formData.obstetricEval.fetalHeartRate} onChange={(e) => updateNestedForm("obstetricEval", "fetalHeartRate", e.target.value)} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">Estado Emocional</Label><Input value={formData.obstetricEval.emotionalState} onChange={(e) => updateNestedForm("obstetricEval", "emotionalState", e.target.value)} className="rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-1"><Label className="text-xs font-heading">Exames Pré-natais</Label><Textarea value={formData.obstetricEval.prenatalExams} onChange={(e) => updateNestedForm("obstetricEval", "prenatalExams", e.target.value)} className="rounded-xl min-h-[40px]" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">Sintomas e Queixas</Label><Textarea value={formData.obstetricEval.symptoms} onChange={(e) => updateNestedForm("obstetricEval", "symptoms", e.target.value)} className="rounded-xl min-h-[40px]" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">Plano de Parto</Label><Textarea value={formData.obstetricEval.birthPlan} onChange={(e) => updateNestedForm("obstetricEval", "birthPlan", e.target.value)} className="rounded-xl min-h-[40px]" /></div>
                  <div className="space-y-1"><Label className="text-xs font-heading">Condições de Risco</Label><Textarea value={formData.obstetricEval.riskConditions} onChange={(e) => updateNestedForm("obstetricEval", "riskConditions", e.target.value)} className="rounded-xl min-h-[40px]" /></div>
                </div>
              </div>
            )}
          </CardContent></Card>
        )}

        <div className="flex gap-3 pb-6">
          <Button variant="outline" onClick={() => setView("list")} className="flex-1 rounded-full font-heading">Cancelar</Button>
          <Button onClick={handleSave} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
            {editingId ? "Salvar Alterações" : "Criar Registro"}
          </Button>
        </div>
      </div>
      </>
    );
  }

  // ===== DETAIL VIEW =====
  if (view === "detail" && selectedRecord) {
    const r = selectedRecord;
    return (
      <>{lightboxDialog}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => setView("list")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">← Voltar</Button>
          <Button variant="outline" onClick={() => openEditRecord(r)} className="rounded-full font-heading text-sm">Editar</Button>
        </div>

        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 bg-gradient-to-r from-secondary/10 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {r.patientPhoto ? (
                  <img src={r.patientPhoto} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border shrink-0">
                    <span className="text-lg text-muted-foreground font-heading font-bold">{r.fullName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h2 className="font-heading font-bold text-xl text-foreground">{r.fullName}</h2>
                  <p className="text-sm text-muted-foreground">Registro Clínico: {r.prontuarioNumber}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="font-heading text-xs">
                      {r.recordType === "estetica" ? "Estética" : r.recordType === "maternidade" ? "Maternidade" : "Ambos"}
                    </Badge>
                    <Badge variant={r.status === "ativo" ? "default" : "secondary"} className="font-heading text-xs">{r.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Criado: {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                <p>Atualizado: {format(new Date(r.updatedAt), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Nascimento", value: r.birthDate ? format(new Date(r.birthDate), "dd/MM/yyyy") : "—" },
            { label: "Telefone", value: r.phone || "—" },
            { label: "Estado Civil", value: r.maritalStatus || "—" },
            { label: "Profissão", value: r.profession || "—" },
          ].map((item) => (
            <Card key={item.label} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-3">
              <p className="text-muted-foreground text-xs font-heading">{item.label}</p>
              <p className="text-sm text-foreground font-heading font-medium">{item.value}</p>
            </CardContent></Card>
          ))}
        </div>

        {r.consultationReason && (
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
            <h3 className="font-heading font-semibold text-base mb-2">Motivo e Expectativas</h3>
            <p className="text-sm text-foreground mb-1"><span className="text-muted-foreground">Motivo:</span> {r.consultationReason}</p>
            {r.expectations && <p className="text-sm text-foreground"><span className="text-muted-foreground">Expectativas:</span> {r.expectations}</p>}
          </CardContent></Card>
        )}

        {/* Aesthetic Photos */}
        {(r.aestheticEval.photosBefore.length > 0 || r.aestheticEval.photosAfter.length > 0) && (
           <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
            <h3 className="font-heading font-semibold text-base mb-3">Registro Fotográfico</h3>
            <div className="grid grid-cols-2 gap-4">
              {r.aestheticEval.photosBefore.length > 0 && <PhotoGrid photos={r.aestheticEval.photosBefore} label="Antes" onPhotoClick={(_, i) => openLightboxCompare(r.aestheticEval.photosBefore, r.aestheticEval.photosAfter, i)} />}
              {r.aestheticEval.photosAfter.length > 0 && <PhotoGrid photos={r.aestheticEval.photosAfter} label="Depois" onPhotoClick={(_, i) => openLightboxCompare(r.aestheticEval.photosBefore, r.aestheticEval.photosAfter, i)} />}
            </div>
          </CardContent></Card>
        )}

        {/* Initial Vital Signs */}
        {r.vitalSigns.weight && (
          <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5"><CardContent className="p-4">
            <h3 className="font-heading font-semibold text-base mb-3">Sinais Vitais (Inicial)</h3>
            <VitalSignsDisplay vitals={r.vitalSigns} />
          </CardContent></Card>
        )}

        {/* Procedures */}
         <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading">Procedimentos ({r.procedures.length})</CardTitle>
              <Button size="sm" onClick={() => setProcDialogOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">
                Novo Procedimento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {r.procedures.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum procedimento registrado</p>
            ) : r.procedures.map((proc) => (
              <div key={proc.id} className="border border-white/40 bg-white/20 backdrop-blur-lg rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-heading font-semibold text-sm text-foreground">{proc.protocolName}</h4>
                  <span className="text-xs text-muted-foreground">{format(new Date(proc.date), "dd/MM/yyyy")}</span>
                </div>
                {proc.parameters && <p className="text-xs text-muted-foreground"><span className="font-medium">Parâmetros:</span> {proc.parameters}</p>}
                {proc.results && <p className="text-xs text-foreground"><span className="text-muted-foreground">Resultado:</span> {proc.results}</p>}
                {proc.homeInstructions && <p className="text-xs text-primary"><span className="text-muted-foreground">Orientações:</span> {proc.homeInstructions}</p>}
                {proc.professional && <p className="text-xs text-muted-foreground">Profissional: {proc.professional}</p>}

                {/* Vital signs for this procedure */}
                <VitalSignsDisplay vitals={proc.vitalSigns} label="Sinais vitais neste procedimento" />

                {/* Photos for this procedure */}
                {(proc.photosBefore.length > 0 || proc.photosAfter.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {proc.photosBefore.length > 0 && <PhotoGrid photos={proc.photosBefore} label="Antes" onPhotoClick={(_, i) => openLightboxCompare(proc.photosBefore, proc.photosAfter, i)} />}
                    {proc.photosAfter.length > 0 && <PhotoGrid photos={proc.photosAfter} label="Depois" onPhotoClick={(_, i) => openLightboxCompare(proc.photosBefore, proc.photosAfter, i)} />}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading">Follow-ups ({r.followUps.length})</CardTitle>
              <Button size="sm" onClick={() => setFollowUpDialogOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading text-sm">
                Novo Follow-up
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {r.followUps.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum follow-up registrado</p>
            ) : r.followUps.map((fu) => (
              <div key={fu.id} className="border border-white/40 bg-white/20 backdrop-blur-lg rounded-xl p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-muted-foreground">{format(new Date(fu.date), "dd/MM/yyyy")}</span>
                  {fu.nextVisit && <span className="text-xs text-primary font-heading">Próxima: {format(new Date(fu.nextVisit), "dd/MM/yyyy")}</span>}
                </div>
                <p className="text-sm text-foreground">{fu.notes}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Add Procedure Dialog */}
        <Dialog open={procDialogOpen} onOpenChange={setProcDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">Registrar Procedimento</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5"><Label className="text-xs font-heading">Protocolo / Procedimento *</Label><Input value={procForm.protocolName} onChange={(e) => setProcForm({ ...procForm, protocolName: e.target.value })} className="rounded-xl" placeholder="Ex: Limpeza de pele, Peeling..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Data</Label><Input type="date" value={procForm.date} onChange={(e) => setProcForm({ ...procForm, date: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Profissional</Label><Input value={procForm.professional} onChange={(e) => setProcForm({ ...procForm, professional: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Parâmetros</Label><Input value={procForm.parameters} onChange={(e) => setProcForm({ ...procForm, parameters: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Observações Intra-procedimento</Label><Textarea value={procForm.intraObservations} onChange={(e) => setProcForm({ ...procForm, intraObservations: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Observações Pós-procedimento</Label><Textarea value={procForm.postObservations} onChange={(e) => setProcForm({ ...procForm, postObservations: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Orientações Domiciliares</Label><Textarea value={procForm.homeInstructions} onChange={(e) => setProcForm({ ...procForm, homeInstructions: e.target.value })} className="rounded-xl min-h-[50px]" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Resultados</Label><Input value={procForm.results} onChange={(e) => setProcForm({ ...procForm, results: e.target.value })} className="rounded-xl" /></div>

              <Separator />
              <p className="text-xs font-heading font-semibold text-foreground">POP - Procedimento Operacional Padrão</p>
              <div className="flex items-center gap-3">
                <Button type="button" size="sm" className="rounded-xl text-xs font-heading bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handleFileUpload(".pdf,.doc,.docx,image/*", (urls) => { if (urls[0]) setProcForm((prev) => ({ ...prev, popFile: urls[0] })); })}>
                  Anexar POP
                </Button>
                {procForm.popFile && (
                  <>
                    <span className="text-xs text-muted-foreground">Documento anexado</span>
                    <a href={procForm.popFile} download="POP-procedimento" target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" className="rounded-xl text-xs font-heading bg-secondary text-secondary-foreground hover:bg-secondary/90">Baixar POP</Button>
                    </a>
                    <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => setProcForm((prev) => ({ ...prev, popFile: "" }))}>Remover</Button>
                  </>
                )}
              </div>

              <Separator />
              <p className="text-xs font-heading font-semibold text-foreground">Sinais Vitais neste Procedimento</p>
              <VitalSignsForm vitals={procForm.vitalSigns} onChange={(field, value) => setProcForm((prev) => ({ ...prev, vitalSigns: { ...prev.vitalSigns, [field]: value } }))} />

              <Separator />
              <p className="text-xs font-heading font-semibold text-foreground">Fotos do Procedimento</p>

              <PhotoGrid photos={procForm.photosBefore} label="Fotos ANTES" onRemove={(i) => setProcForm((prev) => ({ ...prev, photosBefore: prev.photosBefore.filter((_, idx) => idx !== i) }))} onPhotoClick={openLightbox} />
              <Button type="button" variant="outline" onClick={() => handleFileUpload("image/*", (urls) => setProcForm((prev) => ({ ...prev, photosBefore: [...prev.photosBefore, ...urls] })))} className="w-full rounded-xl border-dashed border-2 py-3 text-xs">
                Adicionar fotos ANTES
              </Button>

              <PhotoGrid photos={procForm.photosAfter} label="Fotos DEPOIS" onRemove={(i) => setProcForm((prev) => ({ ...prev, photosAfter: prev.photosAfter.filter((_, idx) => idx !== i) }))} onPhotoClick={openLightbox} />
              <Button type="button" variant="outline" onClick={() => handleFileUpload("image/*", (urls) => setProcForm((prev) => ({ ...prev, photosAfter: [...prev.photosAfter, ...urls] })))} className="w-full rounded-xl border-dashed border-2 py-3 text-xs">
                Adicionar fotos DEPOIS
              </Button>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setProcDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
                <Button onClick={handleAddProcedure} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Follow-up Dialog */}
        <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Registrar Follow-up</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-heading">Data</Label><Input type="date" value={followUpForm.date} onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-heading">Próxima Visita</Label><Input type="date" value={followUpForm.nextVisit} onChange={(e) => setFollowUpForm({ ...followUpForm, nextVisit: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-heading">Notas e Observações *</Label><Textarea value={followUpForm.notes} onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })} className="rounded-xl min-h-[80px]" placeholder="Evolução, resultados observados..." /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
                <Button onClick={handleAddFollowUp} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading">Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </>
    );
  }

  return null;
};

export default RegistroClinicoTab;
