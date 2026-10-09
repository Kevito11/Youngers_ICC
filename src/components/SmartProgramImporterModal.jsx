import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Sparkles, Check, Clock, User, Users, AlertCircle, AlertTriangle, Calendar, Search, ArrowLeft, Plus } from './Icons';
import { parseSmartProgramText, findMatchingServer } from '../utils/smartProgramParser';

export default function SmartProgramImporterModal({
  isOpen,
  onClose,
  onApply,
  registeredServers = [],
  rolesCatalog = [],
  currentActivity = null,
  onAddServer = null,
  onUpdateRolesCatalog = null
}) {
  // Pasos: 1 = Servidores que estarán, 2 = Pegar y procesar programa
  const [step, setStep] = useState(1);

  // Paso 1: Estado de servidores seleccionados
  const [selectedServerIds, setSelectedServerIds] = useState(new Set());
  const [customGuestServers, setCustomGuestServers] = useState([]);
  const [guestInput, setGuestInput] = useState('');
  const [serverSearch, setServerSearch] = useState('');
  const [serverFilterGroup, setServerFilterGroup] = useState('all'); // all | jotapece | siervos | selected

  // Paso 2: Estado del texto y análisis
  const [rawText, setRawText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  
  // Registro de decisiones para servidores y roles no existentes en el sistema: 'created' | 'temporary' | { type: 'associated', serverId, serverName }
  const [unregisteredDecisions, setUnregisteredDecisions] = useState({});
  const [associatingServer, setAssociatingServer] = useState(null); // Nombre del servidor que se está asociando actualmente
  const [selectedAssociateId, setSelectedAssociateId] = useState({}); // { [unregName]: serverId }

  // Opciones de qué elementos aplicar al servicio
  const [options, setOptions] = useState({
    applySteps: true,
    applySchedules: true,
    applyPreacher: true,
    applyServers: true
  });

  const overlayMouseDownRef = useRef(false);

  // Inicialización al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setRawText('');
      setParsedResult(null);
      setServerSearch('');
      setServerFilterGroup('all');

      // Pre-cargar los servidores que ya tiene asignada la actividad si existen
      const preselected = new Set();
      const guests = [];

      if (currentActivity?.serverAssignments && Array.isArray(currentActivity.serverAssignments)) {
        currentActivity.serverAssignments.forEach(asg => {
          if (asg.serverId) {
            preselected.add(asg.serverId);
          } else if (asg.serverName && asg.serverName.trim()) {
            const matched = registeredServers.find(s => s.name?.trim().toLowerCase() === asg.serverName.trim().toLowerCase());
            if (matched) {
              preselected.add(matched.id);
            } else if (!guests.includes(asg.serverName.trim())) {
              guests.push(asg.serverName.trim());
            }
          }
        });
      }

      // Si la actividad no tenía servidores asignados pero tiene un grupo definido, pre-cargar los servidores de ese grupo
      if (preselected.size === 0 && currentActivity?.group) {
        const actGroup = currentActivity.group;
        registeredServers.forEach(s => {
          if (s.active && Array.isArray(s.groups)) {
            if (actGroup === 'ambos' || s.groups.includes(actGroup) || s.groups.includes('ambos')) {
              preselected.add(s.id);
            }
          }
        });
      }

      setSelectedServerIds(preselected);
      setCustomGuestServers(guests);
    }
  }, [isOpen, currentActivity, registeredServers]);

  // Servidores registrados ordenados alfabéticamente
  const sortedRegistered = useMemo(() => {
    return [...(registeredServers || [])].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [registeredServers]);

  // Filtrado de servidores para el Paso 1
  const filteredServers = useMemo(() => {
    return sortedRegistered.filter(s => {
      // Filtro de búsqueda
      if (serverSearch.trim()) {
        const query = serverSearch.toLowerCase().trim();
        const matchesName = (s.name || '').toLowerCase().includes(query);
        const matchesNick = (s.nickname || '').toLowerCase().includes(query);
        const matchesRole = (s.role || '').toLowerCase().includes(query);
        if (!matchesName && !matchesNick && !matchesRole) return false;
      }

      // Filtro de grupo o seleccionados
      if (serverFilterGroup === 'selected') {
        return selectedServerIds.has(s.id);
      }
      if (serverFilterGroup === 'jotapece') {
        return Array.isArray(s.groups) && (s.groups.includes('jotapece') || s.groups.includes('ambos'));
      }
      if (serverFilterGroup === 'siervos') {
        return Array.isArray(s.groups) && (s.groups.includes('siervos') || s.groups.includes('ambos'));
      }

      return true;
    });
  }, [sortedRegistered, serverSearch, serverFilterGroup, selectedServerIds]);

  // Conteo de seleccionados
  const totalSelectedCount = selectedServerIds.size + customGuestServers.length;

  // Toggle de un servidor individual
  const toggleServerSelection = (id) => {
    const updated = new Set(selectedServerIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedServerIds(updated);
  };

  // Acciones rápidas de selección
  const handleSelectByGroup = (groupKey) => {
    const updated = new Set(selectedServerIds);
    sortedRegistered.forEach(s => {
      if (s.active && Array.isArray(s.groups)) {
        if (groupKey === 'all' || s.groups.includes(groupKey) || s.groups.includes('ambos')) {
          updated.add(s.id);
        }
      }
    });
    setSelectedServerIds(updated);
  };

  const handleSelectAllActive = () => {
    const updated = new Set(selectedServerIds);
    sortedRegistered.forEach(s => {
      if (s.active) updated.add(s.id);
    });
    setSelectedServerIds(updated);
  };

  const handleClearSelection = () => {
    setSelectedServerIds(new Set());
    setCustomGuestServers([]);
  };

  // Agregar servidor invitado manual
  const handleAddGuestServer = (e) => {
    e.preventDefault();
    if (!guestInput.trim()) return;
    const name = guestInput.trim();
    if (!customGuestServers.includes(name)) {
      setCustomGuestServers([...customGuestServers, name]);
    }
    setGuestInput('');
  };

  const handleRemoveGuestServer = (nameToRemove) => {
    setCustomGuestServers(customGuestServers.filter(n => n !== nameToRemove));
  };

  // Construir lista de objetos de servidores confirmados que estarán en este servicio
  const confirmedAttendingServers = useMemo(() => {
    const list = [];
    // Servidores registrados seleccionados
    sortedRegistered.forEach(s => {
      if (selectedServerIds.has(s.id)) {
        list.push(s);
      }
    });
    // Servidores invitados
    customGuestServers.forEach((name, idx) => {
      list.push({
        id: `guest-${idx}`,
        name: name,
        role: 'Servidor Invitado',
        isGuest: true
      });
    });
    return list;
  }, [sortedRegistered, selectedServerIds, customGuestServers]);

  // Avanzar al Paso 2
  const handleProceedToProgramStep = () => {
    if (totalSelectedCount === 0) {
      alert('Por favor selecciona o añade al menos un servidor que estará en el servicio.');
      return;
    }
    setStep(2);
  };

  // Ejecutar el parser en Paso 2
  const handleParse = () => {
    if (!rawText.trim()) return;
    setUnregisteredDecisions({});
    setAssociatingServer(null);
    setSelectedAssociateId({});
    const result = parseSmartProgramText(
      rawText, 
      confirmedAttendingServers, 
      registeredServers, 
      rolesCatalog
    );
    setParsedResult(result);
  };

  // Manejadores para registrar servidores y roles permanentemente o temporales
  const handleRegisterServerPermanently = (unreg) => {
    const newServer = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: unreg.name,
      role: unreg.suggestedRole || 'Servidor',
      groups: [currentActivity?.group || 'jotapece'],
      primaryAreas: [unreg.suggestedRole || 'Logística'],
      active: true
    };
    if (onAddServer) {
      onAddServer(newServer);
    }
    setUnregisteredDecisions(prev => ({
      ...prev,
      [`srv_${unreg.name.toLowerCase()}`]: { type: 'created' }
    }));
    if (associatingServer === unreg.name) setAssociatingServer(null);
  };

  const handleSetServerTemporary = (unreg) => {
    setUnregisteredDecisions(prev => ({
      ...prev,
      [`srv_${unreg.name.toLowerCase()}`]: { type: 'temporary' }
    }));
    if (associatingServer === unreg.name) setAssociatingServer(null);
  };

  // Abrir selector de asociación y sugerir servidor similar si existe
  const handleStartAssociateServer = (unregName) => {
    if (associatingServer === unregName) {
      setAssociatingServer(null);
      return;
    }
    setAssociatingServer(unregName);
    if (!selectedAssociateId[unregName]) {
      const suggested = findMatchingServer(unregName, registeredServers, 40);
      if (suggested) {
        setSelectedAssociateId(prev => ({ ...prev, [unregName]: suggested.id }));
      }
    }
  };

  // Confirmar la asociación de un nombre detectado con un servidor del sistema
  const handleConfirmAssociateServer = (unreg, targetServerId) => {
    const targetServer = registeredServers.find(s => s.id === targetServerId);
    if (!targetServer) return;

    // 1. Guardar decisión
    setUnregisteredDecisions(prev => ({
      ...prev,
      [`srv_${unreg.name.toLowerCase()}`]: {
        type: 'associated',
        serverId: targetServer.id,
        serverName: targetServer.name,
        originalName: unreg.name
      }
    }));

    // 2. Actualizar parsedResult para vincular este servidor a los bloques del programa y backstage
    if (parsedResult) {
      const regex = new RegExp(`\\b${unreg.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      const updatedSteps = (parsedResult.programSteps || []).map(step => {
        if (step.responsible) {
          let updatedResp = step.responsible;
          if (updatedResp.toLowerCase().includes(unreg.name.toLowerCase())) {
            updatedResp = updatedResp.replace(regex, targetServer.name);
            if (updatedResp === step.responsible) {
              // Reemplazo directo en caso de pequeñas diferencias de puntuación
              updatedResp = updatedResp.replace(new RegExp(unreg.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), targetServer.name);
            }
          }
          return { ...step, responsible: updatedResp };
        }
        return step;
      });

      const updatedAssignments = (parsedResult.serverAssignments || []).map(asg => {
        if (asg.serverName && asg.serverName.toLowerCase() === unreg.name.toLowerCase()) {
          return {
            ...asg,
            serverId: targetServer.id,
            serverName: targetServer.name,
            role: asg.role || targetServer.role || 'Servidor'
          };
        }
        return asg;
      });

      let updatedPreacher = parsedResult.detectedPreacher;
      if (updatedPreacher && updatedPreacher.toLowerCase() === unreg.name.toLowerCase()) {
        updatedPreacher = targetServer.name;
      }

      setParsedResult(prev => ({
        ...prev,
        programSteps: updatedSteps,
        serverAssignments: updatedAssignments,
        detectedPreacher: updatedPreacher
      }));
    }

    setAssociatingServer(null);
  };

  // Deshacer una decisión (creado, temporal o asociado)
  const handleUndoDecision = (unregName) => {
    const key = `srv_${unregName.toLowerCase()}`;
    const prevDecision = unregisteredDecisions[key];

    if (prevDecision?.type === 'associated' && prevDecision.originalName && parsedResult) {
      const orig = prevDecision.originalName;
      const targetName = prevDecision.serverName;

      const updatedSteps = (parsedResult.programSteps || []).map(step => {
        if (step.responsible && step.responsible.includes(targetName)) {
          return {
            ...step,
            responsible: step.responsible.replace(targetName, orig)
          };
        }
        return step;
      });

      const updatedAssignments = (parsedResult.serverAssignments || []).map(asg => {
        if (asg.serverName === targetName && asg.serverId === prevDecision.serverId) {
          return {
            ...asg,
            serverId: '',
            serverName: orig
          };
        }
        return asg;
      });

      setParsedResult(prev => ({
        ...prev,
        programSteps: updatedSteps,
        serverAssignments: updatedAssignments,
        detectedPreacher: prev.detectedPreacher === targetName ? orig : prev.detectedPreacher
      }));
    }

    setUnregisteredDecisions(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleRegisterAllServersPermanently = () => {
    (parsedResult?.unregisteredServers || []).forEach(handleRegisterServerPermanently);
  };

  const handleSetAllServersTemporary = () => {
    (parsedResult?.unregisteredServers || []).forEach(handleSetServerTemporary);
  };

  const handleRegisterRolePermanently = (unreg) => {
    if (onUpdateRolesCatalog) {
      onUpdateRolesCatalog(unreg.role, unreg.defaultDuties);
    }
    setUnregisteredDecisions(prev => ({
      ...prev,
      [`role_${unreg.role.toLowerCase()}`]: { type: 'created' }
    }));
  };

  const handleSetRoleTemporary = (unreg) => {
    setUnregisteredDecisions(prev => ({
      ...prev,
      [`role_${unreg.role.toLowerCase()}`]: { type: 'temporary' }
    }));
  };

  const handleRegisterAllRolesPermanently = () => {
    (parsedResult?.unregisteredRoles || []).forEach(handleRegisterRolePermanently);
  };

  const handleSetAllRolesTemporary = () => {
    (parsedResult?.unregisteredRoles || []).forEach(handleSetRoleTemporary);
  };

  // Aplicar cambios a la actividad
  const handleApplyToService = () => {
    if (!parsedResult || !parsedResult.success) return;

    onApply({
      programSteps: options.applySteps ? parsedResult.programSteps : null,
      schedules: options.applySchedules ? parsedResult.suggestedSchedules : null,
      preacher: (options.applyPreacher && parsedResult.detectedPreacher) ? parsedResult.detectedPreacher : null,
      serverAssignments: options.applyServers ? parsedResult.serverAssignments : null
    });

    onClose();
  };

  const hasAnyDetected = parsedResult && (
    (parsedResult.programSteps && parsedResult.programSteps.length > 0) ||
    parsedResult.detectedPreacher ||
    (parsedResult.serverAssignments && parsedResult.serverAssignments.length > 0)
  );

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay smart-importer-overlay"
      onMouseDown={e => {
        overlayMouseDownRef.current = (e.target === e.currentTarget);
      }}
      onClick={e => {
        if (e.target === e.currentTarget && overlayMouseDownRef.current) {
          onClose();
        }
        overlayMouseDownRef.current = false;
      }}
    >
      <div 
        className="modal-container smart-importer-container"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header con indicador de pasos */}
        <div className="smart-importer-header">
          <div className="smart-importer-title-group">
            <div className="smart-importer-icon-wrap">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="smart-importer-badge">HERRAMIENTA AUTOMÁTICA</div>
              <h3 className="smart-importer-title">Importador Inteligente</h3>
              <p className="smart-importer-subtitle">
                {step === 1 
                  ? 'Paso 1: Confirma los servidores que participarán en esta actividad' 
                  : 'Paso 2: Pega el texto del programa con horarios y encargados'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            title="Cerrar importador [Esc]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de progreso de Pasos */}
        <div className="smart-wizard-steps-bar">
          <button 
            type="button"
            className={`wizard-step-tab ${step === 1 ? 'active' : 'completed'}`}
            onClick={() => setStep(1)}
          >
            <span className="step-num">{step > 1 ? '✓' : '1'}</span>
            <span className="step-label">1. Servidores que estarán ({totalSelectedCount})</span>
          </button>

          <div className="wizard-step-divider">→</div>

          <button 
            type="button"
            className={`wizard-step-tab ${step === 2 ? 'active' : ''}`}
            onClick={() => {
              if (totalSelectedCount > 0) setStep(2);
              else alert('Primero selecciona los servidores que estarán en el servicio.');
            }}
          >
            <span className="step-num">2</span>
            <span className="step-label">2. Pegar Programa</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="smart-importer-body">
          {/* ===================================================
              PASO 1: SELECCIONAR SERVIDORES QUE ESTARÁN
          ==================================================== */}
          {step === 1 && (
            <div className="smart-step-servers-box">
              <div className="step-helper-banner">
                <Users size={20} color="#0284c7" />
                <div>
                  <strong>Indica los servidores asignados para esta fecha:</strong>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Al continuar, el importador cruzará los nombres de tu texto de WhatsApp con estos servidores para asignarles sus roles automáticamente.
                  </p>
                </div>
              </div>

              {/* Barra de acciones rápidas */}
              <div className="server-quick-actions-row">
                <div className="quick-actions-left">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectByGroup(currentActivity?.group || 'jotapece')}
                  >
                    ⚡ Seleccionar {currentActivity?.group === 'siervos' ? 'Siervos' : 'Jotapece'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSelectAllActive}
                  >
                    ⚡ Todos los activos
                  </button>
                  {totalSelectedCount > 0 && (
                    <button
                      type="button"
                      className="btn-link-clear"
                      onClick={handleClearSelection}
                    >
                      ✕ Deseleccionar todos
                    </button>
                  )}
                </div>

                <div className="selected-count-badge">
                  <strong>{totalSelectedCount}</strong> {totalSelectedCount === 1 ? 'servidor seleccionado' : 'servidores seleccionados'}
                </div>
              </div>

              {/* Filtros y buscador */}
              <div className="server-search-filter-row">
                <div className="server-search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    value={serverSearch}
                    onChange={e => setServerSearch(e.target.value)}
                    placeholder="Buscar por nombre, apodo o rol..."
                    className="form-input search-input"
                  />
                  {serverSearch && (
                    <button 
                      type="button" 
                      onClick={() => setServerSearch('')} 
                      className="btn-clear-search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="server-group-pills">
                  <button
                    type="button"
                    className={`pill-btn ${serverFilterGroup === 'all' ? 'active' : ''}`}
                    onClick={() => setServerFilterGroup('all')}
                  >
                    Todos ({sortedRegistered.length})
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${serverFilterGroup === 'jotapece' ? 'active' : ''}`}
                    onClick={() => setServerFilterGroup('jotapece')}
                  >
                    Jotapece
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${serverFilterGroup === 'siervos' ? 'active' : ''}`}
                    onClick={() => setServerFilterGroup('siervos')}
                  >
                    Siervos
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${serverFilterGroup === 'selected' ? 'active' : ''}`}
                    onClick={() => setServerFilterGroup('selected')}
                  >
                    Seleccionados ({selectedServerIds.size})
                  </button>
                </div>
              </div>

              {/* Cuadrícula de Servidores Seleccionables */}
              <div className="selectable-servers-grid">
                {filteredServers.length > 0 ? (
                  filteredServers.map(s => {
                    const isSelected = selectedServerIds.has(s.id);
                    return (
                      <div
                        key={s.id}
                        className={`selectable-server-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleServerSelection(s.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Manejado por onClick de la tarjeta
                          className="server-checkbox"
                        />
                        <div className="server-avatar-circle">
                          {s.name?.charAt(0) || 'S'}
                        </div>
                        <div className="server-card-info">
                          <strong className="server-card-name">
                            {s.name} {s.nickname ? `(${s.nickname})` : ''}
                          </strong>
                          <span className="server-card-role">{s.role || 'Servidor'}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-servers-found">
                    <p>No se encontraron servidores con ese criterio de búsqueda.</p>
                  </div>
                )}
              </div>

              {/* Agregar servidor invitado o no registrado */}
              <div className="guest-server-add-box">
                <form onSubmit={handleAddGuestServer} className="guest-form-row">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                    ➕ ¿Hay algún servidor invitado o no registrado?
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                    <input
                      type="text"
                      value={guestInput}
                      onChange={e => setGuestInput(e.target.value)}
                      placeholder="Escribe el nombre del servidor invitado..."
                      className="form-input"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-secondary btn-sm"
                      disabled={!guestInput.trim()}
                    >
                      <Plus size={15} />
                      <span>Agregar</span>
                    </button>
                  </div>
                </form>

                {customGuestServers.length > 0 && (
                  <div className="guest-chips-list">
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Invitados añadidos:</span>
                    {customGuestServers.map((name, idx) => (
                      <span key={idx} className="guest-server-chip">
                        👤 {name}
                        <button
                          type="button"
                          onClick={() => handleRemoveGuestServer(name)}
                          title="Quitar invitado"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================
              PASO 2: PEGAR Y PROCESAR EL PROGRAMA
          ==================================================== */}
          {step === 2 && (
            <>
              {/* Resumen del paso 1 */}
              <div className="step-summary-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className="summary-check-icon">✓</span>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>
                      {totalSelectedCount} servidores confirmados para este servicio
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b' }}>
                      El importador cruzará los nombres del texto contra este equipo.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-link-edit-servers"
                  onClick={() => setStep(1)}
                >
                  ✏️ Modificar servidores
                </button>
              </div>

              <div className="smart-importer-input-box">
                <div className="smart-importer-label-row">
                  <label htmlFor="smart-import-text" className="smart-importer-label">
                    Pega aquí el contenido del programa:
                  </label>
                  {rawText && (
                    <button 
                      type="button" 
                      className="btn-link-clear"
                      onClick={() => {
                        setRawText('');
                        setParsedResult(null);
                      }}
                    >
                      ✕ Limpiar texto
                    </button>
                  )}
                </div>

                <textarea
                  id="smart-import-text"
                  className="form-textarea smart-importer-textarea"
                  rows={8}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={`Ejemplo de texto que puedes pegar:

5:45pm: Llegada de Youngers: probar la diapositiva y repasar el programa.
6:45pm: Bienvenida @all y toma de asistencia. @Alba Génesis...
7:00pm rompehielo - @Michael Ovalles
7:30pm - alabanzas - @Jonathan Chez @Kevin Valdez
7:45pm: Introduccion y oracion: @Angel Josue
7:50pm - Predica: Justificacion @Samuel Luciano

Backstage
1. Letra de canciones y diapositiva @Noelia Peralta
2. Story (videos y fotos) @Lhía Ogando
3. Desmontaje y dejar todo limpio @Oscar De Los Santos`}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.65rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleParse}
                    disabled={!rawText.trim()}
                  >
                    <Sparkles size={16} />
                    <span>Interpretar Programa</span>
                  </button>
                </div>
              </div>

              {/* Resultados del análisis */}
              {parsedResult && (
                <div className="smart-importer-results-box">
                  <div className="results-status-banner">
                    <div className="status-icon-badge">✓</div>
                    <div>
                      <strong>¡Análisis completado!</strong>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        Revisa los datos interpretados y selecciona qué deseas aplicar a esta actividad:
                      </p>
                    </div>
                  </div>

                  {/* ALERTA: Servidores o Cargos no encontrados actualmente en el sistema */}
                  {((parsedResult.unregisteredServers && parsedResult.unregisteredServers.length > 0) || 
                    (parsedResult.unregisteredRoles && parsedResult.unregisteredRoles.length > 0)) && (
                    <div className="unregistered-alert-box">
                      <div className="unregistered-alert-header">
                        <div className="unregistered-alert-title-wrap">
                          <AlertTriangle size={22} className="alert-icon-warning" />
                          <div>
                            <h4 className="unregistered-alert-title">
                              Elementos no encontrados en el sistema
                            </h4>
                            <p className="unregistered-alert-desc">
                              Detectamos personas o cargos en el texto que no están actualmente registrados. Puedes crearlos en el sistema ahora mismo o usarlos de manera temporal solo para esta actividad.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Subsección 1: Servidores / Personas no registradas */}
                      {parsedResult.unregisteredServers && parsedResult.unregisteredServers.length > 0 && (
                        <div className="unregistered-group-section">
                          <div className="unregistered-group-header">
                            <span className="unregistered-group-title">
                              👤 Personas no registradas ({parsedResult.unregisteredServers.length}):
                            </span>
                            <div className="unregistered-bulk-actions">
                              <button
                                type="button"
                                className="btn-action-bulk create"
                                onClick={handleRegisterAllServersPermanently}
                                title="Crear todas estas personas en el directorio de servidores"
                              >
                                ⚡ Crear todos en el sistema
                              </button>
                              <button
                                type="button"
                                className="btn-action-bulk temp"
                                onClick={handleSetAllServersTemporary}
                                title="Usar todas estas personas de forma temporal en esta actividad"
                              >
                                ⏳ Todos temporales
                              </button>
                            </div>
                          </div>

                          <div className="unregistered-items-list">
                            {parsedResult.unregisteredServers.map((unreg, uIdx) => {
                              const decisionKey = `srv_${unreg.name.toLowerCase()}`;
                              const decision = unregisteredDecisions[decisionKey];
                              const isCreated = decision === 'created' || decision?.type === 'created';
                              const isTemporary = decision === 'temporary' || decision?.type === 'temporary';
                              const isAssociated = decision?.type === 'associated';
                              const isAssociating = associatingServer === unreg.name;

                              return (
                                <div key={uIdx} className={`unregistered-item-card ${decision ? 'decided' : ''} ${isAssociating ? 'associating' : ''}`}>
                                  <div className="unregistered-item-main-row">
                                    <div className="unregistered-item-info">
                                      <strong className="unregistered-name">👤 {unreg.name}</strong>
                                      <span className="unregistered-meta">
                                        Rol sugerido: <em>{unreg.suggestedRole}</em> · {unreg.detectedIn}
                                      </span>
                                    </div>

                                    <div className="unregistered-item-actions">
                                      {isAssociated ? (
                                        <div className="decision-status-badge associated">
                                          <span>🔗 Asociado con: <strong>{decision.serverName}</strong></span>
                                          <button
                                            type="button"
                                            className="btn-link-undo"
                                            onClick={() => handleUndoDecision(unreg.name)}
                                            title="Cambiar o deshacer asociación"
                                          >
                                            ✕ Cambiar
                                          </button>
                                        </div>
                                      ) : isCreated ? (
                                        <div className="decision-status-badge created">
                                          <span>✓ Creado en el Sistema</span>
                                          <button
                                            type="button"
                                            className="btn-link-undo"
                                            onClick={() => handleUndoDecision(unreg.name)}
                                            title="Deshacer creación"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : isTemporary ? (
                                        <div className="decision-status-badge temporary">
                                          <span>⏳ Temporal para esta actividad</span>
                                          <button
                                            type="button"
                                            className="btn-link-undo"
                                            onClick={() => handleUndoDecision(unreg.name)}
                                            title="Deshacer"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="unregistered-buttons-group">
                                          <button
                                            type="button"
                                            className={`btn btn-sm btn-associate-system ${isAssociating ? 'active' : ''}`}
                                            onClick={() => handleStartAssociateServer(unreg.name)}
                                            title="Asociar este nombre con un servidor que ya está registrado en el sistema"
                                          >
                                            🔗 Asociar a Existente
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-create-system"
                                            onClick={() => handleRegisterServerPermanently(unreg)}
                                            title="Registrar permanentemente en el Directorio de Servidores"
                                          >
                                            💾 Crear en el Sistema
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-temp-system"
                                            onClick={() => handleSetServerTemporary(unreg)}
                                            title="Solo usar en esta actividad sin guardar en el directorio"
                                          >
                                            ⏳ Usar Temporal
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Panel desplegable para asociar con un servidor del sistema */}
                                  {isAssociating && !decision && (
                                    <div className="associate-server-inline-panel">
                                      <div className="associate-picker-header">
                                        <span>Selecciona a qué servidor registrado corresponde <strong>"{unreg.name}"</strong>:</span>
                                      </div>
                                      <div className="associate-picker-controls">
                                        <select
                                          className="form-select associate-select"
                                          value={selectedAssociateId[unreg.name] || ''}
                                          onChange={e => setSelectedAssociateId(prev => ({ ...prev, [unreg.name]: e.target.value }))}
                                        >
                                          <option value="">-- Elige un servidor del sistema ({sortedRegistered.length}) --</option>
                                          {confirmedAttendingServers.length > 0 && (
                                            <optgroup label="⭐ Servidores en esta actividad">
                                              {confirmedAttendingServers.map(s => (
                                                <option key={`att-${s.id}`} value={s.id}>
                                                  ⭐ {s.name} ({s.role || 'Servidor'})
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}
                                          <optgroup label="👥 Directorio Completo de Servidores">
                                            {sortedRegistered.map(s => (
                                              <option key={`reg-${s.id}`} value={s.id}>
                                                {s.name} {s.nickname ? `(${s.nickname})` : ''} · {s.role || 'Servidor'}
                                              </option>
                                            ))}
                                          </optgroup>
                                        </select>
                                        <div className="associate-picker-btns">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            disabled={!selectedAssociateId[unreg.name]}
                                            onClick={() => handleConfirmAssociateServer(unreg, selectedAssociateId[unreg.name])}
                                          >
                                            <Check size={14} /> Vincular
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => setAssociatingServer(null)}
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Subsección 2: Roles / Cargos no registrados en el catálogo */}
                      {parsedResult.unregisteredRoles && parsedResult.unregisteredRoles.length > 0 && (
                        <div className="unregistered-group-section" style={{ marginTop: '0.85rem' }}>
                          <div className="unregistered-group-header">
                            <span className="unregistered-group-title">
                              🏷️ Roles / Cargos no registrados ({parsedResult.unregisteredRoles.length}):
                            </span>
                            <div className="unregistered-bulk-actions">
                              <button
                                type="button"
                                className="btn-action-bulk create"
                                onClick={handleRegisterAllRolesPermanently}
                                title="Agregar todos estos roles al catálogo oficial"
                              >
                                ⚡ Agregar todos al catálogo
                              </button>
                              <button
                                type="button"
                                className="btn-action-bulk temp"
                                onClick={handleSetAllRolesTemporary}
                                title="Usar todos como cargos temporales solo para este servicio"
                              >
                                ⏳ Todos temporales
                              </button>
                            </div>
                          </div>

                          <div className="unregistered-items-list">
                            {parsedResult.unregisteredRoles.map((unreg, uIdx) => {
                              const decision = unregisteredDecisions[`role_${unreg.role.toLowerCase()}`];
                              return (
                                <div key={uIdx} className={`unregistered-item-card ${decision ? 'decided' : ''}`}>
                                  <div className="unregistered-item-info">
                                    <strong className="unregistered-name">🏷️ {unreg.role}</strong>
                                    <span className="unregistered-meta">
                                      Función descrita: {unreg.defaultDuties}
                                    </span>
                                  </div>

                                  <div className="unregistered-item-actions">
                                    {decision === 'created' ? (
                                      <span className="decision-status-badge created">
                                        ✓ Agregado al Catálogo
                                      </span>
                                    ) : decision === 'temporary' ? (
                                      <span className="decision-status-badge temporary">
                                        ⏳ Rol temporal para este servicio
                                      </span>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-create-system"
                                          onClick={() => handleRegisterRolePermanently(unreg)}
                                          title="Agregar permanentemente al Catálogo de Roles"
                                        >
                                          💾 Agregar al Catálogo
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-temp-system"
                                          onClick={() => handleSetRoleTemporary(unreg)}
                                          title="Usar solo en esta actividad sin alterar el catálogo oficial"
                                        >
                                          ⏳ Usar Temporal
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkboxes de opciones para aplicar */}
                  <div className="import-options-grid">
                    <label className={`import-option-card ${options.applySteps ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={options.applySteps}
                        onChange={e => setOptions({ ...options, applySteps: e.target.checked })}
                      />
                      <div>
                        <strong>Programa Minuto a Minuto</strong>
                        <span className="option-desc">
                          {parsedResult.programSteps?.length || 0} bloques detectados con hora y encargados.
                        </span>
                      </div>
                    </label>

                    <label className={`import-option-card ${options.applySchedules ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={options.applySchedules}
                        onChange={e => setOptions({ ...options, applySchedules: e.target.checked })}
                      />
                      <div>
                        <strong>Horarios de Logística</strong>
                        <span className="option-desc">
                          Montaje: {parsedResult.suggestedSchedules?.prepTime || 'N/A'} · Culto: {parsedResult.suggestedSchedules?.activityTime || 'N/A'}
                        </span>
                      </div>
                    </label>

                    {parsedResult.detectedPreacher && (
                      <label className={`import-option-card ${options.applyPreacher ? 'active' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={options.applyPreacher}
                          onChange={e => setOptions({ ...options, applyPreacher: e.target.checked })}
                        />
                        <div>
                          <strong>Asignar Predicador</strong>
                          <span className="option-desc">
                            Predicador detectado: <strong>{parsedResult.detectedPreacher}</strong>
                          </span>
                        </div>
                      </label>
                    )}

                    {parsedResult.serverAssignments && parsedResult.serverAssignments.length > 0 && (
                      <label className={`import-option-card ${options.applyServers ? 'active' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={options.applyServers}
                          onChange={e => setOptions({ ...options, applyServers: e.target.checked })}
                        />
                        <div>
                          <strong>Servidores y Responsabilidades</strong>
                          <span className="option-desc">
                            {parsedResult.serverAssignments.length} asignaciones totales registradas para este servicio.
                          </span>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Vista Previa de Bloques */}
                  {options.applySteps && parsedResult.programSteps?.length > 0 && (
                    <div className="preview-steps-section">
                      <h5 className="preview-heading">Vista Previa de Bloques a Cargar:</h5>
                      <div className="preview-steps-list">
                        {parsedResult.programSteps.map((stepItem, idx) => (
                          <div key={idx} className="preview-step-row">
                            <span className="preview-step-time">⏱️ {stepItem.time}</span>
                            <div className="preview-step-main">
                              <strong className="preview-step-title">{stepItem.title}</strong>
                              {stepItem.description && (
                                <span className="preview-step-desc">{stepItem.description}</span>
                              )}
                            </div>
                            <span className="preview-step-resp">👤 {stepItem.responsible}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vista Previa de Servidores */}
                  {options.applyServers && parsedResult.serverAssignments?.length > 0 && (
                    <div className="preview-steps-section" style={{ marginTop: '0.85rem' }}>
                      <h5 className="preview-heading">Equipo de Servidores Asignados ({parsedResult.serverAssignments.length}):</h5>
                      <div className="preview-servers-list">
                        {parsedResult.serverAssignments.map((asg, idx) => (
                          <div key={idx} className="preview-server-row">
                            <span className="preview-server-role">{asg.role}</span>
                            <strong className="preview-server-name">👤 {asg.serverName}</strong>
                            <span className="preview-server-duty">{asg.duties}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="smart-importer-footer">
          {step === 1 ? (
            <>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleProceedToProgramStep}
                disabled={totalSelectedCount === 0}
              >
                <span>Siguiente: Importar Programa ➔</span>
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} />
                <span>Volver a Servidores</span>
              </button>

              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleApplyToService}
                disabled={!hasAnyDetected}
                title={hasAnyDetected ? "Aplicar los datos analizados a la actividad actual" : "Primero interpreta un texto con programa"}
              >
                <Check size={16} />
                <span>Aplicar al Servicio</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
