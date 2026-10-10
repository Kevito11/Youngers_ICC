import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, User, Users, UserCheck, 
  CheckSquare, Square, Share2, Search, Check, ExternalLink,
  ChevronRight, Sparkles, AlertCircle
} from './Icons';
import { parseDateComponents } from '../data/catalogs';

const STORAGE_ACTIVE_SERVER_KEY = 'youngers_active_server_id_v1';
const STORAGE_COMPLETED_STEPS_KEY = 'youngers_server_checked_steps_v1';

export default function ServerParticipationView({
  activities = [],
  servers = [],
  onSelectActivity = null
}) {
  // Servidor seleccionado
  const [selectedServerId, setSelectedServerId] = useState(() => {
    return localStorage.getItem(STORAGE_ACTIVE_SERVER_KEY) || '';
  });

  // Filtros de actividades
  const [activityFilterMode, setActivityFilterMode] = useState('upcoming'); // 'upcoming' | 'all' | 'specific'
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'jotapece' | 'siervos'
  const [serverSearchQuery, setServerSearchQuery] = useState('');

  // Estado de checklist de pasos completados por el servidor
  const [checkedSteps, setCheckedSteps] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COMPLETED_STEPS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Estado de notificación de copiado a WhatsApp
  const [copiedActivityId, setCopiedActivityId] = useState(null);

  // Guardar servidor activo en localStorage
  useEffect(() => {
    if (selectedServerId) {
      localStorage.setItem(STORAGE_ACTIVE_SERVER_KEY, selectedServerId);
    }
  }, [selectedServerId]);

  // Si el servidor seleccionado no existe en la lista oficial de servidores, limpiar selección obsoleta
  useEffect(() => {
    if (selectedServerId && servers.length > 0) {
      const exists = servers.some(s => s.id === selectedServerId);
      if (!exists) {
        setSelectedServerId('');
        try { localStorage.removeItem(STORAGE_ACTIVE_SERVER_KEY); } catch {}
      }
    }
  }, [servers, selectedServerId]);

  // Guardar checklist en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COMPLETED_STEPS_KEY, JSON.stringify(checkedSteps));
    } catch (e) {
      console.error('Error saving checked steps', e);
    }
  }, [checkedSteps]);

  // Servidor seleccionado actual
  const currentServer = useMemo(() => {
    return servers.find(s => s.id === selectedServerId) || null;
  }, [servers, selectedServerId]);

  // Lista de servidores ordenados alfabéticamente
  const sortedServers = useMemo(() => {
    return [...servers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [servers]);

  // Servidores filtrados para el selector
  const filteredServersList = useMemo(() => {
    if (!serverSearchQuery.trim()) return sortedServers;
    const q = serverSearchQuery.toLowerCase().trim();
    return sortedServers.filter(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.nickname || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q)
    );
  }, [sortedServers, serverSearchQuery]);

  // Toggle de un paso del checklist personal
  const toggleStepCompleted = (actId, stepIdx) => {
    const key = `${actId}_step_${stepIdx}`;
    setCheckedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calcular la participación del servidor actual en cada actividad
  const serverParticipations = useMemo(() => {
    if (!currentServer) return [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const results = [];

    activities.forEach(activity => {
      // Filtro por grupo
      if (groupFilter !== 'all') {
        if (activity.group !== 'ambos' && activity.group !== groupFilter) return;
      }

      // 1. Asignación directa en serverAssignments
      const assignment = (activity.serverAssignments || []).find(asg => 
        (asg.serverId && asg.serverId === currentServer.id) ||
        (asg.serverName && asg.serverName.toLowerCase().trim() === currentServer.name.toLowerCase().trim())
      );

      // 2. Predicador
      const isPreacher = activity.preacher && 
        activity.preacher.toLowerCase().includes(currentServer.name.toLowerCase().trim());

      // 3. Bloques del programa minuto a minuto donde es responsable
      const mySteps = (activity.program || []).map((step, idx) => ({ ...step, stepIndex: idx })).filter(step => {
        if (!step.responsible) return false;
        const resp = step.responsible.toLowerCase();
        const sName = currentServer.name.toLowerCase();
        const parts = sName.split(' ');
        const firstName = parts[0];
        const lastName = parts[parts.length - 1];

        // Coincidencia con nombre completo
        if (resp.includes(sName)) return true;

        // Coincidencia si escribieron "Nombre Apellido"
        if (parts.length >= 2 && resp.includes(firstName) && resp.includes(lastName)) return true;

        // Coincidencia con apodo si tiene
        if (currentServer.nickname && resp.includes(currentServer.nickname.toLowerCase())) return true;

        return false;
      });

      // Si participa en algo
      if (assignment || isPreacher || mySteps.length > 0) {
        const isUpcoming = (activity.fullDate || activity.date) >= todayStr;

        results.push({
          activity,
          assignment,
          isPreacher,
          mySteps,
          isUpcoming
        });
      }
    });

    // Ordenar cronológicamente
    results.sort((a, b) => {
      const dateA = a.activity.fullDate || a.activity.date || '';
      const dateB = b.activity.fullDate || b.activity.date || '';
      return dateA.localeCompare(dateB);
    });

    return results;
  }, [activities, currentServer, groupFilter]);

  // Filtrar según el modo de visualización elegido
  const displayedParticipations = useMemo(() => {
    if (activityFilterMode === 'upcoming') {
      const upcoming = serverParticipations.filter(p => p.isUpcoming);
      // Si no hay futuras, mostrar al menos las más recientes
      return upcoming.length > 0 ? upcoming : serverParticipations.slice(-3);
    }
    if (activityFilterMode === 'specific' && selectedActivityId) {
      return serverParticipations.filter(p => p.activity.id === selectedActivityId);
    }
    return serverParticipations;
  }, [serverParticipations, activityFilterMode, selectedActivityId]);

  // Generar texto para compartir por WhatsApp
  const handleCopyWhatsAppBriefing = (item) => {
    const act = item.activity;
    const dateComp = parseDateComponents(act.fullDate || act.date);
    const dateStr = dateComp ? `${dateComp.dayOfWeek} ${dateComp.dayNumber} de ${dateComp.monthFull} ${dateComp.year}` : (act.fullDate || act.date);

    const roleName = item.isPreacher ? 'Predicador del Servicio' : (item.assignment?.role || 'Servidor de Apoyo');
    const duties = item.assignment?.duties || '';

    let text = `📋 *HOJA DE SERVICIO · YOUNGERS ICC*\n`;
    text += `👤 *Servidor:* ${currentServer.name}${currentServer.nickname ? ` (${currentServer.nickname})` : ''}\n`;
    text += `📌 *Actividad:* ${act.title}\n`;
    text += `📅 *Fecha:* ${dateStr}\n`;
    text += `📍 *Lugar:* ${act.location || 'Salón multiusos'}\n\n`;

    text += `⏰ *HORARIOS IMPORTANTES:*\n`;
    if (act.prepTime) {
      text += `🚨 *Tu llegada / Montaje:* ${act.prepTime}\n`;
    }
    if (act.activityTime) {
      text += `⛪ *Horario del Culto:* ${act.activityTime}\n`;
    }
    if (act.teardownTime) {
      text += `🧹 *Desmontaje / Cierre:* ${act.teardownTime}\n`;
    }

    text += `\n🎯 *TU ROL ASIGNADO:*\n`;
    text += `👉 *${roleName}*\n`;
    if (duties) {
      text += `📝 _${duties}_\n`;
    }

    if (item.mySteps.length > 0) {
      text += `\n⏱️ *TUS BLOQUES EN EL PROGRAMA:*\n`;
      item.mySteps.forEach(s => {
        text += `• *${s.time || 'Sin hora'}* — ${s.title}\n`;
        if (s.description) {
          text += `  ↳ _${s.description}_\n`;
        }
      });
    }

    text += `\n💪 _"Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres." (Col. 3:23)_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedActivityId(act.id);
      setTimeout(() => setCopiedActivityId(null), 3000);
    });
  };

  return (
    <div className="server-participation-page container">
      {/* Hero Header */}
      <div className="participation-hero-card">
        <div className="participation-hero-content">
          <div className="participation-badge">
            <UserCheck size={16} />
            <span>PORTAL DEL SERVIDOR</span>
          </div>
          <h2 className="participation-hero-title">Mi Participación &amp; Hoja de Ruta</h2>
          <p className="participation-hero-subtitle">
            Consulta exactamente tus horarios de llegada, bloques asignados en el programa minuto a minuto y deberes para cada actividad.
          </p>
        </div>

        {/* Selector de Servidor Activo */}
        <div className="participation-server-select-box">
          <label className="select-server-label">
            <User size={15} />
            <span>¿Quién eres tú? Elige tu nombre:</span>
          </label>
          <div className="server-select-control-wrap">
            <select
              value={selectedServerId}
              onChange={e => setSelectedServerId(e.target.value)}
              className="form-select server-select-dropdown"
            >
              <option value="">-- Selecciona tu nombre en la lista ({sortedServers.length}) --</option>
              {sortedServers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.nickname ? `(${s.nickname})` : ''} · {s.role || 'Servidor'}
                </option>
              ))}
            </select>
          </div>

          {currentServer && (
            <div className="selected-server-pill">
              <span className="server-avatar-mini">{currentServer.name.charAt(0)}</span>
              <div className="server-pill-meta">
                <strong>{currentServer.name}</strong>
                <span className="server-pill-role">{currentServer.role || 'Servidor'}</span>
              </div>
              <button
                type="button"
                className="btn-change-server"
                onClick={() => setSelectedServerId('')}
                title="Cambiar servidor"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Si no ha seleccionado ningún servidor */}
      {!currentServer ? (
        <div className="participation-empty-prompt">
          <div className="empty-prompt-icon">
            <UserCheck size={48} />
          </div>
          <h3>Selecciona tu nombre para comenzar</h3>
          <p>
            Elige tu nombre en el menú superior para ver tu resumen de participación, horarios de llegada y cada bloque que te corresponde liderar en las actividades de Youngers ICC.
          </p>
          <div className="quick-server-bubbles">
            <span className="bubbles-label">O pulsa sobre tu nombre:</span>
            <div className="bubbles-wrap">
              {sortedServers.slice(0, 12).map(s => (
                <button
                  key={s.id}
                  type="button"
                  className="quick-server-bubble-btn"
                  onClick={() => setSelectedServerId(s.id)}
                >
                  👤 {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Barra de Filtros de Actividades */}
          <div className="participation-filters-bar">
            <div className="filter-modes-group">
              <button
                type="button"
                className={`filter-mode-btn ${activityFilterMode === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActivityFilterMode('upcoming')}
              >
                📅 Próximas Actividades
              </button>
              <button
                type="button"
                className={`filter-mode-btn ${activityFilterMode === 'all' ? 'active' : ''}`}
                onClick={() => setActivityFilterMode('all')}
              >
                📁 Todo el Período ({serverParticipations.length})
              </button>
              <button
                type="button"
                className={`filter-mode-btn ${activityFilterMode === 'specific' ? 'active' : ''}`}
                onClick={() => setActivityFilterMode('specific')}
              >
                ⭐ Actividad Específica
              </button>
            </div>

            {/* Selector de actividad específica si está activo */}
            {activityFilterMode === 'specific' && (
              <div className="specific-act-selector-wrap">
                <select
                  value={selectedActivityId}
                  onChange={e => setSelectedActivityId(e.target.value)}
                  className="form-select specific-act-dropdown"
                >
                  <option value="">-- Elige una actividad ({activities.length}) --</option>
                  {activities.map(act => {
                    const hasMe = serverParticipations.some(p => p.activity.id === act.id);
                    return (
                      <option key={act.id} value={act.id}>
                        {hasMe ? '⭐ ' : ''}{act.title} ({act.fullDate || act.date})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Filtro por grupo */}
            <div className="group-pills-wrap">
              <button
                type="button"
                className={`group-filter-pill ${groupFilter === 'all' ? 'active' : ''}`}
                onClick={() => setGroupFilter('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`group-filter-pill ${groupFilter === 'jotapece' ? 'active' : ''}`}
                onClick={() => setGroupFilter('jotapece')}
              >
                JPC
              </button>
              <button
                type="button"
                className={`group-filter-pill ${groupFilter === 'siervos' ? 'active' : ''}`}
                onClick={() => setGroupFilter('siervos')}
              >
                Siervos
              </button>
            </div>
          </div>

          {/* Lista de Fichas de Participación */}
          {displayedParticipations.length > 0 ? (
            <div className="participation-cards-list">
              {displayedParticipations.map(item => {
                const act = item.activity;
                const dateComp = parseDateComponents(act.fullDate || act.date);
                const roleName = item.isPreacher ? 'Predicador del Servicio' : (item.assignment?.role || 'Servidor de Apoyo');
                const duties = item.assignment?.duties || '';
                const isCopied = copiedActivityId === act.id;

                return (
                  <div key={act.id} className="participation-activity-card">
                    {/* Header de la tarjeta */}
                    <div className="act-card-header">
                      <div className="act-date-badge">
                        <span className="date-day-num">{dateComp?.dayNumber || '10'}</span>
                        <div className="date-month-group">
                          <span className="date-month">{dateComp?.month || 'oct'}</span>
                          <span className="date-weekday">{dateComp?.dayOfWeek || 'Sáb'}</span>
                        </div>
                      </div>

                      <div className="act-title-group">
                        <div className="act-tags-row">
                          <span className={`act-group-pill ${act.group || 'jotapece'}`}>
                            {act.group === 'jotapece' ? 'Jotapece' : act.group === 'siervos' ? 'Siervos' : 'Ambos'}
                          </span>
                          {act.location && (
                            <span className="act-location-pill">
                              <MapPin size={12} />
                              {act.location}
                            </span>
                          )}
                          {item.isUpcoming && (
                            <span className="act-upcoming-pill">Próxima</span>
                          )}
                        </div>
                        <h3 className="act-card-title">{act.title}</h3>
                      </div>

                      <div className="act-header-actions">
                        <button
                          type="button"
                          className={`btn btn-sm ${isCopied ? 'btn-copied' : 'btn-whatsapp-copy'}`}
                          onClick={() => handleCopyWhatsAppBriefing(item)}
                          title="Copiar resumen formateado para compartir por WhatsApp"
                        >
                          {isCopied ? <Check size={14} /> : <Share2 size={14} />}
                          <span>{isCopied ? '¡Copiado!' : 'WhatsApp'}</span>
                        </button>
                        {onSelectActivity && (
                          <button
                            type="button"
                            className="btn btn-sm btn-view-full-act"
                            onClick={() => onSelectActivity(act)}
                            title="Ver programa y logística completa"
                          >
                            <span>Ver Completo</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dashboard de Horarios Clave */}
                    <div className="act-times-grid">
                      {act.prepTime && (
                        <div className="act-time-box arrival-time">
                          <div className="time-box-label">
                            🚨 Tu Llegada (Montaje / Prep)
                          </div>
                          <div className="time-box-value">{act.prepTime}</div>
                          <div className="time-box-hint">Estar puntual para ensayo y oración</div>
                        </div>
                      )}

                      {act.activityTime && (
                        <div className="act-time-box service-time">
                          <div className="time-box-label">
                            ⛪ Horario del Culto
                          </div>
                          <div className="time-box-value">{act.activityTime}</div>
                          <div className="time-box-hint">Desarrollo de la actividad</div>
                        </div>
                      )}

                      {act.teardownTime && (
                        <div className="act-time-box teardown-time">
                          <div className="time-box-label">
                            🧹 Desmontaje y Cierre
                          </div>
                          <div className="time-box-value">{act.teardownTime}</div>
                          <div className="time-box-hint">Recogida y entrega del salón</div>
                        </div>
                      )}
                    </div>

                    {/* Rol y Responsabilidad Asignada */}
                    <div className="act-role-briefing-box">
                      <div className="role-briefing-header">
                        <span className="role-briefing-tag">🎯 TU ROL EN ESTE SERVICIO</span>
                        <strong className="role-briefing-name">{roleName}</strong>
                      </div>
                      {duties && (
                        <p className="role-briefing-duties">
                          <strong>Responsabilidad:</strong> {duties}
                        </p>
                      )}
                    </div>

                    {/* Bloques Minuto a Minuto donde participa */}
                    {item.mySteps.length > 0 && (
                      <div className="act-my-steps-section">
                        <div className="my-steps-header">
                          <h4 className="my-steps-title">
                            ⏱️ Tus Bloques en el Programa Minuto a Minuto ({item.mySteps.length})
                          </h4>
                          <span className="my-steps-hint">Marca los bloques que vayas completando en vivo</span>
                        </div>

                        <div className="my-steps-list">
                          {item.mySteps.map(step => {
                            const isChecked = Boolean(checkedSteps[`${act.id}_step_${step.stepIndex}`]);
                            return (
                              <div 
                                key={step.stepIndex} 
                                className={`my-step-card ${isChecked ? 'completed' : ''}`}
                                onClick={() => toggleStepCompleted(act.id, step.stepIndex)}
                              >
                                <button
                                  type="button"
                                  className="step-check-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStepCompleted(act.id, step.stepIndex);
                                  }}
                                  title={isChecked ? 'Marcar como pendiente' : 'Marcar como completado'}
                                >
                                  {isChecked ? (
                                    <CheckSquare size={20} className="check-icon-active" />
                                  ) : (
                                    <Square size={20} className="check-icon-idle" />
                                  )}
                                </button>

                                <div className="step-time-badge">
                                  <Clock size={13} />
                                  <span>{step.time || 'Horario'}</span>
                                </div>

                                <div className="step-main-info">
                                  <strong className="step-title-text">{step.title}</strong>
                                  {step.responsible && (
                                    <span className="step-partners-text">
                                      👤 Encargados: <em>{step.responsible}</em>
                                    </span>
                                  )}
                                  {step.description && (
                                    <p className="step-description-text">
                                      📝 {step.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Si no tiene bloques directos pero está en logística */}
                    {item.mySteps.length === 0 && (
                      <div className="act-backstage-notice">
                        <AlertCircle size={16} />
                        <span>
                          Tu labor principal es en el equipo de apoyo logístico / backstage durante todo el culto según tu rol de <strong>{roleName}</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="participation-no-results-card">
              <AlertCircle size={32} />
              <h4>No se encontraron actividades con asignaciones para este filtro</h4>
              <p>
                {activityFilterMode === 'upcoming' 
                  ? `${currentServer.name} no tiene actividades futuras programadas con su nombre por ahora.`
                  : `No hay asignaciones para ${currentServer.name} en el filtro seleccionado.`}
              </p>
              <div className="no-results-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActivityFilterMode('all')}
                >
                  Ver todo el historial del período
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
