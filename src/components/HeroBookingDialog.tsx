import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

import { useBooking } from "@/contexts/BookingContext";
import { useAvailability } from "@/contexts/AvailabilityContext";
import { cn } from "@/lib/utils";
import { sendWhatsAppNotification, buildBookingMessage } from "@/lib/whatsapp";
import { useRef } from "react";

interface HeroBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModalBubbles = () => {
  const particles = useRef(
    Array.from({ length: 18 }, () => ({
      x: Math.random() * 100,
      size: Math.random() * 5 + 2,
      duration: Math.random() * 12 + 14,
      delay: Math.random() * 14,
      opacity: Math.random() * 0.4 + 0.15,
      isPink: Math.random() > 0.35,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl z-0" aria-hidden="true">
      {particles.current.map((p, i) => (
        <span
          key={i}
          className="absolute animate-bubble"
          style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            borderRadius: "50%",
            background: p.isPink
              ? `hsla(330, 70%, 85%, 0.9)`
              : `hsla(40, 65%, 78%, 0.9)`,
            boxShadow: p.isPink
              ? `0 0 ${p.size * 3}px ${p.size}px hsla(330, 70%, 85%, 0.4)`
              : `0 0 ${p.size * 3}px ${p.size}px hsla(40, 65%, 78%, 0.4)`,
            filter: `blur(${p.size * 0.3}px)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

const HeroBookingDialog = ({ open, onOpenChange }: HeroBookingDialogProps) => {
  const { addBooking } = useBooking();
  const { isDateAvailable, getAvailableTimesForDate } = useAvailability();
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({ title: "Descreva o que deseja", variant: "destructive" });
      return;
    }
    if (!phone.trim() || !email.trim()) {
      toast({ title: "Preencha telefone e e-mail", variant: "destructive" });
      return;
    }
    if (!date || !time) {
      toast({ title: "Selecione data e horário", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Preencha seu nome", variant: "destructive" });
      return;
    }

    addBooking({
      serviceId: "consulta-livre",
      serviceTitle: description.trim(),
      servicePage: "consulta",
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      date: format(date, "yyyy-MM-dd"),
      time,
      notes: "",
      price: 0,
    });

    // Send WhatsApp notification to admin
    sendWhatsAppNotification({
      message: buildBookingMessage({
        clientName: name,
        serviceTitle: description.trim(),
        date: format(date, "dd/MM/yyyy"),
        time,
        phone,
      }),
      type: "agendamento",
      metadata: { clientName: name, serviceTitle: description.trim(), date: format(date, "yyyy-MM-dd"), time, email },
    });

    setSuccess(true);
    toast({ title: "Agendamento enviado!", description: `Para ${format(date, "dd/MM/yyyy")} às ${time}` });
  };

  const handleClose = () => {
    setSuccess(false);
    setDescription("");
    setDate(undefined);
    setTime("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white/85 backdrop-blur-xl border border-white/40 shadow-2xl overflow-y-auto max-h-[90vh]">
        <ModalBubbles />
        <div className="relative z-10">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {success ? "Agendamento Enviado!" : "Agendar Consulta"}
            </DialogTitle>
            <DialogDescription className="sr-only">Agendar consulta</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mx-auto backdrop-blur-sm border border-secondary/20">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground text-lg">{description}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {date && format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {time}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">O administrador foi notificado e entrará em contato para confirmar.</p>
              <Button onClick={handleClose} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading px-8">
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-5 mt-2">
              {/* Name */}
              <div className="space-y-2">
                <Label className="font-heading text-sm">Seu nome</Label>
                <Input
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-11 bg-background/50 backdrop-blur-sm border-white/20"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="font-heading text-sm">O que você procura? *</Label>
                <Textarea
                  placeholder="Descreva o procedimento ou consulta que deseja. Ex: Quero fazer uma avaliação facial, tenho interesse em harmonização..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl min-h-[80px] bg-background/50 backdrop-blur-sm border-white/20"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="font-heading text-sm">Data preferida *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal rounded-xl h-11 bg-background/50 backdrop-blur-sm border-white/20", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Selecione uma data disponível"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => { setDate(d); setTime(""); }}
                      disabled={(d) => d < new Date() || !isDateAvailable(d)}
                      locale={ptBR}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-[10px] text-muted-foreground">Apenas datas com disponibilidade são selecionáveis</p>
              </div>

              {/* Time grid */}
              <div className="space-y-2">
                <Label className="font-heading text-sm">Horário disponível *</Label>
                {date ? (
                  <div className="grid grid-cols-4 gap-2">
                    {getAvailableTimesForDate(format(date, "yyyy-MM-dd")).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={cn(
                          "py-2 rounded-lg text-sm font-heading transition-all border",
                          time === t
                            ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                            : "border-white/20 text-muted-foreground hover:border-primary/30 hover:text-foreground bg-background/30 backdrop-blur-sm"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-3 text-center bg-background/30 backdrop-blur-sm rounded-xl border border-white/10">
                    Selecione uma data para ver os horários
                  </p>
                )}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="font-heading text-sm">Telefone *</Label>
                  <Input
                    placeholder="(11) 99999-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl h-11 bg-background/50 backdrop-blur-sm border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-sm">E-mail *</Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl h-11 bg-background/50 backdrop-blur-sm border-white/20"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1 rounded-full font-heading border-white/20 bg-background/30 backdrop-blur-sm">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20"
                >
                  Enviar Agendamento
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeroBookingDialog;
