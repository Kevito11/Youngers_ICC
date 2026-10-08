import React, { useState, useEffect } from 'react';
import { ArrowUp } from './Icons';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkScrollPosition = () => {
      // 1. Check window scroll
      const windowScrolled = (window.pageYOffset || document.documentElement.scrollTop || 0) > 220;

      // 2. Check if any open modal container is scrolled
      const modalContainers = document.querySelectorAll('.modal-container, .modal-body, .server-modal-container, .admin-editor-card');
      let modalScrolled = false;
      modalContainers.forEach(container => {
        if (container && container.scrollTop > 100) {
          modalScrolled = true;
        }
      });

      setIsVisible(windowScrolled || modalScrolled);
    };

    // Use capture phase to catch scroll events from both window and scrollable modal containers
    window.addEventListener('scroll', checkScrollPosition, { capture: true, passive: true });
    
    // Also check on resize or orientation change
    window.addEventListener('resize', checkScrollPosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScrollPosition, { capture: true });
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  const handleScrollToTop = () => {
    // Scroll window smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Also smoothly scroll any open modal containers to the top
    const modalContainers = document.querySelectorAll(
      '.modal-body, .modal-container, .admin-editor-card, .server-modal-container, .editor-form'
    );
    modalContainers.forEach(container => {
      if (container && container.scrollTop > 0) {
        container.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className="btn-floating-scroll-top"
      onClick={handleScrollToTop}
      title="Volver arriba"
      aria-label="Volver arriba"
    >
      <ArrowUp size={22} className="scroll-top-icon" />
    </button>
  );
}
