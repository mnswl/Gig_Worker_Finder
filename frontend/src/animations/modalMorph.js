import { animate } from 'animejs';

export const animateModalEntrance = (modalEl, backdropEl) => {
  if (!modalEl || typeof window === 'undefined') return;
  const origin = window.modalTriggerRect;
  if (!origin) return; // fallback to default fade

  const dest = modalEl.getBoundingClientRect();
  // Calculate delta from origin center to dest center
  const dx = origin.left + origin.width / 2 - (dest.left + dest.width / 2);
  const dy = origin.top + origin.height / 2 - (dest.top + dest.height / 2);
  const scaleXRaw = origin.width / dest.width;
  const scaleYRaw = origin.height / dest.height;
  // Prevent the modal from starting larger than final size, only animate when origin is smaller.
  const scaleX = Math.min(scaleXRaw, 1);
  const scaleY = Math.min(scaleYRaw, 1);

  modalEl.style.transformOrigin = 'center center';
  modalEl.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
  modalEl.style.opacity = '0';
  if (backdropEl) backdropEl.style.opacity = '0';

  requestAnimationFrame(() => {
    // animate to final state
    animate(modalEl, {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutQuad'
    });
    if (backdropEl) {
      animate(backdropEl, {
        opacity: [0, 1],
        duration: 500,
        easing: 'linear'
      });
    }
  });
};
