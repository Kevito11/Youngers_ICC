// Catálogos y Listas Maestras para Youngers ICC
// Sincronizables con Google Sheets / Google Apps Script

// 1. Grupos de Jóvenes
export const GROUPS_CATALOG = [
  { id: 'jotapece', name: 'Jotapece (JPC 12–17 · Sábados)', shortName: 'Jotapece', dayDefault: 'Sáb' },
  { id: 'siervos', name: 'Siervos (121 18+ · Viernes)', shortName: 'Siervos', dayDefault: 'Vie' },
  { id: 'ambos', name: 'Ambos grupos (Siervos y Jotapece)', shortName: 'Ambos', dayDefault: 'Sáb' }
];

// 2. Lugares Registrados (El tipo de ubicación está implícito en el lugar)
export const LOCATIONS_CATALOG = [
  {
    id: 'multiusos',
    name: 'Salón multiusos',
    locationType: 'multiusos',
    isCustom: false,
    description: 'Sede habitual interna de reuniones de Jóvenes ICC'
  },
  {
    id: 'auditorio',
    name: 'Auditorio principal ICC',
    locationType: 'auditorio',
    isCustom: false,
    description: 'Templo principal de la Iglesia Convertidos a Cristo'
  },
  {
    id: 'sin_reunion',
    name: 'Sin reunión de grupo',
    locationType: 'sin_reunion',
    isCustom: false,
    description: 'Fin de semana libre o sin actividad presencial de jóvenes'
  },
  {
    id: 'fuera',
    name: 'Fuera de ICC (Sede externa / Fuera de lo establecido)',
    locationType: 'fuera',
    isCustom: true,
    description: 'Actividad en otra iglesia, parque, retiro o punto exterior'
  }
];

// 3. Horarios Habituales por Grupo
export const STANDARD_SCHEDULES = {
  jotapece: {
    prepTime: '5:00 – 7:00 pm',
    prepStart: '17:00',
    prepEnd: '19:00',
    activityTime: '7:00 – 9:00 pm',
    actStart: '19:00',
    actEnd: '21:00',
    teardownTime: '9:00 – 9:30 pm'
  },
  siervos: {
    prepTime: '6:00 – 8:00 pm',
    prepStart: '18:00',
    prepEnd: '20:00',
    activityTime: '8:00 – 9:30 pm',
    actStart: '20:00',
    actEnd: '21:30',
    teardownTime: '9:30 – 10:00 pm'
  },
  ambos: {
    prepTime: '5:00 – 7:00 pm',
    prepStart: '17:00',
    prepEnd: '19:00',
    activityTime: '7:00 – 9:30 pm',
    actStart: '19:00',
    actEnd: '21:30',
    teardownTime: '9:30 – 10:00 pm'
  }
};

