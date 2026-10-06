import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, MapPin, User, CheckSquare, Square, 
  Copy, Check, Share2, Printer, Edit3, BookOpen, Music, 
  Monitor, Mic, Coffee, HeartHandshake, Shield, ExternalLink, Navigation 
} from './Icons';

export default function ActivityDetailModal({ 
  activity, 
  onClose, 
  onEditActivity,
  onUpdateActivity 
}) {
  const [activeTab, setActiveTab] = useState('program'); // 'program' | 'servers'
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [localProgram, setLocalProgram] = useState(activity?.program || []);

  useEffect(() => {
    setLocalProgram(activity?.program || []);
  }, [activity]);

  // Lock body scrolling while modal is open
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = origOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!activity) return null;

  // Toggle checklist item in the program
  const toggleStepCompleted = (index) => {
    const updated = localProgram.map((step, idx) => {
      if (idx === index) {
        return { ...step, completed: !step.completed };
      }
      return step;
    });
    setLocalProgram(updated);
    if (onUpdateActivity) {
      onUpdateActivity({ ...activity, program: updated });
    }
  };

  const completedCount = localProgram.filter(s => s.completed).length;
  const progressPercent = localProgram.length > 0 
    ? Math.round((completedCount / localProgram.length) * 100) 
    : 0;

  // Generate formatted WhatsApp text for the service
  const generateWhatsAppMessage = () => {
    const isJpc = activity.group === 'jotapece';
    const isSiervos = activity.group === 'siervos';
    const groupName = isJpc ? 'JOTAPECE (JPC)' : isSiervos ? 'SIERVOS (121)' : 'YOUNGERS ICC';

    let text = `🔥 *${groupName} · ORDEN DE SERVICIO & RESPONSABILIDADES* 🔥\n`;
    text += `📅 *Fecha:* ${activity.dayOfWeek} ${activity.dayNumber} de ${activity.month} de ${activity.year}\n`;
    text += `📖 *Tema / Mensaje:* ${activity.title}\n`;
    if (activity.preacher) text += `🎙️ *Predicador:* ${activity.preacher}\n`;
    if (activity.isCustomLocation || activity.locationType === 'fuera') {
      text += `📍 *Lugar (Fuera de lo establecido):* ${activity.customLocationName || activity.location}\n`;
      if (activity.customLocationAddress) text += `🗺️ *Dirección:* ${activity.customLocationAddress}\n`;
      if (activity.customLocationNotes) text += `🚗 *Punto de encuentro / Transporte:* ${activity.customLocationNotes}\n`;
      if (activity.customLocationMapUrl) text += `🌐 *GPS / Google Maps:* ${activity.customLocationMapUrl}\n`;
    } else {
      text += `📍 *Lugar:* ${activity.location}\n`;
    }
    if (activity.prepTime) text += `⏰ *Montaje / Preparación:* ${activity.prepTime}\n`;
    if (activity.activityTime) text += `⏰ *Culto / Actividad:* ${activity.activityTime}\n`;
    if (activity.teardownTime) text += `⏰ *Desmontaje:* ${activity.teardownTime}\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📋 *PROGRAMA MINUTO A MINUTO:*\n`;
    localProgram.forEach((p, idx) => {
      text += `• *${p.time}* - ${p.title} _(Resp: ${p.responsible})_\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👥 *SERVIDORES Y RESPONSABILIDADES:*\n`;
    (activity.serverAssignments || []).forEach(s => {
      text += `▫️ *${s.role}:* ${s.serverName} [${s.status}]\n   👉 ${s.duties}\n`;
    });

    text += `\n¡Oremos y sirvamos con excelencia para la gloria del Señor! 🙌✨\n`;
    text += `_Youngers ICC · Iglesia Convertidos a Cristo_`;

    return text;
  };

  const handleCopyWhatsApp = () => {
    const message = generateWhatsAppMessage();
    navigator.clipboard.writeText(message);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isJpc = activity.group === 'jotapece';
  const isSiervos = activity.group === 'siervos';

  // Get icon for server role
  const getRoleIcon = (role = '') => {
    const r = role.toLowerCase();
    if (r.includes('predicador') || r.includes('mensaje')) return <BookOpen size={18} />;
    if (r.includes('alabanza') || r.includes('músic') || r.includes('voz')) return <Music size={18} />;
    if (r.includes('sonido') || r.includes('audio')) return <Mic size={18} />;
    if (r.includes('multimedia') || r.includes('pantalla') || r.includes('proyección')) return <Monitor size={18} />;
    if (r.includes('recepción') || r.includes('bienvenida') || r.includes('registro')) return <HeartHandshake size={18} />;
    if (r.includes('refrigerio') || r.includes('comida') || r.includes('café')) return <Coffee size={18} />;
    return <Shield size={18} />;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-container print-sheet ${isJpc ? 'modal-theme-jpc' : isSiervos ? 'modal-theme-siervos' : 'modal-theme-ambos'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="modal-header">
          <div className="modal-meta-top">
            <span className={`modal-group-badge ${isJpc ? 'badge-jpc' : isSiervos ? 'badge-siervos' : 'badge-ambos'}`}>
              {isJpc ? 'Jotapece (Adolescentes 12–17)' : isSiervos ? 'Siervos (Jóvenes 18+)' : 'Siervos y Jotapece (Ambos)'}
            </span>
            <span className="modal-date-pill">
              <Calendar size={14} />
              <span>{activity.dayOfWeek} {activity.dayNumber} {activity.month} {activity.year}</span>
            </span>
            <span className={`modal-location-pill tag-${activity.locationType}`}>
              <MapPin size={14} />
              <span>{activity.location}</span>
            </span>
          </div>

          <div className="modal-title-row">
            <h2 className="modal-title">{activity.title}</h2>
            <button className="modal-close-btn" onClick={onClose} title="Cerrar modal">
              <X size={20} />
            </button>
          </div>

          {/* Quick info row */}
          <div className="modal-quick-info-grid">
            {activity.preacher && (
              <div className="quick-info-card">
                <span className="q-label">Predicador / Mensaje</span>
                <strong className="q-val text-primary">{activity.preacher}</strong>
              </div>
            )}
            {activity.prepTime && (
              <div className="quick-info-card">
                <span className="q-label">Montaje / Preparación</span>
                <strong className="q-val">{activity.prepTime}</strong>
              </div>
            )}
            {activity.activityTime && (
              <div className="quick-info-card">
                <span className="q-label">Culto / Actividad</span>
                <strong className="q-val highlight">{activity.activityTime}</strong>
              </div>
            )}
            {activity.teardownTime && (
              <div className="quick-info-card">
                <span className="q-label">Desmontaje</span>
                <strong className="q-val">{activity.teardownTime}</strong>
              </div>
            )}
          </div>

          {/* Apartado Especial: Ubicación Fuera de lo Establecido */}
          {(activity.isCustomLocation || activity.locationType === 'fuera' || activity.customLocationAddress) && (
            <div className="modal-outside-location-card">
              <div className="outside-card-top-row">
                <div className="outside-badge-flex">
                  <span className="outside-pulse-dot"></span>
                  <MapPin size={16} />
                  <strong>Ubicación Fuera de lo Establecido</strong>
                </div>
                {activity.customLocationMapUrl && (
                  <a 
                    href={activity.customLocationMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-open-map"
                    title="Abrir ubicación en Google Maps"
                  >
                    <Navigation size={13} />
                    <span>Ver en Google Maps</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div className="outside-card-body-grid">
                <div className="outside-info-cell">
                  <span className="cell-label">Lugar / Sede Externa:</span>
                  <strong className="cell-value">{activity.customLocationName || activity.location}</strong>
                </div>
                {activity.customLocationAddress && (
                  <div className="outside-info-cell">
                    <span className="cell-label">Dirección física / Referencia:</span>
                    <span className="cell-value">{activity.customLocationAddress}</span>
                  </div>
                )}
                {activity.customLocationNotes && (
                  <div className="outside-info-cell full-span">
                    <span className="cell-label">Punto de Encuentro / Transporte:</span>
                    <span className="cell-value text-accent-bold">{activity.customLocationNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="modal-toolbar">
            <div className="modal-tabs-group">
              <button 
                className={`modal-tab-btn ${activeTab === 'program' ? 'active' : ''}`}
                onClick={() => setActiveTab('program')}
              >
                <span>Programa ({localProgram.length})</span>
                {localProgram.length > 0 && (
                  <span className="tab-progress-tag">{progressPercent}%</span>
                )}
              </button>
              <button 
                className={`modal-tab-btn ${activeTab === 'servers' ? 'active' : ''}`}
                onClick={() => setActiveTab('servers')}
              >
                <span className="desktop-inline">Servidores &amp; Responsabilidades ({activity.serverAssignments?.length || 0})</span>
                <span className="mobile-inline">Servidores ({activity.serverAssignments?.length || 0})</span>
              </button>
            </div>

            <div className="modal-actions-right">
              <button 
                className={`btn btn-whatsapp ${copiedWhatsApp ? 'btn-copied' : ''}`}
                onClick={handleCopyWhatsApp}
                title="Copiar resumen formateado para WhatsApp"
              >
                {copiedWhatsApp ? <Check size={16} /> : <Share2 size={16} />}
                <span className="desktop-inline">{copiedWhatsApp ? '¡Copiado para WhatsApp!' : 'Copiar para WhatsApp'}</span>
                <span className="mobile-inline">{copiedWhatsApp ? '¡Copiado!' : 'WhatsApp'}</span>
              </button>

              <button 
                className="btn btn-secondary btn-print-hide"
                onClick={handlePrint}
                title="Imprimir hoja de servicio"
              >
                <Printer size={16} />
                <span>Imprimir</span>
              </button>

              {onEditActivity && (
                <button 
                  className="btn btn-secondary btn-print-hide"
                  onClick={() => {
                    onClose();
                    onEditActivity(activity);
                  }}
                  title="Modificar en panel de administrador"
                >
                  <Edit3 size={16} />
                  <span>Modificar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* TAB 1: PROGRAM / ORDEN DE CULTO */}
          {activeTab === 'program' && (
            <div className="tab-content program-tab-content">
              {/* Progress bar */}
              <div className="program-progress-card">
                <div className="progress-info-row">
                  <span className="progress-title">Progreso del Servicio en Vivo</span>
                  <span className="progress-count">{completedCount} de {localProgram.length} pasos completados</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <span className="progress-hint">
                  Puedes hacer clic en la casilla de cada paso para marcarlo como listo durante la reunión.
                </span>
              </div>

              {localProgram.length === 0 ? (
                <div className="empty-sub-state">
                  <p>Aún no se ha cargado un desglose de programa para esta actividad.</p>
                </div>
              ) : (
                <div className="program-timeline-list">
                  {localProgram.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`program-step-card ${step.completed ? 'is-completed' : ''}`}
                      onClick={() => toggleStepCompleted(idx)}
                    >
                      <button 
                        className="step-check-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepCompleted(idx);
                        }}
                      >
                        {step.completed ? (
                          <CheckSquare size={22} className="check-done" />
                        ) : (
                          <Square size={22} className="check-pending" />
                        )}
                      </button>

                      <div className="step-time-badge">
                        <Clock size={14} />
                        <span>{step.time}</span>
                      </div>

                      <div className="step-details-col">
                        <h4 className="step-title">{step.title}</h4>
                        {step.description && (
                          <p className="step-desc">{step.description}</p>
                        )}
                        <div className="step-responsible-row">
                          <User size={14} />
                          <span>Responsable: <strong>{step.responsible}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVIDORES & RESPONSABILIDADES */}
          {activeTab === 'servers' && (
            <div className="tab-content servers-tab-content">
              <div className="servers-intro-banner">
                <Shield size={18} />
                <span>
                  Equipo de líderes y servidores designados para esta fecha. Cada rol tiene su responsabilidad específica definida.
                </span>
              </div>

              {(!activity.serverAssignments || activity.serverAssignments.length === 0) ? (
                <div className="empty-sub-state">
                  <p>No hay servidores asignados para esta fecha o es una actividad sin reunión.</p>
                </div>
              ) : (
                <div className="servers-grid">
                  {activity.serverAssignments.map((assignment, idx) => (
                    <div key={idx} className="assignment-card">
                      <div className="assignment-header">
                        <div className="role-icon-box">
                          {getRoleIcon(assignment.role)}
                        </div>
                        <div className="role-info">
                          <span className="role-title">{assignment.role}</span>
                          <span className={`status-pill ${assignment.status === 'Confirmado' ? 'status-confirmed' : 'status-pending'}`}>
                            {assignment.status}
                          </span>
                        </div>
                      </div>

                      <div className="assigned-person-row">
                        <User size={16} />
                        <span className="person-name">{assignment.serverName}</span>
                      </div>

                      <div className="assignment-duties-box">
                        <span className="duties-label">Responsabilidad específica:</span>
                        <p className="duties-text">{assignment.duties}</p>
                      </div>

                      <button 
                        className="btn-share-single-duty"
                        onClick={() => {
                          const singleMsg = `Hola ${assignment.serverName} 👋, para el servicio de *${activity.title}* (${activity.dayOfWeek} ${activity.dayNumber} ${activity.month}), tienes asignado el rol de *${assignment.role}*.\n\n📌 *Tu responsabilidad:* ${assignment.duties}\n\n¡Gracias por tu fidelidad y servicio al Señor! 🙌`;
                          navigator.clipboard.writeText(singleMsg);
                          alert(`¡Mensaje para ${assignment.serverName} copiado al portapapeles!`);
                        }}
                        title="Copiar mensaje directo para este servidor"
                      >
                        <Copy size={14} />
                        <span>Copiar encargo para WhatsApp</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="modal-footer-note">
            Youngers ICC · Iglesia Convertidos a Cristo · Servidores de Jóvenes
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
