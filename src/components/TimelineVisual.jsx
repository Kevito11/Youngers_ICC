import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ChevronRight, ChevronLeft, Sparkles, Lock } from './Icons';

export default function TimelineVisual({ groupType, activities, onSelectActivity }) {
  const isJpc = groupType === 'jotapece';
  const [pageSize, setPageSize] = useState('5');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter activities for this group (also include 'ambos' group activities like Cena de Jóvenes o Los Manguitos)
  const groupActivities = activities.filter(
    a => a.group === groupType || a.group === 'ambos'
  );

  const totalItems = groupActivities.length;
  const isPaged = pageSize !== 'all';
  const numericLimit = parseInt(pageSize, 10) || 5;
  const totalPages = isPaged ? Math.max(1, Math.ceil(totalItems / numericLimit)) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = isPaged ? (safeCurrentPage - 1) * numericLimit : 0;
  const endIndex = isPaged ? Math.min(startIndex + numericLimit, totalItems) : totalItems;
  const displayedActivities = isPaged 
    ? groupActivities.slice(startIndex, endIndex)
    : groupActivities;

  // Compute counters
  const multiusosCount = groupActivities.filter(a => a.locationType === 'multiusos').length;
  const auditorioCount = groupActivities.filter(a => a.locationType === 'auditorio').length;
  const fueraCount = groupActivities.filter(a => a.locationType === 'fuera').length;
  const sinReunionCount = groupActivities.filter(a => a.locationType === 'sin_reunion').length;

  return (
    <div className={`timeline-visual-view theme-${groupType}`}>
      {/* Title Header */}
      <div className="view-title-section">
        <div className="title-row">
          <h2 className="view-main-title">
            {isJpc ? 'Jotapece' : 'Siervos'}
          </h2>
          <span className={`group-identity-badge ${isJpc ? 'badge-jpc' : 'badge-siervos'}`}>
            {isJpc ? 'Adolescentes 12–17 · Sábado' : 'Jóvenes 18+ · Viernes'}
          </span>
        </div>
        <p className="view-subtitle">
          Calendario de logística · octubre – diciembre 2026
        </p>
      </div>

      {/* Routine Schedule Card Banner */}
      <div className={`routine-banner-card ${isJpc ? 'banner-jpc' : 'banner-siervos'}`}>
        <div className="routine-card-title">
          Horario de cada reunión de {isJpc ? 'Jotapece (sábado)' : 'Siervos (viernes)'}
        </div>
        <div className="routine-columns-grid">
          <div className="routine-col">
            <span className="routine-time">
              {isJpc ? '5:00 – 7:00 pm' : '6:00 – 8:00 pm'}
            </span>
            <span className="routine-label">Preparación (montaje)</span>
          </div>
          <div className="routine-col divider-left">
            <span className="routine-time">
              {isJpc ? '7:00 – 9:00 pm' : '8:00 – 9:30 pm'}
            </span>
            <span className="routine-label">Actividad</span>
          </div>
          <div className="routine-col divider-left">
            <span className="routine-time">
              {isJpc ? '9:00 – 9:30 pm' : '9:30 – 10:00 pm'}
            </span>
            <span className="routine-label">Desmontaje</span>
          </div>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="summary-pills-row">
        <div className={`summary-pill pill-primary ${isJpc ? 'pill-jpc' : 'pill-siervos'}`}>
          <span>{multiusosCount} reuniones · salón multiusos</span>
        </div>
        {auditorioCount > 0 && (
          <div className="summary-pill pill-amber">
            <span>{auditorioCount} · auditorio principal</span>
          </div>
        )}
        {fueraCount > 0 && (
          <div className="summary-pill pill-outline">
            <span>{fueraCount} · fuera de ICC</span>
          </div>
        )}
        {sinReunionCount > 0 && (
          <div className="summary-pill pill-outline">
            <span>{sinReunionCount} · sin reunión</span>
          </div>
        )}
      </div>

      {/* Interactive notice and Limit Selector */}
      <div className="timeline-top-controls-bar">
        <div className="interactive-hint">
          <Sparkles size={15} />
          <span>Pulsa cualquier actividad para ver su <strong>programa minuto a minuto</strong> y la asignación de <strong>servidores</strong>.</span>
        </div>

        <div className="page-limit-selector" title="Cantidad de servicios a visualizar por página">
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
                title={opt === 'all' ? 'Ver todos los servicios' : `Ver ${opt} servicios por página`}
              >
                {opt === 'all' ? 'Todos' : opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Table Card */}
      <div className="timeline-table-card">
        {/* Table Header */}
        <div className="timeline-table-header">
          <div className="th-left">Fecha, actividad y mensaje</div>
          <div className="th-right">
            <span className="th-time-title">Horario del salón</span>
            <div className="time-ticks-row">
              <span>5 pm</span>
              <span>6 pm</span>
              <span>7 pm</span>
              <span>8 pm</span>
              <span>9 pm</span>
              <span>10 pm</span>
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="timeline-rows-list">
          {displayedActivities.map(activity => {
            const isAuditorio = activity.locationType === 'auditorio';
            const isMultiusos = activity.locationType === 'multiusos';
            const isFuera = activity.locationType === 'fuera';
            const isSinReunion = activity.locationType === 'sin_reunion';

            return (
              <div 
                key={activity.id} 
                className={`timeline-row-item ${isAuditorio ? 'is-auditorio' : ''}`}
                onClick={() => onSelectActivity(activity)}
                role="button"
                tabIndex={0}
              >
                {/* Left side: Date and Info */}
                <div className="row-info-col">
                  <div className="date-badge-box">
                    <span className="date-dow">{activity.dayOfWeek}</span>
                    <span className="date-num">{activity.dayNumber}</span>
                    <span className="date-month">{activity.month}</span>
                  </div>

                  <div className="row-content-box">
                    <h3 className="row-activity-title">
                      {activity.title}
                    </h3>
                    
                    {activity.preacher && activity.preacher !== 'Sin predicación' && (
                      <div className="row-preacher-row">
                        <span className="preacher-label">Mensaje:</span>
                        <strong className="preacher-name">{activity.preacher}</strong>
                      </div>
                    )}

                    <div className="row-tags-group">
                      <span className={`location-tag tag-${activity.locationType}`}>
                        {activity.customLocationName || activity.location}
                      </span>
                      {(activity.isCustomLocation || activity.locationType === 'fuera') && (
                        <span className="fuera-badge-indicator" title={activity.customLocationAddress || 'Ubicación fuera de lo establecido'}>
                          📍 Fuera de lo establecido
                        </span>
                      )}
                      {activity.group === 'ambos' && (
                        <span className="badge-shared">Siervos y Jotapece</span>
                      )}
                      {activity.isProgramLocked && (
                        <span className="card-locked-tag" title="El programa minuto a minuto de esta fecha está en preparación">
                          <Lock size={11} />
                          <span>Programa en preparación</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Visual Timeline Bars or Custom Note */}
                <div className="row-timeline-col">
                  {isMultiusos && isJpc && (
                    <div className="timeline-track jpc-track">
                      {/* 5pm - 7pm Preparation (40% width) */}
                      <div className="bar-prep" style={{ left: '0%', width: '40%' }}>
                        <span className="bar-label-bold">Preparación</span>
                        <span className="bar-sub">5:00 – 7:00 pm</span>
                      </div>
                      {/* 7pm - 9pm Activity (40% width) */}
                      <div className="bar-act" style={{ left: '40%', width: '40%' }}>
                        <span className="bar-label-bold">Actividad</span>
                        <span className="bar-sub">7:00 – 9:00 pm</span>
                      </div>
                      {/* 9pm - 9:30pm Teardown (10% width) */}
                      <div className="bar-teardown" style={{ left: '80%', width: '10%' }}></div>
                      <span className="teardown-sub-label" style={{ left: '80%' }}>
                        Desmontaje 9:00 – 9:30 pm
                      </span>
                    </div>
                  )}

                  {isMultiusos && !isJpc && (
                    <div className="timeline-track siervos-track">
                      {/* 6pm - 8pm Preparation (starts at 20%, 40% width) */}
                      <div className="bar-prep" style={{ left: '20%', width: '40%' }}>
                        <span className="bar-label-bold">Preparación</span>
                        <span className="bar-sub">6:00 – 8:00 pm</span>
                      </div>
                      {/* 8pm - 9:30pm Activity (starts at 60%, 30% width) */}
                      <div className="bar-act" style={{ left: '60%', width: '30%' }}>
                        <span className="bar-label-bold">Actividad</span>
                        <span className="bar-sub">8:00 – 9:30 pm</span>
                      </div>
                      {/* 9:30pm - 10pm Teardown (starts at 90%, 10% width) */}
                      <div className="bar-teardown" style={{ left: '90%', width: '10%' }}></div>
                      <span className="teardown-sub-label" style={{ left: '90%' }}>
                        Desmontaje 9:30 – 10:00 pm
                      </span>
                    </div>
                  )}

                  {isAuditorio && (
                    <div className="timeline-track auditorio-track">
                      {/* 5pm - 7pm Preparation */}
                      <div className="bar-prep bar-auditorio-prep" style={{ left: '0%', width: '40%' }}>
                        <span className="bar-label-bold">Preparación</span>
                        <span className="bar-sub">5:00 – 7:00 pm</span>
                      </div>
                      {/* 7pm - 9pm Activity */}
                      <div className="bar-act bar-auditorio-act" style={{ left: '40%', width: '40%' }}>
                        <span className="bar-label-bold">Actividad</span>
                        <span className="bar-sub">7:00 – 9:00 pm</span>
                      </div>
                      {/* 9pm - 9:30pm Teardown */}
                      <div className="bar-teardown bar-auditorio-teardown" style={{ left: '80%', width: '10%' }}></div>
                      <span className="teardown-sub-label text-amber" style={{ left: '80%' }}>
                        Desmontaje 9:00 – 9:30 pm
                      </span>
                      <div className="auditorio-sub-note">
                        Horario de sábado · por confirmar
                      </div>
                    </div>
                  )}

                  {isFuera && (
                    <div className="timeline-text-notice fuera-notice">
                      {activity.id === 'act-7' ? (
                        <div className="notice-lines">
                          <div>Conferencia <strong>2:00 – 7:00 pm</strong></div>
                          <div>Worship night <strong>7:00 – 9:00 pm</strong></div>
                        </div>
                      ) : activity.id === 'act-8' ? (
                        <div className="notice-lines">
                          <div>Preparación <strong>2:30 pm</strong></div>
                          <div>Actividad <strong>4:00 – 7:00 pm</strong></div>
                          <span className="tentative-sub">Horario tentativo · desmontaje por definir</span>
                        </div>
                      ) : (
                        <div className="notice-lines">
                          <span>{activity.activityTime || 'Horario por definir'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isSinReunion && (
                    <div className="timeline-text-notice sin-reunion-notice">
                      <span>{activity.activityTime || 'No hay reunión'}</span>
                    </div>
                  )}

                  {/* Click arrow affordance */}
                  <div className="row-click-affordance">
                    <span className="view-details-pill">Ver Programa</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Bar when pagination is active */}
      {isPaged && totalPages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Mostrando <strong>{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</strong> de <strong>{totalItems}</strong> servicios
          </div>
          <div className="pagination-nav">
            <button
              type="button"
              className="btn-page-nav"
              disabled={safeCurrentPage <= 1}
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
              title="Página anterior"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`page-num-btn ${pageNum === safeCurrentPage ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-page-nav"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
              title="Página siguiente"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Summary note when displaying all activities or single page */}
      {(!isPaged || totalPages <= 1) && totalItems > 0 && (
        <div className="pagination-bar pagination-all-summary">
          <span className="pagination-info">
            Mostrando todos los <strong>{totalItems}</strong> servicios en pantalla
          </span>
        </div>
      )}
    </div>
  );
}
