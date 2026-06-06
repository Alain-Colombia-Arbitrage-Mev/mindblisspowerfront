import { motion } from 'framer-motion';

/**
 * Editable Field with Lock
 * Wraps form fields with lock-aware edit/view modes
 */

export default function EditableFieldWithLock({
  label,
  value,
  onChange,
  canEdit,
  type = 'text',
  placeholder,
  disabled = false,
  className,
  style,
}) {
  const fieldStyle = {
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: 12,
    transition: 'all 200ms ease',
    border: '1px solid rgba(255,255,255,0.1)',
    background: canEdit ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
    color: 'white',
    cursor: canEdit && !disabled ? 'text' : 'not-allowed',
    opacity: canEdit ? 1 : 0.6,
    ...style,
  };

  const containerStyle = {
    marginBottom: '16px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '6px',
    letterSpacing: '0.05em',
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: canEdit ? 1 : 0.7 }}
        transition={{ duration: 0.2 }}
      >
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={onChange}
            disabled={!canEdit || disabled}
            placeholder={placeholder}
            className={className}
            style={{ ...fieldStyle, minHeight: '120px', resize: 'vertical' }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={!canEdit || disabled}
            placeholder={placeholder}
            className={className}
            style={fieldStyle}
          />
        )}
      </motion.div>
      {!canEdit && (
        <p style={{ fontSize: 10, color: 'rgba(251,146,60,0.6)', marginTop: '4px' }}>
          ⚠ This field is locked
        </p>
      )}
    </div>
  );
}