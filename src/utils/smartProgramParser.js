/**
 * Parser inteligente para convertir textos informales de programas (por ejemplo, mensajes de WhatsApp o notas)
 * en la estructura formal de una actividad de Youngers ICC.
 * 
 * Soporta servidores confirmados (Paso 1):
 * - Cruza prioritariamente con los servidores indicados que estarán en la actividad.
 * - Garantiza que todos los servidores que estarán queden integrados con sus roles y tareas asignadas.
 * - Utiliza los nombres extraídos directamente aunque no coincidan con los registrados.
 * - NO altera fecha ni título del servicio.
 */

/**
 * Limpia y normaliza el nombre de una persona
 */
export function cleanPersonName(raw) {
  if (!raw) return '';
  let str = raw.trim();

  if (str.startsWith('@')) {
    str = str.slice(1);
  }

  // Quitar etiquetas entre paréntesis
  str = str.replace(/\((?:ICC|Icc|icc|Voz|voz|Guitarra|guitarra|Bajo|bajo|Batería|bateria|Teclado|teclado|Piano|piano|videos?|fotos?|audio|sonido)\)/gi, ' ');
  str = str.replace(/\([^)]*\)/g, ' ');

  // Quitar texto explicativo o conectores residuales
  str = str.replace(/\b(?:y\s+yo|favor\b.*$|colocar\b.*$|toma\s+de\b.*$)/gi, '');
  str = str.replace(/[,;.:\-_/]+$/, '').trim();
  str = str.replace(/\s+(?:y|e)$/i, '').trim();

  // Reducir espacios
  str = str.replace(/\s+/g, ' ').trim();

  if (str.toLowerCase() === 'all' || str.toLowerCase() === 'todos') {
    return 'Todos los servidores';
  }

  return str;
}

/**
 * Extrae todas las menciones limpias de una línea de texto
 */
export function extractMentionsFromLine(line) {
  if (!line || !line.includes('@')) return [];
  const results = [];
  const segments = line.split('@').slice(1);

  for (const seg of segments) {
    let candidate = seg.split(/\r?\n/)[0];
    
    // Cortar frases que no son parte del nombre
    candidate = candidate.replace(/\.\s+(?:Colocar|Favor|Toma|Hablar|Probar|Ajustar|Repasar)\b.*$/i, '');
    candidate = candidate.replace(/\b(?:Colocar|Favor|y\s+toma\s+de\s+asistencia|probar|ajustar)\b.*$/i, '');
    
    const cleaned = cleanPersonName(candidate);
    if (cleaned && cleaned.length > 1 && !results.includes(cleaned)) {
      results.push(cleaned);
    }
  }

  return results;
}

/**
 * Normaliza horas escritas como "5:45pm", "7:00pm", "7pm", "17:45" a "5:45 pm"
 */
export function normalizeTimeString(rawTime) {
  if (!rawTime) return '';
  let str = rawTime.trim().toLowerCase();
  
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
 * Normaliza una cadena para comparaciones de nombres (sin tildes ni caracteres especiales)
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
 * Extrae palabras significativas excluyendo conectores, artículos e iniciales de 1 letra
 */
function getSignificantNameWords(normStr) {
  if (!normStr) return [];
  const stopWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'el', 'en', 'san', 'santa']);
  return normStr
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

/**
 * Distancia Levenshtein para errores tipográficos leves
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
 * Determina si dos palabras corresponden al mismo nombre o variación
 * (ej: 'jonathan' vs 'jonatan', 'samuel' vs 'samuel', 'alejandro' vs 'alex')
 */
function areNameWordsSimilar(w1, w2) {
  if (w1 === w2) return true;
  if (w1.length >= 4 && w2.length >= 4 && (w1.startsWith(w2) || w2.startsWith(w1))) return true;
  const maxLen = Math.max(w1.length, w2.length);
  const dist = nameLevenshtein(w1, w2);
  if (maxLen <= 4) return dist === 0;
  if (maxLen <= 7) return dist <= 1; // e.g. jonatan vs jonathan (dist 1)
  return dist <= 2;
}

/**
 * Calcula un puntaje de similitud (0 a 100) entre un nombre detectado y un servidor del sistema
 */
