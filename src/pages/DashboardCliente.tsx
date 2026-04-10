import { useState, useEffect as useEffectImport } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Eye, User, MessageCircle, FileDown, Video } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "@/assets/logo.png";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { Button } from "@/components/ui/button";
import HeroBookingDialog from "@/components/HeroBookingDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import ProfileDialog from "@/components/dashboard/ProfileDialog";
import SupportChat from "@/components/dashboard/SupportChat";
import OrderTrackingDialog from "@/components/dashboard/OrderTrackingDialog";
import { useClinicalRecords } from "@/contexts/ClinicalRecordContext";
import { usePOPs } from "@/contexts/POPContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getActiveRooms } from "@/hooks/useVideoCall";
import { supabase } from "@/integrations/supabase/client";

const mockPurchases = [
  { id: 1, date: "18/02/2026", service: "Limpeza de Pele Profunda", value: "R$ 189,00", status: "Concluído" },
  { id: 2, date: "05/02/2026", service: "Radiofrequência Facial", value: "R$ 320,00", status: "Concluído" },
  { id: 3, date: "22/01/2026", service: "Drenagem Linfática", value: "R$ 150,00", status: "Concluído" },
  { id: 4, date: "10/01/2026", service: "Kit Skincare Premium", value: "R$ 249,00", status: "Entregue" },
  { id: 5, date: "28/12/2025", service: "Microagulhamento", value: "R$ 450,00", status: "Concluído" },
];

const mockScheduled = [
  { id: 1, date: "25/02/2026", service: "Harmonização Facial", time: "14:00", status: "Confirmado" },
  { id: 2, date: "03/03/2026", service: "Peeling Químico", time: "10:30", status: "Pendente" },
  { id: 3, date: "10/03/2026", service: "Radiofrequência Corporal", time: "16:00", status: "Confirmado" },
];


