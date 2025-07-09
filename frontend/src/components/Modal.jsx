import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

import { animateModalEntrance } from '../animations/modalMorph';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const backdrop = document.querySelector('.gwf-modal-backdrop');
    const modalBox = backdrop?.querySelector('.gwf-modal');
    //animateModalEntrance(modalBox, backdrop);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  const modalMarkup = (
    <div className="gwf-modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="gwf-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="gwf-modal-header d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">{title}</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalMarkup, document.body);
}
