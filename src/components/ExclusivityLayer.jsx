import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function ExclusivityLayer() {
  return (
    <section style={{
      background: '#f9fafb',
      padding: '100px 24px',
      textAlign: 'center'
    }}>
      <div className="max-w-3xl mx-auto space-y-20">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          style={{
            width: 60,
            height: 60,
            margin: '0 auto',
            borderRadius: 12,
            background: 'rgba(30, 64, 175, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(30, 64, 175, 0.2)'
          }}
        >
          <Lock size={28} style={{ color: '#1e40af' }} />
        </motion.div>

        {/* First Message */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="space-y-6"
        >
          <h2 style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#0F1419',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.2
          }}>
            El acceso no es lo importante.
          </h2>

          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 50 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              height: 2,
              background: '#1e40af',
              margin: '0 auto'
            }}
          />

          <p style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#1e40af',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.6
          }}>
            Lo importante es qué haces una vez dentro.
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.2 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            height: 1,
            background: '#0F1419'
          }}
        />

        {/* Second Message */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUp}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="space-y-8"
        >
          <h3 style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#0F1419',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.3
          }}>
            No todos avanzan.
            <br />
            <span style={{ color: '#1e40af' }}>Solo los que entienden.</span>
          </h3>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.5 }}
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: '#4b5563',
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.7,
              maxWidth: 500,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            El movimiento no es un producto. Es un filtro. Si no comprendes la diferencia, probablemente no estés listo.
          </motion.p>
        </motion.div>

        {/* Mental Filter Points */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="pt-16 space-y-4"
          style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
        >
          {[
            'El acceso te deja entrar',
            'La comprensión te hace avanzar',
            'El compromiso te mantiene dentro',
            'El entendimiento te hace crecer'
          ].map((point, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#4b5563',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                paddingLeft: 20,
                borderLeft: '2px solid rgba(30, 64, 175, 0.3)',
                lineHeight: 1.6
              }}
            >
              {point}
            </motion.p>
          ))}
        </motion.div>

        {/* Bottom message - Self-selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="p-8 rounded-12 mt-8"
          style={{
            background: 'rgba(30, 64, 175, 0.04)',
            border: '1px solid rgba(30, 64, 175, 0.15)'
          }}
        >
          <p style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1e40af',
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.7
          }}>
            Si lees esto y piensas "esto es para mí", probablemente tengas razón. Si buscas confirmación, probablemente no.
          </p>
        </motion.div>
      </div>
    </section>
  );
}