const DashboardCliente = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { settings, logoSrc: systemLogoSrc } = useSystemSettings();
  const [trackingOrder, setTrackingOrder] = useState<typeof mockPurchases[0] | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const { getRecordsByPatient } = useClinicalRecords();
  const { pops } = usePOPs();
  const myRecords = user ? getRecordsByPatient(user.id) : [];
  const myPOPs = user ? pops.filter(p => p.patientName === user.name) : [];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeRooms, setActiveRooms] = useState<Awaited<ReturnType<typeof getActiveRooms>>>([]);

  // Poll for active video rooms
  useEffectImport(() => {
    const fetchRooms = async () => {
      const rooms = await getActiveRooms();
      setActiveRooms(rooms);
    };
    fetchRooms();

    const channel = supabase
      .channel("dashboard-video-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "video_rooms" }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const exportRecordPDF = async (record: typeof myRecords[0]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // System colors (HSL to RGB)
    const COL = {
      primary: [232, 180, 212] as [number, number, number],      // #E8B4D4 Rosa Suave
      secondary: [139, 107, 158] as [number, number, number],    // #8B6B9E Roxo Profundo
      accent: [244, 166, 193] as [number, number, number],       // #F4A6C1 Rosa Quente
      bg: [245, 245, 245] as [number, number, number],           // #F5F5F5 Fundo
      text: [44, 44, 44] as [number, number, number],            // #2C2C2C Texto
      muted: [140, 140, 140] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      cardBg: [252, 247, 250] as [number, number, number],       // Rosado bem sutil
      border: [232, 180, 212] as [number, number, number],
    };

    const loadImageBase64 = (src: string): Promise<string | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext("2d")?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });

    const logoBase64 = await loadImageBase64(logoImg);

    // ====== HEADER ======
    // Fundo rosa suave no header
    doc.setFillColor(...COL.cardBg);
    doc.rect(0, 0, pageWidth, 44, "F");
    // Linha inferior roxa
    doc.setFillColor(...COL.secondary);
    doc.rect(0, 44, pageWidth, 1.5, "F");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", margin, 8, 26, 26);
    }
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COL.secondary);
    doc.text(settings.companyName, 47, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COL.text);
    doc.text("Ficha Clínica Digital", 47, 24);
    doc.setFontSize(8);
    doc.setTextColor(...COL.muted);
    doc.text(`Registro: ${record.prontuarioNumber}  •  ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 47, 30);
    doc.text(`Registro Gestacional  •  Status: ${record.status === "ativo" ? "Ativo" : "Arquivado"}`, 47, 35);

    // Patient photo on top-right
    if (record.patientPhoto) {
      const photoBase64 = await loadImageBase64(record.patientPhoto);
      if (photoBase64) {
        doc.addImage(photoBase64, "PNG", pageWidth - margin - 22, 9, 22, 22);
      }
    }

    let y = 52;

    const checkPage = (needed = 14) => {
      if (y + needed > 278) { doc.addPage(); y = 16; }
    };

    // Section title — roxo profundo com texto branco
    const addSectionTitle = (title: string) => {
      checkPage(18);
      y += 4;
      doc.setFillColor(...COL.secondary);
      doc.roundedRect(margin, y - 5, contentWidth, 8, 1.5, 1.5, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COL.white);
      doc.text(title.toUpperCase(), margin + 4, y);
      doc.setTextColor(...COL.text);
      y += 7;
    };

    // Grid fields — label on top, value below, inside colored card with border
    const addFieldGrid = (fields: { label: string; value: string }[], cols = 2) => {
      const gap = 2;
      const colWidth = (contentWidth - gap * (cols - 1)) / cols;
      for (let i = 0; i < fields.length; i += cols) {
        const rowFields = fields.slice(i, i + cols);
        // Calculate max height needed for this row
        let maxH = 0;
        const rowData = rowFields.map((f, ci) => {
          const valLines = doc.splitTextToSize(f.value || "—", colWidth - 6);
          const cellH = 6 + valLines.length * 3.8 + 3; // label space + value lines + padding
          maxH = Math.max(maxH, cellH);
          return { ...f, valLines, x: margin + ci * (colWidth + gap) };
        });
        checkPage(maxH + 2);
        // Draw cells
        rowData.forEach((cell) => {
          // Card background
          doc.setFillColor(...COL.cardBg);
          doc.setDrawColor(...COL.border);
          doc.roundedRect(cell.x, y, colWidth, maxH, 1, 1, "FD");
          // Label
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COL.muted);
          doc.text(cell.label.toUpperCase(), cell.x + 3, y + 4);
          // Value
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COL.text);
          doc.text(cell.valLines, cell.x + 3, y + 8.5);
        });
        y += maxH + 2;
      }
    };

    // Single wide field
    const addWideField = (label: string, value: string) => {
      const valLines = doc.splitTextToSize(value || "—", contentWidth - 8);
      const h = 6 + valLines.length * 3.8 + 3;
      checkPage(h + 2);
      doc.setFillColor(...COL.cardBg);
      doc.setDrawColor(...COL.border);
      doc.roundedRect(margin, y, contentWidth, h, 1, 1, "FD");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COL.muted);
      doc.text(label.toUpperCase(), margin + 3, y + 4);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COL.text);
      doc.text(valLines, margin + 3, y + 8.5);
      y += h + 2;
    };

    // ====== DADOS PESSOAIS ======
    addSectionTitle("Dados Pessoais");
    addFieldGrid([
      { label: "Nome Completo", value: record.fullName },
      { label: "Nº Prontuário", value: record.prontuarioNumber },
      { label: "Data de Nascimento", value: record.birthDate ? format(new Date(record.birthDate), "dd/MM/yyyy") : "—" },
      { label: "Telefone", value: record.phone || "—" },
      { label: "Estado Civil", value: record.maritalStatus || "—" },
      { label: "Profissão", value: record.profession || "—" },
    ]);
    addWideField("Endereço", record.address || "—");
    addFieldGrid([
      { label: "Contato de Emergência", value: record.emergencyContact || "—" },
      { label: "Última Menstruação", value: record.lastMenstruation ? format(new Date(record.lastMenstruation), "dd/MM/yyyy") : "—" },
      { label: "Consentimento", value: record.consentSigned ? "✓ Assinado" : "✗ Pendente" },
      { label: "Status", value: record.status === "ativo" ? "Ativo" : "Arquivado" },
    ]);

    // ====== MOTIVO E EXPECTATIVAS ======
    if (record.consultationReason || record.expectations) {
      addSectionTitle("Motivo e Expectativas");
      addWideField("Motivo da Consulta", record.consultationReason);
      addWideField("Expectativas", record.expectations);
    }

    // ====== HISTÓRICO DE SAÚDE ======
    addSectionTitle("Histórico de Saúde");
    addFieldGrid([
      { label: "Doenças Pré-existentes", value: record.preExistingConditions || "Nenhuma" },
      { label: "Medicamentos", value: record.medications || "Nenhum" },
      { label: "Alergias", value: record.allergies || "Nenhuma" },
      { label: "Hábitos", value: record.habits || "—" },
      { label: "Procedimentos Anteriores", value: record.previousProcedures || "Nenhum" },
      { label: "Histórico Obstétrico", value: record.obstetricHistory || "—" },
    ]);

    // ====== CARTÃO GESTACIONAL ======
    if (record.gestationalCard?.dum) {
      addSectionTitle("Cartão da Gestante");
      addFieldGrid([
        { label: "Tipo Sanguíneo", value: `${record.gestationalCard.bloodType} ${record.gestationalCard.rh}` },
        { label: "G/P/A", value: `G${record.gestationalCard.gravida}P${record.gestationalCard.para}A${record.gestationalCard.abortions}` },
        { label: "DUM", value: record.gestationalCard.dum },
        { label: "DPP", value: record.gestationalCard.dpp },
        { label: "Peso Pré-gestacional", value: record.gestationalCard.preGestationalWeight },
        { label: "Hospital", value: record.gestationalCard.hospital },
      ], 3);
    }

    // Placeholder to maintain structure
    if (false) {
      const beforePhotos: string[] = [];
      const afterPhotos: string[] = [];
      if (beforePhotos.length > 0 || afterPhotos.length > 0) {
        const photoSize = 32;
        if (beforePhotos.length > 0) {
          checkPage(photoSize + 12);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COL.secondary);
          doc.text("ANTES", margin, y + 3);
          y += 5;
          for (let i = 0; i < beforePhotos.length; i++) {
            const b64 = await loadImageBase64(beforePhotos[i]);
            if (b64) doc.addImage(b64, "PNG", margin + i * (photoSize + 3), y, photoSize, photoSize);
          }
          y += photoSize + 4;
        }
        if (afterPhotos.length > 0) {
          checkPage(photoSize + 12);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COL.secondary);
          doc.text("DEPOIS", margin, y + 3);
          y += 5;
          for (let i = 0; i < afterPhotos.length; i++) {
            const b64 = await loadImageBase64(afterPhotos[i]);
            if (b64) doc.addImage(b64, "PNG", margin + i * (photoSize + 3), y, photoSize, photoSize);
          }
          y += photoSize + 4;
        }
        doc.setTextColor(...COL.text);
      }
    }

    // ====== SINAIS VITAIS ======
    addSectionTitle("Sinais Vitais e Medidas Corporais");
    const vs = record.vitalSigns;
    addFieldGrid([
      { label: "Peso", value: vs.weight },
      { label: "Altura", value: vs.height },
      { label: "IMC", value: vs.bmi },
      { label: "Pressão Arterial", value: vs.bloodPressure },
      { label: "Freq. Cardíaca", value: vs.heartRate },
      { label: "Temperatura", value: vs.temperature },
    ], 3);
    addFieldGrid([
      { label: "Busto", value: vs.bust },
      { label: "Cintura", value: vs.waist },
      { label: "Abdômen", value: vs.abdomen },
      { label: "Quadril", value: vs.hips },
    ], 4);
    addFieldGrid([
      { label: "Braço Esq.", value: vs.leftArm },
      { label: "Braço Dir.", value: vs.rightArm },
      { label: "Coxa Esq.", value: vs.leftThigh },
      { label: "Coxa Dir.", value: vs.rightThigh },
      { label: "Panturr. Esq.", value: vs.leftCalf },
      { label: "Panturr. Dir.", value: vs.rightCalf },
    ], 3);
    if (vs.posture) addFieldGrid([{ label: "Postura", value: vs.posture }], 1);

    // ====== PROCEDIMENTOS ======
    if (record.procedures.length > 0) {
      addSectionTitle("Procedimentos Realizados");
      for (const proc of record.procedures) {
        checkPage(20);
        // Procedure sub-header — accent color
        doc.setFillColor(...COL.accent);
        doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COL.text);
        doc.text(`${proc.protocolName}  —  ${format(new Date(proc.date), "dd/MM/yyyy")}  —  ${proc.professional}`, margin + 3, y + 4.5);
        y += 10;

        addFieldGrid([
          { label: "Parâmetros", value: proc.parameters },
          { label: "Resultados", value: proc.results },
        ]);
        addFieldGrid([
          { label: "Obs. Durante Procedimento", value: proc.intraObservations },
          { label: "Obs. Pós-Procedimento", value: proc.postObservations },
        ]);
        addWideField("Instruções Domiciliares", proc.homeInstructions);

        // Vital signs inline
        if (proc.vitalSigns.weight || proc.vitalSigns.bloodPressure) {
          checkPage(10);
          doc.setFillColor(...COL.bg);
          doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COL.muted);
          doc.text(
            `Sinais Vitais: ${proc.vitalSigns.weight} | PA ${proc.vitalSigns.bloodPressure} | FC ${proc.vitalSigns.heartRate} | ${proc.vitalSigns.temperature}`,
            margin + 3, y + 4
          );
          doc.setTextColor(...COL.text);
          y += 9;
        }

        // Photos
        const pBefore = proc.photosBefore || [];
        const pAfter = proc.photosAfter || [];
        if (pBefore.length > 0 || pAfter.length > 0) {
          const ps = 28;
          if (pBefore.length > 0) {
            checkPage(ps + 10);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COL.secondary);
            doc.text("ANTES", margin, y + 3); y += 5;
            for (let i = 0; i < pBefore.length; i++) {
              const b64 = await loadImageBase64(pBefore[i]);
              if (b64) doc.addImage(b64, "PNG", margin + i * (ps + 3), y, ps, ps);
            }
            y += ps + 3;
          }
          if (pAfter.length > 0) {
            checkPage(ps + 10);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COL.secondary);
            doc.text("DEPOIS", margin, y + 3); y += 5;
            for (let i = 0; i < pAfter.length; i++) {
              const b64 = await loadImageBase64(pAfter[i]);
              if (b64) doc.addImage(b64, "PNG", margin + i * (ps + 3), y, ps, ps);
            }
            y += ps + 3;
          }
          doc.setTextColor(...COL.text);
        }
        y += 2;
      }
    }

    // ====== POPs ======
    const recordPOPs = myPOPs;
    if (recordPOPs.length > 0) {
      addSectionTitle("POPs Atribuídos");
      recordPOPs.forEach((pop, idx) => {
        checkPage(18);
        // POP sub-header
        doc.setFillColor(...COL.primary);
        doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COL.text);
        doc.text(`${idx + 1}. ${pop.name}`, margin + 3, y + 4.5);
        y += 10;
        addWideField("Descrição", pop.description);
        addWideField("Materiais", pop.materials.join(", "));

        // Steps
        checkPage(10);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COL.muted);
        doc.text("PASSOS", margin + 3, y + 3);
        y += 9;
        pop.steps.forEach(step => {
          checkPage(8);
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...COL.text);
          const stepLines = doc.splitTextToSize(step, contentWidth - 8);
          doc.text(stepLines, margin + 5, y);
          y += stepLines.length * 3.5 + 2;
        });

        if (pop.observations) {
          checkPage(10);
          doc.setFillColor(...COL.bg);
          doc.roundedRect(margin, y, contentWidth, 0, 1, 1, "F"); // measure first
          doc.setFontSize(7);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(...COL.muted);
          const obsLines = doc.splitTextToSize(`Observações: ${pop.observations}`, contentWidth - 8);
          const obsH = obsLines.length * 3.5 + 5;
          doc.setFillColor(...COL.bg);
          doc.roundedRect(margin, y, contentWidth, obsH, 1, 1, "F");
          doc.text(obsLines, margin + 3, y + 4);
          doc.setTextColor(...COL.text);
          y += obsH + 3;
        }
        y += 4;
      });
    }

    // ====== ACOMPANHAMENTOS ======
    if (record.followUps.length > 0) {
      addSectionTitle("Acompanhamentos");
      autoTable(doc, {
        startY: y,
        head: [["Data", "Observações", "Próxima Visita"]],
        body: record.followUps.map(f => [
          format(new Date(f.date), "dd/MM/yyyy"),
          f.notes,
          f.nextVisit ? format(new Date(f.nextVisit), "dd/MM/yyyy") : "—",
        ]),
        styles: { fontSize: 7.5, cellPadding: 3, textColor: COL.text },
        headStyles: { fillColor: COL.secondary, textColor: COL.white, fontStyle: "bold" },
        alternateRowStyles: { fillColor: COL.cardBg },
        margin: { left: margin, right: margin },
        columnStyles: { 1: { cellWidth: 95 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ====== FOOTER on all pages ======
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Footer line
      doc.setFillColor(...COL.primary);
      doc.rect(margin, 286, contentWidth, 0.5, "F");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COL.muted);
      doc.text(
        `${settings.companyName}  •  Ficha ${record.prontuarioNumber}  •  Página ${i} de ${totalPages}`,
        pageWidth / 2, 290, { align: "center" }
      );
    }

    doc.save(`Ficha_${record.prontuarioNumber}_${record.fullName.replace(/\s/g, "_")}.pdf`);
  };
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxCompare, setLightboxCompare] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => { logout(); navigate("/"); };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">Minha Área</h1>
              <p className="text-xs text-muted-foreground">Olá, {user.name}!</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setBookingOpen(true)}>
            <CardContent className="p-3 sm:p-4 text-center">
              <h3 className="font-heading font-semibold text-foreground text-xs sm:text-sm">Agendar Serviço</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Explore o catálogo</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/produtos-programas")}>
            <CardContent className="p-4 text-center">
              <h3 className="font-heading font-semibold text-foreground text-sm">Produtos</h3>
              <p className="text-xs text-muted-foreground mt-1">Kits e cosméticos</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setProfileOpen(true)}>
            <CardContent className="p-4 text-center">
              <User className="h-5 w-5 text-primary mx-auto mb-1" />
              <h3 className="font-heading font-semibold text-foreground text-sm">Meu Perfil</h3>
              <p className="text-xs text-muted-foreground mt-1">Foto e dados pessoais</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setSupportOpen(true)}>
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-5 w-5 text-primary mx-auto mb-1" />
              <h3 className="font-heading font-semibold text-foreground text-sm">Suporte</h3>
              <p className="text-xs text-muted-foreground mt-1">Abrir conversa</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="historico" className="w-full">
          <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="historico" className="text-xs sm:text-sm flex-1 sm:flex-none">Histórico</TabsTrigger>
            <TabsTrigger value="agendamentos" className="text-xs sm:text-sm flex-1 sm:flex-none">Agendamentos</TabsTrigger>
            <TabsTrigger value="ficha" data-value="ficha" className="text-xs sm:text-sm flex-1 sm:flex-none">Ficha Digital</TabsTrigger>
          </TabsList>

          <TabsContent value="historico">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Suas últimas compras</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile: card list */}
                <div className="block sm:hidden divide-y divide-border">
                  {mockPurchases.map((p) => (
                    <div key={p.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-foreground">{p.service}</p>
                        <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{p.date}</span>
                        <span className="font-medium text-foreground">{p.value}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setTrackingOrder(p)} className="text-primary hover:text-primary/80 text-xs gap-1 px-0 h-7">
                        <Eye className="h-3.5 w-3.5" /> Rastrear
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Serviço / Produto</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rastreio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPurchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-muted-foreground text-sm">{p.date}</TableCell>
                          <TableCell className="font-medium text-sm">{p.service}</TableCell>
                          <TableCell className="text-sm">{p.value}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setTrackingOrder(p)} className="text-primary hover:text-primary/80 text-xs gap-1">
                              <Eye className="h-3.5 w-3.5" /> Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agendamentos">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Próximos procedimentos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile: card list */}
                <div className="block sm:hidden divide-y divide-border">
                  {mockScheduled.map((s) => (
                    <div key={s.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-foreground">{s.service}</p>
                        <Badge variant={s.status === "Confirmado" ? "default" : "outline"} className="text-xs">{s.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{s.date}</span>
                        <span>•</span>
                        <span>{s.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockScheduled.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-muted-foreground text-sm">{s.date}</TableCell>
                          <TableCell className="font-medium text-sm">{s.service}</TableCell>
                          <TableCell className="text-sm">{s.time}</TableCell>
                          <TableCell>
                            <Badge variant={s.status === "Confirmado" ? "default" : "outline"} className="text-xs">{s.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ficha">
            {myRecords.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="font-heading font-semibold text-foreground">Nenhuma ficha encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">Seu registro clínico será criado pela profissional na sua primeira consulta.</p>
                </CardContent>
              </Card>
            ) : myRecords.map((record) => (
              <Card key={record.id} className="mb-4">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {record.patientPhoto ? (
                        <img src={record.patientPhoto} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/20" />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                          <span className="text-sm text-muted-foreground font-heading font-bold">{record.fullName.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-sm sm:text-base font-heading">{record.fullName}</CardTitle>
                        <p className="text-xs text-muted-foreground">Registro: {record.prontuarioNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] sm:text-xs font-heading">Gestacional</Badge>
                      <Badge variant={record.status === "ativo" ? "default" : "secondary"} className="text-[10px] sm:text-xs font-heading">{record.status}</Badge>
                      <Button variant="secondary" size="sm" className="rounded-full text-[10px] sm:text-xs text-secondary-foreground h-7 sm:h-8 px-2.5 sm:px-3" onClick={() => exportRecordPDF(record)}>
                        <FileDown className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dados Pessoais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { label: "Nascimento", value: record.birthDate ? format(new Date(record.birthDate), "dd/MM/yyyy") : "—" },
                      { label: "Telefone", value: record.phone || "—" },
                      { label: "Estado Civil", value: record.maritalStatus || "—" },
                      { label: "Profissão", value: record.profession || "—" },
                      { label: "Endereço", value: record.address || "—" },
                      { label: "Emergência", value: record.emergencyContact || "—" },
                      { label: "Última Menstruação", value: record.lastMenstruation ? format(new Date(record.lastMenstruation), "dd/MM/yyyy") : "—" },
                      { label: "Consentimento", value: record.consentSigned ? "Assinado" : "Pendente" },
                    ].map((item) => (
                      <div key={item.label} className="bg-muted rounded-lg p-3">
                        <p className="text-[11px] text-muted-foreground font-heading">{item.label}</p>
                        <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Motivo e Expectativas */}
                  {(record.consultationReason || record.expectations) && (
                    <>
                      <Separator />
                      <p className="text-sm font-heading font-semibold text-foreground">Motivo e Expectativas</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {record.consultationReason && (
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-[11px] text-muted-foreground font-heading">Motivo da Consulta</p>
                            <p className="text-sm text-foreground">{record.consultationReason}</p>
                          </div>
                        )}
                        {record.expectations && (
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-[11px] text-muted-foreground font-heading">Expectativas</p>
                            <p className="text-sm text-foreground">{record.expectations}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Histórico de Saúde */}
                  {(record.preExistingConditions || record.medications || record.allergies || record.habits) && (
                    <>
                      <Separator />
                      <p className="text-sm font-heading font-semibold text-foreground">Histórico de Saúde</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Doenças Pré-existentes", value: record.preExistingConditions },
                          { label: "Medicamentos", value: record.medications },
                          { label: "Alergias", value: record.allergies },
                          { label: "Hábitos", value: record.habits },
                        ].filter(v => v.value).map((item) => (
                          <div key={item.label} className="bg-muted rounded-lg p-3">
                            <p className="text-[11px] text-muted-foreground font-heading">{item.label}</p>
                            <p className="text-sm text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Cartão Gestacional */}
                  {record.gestationalCard?.dum && (
                    <>
                      <Separator />
                      <p className="text-sm font-heading font-semibold text-foreground">Cartão da Gestante</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Tipo Sanguíneo", value: `${record.gestationalCard.bloodType} ${record.gestationalCard.rh}` },
                          { label: "G/P/A", value: `G${record.gestationalCard.gravida}P${record.gestationalCard.para}A${record.gestationalCard.abortions}` },
                          { label: "DUM", value: record.gestationalCard.dum },
                          { label: "DPP", value: record.gestationalCard.dpp },
                          { label: "Classificação de Risco", value: record.gestationalCard.riskClassification === "habitual" ? "Habitual" : "Alto Risco" },
                          { label: "Hospital", value: record.gestationalCard.hospital || "—" },
                          { label: "Pediatra", value: record.gestationalCard.pediatrician || "—" },
                          { label: "Acompanhante", value: record.gestationalCard.companion || "—" },
                        ].map((item) => (
                          <div key={item.label} className="bg-muted rounded-lg p-3">
                            <p className="text-[11px] text-muted-foreground font-heading">{item.label}</p>
                            <p className="text-sm text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Sinais Vitais */}
                  {record.vitalSigns.weight && (
                    <>
                      <Separator />
                      <p className="text-sm font-heading font-semibold text-foreground">Sinais Vitais</p>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { label: "Peso", value: record.vitalSigns.weight },
                          { label: "Altura", value: record.vitalSigns.height },
                          { label: "IMC", value: record.vitalSigns.bmi },
                          { label: "PA", value: record.vitalSigns.bloodPressure },
                          { label: "FC", value: record.vitalSigns.heartRate },
                          { label: "Temp", value: record.vitalSigns.temperature },
                        ].filter(v => v.value).map((item) => (
                          <div key={item.label} className="bg-muted rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground font-heading">{item.label}</p>
                            <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Medidas corporais */}
                      {record.vitalSigns.bust && (
                        <>
                          <p className="text-xs text-muted-foreground font-heading font-medium">Medidas Corporais</p>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {[
                              { label: "Busto", value: record.vitalSigns.bust },
                              { label: "Cintura", value: record.vitalSigns.waist },
                              { label: "Abdômen", value: record.vitalSigns.abdomen },
                              { label: "Quadril", value: record.vitalSigns.hips },
                              { label: "Braço E", value: record.vitalSigns.leftArm },
                              { label: "Braço D", value: record.vitalSigns.rightArm },
                              { label: "Coxa E", value: record.vitalSigns.leftThigh },
                              { label: "Coxa D", value: record.vitalSigns.rightThigh },
                              { label: "Pant. E", value: record.vitalSigns.leftCalf },
                              { label: "Pant. D", value: record.vitalSigns.rightCalf },
                            ].filter(v => v.value).map((item) => (
                              <div key={item.label} className="bg-muted rounded-lg p-2 text-center">
                                <p className="text-[10px] text-muted-foreground font-heading">{item.label}</p>
                                <p className="text-sm font-heading font-semibold text-foreground">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Procedures with photos */}
                  {record.procedures.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-sm font-heading font-semibold text-foreground">Procedimentos Realizados ({record.procedures.length})</p>
                      <div className="space-y-3">
                        {record.procedures.map((proc) => (
                          <div key={proc.id} className="border border-border/50 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-heading font-semibold text-foreground">{proc.protocolName}</p>
                              <span className="text-xs text-muted-foreground">{format(new Date(proc.date), "dd/MM/yyyy")}</span>
                            </div>
                            {proc.parameters && <p className="text-xs text-muted-foreground">Parâmetros: {proc.parameters}</p>}
                            {proc.results && <p className="text-xs text-muted-foreground">Resultado: {proc.results}</p>}
                            {proc.homeInstructions && <p className="text-xs text-muted-foreground">Cuidados em casa: {proc.homeInstructions}</p>}
                            <p className="text-xs text-muted-foreground">Profissional: {proc.professional}</p>

                            {/* Fotos do procedimento */}
                            {(proc.photosBefore.length > 0 || proc.photosAfter.length > 0) && (
                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="space-y-1">
                                  <p className="text-[11px] text-muted-foreground font-heading">Antes</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {proc.photosBefore.map((img, i) => (
                                      <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-border cursor-pointer" onClick={() => { setLightboxPhotos(proc.photosBefore); setLightboxCompare(proc.photosAfter); setLightboxIndex(i); setLightboxOpen(true); }}>
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[11px] text-muted-foreground font-heading">Depois</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {proc.photosAfter.map((img, i) => (
                                      <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-border cursor-pointer" onClick={() => { setLightboxPhotos(proc.photosBefore); setLightboxCompare(proc.photosAfter); setLightboxIndex(i); setLightboxOpen(true); }}>
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* POPs atribuídos */}
                  {myPOPs.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-sm font-heading font-semibold text-foreground">POP's — Procedimentos Operacionais ({myPOPs.length})</p>
                      <div className="space-y-3">
                        {myPOPs.map((pop) => (
                          <div key={pop.id} className="border border-border/50 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-heading font-semibold text-foreground">{pop.name}</p>
                            <p className="text-xs text-muted-foreground">{pop.description}</p>
                            {pop.materials.length > 0 && (
                              <div>
                                <p className="text-[11px] text-muted-foreground font-heading font-medium">Materiais</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {pop.materials.map((m, i) => <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>)}
                                </div>
                              </div>
                            )}
                            {pop.steps.length > 0 && (
                              <div>
                                <p className="text-[11px] text-muted-foreground font-heading font-medium">Etapas</p>
                                <ul className="text-xs text-foreground space-y-0.5 mt-1">
                                  {pop.steps.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                              </div>
                            )}
                            {pop.observations && (
                              <div className="bg-muted rounded-lg p-2">
                                <p className="text-[11px] text-muted-foreground font-heading">Observações</p>
                                <p className="text-xs text-foreground">{pop.observations}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Follow-ups */}
                  {record.followUps.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-sm font-heading font-semibold text-foreground">Follow-ups ({record.followUps.length})</p>
                      <div className="space-y-2">
                        {record.followUps.map((fu) => (
                          <div key={fu.id} className="border border-border/50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">{format(new Date(fu.date), "dd/MM/yyyy")}</span>
                              {fu.nextVisit && <span className="text-xs text-muted-foreground">Próxima: {format(new Date(fu.nextVisit), "dd/MM/yyyy")}</span>}
                            </div>
                            <p className="text-sm text-foreground">{fu.notes}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Lightbox */}
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4" onClick={() => setLightboxOpen(false)}>
            <div className="relative max-w-5xl w-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setLightboxOpen(false)} className="absolute -top-1 right-0 text-white/60 hover:text-white text-2xl p-2 z-10">×</button>
              {lightboxCompare.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-white/60 text-xs font-heading uppercase tracking-wider">Antes</span>
                    {lightboxPhotos[lightboxIndex] ? (
                      <img src={lightboxPhotos[lightboxIndex]} alt="Antes" className="max-h-[70vh] max-w-full object-contain rounded-lg" />
                    ) : (
                      <div className="flex items-center justify-center h-40 text-white/30 text-xs">Sem foto</div>
                    )}
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-white/60 text-xs font-heading uppercase tracking-wider">Depois</span>
                    {lightboxCompare[lightboxIndex] ? (
                      <img src={lightboxCompare[lightboxIndex]} alt="Depois" className="max-h-[70vh] max-w-full object-contain rounded-lg" />
                    ) : (
                      <div className="flex items-center justify-center h-40 text-white/30 text-xs">Sem foto</div>
                    )}
                  </div>
                </div>
              ) : (
                <img src={lightboxPhotos[lightboxIndex]} alt="" className="max-h-[75vh] max-w-full object-contain rounded-lg" />
              )}
              {Math.max(lightboxPhotos.length, lightboxCompare.length) > 1 && (
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 font-heading" onClick={() => setLightboxIndex((prev) => (prev - 1 + Math.max(lightboxPhotos.length, lightboxCompare.length)) % Math.max(lightboxPhotos.length, lightboxCompare.length))}>
                    ← Anterior
                  </Button>
                  <span className="text-white text-xs font-heading">{lightboxIndex + 1} / {Math.max(lightboxPhotos.length, lightboxCompare.length)}</span>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 font-heading" onClick={() => setLightboxIndex((prev) => (prev + 1) % Math.max(lightboxPhotos.length, lightboxCompare.length))}>
                    Próxima →
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <SupportChat open={supportOpen} onOpenChange={setSupportOpen} />
      <OrderTrackingDialog open={!!trackingOrder} onOpenChange={(v) => !v && setTrackingOrder(null)} order={trackingOrder} />
      <HeroBookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
};

export default DashboardCliente;
