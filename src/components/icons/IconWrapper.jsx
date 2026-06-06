export default function IconWrapper({ 
  icon: IconComponent, 
  size = 24, 
  color = 'currentColor',
  className = '',
  style = {},
  animate = true,
}) {
  return (
    <div
      className={animate ? 'icon-hover-lift icon-click-bounce' : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <IconComponent 
        size={size} 
        color={color} 
        className={className}
        style={{
          strokeWidth: 1.5,
          transition: 'all 200ms ease',
        }}
      />
    </div>
  );
}