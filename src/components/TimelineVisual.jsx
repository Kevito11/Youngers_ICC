import React from 'react';
import { Calendar, Clock, MapPin, Users, ChevronRight, Sparkles } from './Icons';

export default function TimelineVisual({ groupType, activities, onSelectActivity }) {
  const isJpc = groupType === 'jotapece';
  
  // Filter activities for this group (also include 'ambos' group activities like Cena de Jóvenes o Los Manguitos)
  const groupActivities = activities.filter(
    a => a.group === groupType || a.group === 'ambos'
  );

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

      {/* Interactive notice */}
      <div className="interactive-hint">
        <Sparkles size={15} />
        <span>Pulsa cualquier actividad para ver su <strong>programa minuto a minuto</strong> y la asignación de <strong>servidores</strong>.</span>
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
          {groupActivities.map(activity => {
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
    </div>
  );
}
