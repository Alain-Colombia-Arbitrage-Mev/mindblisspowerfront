import { Link } from 'react-router-dom';

export default function BrandFooter() {
  const quickAccessLinks = [
    { label: 'Inicio', href: '/' },
    { label: 'Vicion Care Plan', href: '/vicion-care-plan' },
    { label: 'Sobre Nosotros', href: '/about' },
    { label: 'Oportunidad', href: '/opportunity' },
    { label: 'Login', href: '/login' }
  ];

  const sections = [
    {
      title: 'Product',
      links: [
        { label: 'Platform', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Security', href: '#' },
        { label: 'Roadmap', href: '#' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/legal/privacidad' },
        { label: 'Terms', href: '/legal/terminos-condiciones' },
        { label: 'Compliance', href: '/compliance' },
        { label: 'Disclosure', href: '#' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Documentation', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'Status', href: '#' },
      ]
    },
  ];

  return (
    <footer style={{
      background: '#0F1419',
      color: '#FFFFFF',
      paddingTop: 64,
      paddingBottom: 32
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Footer */}
        {/* Quick Access Section */}
       <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 12, padding: 16, marginBottom: 32 }}>
          <p style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 700, margin: '0 0 12px 0', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Acceso Rápido
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {quickAccessLinks.map((link, i) => (
              <Link key={i} to={link.href} style={{
                color: '#9ca3af',
                fontSize: 12,
                textDecoration: 'none',
                transition: 'color 0.2s',
                padding: '6px 0'
              }}
                onMouseEnter={e => e.target.style.color = '#3b82f6'}
                onMouseLeave={e => e.target.style.color = '#9ca3af'}
              >
                {link.label}
              </Link>
            ))}
          </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b" style={{ borderColor: '#1f2937' }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 900 }}>V</span>
                </div>
                <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700, fontFamily: 'Inter' }}>
                  Vicion
                </span>
              </div>
            </Link>
            <p style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Global platform for transparent growth and community-driven networks.
            </p>
          </div>

          {/* Links */}
          {sections.map((section, i) => (
            <div key={i}>
              <p style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600, margin: '0 0 12px 0', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {section.title}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, space: 'y-2' }}>
                {section.links.map((link, j) => (
                  <li key={j} style={{ marginBottom: 8 }}>
                    <Link to={link.href} style={{
                      color: '#9ca3af',
                      fontSize: 12,
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                      onMouseEnter={e => e.target.style.color = '#3b82f6'}
                      onMouseLeave={e => e.target.style.color = '#9ca3af'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{
          paddingTop: 32,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24
        }}>
          <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
            © 2026 Mindbliss Power. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Twitter', 'LinkedIn', 'Discord'].map((social) => (
              <a key={social} href="#" style={{
                color: '#6b7280',
                fontSize: 12,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
                onMouseEnter={e => e.target.style.color = '#3b82f6'}
                onMouseLeave={e => e.target.style.color = '#6b7280'}
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}