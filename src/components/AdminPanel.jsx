import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, MapPin, Check, X,
  Lock, Unlock, Key, AlertCircle, ArrowLeft, Calendar,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, LayoutGrid, List,
  CloudUpload, RefreshCw, Sparkles, Copy, Minimize2, Maximize2, MessageSquare, Eye, EyeOff
} from './Icons';
import UnsavedChangesModal from './UnsavedChangesModal';
import SmartProgramImporterModal from './SmartProgramImporterModal';
import ActivityObservationsSection from './ActivityObservationsSection';
import {
  GROUPS_CATALOG,
  LOCATIONS_CATALOG,
  STANDARD_SCHEDULES,
  PROGRAM_BLOCKS_CATALOG,
  DEFAULT_SERVER_ROLES,
  DEFAULT_PROGRAM_HOURS,
  PREP_TIME_OPTIONS,
  ACTIVITY_TIME_OPTIONS,
  TEARDOWN_TIME_OPTIONS,
  loadStoredRoles,
  saveStoredRoles,
  loadStoredHours,
  saveStoredHours,
  loadStoredServiceAreas,
  saveStoredServiceAreas,
  parseDateComponents,
  buildDateStr
} from '../data/catalogs';
import {
  saveStoredActivities,
  saveStoredServers,
  saveStoredAnnouncements,
  saveStoredLockedMessage,
  saveStoredProgramLocked
} from '../data/initialData';

