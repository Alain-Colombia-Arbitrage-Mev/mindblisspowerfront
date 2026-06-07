import { motion } from 'framer-motion';

export default function NotForEveryone() {
  return (
    <section style={{
      background: '#0F1419',
      color: '#FFFFFF',
      padding: '120px 24px',
      textAlign: 'center'
    }}>
      <div className="max-w-2xl mx-auto space-y-16">
        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              fontSize: 48,
              fontWeight: 900,
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.2,
              color: '#FFFFFF',
              letterSpacing: -1
            }}
          >
            Esto no es para todos
          </motion.h2>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 60 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              height: 2,
              background: '#3b82f6',
              margin: '0 auto'
            }}
          />

          {/* First Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              fontSize: 20,
              fontWeight: 400,
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Inter, sans-serif',
              margin: 0,
              maxWidth: 700,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Mindbliss Power no es para quienes buscan resultados rápidos.
            <br />
            <br />
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>
              Es para quienes entienden que construir en el tiempo requiere estructura, criterio y decisión.
            </span>
          </motion.p>
        </motion.div>

        {/* Separator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.3 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.1)'
          }}
        />

        {/* Second Message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="space-y-8"
        >
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.6,
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              margin: 0,
              letterSpacing: -0.3
            }}
          >
            No se trata de entrar.
            <br />
            <br />
            <span style={{ color: '#3b82f6' }}>
              Se trata de entender por qué estás aquí.
            </span>
          </motion.p>
        </motion.div>

        {/* Supporting Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-20 pt-16 space-y-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          {[
            'Si buscas dinero fácil, no es aquí',
            'Si no entiendes el compromiso, no es para ti',
            'Si no respetas la estructura, no encajas',
            'Si buscas atajos, esto no es lo tuyo'
          ].map((point, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.7 + i * 0.08 }}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'Inter, sans-serif',
                margin: 0
              }}
            >
              {point}
            </motion.p>
          ))}
        </motion.div>

        {/* CTA - But Here's What We Offer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-20 pt-16 space-y-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#3b82f6',
            margin: 0,
            fontFamily: 'Inter, sans-serif'
          }}>
            Pero si sí entiendes...
          </h3>

          <p style={{
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'Inter, sans-serif',
            margin: 0,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Entonces ofrecemos algo raro en 2026: una comunidad real, estructura clara, transparencia total, y la oportunidad de construir algo que importa.
          </p>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 1 }}
            style={{
              padding: '14px 40px',
              background: '#3b82f6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              marginTop: 8
            }}
            onMouseEnter={e => {
              e.target.style.background = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 24px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={e => {
              e.target.style.background = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Saber si es para ti
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}