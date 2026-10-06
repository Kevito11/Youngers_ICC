import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, User, ChevronRight, CheckCircle2, 
  Archive, Shield, Search, ArrowRight, AlertCircle, Sparkles, Filter 
} from './Icons';
import { PERIODS, PERIOD_PAUSE_INFO, getActivityPeriod, isActivityExpired } from '../data/initialData';

export default function PeriodsHistoryView({ 
  activities, 
  onSelectActivity, 
  onNavigateToCalendar 
}) {
  const [selectedPeriodId, setSelectedPeriodId] = useState('sep-dic');
  const [groupFilter, setGroupFilter] = useState('all'); // 'all' | 'jotapece' | 'siervos'
  const [searchQuery, setSearchQuery] = useState('');

  const currentPeriod = PERIODS.find(p => p.id === selectedPeriodId) || PERIODS[0];

  // Filter activities belonging to selected period
  const periodActivities = activities.filter(act => {
    const actPeriod = getActivityPeriod(act);
    if (actPeriod !== selectedPeriodId) return false;

    if (groupFilter === 'jotapece' && act.group !== 'jotapece' && act.group !== 'ambos') return false;
    if (groupFilter === 'siervos' && act.group !== 'siervos' && act.group !== 'ambos') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.title?.toLowerCase().includes(q);
      const preacher = act.preacher?.toLowerCase().includes(q);
      const loc = act.location?.toLowerCase().includes(q);
      if (!matchTitle && !preacher && !loc) return false;
    }

    return true;
  });

  // Calculate statistics for this period
  const allInPeriod = activities.filter(a => getActivityPeriod(a) === selectedPeriodId);
  const expiredCount = allInPeriod.filter(a => isActivityExpired(a)).length;
  const upcomingCount = allInPeriod.length - expiredCount;

  return (
    <div className="periods-history-page">
      {/* Page Header */}
      <div className="periods-header-section">
        <div className="periods-title-badge">
          <Archive size={16} />
          <span>Archivo &amp; Historial Ministerial</span>
        </div>
        <h2 className="periods-main-title">Registro por Períodos</h2>
        <p className="periods-subtitle">
          Al cumplirse el plazo de cada actividad, queda archivada y documentada por períodos cuatrimestrales.
        </p>
      </div>

      {/* Period Selection Tabs */}
      <div className="period-tabs-bar">
        {PERIODS.map(period => {
          const count = activities.filter(a => getActivityPeriod(a) === period.id).length;
          const isSelected = selectedPeriodId === period.id;

          return (
            <button
              key={period.id}
              className={`period-selector-tab ${isSelected ? 'active' : ''} ${period.isCurrent ? 'tab-is-current' : ''}`}
              onClick={() => setSelectedPeriodId(period.id)}
            >
              <div className="period-tab-top">
                <span className="period-name">{period.name}</span>
                {period.isCurrent && (
                  <span className="period-current-badge">Actual</span>
                )}
              </div>
              <div className="period-tab-meta">
                <span className="period-season-label">{period.season}</span>
                <span className="period-count-pill">{count} actividades</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summer Break Callout Notice */}
      <div className="period-pause-banner">
        <div className="pause-icon-circle">
          <AlertCircle size={20} />
        </div>
        <div className="pause-content">
          <strong className="pause-title">{PERIOD_PAUSE_INFO.title}</strong>
          <p className="pause-text">{PERIOD_PAUSE_INFO.description}</p>
        </div>
      </div>

      {/* Period Overview Card */}
      <div className="period-overview-card">
        <div className="overview-left">
          <div className="overview-title-row">
            <h3 className="overview-period-heading">{currentPeriod.name}</h3>
            <span className={`status-pill ${currentPeriod.isCurrent ? 'status-confirmed' : 'status-pending'}`}>
              {currentPeriod.badgeText}
            </span>
          </div>
          <p className="overview-period-desc">{currentPeriod.note}</p>
        </div>

        <div className="overview-metrics-grid">
          <div className="metric-box">
            <span className="metric-num">{allInPeriod.length}</span>
            <span className="metric-label">Total Actividades</span>
          </div>
          <div className="metric-box">
            <span className="metric-num text-success">{expiredCount}</span>
            <span className="metric-label">Plazo Cumplido</span>
          </div>
          {currentPeriod.isCurrent && (
            <div className="metric-box">
              <span className="metric-num text-accent">{upcomingCount}</span>
              <span className="metric-label">Próximas en Agenda</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="directory-filters-bar">
        <div className="filter-chips-list">
          <button 
            className={`filter-chip ${groupFilter === 'all' ? 'active' : ''}`}
            onClick={() => setGroupFilter('all')}
          >
            Todos ({allInPeriod.length})
          </button>
          <button 
            className={`filter-chip chip-jpc ${groupFilter === 'jotapece' ? 'active' : ''}`}
            onClick={() => setGroupFilter('jotapece')}
          >
            Jotapece (JPC)
          </button>
          <button 
            className={`filter-chip chip-siervos ${groupFilter === 'siervos' ? 'active' : ''}`}
            onClick={() => setGroupFilter('siervos')}
          >
            Siervos (121)
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            placeholder="Buscar por tema, predicador o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Activities Grid */}
      {periodActivities.length === 0 ? (
        <div className="empty-period-state">
          <Archive size={42} className="empty-icon" />
          <h3>No hay actividades registradas en este filtro</h3>
          <p>No se encontraron registros para {currentPeriod.name} con los criterios seleccionados.</p>
        </div>
      ) : (
        <div className="period-activities-grid">
          {periodActivities.map(act => {
            const expired = isActivityExpired(act);
            const isJpc = act.group === 'jotapece';
            const isSiervos = act.group === 'siervos';

            return (
              <div 
                key={act.id} 
                className={`period-activity-card ${expired ? 'card-expired' : 'card-active'}`}
                onClick={() => onSelectActivity(act)}
              >
                <div className="period-card-top-row">
                  <div className="card-date-badge">
                    <span className="date-day-abbr">{act.dayOfWeek}</span>
                    <strong className="date-number">{act.dayNumber}</strong>
                    <span className="date-month-abbr">{act.month} {act.year}</span>
                  </div>

                  <div className="card-status-col">
                    <span className={`group-tag ${isJpc ? 'tag-jpc' : isSiervos ? 'tag-siervos' : 'tag-ambos'}`}>
                      {isJpc ? 'JPC 12-17' : isSiervos ? 'Siervos 18+' : 'Ambos'}
                    </span>

                    {expired ? (
                      <span className="deadline-badge-completed">
                        <CheckCircle2 size={13} />
                        <span>Plazo Cumplido</span>
                      </span>
                    ) : (
                      <span className="deadline-badge-active">
                        <Clock size={13} />
                        <span>En Agenda</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="period-card-content">
                  <h4 className="period-act-title">{act.title}</h4>
                  
                  {act.preacher && (
                    <div className="act-meta-line">
                      <User size={15} />
                      <span>Predicador: <strong>{act.preacher}</strong></span>
                    </div>
                  )}

                  <div className="act-meta-line">
                    <MapPin size={15} />
                    <span>{act.customLocationName || act.location}</span>
                    {(act.isCustomLocation || act.locationType === 'fuera') && (
                      <span className="outside-location-tag-mini">Fuera de ICC</span>
                    )}
                  </div>

                  {act.activityTime && (
                    <div className="act-meta-line">
                      <Clock size={15} />
                      <span>{act.activityTime}</span>
                    </div>
                  )}
                </div>

                <div className="period-card-footer">
                  <span className="servers-pill-count">
                    <Shield size={13} />
                    <span>{act.serverAssignments?.length || 0} servidores</span>
                  </span>

                  <button className="btn-view-sheet">
                    <span>Ver Detalles</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
