import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import OnboardingTopBar from './OnboardingTopBar';
import Step1Intro from './Step1Intro';
import Step2Nature from './Step2Nature';
import Step3Risks from './Step3Risks';
import Step4Compliance from './Step4Compliance';
import Step5Consent from './Step5Consent';
import StepContract from './StepContract';
import ContractConfirmation from './ContractConfirmation';
import { ContractManager } from './ContractManager';

export default function LegalOnboardingFlow({ onComplete, participationLevel, selectedScenario, userId, userEmail }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem(`onboarding_step_${userId}`);
    return saved ? parseInt(saved) : 1;
  });
  const [consentLog, setConsentLog] = useState(null);
  const [contractLog, setContractLog] = useState(null);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`onboarding_step_${userId}`, step.toString());
    }
  }, [step, userId]);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 7));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  const handleExit = () => {
    if (userId) {
      localStorage.setItem(`onboarding_step_${userId}`, step.toString());
    }
    navigate('/');
  };

  const handleSubmit = (consentData) => {
    setConsentLog(consentData);
    console.log('Consent logged:', consentData);
  };

  const handleContractAccept = async () => {
    if (userId) {
      const log = await ContractManager.logContractAcceptance(userId, {
        terms: true,
        nature: true,
        risks: true,
        permanence: true,
      });
      setContractLog(log);
    }
    handleNext();
  };

  const handleComplete = () => {
    onComplete?.({ step, consentLog, contractLog });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <OnboardingTopBar
        currentStep={step}
        totalSteps={7}
        onBack={handleBack}
        onExit={handleExit}
      />

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto px-4 mb-12 pt-24">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s <= step
                    ? 'bg-vicion-blue text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                {s}
              </div>
              {s < 7 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all ${
                    s < step ? 'bg-vicion-blue' : 'bg-gray-200'
                  }`}
                  style={{ marginTop: '4px', marginBottom: '4px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step1Intro key="step1" onNext={handleNext} />
        )}
        {step === 2 && (
          <Step2Nature key="step2" onNext={handleNext} onBack={handleBack} />
        )}
        {step === 3 && (
          <Step3Risks key="step3" onNext={handleNext} onBack={handleBack} />
        )}
        {step === 4 && (
          <Step4Compliance key="step4" onNext={handleNext} onBack={handleBack} />
        )}
        {step === 5 && (
          <Step5Consent key="step5" onNext={handleNext} onBack={handleBack} onSubmit={handleSubmit} />
        )}
        {step === 6 && (
          <StepContract key="step6" onNext={handleContractAccept} onBack={handleBack} participationLevel={participationLevel} />
        )}
        {step === 7 && (
          <ContractConfirmation key="step7" onNext={handleComplete} onBack={handleBack} participationLevel={participationLevel} selectedScenario={selectedScenario} />
        )}
      </AnimatePresence>
    </div>
  );
}