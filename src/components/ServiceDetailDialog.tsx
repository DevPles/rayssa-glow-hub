import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, CalendarPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BookingDialog from "@/components/BookingDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface DetailItem {
  id: string;
  title: string;
  description: string;
  benefits?: string[];
  price: number;
  duration?: string;
  page?: string;
}

interface ServiceDetailDialogProps {
  item: DetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: DetailItem) => void;
  isInCart: boolean;
  accentColor?: "primary" | "accent";
}

const mediaItems = [
  { type: "image" as const, src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop" },
  { type: "image" as const, src: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=300&fit=crop" },
  { type: "image" as const, src: "https://images.unsplash.com/photo-1519823551278-64ac92734314?w=400&h=300&fit=crop" },
  { type: "video" as const, src: "" },
];

const formatPrice = (value: number) =>
  value === 0 ? "Gratuito" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ServiceDetailDialog = ({ item, open, onOpenChange, onAddToCart, isInCart, accentColor = "primary" }: ServiceDetailDialogProps) => {
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!item) return null;

  const accent = accentColor === "accent" ? "accent" : "primary";
  const current = mediaItems[selectedMedia];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{item.title}</DialogTitle>
          <DialogDescription className="sr-only">Detalhes do serviço {item.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Media gallery */}
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
              {current.type === "image" ? (
                <img src={current.src} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-heading font-medium text-muted-foreground">Vídeo do procedimento</p>
                  <p className="text-xs text-muted-foreground mt-1">Em breve</p>
                </div>
              )}
              <Badge className={`absolute top-3 left-3 bg-${accent}/90 text-${accent}-foreground font-heading text-xs`}>
                {formatPrice(item.price)}
              </Badge>
              {item.duration && (
                <Badge variant="outline" className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm text-foreground border-white/20 font-heading text-xs">
                  {item.duration}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {mediaItems.map((media, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMedia(i)}
                  className={`relative rounded-lg overflow-hidden w-20 h-14 border-2 transition-all ${
                    selectedMedia === i ? `border-${accent} shadow-md` : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {media.type === "image" ? (
                    <img src={media.src} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-foreground">Sobre o procedimento</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
          </div>

          {/* Benefits */}
          {item.benefits && item.benefits.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <h4 className="font-heading font-semibold text-sm text-foreground">Benefícios</h4>
              <ul className="space-y-1.5">
                {item.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full bg-${accent} flex-shrink-0`} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col gap-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-heading font-bold text-foreground">{formatPrice(item.price)}</p>
                {item.duration && <p className="text-xs text-muted-foreground">{item.duration}</p>}
              </div>
              <Button
                onClick={() => { onAddToCart(item); }}
                className={`rounded-full font-heading px-6 ${
                  isInCart
                    ? `bg-${accent}/15 text-${accent} hover:bg-${accent}/25 border border-${accent}/30`
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md shadow-secondary/20"
                }`}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {item.price === 0 ? "Saiba mais" : isInCart ? "Adicionar mais 1" : "Adicionar ao carrinho"}
              </Button>
            </div>
            {item.duration && item.duration !== "—" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (!user) {
                    toast({ title: "Faça login para agendar", description: "Você precisa estar logado para agendar.", variant: "destructive" });
                    navigate("/login");
                    return;
                  }
                  setBookingOpen(true);
                }}
                className="w-full rounded-full font-heading border-primary/30 text-primary hover:bg-primary/5"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Agendar este serviço
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {item && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          serviceId={item.id}
          serviceTitle={item.title}
          servicePage={item.page || ""}
          servicePrice={item.price}
        />
      )}
    </Dialog>
  );
};

export default ServiceDetailDialog;
