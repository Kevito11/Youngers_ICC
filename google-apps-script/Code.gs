/**
 * GOOGLE APPS SCRIPT - API BACKEND PARA YOUNGERS ICC
 * ----------------------------------------------------
 * Este script se coloca en Google Sheets en:
 * Extensiones > Apps Script > Pegar este código > Implementar como Aplicación Web.
 *
 * Características:
 * 1. setupSheets(): Inicializa y da formato automático a todas las pestañas de Google Sheets.
 * 2. doGet(e): Devuelve en formato JSON todas las listas, actividades, servidores y catálogos.
 * 3. doPost(e): Permite guardar, modificar o eliminar actividades y sincronizar el estado.
 */

// Nombre de las hojas en Google Sheets
const SHEETS = {
  ACTIVITIES: 'Actividades',
  PROGRAMS: 'Programas',
  SERVERS: 'Servidores',
  LOCATIONS: 'Lugares',
  CATALOG_BLOCKS: 'BloquesCatalogo',
  CONFIG: 'Configuracion',
  OBSERVATIONS: 'ObservacionesLideres'
};

/**
 * Función inicial para crear todas las pestañas y encabezados en la hoja de cálculo.
 * Ejecútala una sola vez desde el editor de Apps Script (botón 'Ejecutar').
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Hoja de Actividades
  let actSheet = ss.getSheetByName(SHEETS.ACTIVITIES) || ss.insertSheet(SHEETS.ACTIVITIES);
  actSheet.clear();
  actSheet.appendRow([
    'ID', 'Grupo', 'Fecha (YYYY-MM-DD)', 'Día Semana', 'Día', 'Mes', 'Año', 
    'Título / Serie', 'Predicador', 'Lugar', 'Tipo Ubicación', 'Es Sede Externa', 
    'Lugar Externo', 'Dirección Externa', 'GPS Map URL', 'Notas Transporte', 
    'Horario Montaje', 'Horario Culto', 'Horario Desmontaje', 'Programa Bloqueado', 'Notas Generales',
    'Asignaciones Servidores (JSON)', 'Observaciones Líderes (JSON)'
  ]);
  formatHeaderRow(actSheet);

  // 2. Hoja de Programas (Minuto a minuto por actividad)
  let progSheet = ss.getSheetByName(SHEETS.PROGRAMS) || ss.insertSheet(SHEETS.PROGRAMS);
  progSheet.clear();
  progSheet.appendRow([
    'ID Actividad', 'Orden', 'Horario Bloque', 'Título Bloque', 'Responsable', 'Descripción', 'Completado (True/False)'
  ]);
  formatHeaderRow(progSheet);

  // 3. Hoja de Servidores (Directorio con sus datos)
  let srvSheet = ss.getSheetByName(SHEETS.SERVERS) || ss.insertSheet(SHEETS.SERVERS);
  srvSheet.clear();
  srvSheet.appendRow([
    'ID Servidor', 'Nombre Completo', 'Apodo / Conocido', 'Rol Principal', 
    'Grupos (Separados por coma)', 'Áreas Principales', 'Teléfono', 'Email', 'Activo (True/False)'
  ]);
  formatHeaderRow(srvSheet);

  // 4. Hoja de Lugares Registrados
  let locSheet = ss.getSheetByName(SHEETS.LOCATIONS) || ss.insertSheet(SHEETS.LOCATIONS);
  locSheet.clear();
  locSheet.appendRow([
    'ID Lugar', 'Nombre del Lugar', 'Tipo de Ubicación', 'Es Externo (True/False)', 'Descripción'
  ]);
  locSheet.appendRow(['multiusos', 'Salón multiusos', 'multiusos', false, 'Sede habitual interna de reuniones de Jóvenes ICC']);
  locSheet.appendRow(['auditorio', 'Auditorio principal ICC', 'auditorio', false, 'Templo principal de la Iglesia Convertidos a Cristo']);
  locSheet.appendRow(['sin_reunion', 'Sin reunión de grupo', 'sin_reunion', false, 'Fin de semana libre o sin actividad presencial']);
  locSheet.appendRow(['fuera', 'Fuera de ICC (Sede externa)', 'fuera', true, 'Actividad en otra iglesia, parque, retiro o punto exterior']);
  formatHeaderRow(locSheet);

  // 5. Hoja de Bloques de Servicio (Catálogo con descripciones)
  let blkSheet = ss.getSheetByName(SHEETS.CATALOG_BLOCKS) || ss.insertSheet(SHEETS.CATALOG_BLOCKS);
  blkSheet.clear();
  blkSheet.appendRow(['Nombre del Bloque', 'Horario Sugerido', 'Responsable Sugerido', 'Descripción Detallada']);
  blkSheet.appendRow(['Montaje técnico y cableado', '5:00 - 6:00 pm', 'Sonido y Multimedia', 'Instalación de consola de sonido, micrófonos, instrumentos y proyector.']);
  blkSheet.appendRow(['Prueba de sonido y ensayo musical', '6:00 - 6:30 pm', 'Banda / Alabanza', 'Ensayo de las canciones pautadas, niveles acústicos y monitoreo.']);
  blkSheet.appendRow(['Oración de líderes y servidores', '6:30 - 6:50 pm', 'Líder de Culto / Equipo', 'Clamor en unidad por los jóvenes que llegarán y consagración de los servidores.']);
  blkSheet.appendRow(['Apertura de puertas y bienvenida', '6:50 - 7:00 pm', 'Recepción', 'Recibir a cada joven con gafete, registro de asistencia y música ambiental.']);
  blkSheet.appendRow(['Inicio y Dinámica Rompehielos', '7:00 - 7:15 pm', 'Equipo de Dinámicas', 'Juego de integración grupal y bienvenida enfocado en la temática de la reunión.']);
  blkSheet.appendRow(['Tiempo de Alabanza y Adoración', '7:15 - 7:45 pm', 'Banda / Alabanza', 'Cantos de júbilo y momento devocional congregacional guiando a los jóvenes a adorar al Señor.']);
  blkSheet.appendRow(['Anuncios y Ofrenda', '7:45 - 7:50 pm', 'Líder / Coordinador', 'Próximas actividades, campamentos, avisos generales y motivación bíblica a la generosidad.']);
  blkSheet.appendRow(['Mensaje de la Palabra / Enseñanza', '7:50 - 8:30 pm', 'Predicador', 'Exposición bíblica de las Sagradas Escrituras y aplicación cristocéntrica.']);
  blkSheet.appendRow(['Grupos Pequeños / Ministración', '8:30 - 8:50 pm', 'Líderes de células', 'Preguntas guiadas de aplicación del mensaje, tiempo de oración y pastoreo en comunidad.']);
  blkSheet.appendRow(['Refrigerio y Comunión', '8:50 - 9:00 pm', 'Hospitalidad', 'Distribución ordenada de refrigerio y momento de fraternidad entre los jóvenes.']);
  blkSheet.appendRow(['Desmontaje, recogida y limpieza', '9:00 - 9:30 pm', 'Todo el equipo', 'Recogida de equipos, limpieza general y cierre del salón.']);
  formatHeaderRow(blkSheet);

  // 6. Hoja de Configuración
  let cfgSheet = ss.getSheetByName(SHEETS.CONFIG) || ss.insertSheet(SHEETS.CONFIG);
  cfgSheet.clear();
  cfgSheet.appendRow(['Clave', 'Valor']);
  cfgSheet.appendRow(['programa_bloqueado_global', 'false']);
  cfgSheet.appendRow(['mensaje_bloqueo', 'El programa de actividades y logística se encuentra en preparación por el equipo de liderazgo y no está listo aún.']);
  cfgSheet.appendRow(['anuncios_json', JSON.stringify(['Llegar 15 minutos antes de su horario de servicio asignado.', 'Para cambios de turno, avisar con 48h de anticipación.'])]);
  formatHeaderRow(cfgSheet);

  // 7. Hoja de Observaciones y Mejoras de Líderes de Jóvenes
  let obsSheet = ss.getSheetByName(SHEETS.OBSERVATIONS) || ss.insertSheet(SHEETS.OBSERVATIONS);
  obsSheet.clear();
  obsSheet.appendRow([
    'ID Actividad', 'Título Actividad', 'Fecha Actividad', 'Grupo', 
    'Líderes', 'Categoría', 'Observación / Sugerencia de Mejora', 'Fecha Registro'
  ]);
  formatHeaderRow(obsSheet);

  SpreadsheetApp.flush();
  Logger.log('¡Hojas y catálogos de Youngers ICC inicializados exitosamente!');
}

function formatHeaderRow(sheet) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground('#005662');
  range.setFontColor('#ffffff');
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * GET ENDPOINT: Retorna todas las actividades, servidores y catálogos en JSON
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Obtener Configuración
    let configMap = {};
    const cfgSheet = ss.getSheetByName(SHEETS.CONFIG);
    if (cfgSheet && cfgSheet.getLastRow() > 1) {
      const cfgRows = cfgSheet.getRange(2, 1, cfgSheet.getLastRow() - 1, 2).getValues();
      cfgRows.forEach(r => { configMap[r[0]] = r[1]; });
    }

    // 2. Obtener Servidores
    const servers = [];
    const srvSheet = ss.getSheetByName(SHEETS.SERVERS);
    if (srvSheet && srvSheet.getLastRow() > 1) {
      const srvRows = srvSheet.getRange(2, 1, srvSheet.getLastRow() - 1, 9).getValues();
      srvRows.forEach(r => {
        if (!r[0]) return;
        servers.push({
          id: String(r[0]),
          name: String(r[1] || ''),
          nickname: String(r[2] || ''),
          role: String(r[3] || ''),
          groups: String(r[4] || 'jotapece,siervos').split(',').map(s => s.trim().toLowerCase()),
          primaryAreas: String(r[5] || '').split(',').map(s => s.trim()).filter(Boolean),
          phone: String(r[6] || ''),
          email: String(r[7] || ''),
          active: r[8] === true || String(r[8]).toLowerCase() === 'true'
        });
      });
    }

    // 3. Obtener Programas agrupados por ActivityID
    const programsByAct = {};
    const progSheet = ss.getSheetByName(SHEETS.PROGRAMS);
    if (progSheet && progSheet.getLastRow() > 1) {
      const progRows = progSheet.getRange(2, 1, progSheet.getLastRow() - 1, 7).getValues();
      progRows.forEach(r => {
        const actId = String(r[0]);
        if (!actId) return;
        if (!programsByAct[actId]) programsByAct[actId] = [];
        programsByAct[actId].push({
          time: String(r[2] || ''),
          title: String(r[3] || ''),
          responsible: String(r[4] || ''),
          description: String(r[5] || ''),
          completed: r[6] === true || String(r[6]).toLowerCase() === 'true'
        });
      });
    }

    // 4. Obtener Actividades
    const activities = [];
    const actSheet = ss.getSheetByName(SHEETS.ACTIVITIES);
    if (actSheet && actSheet.getLastRow() > 1) {
      const totalCols = Math.max(23, actSheet.getLastColumn());
      const actRows = actSheet.getRange(2, 1, actSheet.getLastRow() - 1, totalCols).getValues();
      actRows.forEach(r => {
        const id = String(r[0]);
        if (!id) return;

        let serverAssignments = [];
        if (r[21]) {
          try {
            serverAssignments = typeof r[21] === 'string' ? JSON.parse(r[21]) : r[21];
          } catch (e) {
            serverAssignments = [];
          }
        }

        let observations = [];
        if (r[22]) {
          try {
            observations = typeof r[22] === 'string' ? JSON.parse(r[22]) : r[22];
          } catch (e) {
            observations = [];
          }
        }

        activities.push({
          id: id,
          group: String(r[1] || 'jotapece'),
          fullDate: formatDateValue(r[2]),
          dayOfWeek: String(r[3] || 'Sáb'),
          dayNumber: String(r[4] || ''),
          month: String(r[5] || ''),
          year: String(r[6] || '2026'),
          title: String(r[7] || ''),
          preacher: String(r[8] || ''),
          location: String(r[9] || 'Salón multiusos'),
          locationType: String(r[10] || 'multiusos'),
          isCustomLocation: r[11] === true || String(r[11]).toLowerCase() === 'true',
          customLocationName: String(r[12] || ''),
          customLocationAddress: String(r[13] || ''),
          customLocationMapUrl: String(r[14] || ''),
          customLocationNotes: String(r[15] || ''),
          prepTime: String(r[16] || ''),
          activityTime: String(r[17] || ''),
          teardownTime: String(r[18] || ''),
          isProgramLocked: r[19] === true || String(r[19]).toLowerCase() === 'true',
          notes: String(r[20] || ''),
          program: programsByAct[id] || [],
          serverAssignments: Array.isArray(serverAssignments) ? serverAssignments : [],
          observations: Array.isArray(observations) ? observations : []
        });
      });
    }

    // 5. Obtener Lugares
    const locations = [];
    const locSheet = ss.getSheetByName(SHEETS.LOCATIONS);
    if (locSheet && locSheet.getLastRow() > 1) {
      const locRows = locSheet.getRange(2, 1, locSheet.getLastRow() - 1, 5).getValues();
      locRows.forEach(r => {
        if (!r[0]) return;
        locations.push({
          id: String(r[0]),
          name: String(r[1]),
          locationType: String(r[2]),
          isCustom: r[3] === true || String(r[3]).toLowerCase() === 'true',
          description: String(r[4] || '')
        });
      });
    }

    // 6. Obtener Bloques de Catálogo
    const catalogBlocks = [];
    const blkSheet = ss.getSheetByName(SHEETS.CATALOG_BLOCKS);
    if (blkSheet && blkSheet.getLastRow() > 1) {
      const blkRows = blkSheet.getRange(2, 1, blkSheet.getLastRow() - 1, 4).getValues();
      blkRows.forEach(r => {
        if (!r[0]) return;
        catalogBlocks.push({
          title: String(r[0]),
          defaultTime: String(r[1] || ''),
          defaultResp: String(r[2] || ''),
          description: String(r[3] || '')
        });
      });
    }

    let announcements = [];
    try {
      announcements = JSON.parse(configMap['anuncios_json'] || '[]');
    } catch (e) {
      announcements = [];
    }

    let rolesCatalog = [];
    try {
      rolesCatalog = JSON.parse(configMap['roles_catalog_json'] || '[]');
    } catch (e) {
      rolesCatalog = [];
    }

    let hoursCatalog = [];
    try {
      hoursCatalog = JSON.parse(configMap['hours_catalog_json'] || '[]');
    } catch (e) {
      hoursCatalog = [];
    }

    let serviceAreasCatalog = [];
    try {
      serviceAreasCatalog = JSON.parse(configMap['service_areas_json'] || '[]');
    } catch (e) {
      serviceAreasCatalog = [];
    }

    const payload = {
      success: true,
      timestamp: new Date().toISOString(),
      activities: activities,
      servers: servers,
      locations: locations,
      catalogBlocks: catalogBlocks,
      announcements: announcements,
      rolesCatalog: rolesCatalog,
      hoursCatalog: hoursCatalog,
      serviceAreasCatalog: serviceAreasCatalog,
      isProgramLocked: configMap['programa_bloqueado_global'] === 'true',
      lockedMessage: configMap['mensaje_bloqueo'] || ''
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST ENDPOINT: Permite guardar o sincronizar todo desde la app web
 */
