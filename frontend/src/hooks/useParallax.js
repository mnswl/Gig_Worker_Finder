import { useEffect } from 'react';

/**
 * Simple parallax scroll effect.
 * Elements with the attribute `data-parallax` will move vertically based on window scroll.
 * Provide `data-speed` (number, e.g. 0.2) to control how fast it moves relative to scroll.
 */
export default function useParallax() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!items.length) return;

    const update = () => {
      const y = window.scrollY;
      items.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
        if (!el.dataset.baseTransform) {
          const current = getComputedStyle(el).transform;
          el.dataset.baseTransform = current === 'none' ? '' : current;
        }
        el.style.transform = `${el.dataset.baseTransform} translateY(${y * speed}px)`;
      });
    };

    // Use requestAnimationFrame for smoother updates
    const onScroll = () => requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll);
    update(); // initial position

    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}
