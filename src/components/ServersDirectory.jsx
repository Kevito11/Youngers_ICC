import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Search, Phone, Mail, X, Check, ArrowLeft, Shield, User, Sparkles
} from './Icons';
import UnsavedChangesModal from './UnsavedChangesModal';

export default function ServersDirectory({ 
  servers, 
  activities,
  onAddServer, 
  onUpdateServer, 
  onDeleteServer,
  onRequireAuth
}) {
  const [filterGroup, setFilterGroup] = useState('all'); // all | jotapece | siervos | ambos
  const [searchQuery, setSearchQuery] = useState('');
  const [editingServer, setEditingServer] = useState(null); // null or server object
  const [isCreating, setIsCreating] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    role: '',
    groups: ['jotapece'],
    primaryAreas: '',
    phone: '',
    email: '',
    active: true
  });

  const initialFormRef = useRef(formData);

  const isDirty = (
    formData.name !== initialFormRef.current.name ||
    formData.nickname !== initialFormRef.current.nickname ||
    formData.role !== initialFormRef.current.role ||
    formData.primaryAreas !== initialFormRef.current.primaryAreas ||
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
    const initData = {
      name: '',
      nickname: '',
      role: 'Líder / Servidor',
      groups: ['jotapece'],
      primaryAreas: 'Logística, Bienvenida',
      phone: '',
      email: '',
      active: true
    };
    setFormData(initData);
    initialFormRef.current = initData;
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
    const initData = {
      name: server.name || '',
      nickname: server.nickname || '',
      role: server.role || '',
      groups: server.groups || ['jotapece'],
      primaryAreas: Array.isArray(server.primaryAreas) ? server.primaryAreas.join(', ') : (server.primaryAreas || ''),
      phone: server.phone || '',
      email: server.email || '',
      active: server.active !== false
    };
    setFormData(initData);
    initialFormRef.current = initData;
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

    const areasArray = formData.primaryAreas
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (isCreating) {
      const newServer = {
        id: `srv-${Date.now()}`,
        name: formData.name,
        nickname: formData.nickname,
        role: formData.role,
        groups: formData.groups,
        primaryAreas: areasArray,
        phone: formData.phone,
        email: formData.email,
        active: formData.active
      };
      onAddServer(newServer);
      setIsCreating(false);
      setShowUnsavedPrompt(false);
    } else if (editingServer) {
      const updated = {
        ...editingServer,
        name: formData.name,
        nickname: formData.nickname,
        role: formData.role,
        groups: formData.groups,
        primaryAreas: areasArray,
        phone: formData.phone,
        email: formData.email,
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

        <button className="btn btn-primary" onClick={handleCreateClick}>
          <Plus size={18} />
          <span>Agregar Servidor</span>
        </button>
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

      {/* Grid of Servers */}
      <div className="servers-cards-grid">
        {filteredServers.map(server => {
          const assignments = getAssignmentsForServer(server.id, server.name);

          return (
            <div key={server.id} className="server-profile-card">
              <div className="card-top-row">
                <div className="server-avatar-circle">
                  <span>{server.name.charAt(0)}</span>
                </div>

                <div className="card-actions-group">
                  <button 
                    className="icon-action-btn"
                    onClick={() => handleEditClick(server)}
                    title="Editar servidor (Requiere clave administrativa)"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    className="icon-action-btn btn-danger"
                    onClick={() => handleDeleteClick(server)}
                    title="Eliminar servidor (Requiere clave administrativa)"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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

      {/* Modal for Creating or Editing a Server */}
      {(isCreating || editingServer) && (
        <div className="modal-overlay server-modal-overlay" onClick={handleAttemptClose}>
          <div 
            className="modal-container server-modal-container" 
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

                {/* Col 1 */}
                <div className="form-group">
                  <label htmlFor="srv-role">Rol o Título Principal</label>
                  <input 
                    id="srv-role"
                    type="text" 
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ej. Líder de Jóvenes, Maestro, Sonido..."
                    className="form-input"
                  />
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

                {/* Full Width */}
                <div className="form-group full-width">
                  <label htmlFor="srv-areas">Áreas de servicio principales (separadas por comas)</label>
                  <input 
                    id="srv-areas"
                    type="text" 
                    value={formData.primaryAreas}
                    onChange={e => setFormData({ ...formData, primaryAreas: e.target.value })}
                    placeholder="Ej. Predicación, Alabanza, Sonido, Proyección, Bienvenida, Refrigerio"
                    className="form-input"
                  />
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
