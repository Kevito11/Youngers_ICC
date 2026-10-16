/**
 * Parser inteligente asistido por Gemini AI.
 * 
 * Arquitectura híbrida y resiliente:
 * - En Desarrollo Local (localhost con `npm run dev`): Utiliza directamente la API de Gemini
 *   con VITE_GEMINI_API_KEY desde .env para pruebas instantáneas sin requerir la CLI de Netlify.
 * - En Producción (Netlify): Realiza peticiones POST a la función serverless segura
 *   en /.netlify/functions/parseProgram utilizando GEMINI_API_KEY en el servidor.
 */

const NETLIFY_FUNCTION_URL = '/.netlify/functions/parseProgram';
const VITE_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

// Modelos activos de Gemini en orden de preferencia
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];

/**
 * Normaliza horas escritas como "8:00 – 8:05 p. m.", "7:00pm", "17:45" a "8:00 pm"
 */
export function normalizeTimeString(rawTime) {
  if (!rawTime) return '';
  let str = rawTime.trim().toLowerCase();
  
  // Si viene un rango tipo "8:00 – 8:05 p. m." o "8:00 - 8:05 pm", tomar la hora inicial
  const rangeMatch = str.match(/^(\d{1,2}(?::\d{2})?)\s*(?:am|pm|a\.m\.|p\.m\.)?\s*[-–—a]\s*(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)?/i);
  if (rangeMatch) {
    const period = rangeMatch[3] ? (rangeMatch[3].includes('p') ? 'pm' : 'am') : 'pm';
    const firstPart = rangeMatch[1];
    const [h, m = '00'] = firstPart.split(':');
    return `${parseInt(h, 10)}:${m.padStart(2, '0')} ${period}`;
  }

  const match = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = match[2] || '00';
    let period = match[3] ? (match[3].includes('p') ? 'pm' : 'am') : null;

    if (!period) {
      if (hours >= 1 && hours <= 11) {
        period = (hours >= 1 && hours <= 4) ? 'pm' : (hours >= 5 ? 'pm' : 'am');
      } else if (hours >= 12 && hours <= 23) {
        hours = hours > 12 ? hours - 12 : hours;
        period = 'pm';
      } else {
        period = 'pm';
      }
    }
    return `${hours}:${mins} ${period}`;
  }

  return rawTime.trim();
}

/**
 * Limpia y normaliza el nombre de una persona
 */
export function cleanPersonName(raw) {
  if (!raw) return '';
  let str = raw.trim();
  if (str.startsWith('@')) str = str.slice(1);
  str = str.replace(/\((?:ICC|Icc|icc|Voz|voz|Guitarra|guitarra|Bajo|bajo|Batería|bateria|Teclado|teclado|Piano|piano|videos?|fotos?|audio|sonido)\)/gi, ' ');
  str = str.replace(/\([^)]*\)/g, ' ');
  str = str.replace(/[,;.:\-_/]+$/, '').trim();
  str = str.replace(/\s+/g, ' ').trim();
  if (str.toLowerCase() === 'all' || str.toLowerCase() === 'todos') {
    return 'Todos los servidores';
  }
  return str;
}

/**
 * Normaliza una cadena para comparaciones de nombres
 */
function normalizeNameStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Distancia Levenshtein
 */
function nameLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Calcula un puntaje de similitud (0 a 100) entre un nombre detectado y un servidor del sistema
 */
export function calculateNameMatchScore(targetName, candidateServer) {
  if (!targetName || !candidateServer) return 0;
  const cleanTarget = normalizeNameStr(targetName);
  const cleanCandidate = normalizeNameStr(candidateServer.name || '');
  if (!cleanTarget || !cleanCandidate) return 0;

  if (cleanTarget === cleanCandidate) return 100;

  if (candidateServer.nickname) {
    const cleanNick = normalizeNameStr(candidateServer.nickname);
    if (cleanNick && cleanTarget === cleanNick) return 100;
    if (cleanNick && cleanNick.length >= 4 && cleanTarget.includes(cleanNick)) return 96;
  }

  const tWords = cleanTarget.split(/\s+/).filter(w => w.length > 2);
  const cWords = cleanCandidate.split(/\s+/).filter(w => w.length > 2);

  if (tWords.length === 0 || cWords.length === 0) return 0;

  let matches = 0;
  for (const tw of tWords) {
    if (cWords.some(cw => cw === tw || nameLevenshtein(cw, tw) <= 1)) {
      matches++;
    }
  }

  if (matches >= 2) return 92;
  if (matches === 1 && (tWords.length === 1 || cWords.length === 1)) return 85;

  return 0;
}

