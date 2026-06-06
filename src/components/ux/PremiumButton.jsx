/**
 * Premium Fintech Button
 * Dark base + blue glow, soft hover lift, active scale feedback
 */
import React from 'react';
import { cn } from '@/lib/utils';

export default function PremiumButton({
  children,
  variant = 'primary', // primary, secondary, danger, success
  size = 'md', // sm, md, lg
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const variantMap = {
    primary: 'btn-primary-premium',
    secondary: 'btn-secondary-premium',
    danger: 'btn-danger-premium',
    success: 'btn-success-premium',
  };

  const sizeMap = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        'btn-premium',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}