import React from 'react';
import { Info, Sparkles } from './Icons';

export default function FooterNotes({ announcements = [] }) {
  return (
    <section className="footer-notes-section">
      <div className="container">
        <div className="footer-notes-card">
          <div className="footer-notes-header">
            <Info size={18} className="notes-icon" />
            <span className="notes-title">Notas de Logística &amp; Avisos Importantes</span>
          </div>
          
          <ul className="footer-notes-list">
            {announcements.map((note, idx) => (
              <li key={idx} className="footer-note-item">
                <span className="note-bullet">•</span>
                <span className="note-text">{note}</span>
              </li>
            ))}
          </ul>

          <div className="footer-notes-meta">
            <span>Ministerio de Jóvenes · Iglesia Convertidos a Cristo (ICC)</span>
            <span className="separator">·</span>
            <span>Santo Domingo, República Dominicana</span>
          </div>
        </div>
      </div>
    </section>
  );
}
