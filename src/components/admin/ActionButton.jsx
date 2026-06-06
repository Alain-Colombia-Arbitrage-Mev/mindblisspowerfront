import { motion } from 'framer-motion';
import useAdminAction from '@/hooks/useAdminAction';

/**
 * Action Button Component
 * Every button executes a real action with simulation
 * No decorative buttons allowed
 */

export default function ActionButton({
  actionType,
  payload,
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  onSuccess,
  onError,
  title,
  disabled = false,
  className,
  style,
}) {
  const { execute, loading } = useAdminAction();

  // Reject if no action type defined
  if (!actionType) {
    console.error('ActionButton requires actionType prop');
    return null;
  }

  const variantStyles = {
    primary: {
      background: 'rgba(59,130,246,0.2)',
      color: '#3b82f6',
      border: '1px solid rgba(59,130,246,0.3)',
      hover: 'rgba(59,130,246,0.3)',
    },
    success: {
      background: 'rgba(16,185,129,0.2)',
      color: '#10b981',
      border: '1px solid rgba(16,185,129,0.3)',
      hover: 'rgba(16,185,129,0.3)',
    },
    danger: {
      background: 'rgba(239,68,68,0.2)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.3)',
      hover: 'rgba(239,68,68,0.3)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(255,255,255,0.1)',
      hover: 'rgba(255,255,255,0.12)',
    },
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: 11, fontWeight: 600 },
    md: { padding: '8px 16px', fontSize: 12, fontWeight: 600 },
    lg: { padding: '10px 20px', fontSize: 13, fontWeight: 700 },
  };

  const variantConfig = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  const handleClick = async () => {
    try {
      await execute(actionType, payload, onSuccess, onError);
    } catch (err) {
      // Error already handled in hook
      console.error('Action execution error:', err);
    }
  };

  const buttonStyle = {
    ...variantConfig,
    ...sizeConfig,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    transition: 'all 200ms ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    ...style,
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, backgroundColor: variantConfig.hover } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={handleClick}
      disabled={disabled || loading}
      style={buttonStyle}
      className={className}
      title={title || `Execute ${actionType}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Processing...
        </>
      ) : (
        <>
          {Icon && <Icon size={14} />}
          {children}
        </>
      )}
    </motion.button>
  );
}