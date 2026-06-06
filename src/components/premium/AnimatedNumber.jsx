import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedNumber({ 
  value, 
  prefix = '$', 
  suffix = '', 
  decimals = 0,
  duration = 1.5,
  color = '#93C5FD'
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      const newValue = startValue + diff * easeOutQuad;
      setDisplayValue(newValue);

      if (progress === 1) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, displayValue]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <motion.span
      style={{ color }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  );
}