// 4. Bloques o Actividades Típicas del Programa Minuto a Minuto (con descripción predeterminada)
export const PROGRAM_BLOCKS_CATALOG = [
  {
    title: 'Montaje técnico y cableado',
    defaultTime: '5:00 - 6:00 pm',
    defaultResp: 'Sonido y Multimedia',
    description: 'Instalación de consola de sonido, micrófonos, instrumentos, proyector y cableado del púlpito.'
  },
  {
    title: 'Prueba de sonido y ensayo musical',
    defaultTime: '6:00 - 6:30 pm',
    defaultResp: 'Banda / Equipo de Alabanza',
    description: 'Ensayo de las canciones pautadas, niveles acústicos, monitoreo y balance instrumental.'
  },
  {
    title: 'Oración de líderes y servidores',
    defaultTime: '6:30 - 6:50 pm',
    defaultResp: 'Joel Guzmán, Todo el equipo',
    description: 'Clamor en unidad por los jóvenes que llegarán y consagración de los servidores.'
  },
  {
    title: 'Apertura de puertas y bienvenida',
    defaultTime: '6:50 - 7:00 pm',
    defaultResp: 'Recepción y Bienvenida',
    description: 'Recibir a cada joven con gafete, registro de asistencia y música ambiental.'
  },
  {
    title: 'Inicio y Dinámica Rompehielos',
    defaultTime: '7:00 - 7:15 pm',
    defaultResp: 'Emmanuel Torres (Dinámicas)',
    description: 'Juego de integración grupal y bienvenida enfocado en la temática de la reunión.'
  },
  {
    title: 'Tiempo de Alabanza y Adoración',
    defaultTime: '7:15 - 7:45 pm',
    defaultResp: 'Banda y Dirección Musical',
    description: 'Cantos de júbilo y momento devocional congregacional guiando a los jóvenes a adorar al Señor.'
  },
  {
    title: 'Anuncios y Ofrenda',
    defaultTime: '7:45 - 7:50 pm',
    defaultResp: 'Líder de culto / Coordinador',
    description: 'Próximas actividades, campamentos, avisos generales y motivación bíblica a la generosidad.'
  },
  {
    title: 'Mensaje de la Palabra / Enseñanza',
    defaultTime: '7:50 - 8:30 pm',
    defaultResp: 'Predicador designado',
    description: 'Exposición bíblica de las Sagradas Escrituras y aplicación cristocéntrica para la vida juvenil.'
  },
  {
    title: 'Grupos Pequeños / Ministración',
    defaultTime: '8:30 - 8:50 pm',
    defaultResp: 'Líderes de células',
    description: 'Preguntas guiadas de aplicación del mensaje, tiempo de oración y pastoreo en comunidad.'
  },
  {
    title: 'Refrigerio y Comunión',
    defaultTime: '8:50 - 9:00 pm',
    defaultResp: 'Sofía Ramírez (Hospitalidad)',
    description: 'Distribución ordenada de refrigerio, merienda y tiempo de fraternidad entre los jóvenes.'
  },
  {
    title: 'Desmontaje, recogida y limpieza',
    defaultTime: '9:00 - 9:30 pm',
    defaultResp: 'Todo el equipo Youngers',
    description: 'Recogida de equipos, limpieza general y cierre del recinto.'
  }
];

// 5. Catálogo de Roles de Servidores con Descripciones / Responsabilidades
export const DEFAULT_SERVER_ROLES = [
  {
    role: 'Coordinador del Servicio',
    duties: 'Coordinar la apertura, transiciones y desarrollo general de la logística del culto.'
  },
  {
    role: 'Predicador / Mensaje',
    duties: 'Exposición bíblica de las Sagradas Escrituras y ministración de los jóvenes.'
  },
  {
    role: 'Dirección de Alabanza',
    duties: 'Guiar el tiempo congregacional devocional de alabanza y adoración al Señor.'
  },
  {
    role: 'Voz y Coros',
    duties: 'Apoyo vocal armónico en el equipo de alabanza.'
  },
  {
    role: 'Guitarra Acústica / Eléctrica',
    duties: 'Ejecución instrumental de cuerdas y acordes del repertorio de cantos.'
  },
  {
    role: 'Bajo Eléctrico',
    duties: 'Base armónica y rítmica en el equipo de música.'
  },
  {
    role: 'Batería / Percusión',
    duties: 'Marcación de tempo y dinámica rítmica de los cantos.'
  },
  {
    role: 'Piano / Teclado',
    duties: 'Acompañamiento armónico y ambiental durante la adoración.'
  },
  {
    role: 'Sonido y Audio FOH',
    duties: 'Ecualización, calibración de micrófonos, niveles de monitoreo y sala principal.'
  },
  {
    role: 'Multimedia y Proyección',
    duties: 'Proyección puntual de letras de cantos, citas bíblicas, diapositivas y avisos.'
  },
  {
    role: 'Transmisión / Cámaras',
    duties: 'Operación de cámaras y monitoreo de la señal en vivo.'
  },
  {
    role: 'Recepción y Bienvenida',
    duties: 'Recibir cordialmente con gafetes a los jóvenes y nuevos asistentes en la entrada.'
  },
  {
    role: 'Registro y Asistencia',
    duties: 'Toma de asistencia y recopilación de datos de nuevos contactos.'
  },
  {
    role: 'Dinámica y Rompehielos',
    duties: 'Conducir el juego de integración inicial de forma ordenada y entretenida.'
  },
  {
    role: 'Refrigerio y Hospitalidad',
    duties: 'Preparación, servicio higiénico y distribución de la merienda a los jóvenes.'
  },
  {
    role: 'Logística y Montaje',
    duties: 'Organización de sillas, orden del salón y asistencia técnica antes del inicio.'
  },
  {
    role: 'Desmontaje y Cierre',
    duties: 'Recogida de instrumentos, cables, limpieza y cierre de instalaciones.'
  },
  {
    role: 'Apoyo General',
    duties: 'Disponibilidad para cualquier apoyo logístico requerido durante el culto.'
  }
];