export function calculateNameMatchScore(targetName, candidateServer) {
  if (!targetName || !candidateServer) return 0;
  const cleanTarget = normalizeNameStr(targetName);
  const cleanCandidate = normalizeNameStr(candidateServer.name || '');
  if (!cleanTarget || !cleanCandidate) return 0;

  // 1. Coincidencia idéntica exacta
  if (cleanTarget === cleanCandidate) return 100;

  // 2. Coincidencia por apodo registrado
  if (candidateServer.nickname) {
    const cleanNick = normalizeNameStr(candidateServer.nickname);
    if (cleanNick && cleanTarget === cleanNick) return 100;
    if (cleanNick && cleanNick.length >= 4 && (cleanTarget.includes(cleanNick) || cleanNick.includes(cleanTarget))) {
      return 96;
    }
  }

  // 3. Análisis profundo de tokens de nombres y apellidos
  const tWords = getSignificantNameWords(cleanTarget);
  const cWords = getSignificantNameWords(cleanCandidate);

  if (tWords.length === 0 || cWords.length === 0) return 0;

  // 4. Subcadena directa con múltiples palabras (ej: "Jonathan Chez" vs "Jonathan Chez (Líder)")
  if (cWords.length >= 2 && cleanCandidate.length >= 6 && cleanTarget.includes(cleanCandidate)) return 95;
  if (tWords.length >= 2 && cleanTarget.length >= 6 && cleanCandidate.includes(cleanTarget)) return 93;

  // Contar palabras de candidate encontradas en target
  let cMatchedInT = 0;
  for (const cw of cWords) {
    if (tWords.some(tw => areNameWordsSimilar(cw, tw))) {
      cMatchedInT++;
    }
  }

  // Contar palabras de target encontradas en candidate
  let tMatchedInC = 0;
  for (const tw of tWords) {
    if (cWords.some(cw => areNameWordsSimilar(tw, cw))) {
      tMatchedInC++;
    }
  }

  // CASO A: Todas las palabras del servidor registrado aparecen en el texto
  // Ejemplo clave: servidor "Samuel Luciano" (2 palabras) vs texto "Samuel Alejandro Luciano" (cMatchedInT = 2)
  // Ejemplo: "Michael Ovalles" vs "Michael E. Ovalles Lalane"
  if (cWords.length >= 2 && cMatchedInT === cWords.length) {
    return 94;
  }

  // CASO B: Todas las palabras del texto aparecen en el servidor registrado
  // Ejemplo: texto "Samuel Luciano" vs servidor registrado "Samuel Alejandro Luciano"
  if (tWords.length >= 2 && tMatchedInC === tWords.length) {
    return 92;
  }

  // CASO C: Coincidencia del primer nombre y al menos un apellido
  // Ejemplo: "Angel Josue Mercedes Rodríguez" vs "Angel Mercedes"
  const firstMatches = areNameWordsSimilar(tWords[0], cWords[0]);
  const tSurnames = tWords.slice(1);
  const cSurnames = cWords.slice(1);
  const anySurnameMatches = tSurnames.some(tw => cSurnames.some(cw => areNameWordsSimilar(tw, cw)));

  if (firstMatches && anySurnameMatches) {
    return 90;
  }

  // CASO D: Dos o más palabras significativas coinciden
  const maxMatches = Math.max(cMatchedInT, tMatchedInC);
  if (maxMatches >= 2) {
    return 80 + (maxMatches * 3);
  }

  // CASO E: Una sola palabra idéntica (solo si ambos nombres son de una sola palabra, ej: "Agustín")
  if (tWords.length === 1 && cWords.length === 1 && areNameWordsSimilar(tWords[0], cWords[0])) {
    return 85;
  }

  return 0;
}

/**
 * Busca coincidencia aproximada inteligente de un nombre con una lista de servidores.
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
 * Busca coincidencia de un rol o función dentro del catálogo de roles establecido.
 */
