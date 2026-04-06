import { Instagram, Facebook, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const Footer = () => {
  const { settings, logoSrc } = useSystemSettings();
  return (
    <footer id="contato" className="bg-foreground text-card py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-14">
          {/* About */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <img src={logoSrc} alt="Logo" className="w-9 h-9 object-contain" />
              <div>
                <span className="font-heading text-base font-bold block leading-none">{settings.companyShortName}</span>
                <span className="text-[10px] text-card/50 font-heading tracking-wide uppercase">{settings.companySubtitle}</span>
              </div>
            </div>
            <p className="text-sm text-card/50 leading-relaxed">
              Sistema completo de acompanhamento gestacional com consultas pré-natal, linha do tempo, registro clínico e serviços especializados para gestantes.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold mb-5 text-sm tracking-wider uppercase text-card/70">Links Rápidos</h4>
            <ul className="space-y-3">
              {["Consultas", "Produtos", "Blog", "Agendamento", "Minha Gestação"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-card/50 hover:text-accent transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-5 text-sm tracking-wider uppercase text-card/70">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-card/50">
                <div className="w-8 h-8 rounded-full bg-card/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-accent" />
                </div>
                <a href="mailto:esteticaleslierp@gmail.com" className="hover:text-accent transition-colors">esteticaleslierp@gmail.com</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-card/50">
                <div className="w-8 h-8 rounded-full bg-card/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <a href="tel:+5511945383845" className="hover:text-accent transition-colors">(11) 94538-3845</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-card/50">
                <div className="w-8 h-8 rounded-full bg-card/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                Rua General Camara, 319
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading font-semibold mb-5 text-sm tracking-wider uppercase text-card/70">Redes Sociais</h4>
            <div className="flex gap-3">
              {[
                { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/aleslierayssa?igsh=MWp1bmg1OXRkbjJx&utm_source=qr" },
                { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/rayssa.oliveira.82150?mibextid=wwXIfr&rdid=hHUwpWFNtbRuOWk0&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1B4SB2zm7L%2F%3Fmibextid%3DwwXIfr%26ref%3D1" },
                { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/5511945383845" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-card/10 flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-card/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-card/30">
            © 2026 {settings.companyName}. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-card/30 hover:text-accent transition-colors">Política de Privacidade</a>
            <a href="#" className="text-xs text-card/30 hover:text-accent transition-colors">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
