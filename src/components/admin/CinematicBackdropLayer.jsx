import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Cinematic Backdrop Layer
 * Soft moving gradients, scanning effects, animated grids, depth layers
 * Ultra-lightweight, GPU-accelerated
 */

const AnimatedGradient = () => (
  <motion.div
    animate={{
      backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
    }}
    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(135deg, 
        rgba(59,130,246,0.05) 0%,
        rgba(8,145,178,0.03) 25%,
        rgba(6,182,212,0.02) 50%,
        rgba(59,130,246,0.04) 75%,
        rgba(59,130,246,0.05) 100%)`,
      backgroundSize: '200% 200%',
      pointerEvents: 'none',
    }}
  />
);

const ScanningEffect = () => (
  <motion.div
    animate={{ y: ['0%', '100%'] }}
    transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      background: 'linear-gradient(to right, transparent, rgba(59,130,246,0.4), transparent)',
      boxShadow: '0 0 20px rgba(59,130,246,0.3)',
      pointerEvents: 'none',
      zIndex: 1,
    }}
  />
);

const AnimatedGrid = () => {
  const gridSize = 80;
  return (
    <motion.svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      animate={{ opacity: [0.03, 0.06, 0.03] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="rgba(59,130,246,0.2)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </motion.svg>
  );
};

const DepthLayer = ({ depth = 1 }) => (
  <motion.div
    animate={{
      opacity: [0.02 * depth, 0.04 * depth, 0.02 * depth],
    }}
    transition={{ duration: 12 + depth * 2, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(ellipse 1200px 600px at 50% ${20 + depth * 15}%, 
        rgba(59,130,246,${0.02 * depth}) 0%, 
        transparent 80%)`,
      pointerEvents: 'none',
      zIndex: depth,
    }}
  />
);

const CornersGlow = () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
    {/* Top-left */}
    <motion.div
      animate={{ opacity: [0.05, 0.12, 0.05] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 400,
        height: 300,
        background: 'radial-gradient(ellipse 200px 150px at 0% 0%, rgba(59,130,246,0.1), transparent)',
      }}
    />
    {/* Top-right */}
    <motion.div
      animate={{ opacity: [0.03, 0.08, 0.03] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 400,
        height: 300,
        background: 'radial-gradient(ellipse 200px 150px at 100% 0%, rgba(6,182,212,0.08), transparent)',
      }}
    />
    {/* Bottom-left */}
    <motion.div
      animate={{ opacity: [0.02, 0.07, 0.02] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 400,
        height: 300,
        background: 'radial-gradient(ellipse 200px 150px at 0% 100%, rgba(6,182,212,0.06), transparent)',
      }}
    />
    {/* Bottom-right */}
    <motion.div
      animate={{ opacity: [0.04, 0.1, 0.04] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 400,
        height: 300,
        background: 'radial-gradient(ellipse 200px 150px at 100% 100%, rgba(59,130,246,0.08), transparent)',
      }}
    />
  </div>
);

export default function CinematicBackdropLayer() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Base depth layers */}
      <DepthLayer depth={1} />
      <DepthLayer depth={2} />
      <DepthLayer depth={3} />

      {/* Animated grid */}
      <AnimatedGrid />

      {/* Corner glows */}
      <CornersGlow />

      {/* Main gradient flow */}
      <AnimatedGradient />

      {/* Scanning line */}
      <ScanningEffect />

      {/* Subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.15) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
}