/**
 * Member Withdrawal System Module - COMPLETE GUIDED EXPERIENCE
 * BMP onboarding, email linking, 4-step flow, amount validation, trust elements
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WithdrawalBMPLinker from './WithdrawalBMPLinker';
import WithdrawalStepFlow from './WithdrawalStepFlow';
import WithdrawalAmountForm from './WithdrawalAmountForm';
import WithdrawalConfirmation from './WithdrawalConfirmation';
import WithdrawalProcessing from './WithdrawalProcessing';
import WithdrawalSuccess from './WithdrawalSuccess';
import WithdrawalHistory from './WithdrawalHistory';
import BMPActivationBlock from './BMPActivationBlock';

export default function WithdrawalModule() {
  const [bmpEmail, setBmpEmail] = useState(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const availableBalance = 5000;

  const completedSteps = useMemo(() => {
    const steps = [];
    if (bmpEmail) steps.push(2); // Email registered
    if (withdrawalAmount) steps.push(3); // Amount defined
    return steps;
  }, [bmpEmail, withdrawalAmount]);

  const currentStep = useMemo(() => {
    if (!bmpEmail) return 2; // Email registration
    if (!withdrawalAmount) return 3; // Amount selection
    return 4; // Confirmation
  }, [bmpEmail, withdrawalAmount]);

  const canConfirm = bmpEmail && withdrawalAmount && !isProcessing;

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsProcessing(false);
    setSuccessState(true);
  };

  const handleReset = () => {
    setBmpEmail(null);
    setWithdrawalAmount(null);
    setSuccessState(false);
  };

  if (successState) {
    return (
      <div className="space-y-6">
        <WithdrawalSuccess amount={withdrawalAmount} email={bmpEmail} onReset={handleReset} />
        <WithdrawalHistory />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STEP FLOW INDICATOR */}
      <WithdrawalStepFlow currentStep={currentStep} completedSteps={completedSteps} />

      {/* BMP EMAIL LINKING */}
      {!bmpEmail && <BMPActivationBlock />}
      <WithdrawalBMPLinker onEmailChange={setBmpEmail} initialEmail={bmpEmail} />

      {/* AMOUNT FORM - Only visible if email is set */}
      {bmpEmail && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <WithdrawalAmountForm 
            availableBalance={availableBalance} 
            onAmountChange={setWithdrawalAmount}
            initialAmount={withdrawalAmount}
          />
        </motion.div>
      )}

      {/* PROCESSING STATE */}
      <AnimatePresence>
        {isProcessing && <WithdrawalProcessing />}
      </AnimatePresence>

      {/* CONFIRMATION - Visible if not processing and amount is set */}
      {!isProcessing && bmpEmail && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <WithdrawalConfirmation 
            email={bmpEmail}
            amount={withdrawalAmount}
            availableBalance={availableBalance}
            stepsComplete={completedSteps.length >= 2}
            onConfirm={handleConfirm}
            isProcessing={isProcessing}
          />
        </motion.div>
      )}

      {/* WITHDRAWAL HISTORY */}
      <WithdrawalHistory />
    </div>
  );
}