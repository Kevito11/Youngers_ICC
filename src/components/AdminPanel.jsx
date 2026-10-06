import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, MapPin, Check, X, RefreshCw,
  Lock, Unlock, Key, AlertCircle, ArrowLeft, Calendar
} from './Icons';
import UnsavedChangesModal from './UnsavedChangesModal';

export default function AdminPanel({ 
  activities, 
  servers, 
  announcements,
  onSaveActivity, 
  onDeleteActivity,
  onResetDefaults,
  onUpdateAnnouncements,
  activityToEdit,
  clearActivityToEdit,
  isProgramLocked,
  onToggleProgramLocked,
  lockedMessage,
  onUpdateLockedMessage,
  onLogoutAdmin,
  onRequireAuth
}) {
  const [editingActivity, setEditingActivity] = useState(activityToEdit || null);
  const [isCreating, setIsCreating] = useState(false);
  const [announcementsText, setAnnouncementsText] = useState(announcements.join('\n'));
  const [announcementsSaved, setAnnouncementsSaved] = useState(false);
  const [localLockedMessage, setLocalLockedMessage] = useState(lockedMessage || '');
  const [lockMessageSaved, setLockMessageSaved] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const initialActivityRef = useRef(activityToEdit || null);

  const isDirty = Boolean(
    editingActivity && 
    initialActivityRef.current && 
    JSON.stringify(editingActivity) !== JSON.stringify(initialActivityRef.current)
  );

  // Background scroll lock when editor is active
  useEffect(() => {
    if (editingActivity) {
      const origOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = origOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [editingActivity]);

  const handleAttemptCloseActivityEditor = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      setEditingActivity(null);
      setIsCreating(false);
      if (clearActivityToEdit) clearActivityToEdit();
    }
  };

  // Keyboard shortcut listener for Esc and Enter
  useEffect(() => {
    if (!editingActivity) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showUnsavedPrompt) {
          setShowUnsavedPrompt(false);
        } else {
          handleAttemptCloseActivityEditor();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingActivity, isDirty, showUnsavedPrompt]);

  // Default empty activity template
  const createEmptyActivity = (group = 'jotapece') => {
    const isJpc = group === 'jotapece';
    return {
      id: `act-${Date.now()}`,
      group: group,
      dayOfWeek: isJpc ? 'Sáb' : 'Vie',
      dayNumber: '20',
      month: 'nov',
      year: '2026',
      fullDate: '2026-11-20',
      title: 'Reunión de Jóvenes',
      preacher: 'Joel Guzmán',
      location: 'Salón multiusos',
      locationType: 'multiusos',
      isCustomLocation: false,
      customLocationName: '',
      customLocationAddress: '',
      customLocationMapUrl: '',
      customLocationNotes: '',
      prepTime: isJpc ? '5:00 – 7:00 pm' : '6:00 – 8:00 pm',
      prepStart: isJpc ? '17:00' : '18:00',
      prepEnd: isJpc ? '19:00' : '20:00',
      activityTime: isJpc ? '7:00 – 9:00 pm' : '8:00 – 9:30 pm',
      actStart: isJpc ? '19:00' : '20:00',
      actEnd: isJpc ? '21:00' : '21:30',
      teardownTime: isJpc ? '9:00 – 9:30 pm' : '9:30 – 10:00 pm',
      notes: '',

      program: [
        { time: isJpc ? '5:00 - 6:00 pm' : '6:00 - 7:00 pm', title: 'Montaje técnico y cableado', responsible: 'Sonido y Multimedia', completed: false, description: 'Instalación de consola, micrófonos y proyector.' },
        { time: isJpc ? '6:00 - 6:30 pm' : '7:00 - 7:35 pm', title: 'Ensayo de alabanza', responsible: 'Equipo de Música', completed: false, description: 'Pruebas de voces e instrumentos.' },
        { time: isJpc ? '6:30 - 6:50 pm' : '7:35 - 7:55 pm', title: 'Oración de líderes y servidores', responsible: 'Líder de culto', completed: false, description: 'Oración de cobertura y devocional.' },
        { time: isJpc ? '7:00 - 7:15 pm' : '8:00 - 8:15 pm', title: 'Bienvenida general', responsible: 'Coordinador', completed: false, description: 'Apertura y dinámicas de integración.' },
        { time: isJpc ? '7:15 - 7:45 pm' : '8:15 - 8:40 pm', title: 'Alabanza y Adoración', responsible: 'Banda', completed: false, description: 'Cantos congregacionales.' },
        { time: isJpc ? '7:50 - 8:30 pm' : '8:40 - 9:20 pm', title: 'Mensaje de la Palabra', responsible: 'Predicador', completed: false, description: 'Exposición bíblica.' },
        { time: isJpc ? '8:30 - 9:00 pm' : '9:20 - 9:35 pm', title: 'Grupos pequeños / Oración', responsible: 'Líderes', completed: false, description: 'Aplicación del mensaje.' },
        { time: isJpc ? '9:00 - 9:30 pm' : '9:35 - 10:00 pm', title: 'Desmontaje y recogida', responsible: 'Todos', completed: false, description: 'Limpieza del salón.' }
      ],
      serverAssignments: [
        { role: 'Coordinador de Culto', serverId: 'srv-1', serverName: 'Joel Guzmán', status: 'Confirmado', duties: 'Supervisar programa y tiempos.' },
        { role: 'Predicador', serverId: 'srv-2', serverName: 'Samuel Luciano', status: 'Confirmado', duties: 'Exposición de las Sagradas Escrituras.' },
        { role: 'Alabanza', serverId: 'srv-6', serverName: 'Paola Reyes', status: 'Confirmado', duties: 'Dirección musical y ensayo puntual.' },
        { role: 'Sonido y Audio', serverId: 'srv-7', serverName: 'Marcos Medina', status: 'Confirmado', duties: 'Consola, micrófonos y ecualización.' },
        { role: 'Multimedia y Proyección', serverId: 'srv-8', serverName: 'Andrea Peña', status: 'Confirmado', duties: 'Letras, versículos y visuales.' },
        { role: 'Recepción y Bienvenida', serverId: 'srv-9', serverName: 'Laura Gómez', status: 'Confirmado', duties: 'Mesa de bienvenida y registro.' }
      ]
    };
  };

  const handleStartCreate = (group = 'jotapece') => {
    const empty = createEmptyActivity(group);
    initialActivityRef.current = JSON.parse(JSON.stringify(empty));
    setEditingActivity(empty);
    setIsCreating(true);
  };

  const handleStartEdit = (activity) => {
    const cloned = JSON.parse(JSON.stringify(activity));
    initialActivityRef.current = JSON.parse(JSON.stringify(cloned));
    setEditingActivity(cloned);
    setIsCreating(false);
  };

  const handleSaveCurrentActivity = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingActivity.title.trim()) {
      alert('Por favor introduce un título para la actividad');
      return;
    }
    onSaveActivity(editingActivity);
    setEditingActivity(null);
    setIsCreating(false);
    setShowUnsavedPrompt(false);
    if (clearActivityToEdit) clearActivityToEdit();
  };

  const handleSaveAnnouncements = () => {
    const list = announcementsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    onUpdateAnnouncements(list);
    setAnnouncementsSaved(true);
    setTimeout(() => setAnnouncementsSaved(false), 3000);
  };

  // Helpers to manipulate program steps in form
  const addProgramStep = () => {
    setEditingActivity({
      ...editingActivity,
      program: [
        ...(editingActivity.program || []),
        { time: '7:00 pm', title: 'Nuevo bloque', responsible: 'Por designar', completed: false, description: '' }
      ]
    });
  };

  const updateProgramStep = (index, field, value) => {
    const updated = editingActivity.program.map((step, idx) => {
      if (idx === index) {
        return { ...step, [field]: value };
      }
      return step;
    });
    setEditingActivity({ ...editingActivity, program: updated });
  };

  const removeProgramStep = (index) => {
    const updated = editingActivity.program.filter((_, idx) => idx !== index);
    setEditingActivity({ ...editingActivity, program: updated });
  };

  // Helpers to manipulate server assignments in form
  const addServerRole = () => {
    const firstServer = servers[0] || { id: 'srv-1', name: 'Joel Guzmán' };
    setEditingActivity({
      ...editingActivity,
      serverAssignments: [
        ...(editingActivity.serverAssignments || []),
        { 
          role: 'Nuevo Rol', 
          serverId: firstServer.id, 
          serverName: firstServer.name, 
          status: 'Confirmado', 
          duties: 'Responsabilidad asignada para esta actividad.' 
        }
      ]
    });
  };

  const updateServerRole = (index, field, value) => {
    const updated = editingActivity.serverAssignments.map((asg, idx) => {
      if (idx === index) {
        if (field === 'serverId') {
          const selected = servers.find(s => s.id === value);
          return { 
            ...asg, 
            serverId: value, 
            serverName: selected ? selected.name : asg.serverName 
          };
        }
        return { ...asg, [field]: value };
      }
      return asg;
    });
    setEditingActivity({ ...editingActivity, serverAssignments: updated });
  };

  const removeServerRole = (index) => {
    const updated = editingActivity.serverAssignments.filter((_, idx) => idx !== index);
    setEditingActivity({ ...editingActivity, serverAssignments: updated });
  };

  return (
    <div className="admin-panel-page">
      {/* Header */}
      <div className="admin-header-row">
        <div>
          <div className="admin-auth-status-pill">
            <Lock size={13} />
            <span>Modo Edición Autorizado</span>
          </div>
          <h2 className="admin-title">Panel de Administración de Logística</h2>
          <p className="admin-subtitle">
            Crea nuevas actividades, modifica los programas minuto a minuto, configura ubicaciones externas y gestiona el acceso.
          </p>
        </div>

        <div className="admin-actions-top">
          {onLogoutAdmin && (
            <button 
              className="btn btn-secondary btn-logout-admin"
              onClick={onLogoutAdmin}
              title="Cerrar sesión de edición y proteger con contraseña"
            >
              <Key size={15} />
              <span>Cerrar Sesión</span>
            </button>
          )}
          <button 
            className="btn btn-secondary" 
            onClick={() => handleStartCreate('jotapece')}
          >
            <Plus size={16} />
            <span>Nueva Actividad Jotapece</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleStartCreate('siervos')}
          >
            <Plus size={16} />
            <span>Nueva Actividad Siervos</span>
          </button>
        </div>
      </div>

      {/* Program Access Lock Control Card */}
      <div className={`admin-lock-control-card ${isProgramLocked ? 'is-locked-state' : 'is-unlocked-state'}`}>
        <div className="lock-control-top">
          <div className="lock-status-indicator-col">
            <div className="lock-icon-badge-round">
              {isProgramLocked ? <Lock size={22} /> : <Unlock size={22} />}
            </div>
            <div>
              <div className="lock-title-row">
                <h3 className="lock-card-title">Control de Acceso al Programa</h3>
                <span className={`lock-status-pill ${isProgramLocked ? 'pill-locked' : 'pill-active'}`}>
                  {isProgramLocked ? 'ACCESO BLOQUEADO (NO ESTÁ LISTO)' : 'ACCESO PÚBLICO HABILITADO'}
                </span>
              </div>
              <p className="lock-card-desc">
                {isProgramLocked 
                  ? 'El acceso al programa está bloqueado para el público. Los visitantes verán la pantalla de mantenimiento/preparación hasta que lo desbloquees.'
                  : 'El programa está visible y público. Si aún no está listo o estás editándolo, puedes bloquear el acceso para los usuarios aquí.'}
              </p>
            </div>
          </div>

          <div className="lock-action-col">
            <button 
              type="button"
              className={`btn ${isProgramLocked ? 'btn-success' : 'btn-danger'}`}
              onClick={onToggleProgramLocked}
            >
              {isProgramLocked ? (
                <>
                  <Unlock size={18} />
                  <span>Habilitar Acceso al Público</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Bloquear Acceso al Programa</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lock-message-editor-row">
          <label className="lock-msg-label">
            Mensaje para los visitantes en la pantalla de bloqueo:
          </label>
          <div className="lock-msg-input-group">
            <input 
              type="text" 
              value={localLockedMessage}
              onChange={e => setLocalLockedMessage(e.target.value)}
              placeholder="Ej. El programa de actividades se encuentra en preparación y no está listo aún..."
              className="form-input"
            />
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                onUpdateLockedMessage(localLockedMessage);
                setLockMessageSaved(true);
                setTimeout(() => setLockMessageSaved(false), 2500);
              }}
            >
              <Check size={16} />
              <span>Guardar Nota</span>
            </button>
          </div>
          {lockMessageSaved && (
            <span className="saved-success-pill">¡Mensaje de bloqueo actualizado!</span>
          )}
        </div>
      </div>


      {/* If editing or creating, show rich activity editor form as full-screen modal */}
      {editingActivity ? (
        <div className="modal-overlay admin-editor-modal-overlay" onClick={handleAttemptCloseActivityEditor}>
          <div 
            className="modal-container admin-editor-modal-container"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-editor-card">
              <div className="editor-card-header">
                <div>
                  <span className="editor-badge">
                    {isCreating ? 'CREANDO NUEVA ACTIVIDAD' : 'EDITANDO ACTIVIDAD'}
                  </span>
                  <h3 className="editor-heading">{editingActivity.title || 'Sin título'}</h3>
                </div>
                <button 
                  type="button"
                  className="modal-close-btn"
                  onClick={handleAttemptCloseActivityEditor}
                  title="Cerrar editor [Esc]"
                >
                  <X size={20} />
                </button>
              </div>

          <form onSubmit={handleSaveCurrentActivity} className="editor-form">
            {/* Section 1: Basic Information */}
            <div className="form-section-box">
              <h4 className="section-title">1. Información General</h4>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Título de la Actividad / Serie *</label>
                  <input 
                    type="text" 
                    required
                    value={editingActivity.title}
                    onChange={e => setEditingActivity({ ...editingActivity, title: e.target.value })}
                    placeholder="Ej. 12 Truths: Justificación"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Grupo de Jóvenes</label>
                  <select 
                    value={editingActivity.group}
                    onChange={e => setEditingActivity({ ...editingActivity, group: e.target.value })}
                    className="form-select"
                  >
                    <option value="jotapece">Jotapece (JPC 12–17 · Sábados)</option>
                    <option value="siervos">Siervos (121 18+ · Viernes)</option>
                    <option value="ambos">Ambos grupos (Siervos y Jotapece)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Predicador / Encargado</label>
                  <input 
                    type="text" 
                    value={editingActivity.preacher}
                    onChange={e => setEditingActivity({ ...editingActivity, preacher: e.target.value })}
                    placeholder="Ej. Samuel Luciano, Joel Guzmán..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Día de semana (Abreviado)</label>
                  <input 
                    type="text" 
                    value={editingActivity.dayOfWeek}
                    onChange={e => setEditingActivity({ ...editingActivity, dayOfWeek: e.target.value })}
                    placeholder="Ej. Sáb, Vie..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Número de día</label>
                  <input 
                    type="text" 
                    value={editingActivity.dayNumber}
                    onChange={e => setEditingActivity({ ...editingActivity, dayNumber: e.target.value })}
                    placeholder="Ej. 10, 16, 17..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Mes</label>
                  <input 
                    type="text" 
                    value={editingActivity.month}
                    onChange={e => setEditingActivity({ ...editingActivity, month: e.target.value })}
                    placeholder="Ej. oct, nov, dic..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Año</label>
                  <input 
                    type="text" 
                    value={editingActivity.year || '2026'}
                    onChange={e => setEditingActivity({ ...editingActivity, year: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Lugar / Ubicación Principal</label>
                  <input 
                    type="text" 
                    value={editingActivity.location}
                    onChange={e => setEditingActivity({ ...editingActivity, location: e.target.value })}
                    placeholder="Ej. Salón multiusos, Auditorio principal ICC..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Ubicación (Etiqueta de diseño)</label>
                  <select 
                    value={editingActivity.locationType}
                    onChange={e => {
                      const val = e.target.value;
                      const isOutside = val === 'fuera';
                      setEditingActivity({ 
                        ...editingActivity, 
                        locationType: val,
                        isCustomLocation: isOutside ? true : editingActivity.isCustomLocation
                      });
                    }}
                    className="form-select"
                  >
                    <option value="multiusos">Salón multiusos (Establecido)</option>
                    <option value="auditorio">Auditorio principal ICC (Establecido)</option>
                    <option value="fuera">Fuera de ICC (Fuera de lo establecido)</option>
                    <option value="sin_reunion">Sin reunión de grupo</option>
                  </select>
                </div>

                {/* Sub-apartado dedicado: Ubicación fuera de lo establecido */}
                <div className="form-group full-width custom-location-toggle-box">
                  <label className="checkbox-label-styled">
                    <input 
                      type="checkbox"
                      checked={editingActivity.isCustomLocation || editingActivity.locationType === 'fuera'}
                      onChange={e => {
                        const checked = e.target.checked;
                        setEditingActivity({
                          ...editingActivity,
                          isCustomLocation: checked,
                          locationType: checked ? 'fuera' : (editingActivity.locationType === 'fuera' ? 'multiusos' : editingActivity.locationType),
                          location: checked ? (editingActivity.customLocationName || 'Fuera de ICC') : (editingActivity.location === 'Fuera de ICC' ? 'Salón multiusos' : editingActivity.location)
                        });
                      }}
                    />
                    <span className="checkbox-text-bold">
                      📍 ¿Esta actividad se realizará fuera de lo establecido? (Sede externa / Fuera de ICC)
                    </span>
                  </label>
                </div>

                {(editingActivity.isCustomLocation || editingActivity.locationType === 'fuera') && (
                  <div className="custom-location-apartado-card full-width">
                    <div className="apartado-header">
                      <div className="apartado-icon-wrap">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h5 className="apartado-title">Apartado: Ubicación Fuera de lo Establecido</h5>
                        <p className="apartado-desc">
                          Ingresa los datos exactos del lugar exterior, dirección, mapa de GPS e indicaciones de transporte para los jóvenes y servidores.
                        </p>
                      </div>
                    </div>

                    <div className="form-grid custom-location-grid">
                      <div className="form-group">
                        <label>Nombre del Lugar o Recinto Externo *</label>
                        <input 
                          type="text"
                          value={editingActivity.customLocationName || ''}
                          onChange={e => setEditingActivity({ 
                            ...editingActivity, 
                            customLocationName: e.target.value,
                            location: e.target.value.trim() ? e.target.value : 'Fuera de ICC'
                          })}
                          placeholder="Ej. Iglesia IBC, Comunidad Los Manguitos, Parque Mirador..."
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>Dirección física / Referencia exacta</label>
                        <input 
                          type="text"
                          value={editingActivity.customLocationAddress || ''}
                          onChange={e => setEditingActivity({ ...editingActivity, customLocationAddress: e.target.value })}
                          placeholder="Ej. Av. Sarasota No. 45, Bella Vista, Santo Domingo"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>Enlace de Ubicación GPS / Google Maps (Opcional)</label>
                        <input 
                          type="url"
                          value={editingActivity.customLocationMapUrl || ''}
                          onChange={e => setEditingActivity({ ...editingActivity, customLocationMapUrl: e.target.value })}
                          placeholder="Ej. https://maps.google.com/?q=..."
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>Indicaciones de Transporte / Punto de Encuentro</label>
                        <input 
                          type="text"
                          value={editingActivity.customLocationNotes || ''}
                          onChange={e => setEditingActivity({ ...editingActivity, customLocationNotes: e.target.value })}
                          placeholder="Ej. Punto de encuentro: Parqueo de ICC a las 2:00 pm para salir en caravana"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Schedules */}
            <div className="form-section-box">
              <h4 className="section-title">2. Horarios de Logística</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Horario de Montaje / Preparación</label>
                  <input 
                    type="text" 
                    value={editingActivity.prepTime || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, prepTime: e.target.value })}
                    placeholder="Ej. 5:00 – 7:00 pm"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Horario del Culto / Actividad</label>
                  <input 
                    type="text" 
                    value={editingActivity.activityTime || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, activityTime: e.target.value })}
                    placeholder="Ej. 7:00 – 9:00 pm"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Horario de Desmontaje</label>
                  <input 
                    type="text" 
                    value={editingActivity.teardownTime || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, teardownTime: e.target.value })}
                    placeholder="Ej. 9:00 – 9:30 pm"
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notas adicionales de logística</label>
                  <input 
                    type="text" 
                    value={editingActivity.notes || ''}
                    onChange={e => setEditingActivity({ ...editingActivity, notes: e.target.value })}
                    placeholder="Ej. Horario tentativo por confirmar..."
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Step-by-Step Program Builder */}
            <div className="form-section-box">
              <div className="section-header-flex">
                <div>
                  <h4 className="section-title">3. Programa Minuto a Minuto ({editingActivity.program?.length || 0} pasos)</h4>
                  <p className="section-desc">Define el orden del servicio que los líderes verán y marcarán en vivo.</p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={addProgramStep}
                >
                  <Plus size={16} />
                  <span>Agregar Bloque</span>
                </button>
              </div>

              <div className="program-steps-editor-list">
                {(editingActivity.program || []).map((step, idx) => (
                  <div key={idx} className="program-step-edit-card">
                    <div className="step-edit-row">
                      <div className="step-field time-field">
                        <label>Hora</label>
                        <input 
                          type="text" 
                          value={step.time}
                          onChange={e => updateProgramStep(idx, 'time', e.target.value)}
                          placeholder="Ej. 7:00 - 7:15 pm"
                          className="form-input"
                        />
                      </div>

                      <div className="step-field title-field">
                        <label>Actividad / Bloque</label>
                        <input 
                          type="text" 
                          value={step.title}
                          onChange={e => updateProgramStep(idx, 'title', e.target.value)}
                          placeholder="Ej. Dinámica rompehielos"
                          className="form-input"
                        />
                      </div>

                      <div className="step-field resp-field">
                        <label>Responsable</label>
                        <input 
                          type="text" 
                          value={step.responsible}
                          onChange={e => updateProgramStep(idx, 'responsible', e.target.value)}
                          placeholder="Ej. Emmanuel Torres"
                          className="form-input"
                        />
                      </div>

                      <button 
                        type="button" 
                        className="btn-remove-step"
                        onClick={() => removeProgramStep(idx)}
                        title="Eliminar este bloque"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="step-field full-field">
                      <label>Detalle / Descripción para los servidores</label>
                      <input 
                        type="text" 
                        value={step.description || ''}
                        onChange={e => updateProgramStep(idx, 'description', e.target.value)}
                        placeholder="Instrucciones específicas..."
                        className="form-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Server Roles & Assigned Persons */}
            <div className="form-section-box">
              <div className="section-header-flex">
                <div>
                  <h4 className="section-title">4. Servidores y Responsabilidades Asignadas</h4>
                  <p className="section-desc">Asigna a los miembros del equipo Youngers sus puestos específicos.</p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={addServerRole}
                >
                  <Plus size={16} />
                  <span>Asignar Servidor</span>
                </button>
              </div>

              <div className="server-roles-editor-list">
                {(editingActivity.serverAssignments || []).map((asg, idx) => (
                  <div key={idx} className="server-role-edit-card">
                    <div className="role-edit-top-row">
                      <div className="role-field">
                        <label>Rol / Puesto</label>
                        <input 
                          type="text"
                          value={asg.role}
                          onChange={e => updateServerRole(idx, 'role', e.target.value)}
                          placeholder="Ej. Sonido, Alabanza..."
                          className="form-input"
                        />
                      </div>

                      <div className="role-field">
                        <label>Servidor Seleccionado</label>
                        <select 
                          value={asg.serverId}
                          onChange={e => updateServerRole(idx, 'serverId', e.target.value)}
                          className="form-select"
                        >
                          {servers.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.nickname ? `(${s.nickname})` : ''} - {s.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="role-field status-field">
                        <label>Estado</label>
                        <select 
                          value={asg.status}
                          onChange={e => updateServerRole(idx, 'status', e.target.value)}
                          className="form-select"
                        >
                          <option value="Confirmado">Confirmado</option>
                          <option value="Pendiente">Pendiente</option>
                          <option value="De Permiso">De Permiso</option>
                        </select>
                      </div>

                      <button 
                        type="button" 
                        className="btn-remove-step"
                        onClick={() => removeServerRole(idx)}
                        title="Quitar este rol"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="role-field full-field">
                      <label>Responsabilidad específica que debe realizar:</label>
                      <input 
                        type="text" 
                        value={asg.duties || ''}
                        onChange={e => updateServerRole(idx, 'duties', e.target.value)}
                        placeholder="Ej. Llegar a las 5:00 pm para calibración de micrófonos..."
                        className="form-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Save Button */}
            <div className="editor-submit-bar">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleAttemptCloseActivityEditor}
                title="Cancelar y descartar [Esc]"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                title="Guardar cambios [Enter]"
              >
                <Check size={18} />
                <span>Guardar Actividad y Programa</span>
                <span className="btn-key-hint">↵ Enter</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : null}

  {/* Prompt when attempting to exit activity editor with unsaved changes */}
  <UnsavedChangesModal 
    isOpen={showUnsavedPrompt}
    onContinueEditing={() => setShowUnsavedPrompt(false)}
    onDiscardAndExit={() => {
      setShowUnsavedPrompt(false);
      setEditingActivity(null);
      setIsCreating(false);
      if (clearActivityToEdit) clearActivityToEdit();
    }}
    onSaveAndExit={handleSaveCurrentActivity}
  />

      {/* Activities Management Table */}
      <div className="admin-table-container">
        <div className="admin-table-header-row">
          <h3 className="sub-heading">Registro de Actividades Activas ({activities.length})</h3>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Grupo</th>
                <th>Actividad</th>
                <th>Predicador</th>
                <th>Lugar</th>
                <th>Pasos</th>
                <th>Servidores</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activities.map(act => (
                <tr key={act.id}>
                  <td>
                    <strong>{act.dayOfWeek} {act.dayNumber} {act.month}</strong>
                  </td>
                  <td>
                    <span className={`group-pill-sm ${act.group === 'jotapece' ? 'pill-jpc' : act.group === 'siervos' ? 'pill-siervos' : 'pill-ambos'}`}>
                      {act.group === 'jotapece' ? 'Jotapece' : act.group === 'siervos' ? 'Siervos' : 'Ambos'}
                    </span>
                  </td>
                  <td>
                    <strong>{act.title}</strong>
                  </td>
                  <td>{act.preacher || '-'}</td>
                  <td>
                    <div className="table-location-cell">
                      <span className={`location-pill-sm tag-${act.locationType}`}>
                        {act.customLocationName || act.location}
                      </span>
                      {(act.isCustomLocation || act.locationType === 'fuera') && (
                        <span className="table-fuera-tag" title={act.customLocationAddress || 'Ubicación fuera de lo establecido'}>
                          📍 Fuera de lo establecido
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{act.program?.length || 0}</td>
                  <td>{act.serverAssignments?.length || 0}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-table-action"
                        onClick={() => handleStartEdit(act)}
                        title="Editar actividad y programa"
                      >
                        <Edit3 size={15} />
                        <span>Editar</span>
                      </button>
                      <button 
                        className="btn-table-action btn-danger"
                        onClick={() => {
                          const executeDelete = () => {
                            if (confirm(`¿Seguro que deseas eliminar la actividad "${act.title}"?`)) {
                              onDeleteActivity(act.id);
                            }
                          };

                          if (onRequireAuth) {
                            onRequireAuth(executeDelete, {
                              title: 'Eliminar Actividad',
                              description: `Se requiere contraseña administrativa para eliminar "${act.title}".`
                            });
                          } else {
                            executeDelete();
                          }
                        }}
                        title="Eliminar actividad"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notices & Announcements Manager */}
      <div className="admin-announcements-card">
        <h3 className="sub-heading">Avisos y Notas al Pie del Calendario</h3>
        <p className="desc">
          Coloca una nota por línea. Estas notas aparecen al final del calendario de los servidores tal como en el diseño original.
        </p>

        <textarea 
          rows={5}
          value={announcementsText}
          onChange={e => setAnnouncementsText(e.target.value)}
          className="form-textarea"
          placeholder="Escribe cada nota en una línea diferente..."
        />

        <div className="announcements-actions-row">
          <button className="btn btn-primary" onClick={handleSaveAnnouncements}>
            <Check size={16} />
            <span>Guardar Avisos</span>
          </button>
          {announcementsSaved && (
            <span className="saved-success-pill">¡Avisos actualizados exitosamente!</span>
          )}
        </div>
      </div>

      {/* Dangerous Reset Defaults Action */}
      <div className="admin-danger-zone">
        <div className="danger-text">
          <strong>Restablecer al Calendario Oficial Original</strong>
          <p>Restaura todas las 13 actividades originales y servidores de Octubre a Diciembre 2026.</p>
        </div>
        <button 
          className="btn btn-secondary btn-danger-outline"
          onClick={() => {
            const executeReset = () => {
              if (confirm('¿Deseas restaurar todas las actividades al calendario oficial inicial de Youngers ICC?')) {
                onResetDefaults();
                alert('¡Datos restablecidos al calendario oficial inicial!');
              }
            };

            if (onRequireAuth) {
              onRequireAuth(executeReset, {
                title: 'Restablecer Valores Predeterminados',
                description: 'Esta acción borrará todas las modificaciones locales. Introduce la contraseña administrativa para confirmar.'
              });
            } else {
              executeReset();
            }
          }}
        >
          <RefreshCw size={16} />
          <span>Restaurar Valores Predeterminados</span>
        </button>
      </div>
    </div>
  );
}
