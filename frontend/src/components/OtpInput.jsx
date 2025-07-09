import { useRef } from 'react';

/**
 * Six-digit OTP input composed of 6 separate boxes.
 * Props:
 *  value: string (length 0-6)
 *  onChange: fn(newValue: string)
 */
export default function OtpInput({ value = '', onChange, disabled = false }) {
  // refs to each input
  const inputsRef = useRef([]);

  const handleChange = (idx, e) => {
    if (disabled) return;
    const char = e.target.value.replace(/\D/g, '').slice(-1); // keep last digit
    const chars = value.split('');
    chars[idx] = char;
    const newVal = chars.join('').slice(0, 6);
    onChange(newVal);
    // focus next if char entered
    if (char && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (disabled) return;
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (disabled) return;
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    e.preventDefault();
    onChange(paste);
    // populate inputs visually on next tick
    setTimeout(() => {
      paste.split('').forEach((d, i) => {
        if (inputsRef.current[i]) inputsRef.current[i].value = d;
      });
      const focusIdx = paste.length >= 6 ? 5 : paste.length;
      inputsRef.current[focusIdx]?.focus();
    });
  };

  return (
    <div className="d-flex gap-2 justify-content-center">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input 
          disabled={disabled}
          key={idx}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`form-control text-center otp-box ${disabled ? 'disabled' : ''}`}
          style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
          value={value[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          ref={(el) => (inputsRef.current[idx] = el)}
        />
      ))}
    </div>
  );
}