/**
 * Busca coincidencia aproximada inteligente de un nombre con una lista de servidores
 */
export function findMatchingServer(name, serverList = [], minScore = 75) {
  if (!name || !serverList || serverList.length === 0) return null;
  let bestMatch = null;
  let highestScore = 0;

  for (const s of serverList) {
    const score = calculateNameMatchScore(name, s);
    if (score > highestScore && score >= minScore) {
      highestScore = score;
      bestMatch = s;
    }
  }

  return bestMatch;
}

/**
 * Busca coincidencia de un rol dentro del catálogo
 */
export function resolveRoleFromCatalog(candidateText, defaultRoleName, rolesCatalog = []) {
  if (!candidateText) return { role: defaultRoleName, duties: '', isUnregistered: true };
  const cleanCandidate = normalizeNameStr(candidateText);

  for (const r of rolesCatalog) {
    const rName = normalizeNameStr(r.role || '');
    if (rName === cleanCandidate) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
  }

  for (const r of rolesCatalog) {
    const rName = normalizeNameStr(r.role || '');
    if (/predic|mensaje/i.test(cleanCandidate) && /predic/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    if (/alabanza|adoraci|cancion|musica|vocal|guitarra|piano|bateria|bajo/i.test(cleanCandidate) && /alabanza/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    if (/diapositiva|letra|pantalla|proyecc|multimedia|slides?/i.test(cleanCandidate) && /multimedia|proyecc/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    if (/sonido|audio|consola|microfono/i.test(cleanCandidate) && /sonido|audio/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    if (/story|foto|video|redes|instagram|ig|tiktok|cobertura/i.test(cleanCandidate) && /redes|fotograf|cobertura|multimedia/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    if (/dinamica|rompehielo|juego|actividad|reto/i.test(cleanCandidate) && /dinamica|rompehielo/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    if (/bienvenida|recepc|puerta|asistenc|hospitalidad|oracion/i.test(cleanCandidate) && /recepc|bienven|hospitalidad/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    if (/desmontaje|limp|recog|cierre/i.test(cleanCandidate) && /desmontaje|cierre|logistica/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
  }

  return {
    role: defaultRoleName,
    duties: `Responsabilidad personalizada: ${defaultRoleName}`,
    isUnregistered: true
  };
}

/**
 * Prompt de extracción estricto para Gemini AI
 */
function buildExtractionPrompt(rawText, registeredServers = [], rolesCatalog = [], attendingServers = []) {
  const simplifiedServers = registeredServers.map(s => ({
    id: s.id,
    name: s.name,
    nickname: s.nickname || '',
    role: s.role || ''
  }));

  const simplifiedRoles = (rolesCatalog || []).map(r => r.role);
  const attendingNames = (attendingServers || []).map(s => s.name || s).join(', ');

  return `Eres un extractor de datos JSON experto y preciso para logística de reuniones de jóvenes de iglesia (Youngers ICC).

Tu objetivo es leer el texto informal (que puede contener horas irregulares como "8:00 – 8:05 p. m.", párrafos multilínea, y listas de responsabilidades), identificar cada bloque de actividad y realizar FUZZY MATCHING inteligente para encontrar qué persona del array 'registeredServers' es la responsable, sin importar si usaron '@' o no.

=== ARRAY DE SERVIDORES REGISTRADOS ===
${JSON.stringify(simplifiedServers, null, 2)}

=== CATÁLOGO DE ROLES VÁLIDOS ===
${JSON.stringify(simplifiedRoles, null, 2)}

${attendingNames ? `=== SERVIDORES QUE ASISTIRÁN CONFIRMADOS ===\n${attendingNames}\n` : ''}

=== TEXTO A PROCESAR ===
"""
${rawText}
"""

=== REGLAS ESTRICTAS DE EXTRACCIÓN ===
1. Agrupa todo el texto que pertenece a cada bloque de tiempo.
2. Identifica la hora ("time"), título de la actividad ("title"), y descripción técnica/reflexiva ("description").
3. Para cada persona mencionada en el bloque (ej. "Michael Ovalles", "Jonatan Chez y Kevin Valdez", "Samuel Luciano"), haz coincidencia difusa (fuzzy matching) con 'registeredServers'.
4. En el campo 'servers', coloca el 'id' del servidor registrado (o su 'name' si no tiene id o si es un invitado no registrado).
5. En la sección final de *RESPONSABILIDADES* o Backstage (ej. "Proyección: Amelia Peralta", "Diapositiva: Noelia Peralta"), extrae las tareas en 'serverAssignments' mapeando el rol al catálogo más cercano (ej. "Multimedia y Proyección").
6. Si detectas un predicador principal en una prédica o mensaje, colócalo en 'detectedPreacher'.
7. Si hay personas que NO están en 'registeredServers' (ej. invitados), añádelas al array 'unregisteredServers'.

DEBES DEVOLVER EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO CON ESTA ESTRUCTURA:
{
  "activities": [
    {
      "time": "8:00 - 8:05 p. m.",
      "title": "Bienvenida y oración",
      "servers": ["ID_o_Nombre_Coincidente"],
      "responsible": "Nombre o Nombres legibles",
      "description": "Texto descriptivo, instrucciones o preguntas que acompañan al bloque"
    }
  ],
  "serverAssignments": [
    {
      "role": "Multimedia y Proyección",
      "serverId": "ID_o_vacio",
      "serverName": "Nombre",
      "status": "Confirmado",
      "duties": "Tarea asignada"
    }
  ],
  "detectedPreacher": "Nombre del predicador o vacío",
  "suggestedSchedules": {
    "prepTime": "6:00 pm – 8:00 pm",
    "activityTime": "8:00 pm – 9:30 pm",
    "teardownTime": "9:30 pm – 10:00 pm"
  },
  "unregisteredServers": [
    {
      "name": "Nombre no encontrado",
      "suggestedRole": "Rol sugerido",
      "suggestedDuties": "Tarea",
      "detectedIn": "Bloque donde se detectó"
    }
  ]
}`;
}

/**
 * Llamada directa a la API de Gemini (utilizada en desarrollo local o como respaldo)
 */
async function callDirectGemini(payload, apiKey) {
  const prompt = buildExtractionPrompt(
    payload.rawText, 
    payload.registeredServers, 
    payload.rolesCatalog, 
    payload.attendingServers
  );

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error(`Modelo ${model} no devolvió texto.`);

      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      lastError = err;
      console.warn(`Llamada directa con ${model} falló:`, err.message);
    }
  }

  throw lastError || new Error('No fue posible procesar el texto con Gemini API directamente.');
}

/**
 * Llamada a la Netlify Function /.netlify/functions/parseProgram
 */
async function callNetlifyFunction(payload) {
  const res = await fetch(NETLIFY_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.error) errorMsg = errData.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'La función de Netlify no devolvió datos válidos.');
  }

  return json.data;
}

/**
 * Función principal: Envía la petición a Gemini
 */
export async function parseSmartProgramText(text, attendingServers = [], allRegisteredServers = [], rolesCatalog = []) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      success: false,
      error: 'El texto ingresado está vacío.'
    };
  }

  try {
    const payload = {
      rawText: text,
      registeredServers: (allRegisteredServers || []).map(s => ({
        id: s.id,
        name: s.name,
        nickname: s.nickname || '',
        role: s.role || '',
        primaryAreas: s.primaryAreas || []
      })),
      rolesCatalog: (rolesCatalog || []).map(r => ({
        role: r.role,
        duties: r.duties || ''
      })),
      attendingServers: (attendingServers || []).map(s => ({
        id: s.id,
        name: s.name || s
      }))
    };

    let data = null;

    // 1. Si estamos en local (localhost) y existe VITE_GEMINI_API_KEY, usar directamente la API
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.')
    );

    if (isLocalhost && VITE_API_KEY) {
      try {
        data = await callDirectGemini(payload, VITE_API_KEY);
      } catch (err) {
        console.warn('Llamada directa local falló, intentando Netlify Function...', err);
      }
    }

    // 2. Si no se ha resuelto, llamar a la Netlify Function
    if (!data) {
      try {
        data = await callNetlifyFunction(payload);
      } catch (netlifyErr) {
        // 3. Fallback de respaldo con la API directa si la función falló
        if (VITE_API_KEY) {
          data = await callDirectGemini(payload, VITE_API_KEY);
        } else {
          throw netlifyErr;
        }
      }
    }

    if (!data) {
      throw new Error('No se recibieron datos estructurados de Gemini.');
    }

    // Normalizar 'activities' devueltas por Gemini al formato esperado por el modal
    const activitiesRaw = Array.isArray(data.activities) 
      ? data.activities 
      : (Array.isArray(data.programSteps) ? data.programSteps : []);

    const programSteps = activitiesRaw.map(act => {
      let responsibleText = act.responsible || '';
      if (!responsibleText && Array.isArray(act.servers) && act.servers.length > 0) {
        responsibleText = act.servers.map(servIdOrName => {
          const found = allRegisteredServers.find(s => s.id === servIdOrName);
          return found ? found.name : servIdOrName;
        }).join(', ');
      }

      return {
        time: normalizeTimeString(act.time) || act.time || '7:00 pm',
        title: act.title || 'Actividad del programa',
        responsible: responsibleText || 'Por designar',
        description: act.description || '',
        completed: false
      };
    });

    // Procesar asignaciones de servidores
    const serverAssignmentsRaw = Array.isArray(data.serverAssignments) ? data.serverAssignments : [];
    const serverAssignments = serverAssignmentsRaw.map(asg => {
      let serverId = asg.serverId || '';
      let serverName = asg.serverName || 'Servidor';

      if (!serverId && allRegisteredServers.length > 0) {
        const matched = findMatchingServer(serverName, allRegisteredServers);
        if (matched) {
          serverId = matched.id;
          serverName = matched.name;
        }
      }

      return {
        role: asg.role || 'Servidor de Apoyo General',
        serverId,
        serverName,
        status: asg.status || 'Confirmado',
        duties: asg.duties || 'Labor asignada'
      };
    });

    // Asegurar que servidores confirmados del Paso 1 aparezcan en la lista
    if (Array.isArray(attendingServers) && attendingServers.length > 0) {
      attendingServers.forEach(srv => {
        const alreadyPresent = serverAssignments.some(asg => 
          (srv.id && asg.serverId === srv.id) || 
          (asg.serverName && asg.serverName.toLowerCase() === (srv.name || '').toLowerCase())
        );
        if (!alreadyPresent) {
          const defaultRole = resolveRoleFromCatalog(srv.role || 'Servidor de Apoyo General', 'Servidor de Apoyo General', rolesCatalog);
          serverAssignments.push({
            role: defaultRole.role,
            serverId: srv.id || '',
            serverName: srv.name || 'Servidor Confirmado',
            status: 'Confirmado',
            duties: 'Equipo de apoyo logístico del servicio'
          });
        }
      });
    }

    const unregisteredServers = Array.isArray(data.unregisteredServers) 
      ? data.unregisteredServers.filter(u => !findMatchingServer(u.name, allRegisteredServers, 90))
      : [];

    return {
      success: true,
      programSteps,
      serverAssignments,
      detectedPreacher: data.detectedPreacher || '',
      suggestedSchedules: {
        prepTime: data.suggestedSchedules?.prepTime || '6:00 pm – 8:00 pm',
        activityTime: data.suggestedSchedules?.activityTime || '8:00 pm – 9:30 pm',
        teardownTime: data.suggestedSchedules?.teardownTime || '9:30 pm – 10:00 pm'
      },
      unregisteredServers,
      unregisteredRoles: Array.isArray(data.unregisteredRoles) ? data.unregisteredRoles : [],
      rawLineCount: text.split(/\r?\n/).filter(Boolean).length
    };
  } catch (error) {
    console.error('Error al procesar programa:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al conectar con el servicio de análisis de Gemini.'
    };
  }
}
