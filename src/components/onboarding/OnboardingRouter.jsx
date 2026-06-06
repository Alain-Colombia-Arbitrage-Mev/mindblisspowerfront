import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import State1Register from './State1Register';
import State2EmailVerification from './State2EmailVerification';
import State3Activation from './State3Activation';
import State4And5Payment from './State4And5Payment';
import State6Review from './State6Review';
import State7Layer1 from './State7Layer1';
import State8Layer2Training from './State8Layer2Training';
import State9Layer3Full from './State9Layer3Full';

export default function OnboardingRouter({ onComplete }) {
  const { addNotification } = useNotification();
  const [state, setState] = useState('register');
  const [userData, setUserData] = useState({});

  const handleStateTransition = (nextState, data) => {
    setUserData(prev => ({ ...prev, ...data }));

    // Trigger notifications on state changes
    if (nextState === 'verify') {
      addNotification({
        type: 'SISTEMA',
        title: 'Cuenta creada',
        description: 'Tu acceso ha sido creado correctamente. Continúa con la verificación.',
      });
    } else if (nextState === 'activate') {
      addNotification({
        type: 'ACTIVACION',
        title: 'Correo verificado',
        description: 'Tu correo ha sido validado. Ya puedes continuar con tu activación.',
      });
    } else if (nextState === 'payment' && data.participationType) {
      addNotification({
        type: 'SISTEMA',
        title: 'Nivel seleccionado',
        description: 'Has seleccionado tu nivel de participación. Completa la activación para continuar.',
      });
    } else if (data.paymentStatus === 'approved') {
      addNotification({
        type: 'ACTIVACION',
        title: 'Activación confirmada',
        description: 'Tu participación ha sido activada correctamente.',
      });
    } else if (data.paymentStatus === 'review') {
      addNotification({
        type: 'REVISION',
        title: 'Validación en curso',
        description: 'Tu activación está siendo revisada para completar el proceso.',
      });
    } else if (nextState === 'layer1') {
      addNotification({
        type: 'ACTIVACION',
        title: 'Acceso habilitado',
        description: 'Ya puedes ingresar a tu panel y comenzar tu recorrido dentro del sistema.',
      });
    } else if (nextState === 'layer2') {
      addNotification({
        type: 'FORMACION',
        title: 'Modo crecimiento activado',
        description: 'Ahora puedes acceder a formación para avanzar dentro del sistema.',
      });
    } else if (nextState === 'layer3') {
      addNotification({
        type: 'ACTIVACION',
        title: 'Sistema completo activo',
        description: 'Ya tienes acceso a todas las funcionalidades del sistema.',
      });
    }

    const stateMap = {
      register: 'verify',
      verify: 'activate',
      activate: 'payment',
      payment: data.paymentStatus === 'approved' ? 'review' : 'payment',
      review: 'layer1',
      layer1: 'layer2',
      layer2: 'layer3',
      layer3: null,
    };

    if (data.layer === 3) {
      onComplete(userData);
    } else if (stateMap[state]) {
      setState(stateMap[state]);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 100%)' }}>
      {/* Progress indicator */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between text-center">
          {['Register', 'Verify', 'Activate', 'Payment', 'Review', 'Layer 1', 'Layer 2', 'Layer 3'].map((label, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all"
                style={{
                  background:
                    ['register', 'verify', 'activate', 'payment', 'review', 'layer1', 'layer2', 'layer3'][i] === state
                      ? 'linear-gradient(135deg, #1d6ef5, #3b82f6)'
                      : ['register', 'verify', 'activate', 'payment', 'review', 'layer1', 'layer2', 'layer3'].indexOf(state) > i
                      ? '#10b981'
                      : 'rgba(255,255,255,0.1)',
                  color:
                    ['register', 'verify', 'activate', 'payment', 'review', 'layer1', 'layer2', 'layer3'][i] === state ||
                    ['register', 'verify', 'activate', 'payment', 'review', 'layer1', 'layer2', 'layer3'].indexOf(state) > i
                      ? 'white'
                      : 'rgba(255,255,255,0.3)',
                }}
              >
                {['register', 'verify', 'activate', 'payment', 'review', 'layer1', 'layer2', 'layer3'].indexOf(state) > i ? '✓' : i + 1}
              </div>
              <span className="text-white/50 text-xs font-medium hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* State Content */}
      <div className="max-w-7xl mx-auto">
        {state === 'register' && <State1Register onComplete={(data) => handleStateTransition('verify', data)} />}
        {state === 'verify' && <State2EmailVerification email={userData.email} onComplete={(data) => handleStateTransition('activate', data)} />}
        {state === 'activate' && <State3Activation userId={userData.userId} onComplete={(data) => handleStateTransition('activate', data)} />}
        {state === 'payment' && <State4And5Payment participationType={userData.participationType} onComplete={(data) => handleStateTransition('payment', data)} />}
        {state === 'review' && <State6Review userId={userData.userId} onComplete={(data) => handleStateTransition('review', data)} />}
        {state === 'layer1' && <State7Layer1 userId={userData.userId} onComplete={(data) => handleStateTransition('layer1', data)} />}
        {state === 'layer2' && <State8Layer2Training userId={userData.userId} onComplete={(data) => handleStateTransition('layer2', data)} />}
        {state === 'layer3' && <State9Layer3Full userId={userData.userId} onDashboardReady={(data) => handleStateTransition('layer3', data)} />}
      </div>
    </div>
  );
}