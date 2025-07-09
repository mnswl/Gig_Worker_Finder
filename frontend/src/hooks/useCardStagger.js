/* eslint-disable */
import { useEffect } from 'react';
import { animate } from 'animejs';

/**
 * Hook: fade & slide job cards in as they appear.
 * @param {string} selector - CSS selector targeting the elements to animate.
 * @param {Array<any>} deps - React dependency array; pass something like `[items.length]` so new items retrigger.
 */
export default function useCardStagger(selector = '.job-card', deps = []) {
  useEffect(() => {
    // Ensure elements exist before animating
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;

    animate(nodes, {
      opacity: [{ from: 0, to: 1 }],
      translateY: [{ from: 30, to: 0 }],
      delay: (_, i) => i * 70,
      duration: 500,
      ease: 'outCubic'
    });
  }, deps);

}
