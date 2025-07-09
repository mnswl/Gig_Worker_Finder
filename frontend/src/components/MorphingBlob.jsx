import { useEffect, useRef } from 'react';
import '../styles/MorphingBlob.css';
import { animate } from 'animejs';

// Reusable morphing blob SVG background
export default function MorphingBlob({ className = '' }) {
  const pathRef = useRef(null);
  // Two blob shapes generated via blobmaker.app
  const shape1 =
    'M44.8,-75.9C57.7,-66.7,66,-52.1,71.4,-37.8C76.8,-23.6,79.3,-9.8,78.4,3.8C77.4,17.4,73,29.8,64.3,41C55.5,52.3,42.5,62.4,28.5,70.5C14.5,78.6,-0.6,84.7,-16.4,85.8C-32.3,87,-48.8,83.1,-61.9,72.1C-75,61.1,-84.6,43,-88,24.3C-91.4,5.5,-88.6,-13.7,-80.9,-30.4C-73.1,-47.1,-60.5,-61.3,-45.7,-70.5C-30.9,-79.8,-15,-84.1,0.9,-85.3C16.7,-86.5,33.5,-84.9,44.8,-75.9Z';
  const shape2 =
    'M56.3,-63.5C68.1,-53.3,70.8,-31.3,75.3,-9.8C79.8,11.8,86.2,33,80.7,49.1C75.2,65.3,57.7,76.4,39.6,83.3C21.5,90.1,2.9,92.8,-15.1,95.3C-33.1,97.8,-50.7,100.1,-61.5,90.5C-72.3,81,-76.2,59.7,-83.4,40C-90.5,20.3,-100.9,2.2,-100.3,-15.3C-99.6,-32.8,-87.8,-49.7,-72.4,-60.3C-57,-70.9,-38,-75.2,-19.5,-79.5C-1,-83.8,17,-88.1,35.7,-86.1C54.4,-84,72.5,-75.7,56.3,-63.5Z';

  useEffect(() => {
    if (!pathRef.current) return;
    animate(pathRef.current, {
      d: [
        { value: shape2 },
        { value: shape1 }
      ],
      duration: 12000,
      direction: 'alternate',
      easing: 'easeInOutQuad',
      loop: true
    });
  }, []);

  return (
    <svg
      className={`blob-bg ${className}`}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path ref={pathRef} fill="#736EFE55" d={shape1} transform="translate(100 100)" />
    </svg>
  );
}
