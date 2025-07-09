import { useEffect } from 'react';
import { animate, stagger, createTimeline } from 'animejs';

/**
 * Orchestrates hero section entrance: heading, paragraph, CTA, hero image.
 * Call once from Home page after first render.
 */
export default function useHeroAnimation() {
  useEffect(() => {
    const tl = createTimeline({ autoplay: false });
    tl
      .add({
        targets: '.hero h1',
        translateY: [40, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 700,
      })
      .add({
        targets: '.hero p',
        translateY: [30, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 600,
      }, '-=400')
      .add({
        targets: '.hero .join-btn',
        scale: [0.8, 1],
        opacity: [0, 1],
        easing: 'easeOutBack',
        duration: 500,
      }, '-=300')
      .add({
        targets: '.hero-img',
        scale: [0.9, 1],
        opacity: [0, 1],
        rotate: [5, 0],
        easing: 'easeOutExpo',
        duration: 700,
      }, '-=600');

    tl.play();
  }, []);
}