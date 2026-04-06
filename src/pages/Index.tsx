import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import BlogSection from "@/components/sections/BlogSection";
import FloatingBubbles from "@/components/FloatingBubbles";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const Index = () => {
  const { settings } = useSystemSettings();
  const vis = settings.sectionVisibility;

  return (
    <div className="min-h-screen bg-background relative">
      <FloatingBubbles />
      <Header />
      <main>
        <HeroSection />
        {vis?.services !== false && <ServicesSection />}
        {vis?.testimonials !== false && <TestimonialsSection />}
        {vis?.blog !== false && <BlogSection />}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
