import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Phone, Mail, Lock, MessageCircle, CheckCircle2 } from "lucide-react";

type Step = "email" | "verify" | "newPassword" | "support" | "success";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WHATSAPP_NUMBER = "5511960611112";
const WHATSAPP_DISPLAY = "(11) 96061-1112";

const ForgotPasswordDialog = ({ open, onOpenChange }: Props) => {
  const { users, updateUser } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");

  const reset = () => {
    setStep("email");
    setEmail("");
    setPhone("");
    setNewPassword("");
    setConfirmPassword("");
    setFoundUserId(null);
    setMaskedPhone("");
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const maskPhone = (p: string) => {
    if (!p || p.length < 6) return "****";
    return p.slice(0, 5) + "****-" + p.slice(-2);
  };

  const handleEmailSubmit = () => {
    if (!email) {
      toast({ title: "Informe seu e-mail", variant: "destructive" });
      return;
    }
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      toast({ title: "E-mail não encontrado", description: "Verifique o e-mail ou entre em contato com o suporte.", variant: "destructive" });
      return;
    }
    if (!user.phone) {
      setStep("support");
      return;
    }
    setFoundUserId(user.id);
    setMaskedPhone(maskPhone(user.phone));
    setStep("verify");
  };

  const handleVerifyPhone = () => {
    if (!phone) {
      toast({ title: "Informe o número de celular", variant: "destructive" });
      return;
    }
    const user = users.find((u) => u.id === foundUserId);
    const normalize = (s: string) => s.replace(/\D/g, "");
    if (user && normalize(user.phone) === normalize(phone)) {
      setStep("newPassword");
    } else {
      toast({ title: "Número incorreto", description: "Você pode tentar novamente ou entrar em contato com o suporte.", variant: "destructive" });
      setStep("support");
    }
  };

  const handleUpdatePassword = () => {
    if (!newPassword || newPassword.length < 4) {
      toast({ title: "A senha deve ter no mínimo 4 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (foundUserId) {
      updateUser(foundUserId, { password: newPassword });
      setStep("success");
      toast({ title: "Senha atualizada com sucesso!" });
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Olá! Preciso de ajuda para recuperar minha senha. Meu e-mail é: ${encodeURIComponent(email)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card/80 backdrop-blur-xl border-white/20 rounded-3xl max-w-md shadow-2xl overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[hsla(330,60%,80%,0.25)] blur-[60px] -top-10 -right-10" />
          <div className="absolute w-[150px] h-[150px] rounded-full bg-[hsla(270,50%,70%,0.2)] blur-[50px] -bottom-5 -left-5" />
        </div>

        <div className="relative z-10">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-center">
              {step === "email" && "Recuperar senha"}
              {step === "verify" && "Verificar celular"}
              {step === "newPassword" && "Nova senha"}
              {step === "support" && "Contato com suporte"}
              {step === "success" && "Senha atualizada!"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            {/* Step: Email */}
            {step === "email" && (
              <>
                <p className="text-sm text-foreground/70 text-center">
                  Informe o e-mail cadastrado para recuperar sua senha.
                </p>
                <div className="space-y-2">
                  <Label className="font-heading text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" /> E-mail
                  </Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                    className="rounded-xl h-12 bg-background/50 backdrop-blur-sm border-white/20"
                  />
                </div>
                <Button
                  onClick={handleEmailSubmit}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full h-12"
                >
                  Continuar
                </Button>
              </>
            )}

            {/* Step: Verify phone */}
            {step === "verify" && (
              <>
                <p className="text-sm text-foreground/70 text-center">
                  Para confirmar sua identidade, informe o número de celular cadastrado.
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Dica: o número termina em <strong className="text-foreground">{maskedPhone}</strong>
                </p>
                <div className="space-y-2">
                  <Label className="font-heading text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Celular
                  </Label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyPhone()}
                    className="rounded-xl h-12 bg-background/50 backdrop-blur-sm border-white/20"
                  />
                </div>
                <Button
                  onClick={handleVerifyPhone}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full h-12"
                >
                  Verificar
                </Button>
                <button
                  onClick={() => setStep("email")}
                  className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" /> Voltar
                </button>
              </>
            )}

            {/* Step: New password */}
            {step === "newPassword" && (
              <>
                <p className="text-sm text-foreground/70 text-center">
                  Identidade confirmada! Crie sua nova senha.
                </p>
                <div className="space-y-2">
                  <Label className="font-heading text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Nova senha
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl h-12 bg-background/50 backdrop-blur-sm border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Confirmar senha
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                    className="rounded-xl h-12 bg-background/50 backdrop-blur-sm border-white/20"
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full h-12"
                >
                  Atualizar senha
                </Button>
              </>
            )}

            {/* Step: Support */}
            {step === "support" && (
              <>
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto">
                    <MessageCircle className="h-7 w-7 text-secondary" />
                  </div>
                  <p className="text-sm text-foreground/70">
                    Não foi possível verificar sua identidade. Entre em contato com nosso suporte pelo WhatsApp para recuperar sua senha.
                  </p>
                </div>
                <Button
                  onClick={openWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-heading rounded-full h-12 gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp {WHATSAPP_DISPLAY}
                </Button>
                <button
                  onClick={() => { reset(); setStep("email"); }}
                  className="flex items-center gap-1 text-xs text-foreground/60 hover:text-foreground mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" /> Tentar novamente
                </button>
              </>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-sm text-foreground/70">
                  Sua senha foi atualizada com sucesso! Agora você pode fazer login com a nova senha.
                </p>
                <Button
                  onClick={() => handleClose(false)}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full h-12"
                >
                  Fazer login
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
