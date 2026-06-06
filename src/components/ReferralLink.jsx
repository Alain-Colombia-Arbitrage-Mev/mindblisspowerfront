import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2 } from 'lucide-react';

export default function ReferralLink({ userId, userName }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://vicionpower.com/join?ref=${userId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-2xl"
      style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}
    >
      <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
        TU LINK PERSONAL
      </p>
      
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 16, margin: '0 0 16px 0' }}>
        Tu enlace es único. Cada persona que se registre a través de él suma a tu estructura de forma natural y orgánica.
      </p>

      {/* Link display */}
      <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Share2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
        <input
          type="text"
          value={referralLink}
          readOnly
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            outline: 'none',
          }}
        />
      </div>

      {/* Copy button */}
      <motion.button
        onClick={handleCopy}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        style={{
          background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
          border: `1px solid ${copied ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.3)'}`,
          color: '#10b981',
          fontSize: 14,
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(16,185,129,0.25)';
          e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
          e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
        }}
      >
        {copied ? (
          <>
            <Check size={16} /> Copiado
          </>
        ) : (
          <>
            <Copy size={16} /> Copiar link
          </>
        )}
      </motion.button>

      {/* Tips */}
      <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8, margin: '0 0 8px 0' }}>💡 CONSEJOS</p>
        <ul style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
          <li>Comparte solo con personas que creas que pueden encajar</li>
          <li>Explica primero qué es Vicion, luego comparte el link</li>
          <li>La calidad de tus invitaciones determina el éxito de tu red</li>
        </ul>
      </div>
    </motion.div>
  );
}