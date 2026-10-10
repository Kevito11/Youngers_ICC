import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import GeneralCalendarView from './components/GeneralCalendarView';
import TimelineVisual from './components/TimelineVisual';
import ActivityDetailModal from './components/ActivityDetailModal';
import ServersDirectory from './components/ServersDirectory';
import ServerParticipationView from './components/ServerParticipationView';
import AdminPanel from './components/AdminPanel';
import PeriodsHistoryView from './components/PeriodsHistoryView';
import FooterNotes from './components/FooterNotes';
import PasswordAuthModal from './components/PasswordAuthModal';
import ProgramLockedScreen from './components/ProgramLockedScreen';
import ScrollToTopButton from './components/ScrollToTopButton';
import { Lock, Key, RefreshCw, Check, AlertCircle } from './components/Icons';

import {
  loadStoredActivities,
  saveStoredActivities,
  loadStoredServers,
  saveStoredServers,
  loadStoredAnnouncements,
  saveStoredAnnouncements,
  loadStoredProgramLocked,
  saveStoredProgramLocked,
  loadStoredLockedMessage,
  saveStoredLockedMessage
} from './data/initialData';
import {
  loadStoredRoles,
  saveStoredRoles,
  loadStoredHours,
  saveStoredHours,
  loadStoredServiceAreas,
  saveStoredServiceAreas
} from './data/catalogs';
import { fetchFromGoogleSheets, syncToGoogleSheets } from './services/googleSheetsService';

import './App.css';

// URL Route <-> Tab mappings
const pathToTab = (pathname) => {
  const p = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
  if (p === '/jotapece') return 'jotapece';
  if (p === '/siervos') return 'siervos';
  if (p === '/periodos' || p === '/historial') return 'periodos';
  if (p === '/servidores' || p === '/servers') return 'servers';
  if (p === '/mi-participacion' || p === '/participacion' || p === '/mis-tareas') return 'participacion';
  if (p === '/admin' || p === '/administrador') return 'admin';
  return 'general'; // Default for '/', '/calendario', '/general'
};

const tabToPath = (tab) => {
  switch (tab) {
    case 'jotapece': return '/jotapece';
    case 'siervos': return '/siervos';
    case 'periodos': return '/periodos';
    case 'servers': return '/servidores';
    case 'participacion': return '/mi-participacion';
    case 'admin': return '/admin';
    default: return '/';
  }
};