function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const action = body.action || 'syncAll';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'syncAll' && body.activities) {
      // Sincronizar Actividades
      const actSheet = ss.getSheetByName(SHEETS.ACTIVITIES);
      const progSheet = ss.getSheetByName(SHEETS.PROGRAMS);

      // Limpiar y reescribir
      if (actSheet.getLastRow() > 1) {
        const totalCols = Math.max(23, actSheet.getLastColumn());
        actSheet.getRange(2, 1, actSheet.getLastRow() - 1, totalCols).clearContent();
      }
      if (progSheet.getLastRow() > 1) {
        progSheet.getRange(2, 1, progSheet.getLastRow() - 1, 7).clearContent();
      }

      const actRowsToAdd = [];
      const progRowsToAdd = [];
      const obsRowsToAdd = [];

      body.activities.forEach(act => {
        actRowsToAdd.push([
          act.id, act.group, act.fullDate || '', act.dayOfWeek || '', act.dayNumber || '',
          act.month || '', act.year || '2026', act.title || '', act.preacher || '',
          act.location || '', act.locationType || 'multiusos', Boolean(act.isCustomLocation),
          act.customLocationName || '', act.customLocationAddress || '', act.customLocationMapUrl || '',
          act.customLocationNotes || '', act.prepTime || '', act.activityTime || '',
          act.teardownTime || '', Boolean(act.isProgramLocked), act.notes || '',
          JSON.stringify(act.serverAssignments || []),
          JSON.stringify(act.observations || [])
        ]);

        if (Array.isArray(act.program)) {
          act.program.forEach((p, order) => {
            progRowsToAdd.push([
              act.id, order + 1, p.time || '', p.title || '', p.responsible || '', p.description || '', Boolean(p.completed)
            ]);
          });
        }

        if (Array.isArray(act.observations)) {
          act.observations.forEach(obs => {
            obsRowsToAdd.push([
              act.id,
              act.title || '',
              act.fullDate || `${act.dayOfWeek || ''} ${act.dayNumber || ''} ${act.month || ''} ${act.year || ''}`.trim(),
              act.group || '',
              Array.isArray(obs.leaders) ? obs.leaders.join(', ') : (obs.leaders || ''),
              Array.isArray(obs.categories) && obs.categories.length > 0 ? obs.categories.join(', ') : (obs.category || 'General'),
              obs.comment || '',
              obs.createdAt || new Date().toISOString()
            ]);
          });
        }
      });

      if (actRowsToAdd.length > 0) {
        actSheet.getRange(2, 1, actRowsToAdd.length, 23).setValues(actRowsToAdd);
      }
      if (progRowsToAdd.length > 0) {
        progSheet.getRange(2, 1, progRowsToAdd.length, 7).setValues(progRowsToAdd);
      }

      // Sincronizar hoja de Observaciones de Líderes
      const obsSheet = ss.getSheetByName(SHEETS.OBSERVATIONS);
      if (obsSheet) {
        if (obsSheet.getLastRow() > 1) {
          obsSheet.getRange(2, 1, obsSheet.getLastRow() - 1, 8).clearContent();
        }
        if (obsRowsToAdd.length > 0) {
          obsSheet.getRange(2, 1, obsRowsToAdd.length, 8).setValues(obsRowsToAdd);
        }
      }
    }

    if (body.servers && Array.isArray(body.servers)) {
      const srvSheet = ss.getSheetByName(SHEETS.SERVERS);
      if (srvSheet.getLastRow() > 1) {
        srvSheet.getRange(2, 1, srvSheet.getLastRow() - 1, 9).clearContent();
      }
      const srvRowsToAdd = body.servers.map(s => [
        s.id, s.name, s.nickname || '', s.role || '', (s.groups || []).join(','),
        (s.primaryAreas || []).join(','), s.phone || '', s.email || '', s.active !== false
      ]);
      if (srvRowsToAdd.length > 0) {
        srvSheet.getRange(2, 1, srvRowsToAdd.length, 9).setValues(srvRowsToAdd);
      }
    }

    if (body.announcements || body.lockedMessage !== undefined || body.isProgramLocked !== undefined || body.rolesCatalog || body.hoursCatalog || body.serviceAreasCatalog) {
      const cfgSheet = ss.getSheetByName(SHEETS.CONFIG);
      if (cfgSheet) {
        // Leemos configuración previa para no pisar claves no enviadas
        let currentCfg = {};
        if (cfgSheet.getLastRow() > 1) {
          const cfgRows = cfgSheet.getRange(2, 1, cfgSheet.getLastRow() - 1, 2).getValues();
          cfgRows.forEach(r => { if (r[0]) currentCfg[r[0]] = r[1]; });
          cfgSheet.getRange(2, 1, cfgSheet.getLastRow() - 1, 2).clearContent();
        }

        if (body.isProgramLocked !== undefined) currentCfg['programa_bloqueado_global'] = String(Boolean(body.isProgramLocked));
        if (body.lockedMessage !== undefined) currentCfg['mensaje_bloqueo'] = String(body.lockedMessage || '');
        if (body.announcements) currentCfg['anuncios_json'] = JSON.stringify(body.announcements || []);
        if (body.rolesCatalog && Array.isArray(body.rolesCatalog)) currentCfg['roles_catalog_json'] = JSON.stringify(body.rolesCatalog);
        if (body.hoursCatalog && Array.isArray(body.hoursCatalog)) currentCfg['hours_catalog_json'] = JSON.stringify(body.hoursCatalog);
        if (body.serviceAreasCatalog && Array.isArray(body.serviceAreasCatalog)) currentCfg['service_areas_json'] = JSON.stringify(body.serviceAreasCatalog);

        const rowsToWrite = Object.keys(currentCfg).map(k => [k, currentCfg[k]]);
        if (rowsToWrite.length > 0) {
          cfgSheet.getRange(2, 1, rowsToWrite.length, 2).setValues(rowsToWrite);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Datos guardados correctamente en Google Sheets'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDateValue(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return str;
}
