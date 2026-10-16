import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Netlify Function: Proxy backend seguro para procesar programas informales con Gemini AI.
 * Protege la clave GEMINI_API_KEY en el servidor de Netlify sin exponerla en el cliente.
 */
export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Pre-flight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Método no permitido. Se requiere POST.' })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Falta la clave GEMINI_API_KEY (o VITE_GEMINI_API_KEY). Configúrala en el archivo .env o en el panel de Netlify.'
        })
      };
    }

    const { rawText, registeredServers = [], rolesCatalog = [], attendingServers = [] } = JSON.parse(event.body || '{}');

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'El campo rawText es requerido y no puede estar vacío.' })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildExtractionPrompt(rawText, registeredServers, rolesCatalog, attendingServers);

    // Lista de modelos compatibles en orden de preferencia
    const CANDIDATE_MODELS = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];

    let result = null;
    let lastError = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });
        result = await model.generateContent(prompt);
        if (result) break;
      } catch (err) {
        lastError = err;
        console.warn(`Modelo ${modelName} no disponible o falló:`, err.message);
      }
    }

    if (!result) {
      throw lastError || new Error('No se pudo generar respuesta con ninguno de los modelos de Gemini.');
    }

    const responseText = result.response.text();
    
    // Limpiar posibles etiquetas de código markdown
    const cleanedJson = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: parsedData
      })
    };
  } catch (error) {
    console.error('Error en Netlify Function parseProgram:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Error interno al procesar el texto con Gemini en Netlify.'
      })
    };
  }
};

/**
 * Diseña el System Prompt con las variables dinámicas de servidores y roles
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
