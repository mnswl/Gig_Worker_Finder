import { animate, stagger } from 'animejs';

// Animate job cards when they first appear or when the list changes
export const animateJobCardEntrance = () => {
  const cards = document.querySelectorAll('.job-card');
  if (!cards.length) return;
  
  // Add animating class to prevent overlap
  cards.forEach(card => card.classList.add('animating'));
  
  animate(cards, {
    translateY: [12, 0], // Reduced movement to prevent overlap
    opacity: [0, 1],
    delay: stagger(60), // Faster cascade
    duration: 400, // Shorter duration
    easing: 'easeOutQuad',
    complete: () => {
      // Remove animating class when done
      cards.forEach(card => card.classList.remove('animating'));
    }
  });
};

// Hover lift / scale effect for a single card element
export const jobCardHover = (enter, element) => {
  if (!element) return;
  
  // Set higher z-index on hover to prevent overlap
  if (enter) {
    element.style.zIndex = '10';
  } else {
    element.style.zIndex = '';
  }
  
  animate(element, {
    scale: enter ? 1.02 : 1, // Reduced scale to prevent overlap
    translateY: enter ? -4 : 0, // Slightly more lift for better visibility
    duration: 300,
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
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        
        // Add staggered delay to prevent all cards animating at once
        setTimeout(() => {
          animate(el, {
            translateY: [30, 0], // Reduced movement
            opacity: [0, 1],
            duration: 500, // Shorter duration
            easing: 'easeOutQuad',
          });
          el.classList.add('revealed');
        }, index * 100); // Stagger the animations
        
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }); // Adjusted margins

  cards.forEach(card => revealObserver.observe(card));
};
