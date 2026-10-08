import React, { useState, useEffect } from 'react';
import { Lock, Key, X, AlertTriangle, Eye, EyeOff, Check } from './Icons';

export default function PasswordAuthModal({ isOpen, onClose, onSuccess, title, description }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scrolling and listen to Escape key
  useEffect(() => {
    if (!isOpen) return;

    const origOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const expectedPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '1234').trim();

    if (password === expectedPassword) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setPassword('');
        setError('');
        onSuccess();
      }, 250);
    } else {
      setError('Contraseña incorrecta. Introduce la clave correcta para modificar.');
    }
  };

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={onClose}>
      <div 
        className="modal-container auth-modal-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="auth-modal-header">
          <div className="auth-icon-badge">
            <Lock size={24} />
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cancelar y cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="auth-modal-body">
          <h3 className="auth-modal-title">
            {title || 'Acceso al Área de Modificación'}
          </h3>
          <p className="auth-modal-desc">
            {description || 'Esta sección permite crear, editar o eliminar actividades, cambiar horarios y gestionar el bloqueo del programa. Introduce la contraseña de acceso.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="admin-auth-pwd" className="auth-label">
                <span>Contraseña Administrativa</span>
              </label>

              <div className="password-input-wrap">
                <div className="pwd-left-icon">
                  <Key size={18} />
                </div>
                <input
                  id="admin-auth-pwd"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Introduce la contraseña"
                  className={`form-input pwd-input ${error ? 'has-error' : ''}`}
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <div className="auth-error-banner">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="auth-modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-auth-submit"
                disabled={isSubmitting || !password.trim()}
              >
                {isSubmitting ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Acceder a Modificación</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
