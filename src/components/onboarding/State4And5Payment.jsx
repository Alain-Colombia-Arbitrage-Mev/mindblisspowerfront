import { useState } from 'react';
import { CreditCard, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import simulatedApi from '@/api/simulatedApi';

const plans = {
  Start: { price: 500, benefits: ['Acceso básico', 'Comunidad', 'Formación inicial'] },
  Growth: { price: 1000, benefits: ['Acceso avanzado', 'Estructura', 'Beneficios progresivos'] },
  Advance: { price: 2500, benefits: ['Acceso completo', 'Herramientas', 'Máximos beneficios'] },
  Pro: { price: 5000, benefits: ['Liderazgo', 'Prioridad', 'Reconocimiento'] },
  Elite: { price: 25000, benefits: ['Acceso total', 'Máxima participación', 'Nivel elite'] },
};

export default function State4And5Payment({ participationType, onComplete }) {
  const [step, setStep] = useState('plan'); // 'plan' | 'payment'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Payment form
  const [cardNumber, setCardNumber] = useState('');
  const [cardDate, setCardDate] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [error, setError] = useState('');

  const handlePlanSelect = async (planName) => {
    setSelectedPlan(planName);
    setLoading(true);

    try {
      await simulatedApi.processPlanSelection('USER_ID', planName);
      setTimeout(() => setStep('payment'), 800);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardDate || !cardCVV) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');
    setPaymentStatus('processing');

    try {
      const result = await simulatedApi.processPayment({ cardNumber, cardDate, cardCVV });

      if (result.status === 'approved') {
        setPaymentStatus('approved');
        setTimeout(() => {
          onComplete({
            plan: selectedPlan,
            paymentStatus: 'approved',
            transactionId: result.transactionId,
          });
        }, 2000);
      } else if (result.status === 'review') {
        setPaymentStatus('review');
        setTimeout(() => {
          onComplete({
            plan: selectedPlan,
            paymentStatus: 'review',
            transactionId: result.transactionId,
          });
        }, 2000);
      } else {
        setPaymentStatus('declined');
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'plan') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-10 text-center">
          <h1 className="font-montserrat font-black text-3xl text-white mb-3">Selecciona tu nivel</h1>
          <p className="text-white/50 text-base">Elige el plan que se adapte a tu participación</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(plans).map(([name, data]) => (
            <button
              key={name}
              onClick={() => handlePlanSelect(name)}
              disabled={loading}
              className="p-6 rounded-2xl transition-all duration-300"
              style={{
                background: selectedPlan === name ? 'rgba(29,110,245,0.25)' : 'rgba(13,31,60,0.6)',
                border: selectedPlan === name ? '2px solid #3b82f6' : '1px solid rgba(59,130,246,0.2)',
              }}
            >
              {loading && selectedPlan === name && (
                <Loader size={20} className="animate-spin text-white mx-auto mb-4" />
              )}
              <h3 className="font-montserrat font-bold text-white text-xl mb-2">{name}</h3>
              <p className="text-2xl font-bold text-vicion-electric mb-4">${data.price}</p>
              <ul className="space-y-2 mb-4">
                {data.benefits.map((b, i) => (
                  <li key={i} className="text-white/60 text-sm">✓ {b}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <CreditCard size={24} style={{ color: '#3b82f6' }} />
        </div>
        <h1 className="font-montserrat font-black text-2xl text-white mb-2">Confirma tu pago</h1>
        <p className="text-white/50 text-sm">Plan: <span className="text-white font-semibold">{selectedPlan}</span> - ${plans[selectedPlan].price}</p>
      </div>

      {paymentStatus === 'approved' && (
        <div className="text-center py-8">
          <CheckCircle size={48} style={{ color: '#10b981' }} className="mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Pago confirmado</p>
          <p className="text-white/50 text-sm">Tu activación está procesándose...</p>
        </div>
      )}

      {paymentStatus === 'review' && (
        <div className="text-center py-8">
          <AlertCircle size={48} style={{ color: '#f59e0b' }} className="mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Operación en revisión</p>
          <p className="text-white/50 text-sm">Tu pago está siendo validado. Procederemos pronto.</p>
        </div>
      )}

      {!paymentStatus && (
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Número de tarjeta</label>
            <input
              type="text"
              maxLength="16"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-lg bg-transparent text-white border border-white/10 outline-none"
              placeholder="4242 4242 4242 4242"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm font-medium block mb-2">Vencimiento</label>
              <input
                type="text"
                maxLength="5"
                value={cardDate}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                  setCardDate(val);
                }}
                className="w-full px-4 py-3 rounded-lg bg-transparent text-white border border-white/10 outline-none"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm font-medium block mb-2">CVV</label>
              <input
                type="text"
                maxLength="3"
                value={cardCVV}
                onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-lg bg-transparent text-white border border-white/10 outline-none"
                placeholder="123"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !cardNumber || !cardDate || !cardCVV}
            className="w-full py-3 rounded-xl font-bold font-montserrat transition-all duration-200 text-white flex items-center justify-center gap-2"
            style={{
              background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
              opacity: (loading || !cardNumber) ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Procesando operación…
              </>
            ) : (
              'Procesar pago'
            )}
          </button>
        </form>
      )}
    </div>
  );
}