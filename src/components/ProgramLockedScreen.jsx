import React from 'react';
import { Lock, Clock, Shield, Sparkles, Key, AlertTriangle } from './Icons';

export default function ProgramLockedScreen({ lockedMessage, onOpenAdminLogin }) {
  return (
    <div className="program-locked-screen-wrap">
      <div className="program-locked-card">
        <div className="locked-badge-top">
          <span className="locked-pulse-dot"></span>
          <span>Acceso Restringido · Modo En Desarrollo</span>
        </div>

        <div className="locked-icon-wrapper">
          <Lock size={44} className="locked-main-icon" />
        </div>

        <h2 className="locked-title">Programa en Preparación</h2>
        <p className="locked-subtitle">
          El cronograma y logística de actividades para Youngers ICC aún no está listo para el público general.
        </p>

        <div className="locked-message-box">
          <div className="locked-message-header">
            <Clock size={16} />
            <span>Nota del Equipo de Liderazgo:</span>
          </div>
          <p className="locked-message-text">
            {lockedMessage || 'El programa de actividades y logística se encuentra en preparación y no está listo aún. Estará disponible próximamente para todos los servidores y jóvenes.'}
          </p>
        </div>

        <div className="locked-info-grid">
          <div className="locked-info-item">
            <span className="info-title">Jotapece (JPC)</span>
            <span className="info-val">Adolescentes 12–17</span>
          </div>
          <div className="locked-info-divider"></div>
          <div className="locked-info-item">
            <span className="info-title">Siervos (121)</span>
            <span className="info-val">Jóvenes 18+</span>
          </div>
        </div>

        <div className="locked-admin-action-box">
          <p className="locked-admin-prompt">
            ¿Eres parte del equipo ministerial o administrativo encargado de configurar el programa?
          </p>
          <button 
            type="button" 
            className="btn btn-primary btn-locked-login"
            onClick={onOpenAdminLogin}
          >
            <Key size={18} />
            <span>Ingresar con Contraseña de Administrador</span>
          </button>
        </div>
      </div>
    </div>
  );
}