// 6. Catálogo de Horas Disponibles para el Programa
export const DEFAULT_PROGRAM_HOURS = [
  '5:00 pm',
  '5:30 pm',
  '6:00 pm',
  '6:15 pm',
  '6:30 pm',
  '6:45 pm',
  '6:50 pm',
  '7:00 pm',
  '7:10 pm',
  '7:15 pm',
  '7:30 pm',
  '7:45 pm',
  '7:50 pm',
  '8:00 pm',
  '8:15 pm',
  '8:30 pm',
  '8:45 pm',
  '8:50 pm',
  '9:00 pm',
  '9:15 pm',
  '9:30 pm',
  '9:45 pm',
  '10:00 pm'
];

const STORAGE_CUSTOM_ROLES_KEY = 'youngers_custom_roles_v2';
const STORAGE_CUSTOM_HOURS_KEY = 'youngers_custom_hours_v2';

export function loadStoredRoles() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_ROLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading roles catalog', e);
  }
  return DEFAULT_SERVER_ROLES;
}

export function saveStoredRoles(roles) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_ROLES_KEY, JSON.stringify(roles));
  } catch (e) {
    console.error('Error saving roles catalog', e);
  }
}

export function loadStoredHours() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_HOURS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading hours catalog', e);
  }
  return DEFAULT_PROGRAM_HOURS;
}

export function saveStoredHours(hours) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_HOURS_KEY, JSON.stringify(hours));
  } catch (e) {
    console.error('Error saving hours catalog', e);
  }
}

// Exportación para compatibilidad
export const SERVER_ROLES_CATALOG = DEFAULT_SERVER_ROLES.map(r => r.role);

// Meses en español abreviados y completos
export const MONTHS_MAP = {
  '01': { short: 'ene', name: 'enero' },
  '02': { short: 'feb', name: 'febrero' },
  '03': { short: 'mar', name: 'marzo' },
  '04': { short: 'abr', name: 'abril' },
  '05': { short: 'may', name: 'mayo' },
  '06': { short: 'jun', name: 'junio' },
  '07': { short: 'jul', name: 'julio' },
  '08': { short: 'ago', name: 'agosto' },
  '09': { short: 'sep', name: 'septiembre' },
  '10': { short: 'oct', name: 'octubre' },
  '11': { short: 'nov', name: 'noviembre' },
  '12': { short: 'dic', name: 'diciembre' }
};

export const DAYS_OF_WEEK_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Descompone una fecha YYYY-MM-DD en sus componentes normalizados:
 * día de la semana, número de día, mes abreviado y año.
 */
export function parseDateComponents(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const year = parts[0];
  const monthKey = parts[1];
  const dayNumber = String(parseInt(parts[2], 10));

  // Instanciar fecha para obtener el día de la semana exacto
  const d = new Date(parseInt(year, 10), parseInt(monthKey, 10) - 1, parseInt(parts[2], 10));
  const dayOfWeek = DAYS_OF_WEEK_SHORT[d.getDay()] || 'Sáb';
  const monthInfo = MONTHS_MAP[monthKey] || { short: 'oct', name: 'octubre' };

  return {
    fullDate: dateStr,
    dayOfWeek,
    dayNumber,
    month: monthInfo.short,
    monthFull: monthInfo.name,
    year
  };
}

/**
 * Reconstruye una fecha YYYY-MM-DD a partir de componentes si no existiera fullDate
 */
export function buildDateStr(year, monthShort, dayNumber) {
  const y = year || '2026';
  let m = '10';
  for (const [k, v] of Object.entries(MONTHS_MAP)) {
    if (v.short === (monthShort || '').toLowerCase()) {
      m = k;
      break;
    }
  }
  const d = String(dayNumber || '1').padStart(2, '0');
  return `${y}-${m}-${d}`;
}
