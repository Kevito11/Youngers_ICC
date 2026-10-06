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
    default: return '/calendario';
  }
};

export default function App() {
  // Read initial tab from URL pathname
  const [currentTab, setCurrentTab] = useState(() => {
    return pathToTab(window.location.pathname);
  });

  const [activities, setActivities] = useState(() => loadStoredActivities());
  const [servers, setServers] = useState(() => loadStoredServers());
  const [announcements, setAnnouncements] = useState(() => loadStoredAnnouncements());
  
  // Program lock state (controlled from Admin)
  const [isProgramLocked, setIsProgramLocked] = useState(() => loadStoredProgramLocked());
  const [lockedMessage, setLockedMessage] = useState(() => loadStoredLockedMessage());

  // Password authentication state for modification (temp pwd: 1234)
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

  // Sync state to URL and listen to browser Back / Forward buttons
  useEffect(() => {
    const currentPath = window.location.pathname;
    const initialTab = pathToTab(currentPath);
    // If user opened root '/', normalize to '/calendario' so the URL is never stuck at root
    if (currentPath === '/' || currentPath === '') {
      window.history.replaceState(null, '', tabToPath(initialTab));
    }

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

  // Sync to localStorage
  useEffect(() => {
    saveStoredActivities(activities);
  }, [activities]);

  useEffect(() => {
    saveStoredServers(servers);
  }, [servers]);

  useEffect(() => {
    saveStoredAnnouncements(announcements);
  }, [announcements]);

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

  // Update activity (e.g. check off program items in live view)
  const handleUpdateActivity = (updatedAct) => {
    const nextList = activities.map(a => a.id === updatedAct.id ? updatedAct : a);
    setActivities(nextList);
    setSelectedActivity(updatedAct);
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

  // Save activity in Admin (add or update)
  const handleSaveActivity = (activity) => {
    const exists = activities.some(a => a.id === activity.id);
    let nextList;
    if (exists) {
      nextList = activities.map(a => a.id === activity.id ? activity : a);
    } else {
      nextList = [...activities, activity];
    }
    setActivities(nextList);
  };

  // Delete activity in Admin (Protected by administrative password)
  const handleDeleteActivity = (actId) => {
    requireModificationAuth(() => {
      const nextList = activities.filter(a => a.id !== actId);
      setActivities(nextList);
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

  // Server management
  const handleAddServer = (newServer) => {
    setServers([...servers, newServer]);
  };

  const handleUpdateServer = (updatedServer) => {
    setServers(servers.map(s => s.id === updatedServer.id ? updatedServer : s));
  };

  const handleDeleteServer = (serverId) => {
    requireModificationAuth(() => {
      setServers(servers.filter(s => s.id !== serverId));
    }, {
      title: 'Eliminar Servidor',
      description: 'Introduce la contraseña administrativa para autorizar la eliminación de este servidor.'
    });
  };

  // Update announcements
  const handleUpdateAnnouncements = (newAnnouncements) => {
    setAnnouncements(newAnnouncements);
  };

  // Program lock toggle
  const handleToggleProgramLocked = () => {
    const nextState = !isProgramLocked;
    setIsProgramLocked(nextState);
    saveStoredProgramLocked(nextState);
  };

  // Program lock message update
  const handleUpdateLockedMessage = (newMsg) => {
    setLockedMessage(newMsg);
    saveStoredLockedMessage(newMsg);
  };

  // Reset defaults
  const handleResetDefaults = () => {
    resetAllToDefaults();
    setActivities(INITIAL_ACTIVITIES);
    setServers(INITIAL_SERVERS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setIsProgramLocked(false);
    setLockedMessage(DEFAULT_LOCKED_MESSAGE);
  };

  // Should we show the locked screen?
  // When program is locked AND user is NOT authenticated as admin AND not in admin route
  const shouldShowLockedScreen = isProgramLocked && !isAdminAuthenticated && currentTab !== 'admin';

  return (
    <div className="app-root">
      {/* Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        onNavigate={handleHeaderNavigate}
        onNewActivity={handleNewActivityClick}
        activitiesCount={activities.length}
        serversCount={servers.length}
        isProgramLocked={isProgramLocked}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Main View Area */}
      <main className="main-content-area">
        <div className="container">
          {/* Admin banner if viewing while program is locked */}
          {isProgramLocked && isAdminAuthenticated && (
            <div className="admin-locked-notice-banner">
              <div className="banner-notice-inner">
                <Lock size={18} />
                <span>
                  <strong>Aviso de Administración:</strong> El acceso público al programa está actualmente <strong>bloqueado</strong> (no listo para el público). Como administrador autenticado, puedes visualizar y modificar las actividades.
                </span>
              </div>
              <button 
                className="btn-unlock-quick"
                onClick={handleToggleProgramLocked}
                title="Habilitar acceso público ahora"
              >
                Desbloquear Acceso Público
              </button>
            </div>
          )}

          {/* 1. If program is locked and user is a normal visitor */}
          {shouldShowLockedScreen ? (
            <ProgramLockedScreen
              lockedMessage={lockedMessage}
              onOpenAdminLogin={() => {
                requireModificationAuth(() => {
                  navigateToTab('admin');
                }, {
                  title: 'Acceso de Administrador',
                  description: 'Introduce la clave de administración para acceder al panel de control y preparar o desbloquear el programa.'
                });
              }}
            />
          ) : (
            /* 2. Normal View Routing */
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
                    isProgramLocked={isProgramLocked}
                    onToggleProgramLocked={handleToggleProgramLocked}
                    lockedMessage={lockedMessage}
                    onUpdateLockedMessage={handleUpdateLockedMessage}
                    onLogoutAdmin={handleAdminLogout}
                    onRequireAuth={requireModificationAuth}
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
          )}
        </div>
      </main>

      {/* Footer Notes (shown on calendar views when not locked) */}
      {!shouldShowLockedScreen && (currentTab === 'general' || currentTab === 'jotapece' || currentTab === 'siervos') && (
        <FooterNotes announcements={announcements} />
      )}

      {/* Program and Server Responsibilities Modal */}
      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={handleCloseModal}
          onEditActivity={handleEditActivityInAdmin}
          onUpdateActivity={handleUpdateActivity}
        />
      )}

      {/* Password Authentication Modal for Modification (Pwd: 1234) */}
      <PasswordAuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, title: '', description: '', onSuccess: null })}
        onSuccess={handleAdminAuthSuccess}
        title={authModal.title}
        description={authModal.description}
      />
    </div>
  );
}
