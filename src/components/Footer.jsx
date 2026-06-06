import { Link } from "react-router-dom";

const LOGO_URL = "https://media.base44.com/images/public/user_695e30996105919ca32ab3e0/4441f7807_logodevcion.png";

export default function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={LOGO_URL} alt="Vicion Power" className="h-10 w-10 object-contain" />
              <span className="font-display text-lg font-bold text-foreground">
                VICION <span className="text-primary">POWER</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A global platform connecting people with structured systems, opportunities, and community-driven growth.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <div className="space-y-3">
              <Link to="/care-plan" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Care Plan</Link>
              <Link to="/ecosystem" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Ecosystem</Link>
              <Link to="/opportunity" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Opportunity</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h4>
            <div className="space-y-3">
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link>
              <Link to="/compliance" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Compliance</Link>
              <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Access Platform</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <div className="space-y-3">
              <Link to="/legal/terminos-condiciones" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Términos</Link>
              <Link to="/legal/privacidad" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Privacidad</Link>
              <Link to="/legal/aviso-legal" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Aviso Legal</Link>
            </div>
          </div>
        </div>

        {/* Marco Legal y Transparencia */}
        <div className="mt-16 pt-12 border-t border-border/50">
          <h4 className="font-semibold text-foreground mb-6 text-sm uppercase tracking-wider">Marco Legal y Documentos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
            <Link to="/legal/aviso-legal" className="text-xs text-muted-foreground hover:text-primary transition-colors">Aviso Legal</Link>
            <Link to="/legal/terminos-condiciones" className="text-xs text-muted-foreground hover:text-primary transition-colors">Términos</Link>
            <Link to="/legal/privacidad" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacidad</Link>
            <Link to="/legal/codigo-conducta" className="text-xs text-muted-foreground hover:text-primary transition-colors">Código de Conducta</Link>
            <Link to="/legal/aml-kyc" className="text-xs text-muted-foreground hover:text-primary transition-colors">AML/KYC</Link>
            <Link to="/legal/riesgos" className="text-xs text-muted-foreground hover:text-primary transition-colors">Riesgos</Link>
          </div>
          <div className="mb-6">
            <Link to="/compliance" className="text-sm text-primary font-semibold hover:text-blue-400 transition-colors inline-block">Transparencia →</Link>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Vicion Power opera bajo estándares internacionales de cumplimiento y en procesos activos de adecuación regulatoria.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vicion Power. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground max-w-md text-center sm:text-right">
            Plataforma de participación colectiva orientada al desarrollo de proyectos, acceso a herramientas y crecimiento dentro de un ecosistema estructurado.
          </p>
        </div>
      </div>
    </footer>
  );
}