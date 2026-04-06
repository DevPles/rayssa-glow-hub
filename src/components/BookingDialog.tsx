import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import { cn } from "@/lib/utils";
import { sendWhatsAppNotification, buildBookingMessage } from "@/lib/whatsapp";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceTitle: string;
  servicePage: string;
  servicePrice: number;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

const BookingDialog = ({ open, onOpenChange, serviceId, serviceTitle, servicePage, servicePrice }: BookingDialogProps) => {
  const { user } = useAuth();
  const { addBooking } = useBooking();
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!date || !time) {
      toast({ title: "Selecione data e horário", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Faça login para agendar", variant: "destructive" });
      return;
    }

    addBooking({
      serviceId,
      serviceTitle,
      servicePage,
      clientName: user.name,
      clientEmail: user.email,
      clientPhone: phone,
      date: format(date, "yyyy-MM-dd"),
      time,
      notes,
      price: servicePrice,
    });

    // Send WhatsApp notification to admin
    sendWhatsAppNotification({
      message: buildBookingMessage({
        clientName: user.name,
        serviceTitle,
        date: format(date, "dd/MM/yyyy"),
        time,
        phone,
      }),
      type: "agendamento",
      metadata: { clientName: user.name, serviceTitle, date: format(date, "yyyy-MM-dd"), time, email: user.email },
    });

    setSuccess(true);
    toast({ title: "Agendamento realizado!", description: `${serviceTitle} em ${format(date, "dd/MM/yyyy")} às ${time}` });
  };

  const handleClose = () => {
    setSuccess(false);
    setDate(undefined);
    setTime("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{success ? "Agendamento Confirmado!" : "Agendar Serviço"}</DialogTitle>
          <DialogDescription className="sr-only">Agendar {serviceTitle}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-lg">{serviceTitle}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {date && format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {time}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Você receberá a confirmação em breve. O administrador foi notificado.</p>
            <Button onClick={handleClose} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading px-8">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="font-heading font-semibold text-sm text-foreground">{serviceTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {servicePrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>

            {/* Date picker */}
            <div className="space-y-2">
              <Label className="font-heading text-sm">Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal rounded-xl h-11", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date() || d.getDay() === 0}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label className="font-heading text-sm">Horário *</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="font-heading text-sm">Telefone</Label>
              <Input
                placeholder="(11) 99999-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="font-heading text-sm">Observações</Label>
              <Textarea
                placeholder="Alguma observação especial?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl min-h-[60px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 rounded-full font-heading">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