export default function AdminPanel({ 
  activities, 
  servers, 
  onAddServer,
  announcements,
  rolesCatalog: propRolesCatalog,
  hoursCatalog: propHoursCatalog,
  serviceAreasCatalog: propServiceAreasCatalog,
  onUpdateRolesCatalog,
  onUpdateHoursCatalog,
  onUpdateServiceAreasCatalog,
  onCascadeRenameRole,
  onCascadeRenameArea,
  onSaveActivity, 
  onDeleteActivity,
  onUpdateAnnouncements,
  activityToEdit,
  clearActivityToEdit,
  lockedMessage,
  onUpdateLockedMessage,
  onLogoutAdmin,
  onRequireAuth,
  onToggleActivityLock,
  onToggleActivityVisibility,
  onSyncToSheets
}) {
  const [editingActivity, setEditingActivity] = useState(activityToEdit || null);
  const [isCreating, setIsCreating] = useState(false);
  const [announcementsText, setAnnouncementsText] = useState(announcements.join('\n'));
  const [announcementsSaved, setAnnouncementsSaved] = useState(false);
  const [localLockedMessage, setLocalLockedMessage] = useState(lockedMessage || '');
  const [lockMessageSaved, setLockMessageSaved] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Custom text lists / catalogs state (synchronized with Sheets & local fallback)
  const [rolesCatalog, setRolesCatalog] = useState(() => (propRolesCatalog && propRolesCatalog.length > 0) ? propRolesCatalog : loadStoredRoles());
  const [hoursCatalog, setHoursCatalog] = useState(() => (propHoursCatalog && propHoursCatalog.length > 0) ? propHoursCatalog : loadStoredHours());
  const [serviceAreasCatalog, setServiceAreasCatalog] = useState(() => (propServiceAreasCatalog && propServiceAreasCatalog.length > 0) ? propServiceAreasCatalog : loadStoredServiceAreas());

  useEffect(() => {
    if (propRolesCatalog && propRolesCatalog.length > 0) setRolesCatalog(propRolesCatalog);
  }, [propRolesCatalog]);
  useEffect(() => {
    if (propHoursCatalog && propHoursCatalog.length > 0) setHoursCatalog(propHoursCatalog);
  }, [propHoursCatalog]);
  useEffect(() => {
    if (propServiceAreasCatalog && propServiceAreasCatalog.length > 0) setServiceAreasCatalog(propServiceAreasCatalog);
  }, [propServiceAreasCatalog]);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDuties, setNewRoleDuties] = useState('');
  const [newHourValue, setNewHourValue] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDescription, setNewAreaDescription] = useState('');

  // Inline editing states for modifying existing items in catalogs
  const [editingRoleItem, setEditingRoleItem] = useState(null); // { originalRole, role, duties }
  const [editingHourItem, setEditingHourItem] = useState(null); // { originalHour, value }
  const [editingAreaItem, setEditingAreaItem] = useState(null); // { originalName, name, description }

  const [activeCatalogTab, setActiveCatalogTab] = useState('roles'); // 'roles' | 'hours' | 'areas'
  const [isManualPreacher, setIsManualPreacher] = useState(false);

  // Servidores ordenados alfabéticamente (A-Z) para selección de predicador y asignaciones
  const sortedServers = useMemo(() => {
    return [...(servers || [])].sort((a, b) => 
      (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
    );
  }, [servers]);

  // Servidores reconocidos o asignados específicamente a esta actividad para selección rápida de responsables
  const recognizedActivityServers = useMemo(() => {
    const list = [];
    const seen = new Set();
    
    // 1. Asignaciones de la actividad actual
    (editingActivity?.serverAssignments || []).forEach(asg => {
      const name = asg.serverName?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({
          id: asg.serverId || '',
          name,
          role: asg.role || 'Servidor'
        });
      }
    });

    // 2. Predicador asignado si no estaba en la lista
    if (editingActivity?.preacher && !seen.has(editingActivity.preacher.trim().toLowerCase())) {
      const pName = editingActivity.preacher.trim();
      seen.add(pName.toLowerCase());
      list.push({
        id: '',
        name: pName,
        role: 'Predicador'
      });
    }

    return list;
  }, [editingActivity?.serverAssignments, editingActivity?.preacher]);

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
  const hiddenActivitiesCount = (activities || []).filter(a => a.isHidden).length;
  const visibleActivitiesCount = (activities || []).length - hiddenActivitiesCount;

  // Activities Table View & Pagination
  const PAGE_SIZE_OPTIONS = ['2', '3', '5', '10', '15', '20', 'all'];
  const [pageSize, setPageSize] = useState(() => {
    try {
      return localStorage.getItem('youngers_admin_pagesize') || '5';
    } catch (e) {
      return '5';
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'jotapece' | 'siervos' | 'ambos'
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'visible' | 'hidden'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Compact / Compressed view mode for activities
  const [isCompactView, setIsCompactView] = useState(() => {
    try {
      return localStorage.getItem('youngers_admin_compact_view') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [expandedCardIds, setExpandedCardIds] = useState(new Set());

  // Collapsible sections for Activity Editor Modal
  const [collapsedSections, setCollapsedSections] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  });

  const handlePageSizeChange = (opt) => {
    setPageSize(opt);
    setCurrentPage(1);
    try {
      localStorage.setItem('youngers_admin_pagesize', opt);
    } catch (e) {}
  };

  const handleToggleCompactView = () => {
    setIsCompactView(prev => {
      const next = !prev;
      try {
        localStorage.setItem('youngers_admin_compact_view', String(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleCardExpansion = (actId, e) => {
    if (e) e.stopPropagation();
    setExpandedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(actId)) {
        next.delete(actId);
      } else {
        next.add(actId);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (expandedCardIds.size === displayedActivities.length) {
      setExpandedCardIds(new Set());
    } else {
      setExpandedCardIds(new Set(displayedActivities.map(a => a.id)));
    }
  };

  const toggleEditorSection = (secNum) => {
    setCollapsedSections(prev => ({
      ...prev,
      [secNum]: !prev[secNum]
    }));
  };

  const handleToggleAllEditorSections = () => {
    const allCollapsed = Object.values(collapsedSections).every(Boolean);
    setCollapsedSections({
      1: !allCollapsed,
      2: !allCollapsed,
      3: !allCollapsed,
      4: !allCollapsed,
      5: !allCollapsed
    });
  };

  // Roles Catalog View & Pagination
  const [rolesPageSize, setRolesPageSize] = useState('5'); // '5' | '10' | '15' | 'all'
  const [rolesCurrentPage, setRolesCurrentPage] = useState(1);

  // Filtered & paginated activities for admin table
  const filteredActivities = useMemo(() => {
    return (activities || []).filter(act => {
      if (groupFilter !== 'all' && act.group !== groupFilter) return false;
      if (visibilityFilter === 'visible' && act.isHidden) return false;
      if (visibilityFilter === 'hidden' && !act.isHidden) return false;
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
  }, [activities, groupFilter, visibilityFilter, searchQuery]);

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

  // Paginated service areas for catalog card
  const [areasPageSize, setAreasPageSize] = useState('5'); // '5' | '10' | '15' | 'all'
  const [areasCurrentPage, setAreasCurrentPage] = useState(1);

  const isAreasPaged = areasPageSize !== 'all';
  const areasNumericLimit = parseInt(areasPageSize, 10) || 5;
  const totalAreasItems = (serviceAreasCatalog || []).length;
  const totalAreasPages = isAreasPaged ? Math.max(1, Math.ceil(totalAreasItems / areasNumericLimit)) : 1;
  const safeAreasCurrentPage = Math.min(Math.max(1, areasCurrentPage), Math.max(1, totalAreasPages));
  const areasStartIndex = isAreasPaged ? (safeAreasCurrentPage - 1) * areasNumericLimit : 0;
  const areasEndIndex = isAreasPaged ? Math.min(areasStartIndex + areasNumericLimit, totalAreasItems) : totalAreasItems;

  const displayedAreas = useMemo(() => {
    if (!isAreasPaged) return serviceAreasCatalog;
    return (serviceAreasCatalog || []).slice(areasStartIndex, areasEndIndex);
  }, [serviceAreasCatalog, isAreasPaged, areasStartIndex, areasEndIndex]);

  const initialActivityRef = useRef(activityToEdit || null);
  const overlayMouseDownRef = useRef(false);
  const [showSmartImporter, setShowSmartImporter] = useState(false);

  const isDirty = Boolean(
    editingActivity && 
    initialActivityRef.current && 
    JSON.stringify(editingActivity) !== JSON.stringify(initialActivityRef.current)
  );

  // Aplica los datos estructurados por el Importador Inteligente
  const handleApplySmartImport = ({ programSteps, schedules, preacher, serverAssignments }) => {
    if (!editingActivity) return;

    const updated = { ...editingActivity };

    if (programSteps && programSteps.length > 0) {
      updated.program = programSteps;
    }

    if (schedules) {
      if (schedules.prepTime) updated.prepTime = schedules.prepTime;
      if (schedules.activityTime) updated.activityTime = schedules.activityTime;
      if (schedules.teardownTime) updated.teardownTime = schedules.teardownTime;
    }

    if (preacher) {
      updated.preacher = preacher;
    }

    if (serverAssignments && serverAssignments.length > 0) {
      const existing = updated.serverAssignments || [];
      updated.serverAssignments = [...existing, ...serverAssignments];
    }

    setEditingActivity(updated);
  };

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
        { role: 'Coordinador de Culto', serverId: servers?.find(s => s.name?.includes('Joel'))?.id || '', serverName: servers?.find(s => s.name?.includes('Joel'))?.name || '', status: 'Confirmado', duties: 'Supervisar programa y tiempos.' },
        { role: 'Predicador', serverId: servers?.find(s => s.name?.includes('Samuel'))?.id || '', serverName: servers?.find(s => s.name?.includes('Samuel'))?.name || '', status: 'Confirmado', duties: 'Exposición de las Sagradas Escrituras.' },
        { role: 'Alabanza', serverId: servers?.find(s => s.name?.includes('Paola'))?.id || '', serverName: servers?.find(s => s.name?.includes('Paola'))?.name || '', status: 'Confirmado', duties: 'Dirección musical y ensayo puntual.' },
        { role: 'Sonido y Audio', serverId: servers?.find(s => s.name?.includes('Marcos'))?.id || '', serverName: servers?.find(s => s.name?.includes('Marcos'))?.name || '', status: 'Confirmado', duties: 'Consola, micrófonos y ecualización.' },
        { role: 'Multimedia y Proyección', serverId: servers?.find(s => s.name?.includes('Andrea'))?.id || '', serverName: servers?.find(s => s.name?.includes('Andrea'))?.name || '', status: 'Confirmado', duties: 'Letras, versículos y visuales.' },
        { role: 'Recepción y Bienvenida', serverId: servers?.find(s => s.name?.includes('Laura'))?.id || '', serverName: servers?.find(s => s.name?.includes('Laura'))?.name || '', status: 'Confirmado', duties: 'Mesa de bienvenida y registro.' }
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
    if (Array.isArray(cloned.serverAssignments)) {
      cloned.serverAssignments = cloned.serverAssignments.map(asg => {
        if (asg.serverName) {
          const match = (servers || []).find(s => s.id === asg.serverId || s.name?.trim().toLowerCase() === asg.serverName?.trim().toLowerCase());
          if (match) {
            return { ...asg, serverId: match.id, serverName: match.name };
          }
        }
        return asg;
      });
    }
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

  const moveProgramStep = (index, direction) => {
    const list = [...(editingActivity?.program || [])];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setEditingActivity({ ...editingActivity, program: list });
  };

  const duplicateProgramStep = (index) => {
    const list = [...(editingActivity?.program || [])];
    const stepToClone = list[index];
    if (!stepToClone) return;
    const cloned = { ...stepToClone, title: `${stepToClone.title} (Copia)` };
    list.splice(index + 1, 0, cloned);
    setEditingActivity({ ...editingActivity, program: list });
  };

  const handleSelectStepResponsible = (stepIdx, chosenName) => {
    const current = editingActivity?.program[stepIdx]?.responsible || '';
    if (!current || current === 'Por designar') {
      updateProgramStep(stepIdx, 'responsible', chosenName);
    } else {
      const parts = current.split(',').map(p => p.trim());
      if (!parts.includes(chosenName)) {
        updateProgramStep(stepIdx, 'responsible', `${current}, ${chosenName}`);
      }
    }
  };

  const handleToggleStepResponsibleChip = (stepIdx, serverName) => {
    const current = editingActivity?.program[stepIdx]?.responsible || '';
    if (!current || current === 'Por designar') {
      updateProgramStep(stepIdx, 'responsible', serverName);
      return;
    }
    let parts = current.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.some(p => p.toLowerCase() === serverName.toLowerCase())) {
      parts = parts.filter(p => p.toLowerCase() !== serverName.toLowerCase());
      updateProgramStep(stepIdx, 'responsible', parts.length > 0 ? parts.join(', ') : 'Por designar');
    } else {
      parts.push(serverName);
      updateProgramStep(stepIdx, 'responsible', parts.join(', '));
    }
  };

  const handleSaveNewRoleDirect = (roleName, roleDuties) => {
    const trimmed = (roleName || '').trim();
    if (!trimmed) return;
    if (rolesCatalog.some(r => r.role?.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [
      ...rolesCatalog,
      {
        role: trimmed,
        duties: (roleDuties || '').trim() || 'Responsabilidad y función ministerial personalizada.'
      }
    ];
    setRolesCatalog(updated);
    saveStoredRoles(updated);
    if (onUpdateRolesCatalog) onUpdateRolesCatalog(updated);
  };

  // Helpers to manipulate server assignments in form
  const addServerRole = (preferredServerId = null) => {
    const selectedServer = preferredServerId 
      ? servers.find(s => s.id === preferredServerId) 
      : null;
    const firstRole = rolesCatalog[0] || { role: 'Coordinador del Servicio', duties: 'Coordinar la logística del culto.' };
    setEditingActivity({
      ...editingActivity,
      serverAssignments: [
        ...(editingActivity.serverAssignments || []),
        { 
          role: firstRole.role, 
          serverId: selectedServer ? selectedServer.id : '', 
          serverName: selectedServer ? selectedServer.name : '', 
          status: 'Confirmado', 
          duties: firstRole.duties 
        }
      ]
    });
  };

  const updateServerRole = (index, field, value) => {
    const updated = (editingActivity.serverAssignments || []).map((asg, idx) => {
      if (idx === index) {
        if (field === 'serverId') {
          const selected = servers.find(s => s.id === value);
          return { 
            ...asg, 
            serverId: value, 
            serverName: selected ? selected.name : '' 
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

  // Handlers for Managing Custom Text Catalogs (Roles, Hours and Service Areas)
  const handleAddNewRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const trimmed = newRoleName.trim();
    if (rolesCatalog.some(r => r.role?.toLowerCase() === trimmed.toLowerCase())) {
      alert('Ya existe un rol con este nombre.');
      return;
    }
    const updated = [
      ...rolesCatalog,
      {
        role: trimmed,
        duties: newRoleDuties.trim() || 'Responsabilidad asignada para esta actividad.'
      }
    ];
    setRolesCatalog(updated);
    saveStoredRoles(updated);
    if (onUpdateRolesCatalog) onUpdateRolesCatalog(updated);
    setNewRoleName('');
    setNewRoleDuties('');
  };

  const handleStartEditRole = (r) => {
    setEditingRoleItem({
      originalRole: r.role,
      role: r.role,
      duties: r.duties || ''
    });
  };

  const handleSaveEditRole = () => {
    if (!editingRoleItem || !editingRoleItem.role.trim()) return;
    const newName = editingRoleItem.role.trim();
    const oldName = editingRoleItem.originalRole;
    if (newName.toLowerCase() !== oldName.toLowerCase() && rolesCatalog.some(r => r.role?.toLowerCase() === newName.toLowerCase())) {
      alert('Ya existe otro rol con este nombre.');
      return;
    }
    const updated = rolesCatalog.map(r => {
      if (r.role === oldName) {
        return {
          role: newName,
          duties: editingRoleItem.duties.trim() || 'Responsabilidad asignada para esta actividad.'
        };
      }
      return r;
    });
    setRolesCatalog(updated);
    saveStoredRoles(updated);
    if (onUpdateRolesCatalog) onUpdateRolesCatalog(updated);
    if (oldName !== newName && onCascadeRenameRole) {
      onCascadeRenameRole(oldName, newName);
    }
    setEditingRoleItem(null);
  };

  const handleRemoveRole = (roleNameToRemove) => {
    if (confirm(`¿Eliminar el rol "${roleNameToRemove}" del catálogo de opciones?`)) {
      const updated = rolesCatalog.filter(r => r.role !== roleNameToRemove);
      setRolesCatalog(updated);
      saveStoredRoles(updated);
      if (onUpdateRolesCatalog) onUpdateRolesCatalog(updated);
      if (editingRoleItem?.originalRole === roleNameToRemove) {
        setEditingRoleItem(null);
      }
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
    if (onUpdateHoursCatalog) onUpdateHoursCatalog(updated);
    setNewHourValue('');
  };

  const handleStartEditHour = (hour) => {
    setEditingHourItem({
      originalHour: hour,
      value: hour
    });
  };

  const handleSaveEditHour = () => {
    if (!editingHourItem || !editingHourItem.value.trim()) return;
    const newValue = editingHourItem.value.trim();
    const oldValue = editingHourItem.originalHour;
    if (newValue.toLowerCase() !== oldValue.toLowerCase() && hoursCatalog.some(h => h.toLowerCase() === newValue.toLowerCase())) {
      alert('Ya existe esta hora en la lista.');
      return;
    }
    const updated = hoursCatalog.map(h => h === oldValue ? newValue : h);
    setHoursCatalog(updated);
    saveStoredHours(updated);
    if (onUpdateHoursCatalog) onUpdateHoursCatalog(updated);
    setEditingHourItem(null);
  };

  const handleRemoveHour = (hourToRemove) => {
    const updated = hoursCatalog.filter(h => h !== hourToRemove);
    setHoursCatalog(updated);
    saveStoredHours(updated);
    if (onUpdateHoursCatalog) onUpdateHoursCatalog(updated);
    if (editingHourItem?.originalHour === hourToRemove) {
      setEditingHourItem(null);
    }
  };

  // Handlers for Service Areas Catalog
  const handleAddNewArea = (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    const trimmed = newAreaName.trim();
    if (serviceAreasCatalog.some(a => (typeof a === 'string' ? a : a.name).toLowerCase() === trimmed.toLowerCase())) {
      alert('Ya existe un área de servicio con este nombre.');
      return;
    }
    const updated = [
      ...serviceAreasCatalog,
      {
        name: trimmed,
        description: newAreaDescription.trim() || 'Área de servicio ministerial'
      }
    ];
    setServiceAreasCatalog(updated);
    saveStoredServiceAreas(updated);
    if (onUpdateServiceAreasCatalog) onUpdateServiceAreasCatalog(updated);
    setNewAreaName('');
    setNewAreaDescription('');
  };

  const handleStartEditArea = (areaObj) => {
    const name = typeof areaObj === 'string' ? areaObj : areaObj.name;
    const desc = typeof areaObj === 'string' ? '' : (areaObj.description || '');
    setEditingAreaItem({
      originalName: name,
      name: name,
      description: desc
    });
  };

  const handleSaveEditArea = () => {
    if (!editingAreaItem || !editingAreaItem.name.trim()) return;
    const newName = editingAreaItem.name.trim();
    const oldName = editingAreaItem.originalName;
    if (newName.toLowerCase() !== oldName.toLowerCase() && serviceAreasCatalog.some(a => (typeof a === 'string' ? a : a.name).toLowerCase() === newName.toLowerCase())) {
      alert('Ya existe otra área de servicio con este nombre.');
      return;
    }
    const updated = serviceAreasCatalog.map(a => {
      const currentName = typeof a === 'string' ? a : a.name;
      if (currentName === oldName) {
        return {
          name: newName,
          description: editingAreaItem.description.trim() || 'Área de servicio ministerial'
        };
      }
      return typeof a === 'string' ? { name: a, description: '' } : a;
    });
    setServiceAreasCatalog(updated);
    saveStoredServiceAreas(updated);
    if (onUpdateServiceAreasCatalog) onUpdateServiceAreasCatalog(updated);
    if (oldName !== newName && onCascadeRenameArea) {
      onCascadeRenameArea(oldName, newName);
    }
    setEditingAreaItem(null);
  };

  const handleRemoveArea = (areaNameToRemove) => {
    if (confirm(`¿Eliminar el área "${areaNameToRemove}" del catálogo de servicio?`)) {
      const updated = serviceAreasCatalog.filter(a => (typeof a === 'string' ? a : a.name) !== areaNameToRemove);
      setServiceAreasCatalog(updated);
      saveStoredServiceAreas(updated);
      if (onUpdateServiceAreasCatalog) onUpdateServiceAreasCatalog(updated);
      if (editingAreaItem?.originalName === areaNameToRemove) {
        setEditingAreaItem(null);
      }
    }
  };

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState(null); // 'success' | 'error' | null

  const handleSaveAllAdminChanges = async () => {
    setIsSyncingSheets(true);
    setSheetsSyncStatus(null);
    try {
      // 1. Guardar localmente como respaldo
      saveStoredActivities(activities);
      saveStoredServers(servers);
      saveStoredAnnouncements(announcements);
      saveStoredRoles(rolesCatalog);
      saveStoredHours(hoursCatalog);
      saveStoredServiceAreas(serviceAreasCatalog);
      if (lockedMessage) saveStoredLockedMessage(lockedMessage);
      saveStoredProgramLocked(Boolean(lockedActivitiesCount > 0));

      // 2. Enviar y actualizar la hoja de cálculo de Google Sheets con todos los catálogos
      if (onSyncToSheets) {
        await onSyncToSheets({
          rolesCatalog,
          hoursCatalog,
          serviceAreasCatalog
        });
      }

      setSheetsSyncStatus('success');
      setTimeout(() => {
        setSheetsSyncStatus(null);
      }, 4000);
    } catch (err) {
      console.error('Error al sincronizar con Google Sheets:', err);
      setSheetsSyncStatus('error');
      alert('Hubo un error al comunicar con Google Sheets. Revisa tu conexión a internet.');
    } finally {
      setIsSyncingSheets(false);
    }
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
            className="btn btn-secondary" 
            onClick={() => handleStartCreate('siervos')}
          >
            <Plus size={16} />
            <span>Nueva Actividad Siervos</span>
          </button>
        </div>
      </div>

      {/* Barra Destacada e Independiente para Guardar y Publicar en Google Sheets */}
      <div className="admin-publish-banner">
        <div className="publish-banner-info">
          <div className="publish-banner-icon">
            <CloudUpload size={24} />
          </div>
          <div>
            <h4 className="publish-banner-title">Sincronización y Publicación en Vivo</h4>
            <p className="publish-banner-desc">
              Guarda tus modificaciones y actualiza la hoja de Google Sheets para que todos los jóvenes y servidores vean la información actualizada al entrar.
            </p>
          </div>
        </div>

        <button 
          type="button" 
          className={`btn-publish-sheets ${isSyncingSheets ? 'is-loading' : ''} ${sheetsSyncStatus === 'success' ? 'is-success' : ''}`}
          onClick={handleSaveAllAdminChanges}
          disabled={isSyncingSheets}
          title="Guardar localmente y transmitir la configuración completa a Google Sheets para todos los usuarios"
        >
          {isSyncingSheets ? (
            <>
              <RefreshCw size={18} className="spin-anim" />
              <span>Guardando en Google Sheets...</span>
            </>
          ) : sheetsSyncStatus === 'success' ? (
            <>
              <Check size={18} />
              <span>¡Cambios Publicados con Éxito!</span>
            </>
          ) : (
            <>
              <CloudUpload size={18} />
              <span>Guardar Cambios en Google Sheets</span>
            </>
          )}
        </button>
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
        <div 
          className="modal-overlay admin-editor-modal-overlay" 
          onMouseDown={e => {
            overlayMouseDownRef.current = (e.target === e.currentTarget);
          }}
          onClick={e => {
            if (e.target === e.currentTarget && overlayMouseDownRef.current) {
              handleAttemptCloseActivityEditor();
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div 
            className="modal-container admin-editor-modal-container"
            onMouseDown={e => e.stopPropagation()}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleToggleAllEditorSections}
                    title={Object.values(collapsedSections).some(Boolean) ? "Desplegar todas las secciones del formulario" : "Comprimir todas las secciones del formulario"}
                  >
                    {Object.values(collapsedSections).some(Boolean) ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    <span>{Object.values(collapsedSections).some(Boolean) ? 'Expandir Secciones' : 'Comprimir Secciones'}</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveCurrentActivity}
                    title="Guardar todos los cambios de esta actividad"
                  >
                    <Check size={16} />
                    <span>Guardar Cambios</span>
                  </button>
                  <button 
                    type="button"
                    className="modal-close-btn"
                    onClick={handleAttemptCloseActivityEditor}
                    title="Cerrar editor [Esc]"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

          <form onSubmit={handleSaveCurrentActivity} className="editor-form">
            {/* Section 1: Basic Information */}
            <div className={`form-section-box ${collapsedSections[1] ? 'is-section-collapsed' : ''}`}>
              <div 
                className="section-collapsible-header"
                onClick={() => toggleEditorSection(1)}
                role="button"
                tabIndex={0}
                title={collapsedSections[1] ? "Desplegar sección" : "Comprimir sección"}
              >
                <h4 className="section-title">1. Información General</h4>
                <button type="button" className="btn-section-toggle" aria-label="Alternar sección">
                  {collapsedSections[1] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </div>
              {!collapsedSections[1] && (
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

                {/* Control de Ocultar Evento al Público */}
                <div className="form-group full-width activity-visibility-toggle-box" style={{ marginTop: '0.75rem' }}>
                  <label className="checkbox-label-styled">
                    <input 
                      type="checkbox"
                      checked={Boolean(editingActivity.isHidden)}
                      onChange={e => setEditingActivity({ 
                        ...editingActivity, 
                        isHidden: e.target.checked 
                      })}
                    />
                    <span className="checkbox-text-bold">
                      🙈 Ocultar este evento al público (Evitar confusiones y tener presente el más reciente)
                    </span>
                  </label>
                  <p className="field-hint" style={{ marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Al ocultarlo, las personas no verán este evento en el calendario ni en la logística pública, manteniendo su atención en los eventos más recientes. Solo los administradores podrán verlo.
                  </p>
                </div>
              </div>
              )}
            </div>

            {/* Section 2: Schedules */}
            <div className={`form-section-box ${collapsedSections[2] ? 'is-section-collapsed' : ''}`}>
              <div 
                className="section-collapsible-header"
                onClick={() => toggleEditorSection(2)}
                role="button"
                tabIndex={0}
                title={collapsedSections[2] ? "Desplegar sección" : "Comprimir sección"}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h4 className="section-title" style={{ margin: 0 }}>2. Horarios de Logística</h4>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyStandardSchedule(editingActivity.group);
                    }}
                    title="Cargar los horarios habituales de montaje, culto y desmontaje para este grupo"
                  >
                    ⚡ Cargar Habitual ({editingActivity.group === 'jotapece' ? 'Jotapece' : editingActivity.group === 'siervos' ? 'Siervos' : 'Ambos'})
                  </button>
                </div>
                <button type="button" className="btn-section-toggle" aria-label="Alternar sección">
                  {collapsedSections[2] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </div>
              {!collapsedSections[2] && (
                <div className="form-grid">
                <div className="form-group">
                  <div className="field-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ margin: 0, fontWeight: 700 }}>Montaje / Preparación</label>
                    {editingActivity.prepTime && (
                      <button
                        type="button"
                        className="btn-clear-inline"
                        onClick={() => setEditingActivity({ ...editingActivity, prepTime: '' })}
                        title="Borrar horario"
                      >
                        ✕ Borrar
                      </button>
                    )}
                  </div>
                  <div className="schedule-combo-box">
                    <input 
                      type="text" 
                      value={editingActivity.prepTime || ''}
                      onChange={e => setEditingActivity({ ...editingActivity, prepTime: e.target.value })}
                      placeholder="Ej. 5:00 – 7:00 pm"
                      className="form-input schedule-input"
                    />
                    <select 
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          setEditingActivity({ ...editingActivity, prepTime: e.target.value });
                        }
                      }}
                      className="form-select schedule-dropdown"
                      title="Cargar horario predefinido"
                    >
                      <option value="">⏱️ Opciones...</option>
                      {PREP_TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <div className="field-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ margin: 0, fontWeight: 700 }}>Culto / Actividad</label>
                    {editingActivity.activityTime && (
                      <button
                        type="button"
                        className="btn-clear-inline"
                        onClick={() => setEditingActivity({ ...editingActivity, activityTime: '' })}
                        title="Borrar horario"
                      >
                        ✕ Borrar
                      </button>
                    )}
                  </div>
                  <div className="schedule-combo-box">
                    <input 
                      type="text" 
                      value={editingActivity.activityTime || ''}
                      onChange={e => setEditingActivity({ ...editingActivity, activityTime: e.target.value })}
                      placeholder="Ej. 7:00 – 9:00 pm"
                      className="form-input schedule-input"
                    />
                    <select 
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          setEditingActivity({ ...editingActivity, activityTime: e.target.value });
                        }
                      }}
                      className="form-select schedule-dropdown"
                      title="Cargar horario predefinido"
                    >
                      <option value="">⏱️ Opciones...</option>
                      {ACTIVITY_TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <div className="field-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ margin: 0, fontWeight: 700 }}>Desmontaje</label>
                    {editingActivity.teardownTime && (
                      <button
                        type="button"
                        className="btn-clear-inline"
                        onClick={() => setEditingActivity({ ...editingActivity, teardownTime: '' })}
                        title="Borrar horario"
                      >
                        ✕ Borrar
                      </button>
                    )}
                  </div>
                  <div className="schedule-combo-box">
                    <input 
                      type="text" 
                      value={editingActivity.teardownTime || ''}
                      onChange={e => setEditingActivity({ ...editingActivity, teardownTime: e.target.value })}
                      placeholder="Ej. 9:00 – 9:30 pm"
                      className="form-input schedule-input"
                    />
                    <select 
                      value=""
                      onChange={e => {
                        if (e.target.value) {
                          setEditingActivity({ ...editingActivity, teardownTime: e.target.value });
                        }
                      }}
                      className="form-select schedule-dropdown"
                      title="Cargar horario predefinido"
                    >
                      <option value="">⏱️ Opciones...</option>
                      {TEARDOWN_TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
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
              )}
            </div>

            {/* Section 3: Step-by-Step Program Builder */}
            <div className={`form-section-box ${collapsedSections[3] ? 'is-section-collapsed' : ''}`}>
              <div 
                className="section-collapsible-header"
                onClick={() => toggleEditorSection(3)}
                role="button"
                tabIndex={0}
                title={collapsedSections[3] ? "Desplegar sección" : "Comprimir sección"}
              >
                <div>
                  <h4 className="section-title" style={{ margin: 0 }}>3. Programa Minuto a Minuto ({editingActivity.program?.length || 0} pasos)</h4>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-xs"
                    onClick={() => setShowSmartImporter(true)}
                    title="Pega texto del programa para autocompletar bloques, horarios y encargados"
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', border: 'none', color: '#fff' }}
                  >
                    <Sparkles size={14} />
                    <span>Importador</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-xs"
                    onClick={addProgramStep}
                  >
                    <Plus size={14} />
                    <span>Agregar Bloque</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn-section-toggle"
                    onClick={() => toggleEditorSection(3)}
                    aria-label="Alternar sección"
                  >
                    {collapsedSections[3] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>
              </div>
              {!collapsedSections[3] && (
                <>
                  <p className="section-desc" style={{ marginTop: '0.4rem' }}>Selecciona bloques predefinidos de la lista o escribe actividades personalizadas con su descripción.</p>

              <div className="program-steps-editor-list">
                {(editingActivity.program || []).map((step, idx) => (
                  <div key={idx} className="program-step-edit-card">
                    {/* Barra de cabecera del bloque con número, preview, plantilla y acciones */}
                    <div className="step-card-header-bar">
                      <div className="step-card-header-left">
                        <span className="step-number-badge">Bloque #{idx + 1}</span>
                        <span className="step-time-pill">⏱️ {step.time || 'Sin hora'}</span>
                        <strong className="step-title-preview">{step.title || 'Nuevo Bloque'}</strong>
                      </div>

                      <div className="step-card-header-actions">
                        {/* Selector de plantilla de bloque */}
                        <div className="template-shortcut-wrap">
                          <select 
                            value="" 
                            onChange={e => {
                              if (e.target.value) {
                                applyBlockTemplate(idx, e.target.value);
                              }
                            }}
                            className="form-select template-mini-select"
                            title="Cargar plantilla de bloque predefinida"
                          >
                            <option value="">⚡ Plantilla...</option>
                            {PROGRAM_BLOCKS_CATALOG.map((b, bIdx) => (
                              <option key={bIdx} value={b.title}>{b.title}</option>
                            ))}
                          </select>
                        </div>

                        {/* Botones de orden y acciones */}
                        <div className="step-actions-group">
                          <button
                            type="button"
                            className="step-icon-btn"
                            onClick={() => moveProgramStep(idx, -1)}
                            disabled={idx === 0}
                            title="Mover bloque hacia arriba"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="step-icon-btn"
                            onClick={() => moveProgramStep(idx, 1)}
                            disabled={idx === (editingActivity.program || []).length - 1}
                            title="Mover bloque hacia abajo"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="step-icon-btn"
                            onClick={() => duplicateProgramStep(idx)}
                            title="Duplicar este bloque"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            className="step-icon-btn delete-btn"
                            onClick={() => removeProgramStep(idx)}
                            title="Eliminar este bloque"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Campos principales del bloque */}
                    <div className="step-edit-row">
                      {/* Campo 1: Hora */}
                      <div className="step-field time-field">
                        <label>⏱️ Hora</label>
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

                      {/* Campo 2: Actividad / Bloque */}
                      <div className="step-field title-field">
                        <label>📋 Actividad / Bloque</label>
                        <input 
                          type="text" 
                          value={step.title}
                          onChange={e => updateProgramStep(idx, 'title', e.target.value)}
                          placeholder="Ej. Dinámica rompehielos"
                          className="form-input"
                        />
                      </div>

                      {/* Campo 3: Responsable con selector basado en servidores reconocidos */}
                      <div className="step-field resp-field">
                        <div className="resp-label-row">
                          <label>👤 Responsable(s)</label>
                          {step.responsible && step.responsible !== 'Por designar' && (
                            <button 
                              type="button" 
                              className="btn-clear-inline" 
                              onClick={() => updateProgramStep(idx, 'responsible', 'Por designar')}
                              title="Restablecer a 'Por designar'"
                            >
                              ✕ Limpiar
                            </button>
                          )}
                        </div>

                        <div className="resp-select-combo">
                          <input 
                            type="text" 
                            value={step.responsible}
                            onChange={e => updateProgramStep(idx, 'responsible', e.target.value)}
                            placeholder="Escribe o selecciona de la lista..."
                            className="form-input resp-input"
                          />

                          {/* Selector desplegable de responsables reconocidos y registrados */}
                          <select
                            value=""
                            onChange={e => {
                              if (e.target.value) {
                                handleSelectStepResponsible(idx, e.target.value);
                              }
                            }}
                            className="form-select resp-dropdown"
                            title="Seleccionar responsable de los servidores reconocidos o registrados"
                          >
                            <option value="">👤 Elegir servidor...</option>
                            
                            <optgroup label="⚡ Opciones Generales">
                              <option value="Todos los servidores">Todos los servidores</option>
                              <option value="Por designar">Por designar</option>
                              <option value="Equipo de Alabanza">Equipo de Alabanza</option>
                              <option value="Liderazgo">Liderazgo</option>
                            </optgroup>

                            {recognizedActivityServers.length > 0 && (
                              <optgroup label="⭐ Servidores en esta Actividad">
                                {recognizedActivityServers.map((s, sIdx) => (
                                  <option key={`rec-${sIdx}`} value={s.name}>
                                    ⭐ {s.name} ({s.role})
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            <optgroup label="👥 Directorio General de Servidores">
                              {sortedServers.map(s => (
                                <option key={s.id} value={s.name}>
                                  {s.name} {s.nickname ? `(${s.nickname})` : ''} - {s.role}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        {/* Chips rápidos de servidores reconocidos para añadir con 1 clic */}
                        {recognizedActivityServers.length > 0 && (
                          <div className="resp-quick-chips-row">
                            <span className="chips-label">Reconocidos:</span>
                            <div className="chips-list-scroll">
                              {recognizedActivityServers.slice(0, 10).map((srv, sIdx) => {
                                const isAlreadyIncluded = (step.responsible || '').toLowerCase().includes(srv.name.toLowerCase());
                                return (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    className={`resp-chip-btn ${isAlreadyIncluded ? 'active' : ''}`}
                                    onClick={() => handleToggleStepResponsibleChip(idx, srv.name)}
                                    title={isAlreadyIncluded ? `Quitar a ${srv.name}` : `Añadir a ${srv.name}`}
                                  >
                                    {isAlreadyIncluded ? '✓ ' : '+ '}
                                    {srv.name.split(' ')[0]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detalle / Instrucciones */}
                    <div className="step-field full-field">
                      <label>📝 Detalle / Descripción para los servidores</label>
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
                </>
              )}
            </div>

            {/* Section 4: Server Roles & Assigned Persons */}
            <div className={`form-section-box ${collapsedSections[4] ? 'is-section-collapsed' : ''}`}>
              <div 
                className="section-collapsible-header"
                onClick={() => toggleEditorSection(4)}
                role="button"
                tabIndex={0}
                title={collapsedSections[4] ? "Desplegar sección" : "Comprimir sección"}
              >
                <div>
                  <h4 className="section-title" style={{ margin: 0 }}>4. Servidores y Responsabilidades Asignadas ({editingActivity.serverAssignments?.length || 0})</h4>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-xs"
                    onClick={() => addServerRole()}
                  >
                    <Plus size={14} />
                    <span>Asignar Servidor</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn-section-toggle"
                    onClick={() => toggleEditorSection(4)}
                    aria-label="Alternar sección"
                  >
                    {collapsedSections[4] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>
              </div>
              {!collapsedSections[4] && (
                <>
                  <p className="section-desc" style={{ marginTop: '0.4rem' }}>
                    Selecciona el rol de la lista para cargar su descripción automáticamente. Un servidor puede tener más de un rol asignado.
                  </p>
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
                          value={
                            asg.serverId || 
                            sortedServers.find(s => s.name?.trim().toLowerCase() === asg.serverName?.trim().toLowerCase())?.id || 
                            ''
                          }
                          onChange={e => updateServerRole(idx, 'serverId', e.target.value)}
                          className="form-select"
                        >
                          <option value="">-- Seleccionar Servidor --</option>
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

                    {/* Botón para asignar otro rol a este servidor (solo visible si hay un servidor seleccionado) */}
                    {Boolean(asg.serverId || (asg.serverName && asg.serverName.trim())) && (
                      <div className="role-extra-actions-row">
                        {(() => {
                          const currentId = asg.serverId || sortedServers.find(s => s.name?.trim().toLowerCase() === asg.serverName?.trim().toLowerCase())?.id;
                          const count = (editingActivity.serverAssignments || []).filter(item => 
                            (currentId && item.serverId === currentId) || 
                            (asg.serverName && item.serverName === asg.serverName)
                          ).length;
                          return count > 1 ? (
                            <span className="server-multi-badge">
                              ⭐ Este servidor tiene {count} roles asignados
                            </span>
                          ) : null;
                        })()}
                        <button 
                          type="button" 
                          className="btn-add-secondary-role"
                          onClick={() => {
                            const targetId = asg.serverId || sortedServers.find(s => s.name?.trim().toLowerCase() === asg.serverName?.trim().toLowerCase())?.id;
                            addServerRole(targetId);
                          }}
                          title="Asignar un rol adicional a este mismo servidor en esta actividad"
                        >
                          <Plus size={13} />
                          <span>Asignar otro rol a {asg.serverName?.split(' ')[0] || 'este servidor'}</span>
                        </button>
                      </div>
                    )}

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
                </>
              )}
            </div>

            {/* Section 5: Youth Leaders Observations (Google Sheets) */}
            <div className={`form-section-box ${collapsedSections[5] ? 'is-section-collapsed' : ''}`}>
              <div 
                className="section-collapsible-header"
                onClick={() => toggleEditorSection(5)}
                role="button"
                tabIndex={0}
                title={collapsedSections[5] ? "Desplegar sección" : "Comprimir sección"}
              >
                <div>
                  <h4 className="section-title" style={{ margin: 0 }}>
                    5. Observaciones de Líderes de Jóvenes ({editingActivity.observations?.length || 0})
                  </h4>
                  <p className="section-desc" style={{ marginTop: '0.2rem', marginBottom: 0 }}>
                    Registro de sugerencias y retroalimentación de Fernando Pepén, Luisiana, Joel Guzmán, Carmen, Joel Hernández, Marisol y Elías Martes. Sincronizado en Sheet.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn-section-toggle"
                  onClick={() => toggleEditorSection(5)}
                  aria-label="Alternar sección"
                >
                  {collapsedSections[5] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </div>
              {!collapsedSections[5] && (
                <div style={{ marginTop: '1rem' }}>
                  <ActivityObservationsSection
                    activity={editingActivity}
                    onUpdateActivity={(updated) => setEditingActivity(updated)}
                    isAdmin={true}
                  />
                </div>
              )}
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

  {/* Modal del Importador Inteligente para autocompletar programas */}
  {showSmartImporter && (
    <SmartProgramImporterModal 
      isOpen={showSmartImporter}
      onClose={() => setShowSmartImporter(false)}
      onApply={handleApplySmartImport}
      registeredServers={servers || []}
      rolesCatalog={rolesCatalog || []}
      currentActivity={editingActivity}
      onAddServer={onAddServer}
      onUpdateRolesCatalog={handleSaveNewRoleDirect}
    />
  )}

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

            {/* Density / Compression Mode Toggle: Comprimir vistas */}
            <div className="admin-density-toggle-group" title="Comprimir o expandir vista de actividades">
              <button
                type="button"
                className={`admin-view-toggle-btn btn-density-toggle ${isCompactView ? 'active' : ''}`}
                onClick={handleToggleCompactView}
                title={isCompactView ? "Vista Comprimida activada. Haz clic para ver vista detallada" : "Haz clic para comprimir las vistas y ver más actividades compactadas"}
              >
                {isCompactView ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                <span>{isCompactView ? 'Comprimida' : 'Detallada'}</span>
              </button>
              {isCompactView && viewMode === 'cards' && (
                <button
                  type="button"
                  className="admin-view-toggle-btn btn-expand-all"
                  onClick={handleToggleExpandAll}
                  title={expandedCardIds.size === displayedActivities.length ? "Plegar detalles de todas" : "Desplegar detalles de todas"}
                >
                  {expandedCardIds.size === displayedActivities.length ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{expandedCardIds.size === displayedActivities.length ? 'Plegar todo' : 'Desplegar todo'}</span>
                </button>
              )}
            </div>

            {/* Limit selector: 2, 3, 5, 10, 15, 20, Todas */}
            <div className="page-limit-selector" title="Cantidad de actividades a mostrar">
              <span className="limit-selector-label">Mostrar:</span>
              <div className="limit-pills-group">
                {PAGE_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`limit-pill-btn ${pageSize === opt ? 'active' : ''}`}
                    onClick={() => handlePageSizeChange(opt)}
                    title={opt === 'all' ? 'Ver todas las actividades' : `Mostrar ${opt} actividades por página`}
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

            {/* Visibility Filter: Todas, Visibles, Ocultas */}
            <div className="admin-filter-chips admin-visibility-filter-chips" title="Filtrar actividades por visibilidad pública">
              <button
                type="button"
                className={`admin-filter-chip ${visibilityFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setVisibilityFilter('all');
                  setCurrentPage(1);
                }}
                title="Ver todas las actividades (visibles y ocultas)"
              >
                Todas ({activities.length})
              </button>
              <button
                type="button"
                className={`admin-filter-chip chip-visible ${visibilityFilter === 'visible' ? 'active' : ''}`}
                onClick={() => {
                  setVisibilityFilter('visible');
                  setCurrentPage(1);
                }}
                title="Ver solo las actividades visibles para el público"
              >
                <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Visibles ({visibleActivitiesCount})
              </button>
              <button
                type="button"
                className={`admin-filter-chip chip-hidden ${visibilityFilter === 'hidden' ? 'active' : ''}`}
                onClick={() => {
                  setVisibilityFilter('hidden');
                  setCurrentPage(1);
                }}
                title="Ver solo las actividades ocultas para el público"
              >
                <EyeOff size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Ocultas ({hiddenActivitiesCount})
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
          <div className={`admin-activities-cards-list ${isCompactView ? 'is-compact-mode' : ''}`}>
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
                const isExpanded = expandedCardIds.has(act.id);

                if (isCompactView) {
                  return (
                    <div
                      key={act.id}
                      className={`admin-activity-card compact-activity-card ${groupBorderClass} ${isExpanded ? 'is-expanded' : ''}`}
                      onClick={() => handleStartEdit(act)}
                      role="button"
                      tabIndex={0}
                      title="Haz clic para entrar y editar esta actividad"
                    >
                      <div className="compact-card-main-bar">
                        {/* Compact Date Badge */}
                        <div className="compact-date-badge">
                          <span className="compact-date-dow">{act.dayOfWeek}</span>
                          <span className="compact-date-day">{act.dayNumber} {act.month}</span>
                        </div>

                        {/* Title and metadata */}
                        <div className="compact-card-info-col">
                          <div className="compact-card-top-row">
                            <span className="compact-card-title">{act.title}</span>
                            <span className={`group-pill-sm ${isJpc ? 'pill-jpc' : isSiervos ? 'pill-siervos' : 'pill-ambos'}`}>
                              {isJpc ? 'Jotapece' : isSiervos ? 'Siervos' : 'Ambos'}
                            </span>
                            {act.preacher && act.preacher !== 'Sin predicación' && (
                              <span className="compact-preacher-badge" title="Mensaje / Predicador">
                                🗣️ {act.preacher}
                              </span>
                            )}
                          </div>

                          <div className="compact-card-tags-row">
                            <span className={`location-pill-sm tag-${act.locationType}`}>
                              📍 {act.customLocationName || act.location}
                            </span>
                            <span className="compact-meta-chip">
                              📋 {act.program?.length || 0} pasos
                            </span>
                            <span className="compact-meta-chip">
                              👥 {act.serverAssignments?.length || 0} servidores
                            </span>
                            {act.observations?.length > 0 && (
                              <span className="compact-meta-chip obs-meta-chip" title={`${act.observations.length} observaciones registradas de líderes`}>
                                💬 {act.observations.length} obs
                              </span>
                            )}
                            {act.activityTime && (
                              <span className="compact-meta-chip">
                                ⏰ {act.activityTime}
                              </span>
                            )}
                            {act.isHidden && (
                              <span className="compact-meta-chip is-hidden-pill" title="Evento oculto al público">
                                🙈 Oculto
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Compact actions buttons */}
                        <div className="compact-card-actions-row" onClick={e => e.stopPropagation()}>
                          <button 
                            type="button"
                            className={`btn-table-lock-toggle btn-compact-lock ${act.isProgramLocked ? 'is-locked' : 'is-unlocked'}`}
                            onClick={() => onToggleActivityLock && onToggleActivityLock(act.id)}
                            title={act.isProgramLocked ? "El programa de esta fecha está bloqueado para visitantes. Haz clic para desbloquearlo." : "El programa de esta fecha es público. Haz clic para bloquearlo."}
                          >
                            {act.isProgramLocked ? <Lock size={13} /> : <Unlock size={13} />}
                            <span className="compact-lock-label">{act.isProgramLocked ? 'Bloqueado' : 'Público'}</span>
                          </button>

                          <button 
                            type="button"
                            className={`btn-table-visibility-toggle btn-compact-lock ${act.isHidden ? 'is-act-hidden' : 'is-act-visible'}`}
                            onClick={() => onToggleActivityVisibility && onToggleActivityVisibility(act.id)}
                            title={act.isHidden ? "Este evento está OCULTO para el público. Haz clic para hacerlo visible." : "Este evento es VISIBLE para el público. Haz clic para ocultarlo y evitar confusiones."}
                          >
                            {act.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                            <span className="compact-lock-label">{act.isHidden ? 'Oculto' : 'Visible'}</span>
                          </button>

                          <button 
                            type="button"
                            className="btn-table-action btn-compact-action btn-edit-card"
                            onClick={() => handleStartEdit(act)}
                            title="Entrar y modificar actividad"
                          >
                            <Edit3 size={14} />
                            <span>Editar</span>
                          </button>

                          <button 
                            type="button"
                            className="btn-table-action btn-compact-action btn-danger"
                            onClick={() => handleDeleteActivity(act)}
                            title="Eliminar actividad"
                          >
                            <Trash2 size={14} />
                          </button>

                          <button
                            type="button"
                            className={`btn-compact-expand-toggle ${isExpanded ? 'active' : ''}`}
                            onClick={(e) => toggleCardExpansion(act.id, e)}
                            title={isExpanded ? "Plegar detalles de esta actividad" : "Desplegar detalles de esta actividad"}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable accordion drawer */}
                      {isExpanded && (
                        <div className="compact-card-drawer" onClick={e => e.stopPropagation()}>
                          <div className="compact-drawer-grid">
                            <div className="compact-drawer-section">
                              <span className="drawer-label">⏰ Horarios de Logística:</span>
                              <div className="drawer-schedule-pills">
                                <span>🛠️ Montaje: <strong>{act.prepTime || 'N/A'}</strong></span>
                                <span>⛪ Culto: <strong>{act.activityTime || 'N/A'}</strong></span>
                                <span>📦 Desmontaje: <strong>{act.teardownTime || 'N/A'}</strong></span>
                              </div>
                            </div>

                            {act.serverAssignments?.length > 0 && (
                              <div className="compact-drawer-section">
                                <span className="drawer-label">👥 Servidores Asignados ({act.serverAssignments.length}):</span>
                                <div className="drawer-servers-flow">
                                  {act.serverAssignments.map((sa, idx) => (
                                    <span key={idx} className="drawer-server-tag">
                                      <strong>{sa.serverName}</strong>: {sa.role}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.program?.length > 0 && (
                              <div className="compact-drawer-section">
                                <span className="drawer-label">📋 Resumen del Programa ({act.program.length} bloques):</span>
                                <div className="drawer-program-flow">
                                  {act.program.map((step, idx) => (
                                    <span key={idx} className="drawer-step-tag">
                                      <code>{step.time}</code> {step.blockName} {step.responsible ? `(${step.responsible})` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.observations?.length > 0 && (
                              <div className="compact-drawer-section">
                                <span className="drawer-label">💬 Observaciones de Líderes ({act.observations.length}):</span>
                                <div className="drawer-obs-flow">
                                  {act.observations.map((obs, idx) => (
                                    <div key={idx} className="drawer-obs-pill">
                                      <strong>{(Array.isArray(obs.leaders) ? obs.leaders.join(', ') : obs.leaders)}:</strong> "{obs.comment}"
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

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
                            {act.isHidden && (
                              <span className="card-hidden-tag" title="Este evento está oculto para el público">
                                <EyeOff size={12} />
                                <span>Oculto</span>
                              </span>
                            )}
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
                      <div className="admin-card-toggles-group" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button 
                          type="button"
                          className={`btn-table-lock-toggle ${act.isProgramLocked ? 'is-locked' : 'is-unlocked'}`}
                          onClick={() => onToggleActivityLock && onToggleActivityLock(act.id)}
                          title={act.isProgramLocked ? "El programa de esta fecha está bloqueado para visitantes. Haz clic para desbloquearlo." : "El programa de esta fecha es público. Haz clic para bloquearlo."}
                        >
                          {act.isProgramLocked ? <Lock size={13} /> : <Unlock size={13} />}
                          <span>{act.isProgramLocked ? 'Bloqueado' : 'Público'}</span>
                        </button>

                        <button 
                          type="button"
                          className={`btn-table-visibility-toggle ${act.isHidden ? 'is-act-hidden' : 'is-act-visible'}`}
                          onClick={() => onToggleActivityVisibility && onToggleActivityVisibility(act.id)}
                          title={act.isHidden ? "Este evento está OCULTO para el público. Haz clic para hacerlo visible." : "Este evento es VISIBLE para el público. Haz clic para ocultarlo y evitar confusiones."}
                        >
                          {act.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{act.isHidden ? 'Oculto' : 'Visible'}</span>
                        </button>
                      </div>

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
            <table className={`admin-table ${isCompactView ? 'is-compact-table' : ''}`}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <strong>{act.title}</strong>
                          {act.isHidden && (
                            <span className="card-hidden-tag" title="Este evento está oculto para el público" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>
                              🙈 Oculto
                            </span>
                          )}
                        </div>
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
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button 
                            type="button"
                            className={`btn-table-lock-toggle ${act.isProgramLocked ? 'is-locked' : 'is-unlocked'}`}
                            onClick={() => onToggleActivityLock && onToggleActivityLock(act.id)}
                            title={act.isProgramLocked ? "El programa de esta fecha está bloqueado para visitantes. Haz clic para desbloquearlo." : "El programa de esta fecha es público. Haz clic para bloquearlo."}
                          >
                            {act.isProgramLocked ? <Lock size={13} /> : <Unlock size={13} />}
                            <span>{act.isProgramLocked ? 'Bloqueado' : 'Público'}</span>
                          </button>

                          <button 
                            type="button"
                            className={`btn-table-visibility-toggle ${act.isHidden ? 'is-act-hidden' : 'is-act-visible'}`}
                            onClick={() => onToggleActivityVisibility && onToggleActivityVisibility(act.id)}
                            title={act.isHidden ? "Este evento está OCULTO para el público. Haz clic para hacerlo visible." : "Este evento es VISIBLE para el público. Haz clic para ocultarlo y evitar confusiones."}
                          >
                            {act.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                            <span>{act.isHidden ? 'Oculto' : 'Visible'}</span>
                          </button>
                        </div>
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
              Personaliza, edita o renombra los roles ministeriales, las horas del programa y las áreas de servicio. Todos los cambios se guardan y sincronizan en la nube (Google Sheets).
            </p>
          </div>
          <div className="catalogs-tab-switch">
            <button
              type="button"
              className={`btn-tab-switch ${activeCatalogTab === 'roles' ? 'active' : ''}`}
              onClick={() => {
                setActiveCatalogTab('roles');
                setEditingRoleItem(null);
              }}
            >
              Roles y Descripciones ({rolesCatalog.length})
            </button>
            <button
              type="button"
              className={`btn-tab-switch ${activeCatalogTab === 'hours' ? 'active' : ''}`}
              onClick={() => {
                setActiveCatalogTab('hours');
                setEditingHourItem(null);
              }}
            >
              Horas del Programa ({hoursCatalog.length})
            </button>
            <button
              type="button"
              className={`btn-tab-switch ${activeCatalogTab === 'areas' ? 'active' : ''}`}
              onClick={() => {
                setActiveCatalogTab('areas');
                setEditingAreaItem(null);
              }}
            >
              Áreas de Servicio ({serviceAreasCatalog.length})
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
                {displayedRoles.map((r, rIdx) => {
                  const isEditingThis = editingRoleItem && editingRoleItem.originalRole === r.role;
                  return (
                    <div key={rIdx} className={`role-catalog-item-card ${isEditingThis ? 'is-editing' : ''}`}>
                      {isEditingThis ? (
                        <div className="catalog-inline-edit-box">
                          <div className="inline-edit-field">
                            <label>Nombre del Rol:</label>
                            <input 
                              type="text" 
                              value={editingRoleItem.role} 
                              onChange={e => setEditingRoleItem({ ...editingRoleItem, role: e.target.value })}
                              className="form-input"
                              autoFocus
                            />
                          </div>
                          <div className="inline-edit-field">
                            <label>Descripción / Responsabilidad:</label>
                            <textarea 
                              rows={2}
                              value={editingRoleItem.duties} 
                              onChange={e => setEditingRoleItem({ ...editingRoleItem, duties: e.target.value })}
                              className="form-textarea"
                            />
                          </div>
                          <div className="inline-edit-btns">
                            <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveEditRole}>
                              <Check size={14} /> Guardar
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingRoleItem(null)}>
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="role-item-top">
                            <strong className="role-item-name">{r.role}</strong>
                            <div className="catalog-item-actions">
                              <button
                                type="button"
                                className="btn-edit-catalog-item"
                                onClick={() => handleStartEditRole(r)}
                                title="Modificar nombre o descripción de este rol"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-delete-catalog-item"
                                onClick={() => handleRemoveRole(r.role)}
                                title="Eliminar este rol de la lista"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="role-item-duties">{r.duties}</p>
                        </>
                      )}
                    </div>
                  );
                })}
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
                {hoursCatalog.map((h, hIdx) => {
                  const isEditingThis = editingHourItem && editingHourItem.originalHour === h;
                  return (
                    <div key={hIdx} className={`hour-chip ${isEditingThis ? 'is-editing' : ''}`}>
                      {isEditingThis ? (
                        <div className="hour-chip-edit-form">
                          <input 
                            type="text" 
                            value={editingHourItem.value} 
                            onChange={e => setEditingHourItem({ ...editingHourItem, value: e.target.value })}
                            className="form-input hour-chip-inline-input"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleSaveEditHour(); }
                              if (e.key === 'Escape') { e.preventDefault(); setEditingHourItem(null); }
                            }}
                          />
                          <button type="button" className="btn-chip-action save" onClick={handleSaveEditHour} title="Guardar hora">
                            <Check size={12} />
                          </button>
                          <button type="button" className="btn-chip-action cancel" onClick={() => setEditingHourItem(null)} title="Cancelar">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="hour-chip-text">{h}</span>
                          <div className="hour-chip-actions">
                            <button
                              type="button"
                              className="btn-edit-chip"
                              onClick={() => handleStartEditHour(h)}
                              title="Modificar esta hora"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              type="button"
                              className="btn-remove-chip"
                              onClick={() => handleRemoveHour(h)}
                              title="Eliminar hora"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Service Areas */}
        {activeCatalogTab === 'areas' && (
          <div className="catalog-tab-content">
            <form onSubmit={handleAddNewArea} className="catalog-add-form">
              <div className="add-role-grid">
                <div className="form-group">
                  <label>Nombre del Área de Servicio *</label>
                  <input
                    type="text"
                    required
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    placeholder="Ej. Redes y Fotografía"
                    className="form-input"
                  />
                </div>
                <div className="form-group flex-2">
                  <label>Descripción / Enfoque del Área</label>
                  <input
                    type="text"
                    value={newAreaDescription}
                    onChange={e => setNewAreaDescription(e.target.value)}
                    placeholder="Ej. Cobertura audiovisual, fotos de la reunión y redes sociales..."
                    className="form-input"
                  />
                </div>
                <div className="form-group btn-col">
                  <button type="submit" className="btn btn-primary btn-add-catalog">
                    <Plus size={16} />
                    <span>Agregar Área</span>
                  </button>
                </div>
              </div>
            </form>

            <div className="catalog-items-list">
              <div className="catalog-items-count-header roles-header-flex">
                <span>Áreas de servicio ministeriales configuradas ({serviceAreasCatalog.length}):</span>
                <div className="page-limit-selector roles-limit-selector" title="Cantidad de áreas a visualizar">
                  <span className="limit-selector-label">Ver:</span>
                  <div className="limit-pills-group">
                    {['5', '10', '15', 'all'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`limit-pill-btn ${areasPageSize === opt ? 'active' : ''}`}
                        onClick={() => {
                          setAreasPageSize(opt);
                          setAreasCurrentPage(1);
                        }}
                      >
                        {opt === 'all' ? 'Todos' : opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="roles-grid-cards">
                {displayedAreas.map((areaItem, aIdx) => {
                  const areaName = typeof areaItem === 'string' ? areaItem : areaItem.name;
                  const areaDesc = typeof areaItem === 'string' ? '' : (areaItem.description || '');
                  const isEditingThis = editingAreaItem && editingAreaItem.originalName === areaName;

                  return (
                    <div key={aIdx} className={`role-catalog-item-card ${isEditingThis ? 'is-editing' : ''}`}>
                      {isEditingThis ? (
                        <div className="catalog-inline-edit-box">
                          <div className="inline-edit-field">
                            <label>Nombre del Área:</label>
                            <input 
                              type="text" 
                              value={editingAreaItem.name} 
                              onChange={e => setEditingAreaItem({ ...editingAreaItem, name: e.target.value })}
                              className="form-input"
                              autoFocus
                            />
                          </div>
                          <div className="inline-edit-field">
                            <label>Descripción / Enfoque:</label>
                            <textarea 
                              rows={2}
                              value={editingAreaItem.description} 
                              onChange={e => setEditingAreaItem({ ...editingAreaItem, description: e.target.value })}
                              className="form-textarea"
                            />
                          </div>
                          <div className="inline-edit-btns">
                            <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveEditArea}>
                              <Check size={14} /> Guardar
                            </button>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditingAreaItem(null)}>
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="role-item-top">
                            <strong className="role-item-name">{areaName}</strong>
                            <div className="catalog-item-actions">
                              <button
                                type="button"
                                className="btn-edit-catalog-item"
                                onClick={() => handleStartEditArea(areaItem)}
                                title="Modificar nombre o descripción de esta área"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-delete-catalog-item"
                                onClick={() => handleRemoveArea(areaName)}
                                title="Eliminar esta área del catálogo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="role-item-duties">
                            {areaDesc || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Sin descripción detallada</span>}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {isAreasPaged && totalAreasPages > 1 && (
                <div className="pagination-bar roles-pagination-bar" style={{ marginTop: '1rem', padding: '0.75rem 1rem' }}>
                  <div className="pagination-info" style={{ fontSize: '0.82rem' }}>
                    Mostrando <strong>{totalAreasItems > 0 ? areasStartIndex + 1 : 0}–{areasEndIndex}</strong> de <strong>{totalAreasItems}</strong> áreas
                  </div>
                  <div className="pagination-nav">
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={safeAreasCurrentPage <= 1}
                      onClick={() => setAreasCurrentPage(p => Math.max(1, p - 1))}
                      title="Página anterior"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div className="pagination-numbers">
                      {Array.from({ length: totalAreasPages }, (_, i) => i + 1).map(pNum => (
                        <button
                          key={pNum}
                          type="button"
                          className={`page-num-btn ${pNum === safeAreasCurrentPage ? 'active' : ''}`}
                          style={{ minWidth: '30px', height: '30px', fontSize: '0.82rem' }}
                          onClick={() => setAreasCurrentPage(pNum)}
                        >
                          {pNum}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-page-nav"
                      disabled={safeAreasCurrentPage >= totalAreasPages}
                      onClick={() => setAreasCurrentPage(p => Math.min(totalAreasPages, p + 1))}
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

      {/* Floating Confirmation Toast for Global Admin Save */}
      {sheetsSyncStatus === 'success' && (
        <div className="admin-save-toast">
          <Check size={18} />
          <span>¡Todos los cambios fueron guardados y enviados a Google Sheets con éxito! Todos los usuarios verán esta versión actualizada.</span>
        </div>
      )}
    </div>
  );
}
