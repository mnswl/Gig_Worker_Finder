import { animate, stagger } from 'animejs';

// Animate job cards when they first appear or when the list changes
export const animateJobCardEntrance = () => {
  const cards = document.querySelectorAll('.job-card');
  if (!cards.length) return;
  animate(cards, {
    translateY: [24, 0],
    opacity: [0, 1],
    delay: stagger(80), // cascade
    duration: 500,
    easing: 'easeOutQuad',
  });
};

// Hover lift / scale effect for a single card element
export const jobCardHover = (enter, element) => {
  animate(element, {
    scale: enter ? 1.04 : 1,
    translateY: enter ? -2 : 0,
    duration: 250,
    easing: 'easeOutExpo',
  });
};

// Scroll reveal: animate cards when they enter viewport
let revealObserver;
export const setupJobCardScrollReveal = () => {
  // disconnect old observer to avoid leaks
  if (revealObserver) revealObserver.disconnect();
  const cards = document.querySelectorAll('.job-card:not(.revealed)');
  if (!cards.length) return;

  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animate(el, {
          translateY: [60, 0],
          opacity: [0, 1],
          duration: 600,
          easing: 'easeOutQuad',
        });
        el.classList.add('revealed');
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

  cards.forEach(card => revealObserver.observe(card));
};
