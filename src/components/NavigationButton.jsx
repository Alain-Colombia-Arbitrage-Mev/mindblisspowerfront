import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { validateNavigation } from '@/lib/NavigationGuard';

/**
 * Validated Navigation Button
 * Ensures all buttons have working routes
 * Prevents broken navigation
 */

export default function NavigationButton({
  to,
  onClick,
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  className,
  style,
  title,
  disabled = false,
}) {
  // Validate route if provided
  const validRoute = to ? validateNavigation(window.location.pathname, to) : null;

  // Reject if no action defined
  if (!to && !onClick) {
    console.error('NavigationButton must have either "to" or "onClick" defined');
    return null;
  }

  // Reject if disabled without reason
  if (disabled && !title) {
    console.warn('Disabled button should have a title explaining why');
  }

  const baseStyles = {
    primary: {
      background: 'rgba(59,130,246,0.2)',
      color: '#3b82f6',
      border: '1px solid rgba(59,130,246,0.3)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    danger: {
      background: 'rgba(239,68,68,0.2)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.3)',
    },
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: 11, fontWeight: 600 },
    md: { padding: '8px 16px', fontSize: 12, fontWeight: 600 },
    lg: { padding: '10px 20px', fontSize: 13, fontWeight: 700 },
  };

  const buttonStyle = {
    ...baseStyles[variant],
    ...sizeStyles[size],
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    transition: 'all 200ms ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const content = (
    <>
      {Icon && <Icon size={14} />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={validRoute} style={{ textDecoration: 'none' }} title={title}>
        <motion.button
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
          style={buttonStyle}
          disabled={disabled}
          className={className}
        >
          {content}
        </motion.button>
      </Link>
    );
  }

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      style={buttonStyle}
      disabled={disabled}
      className={className}
      title={title}
    >
      {content}
    </motion.button>
  );
}