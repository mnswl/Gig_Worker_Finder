import { useEffect, useRef } from 'react';
import '../styles/CursorAura.css';

export default function CursorAura() {
  const auraRef = useRef(null);
  const hideTimeout = useRef(null);
  useEffect(() => {
    const aura = auraRef.current;
    if (!aura) return;

    const move = e => {
      const { clientX: x, clientY: y } = e;
      aura.style.left = `${x}px`;
      aura.style.top = `${y}px`;
      aura.style.opacity = '1';
      // Reset hide timer
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => {
        aura.style.opacity = '0';
      }, 150);
    };

    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('mousemove', move);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  return <div ref={auraRef} className="cursor-aura" />;
}
