import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking, type Booking } from "@/contexts/BookingContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Bell, BellOff, Video } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createVideoRoom } from "@/hooks/useVideoCall";
import { useAuth } from "@/contexts/AuthContext";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

const statusColors: Record<Booking["status"], string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmado: "bg-green-100 text-green-800 border-green-300",
  cancelado: "bg-red-100 text-red-800 border-red-300",
  concluido: "bg-blue-100 text-blue-800 border-blue-300",
};

const statusLabels: Record<Booking["status"], string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

export const AgendamentosTab = () => {
  const { bookings, notifications, unreadCount, updateBookingStatus, markNotificationRead, markAllRead } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creatingCall, setCreatingCall] = useState<string | null>(null);

  const handleConfirm = (id: string) => {
    updateBookingStatus(id, "confirmado");
    toast({ title: "Agendamento confirmado!" });
  };

  const handleCancel = (id: string) => {
    updateBookingStatus(id, "cancelado");
    toast({ title: "Agendamento cancelado" });
  };

  const handleComplete = (id: string) => {
    updateBookingStatus(id, "concluido");
    toast({ title: "Agendamento marcado como concluído" });
  };

  const handleStartVideoCall = async (b: Booking) => {
    setCreatingCall(b.id);
    const roomId = await createVideoRoom(
      user?.email || "admin",
      b.clientName,
      b.clientPhone
    );
    setCreatingCall(null);
    if (roomId) {
      const baseUrl = window.location.origin;
      const patientLink = `${baseUrl}/videochamada/${roomId}`;

      // Copy link to clipboard
      try {
        await navigator.clipboard.writeText(patientLink);
      } catch {}

      // Send WhatsApp to patient if phone available
      if (b.clientPhone) {
        const cleanPhone = b.clientPhone.replace(/\D/g, "");
        const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
        sendWhatsAppNotification({
          phone: fullPhone,
          message: `📹 *Teleconsulta*\n\nOlá ${b.clientName}! Sua videochamada está pronta.\n\nAcesse pelo link:\n${patientLink}`,
          type: "agendamento",
          metadata: { roomId, service: b.serviceTitle },
        }).catch((err) => console.error("Erro WhatsApp:", err));
      }

      toast({
        title: "Videochamada criada!",
        description: "Link copiado e enviado por WhatsApp. Entrando na sala...",
      });

      setTimeout(() => navigate(`/admin/videochamada/${roomId}`), 1500);
    } else {
      toast({ title: "Erro ao criar videochamada", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notificações
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 ml-1">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-muted-foreground rounded-full">
              <BellOff className="h-3.5 w-3.5 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2 max-h-60 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma notificação</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl text-sm transition-colors cursor-pointer ${
                  n.read ? "bg-muted/30 text-muted-foreground" : "bg-primary/5 border border-primary/20 text-foreground"
                }`}
                onClick={() => !n.read && markNotificationRead(n.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  <span className="truncate">{n.message}</span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Bookings table */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Todos os Agendamentos ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{b.clientName}</p>
                      <p className="text-[10px] text-muted-foreground">{b.clientPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{b.serviceTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(b.date)}</TableCell>
                  <TableCell className="text-sm">{b.time}</TableCell>
                  <TableCell className="text-sm">
                    {b.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border ${statusColors[b.status]}`}>
                      {statusLabels[b.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartVideoCall(b)}
                        disabled={creatingCall === b.id}
                        className="h-7 w-7 p-0 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full"
                        title="Iniciar videochamada"
                      >
                        <Video className="h-3.5 w-3.5" />
                      </Button>
                      {b.status === "pendente" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleConfirm(b.id)} className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCancel(b.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {b.status === "confirmado" && (
                        <Button size="sm" variant="ghost" onClick={() => handleComplete(b.id)} className="h-7 px-2 text-[10px] text-blue-600 hover:bg-blue-50 rounded-full">
                          Concluir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
