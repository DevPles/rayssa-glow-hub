import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import OrbitalClouds from "@/components/OrbitalClouds";
import { useBooking } from "@/contexts/BookingContext";
import { useCart } from "@/contexts/CartContext";
import { useEffect } from "react";

const adminCards = [
  { key: "registro_clinico", label: "Registro Clínico", description: "Prontuários e fichas de atendimento", route: "/admin/registro-clinico" },
  { key: "pops", label: "POP's", description: "Procedimentos operacionais padrão", route: "/admin/pops" },
  { key: "servicos", label: "Serviços", description: "Catálogo de serviços e procedimentos", route: "/admin/servicos" },
  { key: "estoque", label: "Estoque", description: "Controle de produtos e materiais", route: "/admin/estoque" },
  { key: "financeiro", label: "Financeiro", description: "Faturamento e relatórios financeiros", route: "/admin/financeiro" },
  { key: "agendamentos", label: "Agendamentos", description: "Solicitações e confirmações", route: "/admin/agendamentos" },
  { key: "agenda", label: "Agenda", description: "Calendário e horários disponíveis", route: "/admin/agenda" },
  { key: "blog", label: "Blog", description: "Publicações e conteúdos", route: "/admin/blog" },
  { key: "usuarios", label: "Usuários", description: "Gestão de contas e permissões", route: "/admin/usuarios" },
  { key: "parcerias", label: "Parcerias", description: "Clínicas, laboratórios e profissionais parceiros", route: "/admin/parcerias" },
  { key: "suporte", label: "Suporte", description: "Mensagens e atendimento ao cliente", route: "/admin/suporte" },
  { key: "sistema", label: "ADM Sistema", description: "Gestão de clientes e configurações do sistema", route: "/admin/sistema", superAdminOnly: true },
];

const Admin = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useBooking();
  const { setCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin" && user.role !== "super_admin") navigate("/dashboard");
  }, [user, navigate]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return null;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(40,35%,93%)] via-[hsl(38,30%,90%)] to-[hsl(35,25%,85%)]" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[hsla(38,40%,85%,0.4)] blur-[100px] animate-[float-blob1_18s_ease-in-out_infinite] top-[-10%] right-[-10%]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[hsla(330,30%,85%,0.25)] blur-[120px] animate-[float-blob2_22s_ease-in-out_infinite] bottom-[10%] left-[-5%]" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-[hsla(40,45%,82%,0.4)] blur-[90px] animate-[float-blob3_20s_ease-in-out_infinite] top-[40%] right-[20%]" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[hsla(35,35%,80%,0.3)] blur-[110px] animate-[float-blob4_25s_ease-in-out_infinite] top-[60%] left-[30%]" />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-[hsla(40,30%,85%,0.3)] blur-[80px] animate-[float-blob5_16s_ease-in-out_infinite] top-[10%] left-[40%]" />
      </div>
      <OrbitalClouds />

      {/* Header */}
      <div className="relative z-10 bg-card/60 backdrop-blur-xl border-b border-border/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button size="icon" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button size="icon" onClick={() => setCartOpen(true)} className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-9 w-9 sm:h-10 sm:w-10"><ShoppingBag className="h-4 w-4" /></Button>
            <Button onClick={handleLogout} className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10"><LogOut className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Sair</span></Button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {adminCards.filter((card) => !(card as any).superAdminOnly || user.role === "super_admin").map((card) => {
            const hasNotification = card.key === "agendamentos" && unreadCount > 0;

            return (
              <Link key={card.key} to={card.route} className="group">
                <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-lg shadow-black/5 hover:bg-white/60 hover:shadow-2xl hover:shadow-secondary/15 hover:border-white/70 transition-all duration-300 hover:-translate-y-1 h-full">
                  {hasNotification && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
                  )}
                  <h3 className="font-heading font-bold text-foreground text-base mb-1.5 group-hover:text-secondary transition-colors">
                    {card.label}
                    {hasNotification && (
                      <span className="ml-2 text-[10px] font-heading text-destructive">({unreadCount})</span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Admin;
