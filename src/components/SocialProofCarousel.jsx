import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Carlos M.',
    role: 'Empresario',
    avatar: '👨‍💼',
    text: 'Entendí el sistema en una semana. Ahora tengo claridad sobre mis próximos pasos.',
    rating: 5,
    highlight: 'Claridad',
  },
  {
    id: 2,
    name: 'María L.',
    role: 'Profesional',
    avatar: '👩‍💼',
    text: 'Lo que me sorprendió fue la comunidad. No estoy solo en esto.',
    rating: 5,
    highlight: 'Comunidad',
  },
  {
    id: 3,
    name: 'Juan P.',
    role: 'Emprendedor',
    avatar: '👨‍🎓',
    text: 'Sin presión, sin promesas falsas. Es refrescante.',
    rating: 5,
    highlight: 'Transparencia',
  },
  {
    id: 4,
    name: 'Ana G.',
    role: 'Consultora',
    avatar: '👩‍🏫',
    text: 'La formación es sólida. Aprendí cosas que esperaba aprender.',
    rating: 5,
    highlight: 'Calidad',
  },
];

export default function SocialProofCarousel() {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoplay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    setAutoplay(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    setAutoplay(false);
  };

  const testimonial = TESTIMONIALS[current];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Main Testimonial */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-2xl mb-8"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          {/* Stars */}
          <div className="flex gap-1 mb-6">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} size={18} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
            ))}
          </div>

          {/* Quote */}
          <p style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.8,
            marginBottom: 20,
            fontStyle: 'italic',
            margin: 0,
          }}>
            "{testimonial.text}"
          </p>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div style={{
              fontSize: 40,
              width: 56,
              height: 56,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {testimonial.avatar}
            </div>
            <div>
              <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
                {testimonial.name}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                {testimonial.role}
              </p>
            </div>
            <div className="ml-auto px-4 py-2 rounded-full"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: 0 }}>
                {testimonial.highlight}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          onMouseEnter={() => setAutoplay(false)}
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#3b82f6',
            width: 44,
            height: 44,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.25)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
          }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => {
                setCurrent(i);
                setAutoplay(false);
              }}
              style={{
                width: i === current ? 32 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                border: 'none',
                cursor: 'pointer',
              }}
              animate={{
                width: i === current ? 32 : 8,
                background: i === current ? '#3b82f6' : 'rgba(255,255,255,0.2)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <button
          onClick={next}
          onMouseEnter={() => setAutoplay(false)}
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#3b82f6',
            width: 44,
            height: 44,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.25)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Meta */}
      <div className="mt-8 text-center">
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          {current + 1} de {TESTIMONIALS.length} historias
        </p>
      </div>
    </div>
  );
}