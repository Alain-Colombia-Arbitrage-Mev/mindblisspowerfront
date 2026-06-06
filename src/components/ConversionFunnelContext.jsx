import { createContext, useContext, useState } from 'react';

const ConversionFunnelContext = createContext();

export function FunnelProvider({ children }) {
  const [funnelState, setFunnelState] = useState({
    stage: 'landing', // landing → qualify → onboarding → planes → contract → payment → activation
    userData: null,
    qualificationData: null,
    planSelected: null,
  });

  const advanceFunnel = (nextStage, data = {}) => {
    setFunnelState(prev => ({
      ...prev,
      stage: nextStage,
      ...data,
    }));
  };

  return (
    <ConversionFunnelContext.Provider value={{ funnelState, advanceFunnel }}>
      {children}
    </ConversionFunnelContext.Provider>
  );
}

export function useFunnel() {
  const context = useContext(ConversionFunnelContext);
  if (!context) {
    throw new Error('useFunnel debe ser usado dentro de FunnelProvider');
  }
  return context;
}