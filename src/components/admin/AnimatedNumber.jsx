/**
 * AnimatedNumber — smoothly transitions between numeric values.
 * Designed for enterprise dashboards: no bounce, no overshoot.
 * Duration is short and linear to feel like a data update, not an animation.
 */
import { useEffect, useRef, useState } from 'react';

function parseNumeric(val) {
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[$,+%K]/g, '');
  return parseFloat(str) || 0;
}

export default function AnimatedNumber({ value, duration = 600, style, className }) {
  const raw = String(value);
  const prefix = raw.match(/^[$+]/)?.[0] || '';
  const suffix = raw.match(/[%K]$/)?.[0] || '';
  const numeric = parseNumeric(raw);

  const [displayed, setDisplayed] = useState(numeric);
  const [highlight, setHighlight] = useState(false);
  const prevRef = useRef(numeric);
  const frameRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === numeric) return;

    // Trigger highlight flash on change
    setHighlight(true);
    const clearHL = setTimeout(() => setHighlight(false), 1200);

    const start = performance.now();
    const delta = numeric - prev;
    const isInt = Number.isInteger(numeric);

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad — feels data-like, not bouncy
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = prev + delta * eased;
      setDisplayed(isInt ? Math.round(current) : parseFloat(current.toFixed(1)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        prevRef.current = numeric;
      }
    }

    frameRef.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(clearHL);
    };
  }, [numeric, duration]);

  const formatted = Number.isInteger(numeric)
    ? displayed.toLocaleString()
    : displayed.toFixed(1);

  return (
    <span
      className={className}
      style={{
        ...style,
        transition: 'color 0.4s ease',
        color: highlight ? '#ffffff' : style?.color,
      }}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
}