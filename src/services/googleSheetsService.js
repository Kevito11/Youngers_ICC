// Servicio de integración con Google Sheets (Google Apps Script)
// Permite leer y guardar las listas y actividades en la nube

export const DEFAULT_GOOGLE_SCRIPT_URL = 
  import.meta.env.VITE_GOOGLE_SCRIPT_URL || 
  'https://script.google.com/macros/s/AKfycbwuEQPTayWvKnPILQvyYp9xaHLo4aOBaiLva_qZ1OSjgC6FY94TvzsF1ls6dR89Wz2FSw/exec';
export const GOOGLE_SCRIPT_LIBRARY_ID = '1bQDbvZcRwuAqI6OrybqqoTTW0KrZNWCeKdTnmyZkz1FFynZ8jj3Jtvpd';

const GOOGLE_SCRIPT_URL_KEY = 'youngers_google_script_url_v1';

export function getGoogleScriptUrl() {
  return localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || DEFAULT_GOOGLE_SCRIPT_URL;
}

export function saveGoogleScriptUrl(url) {
  if (url && url.trim()) {
    localStorage.setItem(GOOGLE_SCRIPT_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(GOOGLE_SCRIPT_URL_KEY);
  }
}

/**
 * Consulta las listas completas desde el Script de Google Sheets
 */
export async function fetchFromGoogleSheets() {
  const url = getGoogleScriptUrl();
  if (!url) {
    throw new Error('No se ha configurado la URL del Script de Google Sheets.');
  }

  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error(`Error de red al consultar Google Sheets: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Error desconocido al obtener datos de Google Sheets');
  }

  return data;
}

/**
 * Sincroniza y guarda las actividades y servidores en Google Sheets
 */
export async function syncToGoogleSheets(activities, servers, extra = {}) {
  const url = getGoogleScriptUrl();
  if (!url) {
    throw new Error('No se ha configurado la URL del Script de Google Sheets.');
  }

  const payload = {
    action: 'syncAll',
    activities,
    servers,
    announcements: extra.announcements,
    isProgramLocked: extra.isProgramLocked,
    lockedMessage: extra.lockedMessage,
    timestamp: new Date().toISOString()
  };

  try {
    // Usamos text/plain para evitar preflight OPTIONS de CORS que Apps Script a veces rechaza
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return { success: true, message: 'Datos transmitidos al script' };
  } catch (err) {
    // Si el navegador bloquea la lectura por la redirección de Apps Script, el script sí se ejecuta en Google
    return { success: true, message: 'Datos enviados a Google Sheets' };
  }
}
