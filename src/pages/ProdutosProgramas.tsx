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
import perilaPortrait from "@/assets/perila-portrait.png";
import OrbitalClouds from "@/components/OrbitalClouds";
import HeroLights from "@/components/HeroLights";

const formatPrice = (value: number) =>
  value === 0 ? "Gratuito" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ProdutosProgramas = () => {
  const { addToCart, isInCart } = useCart();
  const { getServicesByPage, getCategoriesForPage } = useServices();
  const { settings } = useSystemSettings();
  const [detailItem, setDetailItem] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const cfg = settings.pageConfigs?.["produtos-programas"];

  const pageServices = getServicesByPage("produtos-programas");
  const categories = ["Todos", ...getCategoriesForPage("produtos-programas")];
  const filtered = activeFilter === "Todos" ? pageServices : pageServices.filter((s) => s.category === activeFilter);

  const handleAdd = (product: any) => {
    addToCart({ ...product, origin: "Produtos para Gestantes" });
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
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/65 to-foreground/35" />
        </div>
        <HeroLights />
        <div className="container mx-auto px-4 relative z-10">
          <div>
            <span className="inline-block text-xs font-heading font-semibold text-primary tracking-widest uppercase bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30 mb-2">Loja para Gestantes</span>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-card mb-2">{cfg?.pageTitle || "Produtos para Gestantes"}</h1>
            <p className="text-card/70 max-w-xl text-sm leading-relaxed">{cfg?.pageDescription || "Produtos selecionados para gestantes e mamães: kits, cosméticos e itens de bem-estar."}</p>
            <Link to="/#servicos">
              <Button variant="ghost" size="sm" className="text-card hover:text-card bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 mt-3 font-heading rounded-full px-4 text-xs shadow-sm"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Voltar</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-20">
        <div className="flex items-center gap-2 flex-wrap mb-10">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveFilter(cat)} className={`text-sm px-4 py-2 rounded-full font-heading font-medium transition-all ${activeFilter === cat ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
              {cat} <span className="ml-1.5 text-xs opacity-70">({cat === "Todos" ? pageServices.length : pageServices.filter((s) => s.category === cat).length})</span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((product) => {
            const inCart = isInCart(product.id);
            return (
              <Card key={product.id} className={`group border transition-all duration-500 hover:-translate-y-1 overflow-hidden bg-white/40 backdrop-blur-xl cursor-pointer ${inCart ? "border-primary/40 shadow-lg shadow-primary/10" : "border-white/40 hover:border-primary/30 shadow-sm hover:shadow-xl hover:shadow-primary/10"}`} onClick={() => setDetailItem(product)}>
                <div className={`h-1.5 bg-gradient-to-r from-primary/60 to-secondary/40 transition-opacity duration-500 ${inCart ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-heading font-bold text-foreground leading-tight">{product.title}</h3>
                    {inCart && <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0.5 bg-primary/15 text-primary border-primary/30"><Check className="h-3 w-3 mr-0.5" /> No carrinho</Badge>}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider mb-2">{product.category}</span>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-grow">{product.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <p className="text-xl font-heading font-bold text-foreground">{formatPrice(product.price)}</p>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAdd(product); }} className={`rounded-full font-heading text-xs px-4 ${inCart ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30" : "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm"}`}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> {product.price === 0 ? "Saiba mais" : inCart ? "Mais 1" : "Adicionar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ServiceDetailDialog item={detailItem} open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)} onAddToCart={(item) => handleAdd(item)} isInCart={detailItem ? isInCart(detailItem.id) : false} />
    </div>
  );
};

export default ProdutosProgramas;
