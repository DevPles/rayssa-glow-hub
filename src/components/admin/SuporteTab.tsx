import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSupport, SupportTicket, TicketPriority, SupportAttachment } from "@/contexts/SupportContext";

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-blue-100 text-blue-700" },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-700" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  urgente: { label: "Urgente", color: "bg-red-100 text-red-700" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "bg-yellow-100 text-yellow-700" },
  respondido: { label: "Respondido", color: "bg-green-100 text-green-700" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-700" },
  fechado: { label: "Fechado", color: "bg-muted text-muted-foreground" },
};

export const SuporteTab = () => {
  const { tickets, addMessage, closeTicket, reopenTicket, updatePriority, setTicketStatus } = useSupport();
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [priorityFilter, setPriorityFilter] = useState<string>("todos");
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "todos" && t.status !== statusFilter) return false;
    if (priorityFilter !== "todos" && t.priority !== priorityFilter) return false;
    return true;
  });

  const openCount = tickets.filter((t) => t.status === "aberto").length;
  const respondedCount = tickets.filter((t) => t.status === "respondido").length;
  const inProgressCount = tickets.filter((t) => t.status === "em_andamento").length;
  const closedCount = tickets.filter((t) => t.status === "fechado").length;

  const handleSend = () => {
    if (!reply.trim() || !activeTicket) return;
    addMessage(activeTicket.id, "admin", "Admin", reply.trim(), attachments.length > 0 ? attachments : undefined);
    setReply("");
    setAttachments([]);
    refreshActiveTicket();
  };

  const refreshActiveTicket = () => {
    if (!activeTicket) return;
    setTimeout(() => {
      const updated = tickets.find((t) => t.id === activeTicket.id);
      if (updated) setActiveTicket({ ...updated });
    }, 50);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: SupportAttachment[] = Array.from(files).map((file) => ({
      id: `att${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      type: file.type.startsWith("image/") ? "image" : "document",
      url: URL.createObjectURL(file),
      timestamp: new Date().toLocaleString("pt-BR"),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleCloseTicket = () => {
    if (!activeTicket || !resolutionNotes.trim()) return;
    closeTicket(activeTicket.id, resolutionNotes.trim(), "Admin");
    setResolutionNotes("");
    setCloseDialogOpen(false);
    setActiveTicket(null);
  };

  const handleReopen = (ticketId: string) => {
    reopenTicket(ticketId);
    const updated = tickets.find((t) => t.id === ticketId);
    if (updated) setActiveTicket({ ...updated, status: "aberto" });
  };

  // =================== TICKET DETAIL VIEW ===================
  if (activeTicket) {
    const current = tickets.find((t) => t.id === activeTicket.id) || activeTicket;
    const pCfg = priorityConfig[current.priority];
    const sCfg = statusConfig[current.status];

    return (
      <>
        <Card className="max-w-3xl mx-auto bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <button onClick={() => setActiveTicket(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 font-heading">
                  ← Voltar aos chamados
                </button>
                <CardTitle className="text-lg font-heading leading-tight">{current.subject}</CardTitle>
              </div>
              <div className="flex gap-2 shrink-0">
                {current.status !== "fechado" && (
                  <Button size="sm" variant="destructive" onClick={() => setCloseDialogOpen(true)} className="text-xs font-heading rounded-lg">
                    Finalizar
                  </Button>
                )}
                {current.status === "fechado" && (
                  <Button size="sm" variant="outline" onClick={() => handleReopen(current.id)} className="text-xs font-heading rounded-lg">
                    Reabrir
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{current.id}</span>
              <span>{current.userName}</span>
              <span>{current.createdAt}</span>
              <Badge className={`text-[10px] border-0 ${sCfg.color}`}>{sCfg.label}</Badge>
              <Badge className={`text-[10px] border-0 ${pCfg.color}`}>{pCfg.label}</Badge>
            </div>

            {current.status !== "fechado" && (
              <div className="flex flex-wrap gap-2">
                <Select value={current.status} onValueChange={(v) => { setTicketStatus(current.id, v as SupportTicket["status"]); refreshActiveTicket(); }}>
                  <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="respondido">Respondido</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={current.priority} onValueChange={(v) => { updatePriority(current.id, v as TicketPriority); refreshActiveTicket(); }}>
                  <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {current.status === "fechado" && current.resolutionNotes && (
              <div className="bg-muted/50 rounded-xl p-3 border border-border">
                <p className="text-[10px] font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-1">Resolução</p>
                <p className="text-sm text-foreground">{current.resolutionNotes}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Finalizado por {current.closedBy} em {current.closedAt}</p>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[350px] p-4">
              <div className="space-y-3">
                {current.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "admin" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                      <p className="text-[10px] font-heading font-semibold mb-1 opacity-70">{msg.senderName}</p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att) => (
                            <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] underline opacity-80 hover:opacity-100">
                              {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] opacity-50 mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {current.status !== "fechado" && (
              <div className="p-4 border-t border-border space-y-2">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1 text-xs">
                        <span className="max-w-[120px] truncate">{att.name}</span>
                        <button onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))} className="text-muted-foreground hover:text-foreground ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileAttach} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl shrink-0 text-xs">
                    Anexar
                  </Button>
                  <Input
                    placeholder="Responder ao cliente..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="rounded-xl"
                  />
                  <Button onClick={handleSend} size="sm" className="rounded-xl bg-primary text-primary-foreground shrink-0">
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <DialogContent className="bg-white/80 backdrop-blur-xl border-white/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Finalizar Chamado</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Descreva a resolução deste chamado para manter o histórico.</p>
              <Textarea
                placeholder="Descreva como o chamado foi resolvido, ações tomadas, e próximos passos se houver..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                className="rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseDialogOpen(false)} className="rounded-lg font-heading text-xs">Cancelar</Button>
              <Button onClick={handleCloseTicket} disabled={!resolutionNotes.trim()} className="rounded-lg font-heading text-xs bg-primary text-primary-foreground">
                Finalizar Chamado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // =================== TICKET LIST VIEW ===================
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-lg text-foreground mb-4">Gestão de Chamados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Abertos", count: openCount, color: "text-yellow-600 bg-yellow-50" },
            { label: "Respondidos", count: respondedCount, color: "text-green-600 bg-green-50" },
            { label: "Em Andamento", count: inProgressCount, color: "text-blue-600 bg-blue-50" },
            { label: "Fechados", count: closedCount, color: "text-muted-foreground bg-muted" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/40 backdrop-blur-xl border-white/50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color} text-sm font-bold font-heading`}>
                  {stat.count}
                </div>
                <p className="text-[11px] text-muted-foreground font-heading">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs rounded-lg bg-white/60 backdrop-blur-xl border-white/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="respondido">Respondido</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="fechado">Fechado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs rounded-lg bg-white/60 backdrop-blur-xl border-white/50">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Prioridades</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center ml-1">{filteredTickets.length} chamado(s)</span>
      </div>

      {filteredTickets.length === 0 && <p className="text-sm text-muted-foreground">Nenhum chamado encontrado.</p>}
      <div className="grid gap-3">
        {filteredTickets.map((t) => {
          const pCfg = priorityConfig[t.priority];
          const sCfg = statusConfig[t.status];
          const lastMsg = t.messages[t.messages.length - 1];
          return (
            <Card key={t.id} className="cursor-pointer bg-white/40 backdrop-blur-xl border-white/50 shadow-sm hover:shadow-lg transition-all group" onClick={() => setActiveTicket(t)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="font-heading font-semibold text-sm text-foreground">{t.subject}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{t.userName}</span>
                      <span>•</span>
                      <span>{t.createdAt}</span>
                      <span>•</span>
                      <span>{t.messages.length} msg</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-lg">{lastMsg?.content}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={`text-[10px] border-0 ${sCfg.color}`}>{sCfg.label}</Badge>
                    <Badge className={`text-[10px] border-0 ${pCfg.color}`}>{pCfg.label}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
