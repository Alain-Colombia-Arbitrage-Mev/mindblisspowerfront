export default function LogoWrapper({ src, size = 160, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15), 0 0 20px rgba(96, 165, 250, 0.2)',
        transition: 'all 300ms ease',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.25), 0 0 30px rgba(96, 165, 250, 0.35)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15), 0 0 20px rgba(96, 165, 250, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <img 
        src={src} 
        alt="Vicion Power" 
        style={{
          width: size * 0.65,
          height: size * 0.65,
          objectFit: 'contain',
        }} 
      />
    </div>
  );
}