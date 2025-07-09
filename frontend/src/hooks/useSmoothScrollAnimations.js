import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function useSmoothScrollAnimations() {
  useEffect(() => {
    // Initialize AOS with custom settings
    AOS.init({
      duration: 800, // Animation duration
      easing: 'ease-out-cubic', // Natural motion
      once: true, // Only trigger once
      offset: 100, // Distance from viewport
      delay: 100, // Initial delay
    });

    // Custom animations for different elements
    const elements = document.querySelectorAll('[data-aos]');
    elements.forEach(el => {
      const type = el.getAttribute('data-aos');
      
      // Add custom animations based on type
      switch(type) {
        case 'fade-up':
          el.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
          break;
        case 'fade-left':
          el.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
          break;
        case 'fade-right':
          el.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
          break;
        case 'zoom-in':
          el.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
          break;
      }
    });

    // Refresh AOS on window resize
    window.addEventListener('resize', () => AOS.refresh());

    return () => {
      window.removeEventListener('resize', () => AOS.refresh());
    };
  }, []);
}
