import { motion } from 'framer-motion';
import WithdrawalHero from '@/components/member/WithdrawalHero';
import WithdrawalModule from '@/components/member/WithdrawalModule';

export default function MemberWithdrawals() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ background: '#05070D', minHeight: '100vh' }}
    >
      {/* Single hero */}
      <WithdrawalHero />

      {/* Withdrawal flow */}
      <div style={{ padding: '32px 40px', maxWidth: 860 }}>
        <WithdrawalModule />
      </div>
    </motion.div>
  );
}