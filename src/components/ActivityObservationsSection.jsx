import React, { useState } from 'react';
import { 
  Users, User, CheckSquare, Square, Check, X, 
  Trash2, Copy, Sparkles, MessageSquare, Clock, CloudUpload
} from './Icons';
import { YOUTH_LEADERS, OBSERVATION_CATEGORIES } from '../data/catalogs';

export default function ActivityObservationsSection({
  activity,
  onUpdateActivity,
  isAdmin = false
}) {
  const observations = Array.isArray(activity?.observations) ? activity.observations : [];

  const [selectedLeaders, setSelectedLeaders] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['General']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Toggle leader selection
  const handleToggleLeader = (leaderName) => {
    setSelectedLeaders(prev => {
      if (prev.includes(leaderName)) {
        return prev.filter(l => l !== leaderName);
      } else {
        return [...prev, leaderName];
      }
    });
    setErrorMsg(null);
  };

  const handleSelectAllLeaders = () => {
    setSelectedLeaders([...YOUTH_LEADERS]);
    setErrorMsg(null);
  };

  const handleClearLeaders = () => {
    setSelectedLeaders([]);
  };

  // Toggle category selection
  const handleToggleCategory = (catName) => {
    setSelectedCategories(prev => {
      if (prev.includes(catName)) {
        return prev.filter(c => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
    setErrorMsg(null);
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories([...OBSERVATION_CATEGORIES]);
    setErrorMsg(null);
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  // Submit new observation
  const handleSubmitObservation = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedLeaders.length === 0) {
      setErrorMsg('Por favor selecciona al menos un líder que hace la observación.');
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMsg('Por favor selecciona al menos un área o categoría.');
      return;
    }

    if (!commentText.trim()) {
      setErrorMsg('Por favor escribe el comentario u observación de mejora.');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const categoriesList = [...selectedCategories];
    const newObservation = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      leaders: [...selectedLeaders],
      comment: commentText.trim(),
      categories: categoriesList,
      category: categoriesList.join(', '),
      createdAt: now.toISOString(),
      displayDate: formattedDate
    };

    const updatedObservations = [newObservation, ...observations];
    const updatedActivity = {
      ...activity,
      observations: updatedObservations
    };

    try {
      if (onUpdateActivity) {
        await onUpdateActivity(updatedActivity);
      }
      setCommentText('');
      setSelectedLeaders([]);
      setSelectedCategories(['General']);
      setSuccessToast('¡Observación guardada y sincronizada con Google Sheets exitosamente!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Error al guardar observación:', err);
      setErrorMsg('Ocurrió un error al guardar. Verifica tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an observation
  const handleDeleteObservation = async (obsId) => {
    if (!window.confirm('¿Deseas eliminar esta observación de la actividad?')) return;

    const filtered = observations.filter(o => o.id !== obsId);
    const updatedActivity = {
      ...activity,
      observations: filtered
    };

    if (onUpdateActivity) {
      await onUpdateActivity(updatedActivity);
    }
  };

  // 1-Click WhatsApp export
  const handleCopyForWhatsApp = (obs) => {
    const actDate = `${activity.dayOfWeek || ''} ${activity.dayNumber || ''} ${activity.month || ''} ${activity.year || ''}`.trim();
    const leadersList = Array.isArray(obs.leaders) ? obs.leaders.join(', ') : (obs.leaders || 'Líderes de Jóvenes');
    const catList = Array.isArray(obs.categories) && obs.categories.length > 0
      ? obs.categories.join(', ')
      : (obs.category || 'General');

    const text = [
      `📌 *OBSERVACIÓN DE LÍDERES · YOUNGERS ICC*`,
      `📅 *Actividad:* ${activity.title || 'Actividad'} (${actDate})`,
      `👥 *Líder(es) que opinan:* ${leadersList}`,
      `🏷️ *Área(s):* ${catList}`,
      `📝 *Observación / Oportunidad de mejora:*`,
      `"${obs.comment}"`,
      ``,
      `_Registrado en la logística de Youngers ICC_`
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(obs.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  return (
    <div className="activity-observations-container">
      {/* Header card */}
      <div className="observations-header-card">
        <div className="obs-header-left">
          <div className="obs-icon-circle">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="obs-header-title">Observaciones y Mejoras de Líderes</h3>
            <p className="obs-header-subtitle">
              Registra comentarios, retroalimentación y puntos de mejora de los líderes de Jóvenes para optimizar próximas actividades. Sincronizado automáticamente en Google Sheets.
            </p>
          </div>
        </div>
        <div className="obs-header-badges">
          <span className="obs-count-badge">
            <Users size={14} />
            <span>{observations.length} {observations.length === 1 ? 'Observación' : 'Observaciones'}</span>
          </span>
          <span className="obs-cloud-badge" title="Los registros se guardan y reflejan en Google Sheets">
            <CloudUpload size={14} />
            <span>Google Sheets</span>
          </span>
        </div>
      </div>

      {/* Creation form */}
      <div className="observation-form-card">
        <form onSubmit={handleSubmitObservation}>
          {/* Step 1: Leaders multi-select */}
          <div className="obs-form-section">
            <div className="obs-section-header">
              <label className="obs-field-label">
                <span className="obs-step-num">1</span>
                <span>¿Quién o quiénes hacen la observación? *</span>
              </label>
              <div className="obs-quick-actions">
                <button 
                  type="button" 
                  className="btn-obs-ghost"
                  onClick={handleSelectAllLeaders}
                  title="Marcar todos los líderes"
                >
                  Seleccionar todos
                </button>
                {selectedLeaders.length > 0 && (
                  <button 
                    type="button" 
                    className="btn-obs-ghost text-muted"
                    onClick={handleClearLeaders}
                    title="Deseleccionar todos"
                  >
                    Limpiar ({selectedLeaders.length})
                  </button>
                )}
              </div>
            </div>

            <p className="obs-field-hint">
              Haz clic sobre uno o varios líderes para atribuir la observación conjunta si más de una persona hizo el comentario:
            </p>

            <div className="leaders-chips-grid">
              {YOUTH_LEADERS.map(leader => {
                const isSelected = selectedLeaders.includes(leader);
                const initials = leader.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');
                return (
                  <button
                    key={leader}
                    type="button"
                    className={`leader-select-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleLeader(leader)}
                    title={isSelected ? `Quitar a ${leader}` : `Seleccionar a ${leader}`}
                  >
                    <span className="leader-checkbox">
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </span>
                    <span className="leader-avatar-badge">{initials}</span>
                    <span className="leader-name-text">{leader}</span>
                  </button>
                );
              })}
            </div>

            {selectedLeaders.length > 0 && (
              <div className="selected-leaders-summary">
                <span className="summary-label">👥 {selectedLeaders.length} {selectedLeaders.length === 1 ? 'persona seleccionada:' : 'personas seleccionadas:'}</span>
                <span className="summary-names"><strong>{selectedLeaders.join(', ')}</strong></span>
              </div>
            )}
          </div>

          {/* Step 2: Category multi-select */}
          <div className="obs-form-section">
            <div className="obs-section-header">
              <label className="obs-field-label">
                <span className="obs-step-num">2</span>
                <span>¿Qué área(s) o categoría(s) abarca la observación? *</span>
              </label>
              <div className="obs-quick-actions">
                <button 
                  type="button" 
                  className="btn-obs-ghost"
                  onClick={handleSelectAllCategories}
                  title="Marcar todas las áreas"
                >
                  Seleccionar todas
                </button>
                {selectedCategories.length > 0 && (
                  <button 
                    type="button" 
                    className="btn-obs-ghost text-muted"
                    onClick={handleClearCategories}
                    title="Deseleccionar categorías"
                  >
                    Limpiar ({selectedCategories.length})
                  </button>
                )}
              </div>
            </div>

            <p className="obs-field-hint">
              Puedes seleccionar una o más áreas afectadas o involucradas (ej. Logística, Sonido, Alabanza, Tiempos):
            </p>

            <div className="obs-category-chips">
              {OBSERVATION_CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-chip-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleToggleCategory(cat)}
                    title={isSelected ? `Quitar categoría ${cat}` : `Seleccionar categoría ${cat}`}
                  >
                    {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            {selectedCategories.length > 0 && (
              <div className="selected-leaders-summary">
                <span className="summary-label">🏷️ {selectedCategories.length} {selectedCategories.length === 1 ? 'área seleccionada:' : 'áreas seleccionadas:'}</span>
                <span className="summary-names"><strong>{selectedCategories.join(', ')}</strong></span>
              </div>
            )}
          </div>

          {/* Step 3: Text */}
          <div className="obs-form-section">
            <label className="obs-field-label">
              <span className="obs-step-num">3</span>
              <span>Comentario / Observación de Mejora *</span>
            </label>
            <textarea
              rows={3}
              className="obs-textarea"
              value={commentText}
              onChange={e => {
                setCommentText(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Escribe la observación, retroalimentación o sugerencia dada por los líderes para el servicio o actividad..."
            />
          </div>

          {errorMsg && (
            <div className="obs-error-box">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {successToast && (
            <div className="obs-success-toast">
              <Check size={16} />
              <span>{successToast}</span>
            </div>
          )}

          <div className="obs-form-footer">
            <button
              type="submit"
              className="btn btn-primary btn-save-obs"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Guardando en Google Sheets...</span>
                </>
              ) : (
                <>
                  <CloudUpload size={16} />
                  <span>Guardar Observación en Google Sheets</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Observations history list */}
      <div className="observations-history-section">
        <div className="obs-history-header">
          <h4 className="obs-history-title">
            Historial de Observaciones Registradas ({observations.length})
          </h4>
          <span className="obs-history-sub">
            {activity.title} · {activity.dayOfWeek} {activity.dayNumber} {activity.month}
          </span>
        </div>

        {observations.length === 0 ? (
          <div className="empty-observations-box">
            <div className="empty-obs-icon">💬</div>
            <h4>Sin observaciones registradas todavía</h4>
            <p>
              Usa el formulario superior para registrar cualquier comentario o punto de mejora que hayan compartido 
              Fernando Pepén, Luisiana, Joel Guzmán, Carmen, Joel Hernández, Marisol o Elías.
            </p>
          </div>
        ) : (
          <div className="observations-cards-list">
            {observations.map((obs) => {
              const leadersList = Array.isArray(obs.leaders) ? obs.leaders : [obs.leaders].filter(Boolean);
              const catList = Array.isArray(obs.categories) && obs.categories.length > 0
                ? obs.categories
                : (obs.category ? String(obs.category).split(',').map(c => c.trim()).filter(Boolean) : ['General']);

              return (
                <div key={obs.id} className="observation-entry-card">
                  <div className="obs-card-top-bar">
                    <div className="obs-leaders-badges-row">
                      {leadersList.map(name => (
                        <span key={name} className="obs-leader-badge">
                          <User size={13} />
                          <strong>{name}</strong>
                        </span>
                      ))}
                    </div>
                    <div className="obs-card-meta-right">
                      <div className="obs-card-categories-row">
                        {catList.map(c => (
                          <span key={c} className="obs-card-cat-pill">{c}</span>
                        ))}
                      </div>
                      <span className="obs-card-date">
                        <Clock size={12} />
                        <span>{obs.displayDate || (obs.createdAt ? new Date(obs.createdAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }) : '')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="obs-card-comment-text">
                    "{obs.comment}"
                  </div>

                  <div className="obs-card-actions-bar">
                    <button
                      type="button"
                      className="btn-obs-action btn-copy-whatsapp"
                      onClick={() => handleCopyForWhatsApp(obs)}
                      title="Copiar observación formateada para enviar por WhatsApp"
                    >
                      {copiedId === obs.id ? (
                        <>
                          <Check size={14} />
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar para WhatsApp</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-obs-action btn-delete-obs"
                      onClick={() => handleDeleteObservation(obs.id)}
                      title="Eliminar observación"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
