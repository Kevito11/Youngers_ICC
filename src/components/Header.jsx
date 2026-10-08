import React, { useRef, useState, useEffect } from 'react';
import { 
  Calendar, Users, Settings, Plus, ExternalLink, 
  Lock, Archive, LogOut, ChevronLeft, ChevronRight 
} from './Icons';
import youngersLogo from '../assets/youngers-logo.jpg';

export default function Header({ 
  currentTab, 
  onNavigate, 
  onNewActivity, 
  activitiesCount,
  serversCount,
  isAdminAuthenticated,
  onLogoutAdmin,
  sheetsSyncState
}) {
  const navScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScroll = () => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  // Convert mouse wheel vertically to horizontal scroll on PC
  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.1;
          checkScroll();
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Window resize & mount check
  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activitiesCount, serversCount]);

  // Center active tab when tab changes
  useEffect(() => {
    if (navScrollRef.current) {
      const activeEl = navScrollRef.current.querySelector('.nav-tab-btn.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setTimeout(checkScroll, 200);
    }
  }, [currentTab]);

  // Global mouseup listener for drag-to-scroll
  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || !navScrollRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftStartRef.current = navScrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !navScrollRef.current) return;
    const dx = e.pageX - startXRef.current;
    if (Math.abs(dx) > 4) {
      hasDraggedRef.current = true;
    }
    navScrollRef.current.scrollLeft = scrollLeftStartRef.current - dx;
    checkScroll();
  };

  const scrollNav = (direction) => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 250);
    }
  };

  const handleTabClick = (e, tab) => {
    e.preventDefault();
    if (hasDraggedRef.current) {
      // User dragged to slide, don't trigger click navigation
      hasDraggedRef.current = false;
      return;
    }
    onNavigate(tab);
  };

  return (
    <>
      {/* Top ribbon banner - scrolls away with page scroll */}
      <div className="header-top-banner">
        <div className="container banner-inner">
          <div className="banner-badge">
            <span className="live-dot"></span>
            <span className="desktop-inline">Ministerio de Jóvenes ICC · Sistema de Logística &amp; Servidores</span>
            <span className="mobile-inline">Jóvenes ICC · Logística</span>
          </div>
          <div className="banner-links">
            <a 
              href="https://ministeriodejovenesicc.netlify.app/" 
              target="_blank" 
              rel="noreferrer" 
              className="external-site-link"
              title="Abrir web oficial de Jóvenes ICC"
            >
              <span className="desktop-inline">Página de Jóvenes ICC</span>
              <span className="mobile-inline">Jóvenes ICC</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="header-main">
        <div className="container header-main-container">
          <a 
            href="/" 
            className="header-brand"
            onClick={(e) => handleTabClick(e, 'general')}
            title="Ir al Inicio / Calendario General"
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

          {/* Action buttons in header */}
          <div className="header-actions">
            {/* Nueva Actividad: ONLY shown when administrator is logged in */}
            {isAdminAuthenticated && (
              <button 
                className="btn btn-primary btn-header-new-act"
                onClick={onNewActivity}
                title="Crear nueva actividad en el calendario"
              >
                <Plus size={18} />
                <span className="desktop-btn-label">Nueva Actividad</span>
                <span className="mobile-btn-label">Actividad</span>
              </button>
            )}

            {/* Salir de Modo Administrador: ONLY shown when administrator is logged in */}
            {isAdminAuthenticated && onLogoutAdmin && (
              <button 
                className="btn btn-header-logout"
                onClick={onLogoutAdmin}
                title="Cerrar modo administrador para ver la web como un usuario común"
              >
                <LogOut size={16} />
                <span className="desktop-btn-label">Salir de Admin</span>
                <span className="mobile-btn-label">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs with scroll buttons & peek affordance */}
      <nav className="header-nav">
        <div className="container nav-tabs-wrapper-outer">
          {canScrollLeft && (
            <button 
              type="button" 
              className="nav-scroll-btn nav-scroll-btn-left"
              onClick={() => scrollNav('left')}
              aria-label="Desplazar a la izquierda"
              title="Ver pestañas anteriores"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div 
            className={`nav-tabs-scroll ${canScrollLeft ? 'has-overflow-left' : ''} ${canScrollRight ? 'has-overflow-right' : ''} ${isDragging ? 'is-dragging' : ''}`}
            ref={navScrollRef}
            onScroll={checkScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <a 
              href="/" 
              className={`nav-tab-btn ${currentTab === 'general' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'general')}
            >
              <Calendar size={18} />
              <span className="desktop-inline">Calendario Youngers</span>
              <span className="mobile-inline">Calendario</span>
              <span className="nav-counter-pill">{activitiesCount}</span>
            </a>

            <a 
              href="/jotapece" 
              className={`nav-tab-btn jotapece-tab ${currentTab === 'jotapece' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'jotapece')}
            >
              <span className="tab-color-dot jotapece-dot"></span>
              <span>Jotapece</span>
              <span className="tab-badge-sub desktop-inline">12-17 · Sábados</span>
            </a>

            <a 
              href="/siervos" 
              className={`nav-tab-btn siervos-tab ${currentTab === 'siervos' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'siervos')}
            >
              <span className="tab-color-dot siervos-dot"></span>
              <span>Siervos</span>
              <span className="tab-badge-sub desktop-inline">18+ · Viernes</span>
            </a>

            <a 
              href="/periodos" 
              className={`nav-tab-btn periodos-tab ${currentTab === 'periodos' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'periodos')}
              title="Historial de Actividades por Períodos"
            >
              <Archive size={17} />
              <span className="desktop-inline">Períodos &amp; Historial</span>
              <span className="mobile-inline">Períodos</span>
            </a>

            <a 
              href="/servidores" 
              className={`nav-tab-btn ${currentTab === 'servers' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'servers')}
            >
              <Users size={18} />
              <span className="desktop-inline">Servidores &amp; Líderes</span>
              <span className="mobile-inline">Servidores</span>
              <span className="nav-counter-pill">{serversCount}</span>
            </a>

            <a 
              href="/admin" 
              className={`nav-tab-btn admin-tab ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'admin')}
              title="Panel de Administración (Modificación con contraseña)"
            >
              <Settings size={18} />
              <span className="desktop-inline">Administrador</span>
              <span className="mobile-inline">Admin</span>
              {isAdminAuthenticated ? (
                <span className="nav-auth-indicator" title="Sesión activa">●</span>
              ) : (
                <Lock size={13} className="nav-lock-icon" />
              )}
            </a>
          </div>

          {canScrollRight && (
            <button 
              type="button" 
              className="nav-scroll-btn nav-scroll-btn-right"
              onClick={() => scrollNav('right')}
              aria-label="Desplazar a la derecha"
              title="Ver más pestañas"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </nav>
    </header>
  </>
  );
}


