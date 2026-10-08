import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GeneralCalendarView from './components/GeneralCalendarView';
import TimelineVisual from './components/TimelineVisual';
import ActivityDetailModal from './components/ActivityDetailModal';
import ServersDirectory from './components/ServersDirectory';
import AdminPanel from './components/AdminPanel';
import PeriodsHistoryView from './components/PeriodsHistoryView';
import FooterNotes from './components/FooterNotes';
import PasswordAuthModal from './components/PasswordAuthModal';
import ProgramLockedScreen from './components/ProgramLockedScreen';
import ScrollToTopButton from './components/ScrollToTopButton';
import { Lock, Key } from './components/Icons';

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
  if (p === '/admin' || p === '/administrador') return 'admin';
  return 'general'; // Default for '/', '/calendario', '/general'
};

const tabToPath = (tab) => {
  switch (tab) {
    case 'jotapece': return '/jotapece';
    case 'siervos': return '/siervos';
    case 'periodos': return '/periodos';
    case 'servers': return '/servidores';
    case 'admin': return '/admin';
    default: return '/';
  }
};

export default function App() {
  // Read initial tab from URL pathname
  const [currentTab, setCurrentTab] = useState(() => {
    return pathToTab(window.location.pathname);
  });

  // State loaded internally from localStorage (or initial defaults)
  const [activities, setActivities] = useState(() => loadStoredActivities());
  const [servers, setServers] = useState(() => loadStoredServers());
  const [announcements, setAnnouncements] = useState(() => loadStoredAnnouncements());
  const [isProgramLocked, setIsProgramLocked] = useState(() => loadStoredProgramLocked());
  const [lockedMessage, setLockedMessage] = useState(() => loadStoredLockedMessage());

  // Dynamic Catalogs State (Synchronized with Google Sheets)
  const [rolesCatalog, setRolesCatalog] = useState(() => loadStoredRoles());
  const [hoursCatalog, setHoursCatalog] = useState(() => loadStoredHours());
  const [serviceAreasCatalog, setServiceAreasCatalog] = useState(() => loadStoredServiceAreas());

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

  // Sincronización en segundo plano con Google Sheets para que los visitantes reciban siempre los datos más actualizados
  useEffect(() => {
    let isMounted = true;
    const fetchLatestFromSheets = async () => {
      try {
        const data = await fetchFromGoogleSheets();
        if (data && data.success && isMounted) {
          if (Array.isArray(data.activities) && data.activities.length > 0) {
            setActivities(data.activities);
            saveStoredActivities(data.activities);
          }
          if (Array.isArray(data.servers) && data.servers.length > 0) {
            setServers(data.servers);
            saveStoredServers(data.servers);
          }
          if (Array.isArray(data.announcements)) {
            setAnnouncements(data.announcements);
            saveStoredAnnouncements(data.announcements);
          }
          if (Array.isArray(data.rolesCatalog) && data.rolesCatalog.length > 0) {
            setRolesCatalog(data.rolesCatalog);
            saveStoredRoles(data.rolesCatalog);
          }
          if (Array.isArray(data.hoursCatalog) && data.hoursCatalog.length > 0) {
            setHoursCatalog(data.hoursCatalog);
            saveStoredHours(data.hoursCatalog);
          }
          if (Array.isArray(data.serviceAreasCatalog) && data.serviceAreasCatalog.length > 0) {
            setServiceAreasCatalog(data.serviceAreasCatalog);
            saveStoredServiceAreas(data.serviceAreasCatalog);
          }
          if (data.isProgramLocked !== undefined) {
            setIsProgramLocked(Boolean(data.isProgramLocked));
            saveStoredProgramLocked(Boolean(data.isProgramLocked));
          }
          if (data.lockedMessage) {
            setLockedMessage(data.lockedMessage);
            saveStoredLockedMessage(data.lockedMessage);
          }
        }
      } catch (err) {
        console.warn('Uso de almacenamiento local (sin conexión a Google Sheets):', err.message);
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
  };

  const handleUpdateHoursCatalog = (next) => {
    setHoursCatalog(next);
    saveStoredHours(next);
  };

  const handleUpdateServiceAreasCatalog = (next) => {
    setServiceAreasCatalog(next);
    saveStoredServiceAreas(next);
  };

  // Renombrado en cascada para roles
  const handleCascadeRenameRole = (oldRole, newRole) => {
    const nextServers = servers.map(s => s.role === oldRole ? { ...s, role: newRole } : s);
    setServers(nextServers);
    saveStoredServers(nextServers);

    const nextActivities = activities.map(act => ({
      ...act,
      serverAssignments: (act.serverAssignments || []).map(asg => asg.role === oldRole ? { ...asg, role: newRole } : asg)
    }));
    setActivities(nextActivities);
    saveStoredActivities(nextActivities);
  };

  // Renombrado en cascada para áreas de servicio
  const handleCascadeRenameArea = (oldArea, newArea) => {
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
    saveStoredServers(nextServers);
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

  // Update activity (e.g. check off program items in live view - Only Admin)
  const handleUpdateActivity = (updatedAct) => {
    const isAuth = isAdminAuthenticated || sessionStorage.getItem('youngers_admin_auth_v1') === 'true';
    if (!isAuth) return;
    const nextList = activities.map(a => a.id === updatedAct.id ? updatedAct : a);
    setActivities(nextList);
    setSelectedActivity(updatedAct);
    saveStoredActivities(nextList);
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

  // Save activity in Admin (add or update) -> LocalStorage
  const handleSaveActivity = (activity) => {
    const exists = activities.some(a => a.id === activity.id);
    let nextList;
    if (exists) {
      nextList = activities.map(a => a.id === activity.id ? activity : a);
    } else {
      nextList = [...activities, activity];
    }
    setActivities(nextList);
    saveStoredActivities(nextList);
  };

  // Delete activity in Admin -> LocalStorage
  const handleDeleteActivity = (actId) => {
    requireModificationAuth(() => {
      const nextList = activities.filter(a => a.id !== actId);
      setActivities(nextList);
      saveStoredActivities(nextList);
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

  // Server management -> LocalStorage
  const handleAddServer = (newServer) => {
    const nextServers = [...servers, newServer];
    setServers(nextServers);
    saveStoredServers(nextServers);
  };

  const handleUpdateServer = (updatedServer) => {
    const nextServers = servers.map(s => s.id === updatedServer.id ? updatedServer : s);
    setServers(nextServers);
    saveStoredServers(nextServers);
  };

  const handleDeleteServer = (serverId) => {
    requireModificationAuth(() => {
      const nextServers = servers.filter(s => s.id !== serverId);
      setServers(nextServers);
      saveStoredServers(nextServers);
    }, {
      title: 'Eliminar Servidor',
      description: 'Introduce la contraseña administrativa para autorizar la eliminación de este servidor.'
    });
  };

  // Update announcements -> LocalStorage
  const handleUpdateAnnouncements = (newAnnouncements) => {
    setAnnouncements(newAnnouncements);
    saveStoredAnnouncements(newAnnouncements);
  };

  // Program lock toggle per activity -> LocalStorage
  const handleToggleActivityLock = (activityId) => {
    requireModificationAuth(() => {
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
      saveStoredActivities(nextList);
    }, {
      title: 'Control de Acceso al Programa',
      description: 'Introduce la clave administrativa para cambiar el bloqueo del programa de esta actividad.'
    });
  };

  // Program lock message update -> LocalStorage
  const handleUpdateLockedMessage = (newMsg) => {
    setLockedMessage(newMsg);
    saveStoredLockedMessage(newMsg);
  };

  return (
    <div className="app-root">
      {/* Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        onNavigate={handleHeaderNavigate}
        onNewActivity={handleNewActivityClick}
        activitiesCount={activities.length}
        serversCount={servers.length}
        isAdminAuthenticated={isAdminAuthenticated}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main View Area */}
      <main className="main-content-area">
        <div className="container">

          {/* Normal View Routing - Calendar is always visible */}
          <>
            {currentTab === 'general' && (
              <GeneralCalendarView
                activities={activities}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {currentTab === 'jotapece' && (
              <TimelineVisual
                groupType="jotapece"
                activities={activities}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {currentTab === 'siervos' && (
              <TimelineVisual
                groupType="siervos"
                activities={activities}
                onSelectActivity={handleSelectActivity}
              />
            )}

            {currentTab === 'periodos' && (
              <PeriodsHistoryView
                activities={activities}
                onSelectActivity={handleSelectActivity}
                onNavigateToCalendar={() => navigateToTab('general')}
              />
            )}

            {currentTab === 'servers' && (
              <ServersDirectory
                servers={servers}
                activities={activities}
                serviceAreasCatalog={serviceAreasCatalog}
                rolesCatalog={rolesCatalog}
                onAddServer={handleAddServer}
                onUpdateServer={handleUpdateServer}
                onDeleteServer={handleDeleteServer}
                onRequireAuth={requireModificationAuth}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}

            {currentTab === 'admin' && (
              isAdminAuthenticated ? (
                <AdminPanel
                  activities={activities}
                  servers={servers}
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

      {/* Floating Scroll-To-Top Button */}
      <ScrollToTopButton />
    </div>
  );
}
