import { useState } from 'react';
import { Mail, Loader, CheckCircle, RotateCw } from 'lucide-react';
import simulatedApi from '@/api/simulatedApi';

export default function State2EmailVerification({ email, onComplete }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(true);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await simulatedApi.verifyEmail(code);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onComplete({ email, verified: true });
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al validar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const result = await simulatedApi.sendVerificationCode(email);
      setCodeSent(true);
      setCode('');
      setError('');
      setTimeout(() => {
        alert(`Código de prueba: ${result.testCode}`);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <Mail size={24} style={{ color: '#3b82f6' }} />
        </div>
        <h1 className="font-montserrat font-black text-2xl text-white mb-2">Verifica tu correo</h1>
        <p className="text-white/50 text-sm">Te hemos enviado un código a <span className="text-white/70 font-medium">{email}</span></p>
      </div>

      {success ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} style={{ color: '#10b981' }} />
          </div>
          <p className="text-white font-semibold mb-2">Correo verificado correctamente</p>
          <p className="text-white/50 text-sm">Procediiendo con tu activación...</p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Código de verificación (6 dígitos)</label>
            <input
              type="text"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-lg text-center text-2xl tracking-widest font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="000000"
            />
            <p className="text-white/30 text-xs mt-2 text-center">Código de prueba: 123456</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 rounded-xl font-bold font-montserrat transition-all duration-200 text-white flex items-center justify-center gap-2"
            style={{
              background: (loading || code.length !== 6) ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
              opacity: (loading || code.length !== 6) ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Validando código…
              </>
            ) : (
              'Validar código'
            )}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="w-full py-2 rounded-xl font-medium text-vicion-electric hover:text-blue-300 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCw size={16} />
            Reenviar código
          </button>
        </form>
      )}
    </div>
  );
}