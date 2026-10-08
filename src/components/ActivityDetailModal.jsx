import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, MapPin, User, CheckSquare, Square, 
  Copy, Check, Share2, Printer, Edit3, BookOpen, Music, 
  Monitor, Mic, Coffee, HeartHandshake, Shield, ExternalLink, Navigation,
  Lock, Unlock, Key, Users, List, LayoutGrid
} from './Icons';

export default function ActivityDetailModal({ 
  activity, 
  onClose, 
  onEditActivity,
  onUpdateActivity,
  isAdminAuthenticated,
  lockedMessage,
  onRequireAuth,
  onToggleActivityLock
}) {
  const isProgramLocked = Boolean(activity?.isProgramLocked);
  const isSpecificProgramLocked = isProgramLocked && !isAdminAuthenticated;
  const [activeTab, setActiveTab] = useState(() => isSpecificProgramLocked ? 'servers' : 'program');
  const [serversViewMode, setServersViewMode] = useState('list'); // 'list' | 'cards'
  const [localProgram, setLocalProgram] = useState(activity?.program || []);

  useEffect(() => {
    setLocalProgram(activity?.program || []);
  }, [activity]);

  // Adjust active tab if lock state changes or if a locked activity is opened
  useEffect(() => {
    if (isSpecificProgramLocked) {
      setActiveTab('servers');
    }
  }, [activity?.id, isSpecificProgramLocked]);

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

  // Toggle checklist item in the program - Only Admin can check/uncheck
  const toggleStepCompleted = (index, bypassAuth = false) => {
    if (!isAdminAuthenticated && !bypassAuth) {
      if (onRequireAuth) {
        onRequireAuth(() => {
          toggleStepCompleted(index, true);
        }, {
          title: 'Marcar Progreso del Programa',
          description: 'Solo los administradores pueden tachar o actualizar el progreso del programa. Introduce la contraseña administrativa.'
        });
      }
      return;
    }

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

  const handlePrint = () => {
    if (isProgramLocked && !isAdminAuthenticated) {
      alert('La impresión no está disponible porque el programa de esta actividad está bloqueado en preparación.');
      return;
    }
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
        className={`modal-container print-sheet ${isProgramLocked ? 'is-program-locked' : ''} ${isJpc ? 'modal-theme-jpc' : isSiervos ? 'modal-theme-siervos' : 'modal-theme-ambos'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="modal-header">
          <div className="modal-meta-top">
            <span className={`modal-group-badge ${isJpc ? 'badge-jpc' : isSiervos ? 'badge-siervos' : 'badge-ambos'}`}>
              <span className="desktop-inline">{isJpc ? 'Jotapece (Adolescentes 12–17)' : isSiervos ? 'Siervos (Jóvenes 18+)' : 'Siervos y Jotapece (Ambos)'}</span>
              <span className="mobile-inline">{isJpc ? 'Jotapece (12–17)' : isSiervos ? 'Siervos (18+)' : 'Ambos'}</span>
            </span>
            <span className="modal-date-pill">
              <Calendar size={13} />
              <span>{activity.dayOfWeek} {activity.dayNumber} {activity.month} {activity.year}</span>
            </span>
            <span className={`modal-location-pill tag-${activity.locationType}`}>
              <MapPin size={13} />
              <span>{activity.location}</span>
            </span>
          </div>

          <div className="modal-title-row">
            <h2 className="modal-title">{activity.title}</h2>
            <button className="modal-close-btn" onClick={onClose} title="Cerrar modal">
              <X size={20} />
            </button>
          </div>

          {/* Quick info row (Montaje/Desmontaje hidden on mobile to drastically reduce header height) */}
          <div className="modal-quick-info-grid">
            {activity.preacher && (
              <div className="quick-info-card">
                <span className="q-label">Predicador / Mensaje</span>
                <strong className="q-val text-primary">{activity.preacher}</strong>
              </div>
            )}
            {activity.activityTime && (
              <div className="quick-info-card">
                <span className="q-label">Culto / Actividad</span>
                <strong className="q-val highlight">{activity.activityTime}</strong>
              </div>
            )}
            {activity.prepTime && (
              <div className="quick-info-card desktop-quick-info">
                <span className="q-label">Montaje / Preparación</span>
                <strong className="q-val">{activity.prepTime}</strong>
              </div>
            )}
            {activity.teardownTime && (
              <div className="quick-info-card desktop-quick-info">
                <span className="q-label">Desmontaje</span>
                <strong className="q-val">{activity.teardownTime}</strong>
              </div>
            )}
          </div>

          {/* Micro line on mobile for prep & teardown times */}
          {(activity.prepTime || activity.teardownTime) && (
            <div className="mobile-prep-summary mobile-inline">
              <Clock size={12} />
              <span>Montaje: {activity.prepTime || '-'} · Desmontaje: {activity.teardownTime || '-'}</span>
            </div>
          )}

          {/* Apartado Especial: Ubicación Fuera de lo Establecido */}
          {(activity.isCustomLocation || activity.locationType === 'fuera' || activity.customLocationAddress) && (
            <div className="modal-outside-location-card">
              <div className="outside-card-top-row">
                <div className="outside-badge-flex">
                  <span className="outside-pulse-dot"></span>
                  <MapPin size={15} />
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
                    <span className="cell-label">Dirección física:</span>
                    <span className="cell-value">{activity.customLocationAddress}</span>
                  </div>
                )}
                {activity.customLocationNotes && (
                  <div className="outside-info-cell full-span">
                    <span className="cell-label">Punto de Encuentro:</span>
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
                className={`modal-tab-btn ${activeTab === 'program' ? 'active' : ''} ${isProgramLocked ? 'tab-locked-warning' : ''}`}
                onClick={() => setActiveTab('program')}
              >
                {isProgramLocked ? (
                  <>
                    <Lock size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                    <span>Programa (Bloqueado)</span>
                  </>
                ) : (
                  <>
                    <span>Programa ({localProgram.length})</span>
                    {localProgram.length > 0 && (
                      <span className="tab-progress-tag">{progressPercent}%</span>
                    )}
                  </>
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
              {/* Per-Activity Lock Button for Admins */}
              {isAdminAuthenticated && onToggleActivityLock && (
                <button 
                  type="button"
                  className={`btn btn-print-hide btn-act-lock ${activity.isProgramLocked ? 'is-act-locked' : 'is-act-unlocked'}`}
                  onClick={() => onToggleActivityLock(activity.id)}
                  title={activity.isProgramLocked 
                    ? "El programa de esta actividad está bloqueado al público. Pulsa para desbloquearlo." 
                    : "Pulsa para bloquear el programa de esta actividad (los visitantes solo verán los servidores)."}
                >
                  {activity.isProgramLocked ? <Lock size={15} /> : <Unlock size={15} />}
                  <span className="desktop-btn-label">
                    {activity.isProgramLocked ? 'Desbloquear Programa' : 'Bloquear Programa'}
                  </span>
                  <span className="mobile-btn-label">
                    {activity.isProgramLocked ? 'Desbloquear' : 'Bloquear'}
                  </span>
                </button>
              )}

              {/* Print Button: Disabled if program is locked */}
              {isProgramLocked ? (
                <button 
                  type="button"
                  className="btn btn-secondary btn-print-hide btn-print-locked"
                  disabled
                  title="La impresión está deshabilitada porque el programa de esta actividad está bloqueado en preparación."
                >
                  <Lock size={15} />
                  <span className="desktop-inline">Impresión Bloqueada</span>
                  <span className="mobile-inline">Bloqueado</span>
                </button>
              ) : (
                <button 
                  type="button"
                  className="btn btn-secondary btn-print-hide"
                  onClick={handlePrint}
                  title="Imprimir hoja de servicio"
                >
                  <Printer size={16} />
                  <span className="desktop-inline">Imprimir</span>
                </button>
              )}

              {onEditActivity && isAdminAuthenticated && (
                <button 
                  className="btn btn-secondary btn-print-hide"
                  onClick={() => {
                    onClose();
                    onEditActivity(activity);
                  }}
                  title="Modificar en panel de administrador"
                >
                  <Edit3 size={16} />
                  <span className="desktop-inline">Modificar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* TAB 1: PROGRAM / ORDEN DE CULTO */}
          {activeTab === 'program' && (
            isSpecificProgramLocked ? (
              <div className="tab-content">
                <div className="activity-program-locked-card">
                  <div className="locked-icon-badge">
                    <Lock size={34} />
                  </div>
                  <h3 className="locked-card-title">Programa Minuto a Minuto en Preparación</h3>
                  <p className="locked-card-desc">
                    {lockedMessage || 'El cronograma y orden de culto para esta actividad se encuentra actualmente en preparación y no está listo para el público general. Puedes consultar la asignación de servidores y roles en la pestaña contigua.'}
                  </p>
                  <div className="locked-card-actions">
                    <button 
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setActiveTab('servers')}
                    >
                      <Users size={16} />
                      <span>Ver Servidores Asignados</span>
                    </button>
                    {onRequireAuth && (
                      <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          onRequireAuth(() => {
                            // After login, modal re-renders with full admin access
                          }, {
                            title: 'Desbloquear Programa',
                            description: 'Introduce la clave de administración para acceder al programa minuto a minuto.'
                          });
                        }}
                      >
                        <Key size={16} />
                        <span>Acceder como Administrador</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <div className="tab-content program-tab-content">
              {/* Admin Notice Banner if activity is locked */}
              {isAdminAuthenticated && isProgramLocked && (
                <div className="admin-locked-notice-banner">
                  <div className="admin-locked-notice-icon">
                    <Lock size={18} />
                  </div>
                  <div className="admin-locked-notice-text">
                    <strong>Programa Bloqueado al Público General</strong>
                    <p>Este programa está en preparación por liderazgo. Los visitantes regulares tienen el acceso bloqueado y no pueden verlo ni imprimirlo. Pulsa "Desbloquear Programa" arriba cuando esté listo para publicarlo.</p>
                  </div>
                </div>
              )}

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
                  {isAdminAuthenticated ? (
                    'Puedes hacer clic en la casilla de cada paso para marcarlo como listo durante la reunión.'
                  ) : (
                    <span>
                      <Lock size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '5px' }} />
                      Solo el administrador puede tachar el progreso de este programa.
                    </span>
                  )}
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
                      className={`program-step-card ${step.completed ? 'is-completed' : ''} ${!isAdminAuthenticated ? 'read-only' : ''}`}
                      onClick={isAdminAuthenticated ? () => toggleStepCompleted(idx) : undefined}
                    >
                      <button 
                        type="button"
                        className={`step-check-btn ${!isAdminAuthenticated ? 'is-locked-btn' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepCompleted(idx);
                        }}
                        title={
                          isAdminAuthenticated
                            ? (step.completed ? 'Marcar como pendiente' : 'Marcar como completado')
                            : 'Solo el administrador puede tachar este paso (clic para autenticarte)'
                        }
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
            )
          )}

          {/* TAB 2: SERVIDORES & RESPONSABILIDADES */}
          {activeTab === 'servers' && (
            <div className="tab-content servers-tab-content">
              <div className="servers-tab-header-flex">
                <div className="servers-intro-banner">
                  <Shield size={18} />
                  <span>
                    Equipo de líderes y servidores asignados ({activity.serverAssignments?.length || 0}).
                  </span>
                </div>

                {activity.serverAssignments && activity.serverAssignments.length > 0 && (
                  <div className="view-toggle-pills" role="group" aria-label="Modo de visualización de servidores">
                    <button 
                      type="button"
                      className={`view-toggle-btn ${serversViewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setServersViewMode('list')}
                      title="Vista compacta en lista"
                    >
                      <List size={14} />
                      <span>Lista</span>
                    </button>
                    <button 
                      type="button"
                      className={`view-toggle-btn ${serversViewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setServersViewMode('cards')}
                      title="Vista en tarjetas"
                    >
                      <LayoutGrid size={14} />
                      <span>Tarjetas</span>
                    </button>
                  </div>
                )}
              </div>

              {(!activity.serverAssignments || activity.serverAssignments.length === 0) ? (
                <div className="empty-sub-state">
                  <p>No hay servidores asignados para esta fecha o es una actividad sin reunión.</p>
                </div>
              ) : serversViewMode === 'list' ? (
                /* Compact List View */
                <div className="compact-servers-list">
                  {activity.serverAssignments.map((assignment, idx) => (
                    <div key={idx} className="compact-server-card">
                      <div className="compact-server-main">
                        <div className="compact-role-icon-box">
                          {getRoleIcon(assignment.role)}
                        </div>
                        <div className="compact-server-names">
                          <strong className="compact-server-person">{assignment.serverName}</strong>
                          <span className="compact-server-role">{assignment.role}</span>
                        </div>
                      </div>

                      <div className="compact-server-right">
                        {assignment.duties && (
                          <span className="compact-server-duty" title={assignment.duties}>
                            {assignment.duties}
                          </span>
                        )}
                        <span className={`status-pill status-pill-sm ${assignment.status === 'Confirmado' ? 'status-confirmed' : 'status-pending'}`}>
                          {assignment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Detailed Cards Grid */
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
