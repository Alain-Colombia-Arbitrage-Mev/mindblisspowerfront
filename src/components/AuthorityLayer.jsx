import { motion } from 'framer-motion';
import { Globe, Code2, TrendingUp, Users, Network, Server, CheckCircle2, Zap } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AuthorityLayer() {
  return (
    <div className="max-w-6xl mx-auto space-y-24 py-20 px-4">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: GROWING ECOSYSTEM */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="space-y-12"
      >
        <div>
          <p style={{ color: '#1e40af', fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
            EXPANDING ECOSYSTEM
          </p>
          <h2 style={{ color: '#0F1419', fontSize: 32, fontWeight: 900, margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
            Proyectos en Crecimiento
          </h2>
          <p style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
            Plataforma integrada con múltiples sistemas y herramientas para soportar el crecimiento global.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🌐',
              title: 'Member Portal',
              desc: 'Dashboard personal para gestión de red, incentivos y progreso',
              features: ['Real-time tracking', 'Network visualization', 'Analytics dashboard'],
              status: 'Active'
            },
            {
              icon: '📊',
              title: 'Analytics Platform',
              desc: 'Insights para líderes y administradores sobre actividad y métricas',
              features: ['Performance metrics', 'Growth tracking', 'Compliance reports'],
              status: 'Active'
            },
            {
              icon: '🔐',
              title: 'Compliance Suite',
              desc: 'Herramientas para asegurar cumplimiento regulatorio en todos los países',
              features: ['Audit logs', 'Verification tools', 'Regulatory alerts'],
              status: 'Active'
            },
            {
              icon: '📱',
              title: 'Mobile App',
              desc: 'Acceso desde cualquier dispositivo con sincronización en tiempo real',
              features: ['iOS & Android', 'Offline mode', 'Push notifications'],
              status: 'Beta'
            },
            {
              icon: '🤖',
              title: 'AI Assistant',
              desc: 'Asistente inteligente para soporte, formación y recomendaciones',
              features: ['24/7 Support', 'Personalized guidance', 'Training automation'],
              status: 'Active'
            },
            {
              icon: '🔗',
              title: 'Integration API',
              desc: 'API abierta para integraciones con sistemas externos',
              features: ['REST API', 'Webhooks', 'OAuth 2.0'],
              status: 'Active'
            },
          ].map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-12 border"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <div style={{ fontSize: 28, margin: '0 0 12px 0' }}>{project.icon}</div>
              <h3 style={{ color: '#0F1419', fontSize: 15, fontWeight: 700, margin: '0 0 6px 0' }}>
                {project.title}
              </h3>
              <p style={{ color: '#4b5563', fontSize: 12, margin: '0 0 12px 0', lineHeight: 1.5 }}>
                {project.desc}
              </p>
              <div style={{ marginBottom: 12 }}>
                {project.features.map((feat, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, color: '#4b5563' }}>
                    <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                    {feat}
                  </div>
                ))}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: project.status === 'Active' ? '#d1fae5' : '#fef3c7',
                  color: project.status === 'Active' ? '#065f46' : '#92400e'
                }}
              >
                {project.status}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Evolution Timeline */}
        <div className="mt-16 p-8 rounded-12" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <h3 style={{ color: '#0F1419', fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>
            Roadmap 2026
          </h3>
          <div className="space-y-4">
            {[
              { q: 'Q1', items: ['Global system deployment', 'Multi-currency support', 'Brand identity rollout'] },
              { q: 'Q2', items: ['Extended analytics', 'Advanced compliance tools', 'AI training expansion'] },
              { q: 'Q3', items: ['Mobile app launch', 'New integrations', 'Regional customization'] },
              { q: 'Q4', items: ['Enterprise features', 'Advanced reporting', 'Platform 2.0 beta'] },
            ].map((quarter, i) => (
              <div key={i} className="flex gap-4">
                <div
                  style={{
                    width: 60,
                    minWidth: 60,
                    height: 40,
                    borderRadius: 6,
                    background: '#1e40af',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  {quarter.q}
                </div>
                <div style={{ flex: 1 }}>
                  {quarter.items.map((item, j) => (
                    <p key={j} style={{ color: '#4b5563', fontSize: 12, margin: '0 0 4px 0' }}>
                      • {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: INTERNATIONAL PRESENCE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="space-y-12"
      >
        <div>
          <p style={{ color: '#1e40af', fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
            GLOBAL FOOTPRINT
          </p>
          <h2 style={{ color: '#0F1419', fontSize: 32, fontWeight: 900, margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
            Presencia Internacional
          </h2>
          <p style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
            Operando en múltiples mercados con cumplimiento regulatorio local y soporte culturalizado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <div className="p-8 rounded-12" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center">
              <Globe size={40} style={{ color: '#1e40af', margin: '0 auto 12px' }} />
              <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>
                🌍 24 países activos
                <br />
                📱 17 idiomas soportados
                <br />
                💱 15+ monedas
              </p>
            </div>
          </div>

          {/* Regional Details */}
          <div className="space-y-3">
            {[
              { region: 'Latin America', countries: 'México, Colombia, Argentina, Chile', status: 'Primary Market' },
              { region: 'Europe', countries: 'Spain, Portugal, Germany, France', status: 'Expanding' },
              { region: 'Asia Pacific', countries: 'Singapore, Philippines, Vietnam, India', status: 'Growth Phase' },
              { region: 'Middle East', countries: 'UAE, Saudi Arabia, Egypt', status: 'Expanding' },
            ].map((region, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-8 border"
                style={{ background: '#FFFFFF', border: '1px solid #e5e7eb' }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h4 style={{ color: '#0F1419', fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {region.region}
                  </h4>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      background: region.status === 'Primary Market' ? '#dbeafe' : '#fef3c7',
                      color: region.status === 'Primary Market' ? '#0c4a6e' : '#92400e'
                    }}
                  >
                    {region.status}
                  </span>
                </div>
                <p style={{ color: '#4b5563', fontSize: 12, margin: 0 }}>
                  {region.countries}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Compliance By Country */}
        <div className="p-8 rounded-12" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <h3 style={{ color: '#0F1419', fontSize: 16, fontWeight: 700, margin: '0 0 16px 0' }}>
            Cumplimiento Regulatorio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '⚖️', title: 'Legal Framework', desc: 'Operamos bajo marcos legales aprobados en cada país' },
              { icon: '🏦', title: 'Financial Compliance', desc: 'Auditorías regulares y reportes de cumplimiento' },
              { icon: '🔍', title: 'Transparency', desc: 'Reportes públicos de operaciones y métricas' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-8" style={{ background: '#FFFFFF', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: 20, margin: '0 0 8px 0' }}>{item.icon}</p>
                <p style={{ color: '#0F1419', fontSize: 12, fontWeight: 600, margin: '0 0 4px 0' }}>
                  {item.title}
                </p>
                <p style={{ color: '#4b5563', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: TECH INFRASTRUCTURE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="space-y-12"
      >
        <div>
          <p style={{ color: '#1e40af', fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
            TECHNICAL BACKBONE
          </p>
          <h2 style={{ color: '#0F1419', fontSize: 32, fontWeight: 900, margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
            Infraestructura Tecnológica
          </h2>
          <p style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
            Plataforma moderna construida con tecnología estable, escalable y segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Stack */}
          <div className="space-y-4">
            <h3 style={{ color: '#0F1419', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>
              Technology Stack
            </h3>
            {[
              { layer: 'Frontend', tech: 'React, TypeScript, Tailwind CSS' },
              { layer: 'Backend', tech: 'Deno, Node.js, REST APIs' },
              { layer: 'Database', tech: 'PostgreSQL, Redis' },
              { layer: 'Hosting', tech: 'Cloud infrastructure with 99.9% uptime' },
              { layer: 'Security', tech: 'End-to-end encryption, OAuth 2.0' },
              { layer: 'Monitoring', tech: 'Real-time alerts, performance tracking' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-8 border flex gap-4"
                style={{ background: '#FFFFFF', border: '1px solid #e5e7eb' }}
              >
                <Server size={16} style={{ color: '#1e40af', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ color: '#0F1419', fontSize: 12, fontWeight: 600, margin: '0 0 2px 0' }}>
                    {item.layer}
                  </p>
                  <p style={{ color: '#4b5563', fontSize: 11, margin: 0 }}>
                    {item.tech}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Capabilities */}
          <div className="space-y-4">
            <h3 style={{ color: '#0F1419', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0' }}>
              Platform Capabilities
            </h3>
            {[
              { icon: '⚡', title: 'High Performance', desc: 'Sub-second load times globally' },
              { icon: '🔄', title: 'Real-time Sync', desc: 'Live updates across all devices' },
              { icon: '📈', title: 'Scalability', desc: 'Handles millions of transactions' },
              { icon: '🔐', title: 'Security First', desc: 'ISO 27001 compliant standards' },
              { icon: '🌍', title: 'Global CDN', desc: 'Content delivered from 50+ edge locations' },
              { icon: '📊', title: 'Analytics', desc: 'Deep insights on platform usage' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-8 border"
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
              >
                <p style={{ fontSize: 16, margin: '0 0 6px 0' }}>{item.icon}</p>
                <p style={{ color: '#0F1419', fontSize: 12, fontWeight: 600, margin: '0 0 2px 0' }}>
                  {item.title}
                </p>
                <p style={{ color: '#4b5563', fontSize: 11, margin: 0 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Integration Ecosystem */}
        <div className="p-8 rounded-12" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <h3 style={{ color: '#0F1419', fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>
            Ecosystem Integrations
          </h3>
          <div className="flex flex-wrap gap-3">
            {['Stripe', 'Twilio', 'SendGrid', 'Auth0', 'Datadog', 'Cloudflare', 'AWS', 'Google Cloud', 'GitHub', 'Slack'].map((tool, i) => (
              <span
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  border: '1px solid #e5e7eb',
                  color: '#4b5563',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CLOSING: TRUST */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-12 rounded-16 text-center"
        style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
      >
        <h2 style={{ color: '#0F1419', fontSize: 24, fontWeight: 900, margin: '0 0 12px 0', fontFamily: 'Inter, sans-serif' }}>
          Respalded by Reality
        </h2>
        <p style={{ color: '#4b5563', fontSize: 14, margin: '0 0 20px 0', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          No somos promesas vacías. Cada claim está respaldado por infraestructura real, operaciones verificables y cumplimiento regulatorio comprobado.
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#1e40af', fontSize: 20, fontWeight: 900, margin: '0 0 4px 0' }}>24+</p>
            <p style={{ color: '#4b5563', fontSize: 12, margin: 0 }}>Países</p>
          </div>
          <div>
            <p style={{ color: '#1e40af', fontSize: 20, fontWeight: 900, margin: '0 0 4px 0' }}>99.9%</p>
            <p style={{ color: '#4b5563', fontSize: 12, margin: 0 }}>Uptime</p>
          </div>
          <div>
            <p style={{ color: '#1e40af', fontSize: 20, fontWeight: 900, margin: '0 0 4px 0' }}>100%</p>
            <p style={{ color: '#4b5563', fontSize: 12, margin: 0 }}>Transparent</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}