export function resolveRoleFromCatalog(candidateText, defaultRoleName, rolesCatalog = []) {
  if (!candidateText) return { role: defaultRoleName, duties: '', isUnregistered: true };

  const cleanCandidate = candidateText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // 1. Coincidencia exacta
  for (const r of rolesCatalog) {
    const rName = (r.role || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (rName === cleanCandidate) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
  }

  // 2. Coincidencia semántica con roles del catálogo
  for (const r of rolesCatalog) {
    const rName = (r.role || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    
    // Predicación
    if (/predic|mensaje/i.test(cleanCandidate) && /predic/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Alabanza y Adoración
    if (/alabanza|adoraci|cancion|musica|vocal|guitarra|piano|bateria|bajo/i.test(cleanCandidate) && /alabanza/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Multimedia / Proyección
    if (/diapositiva|letra|pantalla|proyecc|multimedia|slides?/i.test(cleanCandidate) && /multimedia|proyecc/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Sonido / Audio
    if (/sonido|audio|consola|microfono/i.test(cleanCandidate) && /sonido|audio/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Redes / Fotografía / Video
    if (/story|foto|video|redes|instagram|ig|tiktok|cobertura/i.test(cleanCandidate) && /redes|fotograf|cobertura|multimedia/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Dinámicas / Rompehielos
    if (/dinamica|rompehielo|juego|actividad/i.test(cleanCandidate) && /dinamica|rompehielo/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Recepción / Bienvenida
    if (/bienvenida|recepc|puerta|asistenc|hospitalidad/i.test(cleanCandidate) && /recepc|bienven|hospitalidad/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Desmontaje y limpieza
    if (/desmontaje|limp|recog|cierre/i.test(cleanCandidate) && /desmontaje|cierre|logistica/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
    // Coordinador de servicio
    if (/coordin|llegada|repasar|programa|apertura/i.test(cleanCandidate) && /coordinador/i.test(rName)) {
      return { role: r.role, duties: r.duties || '', isUnregistered: false };
    }
  }

  // Si no se encontró en el catálogo, usar el nombre sugerido y marcarlo como no registrado en el sistema
  return {
    role: defaultRoleName,
    duties: `Responsabilidad personalizada: ${defaultRoleName}`,
    isUnregistered: true
  };
}

/**
 * Analiza un texto completo de programa y devuelve los datos estructurados.
 * @param {string} text Texto del programa
 * @param {Array} attendingServers Lista de servidores confirmados que estarán en este servicio (Paso 1)
 * @param {Array} allRegisteredServers Lista general de todos los servidores registrados en la app
 * @param {Array} rolesCatalog Catálogo de roles establecido en el sistema
 */
export function parseSmartProgramText(text, attendingServers = [], allRegisteredServers = [], rolesCatalog = []) {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'El texto ingresado está vacío.'
    };
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  const programSteps = [];
  const assignedServerIds = new Set();
  const assignedNamesMap = new Map();
  const serverAssignments = [];
  let detectedPreacher = '';
  let earliestTime = null;
  let serviceStartTime = null;
  let inBackstageSection = false;
  const rawBackstageItems = [];

  // Mapeos para detectar servidores y roles NO registrados actualmente en el sistema
  const unregisteredServersMap = new Map();
  const unregisteredRolesMap = new Map();

  const timeLineRegex = /^(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|AM|PM)?)\s*[:\-–—]?\s*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^(?:backstage|servidores|asignaciones|equipo de apoyo|apoyo|staff)[\s:]*$/i.test(line)) {
      inBackstageSection = true;
      continue;
    }

    if (inBackstageSection) {
      if (/^out\s*:/i.test(line)) {
        continue;
      }
      rawBackstageItems.push(line);
      continue;
    }

    const timeMatch = line.match(timeLineRegex);
    if (timeMatch) {
      const rawTimeStr = timeMatch[1];
      const remainder = timeMatch[2].trim();
      const normalizedTime = normalizeTimeString(rawTimeStr);

      if (!earliestTime) {
        earliestTime = normalizedTime;
      }

      if (!serviceStartTime && (normalizedTime.startsWith('7:00') || normalizedTime.startsWith('8:00') || normalizedTime.startsWith('6:00'))) {
        serviceStartTime = normalizedTime;
      }

      // Extraer menciones
      const extractedPersons = extractMentionsFromLine(remainder);

      // Limpiar texto removiendo menciones
      let cleanRemainder = remainder;
      cleanRemainder = cleanRemainder.replace(/@[A-Za-zÀ-ÿ0-9\s\.\-_()]+/g, ' ');
      cleanRemainder = cleanRemainder.replace(/\((?:ICC|Icc|icc|Voz|voz|Guitarra|guitarra|videos?|fotos?)\)/gi, ' ');
      cleanRemainder = cleanRemainder.replace(/\b(?:y\s+yo|favor\b.*$)/gi, '');
      cleanRemainder = cleanRemainder.replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '').trim();

      // Determinar Título y Descripción del bloque
      let title = '';
      let description = '';

      const splitColon = cleanRemainder.split(/[:–—]/);
      if (splitColon.length > 1 && splitColon[0].trim().length < 40) {
        title = splitColon[0].trim();
        description = splitColon.slice(1).join(':').trim();
      } else {
        const parenMatch = cleanRemainder.match(/^([^(]+)\s*\(([^)]+)\)\s*(.*)$/);
        if (parenMatch) {
          title = parenMatch[1].trim();
          description = `${parenMatch[2].trim()}${parenMatch[3] ? ' · ' + parenMatch[3].trim() : ''}`;
        } else {
          const words = cleanRemainder.split(/\s+/).filter(Boolean);
          if (words.length <= 6) {
            title = cleanRemainder;
          } else {
            title = words.slice(0, 5).join(' ');
            description = words.slice(5).join(' ');
          }
        }
      }

      if (title) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
      } else {
        title = 'Actividad del programa';
      }

      if (/^rompehielo/i.test(title)) title = 'Dinámica y Rompehielos';
      if (/^alabanza/i.test(title)) title = 'Tiempo de Alabanza y Adoración';
      if (/^bienvenida/i.test(title)) title = 'Apertura de Puertas y Bienvenida';
      if (/^predica/i.test(title)) title = title.replace(/^predica/i, 'Prédica');

      if (/predic|mensaje/i.test(line)) {
        if (extractedPersons.length > 0) {
          const matchedPreacher = findMatchingServer(extractedPersons[0], attendingServers) || findMatchingServer(extractedPersons[0], allRegisteredServers);
          detectedPreacher = matchedPreacher ? matchedPreacher.name : extractedPersons[0];
        }
      }

      // Resolver rol sugerido acorde a lo establecido en rolesCatalog
      let suggestedRoleName = 'Coordinación de Bloque';
      if (title.includes('Prédica')) suggestedRoleName = 'Predicador';
      else if (title.includes('Alabanza')) suggestedRoleName = 'Alabanza y Adoración';
      else if (title.includes('Rompehielo') || title.includes('Dinámica')) suggestedRoleName = 'Dinámicas y Rompehielos';
      else if (title.includes('Bienvenida') || title.includes('Puertas')) suggestedRoleName = 'Recepción y Bienvenida';

      const resolvedRoleInfo = resolveRoleFromCatalog(suggestedRoleName, suggestedRoleName, rolesCatalog);

      // Si el rol no existe en el catálogo, registrarlo en la lista de no registrados
      if (resolvedRoleInfo.isUnregistered && !unregisteredRolesMap.has(resolvedRoleInfo.role.toLowerCase())) {
        unregisteredRolesMap.set(resolvedRoleInfo.role.toLowerCase(), {
          role: resolvedRoleInfo.role,
          defaultDuties: resolvedRoleInfo.duties || `Encargado de: ${title}`
        });
      }

      // Registrar los encargados de este bloque
      const resolvedStepResponsibleNames = [];

      extractedPersons.forEach(person => {
        // Verificar si la persona está en la lista de servidores registrados o confirmados
        const attendingMatch = findMatchingServer(person, attendingServers);
        const registeredMatch = findMatchingServer(person, allRegisteredServers);
        const matched = attendingMatch || registeredMatch;

        const resolvedName = matched ? matched.name : person;
        const resolvedId = matched ? matched.id : '';
        if (resolvedId) assignedServerIds.add(resolvedId);

        resolvedStepResponsibleNames.push(resolvedName);

        // Si NO está registrado en el sistema y no es "Todos los servidores" ni "Por designar", alertar
        const isActuallyRegistered = registeredMatch || (attendingMatch && attendingMatch.id && !attendingMatch.id.startsWith('guest-'));
        if (!isActuallyRegistered && person.toLowerCase() !== 'todos los servidores' && person.toLowerCase() !== 'por designar') {
          if (!unregisteredServersMap.has(resolvedName.toLowerCase())) {
            unregisteredServersMap.set(resolvedName.toLowerCase(), {
              name: resolvedName,
              suggestedRole: resolvedRoleInfo.role,
              suggestedDuties: `Encargado de: ${title} (${normalizedTime})`,
              detectedIn: `Bloque: ${title}`
            });
          }
        }

        assignedNamesMap.set(resolvedName.toLowerCase(), {
          serverName: resolvedName,
          serverId: resolvedId,
          role: resolvedRoleInfo.role,
          duties: `Encargado de: ${title} (${normalizedTime})`
        });
      });

      const responsibleStr = resolvedStepResponsibleNames.length > 0 ? resolvedStepResponsibleNames.join(', ') : 'Por designar';

      programSteps.push({
        time: normalizedTime,
        title: title,
        responsible: responsibleStr,
        description: description,
        completed: false
      });
    }
  }

  // Procesar Backstage
  rawBackstageItems.forEach((itemLine) => {
    const cleanLine = itemLine.replace(/^\d+[\.\)]\s*/, '').trim();
    const assignedNames = extractMentionsFromLine(cleanLine);

    let dutyText = cleanLine;
    dutyText = dutyText.replace(/@[A-Za-zÀ-ÿ0-9\s\.\-_()]+/g, ' ');
    dutyText = dutyText.replace(/\((?:ICC|Icc|icc|videos?|fotos?)\)/gi, ' ');
    dutyText = dutyText.replace(/\b(?:y\s+yo|favor\b.*$)/gi, '');
    dutyText = dutyText.replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '').trim();

    let candidateRoleName = 'Servidor de Apoyo General';
    const lowerDuty = dutyText.toLowerCase();

    if (/cancion|diapositiva|letra|proyecc|video/i.test(lowerDuty)) {
      candidateRoleName = 'Multimedia y Proyección';
    } else if (/story|foto|video|redes|instagram|ig/i.test(lowerDuty)) {
      candidateRoleName = 'Fotografía, Redes y Cobertura';
    } else if (/desmontaje|limp|recog/i.test(lowerDuty)) {
      candidateRoleName = 'Desmontaje y Cierre';
    } else if (/sonido|audio|consola/i.test(lowerDuty)) {
      candidateRoleName = 'Sonido y Audiovisual';
    } else if (/recepc|bienven|asistenc/i.test(lowerDuty)) {
      candidateRoleName = 'Recepción y Bienvenida';
    }

    const resolvedBackstageRole = resolveRoleFromCatalog(candidateRoleName, candidateRoleName, rolesCatalog);

    if (resolvedBackstageRole.isUnregistered && !unregisteredRolesMap.has(resolvedBackstageRole.role.toLowerCase())) {
      unregisteredRolesMap.set(resolvedBackstageRole.role.toLowerCase(), {
        role: resolvedBackstageRole.role,
        defaultDuties: dutyText || `Labor en Backstage: ${resolvedBackstageRole.role}`
      });
    }

    if (assignedNames.length > 0) {
      assignedNames.forEach(person => {
        const attendingMatch = findMatchingServer(person, attendingServers);
        const registeredMatch = findMatchingServer(person, allRegisteredServers);
        const matched = attendingMatch || registeredMatch;

        const resolvedName = matched ? matched.name : person;
        const resolvedId = matched ? matched.id : '';
        if (resolvedId) assignedServerIds.add(resolvedId);

        const isActuallyRegistered = registeredMatch || (attendingMatch && attendingMatch.id && !attendingMatch.id.startsWith('guest-'));
        if (!isActuallyRegistered && person.toLowerCase() !== 'todos los servidores' && person.toLowerCase() !== 'por designar') {
          if (!unregisteredServersMap.has(resolvedName.toLowerCase())) {
            unregisteredServersMap.set(resolvedName.toLowerCase(), {
              name: resolvedName,
              suggestedRole: resolvedBackstageRole.role,
              suggestedDuties: dutyText || `Labor en Backstage: ${resolvedBackstageRole.role}`,
              detectedIn: `Backstage: ${dutyText}`
            });
          }
        }

        serverAssignments.push({
          role: resolvedBackstageRole.role,
          serverId: resolvedId,
          serverName: resolvedName,
          status: 'Confirmado',
          duties: dutyText || `Labor en Backstage: ${resolvedBackstageRole.role}`
        });
      });
    } else if (dutyText) {
      serverAssignments.push({
        role: resolvedBackstageRole.role,
        serverId: '',
        serverName: 'Por designar',
        status: 'Pendiente',
        duties: dutyText
      });
    }
  });

  // Agregar también los roles detectados en los bloques del programa
  for (const [key, data] of assignedNamesMap.entries()) {
    const alreadyInBackstage = serverAssignments.some(s => 
      (data.serverId && s.serverId === data.serverId) || 
      (s.serverName && s.serverName.toLowerCase() === key)
    );
    if (!alreadyInBackstage) {
      serverAssignments.push({
        role: data.role,
        serverId: data.serverId,
        serverName: data.serverName,
        status: 'Confirmado',
        duties: data.duties
      });
    }
  }

  // SI se especificaron servidores confirmados que estarán en el servicio (Paso 1),
  // asegurar que TODOS queden registrados en el servicio
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

  // Calcular horarios de logística
  let calculatedPrepTime = '';
  let calculatedActivityTime = '';
  let calculatedTeardownTime = '9:00 – 9:30 pm';

  if (earliestTime) {
    const startAct = serviceStartTime || '7:00 pm';
    calculatedPrepTime = `${earliestTime} – ${startAct}`;
    calculatedActivityTime = `${startAct} – 9:00 pm`;
  }

  return {
    success: true,
    programSteps,
    serverAssignments,
    detectedPreacher,
    suggestedSchedules: {
      prepTime: calculatedPrepTime,
      activityTime: calculatedActivityTime,
      teardownTime: calculatedTeardownTime
    },
    unregisteredServers: Array.from(unregisteredServersMap.values()),
    unregisteredRoles: Array.from(unregisteredRolesMap.values()),
    rawLineCount: lines.length
  };
}

