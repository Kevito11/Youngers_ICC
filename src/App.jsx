import React, { useState, useEffect, useRef } from 'react';
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
  saveStoredLockedMessage,
  resetAllToDefaults,
  INITIAL_ACTIVITIES,
  INITIAL_SERVERS,
  INITIAL_ANNOUNCEMENTS,
  DEFAULT_LOCKED_MESSAGE
} from './data/initialData';
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

  // State loaded exclusively from Google Sheets
  const [activities, setActivities] = useState([]);
  const [servers, setServers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isProgramLocked, setIsProgramLocked] = useState(false);
  const [lockedMessage, setLockedMessage] = useState('');
  
  // Cloud loading & sync states
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [sheetsSyncState, setSheetsSyncState] = useState('idle'); // 'idle' | 'syncing' | 'saved' | 'error'
  const [sheetsError, setSheetsError] = useState(null);
  const syncTimerRef = useRef(null);

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

  // Initial load directly from Google Apps Script / Sheet
  const loadFromCloud = async () => {
    setIsLoadingSheets(true);
    setSheetsError(null);
    try {
      // Clear old local cache to guarantee 100% cloud reading
      resetAllToDefaults();

      const data = await fetchFromGoogleSheets();
      if (data && data.success) {
        setActivities(Array.isArray(data.activities) ? data.activities : []);
        setServers(Array.isArray(data.servers) ? data.servers : []);
        setAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
        setIsProgramLocked(Boolean(data.isProgramLocked));
        setLockedMessage(data.lockedMessage || DEFAULT_LOCKED_MESSAGE);
      } else {
        throw new Error(data?.error || 'No se pudieron recuperar los datos de Google Sheets');
      }
    } catch (err) {
      console.error('Error al consultar Google Sheets:', err);
      setSheetsError(err.message || 'Error de conexión con el script de Google Sheets');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  useEffect(() => {
    loadFromCloud();
  }, []);

  // Trigger real-time sync directly to Google Sheets on any mutation
  const triggerCloudSync = async (newActs, newSrvs, extras = {}) => {
    setSheetsSyncState('syncing');
    try {
      await syncToGoogleSheets(
        newActs !== undefined ? newActs : activities,
        newSrvs !== undefined ? newSrvs : servers,
        {
          announcements: extras.announcements !== undefined ? extras.announcements : announcements,
          isProgramLocked: extras.isProgramLocked !== undefined ? extras.isProgramLocked : isProgramLocked,
          lockedMessage: extras.lockedMessage !== undefined ? extras.lockedMessage : lockedMessage
        }
      );
      setSheetsSyncState('saved');
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => setSheetsSyncState('idle'), 3000);
    } catch (err) {
      console.error('Error al sincronizar con Google Sheets:', err);
      setSheetsSyncState('error');
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

  // Update activity (e.g. check off program items in live view - Only Admin)
  const handleUpdateActivity = (updatedAct) => {
    const isAuth = isAdminAuthenticated || sessionStorage.getItem('youngers_admin_auth_v1') === 'true';
    if (!isAuth) return;
    const nextList = activities.map(a => a.id === updatedAct.id ? updatedAct : a);
    setActivities(nextList);
    setSelectedActivity(updatedAct);
    triggerCloudSync(nextList, servers);
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

  // Save activity in Admin (add or update) -> Direct to Google Sheets
  const handleSaveActivity = (activity) => {
    const exists = activities.some(a => a.id === activity.id);
    let nextList;
    if (exists) {
      nextList = activities.map(a => a.id === activity.id ? activity : a);
    } else {
      nextList = [...activities, activity];
    }
    setActivities(nextList);
    triggerCloudSync(nextList, servers);
  };

  // Delete activity in Admin -> Direct to Google Sheets
  const handleDeleteActivity = (actId) => {
    requireModificationAuth(() => {
      const nextList = activities.filter(a => a.id !== actId);
      setActivities(nextList);
      triggerCloudSync(nextList, servers);
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

  // Server management -> Direct to Google Sheets
  const handleAddServer = (newServer) => {
    const nextServers = [...servers, newServer];
    setServers(nextServers);
    triggerCloudSync(activities, nextServers);
  };

  const handleUpdateServer = (updatedServer) => {
    const nextServers = servers.map(s => s.id === updatedServer.id ? updatedServer : s);
    setServers(nextServers);
    triggerCloudSync(activities, nextServers);
  };

  const handleDeleteServer = (serverId) => {
    requireModificationAuth(() => {
      const nextServers = servers.filter(s => s.id !== serverId);
      setServers(nextServers);
      triggerCloudSync(activities, nextServers);
    }, {
      title: 'Eliminar Servidor',
      description: 'Introduce la contraseña administrativa para autorizar la eliminación de este servidor.'
    });
  };

  // Update announcements -> Direct to Google Sheets
  const handleUpdateAnnouncements = (newAnnouncements) => {
    setAnnouncements(newAnnouncements);
    triggerCloudSync(activities, servers, { announcements: newAnnouncements });
  };

  // Program lock toggle per activity -> Direct to Google Sheets
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
      triggerCloudSync(nextList, servers);
    }, {
      title: 'Control de Acceso al Programa',
      description: 'Introduce la clave administrativa para cambiar el bloqueo del programa de esta actividad.'
    });
  };

  // Program lock message update -> Direct to Google Sheets
  const handleUpdateLockedMessage = (newMsg) => {
    setLockedMessage(newMsg);
    triggerCloudSync(activities, servers, { lockedMessage: newMsg });
  };

  // Reset defaults -> Seeds full official calendar to Google Sheets
  const handleResetDefaults = async () => {
    setActivities(INITIAL_ACTIVITIES);
    setServers(INITIAL_SERVERS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setIsProgramLocked(false);
    setLockedMessage(DEFAULT_LOCKED_MESSAGE);
    await triggerCloudSync(INITIAL_ACTIVITIES, INITIAL_SERVERS, {
      announcements: INITIAL_ANNOUNCEMENTS,
      isProgramLocked: false,
      lockedMessage: DEFAULT_LOCKED_MESSAGE
    });
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
        sheetsSyncState={sheetsSyncState}
      />

      {/* Cloud Error Alert if offline or connection issue */}
      {sheetsError && (
        <div className="container" style={{ marginTop: '1rem' }}>
          <div className="sheets-error-banner">
            <div>
              <strong>⚠️ Conexión con Google Sheets:</strong> {sheetsError}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadFromCloud}>
              Reintentar Conexión
            </button>
          </div>
        </div>
      )}

      {/* Cloud Loading Screen on initial fetch */}
      {isLoadingSheets ? (
        <div className="sheets-loading-screen">
          <div className="sheets-loading-card">
            <div className="sheets-spinner"></div>
            <h3>Cargando datos desde Google Sheets...</h3>
            <p>Conectando con tu hoja de cálculo para leer en vivo todas las listas de actividades y servidores.</p>
          </div>
        </div>
      ) : (
        <>
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
                    onSaveActivity={handleSaveActivity}
                    onDeleteActivity={handleDeleteActivity}
                    onResetDefaults={handleResetDefaults}
                    onUpdateAnnouncements={handleUpdateAnnouncements}
                    activityToEdit={activityToEditInAdmin}
                    clearActivityToEdit={() => setActivityToEditInAdmin(null)}
                    lockedMessage={lockedMessage}
                    onUpdateLockedMessage={handleUpdateLockedMessage}
                    onLogoutAdmin={handleAdminLogout}
                    onRequireAuth={requireModificationAuth}
                    onToggleActivityLock={handleToggleActivityLock}
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
        </>
      )}
    </div>
  );
}
