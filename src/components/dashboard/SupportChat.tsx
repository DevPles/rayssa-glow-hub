import { useState } from "react";
import { Send, Plus, MessageCircle, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useSupport, SupportTicket } from "@/contexts/SupportContext";

interface SupportChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportChat = ({ open, onOpenChange }: SupportChatProps) => {
  const { user } = useAuth();
  const { getTicketsForUser, createTicket, addMessage } = useSupport();
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showNew, setShowNew] = useState(false);

  if (!user) return null;

  const tickets = getTicketsForUser(user.id);

  const handleSend = () => {
    if (!message.trim() || !activeTicket) return;
    addMessage(activeTicket.id, "cliente", user.name, message.trim());
    setMessage("");
    // Re-fetch ticket
    const updated = getTicketsForUser(user.id).find((t) => t.id === activeTicket.id);
    if (updated) setActiveTicket(updated);
  };

  const handleCreate = () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    const ticket = createTicket(user.id, user.name, newSubject.trim(), newMessage.trim());
    setActiveTicket(ticket);
    setNewSubject("");
    setNewMessage("");
    setShowNew(false);
  };

  const statusColor = (s: string) => {
    if (s === "respondido") return "bg-green-100 text-green-700 border-0";
    if (s === "fechado") return "bg-muted text-muted-foreground border-0";
    return "bg-yellow-100 text-yellow-700 border-0";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setActiveTicket(null); setShowNew(false); } }}>
      <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="font-heading flex items-center gap-2">
            {activeTicket && (
              <button onClick={() => setActiveTicket(null)} className="p-1 hover:bg-muted rounded-lg">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <MessageCircle className="h-5 w-5 text-primary" />
            {activeTicket ? activeTicket.subject : "Suporte"}
          </DialogTitle>
        </DialogHeader>

        {!activeTicket && !showNew ? (
          <div className="flex-1 flex flex-col p-4 gap-3 overflow-auto">
            <Button onClick={() => setShowNew(true)} className="w-full rounded-xl bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Nova Conversa
            </Button>
            {tickets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-8">Nenhuma conversa ainda. Abra uma nova!</p>
            )}
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTicket(t)}
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-sm text-foreground">{t.subject}</span>
                  <Badge className={`text-[10px] ${statusColor(t.status)}`}>{t.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {t.messages[t.messages.length - 1]?.content}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.createdAt}</p>
              </button>
            ))}
          </div>
        ) : showNew ? (
          <div className="flex-1 flex flex-col p-4 gap-4">
            <button onClick={() => setShowNew(false)} className="self-start text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Voltar
            </button>
            <div className="space-y-2">
              <Input placeholder="Assunto" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2 flex-1">
              <textarea
                placeholder="Descreva sua dúvida ou solicitação..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full h-full min-h-[120px] rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={handleCreate} className="w-full rounded-xl bg-primary text-primary-foreground">
              <Send className="h-4 w-4 mr-2" /> Enviar
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {activeTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "cliente" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.sender === "cliente"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-[10px] font-heading font-semibold mb-1 opacity-70">{msg.senderName}</p>
                      <p>{msg.content}</p>
                      <p className="text-[9px] opacity-50 mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {activeTicket.status !== "fechado" && (
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  className="rounded-xl"
                />
                <Button onClick={handleSend} size="icon" className="rounded-xl bg-primary text-primary-foreground shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportChat;
