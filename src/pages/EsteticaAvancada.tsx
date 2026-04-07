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
import OrbitalClouds from "@/components/OrbitalClouds";
import HeroLights from "@/components/HeroLights";


const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EsteticaAvancada = () => {
  const { addToCart, isInCart, totalItems, setCartOpen } = useCart();
  const { getServicesByPage, getCategoriesForPage } = useServices();
  const { settings } = useSystemSettings();
  const [detailItem, setDetailItem] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const cfg = settings.pageConfigs?.["estetica-avancada"];

  const pageServices = getServicesByPage("estetica-avancada");
  const categories = ["Todos", ...getCategoriesForPage("estetica-avancada")];
  const filtered = activeFilter === "Todos" ? pageServices : pageServices.filter((s) => s.category === activeFilter);

  const handleAdd = (service: any) => {
    addToCart({ ...service, origin: "Pré-Natal & Consultas" });
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
      {/* Hero */}
      <div className="relative z-10 py-6 md:py-10 overflow-hidden">
        <div className="absolute inset-0">
          <img src={servicesBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <HeroLights />
        <div className="container mx-auto px-4 relative z-10">
          <div>
            <span className="inline-block text-xs font-heading font-semibold text-primary tracking-widest uppercase bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30 mb-2">
              Catálogo de Consultas
            </span>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-card mb-2">{cfg?.pageTitle || "Pré-Natal & Consultas"}</h1>
            <p className="text-card/70 max-w-xl text-sm leading-relaxed">{cfg?.pageDescription || "Agende suas consultas pré-natais e exames gestacionais."}</p>
            <Link to="/#servicos">
              <Button variant="ghost" size="sm" className="text-card hover:text-card bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 mt-3 font-heading rounded-full px-4 text-xs shadow-sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-20">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-10">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveFilter(cat)} className={`text-sm px-4 py-2 rounded-full font-heading font-medium transition-all ${activeFilter === cat ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
              {cat} <span className="ml-1.5 text-xs opacity-70">({cat === "Todos" ? pageServices.length : pageServices.filter((s) => s.category === cat).length})</span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((service) => {
            const inCart = isInCart(service.id);
            return (
              <Card key={service.id} className={`group border transition-all duration-500 hover:-translate-y-1 overflow-hidden bg-white/40 backdrop-blur-xl cursor-pointer ${inCart ? "border-primary/40 shadow-lg shadow-primary/10" : "border-white/40 hover:border-primary/30 shadow-sm hover:shadow-xl hover:shadow-primary/10"}`} onClick={() => setDetailItem(service)}>
                <div className={`h-1.5 bg-gradient-to-r from-primary/60 to-secondary/40 transition-opacity duration-500 ${inCart ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-heading font-bold text-foreground leading-tight">{service.title}</h3>
                    {inCart && <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0.5 bg-primary/15 text-primary border-primary/30"><Check className="h-3 w-3 mr-0.5" /> Selecionado</Badge>}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider mb-2">{service.category}</span>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-grow">{service.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <div>
                      <p className="text-xl font-heading font-bold text-foreground">{formatPrice(service.price)}</p>
                      <p className="text-[11px] text-muted-foreground">{service.duration}</p>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAdd(service); }} className={`rounded-full font-heading text-xs px-4 ${inCart ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30" : "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm"}`}>
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
             <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">Monte seu plano pré-natal</h3>
             <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Combine consultas e exames para um acompanhamento completo e personalizado.</p>
            {totalItems > 0 ? (
              <Button onClick={() => setCartOpen(true)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full px-8 py-3 shadow-md shadow-secondary/20 text-base">Ver Carrinho ({totalItems} {totalItems === 1 ? "item" : "itens"})</Button>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione procedimentos acima para começar.</p>
            )}
          </div>
        </div>
      </div>

      <ServiceDetailDialog item={detailItem} open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)} onAddToCart={(item) => handleAdd(item)} isInCart={detailItem ? isInCart(detailItem.id) : false} />
    </div>
  );
};

export default EsteticaAvancada;
