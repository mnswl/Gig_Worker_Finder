import { useEffect } from 'react';
import { animate } from 'animejs';

/**
 * Scroll-triggered count-up animation for number headers (e.g., stats).
 * Targets all elements that match the selector (default: stats section h3 elements).
 * Works with text like "10k+" – numeric part is animated, suffix is preserved.
 */
export default function useCountUp(selector = '.stats h3') {
  useEffect(() => {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const node = entry.target;
            const txt = node.textContent.trim();
            const match = txt.match(/([0-9.,]+)(.*)/);
            if (!match) {
              node.style.opacity = 1;
              observer.unobserve(node);
              return;
            }
            const num = parseFloat(match[1].replace(/,/g, ''));
            if (isNaN(num)) {
              node.style.opacity = 1;
              observer.unobserve(node);
              return;
            }
            const suffix = match[2];

            const counter = { val: num }; // Start from the actual value
            node.textContent = num.toLocaleString() + suffix;
            node.style.opacity = 1;
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.6 }
    );

    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, [selector]);
}
