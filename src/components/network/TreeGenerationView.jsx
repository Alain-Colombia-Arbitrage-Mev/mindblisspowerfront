/**
 * GENERATION VIEW — miembros agrupados por generación
 * Estilo Figma "Red Binaria": chips de ancho uniforme, alternando
 * variante destacada (avatar dorado) / normal (avatar verde).
 */
import { motion } from 'framer-motion';

export default function TreeGenerationView({ dataset, onSelect }) {
  const members = dataset.members;

  // Agrupar por profundidad de generación
  const byGen = {};
  members.forEach(m => {
    const g = m.generation_depth;
    if (!byGen[g]) byGen[g] = [];
    byGen[g].push(m);
  });

  const gens = Object.keys(byGen).sort((a, b) => a - b);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 800, margin: '0 0 20px 0' }}>
        Vista por generación - {members.length} Miembros
      </p>

      {gens.map(gen => (
        <motion.div
          key={gen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Number(gen) * 0.05 }}
          style={{ marginBottom: 24 }}
        >
          {/* Encabezado de generación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 38, height: 36, borderRadius: 10,
              background: 'var(--vp-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#1b1b1c', fontSize: 13, fontWeight: 900 }}>G{gen}</span>
            </div>
            <p style={{ color: 'var(--vp-muted)', fontSize: 13, fontWeight: 600, margin: 0 }}>
              Generación {gen} - {byGen[gen].length} Miembros
            </p>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 13 }}>
            {byGen[gen].map(m => {
              const highlighted = m.binary_side === 'left';
              const avatarBg = highlighted ? 'var(--vp-accent)' : 'var(--vp-green, var(--vp-accent))';
              const chipBg = highlighted ? 'var(--vp-muted)' : 'var(--vp-surface)';
              const nameColor = highlighted ? '#1b1b1c' : 'var(--vp-text)';
              const amountColor = highlighted ? '#242426' : 'var(--vp-muted)';
              const initials = m.full_name.split(' ').slice(0, 2).map(w => w[0]).join('');

              return (
                <motion.div
                  key={m.user_id}
                  whileHover={{ y: -2 }}
                  onClick={() => onSelect(m)}
                  style={{
                    width: 184,
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: chipBg,
                    border: highlighted ? 'none' : '1px solid var(--vp-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'transform 0.15s',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                    background: avatarBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#1b1b1c', fontSize: 11, fontWeight: 900 }}>
                      {initials}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: nameColor, fontSize: 14, fontWeight: 900, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.full_name.split(' ').slice(0, 2).join(' ')}
                    </p>
                    <p style={{ color: amountColor, fontSize: 13, fontWeight: 300, margin: 0 }}>
                      ${m.investment_amount.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
