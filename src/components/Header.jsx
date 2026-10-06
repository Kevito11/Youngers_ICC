import React from 'react';
import { Calendar, Users, Settings, Plus, Sparkles, ExternalLink, Shield, Lock, Key, Archive } from './Icons';
import youngersLogo from '../assets/youngers-logo.jpg';

export default function Header({ 
  currentTab, 
  onNavigate, 
  onNewActivity, 
  activitiesCount,
  serversCount,
  isProgramLocked,
  isAdminAuthenticated
}) {
  const handleTabClick = (e, tab) => {
    e.preventDefault();
    onNavigate(tab);
  };

  return (
    <header className="site-header">
      <div className="header-top-banner">
        <div className="container banner-inner">
          <div className="banner-badge">
            <span className="live-dot"></span>
            <span className="desktop-inline">Ministerio de Jóvenes ICC · Sistema de Logística &amp; Servidores</span>
            <span className="mobile-inline">Jóvenes ICC · Logística</span>
            {isProgramLocked && (
              <span className="banner-locked-pill" title="El acceso público al programa está bloqueado">
                <Lock size={12} />
                <span className="desktop-inline">Programa bloqueado</span>
                <span className="mobile-inline">Bloqueado</span>
              </span>
            )}
          </div>
          <div className="banner-links">
            <a 
              href="https://ministeriodejovenesicc.netlify.app/" 
              target="_blank" 
              rel="noreferrer" 
              className="external-site-link"
              title="Abrir web oficial de Jóvenes ICC"
            >
              <span className="desktop-inline">Sitio Oficial ICC</span>
              <span className="mobile-inline">ICC Oficial</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="header-main">
        <div className="container header-main-container">
          <a 
            href="/calendario" 
            className="header-brand"
            onClick={(e) => handleTabClick(e, 'general')}
            title="Ir al Calendario General"
          >
            <div className="brand-icon-wrapper">
              <img 
                src={youngersLogo} 
                alt="Youngers ICC - Armadura de Dios" 
                className="brand-logo-img" 
              />
            </div>
            <div className="brand-text">
              <div className="brand-title-row">
                <h1 className="brand-title">Youngers ICC</h1>
                <span className="brand-season-tag">Q4 · 2026</span>
              </div>
              <p className="brand-subtitle">
                <span className="brand-sub-full">Jóvenes Para Cristo </span><span className="brand-group-pill jpc">JPC</span> &amp; <span className="brand-sub-full">Siervos Para Cristo </span><span className="brand-group-pill siervos">121</span>
              </p>
            </div>
          </a>

          <div className="header-actions">
            <button 
              className="btn btn-primary btn-header-new-act"
              onClick={onNewActivity}
              title="Crear nueva actividad en el calendario (Requiere clave)"
            >
              <Plus size={18} />
              <span className="desktop-btn-label">Nueva Actividad</span>
              <span className="mobile-btn-label">Actividad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with distinct URLs */}
      <nav className="header-nav">
        <div className="container">
          <div className="nav-tabs-scroll">
            <a 
              href="/calendario"
              className={`nav-tab-btn ${currentTab === 'general' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'general')}
            >
              <Calendar size={18} />
              <span>Calendario Youngers</span>
              <span className="nav-counter-pill">{activitiesCount}</span>
            </a>

            <a 
              href="/jotapece"
              className={`nav-tab-btn jotapece-tab ${currentTab === 'jotapece' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'jotapece')}
            >
              <span className="tab-color-dot jotapece-dot"></span>
              <span>Jotapece</span>
              <span className="tab-badge-sub">12-17 · Sábados</span>
            </a>

            <a 
              href="/siervos"
              className={`nav-tab-btn siervos-tab ${currentTab === 'siervos' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'siervos')}
            >
              <span className="tab-color-dot siervos-dot"></span>
              <span>Siervos</span>
              <span className="tab-badge-sub">18+ · Viernes</span>
            </a>

            <a 
              href="/periodos"
              className={`nav-tab-btn periodos-tab ${currentTab === 'periodos' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'periodos')}
              title="Historial de Actividades por Períodos"
            >
              <Archive size={17} />
              <span>Períodos &amp; Historial</span>
            </a>

            <a 
              href="/servidores"
              className={`nav-tab-btn ${currentTab === 'servers' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'servers')}
            >
              <Users size={18} />
              <span>Servidores &amp; Líderes</span>
              <span className="nav-counter-pill">{serversCount}</span>
            </a>

            <a 
              href="/admin"
              className={`nav-tab-btn admin-tab ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'admin')}
              title="Panel de Administración (Modificación con contraseña)"
            >
              <Settings size={18} />
              <span>Administrador</span>
              {isAdminAuthenticated ? (
                <span className="nav-auth-indicator" title="Sesión activa">●</span>
              ) : (
                <Lock size={13} className="nav-lock-icon" />
              )}
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}

