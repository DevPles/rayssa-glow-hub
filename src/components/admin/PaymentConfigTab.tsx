import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, Loader2, Copy, Eye, EyeOff, ShieldCheck } from "lucide-react";

interface PaymentProviderConfig {
  id?: string;
  tenant_id: string;
  provider: string;
  access_token: string;
  public_key: string;
  webhook_secret: string;
  sandbox_token: string;
  is_sandbox: boolean;
  is_active: boolean;
  enable_pix: boolean;
  enable_card: boolean;
  enable_boleto: boolean;
  enable_installments: boolean;
  max_installments: number;
  enable_recurring: boolean;
}

const defaultConfig: Omit<PaymentProviderConfig, "tenant_id"> = {
  provider: "mercadopago",
  access_token: "",
  public_key: "",
  webhook_secret: "",
  sandbox_token: "",
  is_sandbox: false,
  is_active: false,
  enable_pix: true,
  enable_card: true,
  enable_boleto: false,
  enable_installments: true,
  max_installments: 12,
  enable_recurring: false,
};

export const PaymentConfigTab = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const [config, setConfig] = useState<PaymentProviderConfig & { id?: string }>({ ...defaultConfig, tenant_id: tenantId || "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);

  const webhookUrl = tenantId
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadopago-tenant-webhook?tenant_id=${tenantId}`
    : "";

  const fetchConfig = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("payment_providers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("provider", "mercadopago")
        .maybeSingle();

      if (data) {
        setConfig({
          id: data.id,
          tenant_id: data.tenant_id,
          provider: data.provider,
          access_token: data.access_token || "",
          public_key: data.public_key || "",
          webhook_secret: data.webhook_secret || "",
          sandbox_token: data.sandbox_token || "",
          is_sandbox: data.is_sandbox,
          is_active: data.is_active,
          enable_pix: data.enable_pix,
          enable_card: data.enable_card,
          enable_boleto: data.enable_boleto,
          enable_installments: data.enable_installments,
          max_installments: data.max_installments,
          enable_recurring: data.enable_recurring,
        });
      } else {
        setConfig({ ...defaultConfig, tenant_id: tenantId });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleTestConnection = async () => {
    const token = config.is_sandbox ? config.sandbox_token : config.access_token;
    if (!token) {
      toast({ title: "Insira o Access Token antes de testar", variant: "destructive" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago", {
        body: { action: "test_connection", access_token_override: token },
      });
      if (error || data?.error) {
        setTestResult("error");
        toast({ title: "Conexão falhou", description: data?.error || error?.message, variant: "destructive" });
      } else {
        setTestResult("success");
        toast({ title: "Conexão com Mercado Pago validada!" });
      }
    } catch {
      setTestResult("error");
      toast({ title: "Erro ao testar conexão", variant: "destructive" });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!tenantId) { toast({ title: "Tenant não identificado", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        tenant_id: tenantId,
        provider: config.provider,
        access_token: config.access_token || null,
        public_key: config.public_key || null,
        webhook_secret: config.webhook_secret || null,
        sandbox_token: config.sandbox_token || null,
        is_sandbox: config.is_sandbox,
        is_active: config.is_active,
        enable_pix: config.enable_pix,
        enable_card: config.enable_card,
        enable_boleto: config.enable_boleto,
        enable_installments: config.enable_installments,
        max_installments: config.max_installments,
        enable_recurring: config.enable_recurring,
      };

      if (config.id) {
        await supabase.from("payment_providers").update(payload).eq("id", config.id);
      } else {
        const { data } = await supabase.from("payment_providers").insert(payload as any).select().single();
        if (data) setConfig((prev) => ({ ...prev, id: data.id }));
      }
      toast({ title: "Configuração salva!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "URL do Webhook copiada!" });
  };

  if (!tenantId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-heading">Tenant não vinculado</p>
        <p className="text-sm">Seu usuário precisa estar vinculado a uma clínica para configurar recebimentos.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Provider Selection */}
      <Card className="border-border/40">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg">Provedor de Pagamento</h3>
              <p className="text-sm text-muted-foreground">Configure como sua clínica recebe pagamentos</p>
            </div>
            <Badge variant={config.is_active ? "default" : "secondary"}>
              {config.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <Select value={config.provider} onValueChange={(v) => setConfig((p) => ({ ...p, provider: v }))}>
            <SelectTrigger className="rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mercadopago">Mercado Pago</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card className="border-border/40">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-heading font-bold">Credenciais Mercado Pago</h3>

          <div className="space-y-2">
            <Label>Access Token (Produção)</Label>
            <div className="flex gap-2">
              <Input
                type={showToken ? "text" : "password"}
                value={config.access_token}
                onChange={(e) => setConfig((p) => ({ ...p, access_token: e.target.value }))}
                placeholder="APP_USR-..."
                className="rounded-full font-mono text-xs"
              />
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Public Key (Produção)</Label>
            <div className="flex gap-2">
              <Input
                type={showPublicKey ? "text" : "password"}
                value={config.public_key}
                onChange={(e) => setConfig((p) => ({ ...p, public_key: e.target.value }))}
                placeholder="APP_USR-..."
                className="rounded-full font-mono text-xs"
              />
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowPublicKey(!showPublicKey)}>
                {showPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Ambiente de Teste (Sandbox)</Label>
              <p className="text-xs text-muted-foreground">Use credenciais de teste do Mercado Pago</p>
            </div>
            <Switch checked={config.is_sandbox} onCheckedChange={(v) => setConfig((p) => ({ ...p, is_sandbox: v }))} />
          </div>

          {config.is_sandbox && (
            <div className="space-y-2">
              <Label>Token Sandbox</Label>
              <Input
                type="password"
                value={config.sandbox_token}
                onChange={(e) => setConfig((p) => ({ ...p, sandbox_token: e.target.value }))}
                placeholder="TEST-..."
                className="rounded-full font-mono text-xs"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleTestConnection} disabled={testing} variant="outline" className="rounded-full">
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Testar Conexão
            </Button>
            {testResult === "success" && <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>}
            {testResult === "error" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Falhou</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="border-border/40">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-heading font-bold">Métodos de Cobrança</h3>

          <div className="flex items-center justify-between">
            <Label>PIX</Label>
            <Switch checked={config.enable_pix} onCheckedChange={(v) => setConfig((p) => ({ ...p, enable_pix: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Cartão de Crédito</Label>
            <Switch checked={config.enable_card} onCheckedChange={(v) => setConfig((p) => ({ ...p, enable_card: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Boleto</Label>
            <Switch checked={config.enable_boleto} onCheckedChange={(v) => setConfig((p) => ({ ...p, enable_boleto: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Parcelamento</Label>
            <Switch checked={config.enable_installments} onCheckedChange={(v) => setConfig((p) => ({ ...p, enable_installments: v }))} />
          </div>
          {config.enable_installments && (
            <div className="space-y-2">
              <Label>Máximo de Parcelas</Label>
              <Select value={String(config.max_installments)} onValueChange={(v) => setConfig((p) => ({ ...p, max_installments: Number(v) }))}>
                <SelectTrigger className="rounded-full w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <Label>Cobrança Recorrente</Label>
              <p className="text-xs text-muted-foreground">Assinaturas automáticas para clientes</p>
            </div>
            <Switch checked={config.enable_recurring} onCheckedChange={(v) => setConfig((p) => ({ ...p, enable_recurring: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card className="border-border/40">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-heading font-bold">Webhook</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre esta URL no painel do Mercado Pago para receber notificações de pagamento automaticamente.
          </p>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly className="rounded-full font-mono text-xs bg-muted" />
            <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={copyWebhook}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activation + Save */}
      <Card className="border-border/40">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold">Ativar Recebimentos</h3>
              <p className="text-sm text-muted-foreground">
                Ative para começar a processar pagamentos com suas credenciais
              </p>
            </div>
            <Switch checked={config.is_active} onCheckedChange={(v) => setConfig((p) => ({ ...p, is_active: v }))} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
