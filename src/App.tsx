import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ServicesProvider } from "@/contexts/ServicesContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { AvailabilityProvider } from "@/contexts/AvailabilityContext";
import { BlogProvider } from "@/contexts/BlogContext";
import { SupportProvider } from "@/contexts/SupportContext";
import { ClinicalRecordProvider } from "@/contexts/ClinicalRecordContext";
import { POPProvider } from "@/contexts/POPContext";
import { FaturamentoProvider } from "@/contexts/FaturamentoContext";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import FloatingCart from "@/components/FloatingCart";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import EsteticaAvancada from "./pages/EsteticaAvancada";
import NucleoMaterno from "./pages/NucleoMaterno";
import ProdutosProgramas from "./pages/ProdutosProgramas";

import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminRegistroClinico from "./pages/admin/AdminRegistroClinico";
import AdminRegistroClinicoFichas from "./pages/admin/AdminRegistroClinicoFichas";
import AdminRegistroClinicoConsultas from "./pages/admin/AdminRegistroClinicoConsultas";
import AdminRegistroClinicoExames from "./pages/admin/AdminRegistroClinicoExames";
import AdminRegistroClinicoVacinas from "./pages/admin/AdminRegistroClinicoVacinas";
import AdminRegistroClinicoTimeline from "./pages/admin/AdminRegistroClinicoTimeline";
import AdminRegistroClinicoAlertas from "./pages/admin/AdminRegistroClinicoAlertas";
import AdminPOPs from "./pages/admin/AdminPOPs";
import AdminServicos from "./pages/admin/AdminServicos";
import AdminEstoque from "./pages/admin/AdminEstoque";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminAgendamentos from "./pages/admin/AdminAgendamentos";
import AdminAgenda from "./pages/admin/AdminAgenda";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminParcerias from "./pages/admin/AdminParcerias";
import AdminSuporte from "./pages/admin/AdminSuporte";
import AdminSistema from "./pages/admin/AdminSistema";
import AdminVideoCall from "./pages/admin/AdminVideoCall";
import DashboardCliente from "./pages/DashboardCliente";
import VideoRoom from "./pages/VideoRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ServicesProvider>
          <AvailabilityProvider>
          <BookingProvider>
          <BlogProvider>
          <SupportProvider>
          <ClinicalRecordProvider>
          <POPProvider>
          <FaturamentoProvider>
          <CartProvider>
          <SystemSettingsProvider>
            <Toaster />
            <Sonner />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <FloatingCart />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/estetica-avancada" element={<EsteticaAvancada />} />
                <Route path="/nucleo-materno" element={<NucleoMaterno />} />
                <Route path="/produtos-programas" element={<ProdutosProgramas />} />
                
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/registro-clinico" element={<AdminRegistroClinico />} />
                <Route path="/admin/registro-clinico/fichas" element={<AdminRegistroClinicoFichas />} />
                <Route path="/admin/registro-clinico/consultas" element={<AdminRegistroClinicoConsultas />} />
                <Route path="/admin/registro-clinico/exames" element={<AdminRegistroClinicoExames />} />
                <Route path="/admin/registro-clinico/vacinas" element={<AdminRegistroClinicoVacinas />} />
                <Route path="/admin/registro-clinico/timeline" element={<AdminRegistroClinicoTimeline />} />
                <Route path="/admin/registro-clinico/alertas" element={<AdminRegistroClinicoAlertas />} />
                <Route path="/admin/pops" element={<AdminPOPs />} />
                <Route path="/admin/servicos" element={<AdminServicos />} />
                <Route path="/admin/estoque" element={<AdminEstoque />} />
                <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
                <Route path="/admin/agendamentos" element={<AdminAgendamentos />} />
                <Route path="/admin/agenda" element={<AdminAgenda />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                <Route path="/admin/parcerias" element={<AdminParcerias />} />
                <Route path="/admin/suporte" element={<AdminSuporte />} />
                <Route path="/admin/sistema" element={<AdminSistema />} />
                <Route path="/admin/videochamada/:roomId" element={<AdminVideoCall />} />
                <Route path="/dashboard" element={<DashboardCliente />} />
                <Route path="/videochamada/:roomId" element={<VideoRoom />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SystemSettingsProvider>
          </CartProvider>
          </FaturamentoProvider>
          </POPProvider>
          </ClinicalRecordProvider>
          </SupportProvider>
          </BlogProvider>
          </BookingProvider>
          </AvailabilityProvider>
        </ServicesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
