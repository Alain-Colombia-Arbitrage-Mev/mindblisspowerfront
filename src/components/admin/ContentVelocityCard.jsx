import { motion } from 'framer-motion';

export default function ContentVelocityCard({ label, value, daily, weekly, color, subtext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-lg"
      style={{ background: `${color}08`, border: `1px solid ${color}25` }}
    >
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
        {label}
      </p>

      <p style={{ color: color, fontSize: 32, fontWeight: 900, margin: '0 0 12px 0' }}>
        {value}
      </p>

      <div className="space-y-2">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 2px 0' }}>
            Daily Average
          </p>
          <p style={{ color: color, fontSize: 14, fontWeight: 700, margin: 0 }}>
            {daily.toFixed(1)}
          </p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 2px 0' }}>
            Weekly Total
          </p>
          <p style={{ color: color, fontSize: 14, fontWeight: 700, margin: 0 }}>
            {Math.round(weekly)}
          </p>
        </div>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '12px 0 0 0' }}>
        {subtext}
      </p>
    </motion.div>
  );
}