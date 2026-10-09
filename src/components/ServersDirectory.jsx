import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Search, Phone, Mail, X, Check, ArrowLeft, Shield, User, Sparkles,
  List, LayoutGrid, ChevronDown, ChevronUp
} from './Icons';
import UnsavedChangesModal from './UnsavedChangesModal';
import { loadStoredRoles, loadStoredServiceAreas } from '../data/catalogs';

export default function ServersDirectory({ 
  servers, 
  activities,
  serviceAreasCatalog,
  rolesCatalog,
  onUpdateRolesCatalog,
  onUpdateServiceAreasCatalog,
  onAddServer, 
  onUpdateServer, 
  onDeleteServer,
  onRequireAuth,
  isAdminAuthenticated
}) {
  const [filterGroup, setFilterGroup] = useState('all'); // all | jotapece | siervos | ambos
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryViewMode, setDirectoryViewMode] = useState('cards'); // 'cards' | 'list'
  const [editingServer, setEditingServer] = useState(null); // null or server object
  const [isCreating, setIsCreating] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const overlayMouseDownRef = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    role: '',
    groups: ['jotapece'],
    primaryAreas: [],
    phone: '',
    email: '',
    active: true
  });
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [isAreasExpanded, setIsAreasExpanded] = useState(false);

  // Consolidar dinámicamente los roles disponibles desde el catálogo sincronizado con Google Sheets
  const storedRoles = (rolesCatalog && rolesCatalog.length > 0) ? rolesCatalog : (loadStoredRoles() || []);
  const storedRoleNames = storedRoles.map(r => r.role).filter(Boolean);
  const existingServerRoles = (servers || []).map(s => s.role).filter(Boolean);
  const allAvailableRoles = Array.from(new Set([
    ...storedRoleNames,
    ...existingServerRoles
  ])).filter(Boolean);

  // Dynamically consolidate all available service areas for multi-select (from synchronized catalog)
  const storedAreas = (serviceAreasCatalog && serviceAreasCatalog.length > 0) ? serviceAreasCatalog : (loadStoredServiceAreas() || []);
  const storedAreaNames = storedAreas.map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
  const existingServerAreas = (servers || []).flatMap(s => 
    Array.isArray(s.primaryAreas) 
      ? s.primaryAreas 
      : (typeof s.primaryAreas === 'string' ? s.primaryAreas.split(',').map(a => a.trim()).filter(Boolean) : [])
  );
  const selectedAreas = Array.isArray(formData.primaryAreas) ? formData.primaryAreas : [];
  const allAvailableAreas = Array.from(new Set([
    ...storedAreaNames,
    ...existingServerAreas,
    ...selectedAreas
  ])).filter(Boolean);

  const initialFormRef = useRef(formData);

  const isDirty = (
    formData.name !== initialFormRef.current.name ||
    formData.nickname !== initialFormRef.current.nickname ||
    (isCustomRole ? customRoleInput : formData.role) !== initialFormRef.current.role ||
    JSON.stringify(formData.primaryAreas) !== JSON.stringify(initialFormRef.current.primaryAreas) ||
    formData.phone !== initialFormRef.current.phone ||
    formData.email !== initialFormRef.current.email ||
    JSON.stringify(formData.groups) !== JSON.stringify(initialFormRef.current.groups)
  );

  // Prevent background scroll when modal is active
  useEffect(() => {
    if (isCreating || editingServer) {
      const origOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = origOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isCreating, editingServer]);

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      setIsCreating(false);
      setEditingServer(null);
    }
  };

  // Esc key listener for modal
  useEffect(() => {
    if (!isCreating && !editingServer) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showUnsavedPrompt) {
          setShowUnsavedPrompt(false);
        } else {
          handleAttemptClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, editingServer, isDirty, showUnsavedPrompt]);

  const openCreateModal = () => {
    const defaultRole = 'Servidor de Apoyo General';
    const defaultAreas = ['Logística y Montaje', 'Recepción y Bienvenida'];
    const initData = {
      name: '',
      nickname: '',
      role: defaultRole,
      groups: ['jotapece'],
      primaryAreas: defaultAreas,
      phone: '',
      email: '',
      active: true
    };
    setFormData(initData);
    initialFormRef.current = initData;
    setIsCustomRole(false);
    setCustomRoleInput('');
    setCustomAreaInput('');
    setIsAreasExpanded(false);
    setIsCreating(true);
  };

  const handleCreateClick = () => {
    if (onRequireAuth) {
      onRequireAuth(() => openCreateModal(), {
        title: 'Acceso para Agregar Servidor',
        description: 'Introduce la contraseña administrativa para registrar a un nuevo servidor en el sistema.'
      });
    } else {
      openCreateModal();
    }
  };

  const openEditModal = (server) => {
    setEditingServer(server);
    const parsedAreas = Array.isArray(server.primaryAreas)
      ? [...server.primaryAreas]
      : (typeof server.primaryAreas === 'string' && server.primaryAreas.trim()
          ? server.primaryAreas.split(',').map(s => s.trim()).filter(Boolean)
          : []);

    const srvRole = server.role || 'Servidor de Apoyo General';
    const initData = {
      name: server.name || '',
      nickname: server.nickname || '',
      role: srvRole,
      groups: Array.isArray(server.groups) ? [...server.groups] : ['jotapece'],
      primaryAreas: parsedAreas,
      phone: server.phone || '',
      email: server.email || '',
      active: server.active !== false
    };
    setFormData(initData);
    initialFormRef.current = initData;
    setIsCustomRole(false);
    setCustomRoleInput('');
    setCustomAreaInput('');
    setIsAreasExpanded(false);
  };

  const handleEditClick = (server) => {
    if (onRequireAuth) {
      onRequireAuth(() => openEditModal(server), {
        title: 'Acceso para Editar Servidor',
        description: `Introduce la contraseña administrativa para modificar los datos de ${server.name}.`
      });
    } else {
      openEditModal(server);
    }
  };

  const handleDeleteClick = (server) => {
    const executeDelete = () => {
      if (confirm(`¿Seguro que deseas eliminar permanentemente a "${server.name}" del directorio?`)) {
        onDeleteServer(server.id);
      }
    };

    if (onRequireAuth) {
      onRequireAuth(executeDelete, {
        title: 'Eliminar Servidor',
        description: `Introduce la contraseña administrativa para autorizar la eliminación de "${server.name}".`
      });
    } else {
      executeDelete();
    }
  };

  const handleSaveForm = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor ingresa el nombre del servidor');
      return;
    }

    const effectiveRole = (isCustomRole ? customRoleInput.trim() : formData.role.trim()) || 'Servidor de Apoyo General';

    const areasArray = Array.isArray(formData.primaryAreas)
      ? formData.primaryAreas
      : (formData.primaryAreas || '').split(',').map(s => s.trim()).filter(Boolean);

    // Auto-registrar el rol en el catálogo oficial si es nuevo o personalizado
    if (effectiveRole && !storedRoleNames.some(r => r.toLowerCase() === effectiveRole.toLowerCase())) {
      const newRoleObj = {
        role: effectiveRole,
        duties: 'Responsabilidad y función ministerial personalizada.'
      };
      if (onUpdateRolesCatalog) {
        onUpdateRolesCatalog([...storedRoles, newRoleObj]);
      }
    }

    // Auto-registrar áreas nuevas en el catálogo oficial de áreas
    const newAreasToAdd = areasArray.filter(
      areaName => !storedAreaNames.some(existing => existing.toLowerCase() === areaName.toLowerCase())
    );
    if (newAreasToAdd.length > 0 && onUpdateServiceAreasCatalog) {
      const updatedAreasList = [
        ...storedAreas,
        ...newAreasToAdd.map(name => ({ name, description: 'Área de servicio ministerial.' }))
      ];
      onUpdateServiceAreasCatalog(updatedAreasList);
    }

    if (isCreating) {
      const newServer = {
        id: `srv-${Date.now()}`,
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        role: effectiveRole,
        groups: formData.groups,
        primaryAreas: areasArray,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        active: formData.active
      };
      onAddServer(newServer);
      setIsCreating(false);
      setShowUnsavedPrompt(false);
    } else if (editingServer) {
      const updated = {
        ...editingServer,
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        role: effectiveRole,
        groups: formData.groups,
        primaryAreas: areasArray,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        active: formData.active
      };
      onUpdateServer(updated);
      setEditingServer(null);
      setShowUnsavedPrompt(false);
    }
  };

  // Find activities assigned to this server
  const getAssignmentsForServer = (serverId, serverName) => {
    const list = [];
    activities.forEach(act => {
      (act.serverAssignments || []).forEach(assignment => {
        if (
          assignment.serverId === serverId || 
          (assignment.serverName && assignment.serverName.toLowerCase() === serverName.toLowerCase())
        ) {
          list.push({
            activityTitle: act.title,
            day: `${act.dayOfWeek} ${act.dayNumber} ${act.month}`,
            group: act.group,
            role: assignment.role
          });
        }
      });
    });
    return list;
  };

  // Filter servers
  const filteredServers = servers.filter(server => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = server.name?.toLowerCase().includes(q);
      const matchRole = server.role?.toLowerCase().includes(q);
      const matchAreas = Array.isArray(server.primaryAreas) 
        ? server.primaryAreas.some(a => a.toLowerCase().includes(q))
        : false;
      if (!matchName && !matchRole && !matchAreas) return false;
    }

    if (filterGroup === 'all') return true;
    if (filterGroup === 'jotapece') return server.groups?.includes('jotapece');
    if (filterGroup === 'siervos') return server.groups?.includes('siervos');
    if (filterGroup === 'ambos') return server.groups?.includes('jotapece') && server.groups?.includes('siervos');
    return true;
  });

  return (
    <div className="servers-directory-page">
      {/* Title */}
      <div className="directory-header-row">
        <div>
          <h2 className="directory-title">Equipo de Servidores Youngers</h2>
          <p className="directory-subtitle">
            Líderes y servidores asignados en los ministerios de Jotapece (JPC) y Siervos (121).
          </p>
        </div>

        {isAdminAuthenticated && (
          <button className="btn btn-primary" onClick={handleCreateClick}>
            <Plus size={18} />
            <span>Agregar Servidor</span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="directory-filters-bar">
        <div className="filter-chips-list">
          <button 
            className={`filter-chip ${filterGroup === 'all' ? 'active' : ''}`}
            onClick={() => setFilterGroup('all')}
          >
            Todos ({servers.length})
          </button>
          <button 
            className={`filter-chip chip-jpc ${filterGroup === 'jotapece' ? 'active' : ''}`}
            onClick={() => setFilterGroup('jotapece')}
          >
            Jotapece (JPC)
          </button>
          <button 
            className={`filter-chip chip-siervos ${filterGroup === 'siervos' ? 'active' : ''}`}
            onClick={() => setFilterGroup('siervos')}
          >
            Siervos (121)
          </button>
          <button 
            className={`filter-chip chip-ambos ${filterGroup === 'ambos' ? 'active' : ''}`}
            onClick={() => setFilterGroup('ambos')}
          >
            Ambos Grupos
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, cargo o ministerio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* View Switcher and Server Count Bar */}
      <div className="directory-controls-row">
        <span className="directory-count-text">
          Mostrando <strong>{filteredServers.length}</strong> {filteredServers.length === 1 ? 'colaborador' : 'colaboradores'}
        </span>

        <div className="view-toggle-pills" role="group" aria-label="Cambiar vista de servidores">
          <button 
            type="button" 
            className={`view-toggle-btn ${directoryViewMode === 'list' ? 'active' : ''}`}
            onClick={() => setDirectoryViewMode('list')}
            title="Vista compacta en lista"
          >
            <List size={14} />
            <span>Lista</span>
          </button>
          <button 
            type="button" 
            className={`view-toggle-btn ${directoryViewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setDirectoryViewMode('cards')}
            title="Vista en tarjetas completas"
          >
            <LayoutGrid size={14} />
            <span>Tarjetas</span>
          </button>
        </div>
      </div>

      {filteredServers.length === 0 ? (
        <div className="empty-sub-state">
          <p>No se encontraron servidores con los filtros aplicados.</p>
        </div>
      ) : directoryViewMode === 'list' ? (
        /* Compact List View */
        <div className="compact-directory-list">
          {filteredServers.map(server => {
            const assignments = getAssignmentsForServer(server.id, server.name);

            return (
              <div key={server.id} className="compact-dir-row">
                <div className="compact-dir-left">
                  <div className="compact-dir-avatar">
                    <span>{server.name.charAt(0)}</span>
                  </div>
                  <div className="compact-dir-identity">
                    <div className="compact-dir-name-line">
                      <strong className="compact-dir-name">{server.name}</strong>
                      {server.nickname && (
                        <span className="compact-dir-nickname">({server.nickname})</span>
                      )}
                    </div>
                    <span className="compact-dir-role">{server.role}</span>
                  </div>
                </div>

                <div className="compact-dir-right">
                  <div className="compact-dir-groups">
                    {server.groups?.includes('jotapece') && (
                      <span className="group-pill-sm pill-jpc">JPC</span>
                    )}
                    {server.groups?.includes('siervos') && (
                      <span className="group-pill-sm pill-siervos">121</span>
                    )}
                  </div>

                  <span className="compact-dir-asg-pill" title={`${assignments.length} asignaciones en calendario`}>
                    {assignments.length} {assignments.length === 1 ? 'asignación' : 'asignaciones'}
                  </span>

                  {server.phone && (
                    <a 
                      href={`https://wa.me/1${server.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="compact-whatsapp-link"
                      title={`WhatsApp: ${server.phone}`}
                    >
                      <Phone size={13} />
                      <span className="desktop-inline">{server.phone}</span>
                    </a>
                  )}

                  {isAdminAuthenticated && (
                    <div className="compact-dir-actions">
                      <button 
                        type="button"
                        className="icon-action-btn"
                        onClick={() => handleEditClick(server)}
                        title="Editar servidor"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        type="button"
                        className="icon-action-btn btn-danger"
                        onClick={() => handleDeleteClick(server)}
                        title="Eliminar servidor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Grid of Servers */
        <div className="servers-cards-grid">
          {filteredServers.map(server => {
            const assignments = getAssignmentsForServer(server.id, server.name);

            return (
              <div key={server.id} className="server-profile-card">
                <div className="card-top-row">
                  <div className="server-avatar-circle">
                    <span>{server.name.charAt(0)}</span>
                  </div>

                  {isAdminAuthenticated && (
                    <div className="card-actions-group">
                      <button 
                        className="icon-action-btn"
                        onClick={() => handleEditClick(server)}
                        title="Editar servidor"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="icon-action-btn btn-danger"
                        onClick={() => handleDeleteClick(server)}
                        title="Eliminar servidor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="server-info-main">
                  <h3 className="server-name">
                    {server.name}
                    {server.nickname && <span className="server-nickname"> ({server.nickname})</span>}
                  </h3>
                  <span className="server-role-badge">{server.role}</span>
                </div>

                {/* Group pills */}
                <div className="server-groups-row">
                  {server.groups?.includes('jotapece') && (
                    <span className="group-pill-sm pill-jpc">Jotapece</span>
                  )}
                  {server.groups?.includes('siervos') && (
                    <span className="group-pill-sm pill-siervos">Siervos</span>
                  )}
                </div>

                {/* Ministry Areas */}
                <div className="server-areas-box">
                  <span className="areas-label">Áreas de servicio:</span>
                  <div className="areas-tags-list">
                    {(server.primaryAreas || []).map((area, idx) => (
                      <span key={idx} className="area-tag">{area}</span>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div className="server-contact-box">
                  {server.phone && (
                    <a 
                      href={`https://wa.me/1${server.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="contact-item-link"
                      title="Enviar WhatsApp"
                    >
                      <Phone size={14} />
                      <span>{server.phone}</span>
                    </a>
                  )}
                  {server.email && (
                    <div className="contact-item">
                      <Mail size={14} />
                      <span>{server.email}</span>
                    </div>
                  )}
                </div>

                {/* Upcoming Assignments in the Calendar */}
                <div className="server-assignments-preview">
                  <div className="assignments-title-row">
                    <span className="as-title">Asignaciones en calendario:</span>
                    <span className="as-count">{assignments.length}</span>
                  </div>
                  {assignments.length === 0 ? (
                    <span className="as-empty">Sin asignaciones registradas</span>
                  ) : (
                    <ul className="as-mini-list">
                      {assignments.slice(0, 3).map((asg, idx) => (
                        <li key={idx} className="as-mini-item">
                          <span className="as-day">{asg.day}:</span>
                          <strong className="as-role">{asg.role}</strong>
                        </li>
                      ))}
                      {assignments.length > 3 && (
                        <li className="as-more">+{assignments.length - 3} fechas más...</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating or Editing a Server */}
      {(isCreating || editingServer) && (
        <div 
          className="modal-overlay server-modal-overlay" 
          onMouseDown={e => {
            overlayMouseDownRef.current = (e.target === e.currentTarget);
          }}
          onClick={e => {
            if (e.target === e.currentTarget && overlayMouseDownRef.current) {
              handleAttemptClose();
            }
            overlayMouseDownRef.current = false;
          }}
        >
          <div 
            className="modal-container server-modal-container" 
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="modal-header server-modal-header">
              <div className="modal-meta-top">
                <span className="modal-group-badge badge-ambos">
                  <User size={13} />
                  <span>Directorio Ministerial Youngers</span>
                </span>
                <span className="modal-date-pill">
                  {isCreating ? 'Nuevo Registro' : 'Edición de Perfil'}
                </span>
              </div>

              <div className="modal-title-row">
                <div className="server-modal-title-box">
                  <h3 className="modal-title">
                    {isCreating ? 'Agregar Nuevo Servidor' : `Editar: ${formData.name || 'Servidor'}`}
                  </h3>
                  <p className="server-modal-subtitle">
                    {isCreating 
                      ? 'Registra a un nuevo líder o servidor asignándolo a sus respectivos grupos ministeriales.' 
                      : 'Actualiza los datos de contacto, rol y ministerios del servidor.'}
                  </p>
                </div>
                <button 
                  type="button"
                  className="modal-close-btn"
                  onClick={handleAttemptClose}
                  title="Cerrar ventana [Esc]"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="server-form-body">
              <div className="server-form-grid">
                {/* Col 1 */}
                <div className="form-group">
                  <label htmlFor="srv-name">Nombre Completo *</label>
                  <input 
                    id="srv-name"
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Samuel Luciano"
                    className="form-input"
                    autoFocus
                  />
                </div>

                {/* Col 2 */}
                <div className="form-group">
                  <label htmlFor="srv-nickname">Apodo / Nombre conocido (Opcional)</label>
                  <input 
                    id="srv-nickname"
                    type="text" 
                    value={formData.nickname}
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Ej. Tío Joel, Sammy..."
                    className="form-input"
                  />
                </div>

                {/* Col 1: Rol como Lista */}
                <div className="form-group">
                  <label htmlFor="srv-role">Rol o Título Principal</label>
                  <select 
                    id="srv-role"
                    value={isCustomRole ? '__custom__' : (formData.role || '')}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomRole(true);
                        setCustomRoleInput(formData.role || '');
                      } else {
                        setIsCustomRole(false);
                        setFormData({ ...formData, role: val });
                      }
                    }}
                    className="form-select"
                  >
                    <option value="" disabled>-- Selecciona un rol de la lista --</option>
                    {allAvailableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="__custom__">✏️ Otro rol (personalizado)...</option>
                  </select>

                  {isCustomRole && (
                    <div className="custom-role-subfield" style={{ marginTop: '0.45rem' }}>
                      <input 
                        type="text"
                        placeholder="Escribe el título o rol personalizado..."
                        value={customRoleInput}
                        onChange={e => {
                          setCustomRoleInput(e.target.value);
                          setFormData({ ...formData, role: e.target.value });
                        }}
                        autoFocus
                        className="form-input"
                      />
                    </div>
                  )}
                </div>

                {/* Col 2 */}
                <div className="form-group">
                  <label>Ministerios a los que apoya</label>
                  <div className="server-checkboxes-row">
                    <label className={`server-checkbox-chip ${formData.groups.includes('jotapece') ? 'selected-jpc' : ''}`}>
                      <input 
                        type="checkbox"
                        checked={formData.groups.includes('jotapece')}
                        onChange={e => {
                          const checked = e.target.checked;
                          let g = [...formData.groups];
                          if (checked && !g.includes('jotapece')) g.push('jotapece');
                          if (!checked) g = g.filter(x => x !== 'jotapece');
                          setFormData({ ...formData, groups: g });
                        }}
                      />
                      <span>Jotapece (JPC 12–17)</span>
                    </label>

                    <label className={`server-checkbox-chip ${formData.groups.includes('siervos') ? 'selected-siervos' : ''}`}>
                      <input 
                        type="checkbox"
                        checked={formData.groups.includes('siervos')}
                        onChange={e => {
                          const checked = e.target.checked;
                          let g = [...formData.groups];
                          if (checked && !g.includes('siervos')) g.push('siervos');
                          if (!checked) g = g.filter(x => x !== 'siervos');
                          setFormData({ ...formData, groups: g });
                        }}
                      />
                      <span>Siervos (121 18+)</span>
                    </label>
                  </div>
                </div>

                {/* Full Width: Áreas de Servicio Multi-Selección (Expandible/Contraíble) */}
                <div className="form-group full-width areas-collapsible-group">
                  <div className="areas-field-header">
                    <div className="areas-label-flex">
                      <label htmlFor="areas-toggle-trigger">Áreas de servicio en las que colabora:</label>
                      <span className="areas-selected-counter">
                        {formData.primaryAreas?.length || 0} {formData.primaryAreas?.length === 1 ? 'área' : 'áreas'}
                      </span>
                    </div>

                    <button 
                      type="button"
                      id="areas-toggle-trigger"
                      className={`btn-toggle-areas-expand ${isAreasExpanded ? 'is-expanded' : ''}`}
                      onClick={() => setIsAreasExpanded(!isAreasExpanded)}
                      title={isAreasExpanded ? "Contraer lista de áreas" : "Expandir lista de áreas"}
                    >
                      <span>{isAreasExpanded ? 'Contraer' : 'Expandir lista'}</span>
                      {isAreasExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* VISTA CONTRAÍDA: Resumen compacto ideal para celular */}
                  {!isAreasExpanded && (
                    <div className="areas-compact-preview" onClick={() => setIsAreasExpanded(true)}>
                      {formData.primaryAreas?.length > 0 ? (
                        <div className="compact-selected-pills">
                          {formData.primaryAreas.map(area => (
                            <span key={area} className="compact-area-pill">
                              <Check size={12} className="check-icon-compact" />
                              <span>{area}</span>
                              <button 
                                type="button"
                                className="btn-remove-pill"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    primaryAreas: formData.primaryAreas.filter(a => a !== area)
                                  });
                                }}
                                title={`Quitar ${area}`}
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                          <button 
                            type="button" 
                            className="btn-add-more-areas"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAreasExpanded(true);
                            }}
                          >
                            <Plus size={12} />
                            <span>Modificar / Elegir más</span>
                          </button>
                        </div>
                      ) : (
                        <div className="compact-empty-state">
                          <span className="compact-empty-text">Ninguna área seleccionada aún</span>
                          <span className="compact-click-hint">Toca aquí para desplegar las opciones</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VISTA EXPANDIDA: Lista completa de áreas y campo para agregar nueva */}
                  {isAreasExpanded && (
                    <div className="areas-multiselect-container is-open">
                      <div className="areas-chips-grid">
                        {allAvailableAreas.map(area => {
                          const isSelected = (formData.primaryAreas || []).includes(area);
                          return (
                            <button 
                              key={area}
                              type="button"
                              className={`area-toggle-chip ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                const cur = formData.primaryAreas || [];
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    primaryAreas: cur.filter(a => a !== area)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    primaryAreas: [...cur, area]
                                  });
                                }
                              }}
                              title={isSelected ? `Quitar ${area}` : `Añadir ${area}`}
                            >
                              <span className="area-chip-icon">
                                {isSelected ? <Check size={13} /> : <Plus size={13} />}
                              </span>
                              <span>{area}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Add custom area if not present in list */}
                      <div className="add-custom-area-inline">
                        <input 
                          type="text"
                          placeholder="¿Otra área no listada? (ej. Fotografía, Decoración...)"
                          value={customAreaInput}
                          onChange={e => setCustomAreaInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customAreaInput.trim();
                              if (trimmed && !(formData.primaryAreas || []).includes(trimmed)) {
                                setFormData({
                                  ...formData,
                                  primaryAreas: [...(formData.primaryAreas || []), trimmed]
                                });
                                setCustomAreaInput('');
                              }
                            }
                          }}
                          className="form-input custom-area-input"
                        />
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const trimmed = customAreaInput.trim();
                            if (trimmed && !(formData.primaryAreas || []).includes(trimmed)) {
                              setFormData({
                                ...formData,
                                primaryAreas: [...(formData.primaryAreas || []), trimmed]
                              });
                              setCustomAreaInput('');
                            }
                          }}
                        >
                          <Plus size={14} />
                          <span>Añadir</span>
                        </button>
                      </div>

                      {/* Botón para contraer al terminar de seleccionar */}
                      <div className="areas-collapse-footer">
                        <button 
                          type="button"
                          className="btn-collapse-action"
                          onClick={() => setIsAreasExpanded(false)}
                        >
                          <ChevronUp size={14} />
                          <span>Listo · Contraer lista ({formData.primaryAreas?.length || 0} seleccionadas)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Col 1 */}
                <div className="form-group">
                  <label htmlFor="srv-phone">Teléfono / WhatsApp</label>
                  <input 
                    id="srv-phone"
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej. 829-555-0101"
                    className="form-input"
                  />
                </div>

                {/* Col 2 */}
                <div className="form-group">
                  <label htmlFor="srv-email">Correo Electrónico</label>
                  <input 
                    id="srv-email"
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ejemplo@icc.org"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="form-actions-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleAttemptClose}
                  title="Cancelar y descartar [Esc]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-save-server"
                  title="Guardar información [Enter]"
                >
                  <Check size={17} />
                  <span>{isCreating ? 'Guardar Servidor' : 'Actualizar Información'}</span>
                  <span className="btn-key-hint">↵ Enter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prompt when attempting to exit with unsaved modifications */}
      <UnsavedChangesModal 
        isOpen={showUnsavedPrompt}
        onContinueEditing={() => setShowUnsavedPrompt(false)}
        onDiscardAndExit={() => {
          setShowUnsavedPrompt(false);
          setIsCreating(false);
          setEditingServer(null);
        }}
        onSaveAndExit={handleSaveForm}
      />
    </div>
  );
}
