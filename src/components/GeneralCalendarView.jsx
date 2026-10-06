import React, { useState } from 'react';
import { Calendar, Search, Filter, Sparkles, ChevronRight, MapPin, Clock } from './Icons';

export default function GeneralCalendarView({ activities, onSelectActivity }) {
  const [filterType, setFilterType] = useState('all'); // all | siervos | jotapece | ambos | otros
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = activities.filter(activity => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = activity.title?.toLowerCase().includes(q);
      const matchPreacher = activity.preacher?.toLowerCase().includes(q);
      const matchLocation = activity.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchPreacher && !matchLocation) return false;
    }

    // Category filter
    if (filterType === 'all') return true;
    if (filterType === 'siervos') return activity.group === 'siervos';
    if (filterType === 'jotapece') return activity.group === 'jotapece';
    if (filterType === 'ambos') return activity.group === 'ambos';
    if (filterType === 'otros') {
      return activity.locationType === 'fuera' || activity.locationType === 'sin_reunion';
    }
    return true;
  });

  return (
    <div className="general-calendar-view">
      {/* Title */}
      <div className="general-title-section">
        <h2 className="calendar-main-title">Calendario Youngers ICC</h2>
        <p className="calendar-main-subtitle">
          Siervos y Jotapece · octubre – diciembre 2026
        </p>
      </div>

      {/* Routine schedule dual banner (matching Image 3 top banner) */}
      <div className="dual-schedule-banner">
        {/* Siervos card */}
        <div className="schedule-card card-siervos">
          <div className="schedule-header">
            <span className="dot dot-siervos"></span>
            <strong>Viernes · Siervos</strong>
          </div>
          <div className="schedule-body">
            <div className="schedule-row">
              <span className="label">Preparación</span>
              <strong className="time">6:00 – 8:00 pm</strong>
            </div>
            <div className="schedule-row highlight">
              <span className="label">Actividad</span>
              <strong className="time">8:00 – 9:30 pm</strong>
            </div>
            <div className="schedule-row">
              <span className="label">Desmontaje</span>
              <strong className="time">9:30 – 10:00 pm</strong>
            </div>
          </div>
        </div>

        {/* Jotapece card */}
        <div className="schedule-card card-jpc">
          <div className="schedule-header">
            <span className="dot dot-jpc"></span>
            <strong>Sábado · Jotapece</strong>
          </div>
          <div className="schedule-body">
            <div className="schedule-row">
              <span className="label">Preparación</span>
              <strong className="time">5:00 – 7:00 pm</strong>
            </div>
            <div className="schedule-row highlight">
              <span className="label">Actividad</span>
              <strong className="time">7:00 – 9:00 pm</strong>
            </div>
            <div className="schedule-row">
              <span className="label">Desmontaje</span>
              <strong className="time">9:00 – 9:30 pm</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="calendar-controls-bar">
        <div className="filter-chips-list">
          <button
            className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Todos
          </button>
          
          <button
            className={`filter-chip chip-siervos ${filterType === 'siervos' ? 'active' : ''}`}
            onClick={() => setFilterType('siervos')}
          >
            Siervos
          </button>

          <button
            className={`filter-chip chip-jpc ${filterType === 'jotapece' ? 'active' : ''}`}
            onClick={() => setFilterType('jotapece')}
          >
            Jotapece
          </button>

          <button
            className={`filter-chip chip-ambos ${filterType === 'ambos' ? 'active' : ''}`}
            onClick={() => setFilterType('ambos')}
          >
            Ambos grupos
          </button>

          <button
            className={`filter-chip chip-otros ${filterType === 'otros' ? 'active' : ''}`}
            onClick={() => setFilterType('otros')}
          >
            Fuera de ICC / sin reunión
          </button>
        </div>

        {/* Search input */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar actividad, mensaje o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Interactive hint */}
      <div className="interactive-hint">
        <Sparkles size={15} />
        <span>Haz click en cualquier actividad para abrir su <strong>orden de culto minuto a minuto</strong> y los <strong>servidores asignados</strong>.</span>
      </div>

      {/* Activities Chronological List (exact structure as Image 3) */}
      <div className="general-activities-list">
        {filteredActivities.length === 0 ? (
          <div className="empty-state-box">
            <p>No se encontraron actividades con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredActivities.map(activity => {
            const isJpc = activity.group === 'jotapece';
            const isSiervos = activity.group === 'siervos';
            const isAmbos = activity.group === 'ambos';

            let groupBorderClass = 'border-ambos';
            if (isJpc) groupBorderClass = 'border-jpc';
            if (isSiervos) groupBorderClass = 'border-siervos';

            return (
              <div
                key={activity.id}
                className={`combined-activity-card ${groupBorderClass}`}
                onClick={() => onSelectActivity(activity)}
                role="button"
                tabIndex={0}
              >
                {/* Colored left indicator line is rendered via CSS border/pseudo */}

                {/* Left side: Date Badge & Title */}
                <div className="combined-main-col">
                  <div className="date-badge-box">
                    <span className="date-dow">{activity.dayOfWeek}</span>
                    <span className="date-num">{activity.dayNumber}</span>
                    <span className="date-month">{activity.month}</span>
                  </div>

                  <div className="combined-content">
                    <h3 className="combined-title">{activity.title}</h3>

                    {activity.preacher && activity.preacher !== 'Sin predicación' && (
                      <div className="combined-preacher-row">
                        <span className="label">Mensaje:</span>
                        <strong className="name">{activity.preacher}</strong>
                      </div>
                    )}

                    <div className="combined-tags-row">
                      {isJpc && <span className="group-pill-sm pill-jpc">Jotapece</span>}
                      {isSiervos && <span className="group-pill-sm pill-siervos">Siervos</span>}
                      {isAmbos && <span className="group-pill-sm pill-ambos">Siervos y Jotapece</span>}

                      <span className={`location-pill-sm tag-${activity.locationType}`}>
                        {activity.customLocationName || activity.location}
                      </span>
                      {(activity.isCustomLocation || activity.locationType === 'fuera') && (
                        <span className="fuera-badge-indicator" title={activity.customLocationAddress || 'Ubicación fuera de lo establecido'}>
                          📍 Fuera de lo establecido
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Time Information */}
                <div className="combined-time-col">
                  {activity.locationType === 'multiusos' && (
                    <div className="time-info-block">
                      <div className="main-time-row">
                        <span className="time-tag">Actividad</span>
                        <strong className="time-value">
                          {isJpc ? '7:00 – 9:00 pm' : '8:00 – 9:30 pm'}
                        </strong>
                      </div>
                      <div className="sub-time-row">
                        <span>
                          {isJpc 
                            ? 'Preparación 5:00 · Desmontaje 9:00–9:30 pm' 
                            : 'Preparación 6:00 · Desmontaje 9:30–10:00 pm'}
                        </span>
                      </div>
                    </div>
                  )}

                  {activity.locationType === 'auditorio' && (
                    <div className="time-info-block auditorio-time">
                      <div className="main-time-row">
                        <span className="time-tag tag-auditorio">Actividad</span>
                        <strong className="time-value text-amber">7:00 – 9:00 pm</strong>
                      </div>
                      <div className="sub-time-row">
                        <span>Preparación 5:00 · Desmontaje 9:00–9:30 pm</span>
                      </div>
                      <span className="tentative-label">Horario de sábado · por confirmar</span>
                    </div>
                  )}

                  {activity.locationType === 'fuera' && (
                    <div className="time-info-block fuera-time">
                      {activity.id === 'act-7' ? (
                        <>
                          <div className="main-time-row">
                            <span>Conferencia <strong>2:00 – 7:00 pm</strong></span>
                          </div>
                          <div className="sub-time-row">
                            <span>Worship night <strong>7:00 – 9:00 pm</strong></span>
                          </div>
                        </>
                      ) : activity.id === 'act-8' ? (
                        <>
                          <div className="main-time-row">
                            <span>Preparación <strong>2:30 pm</strong></span>
                          </div>
                          <div className="sub-time-row">
                            <span>Actividad <strong>4:00 – 7:00 pm</strong></span>
                          </div>
                          <span className="tentative-label">Horario tentativo · desmontaje por definir</span>
                        </>
                      ) : (
                        <div className="main-time-row">
                          <span className="sub-time-row">{activity.activityTime || 'Horario por definir'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {activity.locationType === 'sin_reunion' && (
                    <div className="time-info-block sin-reunion-time">
                      <span className="sub-time-row">{activity.activityTime || 'No hay reunión'}</span>
                    </div>
                  )}

                  <div className="open-arrow-wrap">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
