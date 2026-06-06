import { Lock, ArrowRight } from 'lucide-react';
import { PrimaryBtn } from './DashShared';

export default function LockedPreview({ module, onActivate }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <Lock size={36} style={{ color: '#3b82f6' }} />
        </div>
        <h2 className="text-white font-black text-2xl mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Access Restricted
        </h2>
        <p className="mb-2" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          Activate your account to unlock your private member dashboard.
        </p>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
          Complete your profile, verify your identity, and confirm your initial activation to gain full access to all platform modules including your structure, incentives, and progression tools.
        </p>
        <PrimaryBtn onClick={onActivate}>
          Activate Your Account <ArrowRight size={16} />
        </PrimaryBtn>
        <div className="mt-8 flex items-center gap-3 justify-center">
          {['Registration', 'Profile', 'Activation'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? '' : ''}`}
                  style={{ background: i === 0 ? '#3b82f6' : 'rgba(255,255,255,0.08)', color: i === 0 ? 'white' : 'rgba(255,255,255,0.3)' }}>
                  {i + 1}
                </div>
                <span className="text-xs" style={{ color: i === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>{step}</span>
              </div>
              {i < 2 && <div className="w-6 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}