import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ServiceDetailDialog from "@/components/ServiceDetailDialog";
import { useCart } from "@/contexts/CartContext";
import { useServices } from "@/contexts/ServicesContext";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import servicesBg from "@/assets/services-bg.jpg";
import rosangelaTools from "@/assets/rosangela-tools.jpeg";
import OrbitalClouds from "@/components/OrbitalClouds";
import HeroLights from "@/components/HeroLights";

const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ParceriaRosangela = () => {
  const { addToCart, isInCart, totalItems, setCartOpen } = useCart();
  const { getServicesByPage, getCategoriesForPage } = useServices();
  const { settings } = useSystemSettings();
  const [detailItem, setDetailItem] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const cfg = settings.pageConfigs?.["parceria-rosangela"];

  const pageServices = getServicesByPage("parceria-rosangela");
  const categories = ["Todos", ...getCategoriesForPage("parceria-rosangela")];
  const filtered = activeFilter === "Todos" ? pageServices : pageServices.filter((s) => s.category === activeFilter);

  const handleAdd = (service: any) => {
    addToCart({ ...service, origin: "Serviços Especializados" });
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(40,35%,93%)] via-[hsl(38,30%,90%)] to-[hsl(35,25%,85%)]" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[hsla(38,40%,85%,0.4)] blur-[100px] animate-[float-blob1_18s_ease-in-out_infinite] top-[-10%] right-[-10%]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[hsla(330,30%,85%,0.25)] blur-[120px] animate-[float-blob2_22s_ease-in-out_infinite] bottom-[10%] left-[-5%]" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-[hsla(40,45%,82%,0.4)] blur-[90px] animate-[float-blob3_20s_ease-in-out_infinite] top-[40%] right-[20%]" />
      </div>
      <OrbitalClouds />

      <div className="relative z-10 py-6 md:py-10 overflow-hidden">
        <div className="absolute inset-0">
          <img src={servicesBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />
        </div>
        <HeroLights />
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
             <span className="inline-block text-xs font-heading font-semibold text-secondary tracking-widest uppercase bg-secondary/20 backdrop-blur-sm px-3 py-1 rounded-full border border-secondary/30 mb-2">Serviços Gestacionais</span>
             <h1 className="text-2xl md:text-3xl font-heading font-bold text-card mb-2">{cfg?.pageTitle || "Serviços Especializados"}</h1>
             <p className="text-card/70 max-w-xl text-sm leading-relaxed">{cfg?.pageDescription || "Serviços de bem-estar e cuidados especializados para gestantes e puérperas."}</p>
            <Link to="/#servicos">
              <Button variant="ghost" size="sm" className="text-card hover:text-card bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 mt-3 font-heading rounded-full px-4 text-xs shadow-sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Voltar</Button>
            </Link>
          </div>
          <div className="shrink-0 hidden md:block">
            <div className="relative">
              <div className="w-48 h-56 rounded-2xl overflow-hidden border-3 border-primary/30 shadow-xl shadow-primary/20 relative">
                <img src={cfg?.photoUrl || rosangelaTools} alt={cfg?.expertName || "Rosângela"} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm border-t border-white/10 px-3 py-2">
                  <p className="font-heading font-semibold text-white text-xs">{cfg?.expertName || "Rosângela"}</p>
                  <p className="text-[10px] text-white/80">{cfg?.expertSubtitle || "Cabeleireira & Especialista"}</p>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 bg-secondary text-secondary-foreground rounded-xl px-3 py-1 shadow-lg">
                <span className="font-heading font-bold text-xs">Expert</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-20">
        <div className="flex items-center gap-2 flex-wrap mb-10">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveFilter(cat)} className={`text-sm px-4 py-2 rounded-full font-heading font-medium transition-all ${activeFilter === cat ? "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
              {cat} <span className="ml-1.5 text-xs opacity-70">({cat === "Todos" ? pageServices.length : pageServices.filter((s) => s.category === cat).length})</span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((service) => {
            const inCart = isInCart(service.id);
            return (
              <Card key={service.id} className={`group border transition-all duration-500 hover:-translate-y-1 overflow-hidden bg-white/40 backdrop-blur-xl cursor-pointer ${inCart ? "border-secondary/40 shadow-lg shadow-secondary/10" : "border-white/40 hover:border-secondary/30 shadow-sm hover:shadow-xl hover:shadow-secondary/10"}`} onClick={() => setDetailItem(service)}>
                <div className={`h-1.5 bg-gradient-to-r from-secondary/60 to-primary/40 transition-opacity duration-500 ${inCart ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-heading font-bold text-foreground leading-tight">{service.title}</h3>
                    {inCart && <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0.5 bg-secondary/15 text-secondary border-secondary/30"><Check className="h-3 w-3 mr-0.5" /> Selecionado</Badge>}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider mb-2">{service.category}</span>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-grow">{service.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <div>
                      <p className="text-xl font-heading font-bold text-foreground">{formatPrice(service.price)}</p>
                      <p className="text-[11px] text-muted-foreground">{service.duration}</p>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAdd(service); }} className={`rounded-full font-heading text-xs px-4 ${inCart ? "bg-secondary/15 text-secondary hover:bg-secondary/25 border border-secondary/30" : "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm"}`}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> {inCart ? "Mais 1" : "Adicionar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-10 md:p-14 border border-white/50">
             <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">Bem-estar completo na gestação</h3>
             <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Combine serviços para um cuidado integral durante sua gestação.</p>
            {totalItems > 0 ? (
              <Button onClick={() => setCartOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full px-8 py-3 shadow-md shadow-secondary/20 text-base">Ver Carrinho ({totalItems} {totalItems === 1 ? "item" : "itens"})</Button>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione serviços acima para começar.</p>
            )}
          </div>
        </div>
      </div>

      <ServiceDetailDialog item={detailItem} open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)} onAddToCart={(item) => handleAdd(item)} isInCart={detailItem ? isInCart(detailItem.id) : false} />
    </div>
  );
};

export default ParceriaRosangela;
