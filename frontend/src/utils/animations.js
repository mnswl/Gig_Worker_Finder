import { animate } from 'animejs';

/**
 * Pulse a DOM element to provide success feedback.
 * @param {HTMLElement} el
 */
export function pulse(el) {
  if (!el) return;
  animate(el, {
    scale: [{ from: 1 }, { to: 1.15 }, { to: 1 }],
    duration: 450,
    easing: 'easeOutBack'
  });
}

/**
 * Bounce element vertically + scale for decorative effect.
 * @param {HTMLElement} el
 */
export function bounce(el) {
  if (!el) return;
  animate(el, {
    translateY: [0, -12, 0],
    scale: [1, 1.15, 1],
    duration: 800,
    easing: 'easeOutElastic(1, .5)'
  });
}

/**
 * Confetti burst – called e.g. on applicant acceptance.
 * Uses dynamic import to keep bundle small.
 * @param {object} opts canvas-confetti options override
 */
export async function confettiBurst(opts = {}) {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.3 },
    ...opts,
  });
}
