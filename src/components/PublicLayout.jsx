import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, Globe, Twitter, Instagram, Linkedin, Facebook, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import NotificationBell from './NotificationBell';
import ConversionButton from './ConversionButton';
import LiveActivityNotification from './LiveActivityNotification';

// LOCKED NAVIGATION STRUCTURE — DO NOT MODIFY
// All items are ENFORCED and protected against auto-removal
// Any changes to this array must maintain ALL 6 items
const navLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Vicion Care Plan', to: '/vicion-care-plan' },
  { label: 'Oportunidad', to: '/opportunity' },
  { label: 'Planes', to: '/planes' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Sobre Nosotros', to: '/about' },
];

// LOCKED FOOTER STRUCTURE — ENFORCED PROTECTION
// All 7 items must persist. No removal, no hiding, no renaming.
const footerCols = [
  {
    title: 'Acceso Rápido',
    links: [
      { label: 'Inicio', to: '/' },
      { label: 'Vicion Care Plan', to: '/vicion-care-plan' },
      { label: 'Oportunidad', to: '/opportunity' },
      { label: 'Planes', to: '/planes' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Sobre Nosotros', to: '/about' },
      { label: 'Acceder', to: '/login' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Aviso Legal', to: '/legal/aviso-legal' },
      { label: 'Términos y Condiciones', to: '/legal/terminos-condiciones' },
      { label: 'Privacidad', to: '/legal/privacidad' },
      { label: 'Aviso de Riesgos', to: '/legal/riesgos' },
      { label: 'AML / KYC', to: '/legal/aml-kyc' },
      { label: 'Política de Uso', to: '/legal/politica-de-uso' },
      { label: 'Código de Conducta', to: '/legal/codigo-conducta' },
      { label: 'Transparencia', to: '/transparencia' },
    ],
  },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [clicks, setClicks] = useState(0);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleBrandClick = () => {
    const newClickCount = clicks + 1;
    setClicks(newClickCount);
    
    if (newClickCount === 5) {
      navigate('/admin-access');
      setClicks(0);
    } else if (newClickCount === 1) {
      // Reset after 2 seconds if not 5 clicks achieved
      const timer = setTimeout(() => {
        setClicks(0);
      }, 2000);
      
      // Store timer for cleanup if component unmounts
      return () => clearTimeout(timer);
    }
  };

  const isActive = (to) => location.pathname === to;

  return (
    <div className="min-h-screen flex flex-col">
      <LiveActivityNotification />

      {/* ══ NAVBAR ════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? 'bg-vicion-deep/97 shadow-xl shadow-black/30 border-b border-white/8'
          : 'bg-transparent'
      }`} style={{ backdropFilter: scrolled ? 'blur(20px)' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Brand text only */}
            <div onClick={handleBrandClick} className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
              <div>
                <div className="font-montserrat font-black text-white text-lg leading-tight tracking-widest">VICION</div>
                <div className="font-montserrat font-semibold text-vicion-electric text-[9px] tracking-[0.3em] uppercase">POWER</div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg hover:text-white hover:bg-white/5 ${
                    isActive(link.to) ? 'text-white' : 'text-white/65'
                  }`}>
                  {link.label}
                  {isActive(link.to) && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-vicion-electric" />
                  )}
                </Link>
              ))}
            </div>

            {/* CTA Right */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Notification Bell */}
              {user && <NotificationBell />}
              {/* Language */}
              <button className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                <Globe size={13} /> EN
              </button>
              <Link to="/login"
                className="inline-flex items-center gap-1.5 bg-vicion-blue hover:bg-blue-500 text-white text-sm font-semibold font-montserrat px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25">
                Login
              </Link>
              <style>{`
                @keyframes pulse-glow {
                  0%, 100% {
                    box-shadow: 0 0 20px rgba(29, 110, 245, 0.4), 0 0 0 rgba(29, 110, 245, 0);
                  }
                  50% {
                    box-shadow: 0 0 30px rgba(29, 110, 245, 0.6), 0 0 10px rgba(29, 110, 245, 0.4);
                  }
                }
                .pulse-button {
                  animation: pulse-glow 6s ease-in-out infinite;
                }
              `}</style>
              <Link to="/participar"
                className="pulse-button inline-flex items-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-6 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-lg">
                Acceder a Care Plan <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-xl text-white transition-colors hover:bg-white/10">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/10" style={{ background: 'rgba(5,12,26,0.98)', backdropFilter: 'blur(20px)' }}>
            <div className="px-4 py-5 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className={`py-3 px-4 font-medium rounded-xl flex items-center justify-between transition-colors ${
                    isActive(link.to) ? 'text-white bg-vicion-blue/15' : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}>
                  {link.label} <ChevronRight size={15} className="text-white/30" />
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
               <button className="flex items-center gap-2 text-white/50 text-sm px-4 py-2">
                 <Globe size={14} /> Language: EN
               </button>
               <Link to="/login"
                     className="bg-vicion-blue text-white text-center text-sm font-semibold font-montserrat py-3 rounded-xl">
                     Login
                   </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* PAGE CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Floating Button */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(29, 110, 245, 0.4), 0 0 0 rgba(29, 110, 245, 0);
          }
          50% {
            box-shadow: 0 0 30px rgba(29, 110, 245, 0.6), 0 0 10px rgba(29, 110, 245, 0.4);
          }
        }
        .pulse-button-mobile {
          animation: pulse-glow 6s ease-in-out infinite;
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <Link
          to="/participar"
          className="pulse-button-mobile inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-6 py-4 rounded-full shadow-lg transition-all duration-200">
          <ArrowRight size={20} />
        </Link>
      </div>

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <footer className="bg-vicion-deep border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main footer grid */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand col */}
            <div className="lg:col-span-2">
             <div className="mb-5" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
               <div className="font-montserrat font-black text-white text-base tracking-widest">MINDBLISS POWER</div>
               <div className="text-vicion-electric text-[9px] tracking-[0.25em] uppercase font-montserrat">GLOBAL PLATFORM</div>
             </div>
              <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
                Estructura, comunidad y visión en una plataforma diseñada para crecer.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => (
                  <a key={i} href="#"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-all duration-200"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link cols */}
              {footerCols.map(col => (
              <div key={col.title}>
                <h4 className="text-white font-montserrat font-bold text-xs tracking-[0.2em] uppercase mb-5">{col.title}</h4>
                <div className="flex flex-col gap-2.5">
                  {col.links.map(l => (
                    <Link key={l.label} to={l.to}
                      className="text-white/40 text-sm hover:text-white/80 transition-colors">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="py-6 border-t border-white/8 flex flex-col gap-4">
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Plataforma de participación estructurada orientada al desarrollo de proyectos, acceso a herramientas y construcción de valor en el tiempo.
            </p>
            <p className="text-white/25 text-xs">© Mindbliss Power. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}