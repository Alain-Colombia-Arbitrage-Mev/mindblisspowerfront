import { Link } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function BrandHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Care Plan', href: '/vicion-care-plan' },
    { label: 'About', href: '/about' },
    { label: 'Opportunity', href: '/opportunity' },
    { label: 'FAQ', href: '/faq' }
  ];

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 900 }}>V</span>
          </div>
          <span style={{ color: '#0F1419', fontSize: 16, fontWeight: 700, fontFamily: 'Inter' }}>
            Vicion
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              style={{
                color: '#4b5563',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.target.style.color = '#1e40af'}
              onMouseLeave={e => e.target.style.color = '#4b5563'}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:inline-flex" style={{
            padding: '10px 20px',
            background: '#1e40af',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}
            onMouseEnter={e => e.target.style.background = '#1e3a8a'}
            onMouseLeave={e => e.target.style.background = '#1e40af'}
          >
            Iniciar sesión
          </Link>

          <button
            className="sm:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <nav style={{
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 0'
        }}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              style={{
                display: 'block',
                padding: '12px 16px',
                color: '#4b5563',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                borderBottom: '1px solid #e5e7eb'
              }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ padding: '12px 16px' }}>
           <Link to="/login" style={{
             display: 'block',
             width: '100%',
             padding: '10px 0',
             background: '#1e40af',
             color: '#FFFFFF',
             border: 'none',
             borderRadius: 6,
             fontSize: 13,
             fontWeight: 600,
             cursor: 'pointer',
             textAlign: 'center',
             textDecoration: 'none'
           }}>
             Iniciar sesión
           </Link>
          </div>
        </nav>
      )}
    </header>
  );
}