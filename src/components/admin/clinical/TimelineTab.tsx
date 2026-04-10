import { useMemo, useState } from "react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ClinicalRecord, PrenatalConsultation, GestationalExam, Vaccine } from "@/contexts/ClinicalRecordContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcGestationalAgeAtDate } from "./constants";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "lucide-react";

interface TimelineEvent {
  id: string;
  date: string;
  type: "consulta" | "exame" | "vacina" | "videochamada";
  title: string;
  subtitle: string;
  status?: string;
  badge?: { label: string; variant: "default" | "secondary" | "destructive" | "outline" };
  details?: Record<string, string>;
  videoUrl?: string;
}

interface TimelineTabProps {
  record: ClinicalRecord;
  onConsultClick?: (c: PrenatalConsultation) => void;
  onExamClick?: (e: GestationalExam) => void;
}

const TimelineTab = ({ record, onConsultClick, onExamClick }: TimelineTabProps) => {
  const [filter, setFilter] = useState<"all" | "consulta" | "exame" | "vacina" | "videochamada">("all");
  const [trimFilter, setTrimFilter] = useState<"all" | "1" | "2" | "3">("all");
  const [videoRecordings, setVideoRecordings] = useState<Array<{ id: string; patient_name: string; file_url: string; duration_seconds: number | null; created_at: string }>>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const dum = record.gestationalCard.dum;

  useEffect(() => {
    const fetchRecordings = async () => {
      const { data } = await supabase
        .from("video_recordings")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setVideoRecordings(data);
    };
    fetchRecordings();
  }, []);

  const events = useMemo(() => {
    const result: TimelineEvent[] = [];

    record.prenatalConsultations.forEach(c => {
      const ig = dum ? calcGestationalAgeAtDate(dum, c.date) : "";
      result.push({
        id: c.id,
        date: c.date,
        type: "consulta",
        title: `Consulta Pré-natal${ig ? ` — ${ig}` : ""}`,
        subtitle: [c.weight ? `${c.weight}kg` : "", c.bloodPressure ? `PA ${c.bloodPressure}` : "", c.professional].filter(Boolean).join(" · "),
        badge: { label: c.status === "realizada" ? "Realizada" : c.status === "cancelada" ? "Cancelada" : "Agendada", variant: c.status === "realizada" ? "default" : c.status === "cancelada" ? "destructive" : "secondary" },
      });
    });

    record.gestationalExams.forEach(e => {
      result.push({
        id: e.id,
        date: e.date,
        type: "exame",
        title: e.type,
        subtitle: [e.result ? e.result.slice(0, 60) : "", e.laboratory].filter(Boolean).join(" · "),
        badge: e.interpretation ? { label: e.interpretation === "normal" ? "Normal" : e.interpretation === "alterado" ? "Alterado" : "Inconcl.", variant: e.interpretation === "normal" ? "default" : e.interpretation === "alterado" ? "destructive" : "secondary" } : undefined,
      });
    });

    (record.vaccines || []).forEach(v => {
      result.push({
        id: v.id,
        date: v.date,
        type: "vacina",
        title: v.name === "Outra" ? (v.customName || "Outra") : v.name,
        subtitle: [v.dose, v.manufacturer, v.professional].filter(Boolean).join(" · "),
        badge: v.reaction ? { label: "Reação", variant: "destructive" } : { label: "Aplicada", variant: "default" },
      });
    });

    // Add video recordings that match this patient
    videoRecordings
      .filter(vr => vr.patient_name.toLowerCase() === record.patientName.toLowerCase() || record.clinical_record_id === vr.id)
      .forEach(vr => {
        const durationMin = vr.duration_seconds ? Math.round(vr.duration_seconds / 60) : 0;
        result.push({
          id: vr.id,
          date: vr.created_at.split("T")[0],
          type: "videochamada",
          title: "Teleconsulta por Vídeo",
          subtitle: `Duração: ${durationMin}min · ${vr.patient_name}`,
          badge: { label: "Gravação", variant: "default" },
          videoUrl: vr.file_url,
        });
      });

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [record, dum, videoRecordings]);

  const filtered = useMemo(() => {
    let result = events;
    if (filter !== "all") result = result.filter(e => e.type === filter);
    if (trimFilter !== "all" && dum) {
      const trimRanges = { "1": [0, 13], "2": [14, 27], "3": [28, 42] };
      const [minW, maxW] = trimRanges[trimFilter];
      result = result.filter(e => {
        const diffMs = new Date(e.date).getTime() - new Date(dum).getTime();
        const w = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
        return w >= minW && w <= maxW;
      });
    }
    return result;
  }, [events, filter, trimFilter, dum]);

  const colorMap: Record<string, string> = { consulta: "border-l-secondary", exame: "border-l-primary", vacina: "border-l-muted-foreground", videochamada: "border-l-destructive" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "consulta", "exame", "vacina", "videochamada"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-[11px] px-3 py-1 rounded-full font-heading transition-colors ${filter === f ? "bg-secondary text-secondary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            {f === "all" ? "Todos" : f === "consulta" ? "Consultas" : f === "exame" ? "Exames" : f === "vacina" ? "Vacinas" : "Vídeos"}
          </button>
        ))}
        <span className="text-muted-foreground text-[10px]">|</span>
        {(["all", "1", "2", "3"] as const).map(t => (
          <button key={t} onClick={() => setTrimFilter(t)} className={`text-[10px] px-2 py-0.5 rounded-full font-heading transition-colors ${trimFilter === t ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
            {t === "all" ? "Todos tri." : `${t}º Tri`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardContent className="p-8 text-center"><p className="text-sm text-muted-foreground font-heading">Nenhum evento encontrado</p></CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className={`bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/5 rounded-xl p-3 border-l-4 ${colorMap[ev.type]} cursor-pointer hover:bg-white/60 hover:shadow-xl transition-all`}
              onClick={() => {
                if (ev.type === "videochamada" && ev.videoUrl) {
                  setPlayingVideo(playingVideo === ev.id ? null : ev.id);
                } else if (ev.type === "consulta" && onConsultClick) {
                  const c = record.prenatalConsultations.find(c => c.id === ev.id);
                  if (c) onConsultClick(c);
                } else if (ev.type === "exame" && onExamClick) {
                  const e = record.gestationalExams.find(e => e.id === ev.id);
                  if (e) onExamClick(e);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {ev.type === "videochamada" && (
                    <Video className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-bold text-foreground">{ev.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{ev.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ev.badge && <Badge variant={ev.badge.variant} className="text-[9px] font-heading">{ev.badge.label}</Badge>}
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(ev.date), "dd/MM/yy")}</span>
                </div>
              </div>
              {ev.type === "videochamada" && playingVideo === ev.id && ev.videoUrl && (
                <div className="mt-3">
                  <video
                    src={ev.videoUrl}
                    controls
                    className="w-full rounded-lg max-h-[300px]"
                    autoPlay
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineTab;
