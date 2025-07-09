import { animate } from 'animejs';

let initialized = false;

// Initialize global button ripple on elements with .btn class
export const initButtonRipple = () => {
  if (initialized) return;
  initialized = true;

  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if(btn) window.modalTriggerRect = btn.getBoundingClientRect();
    if (!btn) return;
    
    // Make sure button has relative positioning and hidden overflow
    if (getComputedStyle(btn).position === 'static') {
      btn.style.position = 'relative';
    }
    // no clipping when we attach to body

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    // inline fallback styles in case global CSS not yet applied
    ripple.style.position = 'fixed';
    ripple.style.borderRadius = '50%';
    // determine contrasting ripple color
    const bg = getComputedStyle(btn).backgroundColor;
    const filled = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
    ripple.style.background = filled ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.3)';
    
    ripple.style.transform = 'scale(0)';
    ripple.style.pointerEvents = 'none';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - size/2}px`;
    ripple.style.top = `${e.clientY - size/2}px`;
    ripple.style.zIndex = 9999;
    document.body.appendChild(ripple);
    
    animate(ripple, { scale: [0, 2], opacity: [0.4, 0] }, { duration: 1200, easing: 'easeOutQuad', complete: () => ripple.remove() });
  });
};
