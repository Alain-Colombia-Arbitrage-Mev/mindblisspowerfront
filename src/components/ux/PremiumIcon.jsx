/**
 * Premium Icon Wrapper
 * Monoline, thin stroke, neutral color
 */
import React from 'react';

export default function PremiumIcon({ 
  icon: Icon, 
  size = 20, 
  color = 'inherit',
  className = '',
  style = {},
  ...props 
}) {
  const sizeMap = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const finalSize = typeof size === 'string' ? sizeMap[size] || 20 : size;

  return (
    <Icon
      size={finalSize}
      strokeWidth={1.5}
      className={`icon-premium ${className}`}
      style={{
        color,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}