export default function App() {
  // Read initial tab from URL pathname
  const [currentTab, setCurrentTab] = useState(() => {
    return pathToTab(window.location.pathname);
  });

  // State loaded internally (Google Sheets cloud source of truth, fallback to initial data)
  const [activities, setActivities] = useState(() => loadStoredActivities());
  const [servers, setServers] = useState(() => loadStoredServers());
  const [announcements, setAnnouncements] = useState(() => loadStoredAnnouncements());
  const [isProgramLocked, setIsProgramLocked] = useState(() => loadStoredProgramLocked());
  const [lockedMessage, setLockedMessage] = useState(() => loadStoredLockedMessage());

  // Dynamic Catalogs State (Synchronized with Google Sheets)
  const [rolesCatalog, setRolesCatalog] = useState(() => loadStoredRoles());
  const [hoursCatalog, setHoursCatalog] = useState(() => loadStoredHours());
  const [serviceAreasCatalog, setServiceAreasCatalog] = useState(() => loadStoredServiceAreas());

  // Cloud Synchronization Status & Initial Loader
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState(null); // 'syncing' | 'saved' | 'error' | null

  // Password authentication state for administrative modification
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('youngers_admin_auth_v1') === 'true';
  });

  // Password prompt modal state
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    onSuccess: null
  });

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityToEditInAdmin, setActivityToEditInAdmin] = useState(null);

  // Sincronización en el arranque con Google Sheets (fuente única de verdad para todos los navegadores)
  useEffect(() => {
    let isMounted = true;
    const fetchLatestFromSheets = async () => {
      try {
        const data = await fetchFromGoogleSheets();
        if (data && data.success && isMounted) {
          if (Array.isArray(data.activities) && data.activities.length > 0) {
            setActivities(data.activities);
          }
          if (Array.isArray(data.servers) && data.servers.length > 0) {
            setServers(data.servers);
          }
          if (Array.isArray(data.announcements)) {
            setAnnouncements(data.announcements);
          }
          if (Array.isArray(data.rolesCatalog) && data.rolesCatalog.length > 0) {
            setRolesCatalog(data.rolesCatalog);
          }
          if (Array.isArray(data.hoursCatalog) && data.hoursCatalog.length > 0) {
            setHoursCatalog(data.hoursCatalog);
          }
          if (Array.isArray(data.serviceAreasCatalog) && data.serviceAreasCatalog.length > 0) {
            setServiceAreasCatalog(data.serviceAreasCatalog);
          }
          if (data.isProgramLocked !== undefined) {
            setIsProgramLocked(Boolean(data.isProgramLocked));
          }
          if (data.lockedMessage) {
            setLockedMessage(data.lockedMessage);
          }
        }
      } catch (err) {
        console.warn('Uso de valores predeterminados (sin conexión a Google Sheets):', err.message);
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchLatestFromSheets();
    return () => { isMounted = false; };
  }, []);

  // Función para que el administrador envíe y publique toda la configuración en Google Sheets
  const handleSyncToSheets = async (customExtra = {}) => {
    return await syncToGoogleSheets(activities, servers, {
      announcements,
      isProgramLocked,
      lockedMessage,
      rolesCatalog: customExtra.rolesCatalog || rolesCatalog,
      hoursCatalog: customExtra.hoursCatalog || hoursCatalog,
      serviceAreasCatalog: customExtra.serviceAreasCatalog || serviceAreasCatalog,
      ...customExtra
    });
  };

  const handleUpdateRolesCatalog = (next) => {
    setRolesCatalog(next);
    saveStoredRoles(next);
    syncToGoogleSheets(activities, servers, {
      announcements,
      isProgramLocked,
      lockedMessage,
      rolesCatalog: next,
      hoursCatalog,
      serviceAreasCatalog
    }).catch(e => console.warn('Sync roles to sheets warning:', e));
  };

  const handleUpdateHoursCatalog = (next) => {
    setHoursCatalog(next);
    saveStoredHours(next);
    syncToGoogleSheets(activities, servers, {
      announcements,
      isProgramLocked,
      lockedMessage,
      rolesCatalog,
      hoursCatalog: next,
      serviceAreasCatalog
    }).catch(e => console.warn('Sync hours to sheets warning:', e));
  };

  const handleUpdateServiceAreasCatalog = (next) => {
    setServiceAreasCatalog(next);
    saveStoredServiceAreas(next);
    syncToGoogleSheets(activities, servers, {
      announcements,
      isProgramLocked,
      lockedMessage,
      rolesCatalog,
      hoursCatalog,
      serviceAreasCatalog: next
    }).catch(e => console.warn('Sync areas to sheets warning:', e));
  };

  // Auto-descubrir y sincronizar cualquier rol o área personalizada existente en los servidores hacia los catálogos
  useEffect(() => {
    if (!servers || servers.length === 0 || !rolesCatalog || rolesCatalog.length === 0) return;

    let nextRoles = [...rolesCatalog];
    let rolesChanged = false;

    servers.forEach(s => {
      if (s.role && s.role.trim()) {
        const roleName = s.role.trim();
        const exists = nextRoles.some(r => r.role?.toLowerCase() === roleName.toLowerCase());
        if (!exists) {
          nextRoles.push({
            role: roleName,
            duties: 'Responsabilidad y función ministerial personalizada.'
          });
          rolesChanged = true;
        }
      }
    });

    let nextAreas = [...serviceAreasCatalog];
    let areasChanged = false;

    servers.forEach(s => {
      const areas = Array.isArray(s.primaryAreas) 
        ? s.primaryAreas 
        : (typeof s.primaryAreas === 'string' ? s.primaryAreas.split(',').map(a => a.trim()).filter(Boolean) : []);
      areas.forEach(a => {
        if (!a || !a.trim()) return;
        const areaName = a.trim();
        const exists = nextAreas.some(existing => (typeof existing === 'string' ? existing : existing.name)?.toLowerCase() === areaName.toLowerCase());
        if (!exists) {
          nextAreas.push({ name: areaName, description: 'Área de servicio ministerial.' });
          areasChanged = true;
        }
      });
    });

    if (rolesChanged || areasChanged) {
      if (rolesChanged) {
        setRolesCatalog(nextRoles);
        saveStoredRoles(nextRoles);
      }
      if (areasChanged) {
        setServiceAreasCatalog(nextAreas);
        saveStoredServiceAreas(nextAreas);
      }
      // Solo sincronizar con Google Sheets si es una sesión de administrador autenticada
      if (isAdminAuthenticated) {
        syncToGoogleSheets(activities, servers, {
          announcements,
          isProgramLocked,
          lockedMessage,
          rolesCatalog: rolesChanged ? nextRoles : rolesCatalog,
          hoursCatalog,
          serviceAreasCatalog: areasChanged ? nextAreas : serviceAreasCatalog
        }).catch(e => console.warn('Sync auto-discovered roles/areas warning:', e));
      }
    }
  }, [servers, rolesCatalog, serviceAreasCatalog, isAdminAuthenticated]);

  // Renombrado en cascada para roles -> Sincronización en la nube
  const handleCascadeRenameRole = async (oldRole, newRole) => {
    const nextServers = servers.map(s => s.role === oldRole ? { ...s, role: newRole } : s);
    setServers(nextServers);

    const nextActivities = activities.map(act => ({
      ...act,
      serverAssignments: (act.serverAssignments || []).map(asg => asg.role === oldRole ? { ...asg, role: newRole } : asg)
    }));
    setActivities(nextActivities);

    setCloudSyncStatus('syncing');
    try {
      await syncToGoogleSheets(nextActivities, nextServers, {
        announcements,
        isProgramLocked,
        lockedMessage,
        rolesCatalog,
        hoursCatalog,
        serviceAreasCatalog
      });
      setCloudSyncStatus('saved');
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch (e) {
      setCloudSyncStatus('error');
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Renombrado en cascada para áreas de servicio -> Sincronización en la nube
  const handleCascadeRenameArea = async (oldArea, newArea) => {
    const nextServers = servers.map(s => {
      if (Array.isArray(s.primaryAreas) && s.primaryAreas.includes(oldArea)) {
        return {
          ...s,
          primaryAreas: s.primaryAreas.map(a => a === oldArea ? newArea : a)
        };
      }
      return s;
    });
    setServers(nextServers);

    setCloudSyncStatus('syncing');
    try {
      await syncToGoogleSheets(activities, nextServers, {
        announcements,
        isProgramLocked,
        lockedMessage,
        rolesCatalog,
        hoursCatalog,
        serviceAreasCatalog
      });
      setCloudSyncStatus('saved');
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch (e) {
      setCloudSyncStatus('error');
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Sync state to URL and listen to browser Back / Forward buttons
  useEffect(() => {
    const currentPath = window.location.pathname;
    const initialTab = pathToTab(currentPath);

    // Auto-prompt password if user navigates directly to /admin while unauthenticated
    if (initialTab === 'admin' && !isAdminAuthenticated) {
      setAuthModal({
        isOpen: true,
        title: 'Acceso al Área de Modificación',
        description: 'El apartado de administración y modificación requiere contraseña administrativa. Introduce tu clave para continuar.',
        onSuccess: () => {}
      });
    }

    const handlePopState = () => {
      const targetTab = pathToTab(window.location.pathname);
      setCurrentTab(targetTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate to a tab and update the browser URL
  const navigateToTab = (tab, replace = false) => {
    const path = tabToPath(tab);
    if (window.location.pathname !== path) {
      if (replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guard for modification tasks: requires password
  const requireModificationAuth = (callback, modalMeta = {}) => {
    if (isAdminAuthenticated) {
      callback();
    } else {
      setAuthModal({
        isOpen: true,
        title: modalMeta.title || 'Acceso al Área de Modificación',
        description: modalMeta.description || 'Esta sección permite modificar el programa, horarios y servidores. Introduce la clave administrativa.',
        onSuccess: callback
      });
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('youngers_admin_auth_v1', 'true');
    const callback = authModal.onSuccess;
    setAuthModal({ isOpen: false, title: '', description: '', onSuccess: null });
    if (callback) {
      callback();
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('youngers_admin_auth_v1');
    navigateToTab('general');
  };

  // Header tab navigation handler
  const handleHeaderNavigate = (tab) => {
    if (tab === 'admin') {
      requireModificationAuth(() => {
        navigateToTab('admin');
      }, {
        title: 'Acceso a la Administración',
        description: 'El área de administración permite gestionar y modificar el programa, servidores y bloqueo de acceso. Introduce la contraseña administrativa.'
      });
    } else {
      navigateToTab(tab);
    }
  };

  // Activity selection for detail modal
  const handleSelectActivity = (act) => {
    setSelectedActivity(act);
  };

  const handleCloseModal = () => {
    setSelectedActivity(null);
  };

  // Update activity (e.g. check off program items in live view, update observations)
  const handleUpdateActivity = async (updatedAct) => {
    const nextList = activities.map(a => a.id === updatedAct.id ? updatedAct : a);
    setActivities(nextList);
    setSelectedActivity(updatedAct);

    // Enviar y persistir en Google Sheets en segundo plano
    setCloudSyncStatus('syncing');
    try {
      await syncToGoogleSheets(nextList, servers, {
        announcements,
        isProgramLocked,
        lockedMessage,
        rolesCatalog,
        hoursCatalog,
        serviceAreasCatalog
      });
      setCloudSyncStatus('saved');
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch (err) {
      console.warn('Error al sincronizar con Google Sheets:', err.message);
      setCloudSyncStatus('error');
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Jump to Admin to edit (Protected by password)
  const handleEditActivityInAdmin = (activity) => {
    requireModificationAuth(() => {
      setSelectedActivity(null);
      setActivityToEditInAdmin(activity);
      navigateToTab('admin');
    }, {
      title: 'Acceso para Modificar Actividad',
      description: `Modificar "${activity?.title || 'la actividad'}" requiere contraseña administrativa.`
    });
  };

  // Save activity in Admin (add or update) -> Sincronización inmediata en Google Sheets
  const handleSaveActivity = async (activity) => {
    const exists = activities.some(a => a.id === activity.id);
    let nextList;
    if (exists) {
      nextList = activities.map(a => a.id === activity.id ? activity : a);
    } else {
      nextList = [...activities, activity];
    }
    setActivities(nextList);

    setCloudSyncStatus('syncing');
    try {
      await syncToGoogleSheets(nextList, servers, {
        announcements,
        isProgramLocked,
        lockedMessage,
        rolesCatalog,
        hoursCatalog,
        serviceAreasCatalog
      });
      setCloudSyncStatus('saved');
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch (err) {
      console.warn('Error al guardar actividad en Google Sheets:', err.message);
      setCloudSyncStatus('error');
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Delete activity in Admin -> Sincronización inmediata en Google Sheets
  const handleDeleteActivity = (actId) => {
    requireModificationAuth(async () => {
      const nextList = activities.filter(a => a.id !== actId);
      setActivities(nextList);

      setCloudSyncStatus('syncing');
      try {
        await syncToGoogleSheets(nextList, servers, {
          announcements,
          isProgramLocked,
          lockedMessage,
          rolesCatalog,
          hoursCatalog,
          serviceAreasCatalog
        });
        setCloudSyncStatus('saved');
        setTimeout(() => setCloudSyncStatus(null), 3000);
      } catch (err) {
        console.warn('Error al eliminar actividad en Google Sheets:', err.message);
        setCloudSyncStatus('error');
        setTimeout(() => setCloudSyncStatus(null), 4000);
      }
    }, {
      title: 'Eliminar Actividad',
      description: 'Introduce la contraseña administrativa para autorizar la eliminación de esta actividad.'
    });
  };

  // Add new activity button clicked from header (Protected by password)
  const handleNewActivityClick = () => {
    requireModificationAuth(() => {
      setActivityToEditInAdmin(null);
      navigateToTab('admin');
    }, {
      title: 'Acceso para Crear Nueva Actividad',
      description: 'Crear nuevas actividades en el calendario requiere contraseña administrativa.'
    });
  };

  // Server management -> LocalStorage + Auto-Sync to Google Sheets
  const handleAddServer = async (newServer) => {
    let nextRoles = rolesCatalog;
    if (newServer.role && newServer.role.trim() && !rolesCatalog.some(r => r.role?.toLowerCase() === newServer.role.trim().toLowerCase())) {
      nextRoles = [...rolesCatalog, { role: newServer.role.trim(), duties: 'Responsabilidad y función ministerial personalizada.' }];
      setRolesCatalog(nextRoles);
      saveStoredRoles(nextRoles);
    }

    let nextAreas = serviceAreasCatalog;
    const areas = Array.isArray(newServer.primaryAreas) ? newServer.primaryAreas : [];
    const missingAreas = areas.filter(a => a && !nextAreas.some(existing => (typeof existing === 'string' ? existing : existing.name)?.toLowerCase() === a.trim().toLowerCase()));
    if (missingAreas.length > 0) {
      nextAreas = [...nextAreas, ...missingAreas.map(a => ({ name: a.trim(), description: 'Área de servicio ministerial.' }))];
      setServiceAreasCatalog(nextAreas);
      saveStoredServiceAreas(nextAreas);
    }

    const nextServers = [...servers, newServer];
    setServers(nextServers);
    saveStoredServers(nextServers);
    try {
      await syncToGoogleSheets(activities, nextServers, {
        announcements,
        isProgramLocked,
        lockedMessage,
        rolesCatalog: nextRoles,
        hoursCatalog,
        serviceAreasCatalog: nextAreas
      });
    } catch (e) {
      console.warn('Auto-sync add server to sheets error:', e);
    }
  };

  const handleUpdateServer = async (updatedServer) => {
    let nextRoles = rolesCatalog;
    if (updatedServer.role && updatedServer.role.trim() && !rolesCatalog.some(r => r.role?.toLowerCase() === updatedServer.role.trim().toLowerCase())) {
      nextRoles = [...rolesCatalog, { role: updatedServer.role.trim(), duties: 'Responsabilidad y función ministerial personalizada.' }];
      setRolesCatalog(nextRoles);
      saveStoredRoles(nextRoles);
    }

    let nextAreas = serviceAreasCatalog;
    const areas = Array.isArray(updatedServer.primaryAreas) ? updatedServer.primaryAreas : [];
    const missingAreas = areas.filter(a => a && !nextAreas.some(existing => (typeof existing === 'string' ? existing : existing.name)?.toLowerCase() === a.trim().toLowerCase()));
    if (missingAreas.length > 0) {
      nextAreas = [...nextAreas, ...missingAreas.map(a => ({ name: a.trim(), description: 'Área de servicio ministerial.' }))];
      setServiceAreasCatalog(nextAreas);
      saveStoredServiceAreas(nextAreas);
    }

    const nextServers = servers.map(s => s.id === updatedServer.id ? updatedServer : s);
    setServers(nextServers);
    saveStoredServers(nextServers);
    try {
      await syncToGoogleSheets(activities, nextServers, {
        announcements,
        isProgramLocked,
        lockedMessage,
        rolesCatalog: nextRoles,
        hoursCatalog,
        serviceAreasCatalog: nextAreas
      });
    } catch (e) {
      console.warn('Auto-sync update server to sheets error:', e);
    }
  };

  const handleDeleteServer = (serverId) => {
    requireModificationAuth(async () => {
      const nextServers = servers.filter(s => s.id !== serverId);
      setServers(nextServers);
      saveStoredServers(nextServers);
      try {
        await syncToGoogleSheets(activities, nextServers, {
          announcements,
          isProgramLocked,
          lockedMessage,
          rolesCatalog,
          hoursCatalog,
          serviceAreasCatalog
        });
      } catch (e) {
        console.warn('Auto-sync delete server to sheets error:', e);
      }
    }, {
      title: 'Eliminar Servidor',
      description: 'Introduce la contraseña administrativa para autorizar la eliminación de este servidor.'
    });
  };

  // Update announcements -> Sincronización en Google Sheets
  const handleUpdateAnnouncements = async (newAnnouncements) => {
    setAnnouncements(newAnnouncements);
    setCloudSyncStatus('syncing');
    try {
      await syncToGoogleSheets(activities, servers, {
        announcements: newAnnouncements,
        isProgramLocked,
        lockedMessage,
        rolesCatalog,
        hoursCatalog,
        serviceAreasCatalog
      });
      setCloudSyncStatus('saved');
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch (err) {
      console.warn('Error al sincronizar avisos:', err);
      setCloudSyncStatus('error');
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Filter visible activities for the public (hides archived/past/hidden events to avoid confusion)
  const visibleActivities = useMemo(() => {
    return activities.filter(a => !a.isHidden);
  }, [activities]);

  // Program lock toggle per activity -> Sincronización en Google Sheets
  const handleToggleActivityLock = (activityId) => {
    requireModificationAuth(async () => {
      const nextList = activities.map(a => {
        if (a.id === activityId) {
          const nextLock = !Boolean(a.isProgramLocked);
          const updated = { ...a, isProgramLocked: nextLock };
          if (selectedActivity && selectedActivity.id === activityId) {
            setSelectedActivity(updated);
          }
          return updated;
        }
        return a;
      });
      setActivities(nextList);

      setCloudSyncStatus('syncing');
      try {
        await syncToGoogleSheets(nextList, servers, {
          announcements,
          isProgramLocked,
          lockedMessage,
          rolesCatalog,
          hoursCatalog,
          serviceAreasCatalog
        });
        setCloudSyncStatus('saved');
        setTimeout(() => setCloudSyncStatus(null), 3000);
      } catch (err) {
        console.warn('Error al cambiar bloqueo de actividad:', err);
        setCloudSyncStatus('error');
        setTimeout(() => setCloudSyncStatus(null), 4000);
      }
    }, {
      title: 'Control de Acceso al Programa',
      description: 'Introduce la clave administrativa para cambiar el bloqueo del programa de esta actividad.'
    });
  };

  // Activity visibility toggle (hide/show from public view) -> Sincronización en Google Sheets
  const handleToggleActivityVisibility = (activityId) => {
    requireModificationAuth(async () => {
      const nextList = activities.map(a => {
        if (a.id === activityId) {
          const nextHidden = !Boolean(a.isHidden);
          const updated = { ...a, isHidden: nextHidden };
          if (selectedActivity && selectedActivity.id === activityId) {
            setSelectedActivity(updated);
          }
          return updated;
        }
        return a;
      });
      setActivities(nextList);

      setCloudSyncStatus('syncing');
      try {
        await syncToGoogleSheets(nextList, servers, {
          announcements,
          isProgramLocked,
          lockedMessage,
          rolesCatalog,
          hoursCatalog,
          serviceAreasCatalog
        });
        setCloudSyncStatus('saved');
        setTimeout(() => setCloudSyncStatus(null), 3000);
      } catch (err) {
        console.warn('Error al cambiar visibilidad de actividad:', err);
        setCloudSyncStatus('error');
        setTimeout(() => setCloudSyncStatus(null), 4000);
      }
    }, {
      title: 'Visibilidad de la Actividad',
      description: 'Introduce la clave administrativa para cambiar si esta actividad está visible u oculta para el público.'
    });
  };

  // Program lock message update -> Sincronización en Google Sheets
  const handleUpdateLockedMessage = async (newMsg) => {
    setLockedMessage(newMsg);
    setCloudSyncStatus('syncing');
    try {
      await syncToGoogleSheets(activities, servers, {
        announcements,
        isProgramLocked,
        lockedMessage: newMsg,
        rolesCatalog,
        hoursCatalog,
        serviceAreasCatalog
      });
      setCloudSyncStatus('saved');
      setTimeout(() => setCloudSyncStatus(null), 3000);
    } catch (err) {
      console.warn('Error al sincronizar mensaje de bloqueo:', err);
      setCloudSyncStatus('error');
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Pantalla de carga inicial mientras consulta la nube oficial en Google Sheets
  if (isInitialLoading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-content">
          <div className="app-loading-spinner-ring">
            <RefreshCw size={36} className="spin-icon" />
          </div>
          <h2 className="app-loading-title">Youngers ICC</h2>
          <p className="app-loading-desc">Sincronizando actividades y servidores desde la nube...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        onNavigate={handleHeaderNavigate}
        onNewActivity={handleNewActivityClick}
        activitiesCount={isAdminAuthenticated ? activities.length : visibleActivities.length}
        serversCount={servers.length}
        isAdminAuthenticated={isAdminAuthenticated}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main View Area */}
      <main className="main-content-area">
        <div className="container">

          {/* Normal View Routing - Calendar and public views only show visible activities for regular users */}
          <>
            {currentTab === 'general' && (
              <GeneralCalendarView
                activities={visibleActivities}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {currentTab === 'jotapece' && (
              <TimelineVisual
                groupType="jotapece"
                activities={visibleActivities}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {currentTab === 'siervos' && (
              <TimelineVisual
                groupType="siervos"
                activities={visibleActivities}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {currentTab === 'periodos' && (
              <PeriodsHistoryView
                activities={visibleActivities}
                onSelectActivity={handleSelectActivity}
                onNavigateToCalendar={() => navigateToTab('general')}
              />
            )}

            {currentTab === 'servers' && (
              <ServersDirectory
                servers={servers}
                activities={visibleActivities}
                serviceAreasCatalog={serviceAreasCatalog}
                rolesCatalog={rolesCatalog}
                onUpdateRolesCatalog={handleUpdateRolesCatalog}
                onUpdateServiceAreasCatalog={handleUpdateServiceAreasCatalog}
                onAddServer={handleAddServer}
                onUpdateServer={handleUpdateServer}
                onDeleteServer={handleDeleteServer}
                onRequireAuth={requireModificationAuth}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}

            {currentTab === 'participacion' && (
              <ServerParticipationView
                activities={visibleActivities}
                servers={servers}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {currentTab === 'admin' && (
              isAdminAuthenticated ? (
                <AdminPanel
                  activities={activities}
                  servers={servers}
                  onAddServer={handleAddServer}
                  announcements={announcements}
                  rolesCatalog={rolesCatalog}
                  hoursCatalog={hoursCatalog}
                  serviceAreasCatalog={serviceAreasCatalog}
                  onUpdateRolesCatalog={handleUpdateRolesCatalog}
                  onUpdateHoursCatalog={handleUpdateHoursCatalog}
                  onUpdateServiceAreasCatalog={handleUpdateServiceAreasCatalog}
                  onCascadeRenameRole={handleCascadeRenameRole}
                  onCascadeRenameArea={handleCascadeRenameArea}
                  onSaveActivity={handleSaveActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onUpdateAnnouncements={handleUpdateAnnouncements}
                  activityToEdit={activityToEditInAdmin}
                  clearActivityToEdit={() => setActivityToEditInAdmin(null)}
                  lockedMessage={lockedMessage}
                  onUpdateLockedMessage={handleUpdateLockedMessage}
                  onLogoutAdmin={handleAdminLogout}
                  onRequireAuth={requireModificationAuth}
                  onToggleActivityLock={handleToggleActivityLock}
                  onToggleActivityVisibility={handleToggleActivityVisibility}
                  onSyncToSheets={handleSyncToSheets}
                />
              ) : (
                /* Admin Gate if user visits /admin without auth */
                <div className="admin-login-gate-card">
                  <div className="gate-icon-circle">
                    <Lock size={38} />
                  </div>
                  <h3 className="gate-title">Apartado de Modificación Protegido</h3>
                  <p className="gate-desc">
                    Esta sección contiene herramientas para crear, editar y eliminar actividades, cambiar horarios y gestionar el bloqueo del programa. Introduce la contraseña para ingresar.
                  </p>
                  <button 
                    className="btn btn-primary btn-gate-enter"
                    onClick={() => {
                      requireModificationAuth(() => {}, {
                         title: 'Acceso a la Administración',
                         description: 'Introduce la clave administrativa para acceder.'
                      });
                    }}
                  >
                    <Key size={18} />
                    <span>Ingresar Contraseña</span>
                  </button>
                </div>
              )
            )}
          </>
        </div>
      </main>

      {/* Footer Notes (shown on calendar views) */}
      {(currentTab === 'general' || currentTab === 'jotapece' || currentTab === 'siervos') && (
        <FooterNotes announcements={announcements} />
      )}

      {/* Program and Server Responsibilities Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={handleCloseModal}
          onEditActivity={handleEditActivityInAdmin}
          onUpdateActivity={handleUpdateActivity}
          isAdminAuthenticated={isAdminAuthenticated}
          lockedMessage={lockedMessage}
          onRequireAuth={requireModificationAuth}
          onToggleActivityLock={handleToggleActivityLock}
          onToggleActivityVisibility={handleToggleActivityVisibility}
        />
      )}

      {/* Password Authentication Modal for Administrative Actions */}
      <PasswordAuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, title: '', description: '', onSuccess: null })}
        onSuccess={handleAdminAuthSuccess}
        title={authModal.title}
        description={authModal.description}
      />

      {/* Cloud Synchronization Status Toast */}
      {cloudSyncStatus && (
        <div className={`cloud-sync-floating-toast ${cloudSyncStatus}`}>
          {cloudSyncStatus === 'syncing' && (
            <>
              <RefreshCw size={15} className="spin-icon" />
              <span>Guardando en la nube (Google Sheets)...</span>
            </>
          )}
          {cloudSyncStatus === 'saved' && (
            <>
              <Check size={16} />
              <span>Guardado en Google Sheets ✓</span>
            </>
          )}
          {cloudSyncStatus === 'error' && (
            <>
              <AlertCircle size={16} />
              <span>Error de conexión al sincronizar</span>
            </>
          )}
        </div>
      )}

      {/* Floating Scroll-To-Top Button */}
      <ScrollToTopButton />
    </div>
  );
}
