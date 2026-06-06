import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import simulatedApi from '@/api/simulatedApi';

export default function State6Review({ userId, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 500);

      try {
        const result = await simulatedApi.checkApprovalStatus(userId);
        setProgress(100);
        setTimeout(() => {
          onComplete({ approved: true });
        }, 800);
      } catch (err) {
        clearInterval(interval);
      }
      setLoading(false);
    };

    checkStatus();
  }, [userId, onComplete]);

  return (
    <div className="max-w-md mx-auto p-8 rounded-2xl text-center" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <h1 className="font-montserrat font-black text-2xl text-white mb-3">Validando tu activación</h1>
      <p className="text-white/50 text-sm mb-8">Tu solicitud está siendo revisada para habilitar tu acceso</p>

      <div className="mb-8">
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            }}
          />
        </div>
        <p className="text-white/40 text-xs mt-2">{Math.floor(Math.min(progress, 100))}%</p>
      </div>

      {progress === 100 && (
        <div className="flex justify-center mb-4">
          <CheckCircle size={48} style={{ color: '#10b981' }} className="animate-bounce" />
        </div>
      )}

      <p className="text-white/50 text-sm">Por favor espera mientras validamos tu información...</p>
    </div>
  );
}