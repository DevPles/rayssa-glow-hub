import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, ShoppingBag, Trash2, CreditCard, Lock, Sparkles, QrCode, Landmark, Banknote, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import { useFaturamento } from "@/contexts/FaturamentoContext";
import { sendWhatsAppNotification, buildPurchaseMessage } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

const formatPrice = (value: number) =>
  value === 0 ? "Gratuito" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getComboDiscount = (totalItems: number) => {
  if (totalItems >= 4) return { percent: 15, label: "15% — Combo Premium" };
  if (totalItems >= 3) return { percent: 10, label: "10% — Combo Especial" };
  if (totalItems >= 2) return { percent: 5, label: "5% — Combo Duo" };
  return null;
};

type PaymentMethod = "cartao" | "pix" | "presencial";

const paymentMethods = [
  { value: "cartao" as const, label: "Cartão de Crédito", icon: CreditCard },
  { value: "pix" as const, label: "PIX", icon: QrCode },
  { value: "presencial" as const, label: "Pagar na hora", icon: Banknote },
];

interface PixResult {
  qr_code: string;
  qr_code_base64: string;
  ticket_url?: string;
  payment_id: number;
}

const FloatingCart = () => {
  const { cart, cartOpen, setCartOpen, updateQty, removeFromCart, totalItems, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addPurchaseNotification } = useBooking();
  const { addRevenue } = useFaturamento();
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cartao");
  const [processing, setProcessing] = useState(false);
  const [pixResult, setPixResult] = useState<PixResult | null>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);

  const discount = getComboDiscount(totalItems);
  const discountValue = discount ? subtotal * (discount.percent / 100) : 0;
  const total = subtotal - discountValue;

  const handleCheckout = () => {
    if (!user) {
      setCartOpen(false);
      toast({ title: "Faça login para continuar", description: "Você precisa estar logado para finalizar a compra." });
      navigate("/login");
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const registerSaleLocally = () => {
    const methodLabel = paymentMethods.find(m => m.value === paymentMethod)?.label || paymentMethod;
    const itemsSummary = cart.map(i => `${i.product.title} (x${i.qty})`).join(", ");

    addPurchaseNotification(
      `🛒 Nova compra de ${user?.name || "Cliente"}: ${itemsSummary} — ${formatPrice(total)} via ${methodLabel}`
    );

    const today = new Date().toISOString().slice(0, 10);
    cart.forEach((item) => {
      const isProduct = item.product.duration === "—";
      addRevenue({
        description: `${item.product.title} (x${item.qty}) — ${user?.name || "Cliente"}`,
        type: isProduct ? "produto" : "servico",
        amount: item.product.price * item.qty,
        date: today,
      });
    });

    sendWhatsAppNotification({
      message: buildPurchaseMessage({
        clientName: user?.name || "Cliente",
        items: cart.map(i => `${i.product.title} (x${i.qty})`),
        total: formatPrice(total),
      }),
      type: "compra",
      metadata: { clientName: user?.name, items: itemsSummary, total, paymentMethod: methodLabel },
    });
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // 1. Create invoice in DB
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          type: "product",
          status: "pending",
          amount: total,
          payment_method: paymentMethod,
          description: cart.map(i => `${i.product.title} (x${i.qty})`).join(", "),
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        } as any)
        .select()
        .single();

      if (invErr || !invoice) {
        throw new Error(invErr?.message || "Erro ao criar fatura");
      }

      if (paymentMethod === "pix") {
        // PIX: generate QR code via edge function
        const { data, error } = await supabase.functions.invoke("mercadopago", {
          body: {
            action: "create_pix_payment",
            invoice_id: invoice.id,
            amount: total,
            description: `Compra: ${cart.map(i => i.product.title).join(", ")}`,
            payer: {
              email: user?.email || "",
              first_name: user?.name?.split(" ")[0] || "",
              last_name: user?.name?.split(" ").slice(1).join(" ") || "",
            },
          },
        });

        if (error || data?.error) {
          throw new Error(data?.error || error?.message || "Erro ao gerar PIX");
        }

        setPixResult({
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          ticket_url: data.ticket_url,
          payment_id: data.id,
        });
        setCheckoutOpen(false);
        setPixDialogOpen(true);
        registerSaleLocally();
        clearCart();
        toast({ title: "PIX gerado!", description: "Escaneie o QR Code ou copie o código para pagar." });

      } else if (paymentMethod === "cartao") {
        // Card: create Checkout Pro preference and redirect
        const { data, error } = await supabase.functions.invoke("mercadopago", {
          body: {
            action: "create_preference",
            invoice_id: invoice.id,
            items: cart.map(i => ({
              title: i.product.title,
              quantity: i.qty,
              unit_price: i.product.price,
            })),
            payer: {
              email: user?.email || "",
              name: user?.name || "",
            },
          },
        });

        if (error || data?.error) {
          throw new Error(data?.error || error?.message || "Erro ao criar link de pagamento");
        }

        registerSaleLocally();
        clearCart();
        setCheckoutOpen(false);
        // Redirect to MP checkout
        const checkoutUrl = data.init_point || data.sandbox_init_point;
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank");
          toast({ title: "Redirecionando para pagamento", description: "Complete o pagamento na janela aberta." });
        }

      } else if (paymentMethod === "presencial") {
        // In person: just register
        registerSaleLocally();
        clearCart();
        setCheckoutOpen(false);
        toast({ title: "✅ Reserva realizada!", description: `Total: ${formatPrice(total)} — Pague no local.` });
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({ title: "Erro no pagamento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixResult?.qr_code) {
      navigator.clipboard.writeText(pixResult.qr_code);
      toast({ title: "Código PIX copiado!" });
    }
  };

  return (
    <>
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-heading text-xl">Seu Carrinho</SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Carrinho vazio.<br />
                <span className="text-sm">Adicione serviços ou produtos do catálogo.</span>
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex flex-col gap-2 bg-muted/50 rounded-xl p-3">
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-sm text-foreground">{item.product.title}</p>
                        {item.product.origin && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.product.origin}</span>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.product.description}</p>
                        <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.product.price)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1 bg-background rounded-lg border border-border">
                          <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-muted rounded-l-lg transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-muted rounded-r-lg transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {item.product.benefits && item.product.benefits.length > 0 && (
                      <div className="bg-primary/5 rounded-lg px-3 py-2 space-y-1">
                        <p className="text-[10px] font-heading font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Benefícios
                        </p>
                        <ul className="space-y-0.5">
                          {item.product.benefits.slice(0, 3).map((b, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                              {b}
                            </li>
                          ))}
                          {item.product.benefits.length > 3 && (
                            <li className="text-[10px] text-muted-foreground/70">+{item.product.benefits.length - 3} mais</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary font-medium">{discount.label}</span>
                    <span className="text-primary font-semibold">-{formatPrice(discountValue)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-heading font-bold text-foreground">Total</span>
                  <span className="font-heading font-bold text-xl text-foreground">{formatPrice(total)}</span>
                </div>
                <Button
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full py-3 text-base shadow-md shadow-secondary/20"
                  onClick={handleCheckout}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Finalizar Pedido
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Pagamento Seguro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{totalItems} item(ns)</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-sm">
                  <span className="text-primary">{discount.label}</span>
                  <span className="text-primary font-semibold">-{formatPrice(discountValue)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-heading font-bold">Total</span>
                <span className="font-heading font-bold text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="font-heading text-sm font-semibold">Forma de Pagamento</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.value;
                  return (
                    <label
                      key={method.value}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 cursor-pointer transition-all text-center ${
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value={method.value} className="sr-only" />
                      <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : ""}`} />
                      <span className="font-heading font-medium text-[11px] leading-tight">{method.label}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {paymentMethod === "pix" && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-2">
                <QrCode className="h-10 w-10 mx-auto text-primary" />
                <p className="text-sm font-heading font-semibold text-foreground">Pagamento via PIX</p>
                <p className="text-xs text-muted-foreground">Ao confirmar, o QR Code PIX será gerado via Mercado Pago.</p>
              </div>
            )}

            {paymentMethod === "cartao" && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-2">
                <CreditCard className="h-10 w-10 mx-auto text-primary" />
                <p className="text-sm font-heading font-semibold text-foreground">Checkout Mercado Pago</p>
                <p className="text-xs text-muted-foreground">Você será redirecionado para o checkout seguro do Mercado Pago com todas as opções de cartão e parcelamento.</p>
              </div>
            )}

            {paymentMethod === "presencial" && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-2">
                <Banknote className="h-10 w-10 mx-auto text-primary" />
                <p className="text-sm font-heading font-semibold text-foreground">Pagamento Presencial</p>
                <p className="text-xs text-muted-foreground">Pague diretamente no local. Aceitamos dinheiro, cartão e PIX presencial.</p>
              </div>
            )}

            <Button
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full py-3 text-base shadow-md shadow-secondary/20"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                  Processando...
                </span>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {paymentMethod === "presencial"
                    ? `Reservar ${formatPrice(total)}`
                    : paymentMethod === "pix"
                    ? `Gerar PIX ${formatPrice(total)}`
                    : `Pagar ${formatPrice(total)}`}
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Pagamento processado pelo Mercado Pago
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIX Result Dialog */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              PIX Gerado
            </DialogTitle>
          </DialogHeader>
          {pixResult && (
            <div className="space-y-4 text-center">
              {pixResult.qr_code_base64 && (
                <img
                  src={`data:image/png;base64,${pixResult.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto rounded-xl border border-border"
                />
              )}
              <p className="text-sm text-muted-foreground">Escaneie o QR Code com o app do seu banco</p>
              
              {pixResult.qr_code && (
                <div className="space-y-2">
                  <p className="text-xs font-heading font-semibold text-foreground">Ou copie o código PIX:</p>
                  <div className="bg-muted rounded-lg p-2 text-[10px] font-mono break-all max-h-20 overflow-y-auto text-muted-foreground">
                    {pixResult.qr_code}
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={copyPixCode}>
                    <Copy className="h-3 w-3" /> Copiar código
                  </Button>
                </div>
              )}

              {pixResult.ticket_url && (
                <a href={pixResult.ticket_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="gap-2 text-primary">
                    <ExternalLink className="h-3 w-3" /> Ver comprovante
                  </Button>
                </a>
              )}

              <p className="text-[10px] text-muted-foreground">O pagamento será confirmado automaticamente.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingCart;
