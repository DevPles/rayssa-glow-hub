import { Package, Truck, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface OrderTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: number;
    date: string;
    service: string;
    value: string;
    status: string;
    trackingCode?: string;
  } | null;
}

const trackingSteps = [
  { label: "Pedido confirmado", icon: CheckCircle2, done: true },
  { label: "Em preparação", icon: Package, done: true },
  { label: "Enviado", icon: Truck, done: true },
  { label: "Saiu para entrega", icon: MapPin, done: false },
  { label: "Entregue", icon: CheckCircle2, done: false },
];

const getStepsForStatus = (status: string) => {
  if (status === "Entregue") return trackingSteps.map((s) => ({ ...s, done: true }));
  if (status === "Concluído") return [
    { label: "Agendado", icon: Clock, done: true },
    { label: "Confirmado", icon: CheckCircle2, done: true },
    { label: "Realizado", icon: CheckCircle2, done: true },
  ];
  return trackingSteps;
};

const OrderTrackingDialog = ({ open, onOpenChange, order }: OrderTrackingDialogProps) => {
  if (!order) return null;

  const steps = getStepsForStatus(order.status);
  const isProduct = order.status === "Entregue";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Rastreio do Pedido</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Order Info */}
          <div className="rounded-xl bg-muted/50 p-4 space-y-1">
            <p className="font-heading font-semibold text-sm text-foreground">{order.service}</p>
            <p className="text-xs text-muted-foreground">Pedido #{order.id} • {order.date}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-heading font-bold text-foreground">{order.value}</span>
              <Badge variant="secondary" className="text-xs">{order.status}</Badge>
            </div>
            {isProduct && (
              <p className="text-xs text-primary font-heading mt-2">
                Código de rastreio: {order.trackingCode || "BR" + String(order.id).padStart(11, "0") + "YZ"}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 ${step.done ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-heading ${step.done ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingDialog;
