import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, MapPin, Check, X, RefreshCw,
  Lock, Unlock, Key, AlertCircle, ArrowLeft, Calendar,
  ChevronLeft, ChevronRight, Search, LayoutGrid, List
} from './Icons';
import UnsavedChangesModal from './UnsavedChangesModal';
import {
  GROUPS_CATALOG,
  LOCATIONS_CATALOG,
  STANDARD_SCHEDULES,
  PROGRAM_BLOCKS_CATALOG,
  DEFAULT_SERVER_ROLES,
  DEFAULT_PROGRAM_HOURS,
  loadStoredRoles,
  saveStoredRoles,
  loadStoredHours,
  saveStoredHours,
  parseDateComponents,
  buildDateStr
} from '../data/catalogs';
import {
  getGoogleScriptUrl,
  saveGoogleScriptUrl,
  fetchFromGoogleSheets,
  syncToGoogleSheets
} from '../services/googleSheetsService';

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
  lockedMessage,
  onUpdateLockedMessage,
  onLogoutAdmin,
  onRequireAuth,
  onToggleActivityLock
}) {
  const [editingActivity, setEditingActivity] = useState(activityToEdit || null);
  const [isCreating, setIsCreating] = useState(false);
  const [announcementsText, setAnnouncementsText] = useState(announcements.join('\n'));
  const [announcementsSaved, setAnnouncementsSaved] = useState(false);
  const [localLockedMessage, setLocalLockedMessage] = useState(lockedMessage || '');
  const [lockMessageSaved, setLockMessageSaved] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [googleScriptUrl, setGoogleScriptUrl] = useState(() => getGoogleScriptUrl());
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState(null);

  // Custom text lists / catalogs state
  const [rolesCatalog, setRolesCatalog] = useState(() => loadStoredRoles());
  const [hoursCatalog, setHoursCatalog] = useState(() => loadStoredHours());
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDuties, setNewRoleDuties] = useState('');
  const [newHourValue, setNewHourValue] = useState('');
  const [activeCatalogTab, setActiveCatalogTab] = useState('roles'); // 'roles' | 'hours'
  const [isManualPreacher, setIsManualPreacher] = useState(false);

  // Servidores ordenados alfabéticamente (A-Z) para selección de predicador y asignaciones
  const sortedServers = useMemo(() => {
    return [...(servers || [])].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
    );
  }, [servers]);

  // Si la actividad a editar tiene un predicador que no está en la lista de servidores, activar modo manual automáticamente
  useEffect(() => {
    if (editingActivity?.preacher && editingActivity.preacher.trim() !== '') {
      const isRegistered = (servers || []).some(
        s => s.name?.trim().toLowerCase() === editingActivity.preacher.trim().toLowerCase()
      );
      if (!isRegistered) {
        setIsManualPreacher(true);
      } else {
        setIsManualPreacher(false);
      }
    } else {
      setIsManualPreacher(false);
    }
  }, [editingActivity?.id]);

  const lockedActivitiesCount = activities.filter(a => a.isProgramLocked).length;

  // Activities Table View & Pagination
  const [pageSize, setPageSize] = useState('5'); // '5' | '10' | '15' | '20' | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'jotapece' | 'siervos' | 'ambos'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Roles Catalog View & Pagination
  const [rolesPageSize, setRolesPageSize] = useState('5'); // '5' | '10' | '15' | 'all'
  const [rolesCurrentPage, setRolesCurrentPage] = useState(1);

  // Filtered & paginated activities for admin table
  const filteredActivities = useMemo(() => {
    return (activities || []).filter(act => {
      if (groupFilter !== 'all' && act.group !== groupFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (act.title || '').toLowerCase().includes(q);
        const preacherMatch = (act.preacher || '').toLowerCase().includes(q);
        const locMatch = (act.customLocationName || act.location || '').toLowerCase().includes(q);
        const dateMatch = `${act.dayOfWeek || ''} ${act.dayNumber || ''} ${act.month || ''}`.toLowerCase().includes(q);
        if (!titleMatch && !preacherMatch && !locMatch && !dateMatch) return false;
      }
      return true;
    });
  }, [activities, groupFilter, searchQuery]);

  const isPaged = pageSize !== 'all';
  const numericLimit = parseInt(pageSize, 10) || 5;
  const totalItems = filteredActivities.length;
  const totalPages = isPaged ? Math.max(1, Math.ceil(totalItems / numericLimit)) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = isPaged ? (safeCurrentPage - 1) * numericLimit : 0;
  const endIndex = isPaged ? Math.min(startIndex + numericLimit, totalItems) : totalItems;

  const displayedActivities = useMemo(() => {
    if (!isPaged) return filteredActivities;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, isPaged, startIndex, endIndex]);

  // Paginated roles for catalog card
  const isRolesPaged = rolesPageSize !== 'all';
  const rolesNumericLimit = parseInt(rolesPageSize, 10) || 5;
  const totalRolesItems = (rolesCatalog || []).length;
  const totalRolesPages = isRolesPaged ? Math.max(1, Math.ceil(totalRolesItems / rolesNumericLimit)) : 1;
  const safeRolesCurrentPage = Math.min(Math.max(1, rolesCurrentPage), Math.max(1, totalRolesPages));
  const rolesStartIndex = isRolesPaged ? (safeRolesCurrentPage - 1) * rolesNumericLimit : 0;
  const rolesEndIndex = isRolesPaged ? Math.min(rolesStartIndex + rolesNumericLimit, totalRolesItems) : totalRolesItems;

  const displayedRoles = useMemo(() => {
    if (!isRolesPaged) return rolesCatalog;
    return (rolesCatalog || []).slice(rolesStartIndex, rolesEndIndex);
  }, [rolesCatalog, isRolesPaged, rolesStartIndex, rolesEndIndex]);

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
  const addServerRole = (preferredServerId = null) => {
    const selectedServer = preferredServerId 
      ? servers.find(s => s.id === preferredServerId) 
      : (servers[0] || { id: 'srv-1', name: 'Joel Guzmán' });
    const firstRole = rolesCatalog[0] || { role: 'Coordinador del Servicio', duties: 'Coordinar la logística del culto.' };
    setEditingActivity({
      ...editingActivity,
      serverAssignments: [
        ...(editingActivity.serverAssignments || []),
        { 
          role: firstRole.role, 
          serverId: selectedServer ? selectedServer.id : 'srv-1', 
          serverName: selectedServer ? selectedServer.name : 'Joel Guzmán', 
          status: 'Confirmado', 
          duties: firstRole.duties 
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
        if (field === 'role') {
          const matchedRole = rolesCatalog.find(r => r.role === value);
          return {
            ...asg,
            role: value,
            // Autocompleta automáticamente la descripción del rol seleccionado
            duties: matchedRole ? matchedRole.duties : asg.duties
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

  // Handlers for Managing Custom Text Catalogs (Roles and Hours)
  const handleAddNewRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const updated = [
      ...rolesCatalog,
      {
        role: newRoleName.trim(),
        duties: newRoleDuties.trim() || 'Responsabilidad asignada para esta actividad.'
      }
    ];
    setRolesCatalog(updated);
    saveStoredRoles(updated);
    setNewRoleName('');
    setNewRoleDuties('');
  };

  const handleRemoveRole = (roleNameToRemove) => {
    if (confirm(`¿Eliminar el rol "${roleNameToRemove}" del catálogo de opciones?`)) {
      const updated = rolesCatalog.filter(r => r.role !== roleNameToRemove);
      setRolesCatalog(updated);
      saveStoredRoles(updated);
    }
  };

  const handleAddNewHour = (e) => {
    e.preventDefault();
    if (!newHourValue.trim()) return;
    const formatted = newHourValue.trim();
    if (hoursCatalog.includes(formatted)) {
      alert('Esta hora ya existe en la lista.');
      return;
    }
    const updated = [...hoursCatalog, formatted];
    setHoursCatalog(updated);
    saveStoredHours(updated);
    setNewHourValue('');
  };

  const handleRemoveHour = (hourToRemove) => {
    const updated = hoursCatalog.filter(h => h !== hourToRemove);
    setHoursCatalog(updated);
    saveStoredHours(updated);
  };

  // Helper: Actualiza la fecha unificada calculando día de semana, día, mes y año
  const handleDateChange = (dateVal) => {
    const parsed = parseDateComponents(dateVal);
    if (parsed) {
      setEditingActivity({
        ...editingActivity,
        fullDate: parsed.fullDate,
        dayOfWeek: parsed.dayOfWeek,
        dayNumber: parsed.dayNumber,
        month: parsed.month,
        year: parsed.year
      });
    } else {
      setEditingActivity({ ...editingActivity, fullDate: dateVal });
    }
  };

  // Helper: Selecciona el lugar de la lista registrada (el tipo de ubicación queda implícito)
  const handleLocationChange = (locationId) => {
    const locItem = LOCATIONS_CATALOG.find(l => l.id === locationId);
    if (!locItem) return;

    if (locItem.id === 'fuera') {
      setEditingActivity({
        ...editingActivity,
        locationType: 'fuera',
        isCustomLocation: true,
        location: editingActivity.customLocationName || 'Fuera de ICC'
      });
    } else {
      setEditingActivity({
        ...editingActivity,
        locationType: locItem.locationType,
        isCustomLocation: false,
        location: locItem.name
      });
    }
  };

  // Helper: Aplica horarios estándar por grupo
  const applyStandardSchedule = (group) => {
    const sched = STANDARD_SCHEDULES[group] || STANDARD_SCHEDULES.jotapece;
    setEditingActivity({
      ...editingActivity,
      prepTime: sched.prepTime,
      prepStart: sched.prepStart,
      prepEnd: sched.prepEnd,
      activityTime: sched.activityTime,
      actStart: sched.actStart,
      actEnd: sched.actEnd,
      teardownTime: sched.teardownTime
    });
  };

  // Helper: Aplica plantilla predefinida de bloque al programa con descripción sugerida
  const applyBlockTemplate = (stepIndex, blockTitle) => {
    const template = PROGRAM_BLOCKS_CATALOG.find(b => b.title === blockTitle);
    if (!template) return;
    const updated = editingActivity.program.map((step, idx) => {
      if (idx === stepIndex) {
        return {
          ...step,
          title: template.title,
          description: template.description,
          time: (!step.time || step.time === '7:00 pm') ? template.defaultTime : step.time,
          responsible: (!step.responsible || step.responsible === 'Por designar') ? template.defaultResp : step.responsible
        };
      }
      return step;
    });
    setEditingActivity({ ...editingActivity, program: updated });
  };

  const handleDeleteActivity = (act) => {
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
  };

  // Google Sheets Handlers
  const handleSaveSheetsUrl = () => {
    saveGoogleScriptUrl(googleScriptUrl);
    setSheetsSyncStatus({ type: 'success', message: 'URL del Script de Google Sheets guardada correctamente.' });
    setTimeout(() => setSheetsSyncStatus(null), 3500);
  };

  const handleTestFetchSheets = async () => {
    if (!googleScriptUrl.trim()) {
      alert('Por favor introduce la URL del Google Apps Script primero.');
      return;
    }
    setIsSyncingSheets(true);
    setSheetsSyncStatus(null);
    try {
      const data = await fetchFromGoogleSheets();
      setSheetsSyncStatus({ 
        type: 'success', 
        message: `Conexión exitosa. Se verificó acceso a Google Sheets (${data.activities?.length || 0} actividades, ${data.servers?.length || 0} servidores).` 
      });
    } catch (err) {
      setSheetsSyncStatus({ type: 'error', message: `Error al conectar: ${err.message}` });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!googleScriptUrl.trim()) {
      alert('Por favor introduce la URL del Google Apps Script primero.');
      return;
    }
    setIsSyncingSheets(true);
    setSheetsSyncStatus(null);
    try {
      await syncToGoogleSheets(activities, servers);
      setSheetsSyncStatus({ 
        type: 'success', 
        message: '¡Datos enviados exitosamente a Google Sheets! Tus hojas han sido actualizadas.' 
      });
    } catch (err) {
      setSheetsSyncStatus({ type: 'error', message: `Error al sincronizar: ${err.message}` });
    } finally {
      setIsSyncingSheets(false);
    }
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
      <div className={`admin-lock-control-card ${lockedActivitiesCount > 0 ? 'is-locked-state' : 'is-unlocked-state'}`}>
        <div className="lock-control-top">
          <div className="lock-status-indicator-col">
            <div className="lock-icon-badge-round">
              {lockedActivitiesCount > 0 ? <Lock size={22} /> : <Unlock size={22} />}
            </div>
            <div>
              <div className="lock-title-row">
                <h3 className="lock-card-title">Control de Acceso al Programa (Por Actividad)</h3>
                <span className={`lock-status-pill ${lockedActivitiesCount > 0 ? 'pill-locked' : 'pill-active'}`}>
                  {lockedActivitiesCount > 0 
                    ? `${lockedActivitiesCount} de ${activities.length} BLOQUEADAS` 
                    : 'TODAS PÚBLICAS'}
                </span>
              </div>
              <p className="lock-card-desc">
                El bloqueo del programa se gestiona <strong>por actividad</strong>. Puedes bloquear o desbloquear cualquier servicio individualmente desde la tabla inferior o abriendo el detalle de la actividad. Los visitantes verán el mensaje de preparación en las fechas bloqueadas y solo podrán consultar los servidores.
              </p>
            </div>
          </div>

          <div className="lock-action-col">
            <span className={`activities-lock-count-pill ${lockedActivitiesCount > 0 ? 'has-locked' : 'all-open'}`}>
              {lockedActivitiesCount > 0 ? `${lockedActivitiesCount} Bloqueada(s)` : 'Todo Público'}
            </span>
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
                    onChange={e => {
                      const newGroup = e.target.value;
                      setEditingActivity({ ...editingActivity, group: newGroup });
                    }}
                    className="form-select"
                  >
                    {GROUPS_CATALOG.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group preacher-manager-group">
                  <div className="preacher-header-flex">
                    <label className="preacher-label">
                      <span>Predicador / Encargado</span>
                    </label>
                    <div className="preacher-mode-pills">
                      <button 
                        type="button" 
                        className={`preacher-pill-btn ${!isManualPreacher ? 'active' : ''}`}
                        onClick={() => setIsManualPreacher(false)}
                        title="Seleccionar de los servidores registrados en orden alfabético A-Z"
                      >
                        👥 Lista A-Z
                      </button>
                      <button 
                        type="button" 
                        className={`preacher-pill-btn ${isManualPreacher ? 'active' : ''}`}
                        onClick={() => setIsManualPreacher(true)}
                        title="Escribir nombre de predicador invitado o no registrado"
                      >
                        ✍️ Escribir Invitado
                      </button>
                    </div>
                  </div>

                  {!isManualPreacher ? (
                    <div className="preacher-select-container">
                      <select
                        value={
                          sortedServers.some(s => s.name?.trim().toLowerCase() === (editingActivity.preacher || '').trim().toLowerCase())
                            ? editingActivity.preacher
                            : ((editingActivity.preacher && editingActivity.preacher.trim() !== '') ? '__custom__' : '')
                        }
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsManualPreacher(true);
                          } else {
                            setEditingActivity({ ...editingActivity, preacher: val });
                          }
                        }}
                        className="form-select preacher-dropdown"
                      >
                        <option value="">-- Seleccionar servidor de la lista (A-Z) --</option>
                        <option value="__custom__">➕ Escribir nombre de predicador invitado...</option>
                        <optgroup label="Servidores Registrados (A-Z)">
                          {sortedServers.map(s => (
                            <option key={s.id} value={s.name}>
                              {s.name} {s.nickname ? `(${s.nickname})` : ''} {s.role ? `— ${s.role}` : ''}
                            </option>
                          ))}
                        </optgroup>
                        {editingActivity.preacher && !sortedServers.some(s => s.name?.trim().toLowerCase() === editingActivity.preacher.trim().toLowerCase()) && (
                          <optgroup label="Invitado actual">
                            <option value="__custom__">⭐ {editingActivity.preacher} (No registrado)</option>
                          </optgroup>
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="preacher-custom-box">
                      <div className="preacher-custom-input-row">
                        <span className="preacher-input-icon">🎙️</span>
                        <input 
                          type="text" 
                          value={editingActivity.preacher || ''}
                          onChange={e => setEditingActivity({ ...editingActivity, preacher: e.target.value })}
                          placeholder="Escribe el nombre del predicador invitado (Ej: Pastor Juan Pérez)..."
                          className="form-input preacher-text-input"
                          autoFocus
                        />
                        {editingActivity.preacher && (
                          <button
                            type="button"
                            onClick={() => setEditingActivity({ ...editingActivity, preacher: '' })}
                            className="preacher-text-clear-btn"
                            title="Borrar nombre"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="preacher-custom-hint">
                        <span>Ingresa aquí el nombre de pastores o predicadores invitados que no están registrados como servidores.</span>
                        <button 
                          type="button" 
                          className="btn-link-preacher"
                          onClick={() => setIsManualPreacher(false)}
                        >
                          ← Elegir de la lista A-Z
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resumen visual y confirmación del predicador seleccionado */}
                  {editingActivity.preacher && editingActivity.preacher.trim() !== '' && (
                    <div className="preacher-active-badge">
                      <div className="preacher-badge-content">
                        <span className="preacher-badge-status-icon">✓</span>
                        <div className="preacher-badge-texts">
                          <span className="preacher-badge-category">
                            {sortedServers.some(s => s.name?.trim().toLowerCase() === editingActivity.preacher.trim().toLowerCase()) 
                              ? 'Servidor Registrado' 
                              : 'Predicador Invitado / No Registrado'}
                          </span>
                          <strong className="preacher-badge-name">{editingActivity.preacher}</strong>
                        </div>
                      </div>
                      <div className="preacher-badge-actions">
                        <button
                          type="button"
                          onClick={() => setEditingActivity({ ...editingActivity, preacher: '' })}
                          className="preacher-badge-btn-remove"
                          title="Quitar predicador"
                        >
                          ✕ Quitar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fecha del Servicio Unificada (Día de semana, día, mes y año) */}
                <div className="form-group">
                  <label>Fecha de la Actividad (Calendario)</label>
                  <input 
                    type="date" 
                    value={editingActivity.fullDate || buildDateStr(editingActivity.year, editingActivity.month, editingActivity.dayNumber)}
                    onChange={e => handleDateChange(e.target.value)}
                    className="form-input"
                  />
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Calculado:</span>
                    <strong style={{ background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {editingActivity.dayOfWeek || 'Sáb'} {editingActivity.dayNumber || '1'} {editingActivity.month || 'oct'} {editingActivity.year || '2026'}
                    </strong>
                  </div>
                </div>

                {/* Lugar de la Actividad (Catálogo de Lugares Registrados - Tipo implícito) */}
                <div className="form-group">
                  <label>Lugar Registrado de la Actividad</label>
                  <select 
                    value={editingActivity.isCustomLocation ? 'fuera' : (editingActivity.locationType || 'multiusos')}
                    onChange={e => handleLocationChange(e.target.value)}
                    className="form-select"
                  >
                    {LOCATIONS_CATALOG.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    {LOCATIONS_CATALOG.find(l => l.id === (editingActivity.isCustomLocation ? 'fuera' : editingActivity.locationType))?.description}
                  </span>
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

                {/* Control de Bloqueo de Acceso al Programa de esta Actividad */}
                <div className="form-group full-width activity-lock-toggle-box">
                  <label className="checkbox-label-styled">
                    <input 
                      type="checkbox"
                      checked={Boolean(editingActivity.isProgramLocked)}
                      onChange={e => setEditingActivity({ 
                        ...editingActivity, 
                        isProgramLocked: e.target.checked 
                      })}
                    />
                    <span className="checkbox-text-bold">
                      🔒 Bloquear acceso al programa minuto a minuto de esta actividad (En preparación)
                    </span>
                  </label>
                  <p className="field-hint" style={{ marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Si se bloquea, los visitantes verán el mensaje de preparación en esta actividad específica y solo podrán consultar los servidores asignados.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Schedules */}
            <div className="form-section-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <h4 className="section-title" style={{ margin: 0 }}>2. Horarios de Logística</h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => applyStandardSchedule(editingActivity.group)}
                  title="Cargar los horarios habituales de montaje, culto y desmontaje para este grupo"
                >
                  ⚡ Cargar Horario Habitual ({editingActivity.group === 'jotapece' ? 'Jotapece' : editingActivity.group === 'siervos' ? 'Siervos' : 'Ambos'})
                </button>
              </div>
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
                  <p className="section-desc">Selecciona bloques predefinidos de la lista o escribe actividades personalizadas con su descripción.</p>
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
                    {/* Atajo: Selección de bloque predefinido */}
                    <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Plantilla de bloque:</span>
                      <select 
                        value="" 
                        onChange={e => {
                          if (e.target.value) {
                            applyBlockTemplate(idx, e.target.value);
                          }
                        }}
                        className="form-select"
                        style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', width: 'auto', maxWidth: '300px' }}
                      >
                        <option value="">⚡ Cargar de lista de bloques...</option>
                        {PROGRAM_BLOCKS_CATALOG.map((b, bIdx) => (
                          <option key={bIdx} value={b.title}>{b.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="step-edit-row">
                      <div className="step-field time-field">
                        <label>Hora</label>
                        <div className="time-select-combo">
                          <input 
                            type="text" 
                            list="program-hours-catalog-list"
                            value={step.time}
                            onChange={e => updateProgramStep(idx, 'time', e.target.value)}
                            placeholder="Ej. 7:00 pm"
                            className="form-input"
                          />
                          <select 
                            value="" 
                            onChange={e => {
                              if (e.target.value) {
                                updateProgramStep(idx, 'time', e.target.value);
                              }
                            }}
                            className="form-select time-picker-dropdown"
                            title="Seleccionar hora de la lista registrada"
                          >
                            <option value="">⏱️ Lista...</option>
                            {hoursCatalog.map((h, hIdx) => (
                              <option key={hIdx} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
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
                        placeholder="Instrucciones específicas (suministrada o manual)..."
                        className="form-input"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Datalist global para horas del programa */}
              <datalist id="program-hours-catalog-list">
                {hoursCatalog.map((h, hIdx) => (
                  <option key={hIdx} value={h} />
                ))}
              </datalist>
            </div>

            {/* Section 4: Server Roles & Assigned Persons */}
            <div className="form-section-box">
              <div className="section-header-flex">
                <div>
                  <h4 className="section-title">4. Servidores y Responsabilidades Asignadas</h4>
                  <p className="section-desc">
                    Selecciona el rol de la lista para cargar su descripción automáticamente. Un servidor puede tener más de un rol asignado.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => addServerRole()}
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
                        <label>Rol / Puesto (Seleccionar de Lista)</label>
                        <select 
                          value={asg.role}
                          onChange={e => updateServerRole(idx, 'role', e.target.value)}
                          className="form-select role-select-input"
                        >
                          <option value="">-- Selecciona un Rol --</option>
                          {rolesCatalog.map((r, rIdx) => (
                            <option key={rIdx} value={r.role}>{r.role}</option>
                          ))}
                        </select>
                      </div>

                      <div className="role-field">
                        <label>Servidor Asignado</label>
                        <select 
                          value={asg.serverId}
                          onChange={e => updateServerRole(idx, 'serverId', e.target.value)}
                          className="form-select"
                        >
                          {sortedServers.map(s => (
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
                        title="Quitar esta asignación de rol"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="role-extra-actions-row">
                      {(() => {
                        const count = (editingActivity.serverAssignments || []).filter(item => item.serverId === asg.serverId).length;
                        return count > 1 ? (
                          <span className="server-multi-badge">
                            ⭐ Este servidor tiene {count} roles asignados
                          </span>
                        ) : null;
                      })()}
                      <button 
                        type="button" 
                        className="btn-add-secondary-role"
                        onClick={() => addServerRole(asg.serverId)}
                        title="Asignar un rol adicional a este mismo servidor en esta actividad"
                      >
                        <Plus size={13} />
                        <span>+ Asignar otro rol a {asg.serverName?.split(' ')[0] || 'este servidor'}</span>
                      </button>
                    </div>

                    <div className="role-field full-field">
                      <div className="duties-label-row">
                        <label>Responsabilidad / Descripción del Rol:</label>
                        <span className="duties-auto-hint">Auto-cargada del catálogo de roles (editable)</span>
                      </div>
                      <input 
                        type="text" 
                        value={asg.duties || ''}
                        onChange={e => updateServerRole(idx, 'duties', e.target.value)}
                        placeholder="Descripción específica de lo que debe realizar..."
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
          <div className="admin-table-title-col">
            <h3 className="sub-heading">Registro de Actividades Activas ({filteredActivities.length})</h3>
            <p className="admin-table-subtitle">
              Administra, edita o bloquea el programa de cada actividad registrada.
            </p>
          </div>

          <div className="admin-table-controls-flex">
            {/* View Mode Toggle: Tarjetas vs Tabla */}
            <div className="admin-view-toggle-group" title="Modo de visualización de actividades">
              <button
                type="button"
                className={`admin-view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Vista en Tarjetas (Ideal para celular y pantallas táctiles)"
              >
                <LayoutGrid size={15} />
                <span>Tarjetas</span>
              </button>
              <button
                type="button"
                className={`admin-view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Vista en Tabla"
              >
                <List size={15} />
                <span>Tabla</span>
              </button>
            </div>

            {/* Limit selector */}
            <div className="page-limit-selector" title="Cantidad de actividades a mostrar">
              <span className="limit-selector-label">Ver:</span>
              <div className="limit-pills-group">
                {['5', '10', '15', '20', 'all'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`limit-pill-btn ${pageSize === opt ? 'active' : ''}`}
                    onClick={() => {
                      setPageSize(opt);
                      setCurrentPage(1);
                    }}
                    title={opt === 'all' ? 'Ver todas las actividades' : `Ver ${opt} actividades por página`}
                  >
                    {opt === 'all' ? 'Todas' : opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Group Filter */}
            <div className="admin-filter-chips">
              <button
                type="button"
                className={`admin-filter-chip ${groupFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setGroupFilter('all');
                  setCurrentPage(1);
                }}
              >
                Todas
              </button>
              <button
                type="button"
                className={`admin-filter-chip chip-jpc ${groupFilter === 'jotapece' ? 'active' : ''}`}
                onClick={() => {
                  setGroupFilter('jotapece');
                  setCurrentPage(1);
                }}
              >
                Jotapece
              </button>
              <button
                type="button"
                className={`admin-filter-chip chip-siervos ${groupFilter === 'siervos' ? 'active' : ''}`}
                onClick={() => {
                  setGroupFilter('siervos');
                  setCurrentPage(1);
                }}
              >
                Siervos
              </button>
            </div>

            {/* Search */}
            <div className="search-input-wrapper admin-search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por actividad, predicador, lugar..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Activities Display: Cards (Mobile friendly default) vs Table */}
        {viewMode === 'cards' ? (
          <div className="admin-activities-cards-list">
            {displayedActivities.length === 0 ? (
              <div className="empty-state-box">
                <p>No se encontraron actividades con los filtros seleccionados.</p>
              </div>
            ) : (
              displayedActivities.map(act => {
                const isJpc = act.group === 'jotapece';
                const isSiervos = act.group === 'siervos';
                let groupBorderClass = 'border-ambos';
                if (isJpc) groupBorderClass = 'border-jpc';
                if (isSiervos) groupBorderClass = 'border-siervos';

                return (
                  <div
                    key={act.id}
                    className={`admin-activity-card combined-activity-card ${groupBorderClass}`}
                    onClick={() => handleStartEdit(act)}
                    role="button"
                    tabIndex={0}
                    title="Haz clic para entrar y editar esta actividad"
                  >
                    <div className="admin-card-main-content">
                      <div className="combined-main-col">
                        <div className="date-badge-box">
                          <span className="date-dow">{act.dayOfWeek}</span>
                          <span className="date-num">{act.dayNumber}</span>
                          <span className="date-month">{act.month}</span>
                        </div>

                        <div className="combined-content">
                          <div className="admin-card-header-line">
                            <h3 className="combined-title">{act.title}</h3>
                            <span className={`group-pill-sm ${isJpc ? 'pill-jpc' : isSiervos ? 'pill-siervos' : 'pill-ambos'}`}>
                              {isJpc ? 'Jotapece' : isSiervos ? 'Siervos' : 'Ambos'}
                            </span>
                          </div>

                          {act.preacher && act.preacher !== 'Sin predicación' && (
                            <div className="combined-preacher-row">
                              <span className="label">Mensaje:</span>
                              <strong className="name">{act.preacher}</strong>
                            </div>
                          )}

                          <div className="combined-tags-row">
                            <span className={`location-pill-sm tag-${act.locationType}`}>
                              {act.customLocationName || act.location}
                            </span>
                            {(act.isCustomLocation || act.locationType === 'fuera') && (
                              <span className="fuera-badge-indicator" title={act.customLocationAddress || 'Ubicación fuera de lo establecido'}>
                                📍 Fuera de lo establecido
                              </span>
                            )}
                            <span className="admin-stat-tag">
                              📋 {act.program?.length || 0} pasos
                            </span>
                            <span className="admin-stat-tag">
                              👥 {act.serverAssignments?.length || 0} servidores
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom action row for easy click/tap on mobile */}
                    <div className="admin-card-actions-bar" onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button"
                        className={`btn-table-lock-toggle ${act.isProgramLocked ? 'is-locked' : 'is-unlocked'}`}
                        onClick={() => onToggleActivityLock && onToggleActivityLock(act.id)}
                        title={act.isProgramLocked ? "El programa de esta fecha está bloqueado para visitantes. Haz clic para desbloquearlo." : "El programa de esta fecha es público. Haz clic para bloquearlo."}
                      >
                        {act.isProgramLocked ? <Lock size={13} /> : <Unlock size={13} />}
                        <span>{act.isProgramLocked ? 'Bloqueado' : 'Público'}</span>
                      </button>

                      <div className="admin-card-btns-group">
                        <button 
                          type="button"
                          className="btn-table-action btn-edit-card"
                          onClick={() => handleStartEdit(act)}
                          title="Entrar y modificar actividad"
                        >
                          <Edit3 size={15} />
                          <span>Editar</span>
                        </button>
                        <button 
                          type="button"
                          className="btn-table-action btn-danger"
                          onClick={() => handleDeleteActivity(act)}
                          title="Eliminar actividad"
                        >
                          <Trash2 size={15} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
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
                  <th>Programa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayedActivities.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No se encontraron actividades con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  displayedActivities.map(act => (
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
                        <button 
                          type="button"
                          className={`btn-table-lock-toggle ${act.isProgramLocked ? 'is-locked' : 'is-unlocked'}`}
                          onClick={() => onToggleActivityLock && onToggleActivityLock(act.id)}
                          title={act.isProgramLocked ? "El programa de esta fecha está bloqueado para visitantes. Haz clic para desbloquearlo." : "El programa de esta fecha es público. Haz clic para bloquearlo."}
                        >
                          {act.isProgramLocked ? <Lock size={13} /> : <Unlock size={13} />}
                          <span>{act.isProgramLocked ? 'Bloqueado' : 'Público'}</span>
                        </button>
                      </td>
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
                            onClick={() => handleDeleteActivity(act)}
                            title="Eliminar actividad"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {isPaged && totalPages > 1 && (
          <div className="pagination-bar admin-pagination-bar">
            <div className="pagination-info">
              Mostrando <strong>{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</strong> de <strong>{totalItems}</strong> actividades
            </div>
            <div className="pagination-nav">
              <button
                type="button"
                className="btn-page-nav"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Página anterior"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`page-num-btn ${pageNum === safeCurrentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-page-nav"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Página siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {(!isPaged || totalPages <= 1) && totalItems > 0 && (
          <div className="pagination-bar pagination-all-summary admin-pagination-bar">
            <span className="pagination-info">
              Mostrando todas las <strong>{totalItems}</strong> actividades en pantalla
            </span>
          </div>
        )}
      </div>

      {/* Text Lists & Custom Catalogs Manager (Positioned immediately below activities table) */}
      <div className="admin-catalogs-card">
        <div className="catalogs-card-header">
          <div>
            <h3 className="sub-heading">Gestor de Listas y Catálogos de Textos</h3>
            <p className="desc">
              Personaliza y agrega los roles con sus descripciones (para que al asignar un servidor solo tengas que seleccionar el rol y se complete su responsabilidad) y las horas disponibles para el programa.
            </p>
          </div>
          <div className="catalogs-tab-switch">
            <button
              type="button"
              className={`btn-tab-switch ${activeCatalogTab === 'roles' ? 'active' : ''}`}
              onClick={() => setActiveCatalogTab('roles')}
            >
              Roles y Descripciones ({rolesCatalog.length})
            </button>
            <button
              type="button"
              className={`btn-tab-switch ${activeCatalogTab === 'hours' ? 'active' : ''}`}
              onClick={() => setActiveCatalogTab('hours')}
            >
              Horas del Programa ({hoursCatalog.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Roles and Duties */}
        {activeCatalogTab === 'roles' && (
          <div className="catalog-tab-content">
            <form onSubmit={handleAddNewRole} className="catalog-add-form">
              <div className="add-role-grid">
                <div className="form-group">
                  <label>Nombre del Nuevo Rol *</label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    placeholder="Ej. Líder de Oración en Altar"
                    className="form-input"
                  />
                </div>
                <div className="form-group flex-2">
                  <label>Descripción / Responsabilidad del Rol *</label>
                  <input
                    type="text"
                    required
                    value={newRoleDuties}
                    onChange={e => setNewRoleDuties(e.target.value)}
                    placeholder="Ej. Ministrar y orar por los jóvenes al llamado final..."
                    className="form-input"
                  />
                </div>
                <div className="form-group btn-col">
                  <button type="submit" className="btn btn-primary btn-add-catalog">
                    <Plus size={16} />
                    <span>Agregar Rol</span>
                  </button>
                </div>
              </div>
            </form>

            <div className="catalog-items-list">
              <div className="catalog-items-count-header roles-header-flex">
                <span>Roles disponibles en la lista de asignación ({rolesCatalog.length}):</span>
                <div className="page-limit-selector roles-limit-selector" title="Cantidad de roles a visualizar">
                  <span className="limit-selector-label">Ver:</span>
                  <div className="limit-pills-group">
                    {['5', '10', '15', 'all'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`limit-pill-btn ${rolesPageSize === opt ? 'active' : ''}`}
                        onClick={() => {
                          setRolesPageSize(opt);
                          setRolesCurrentPage(1);
                        }}
                      >
                        {opt === 'all' ? 'Todos' : opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="roles-grid-cards">
                {displayedRoles.map((r, rIdx) => (
                  <div key={rIdx} className="role-catalog-item-card">
                    <div className="role-item-top">
                      <strong className="role-item-name">{r.role}</strong>
                      <button
                        type="button"
                        className="btn-delete-catalog-item"
                        onClick={() => handleRemoveRole(r.role)}
                        title="Eliminar este rol de la lista"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="role-item-duties">{r.duties}</p>
                  </div>
                ))}
              </div>

              {isRolesPaged && totalRolesPages > 1 && (
                <div className="pagination-bar roles-pagination-bar" style={{ marginTop: '1rem', padding: '0.75rem 1rem' }}>
                  <div className="pagination-info" style={{ fontSize: '0.82rem' }}>
                    Mostrando <strong>{totalRolesItems > 0 ? rolesStartIndex + 1 : 0}–{rolesEndIndex}</strong> de <strong>{totalRolesItems}</strong> roles
                  </div>
                  <div className="pagination-nav">
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={safeRolesCurrentPage <= 1}
                      onClick={() => setRolesCurrentPage(p => Math.max(1, p - 1))}
                      title="Página anterior"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="pagination-numbers">
                      {Array.from({ length: totalRolesPages }, (_, i) => i + 1).map(pNum => (
                        <button
                          key={pNum}
                          type="button"
                          className={`page-num-btn ${pNum === safeRolesCurrentPage ? 'active' : ''}`}
                          style={{ minWidth: '30px', height: '30px', fontSize: '0.82rem' }}
                          onClick={() => setRolesCurrentPage(pNum)}
                        >
                          {pNum}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={safeRolesCurrentPage >= totalRolesPages}
                      onClick={() => setRolesCurrentPage(p => Math.min(totalRolesPages, p + 1))}
                      title="Página siguiente"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Program Hours */}
        {activeCatalogTab === 'hours' && (
          <div className="catalog-tab-content">
            <form onSubmit={handleAddNewHour} className="catalog-add-form">
              <div className="add-hour-flex">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#475569' }}>
                    Nueva Hora a Registrar:
                  </label>
                  <input
                    type="text"
                    required
                    value={newHourValue}
                    onChange={e => setNewHourValue(e.target.value)}
                    placeholder="Ej. 6:40 pm"
                    className="form-input hour-input-field"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-add-catalog" style={{ alignSelf: 'flex-end' }}>
                  <Plus size={16} />
                  <span>Agregar Hora a la Lista</span>
                </button>
              </div>
            </form>

            <div className="catalog-items-list">
              <div className="catalog-items-count-header">
                <span>Horas disponibles para seleccionar en los bloques ({hoursCatalog.length}):</span>
              </div>
              <div className="hours-chips-wrap">
                {hoursCatalog.map((h, hIdx) => (
                  <div key={hIdx} className="hour-chip">
                    <span>{h}</span>
                    <button
                      type="button"
                      className="btn-remove-chip"
                      onClick={() => handleRemoveHour(h)}
                      title="Eliminar hora"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google Sheets Integration Card */}
      <div className="admin-sheets-sync-card">
        <div className="sheets-card-header">
          <div className="sheets-icon-badge">
            <RefreshCw size={22} className={isSyncingSheets ? 'spin-anim' : ''} />
          </div>
          <div>
            <h3 className="sub-heading" style={{ margin: 0 }}>Sincronización con Google Sheets (Google Apps Script)</h3>
            <p className="desc" style={{ margin: '0.25rem 0 0' }}>
              Almacena y respalda todas las actividades, servidores, catálogo de bloques y ubicaciones en una hoja de cálculo vinculada mediante Google Apps Script.
            </p>
          </div>
        </div>

        <div className="sheets-input-section">
          <label className="sheets-input-label">URL de la Aplicación Web (Google Apps Script):</label>
          <div className="sheets-url-row">
            <input 
              type="url"
              className="form-input sheets-url-input"
              value={googleScriptUrl}
              onChange={e => setGoogleScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleSaveSheetsUrl}
            >
              <Check size={16} />
              <span>Guardar URL</span>
            </button>
          </div>
        </div>

        <div className="sheets-actions-bar">
          <div className="sheets-btns-group">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleTestFetchSheets}
              disabled={isSyncingSheets}
            >
              <RefreshCw size={15} className={isSyncingSheets ? 'spin-anim' : ''} />
              <span>{isSyncingSheets ? 'Conectando...' : 'Probar Conexión'}</span>
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSyncToSheets}
              disabled={isSyncingSheets}
            >
              <Check size={16} />
              <span>{isSyncingSheets ? 'Sincronizando...' : 'Enviar Datos a Google Sheets'}</span>
            </button>
          </div>

          {sheetsSyncStatus && (
            <div className={`sheets-status-badge ${sheetsSyncStatus.type === 'error' ? 'status-error' : 'status-success'}`}>
              {sheetsSyncStatus.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
              <span>{sheetsSyncStatus.message}</span>
            </div>
          )}
        </div>

        <div className="sheets-help-tip">
          ℹ️ <strong>Estructura automática:</strong> El script incluido en <code>google-apps-script/Code.gs</code> configura automáticamente las 6 pestañas requeridas (<em>Actividades, Programas, Servidores, Lugares, BloquesCatalogo, Configuracion</em>).
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
