import React, { useEffect } from 'react';
import { AlertCircle, X, Check, ArrowLeft } from './Icons';

export default function UnsavedChangesModal({ 
  isOpen, 
  onContinueEditing, 
  onDiscardAndExit, 
  onSaveAndExit 
}) {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scrolling
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onContinueEditing();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (onSaveAndExit) onSaveAndExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onContinueEditing, onSaveAndExit]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay unsaved-modal-overlay" onClick={onContinueEditing}>
      <div 
        className="modal-container unsaved-modal-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="unsaved-modal-header">
          <div className="unsaved-icon-wrap">
            <AlertCircle size={28} />
          </div>
          <button className="modal-close-btn" onClick={onContinueEditing} title="Volver al formulario">
            <X size={20} />
          </button>
        </div>

        <div className="unsaved-modal-body">
          <h3 className="unsaved-title">¿Deseas guardar los cambios antes de salir?</h3>
          <p className="unsaved-desc">
            Tienes modificaciones sin guardar en el formulario. Si sales ahora sin guardar, se perderán los datos que acabas de escribir.
          </p>
        </div>

        <div className="unsaved-modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onDiscardAndExit}
          >
            Salir sin guardar
          </button>

          <button 
            type="button" 
            className="btn btn-primary"
            onClick={onContinueEditing}
          >
            <ArrowLeft size={16} />
            <span>Continuar editando</span>
          </button>

          {onSaveAndExit && (
            <button 
              type="button" 
              className="btn btn-success-action"
              onClick={onSaveAndExit}
              title="Guardar cambios y cerrar [Enter]"
            >
              <Check size={16} />
              <span>Guardar y salir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
