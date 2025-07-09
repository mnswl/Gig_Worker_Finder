import { useEffect } from 'react';
import { animate } from 'animejs';

/**
 * Generic scroll-reveal hook. Fades & slides elements up when they enter viewport.
 * By default targets feature cards, steps, stats, and testimonial cards on the home page.
 * Pass a custom CSS selector if you need different targets.
 */
export default function useScrollReveal(selector = '.feature-card, .step, .stats .col-md-3, .testimonial-card') {
  useEffect(() => {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;

    // Ensure hidden initially
    nodes.forEach(n => (n.style.opacity = 0));

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animate(entry.target, {
              opacity: [{ from: 0, to: 1 }],
              translateY: [{ from: 20, to: 0 }],
              duration: 600,
              easing: 'easeOutCubic'
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, [selector]);
}
