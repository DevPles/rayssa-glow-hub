import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, CreditCard, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useServices } from "@/contexts/ServicesContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const formatPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AffiliateCheckout = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("p");
  const { services } = useServices();

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [loading, setLoading] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);

  const product = services.find(s => s.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-4xl">🔍</p>
            <h2 className="font-heading font-bold text-lg text-foreground">Produto não encontrado</h2>
            <p className="text-sm text-muted-foreground">O link pode estar incorreto ou o produto não está mais disponível.</p>
            <Link to="/">
              <Button className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Ir para o site
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!payerName || !payerEmail) {
      toast({ title: "Preencha seu nome e e-mail", variant: "destructive" });
      return;
    }

    setLoading(true);
    setPixData(null);

    try {
      // Create invoice first
      const { data: invoice, error: invError } = await supabase.from("invoices").insert({
        type: "product",
        status: "pending",
        amount: product.price,
        description: `${product.title} (Afiliada: ${code})`,
        payment_method: paymentMethod,
        metadata: {
          affiliate_code: code,
          product_id: product.id,
          product_title: product.title,
          payer_name: payerName,
          payer_email: payerEmail,
        },
      }).select().single();

      if (invError) throw invError;

      const action = paymentMethod === "pix" ? "create_pix_payment" : "create_card_payment";

      const { data, error } = await supabase.functions.invoke("mercadopago", {
        body: {
          action,
          invoice_id: invoice.id,
          amount: product.price,
          description: `${product.title} - via Afiliada ${code}`,
          payer: {
            email: payerEmail,
            first_name: payerName.split(" ")[0],
            last_name: payerName.split(" ").slice(1).join(" ") || "",
          },
        },
      });

      if (error) throw error;

      if (paymentMethod === "pix" && data?.qr_code) {
        setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64 });
        toast({ title: "PIX gerado!", description: "Escaneie o QR Code ou copie o código." });
      } else if (paymentMethod === "credit_card" && data?.init_point) {
        window.location.href = data.init_point;
      } else {
        toast({ title: "Pagamento processado", description: "Verifique o status." });
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({ title: "Erro ao processar pagamento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="ghost" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading font-bold text-lg text-foreground">Checkout</h1>
            {code && <p className="text-xs text-muted-foreground">Indicação: {code}</p>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-lg space-y-6">
        {/* Product card */}
        <Card className="border border-border/50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-foreground">{product.title}</h3>
              <Badge variant="outline" className="text-xs">{product.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{product.description}</p>
            {product.benefits && product.benefits.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {product.benefits.map((b, i) => <li key={i}>✓ {b}</li>)}
              </ul>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-heading font-bold text-foreground">{formatPrice(product.price)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payer info */}
        <Card className="border border-border/50">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-foreground">Seus dados</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">Nome completo</Label>
                <Input placeholder="Seu nome" value={payerName} onChange={e => setPayerName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-heading">E-mail</Label>
                <Input type="email" placeholder="seu@email.com" value={payerEmail} onChange={e => setPayerEmail(e.target.value)} className="rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment method */}
        <Card className="border border-border/50">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-foreground">Forma de pagamento</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("pix")}
                className={`rounded-xl border p-4 text-center transition-all ${paymentMethod === "pix" ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:border-border"}`}
              >
                <QrCode className="h-6 w-6 mx-auto mb-2 text-foreground" />
                <p className="font-heading font-bold text-sm text-foreground">PIX</p>
                <p className="text-[10px] text-muted-foreground">Instantâneo</p>
              </button>
              <button
                onClick={() => setPaymentMethod("credit_card")}
                className={`rounded-xl border p-4 text-center transition-all ${paymentMethod === "credit_card" ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:border-border"}`}
              >
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-foreground" />
                <p className="font-heading font-bold text-sm text-foreground">Cartão</p>
                <p className="text-[10px] text-muted-foreground">Até 12x</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* PIX QR Code */}
        {pixData && (
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-4 text-center">
              <h3 className="font-heading font-bold text-foreground">Escaneie o QR Code</h3>
              {pixData.qr_code_base64 && (
                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" className="mx-auto w-48 h-48 rounded-lg" />
              )}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Ou copie o código PIX:</p>
                <div className="bg-background rounded-lg p-3 text-xs break-all font-mono text-foreground border">{pixData.qr_code}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => { navigator.clipboard.writeText(pixData.qr_code); toast({ title: "Código PIX copiado!" }); }}
                >
                  Copiar código
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pay button */}
        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full rounded-full font-heading text-sm bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingBag className="h-4 w-4 mr-2" />}
          {loading ? "Processando..." : `Pagar ${formatPrice(product.price)}`}
        </Button>
      </div>
    </div>
  );
};

export default AffiliateCheckout;
