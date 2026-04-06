import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import loginSide from "@/assets/estetica-hero.png";
import FloatingBubbles from "@/components/FloatingBubbles";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const redirectByRole = (role: string) => {
    switch (role) {
      case "super_admin":
      case "admin": navigate("/admin"); break;
      case "afiliada": navigate("/dashboard-afiliada"); break;
      default: navigate("/dashboard"); break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    if (isSignUp) {
      if (!name) { toast({ title: "Preencha seu nome", variant: "destructive" }); return; }
      const user = signup(name, email);
      toast({ title: "Conta criada!", description: `Bem-vindo(a), ${user.name}!` });
      redirectByRole(user.role);
    } else {
      const user = login(email, password);
      if (user) {
        toast({ title: "Login realizado!", description: `Bem-vindo(a), ${user.name}!` });
        redirectByRole(user.role);
      }
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Full-page gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(40,30%,90%)] via-[hsl(330,40%,88%)] to-[hsl(270,35%,75%)]" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[hsla(330,60%,80%,0.4)] blur-[100px] animate-[float-blob1_18s_ease-in-out_infinite] top-[-10%] right-[-10%]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[hsla(270,50%,70%,0.35)] blur-[120px] animate-[float-blob2_22s_ease-in-out_infinite] bottom-[10%] left-[-5%]" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-[hsla(40,50%,80%,0.4)] blur-[90px] animate-[float-blob3_20s_ease-in-out_infinite] top-[40%] right-[20%]" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[hsla(330,50%,75%,0.3)] blur-[110px] animate-[float-blob4_25s_ease-in-out_infinite] top-[60%] left-[30%]" />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-[hsla(270,40%,80%,0.3)] blur-[80px] animate-[float-blob5_16s_ease-in-out_infinite] top-[10%] left-[40%]" />
      </div>
      <FloatingBubbles count={18} />
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-[45%] relative z-10 overflow-hidden rounded-r-[3rem]">
        <img
          src={loginSide}
          alt="Rayssa Leslie Estética"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/10" />
        <div className="absolute top-10 left-10">
          <img src={logo} alt="RL Logo" className="w-14 h-14 object-contain drop-shadow-2xl" />
        </div>
         <div className="absolute bottom-10 left-10 right-10">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="font-heading font-bold text-white text-2xl mb-2 tracking-tight">LeMater</h2>
            <p className="text-white/70 text-sm leading-relaxed">Sistema de Experiência Exclusiva de Parto — Acompanhamento gestacional completo e personalizado</p>
            <div className="flex gap-2 mt-4">
              <span className="bg-white/15 text-white/80 text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">Pré-Natal</span>
              <span className="bg-white/15 text-white/80 text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">Gestação</span>
              <span className="bg-white/15 text-white/80 text-[10px] px-3 py-1 rounded-full backdrop-blur-sm">Parto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-[55%] flex flex-col relative z-10">
        <div className="relative z-10 flex flex-col flex-1">
        <div className="px-8 py-6">
          <Link to="/">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full shadow-md shadow-secondary/20">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao site
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 pb-12">
          <div className="w-full max-w-md space-y-8 bg-card/85 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-border/40 shadow-xl">
            {/* Logo mobile */}
            <div className="text-center space-y-3">
              <img src={logo} alt="RL Logo" className="w-16 h-16 object-contain mx-auto lg:hidden drop-shadow-md" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
                  {isSignUp ? "Criar conta" : "Bem-vinda de volta"}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {isSignUp ? "Preencha seus dados para começar" : "Acesse sua área exclusiva"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-heading text-sm font-medium">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-12 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-heading text-sm font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-12 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-heading text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl h-12 pr-12 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {!isSignUp && (
                <div className="text-right">
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-foreground/70 hover:text-primary hover:underline font-medium">Esqueceu a senha?</button>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full h-12 text-base shadow-lg shadow-secondary/25 transition-all hover:shadow-xl hover:shadow-secondary/30 hover:scale-[1.01]"
              >
                {isSignUp ? "Criar conta" : "Entrar"}
              </Button>
            </form>

            {!isSignUp && (
              <div className="bg-muted/40 backdrop-blur-sm rounded-2xl p-4 text-[11px] text-muted-foreground space-y-1 border border-border/30">
                <p className="font-heading font-semibold text-foreground text-xs mb-1.5">Contas de teste:</p>
                <p><strong>Super Admin:</strong> superadmin@sistema.com</p>
                <p><strong>Admin:</strong> admin@123.com</p>
                <p><strong>Afiliada:</strong> ana@email.com</p>
                <p><strong>Cliente:</strong> maria@email.com</p>
                <p className="text-[10px] mt-1.5 opacity-70">Senha: qualquer valor</p>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-sm text-foreground/70">
                {isSignUp ? "Já tem uma conta?" : "Não tem conta?"}{" "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-secondary font-bold hover:underline">
                  {isSignUp ? "Fazer login" : "Cadastre-se"}
                </button>
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
      <ForgotPasswordDialog open={showForgotPassword} onOpenChange={setShowForgotPassword} />
    </div>
  );
};

export default Login;
