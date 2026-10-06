// Datos iniciales de logística y actividades para Youngers ICC (Jotapece y Siervos)
// Octubre – Diciembre 2026

export const INITIAL_SERVERS = [
  {
    id: "srv-1",
    name: "Joel Guzmán",
    nickname: "Tío Joel",
    role: "Pastor de Jóvenes / Líder General",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Predicación", "Dirección General", "Discipulado"],
    phone: "829-555-0101",
    email: "joel.guzman@icc.org",
    active: true
  },
  {
    id: "srv-2",
    name: "Samuel Luciano",
    role: "Líder de Jóvenes / Maestro",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Predicación", "Enseñanza", "Logística"],
    phone: "829-555-0102",
    email: "samuel.luciano@icc.org",
    active: true
  },
  {
    id: "srv-3",
    name: "Fernando Pepén",
    role: "Líder Siervos (121)",
    groups: ["siervos"],
    primaryAreas: ["Predicación", "Dirección de Culto", "Pastoral"],
    phone: "829-555-0103",
    email: "fernando.pepen@icc.org",
    active: true
  },
  {
    id: "srv-4",
    name: "Jonatán Chez",
    role: "Líder Jotapece (JPC)",
    groups: ["jotapece"],
    primaryAreas: ["Predicación", "Alabanza", "Discipulado"],
    phone: "829-555-0104",
    email: "jonatan.chez@icc.org",
    active: true
  },
  {
    id: "srv-5",
    name: "Agustín (tentativo)",
    role: "Predicador Invitado / Líder",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Predicación", "Conferencias"],
    phone: "829-555-0105",
    email: "agustin@icc.org",
    active: true
  },
  {
    id: "srv-6",
    name: "Paola Reyes",
    role: "Coordinadora de Alabanza",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Alabanza", "Voz", "Piano"],
    phone: "829-555-0106",
    email: "paola.reyes@icc.org",
    active: true
  },
  {
    id: "srv-7",
    name: "Marcos Medina",
    role: "Líder Técnico Audiovisual",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Sonido", "Microfonía", "Equipos"],
    phone: "829-555-0107",
    email: "marcos.medina@icc.org",
    active: true
  },
  {
    id: "srv-8",
    name: "Andrea Peña",
    role: "Encargada de Multimedia & Proyección",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Multimedia", "Proyección", "Transmisión"],
    phone: "829-555-0108",
    email: "andrea.pena@icc.org",
    active: true
  },
  {
    id: "srv-9",
    name: "Laura Gómez",
    role: "Servidora de Bienvenida y Registro",
    groups: ["jotapece"],
    primaryAreas: ["Recepción", "Registro", "Integración"],
    phone: "829-555-0109",
    email: "laura.gomez@icc.org",
    active: true
  },
  {
    id: "srv-10",
    name: "Carlos Santana",
    role: "Servidor de Logística y Montaje",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Montaje", "Orden", "Desmontaje"],
    phone: "829-555-0110",
    email: "carlos.santana@icc.org",
    active: true
  },
  {
    id: "srv-11",
    name: "Emmanuel Torres",
    role: "Coordinador de Dinámicas y Juegos",
    groups: ["jotapece"],
    primaryAreas: ["Dinámicas", "Rompehielos", "Animación"],
    phone: "829-555-0111",
    email: "emmanuel.torres@icc.org",
    active: true
  },
  {
    id: "srv-12",
    name: "Sofía Ramírez",
    role: "Encargada de Refrigerio & Comunión",
    groups: ["jotapece", "siervos"],
    primaryAreas: ["Refrigerio", "Atención", "Hospitalidad"],
    phone: "829-555-0112",
    email: "sofia.ramirez@icc.org",
    active: true
  },
  {
    id: "srv-13",
    name: "Daniel Marte",
    role: "Servidor de Apoyo y Alabanza (Guitarra)",
    groups: ["siervos"],
    primaryAreas: ["Alabanza", "Guitarra", "Logística"],
    phone: "829-555-0113",
    email: "daniel.marte@icc.org",
    active: true
  }
];

export const INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    group: "jotapece", // jotapece | siervos | ambos
    dayOfWeek: "Sáb",
    dayNumber: "10",
    month: "oct",
    year: "2026",
    fullDate: "2026-10-10",
    title: "12 Truths: Justificación",
    preacher: "Samuel Luciano",
    location: "Salón multiusos",
    locationType: "multiusos", // multiusos | auditorio | fuera | sin_reunion
    prepTime: "5:00 – 7:00 pm",
    prepStart: "17:00",
    prepEnd: "19:00",
    activityTime: "7:00 – 9:00 pm",
    actStart: "19:00",
    actEnd: "21:00",
    teardownTime: "9:00 – 9:30 pm",
    notes: "Primera sesión de la serie doctrinal 12 Truths.",
    program: [
      { time: "5:00 - 6:00 pm", title: "Montaje técnico y cableado", responsible: "Marcos Medina, Carlos Santana", completed: false, description: "Instalación de consola de sonido, micrófonos de alabanza, instrumento y cableado del púlpito." },
      { time: "6:00 - 6:30 pm", title: "Prueba de sonido y ensayo musical", responsible: "Paola Reyes, Jonatán Chez", completed: false, description: "Ensayo de las 4 canciones pautadas, niveles acústicos y monitoreo." },
      { time: "6:30 - 6:50 pm", title: "Oración de líderes y servidores", responsible: "Joel Guzmán, Todo el equipo", completed: false, description: "Clamor en unidad por los jóvenes que llegarán y consagración de los servidores." },
      { time: "6:50 - 7:00 pm", title: "Apertura de puertas y bienvenida", responsible: "Laura Gómez, Sofía Ramírez", completed: false, description: "Recibir a cada adolescente con gafete, lista de asistencia y música ambiental." },
      { time: "7:00 - 7:15 pm", title: "Inicio y Dinámica Rompehielos", responsible: "Emmanuel Torres", completed: false, description: "Juego de integración grupal enfocado en la temática de la gracia y la justicia." },
      { time: "7:15 - 7:45 pm", title: "Tiempo de Alabanza y Adoración", responsible: "Paola Reyes y Banda JPC", completed: false, description: "Cantos de júbilo y momento devocional congregacional." },
      { time: "7:45 - 7:50 pm", title: "Anuncios y Ofrenda", responsible: "Jonatán Chez", completed: false, description: "Próximas actividades, campamento y motivación a la generosidad." },
      { time: "7:50 - 8:30 pm", title: "Mensaje Bíblico: 12 Truths - Justificación", responsible: "Samuel Luciano", completed: false, description: "Exposición en Romanos 5:1. Cómo somos declarados justos por la fe en Cristo." },
      { time: "8:30 - 8:50 pm", title: "Grupos Pequeños de Aplicación", responsible: "Líderes de células JPC", completed: false, description: "Preguntas guiadas para aterrizar el mensaje a la vida diaria de la escuela/hogar." },
      { time: "8:50 - 9:00 pm", title: "Refrigerio y Comunión", responsible: "Sofía Ramírez", completed: false, description: "Distribución ordenada de refrigerio y merienda." },
      { time: "9:00 - 9:30 pm", title: "Desmontaje, recogida y limpieza", responsible: "Todo el equipo Youngers", completed: false, description: "Salón multiusos queda completamente limpio y cerrado." }
    ],
    serverAssignments: [
      { role: "Coordinador del Servicio", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Supervisar los tiempos del programa y velar por el orden general." },
      { role: "Predicador", serverId: "srv-2", serverName: "Samuel Luciano", status: "Confirmado", duties: "Preparación de la enseñanza bíblica y material de apoyo." },
      { role: "Dirección de Alabanza", serverId: "srv-6", serverName: "Paola Reyes", status: "Confirmado", duties: "Coordinar la lista de cantos y ensayar con los instrumentistas a las 6:00 pm." },
      { role: "Sonido y Audiovisual", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Llegada puntual a las 5:00 pm para montaje y ecualización." },
      { role: "Multimedia y Proyección", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Cargar diapositivas del mensaje, letras de canciones y videos de bienvenida." },
      { role: "Recepción y Asistencia", serverId: "srv-9", serverName: "Laura Gómez", status: "Confirmado", duties: "Mesa de entrada, registro de nuevos adolescentes y bienvenida." },
      { role: "Dinámica y Rompehielos", serverId: "srv-11", serverName: "Emmanuel Torres", status: "Confirmado", duties: "Llevar los materiales para la dinámica y animar al inicio." },
      { role: "Refrigerio", serverId: "srv-12", serverName: "Sofía Ramírez", status: "Confirmado", duties: "Tener listo el refrigerio a las 8:45 pm en el área designada." },
      { role: "Logística y Desmontaje", serverId: "srv-10", serverName: "Carlos Santana", status: "Confirmado", duties: "Apoyo en montaje de sillas a las 5:00 pm y guardado a las 9:00 pm." }
    ]
  },
  {
    id: "act-2",
    group: "siervos",
    dayOfWeek: "Vie",
    dayNumber: "16",
    month: "oct",
    year: "2026",
    fullDate: "2026-10-16",
    title: "Importancia del discipulado",
    preacher: "Joel Guzmán",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "6:00 – 8:00 pm",
    prepStart: "18:00",
    prepEnd: "20:00",
    activityTime: "8:00 – 9:30 pm",
    actStart: "20:00",
    actEnd: "21:30",
    teardownTime: "9:30 – 10:00 pm",
    notes: "Reunión de Siervos (18+). Enfoque en discipulado intencional.",
    program: [
      { time: "6:00 - 7:00 pm", title: "Montaje técnico de sonido e iluminación", responsible: "Marcos Medina, Daniel Marte", completed: false, description: "Instalación de consola, micrófonos y set acústico." },
      { time: "7:00 - 7:35 pm", title: "Ensayo musical Siervos", responsible: "Daniel Marte, Paola Reyes", completed: false, description: "Pase de repertorio y balances." },
      { time: "7:35 - 7:55 pm", title: "Devocional y oración de servidores", responsible: "Fernando Pepén", completed: false, description: "Oración de cobertura y preparación espiritual." },
      { time: "7:55 - 8:00 pm", title: "Puertas abiertas y música de bienvenida", responsible: "Laura Gómez", completed: false, description: "Recepción de jóvenes universitarios y profesionales." },
      { time: "8:00 - 8:10 pm", title: "Bienvenida y apertura", responsible: "Fernando Pepén", completed: false, description: "Palabras de inicio e introducción a la noche." },
      { time: "8:10 - 8:35 pm", title: "Alabanza y Adoración", responsible: "Daniel Marte y Equipo", completed: false, description: "Tiempo íntimo de adoración al Señor." },
      { time: "8:35 - 9:15 pm", title: "Mensaje: Importancia del discipulado", responsible: "Joel Guzmán", completed: false, description: "Exposición bíblica sobre Mateo 28 y la vida en comunidad." },
      { time: "9:15 - 9:30 pm", title: "Oración final, anuncios y cierre", responsible: "Fernando Pepén", completed: false, description: "Ministración, petición de oración y avisos." },
      { time: "9:30 - 10:00 pm", title: "Comunión, refrigerio y desmontaje", responsible: "Todo el equipo Siervos", completed: false, description: "Café, comunión y recogida de equipos." }
    ],
    serverAssignments: [
      { role: "Coordinador de Culto", serverId: "srv-3", serverName: "Fernando Pepén", status: "Confirmado", duties: "Dirección del servicio de principio a fin." },
      { role: "Predicador", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Enseñanza sobre el mandato bíblico del discipulado." },
      { role: "Líder de Alabanza", serverId: "srv-13", serverName: "Daniel Marte", status: "Confirmado", duties: "Guitarra y dirección vocal." },
      { role: "Sonido", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Consola de sonido y monitores." },
      { role: "Multimedia", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Presentación y versículos bíblicos." },
      { role: "Café y Refrigerio", serverId: "srv-12", serverName: "Sofía Ramírez", status: "Confirmado", duties: "Preparación de la estación de café y galletas." }
    ]
  },
  {
    id: "act-3",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "17",
    month: "oct",
    year: "2026",
    fullDate: "2026-10-17",
    title: "12 Truths: Santificación",
    preacher: "Jonatán Chez",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "5:00 – 7:00 pm",
    prepStart: "17:00",
    prepEnd: "19:00",
    activityTime: "7:00 – 9:00 pm",
    actStart: "19:00",
    actEnd: "21:00",
    teardownTime: "9:00 – 9:30 pm",
    notes: "Segunda sesión de 12 Truths: Santificación práctica.",
    program: [
      { time: "5:00 - 6:15 pm", title: "Montaje técnico", responsible: "Marcos Medina, Carlos Santana", completed: false, description: "Sillas, cables, sonido y micrófono principal." },
      { time: "6:15 - 6:40 pm", title: "Ensayo musical", responsible: "Paola Reyes", completed: false, description: "Repaso de temas." },
      { time: "6:40 - 6:55 pm", title: "Oración de servidores", responsible: "Jonatán Chez", completed: false, description: "Oración antes de iniciar." },
      { time: "7:00 - 7:20 pm", title: "Dinámica y bienvenida", responsible: "Emmanuel Torres", completed: false, description: "Dinámica sobre santificación e influencias." },
      { time: "7:20 - 7:50 pm", title: "Alabanza congregacional", responsible: "Paola Reyes", completed: false, description: "Canciones de adoración." },
      { time: "7:50 - 8:35 pm", title: "Mensaje: 12 Truths - Santificación", responsible: "Jonatán Chez", completed: false, description: "1 Tesalonicenses 4:3. Ser apartados para Dios en el día a día." },
      { time: "8:35 - 8:55 pm", title: "Tiempo en grupos", responsible: "Líderes de grupo", completed: false, description: "Reflexión y oración en parejas." },
      { time: "8:55 - 9:30 pm", title: "Refrigerio y desmontaje", responsible: "Equipo JPC", completed: false, description: "Limpieza del multiusos." }
    ],
    serverAssignments: [
      { role: "Predicador & Líder", serverId: "srv-4", serverName: "Jonatán Chez", status: "Confirmado", duties: "Predicación sobre la santificación." },
      { role: "Alabanza", serverId: "srv-6", serverName: "Paola Reyes", status: "Confirmado", duties: "Dirección de los cantos." },
      { role: "Sonido", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Manejo de consola." },
      { role: "Multimedia", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Letras y presentación." },
      { role: "Recepción", serverId: "srv-9", serverName: "Laura Gómez", status: "Confirmado", duties: "Registro de asistentes." },
      { role: "Refrigerio", serverId: "srv-12", serverName: "Sofía Ramírez", status: "Confirmado", duties: "Servir merienda." }
    ]
  },
  {
    id: "act-4",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "24",
    month: "oct",
    year: "2026",
    fullDate: "2026-10-24",
    title: "Conferencia de Matrimonios · Jotapece no se reúne",
    preacher: "Sin predicación",
    location: "Sin reunión de grupo",
    locationType: "sin_reunion",
    prepTime: "",
    activityTime: "Movie night por confirmar",
    teardownTime: "",
    notes: "La iglesia principal tiene la Conferencia de Matrimonios. Jotapece no tiene reunión en ICC. Actividad opcional tentativa de movie night.",
    program: [
      { time: "Por confirmar", title: "Movie night tentativa en casa de líder", responsible: "Líderes JPC", completed: false, description: "Detalles se avisarán en la semana por los grupos de WhatsApp." }
    ],
    serverAssignments: [
      { role: "Coordinación", serverId: "srv-4", serverName: "Jonatán Chez", status: "Pendiente", duties: "Confirmar viabilidad del movie night." }
    ]
  },
  {
    id: "act-5",
    group: "siervos",
    dayOfWeek: "Vie",
    dayNumber: "30",
    month: "oct",
    year: "2026",
    fullDate: "2026-10-30",
    title: "La ira y yo: ¿Qué hago con mi enojo?",
    preacher: "Fernando Pepén",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "6:00 – 8:00 pm",
    prepStart: "18:00",
    prepEnd: "20:00",
    activityTime: "8:00 – 9:30 pm",
    actStart: "20:00",
    actEnd: "21:30",
    teardownTime: "9:30 – 10:00 pm",
    notes: "Taller práctico sobre manejo de emociones a la luz de las Escrituras.",
    program: [
      { time: "6:00 - 7:15 pm", title: "Montaje técnico", responsible: "Marcos Medina", completed: false, description: "Sonido y proyección." },
      { time: "7:15 - 7:45 pm", title: "Ensayo y oración", responsible: "Fernando Pepén, Daniel Marte", completed: false, description: "Oración de servidores." },
      { time: "8:00 - 8:15 pm", title: "Apertura y bienvenida", responsible: "Samuel Luciano", completed: false, description: "Inicio del servicio." },
      { time: "8:15 - 8:40 pm", title: "Alabanza y Adoración", responsible: "Daniel Marte", completed: false, description: "Cantos devocionales." },
      { time: "8:40 - 9:20 pm", title: "Mensaje: La ira y yo", responsible: "Fernando Pepén", completed: false, description: "Efesios 4:26-31. El enojo pecaminoso vs. la justicia de Dios." },
      { time: "9:20 - 9:30 pm", title: "Minitración y cierre", responsible: "Joel Guzmán", completed: false, description: "Oración por dominio propio." },
      { time: "9:30 - 10:00 pm", title: "Refrigerio y desmontaje", responsible: "Equipo Siervos", completed: false, description: "Café y desmontaje." }
    ],
    serverAssignments: [
      { role: "Predicador", serverId: "srv-3", serverName: "Fernando Pepén", status: "Confirmado", duties: "Exposición bíblica sobre las emociones." },
      { role: "Coordinación", serverId: "srv-2", serverName: "Samuel Luciano", status: "Confirmado", duties: "Bienvenida y moderación." },
      { role: "Alabanza", serverId: "srv-13", serverName: "Daniel Marte", status: "Confirmado", duties: "Música acústica." },
      { role: "Sonido", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Sonido y micrófonos." },
      { role: "Multimedia", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Proyección de pasajes y preguntas." }
    ]
  },
  {
    id: "act-6",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "31",
    month: "oct",
    year: "2026",
    fullDate: "2026-10-31",
    title: "12 Truths: Perseverancia y glorificación",
    preacher: "Tío Joel",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "5:00 – 7:00 pm",
    prepStart: "17:00",
    prepEnd: "19:00",
    activityTime: "7:00 – 9:00 pm",
    actStart: "19:00",
    actEnd: "21:00",
    teardownTime: "9:00 – 9:30 pm",
    notes: "Tercera sesión de 12 Truths. Nota: los jóvenes de Siervos estarán en la conferencia IBC este mismo día.",
    program: [
      { time: "5:00 - 6:15 pm", title: "Montaje de salón y sonido", responsible: "Carlos Santana, Marcos Medina", completed: false, description: "Organización de sillas y equipos." },
      { time: "6:15 - 6:45 pm", title: "Ensayo de alabanza", responsible: "Paola Reyes", completed: false, description: "Prueba de sonido." },
      { time: "6:45 - 6:55 pm", title: "Oración de servidores", responsible: "Joel Guzmán", completed: false, description: "Oración de inicio." },
      { time: "7:00 - 7:20 pm", title: "Dinámica y bienvenida", responsible: "Emmanuel Torres", completed: false, description: "Dinámica de perseverancia." },
      { time: "7:20 - 7:45 pm", title: "Alabanza", responsible: "Paola Reyes", completed: false, description: "Cantos de fe y victoria en Cristo." },
      { time: "7:45 - 8:30 pm", title: "Mensaje: Perseverancia y Glorificación", responsible: "Joel Guzmán (Tío Joel)", completed: false, description: "Romanos 8:28-30. La seguridad eterna de los escogidos." },
      { time: "8:30 - 8:50 pm", title: "Discusión en mesas", responsible: "Líderes JPC", completed: false, description: "Compartir testimonios." },
      { time: "8:50 - 9:30 pm", title: "Cena ligera y desmontaje", responsible: "Sofía Ramírez, Carlos Santana", completed: false, description: "Recogida de salón." }
    ],
    serverAssignments: [
      { role: "Predicador", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Enseñanza sobre la perseverancia cristiana." },
      { role: "Alabanza", serverId: "srv-6", serverName: "Paola Reyes", status: "Confirmado", duties: "Voz y dirección musical." },
      { role: "Sonido", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Audio del salón." },
      { role: "Multimedia", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Proyección." },
      { role: "Recepción", serverId: "srv-9", serverName: "Laura Gómez", status: "Confirmado", duties: "Bienvenida en puerta." }
    ]
  },
  {
    id: "act-7",
    group: "siervos",
    dayOfWeek: "Sáb",
    dayNumber: "31",
    month: "oct",
    year: "2026",
    fullDate: "2026-10-31",
    title: "DESPIERTA · Conferencia IBC (solo Siervos)",
    preacher: "Conferencistas IBC",
    location: "Fuera de ICC",
    locationType: "fuera",
    isCustomLocation: true,
    customLocationName: "Iglesia Bautista de la Gracia / Sede IBC",
    customLocationAddress: "Av. Sarasota No. 45, Bella Vista, Santo Domingo",
    customLocationMapUrl: "https://maps.google.com/?q=Iglesia+Bautista+de+la+Gracia+Santo+Domingo",
    customLocationNotes: "Punto de encuentro: Parqueo de ICC a la 1:00 pm para salir en carpools grupales.",
    prepTime: "Salida grupal 1:00 pm",
    activityTime: "Conferencia 2:00 – 7:00 pm · Worship night 7:00 – 9:00 pm",
    teardownTime: "Regreso 9:30 pm",
    notes: "Evento externo de jóvenes adultos en Iglesia Bautista de la Gracia / IBC. Solo Siervos (18+).",
    program: [
      { time: "1:00 pm", title: "Punto de encuentro en ICC", responsible: "Fernando Pepén", completed: false, description: "Salida en carpools hacia la conferencia." },
      { time: "2:00 - 7:00 pm", title: "Conferencia plenarias y talleres", responsible: "Equipo IBC", completed: false, description: "Bloque temático sobre cosmovisión bíblica." },
      { time: "7:00 - 9:00 pm", title: "Worship Night DESPIERTA", responsible: "Banda Conferencia", completed: false, description: "Concierto y adoración unida de jóvenes." }
    ],
    serverAssignments: [
      { role: "Coordinador de Logística y Transporte", serverId: "srv-3", serverName: "Fernando Pepén", status: "Confirmado", duties: "Organizar vehículos compartidos y confirmar boletos." },
      { role: "Apoyo de Grupo", serverId: "srv-13", serverName: "Daniel Marte", status: "Confirmado", duties: "Asistencia en el punto de encuentro." }
    ]
  },
  {
    id: "act-8",
    group: "ambos",
    dayOfWeek: "Sáb",
    dayNumber: "7",
    month: "nov",
    year: "2026",
    fullDate: "2026-11-07",
    title: "Actividad evangelística: Los Manguitos (operativo médico)",
    preacher: "Equipo Evangelismo ICC",
    location: "Fuera de ICC",
    locationType: "fuera",
    isCustomLocation: true,
    customLocationName: "Comunidad Los Manguitos",
    customLocationAddress: "Sector Los Manguitos, Santo Domingo D.N.",
    customLocationMapUrl: "https://maps.google.com/?q=Los+Manguitos+Santo+Domingo",
    customLocationNotes: "Salida grupal desde ICC a las 2:30 pm con insumos médicos y carpas.",
    prepTime: "Preparación 2:30 pm",
    activityTime: "Actividad 4:00 – 7:00 pm",
    teardownTime: "Horario tentativo · desmontaje por definir",
    notes: "Operativo médico y evangelismo en comunidad Los Manguitos. Participan Siervos y Jotapece. Horario tentativo de preparación 2:30 pm · actividad 4:00 - 7:00 pm.",
    program: [
      { time: "2:30 - 3:15 pm", title: "Preparación y carga de insumos en ICC", responsible: "Todo el equipo", completed: false, description: "Carga de medicamentos, carpas, mesas e insumos médicos." },
      { time: "3:15 - 4:00 pm", title: "Traslado y montaje en Los Manguitos", responsible: "Coordinadores de áreas", completed: false, description: "Instalación de estaciones de consulta, entrega de medicinas y área infantil." },
      { time: "4:00 - 6:30 pm", title: "Operativo médico, dinámicas y evangelismo", responsible: "Médicos, Jotapece y Siervos", completed: false, description: "Atención a las familias, juegos con niños y presentación del Evangelio." },
      { time: "6:30 - 7:00 pm", title: "Cierre, oración por la comunidad y entrega de tratados", responsible: "Joel Guzmán", completed: false, description: "Oración de despedida." },
      { time: "7:00 - 8:00 pm", title: "Desmontaje y regreso a ICC", responsible: "Logística Youngers", completed: false, description: "Guardar insumos en la iglesia." }
    ],
    serverAssignments: [
      { role: "Director del Operativo", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Liderar el operativo y enlace con comunitarios." },
      { role: "Logística y Transporte", serverId: "srv-10", serverName: "Carlos Santana", status: "Confirmado", duties: "Transporte de mesas y botiquines." },
      { role: "Ministerio Infantil en Operativo", serverId: "srv-11", serverName: "Emmanuel Torres", status: "Confirmado", duties: "Juegos bíblicos para los niños de la comunidad." },
      { role: "Evangelismo Personal", serverId: "srv-2", serverName: "Samuel Luciano", status: "Confirmado", duties: "Compartir el evangelio con personas en espera de consulta." },
      { role: "Hidratación y Refrigerio de Voluntarios", serverId: "srv-12", serverName: "Sofía Ramírez", status: "Confirmado", duties: "Botellones de agua y refrigerios para los servidores." }
    ]
  },
  {
    id: "act-9",
    group: "siervos",
    dayOfWeek: "Vie",
    dayNumber: "13",
    month: "nov",
    year: "2026",
    fullDate: "2026-11-13",
    title: "Discipulado I: Salvación y seguridad",
    preacher: "Joel Guzmán",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "6:00 – 8:00 pm",
    prepStart: "18:00",
    prepEnd: "20:00",
    activityTime: "8:00 – 9:30 pm",
    actStart: "20:00",
    actEnd: "21:30",
    teardownTime: "9:30 – 10:00 pm",
    notes: "Módulo I de la serie formativa de Discipulado para Siervos.",
    program: [
      { time: "6:00 - 7:15 pm", title: "Montaje técnico", responsible: "Marcos Medina", completed: false, description: "Audio y micrófonos." },
      { time: "7:15 - 7:45 pm", title: "Ensayo y oración", responsible: "Daniel Marte", completed: false, description: "Preparación de canciones." },
      { time: "8:00 - 8:15 pm", title: "Bienvenida", responsible: "Fernando Pepén", completed: false, description: "Introducción al módulo formativo." },
      { time: "8:15 - 8:35 pm", title: "Alabanza", responsible: "Daniel Marte", completed: false, description: "Alabanza devocional." },
      { time: "8:35 - 9:15 pm", title: "Enseñanza: Salvación y seguridad eterna", responsible: "Joel Guzmán", completed: false, description: "1 Juan 5:11-13. Certeza de fe en el creyente." },
      { time: "9:15 - 9:30 pm", title: "Tiempo de preguntas y respuestas", responsible: "Joel Guzmán, Fernando Pepén", completed: false, description: "Aclarar dudas de los jóvenes." },
      { time: "9:30 - 10:00 pm", title: "Comunión y recogida", responsible: "Equipo Siervos", completed: false, description: "Cierre del salón." }
    ],
    serverAssignments: [
      { role: "Predicador", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Taller sobre la seguridad de salvación." },
      { role: "Coordinador", serverId: "srv-3", serverName: "Fernando Pepén", status: "Confirmado", duties: "Dirección del programa." },
      { role: "Alabanza", serverId: "srv-13", serverName: "Daniel Marte", status: "Confirmado", duties: "Guitarra y cantos." },
      { role: "Sonido", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Operador de sonido." },
      { role: "Multimedia", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Proyección de guía de estudio." }
    ]
  },
  {
    id: "act-10",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "14",
    month: "nov",
    year: "2026",
    fullDate: "2026-11-14",
    title: "12 Truths: Eternidad",
    preacher: "Invitado",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "5:00 – 7:00 pm",
    prepStart: "17:00",
    prepEnd: "19:00",
    activityTime: "7:00 – 9:00 pm",
    actStart: "19:00",
    actEnd: "21:00",
    teardownTime: "9:00 – 9:30 pm",
    notes: "Cuarta sesión de 12 Truths: La esperanza de la eternidad.",
    program: [
      { time: "5:00 - 6:15 pm", title: "Montaje general", responsible: "Carlos Santana", completed: false, description: "Sillas y escenario." },
      { time: "6:15 - 6:45 pm", title: "Ensayo musical", responsible: "Paola Reyes", completed: false, description: "Ensayo con la banda." },
      { time: "6:45 - 6:55 pm", title: "Oración de servidores", responsible: "Jonatán Chez", completed: false, description: "Devocional con el orador invitado." },
      { time: "7:00 - 7:15 pm", title: "Bienvenida y dinámica", responsible: "Emmanuel Torres", completed: false, description: "Dinámica 'El reloj del tiempo'." },
      { time: "7:15 - 7:45 pm", title: "Alabanza", responsible: "Paola Reyes", completed: false, description: "Cantos de esperanza." },
      { time: "7:45 - 8:30 pm", title: "Mensaje: 12 Truths - Eternidad", responsible: "Orador Invitado", completed: false, description: "Apocalipsis 21. El nuevo cielo y la nueva tierra." },
      { time: "8:30 - 8:50 pm", title: "Aplicación y oración", responsible: "Líderes de grupos", completed: false, description: "Oración grupal." },
      { time: "8:50 - 9:30 pm", title: "Refrigerio y desmontaje", responsible: "Equipo JPC", completed: false, description: "Desmontaje del multiusos." }
    ],
    serverAssignments: [
      { role: "Anfitrión del Invitado", serverId: "srv-4", serverName: "Jonatán Chez", status: "Confirmado", duties: "Recibir y atender al predicador invitado." },
      { role: "Alabanza", serverId: "srv-6", serverName: "Paola Reyes", status: "Confirmado", duties: "Dirección musical." },
      { role: "Sonido", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Microfonía para invitado." },
      { role: "Multimedia", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Visuales de apoyo." },
      { role: "Refrigerio", serverId: "srv-12", serverName: "Sofía Ramírez", status: "Confirmado", duties: "Servir alimentos." }
    ]
  },
  {
    id: "act-11",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "21",
    month: "nov",
    year: "2026",
    fullDate: "2026-11-21",
    title: "Tarde de Té · Jotapece no se reúne",
    preacher: "Sin predicación",
    location: "Sin reunión de grupo",
    locationType: "sin_reunion",
    prepTime: "",
    activityTime: "No hay reunión",
    teardownTime: "",
    notes: "Evento ministerial de la iglesia general (Tarde de Té de damas ICC). Jotapece no se reúne este fin de semana.",
    program: [
      { time: "Todo el día", title: "Sin reunión de grupo de Jotapece", responsible: "Equipo ICC", completed: false, description: "Descanso y apoyo a los ministerios de la iglesia." }
    ],
    serverAssignments: []
  },
  {
    id: "act-12",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "28",
    month: "nov",
    year: "2026",
    fullDate: "2026-11-28",
    title: "Campaña evangelística Juan Tomás",
    preacher: "Equipo Evangelismo",
    location: "Fuera de ICC",
    locationType: "fuera",
    prepTime: "",
    activityTime: "Horario por definir",
    teardownTime: "",
    notes: "Campaña evangelística comunitaria en Juan Tomás. Salida especial desde ICC.",
    program: [
      { time: "Horario por definir", title: "Salida y evangelismo en Juan Tomás", responsible: "Líderes y misioneros", completed: false, description: "Campaña barrial con folletos, cantos y predicación al aire libre." }
    ],
    serverAssignments: [
      { role: "Líder de avanzada", serverId: "srv-2", serverName: "Samuel Luciano", status: "Pendiente", duties: "Definir horario de salida y logística de transporte." }
    ]
  },
  {
    id: "act-13",
    group: "ambos",
    dayOfWeek: "Sáb",
    dayNumber: "5",
    month: "dic",
    year: "2026",
    fullDate: "2026-12-05",
    title: "Compartir de fin de año (Cena de Jóvenes)",
    preacher: "Agustín (tentativo)",
    location: "Auditorio principal ICC",
    locationType: "auditorio",
    prepTime: "5:00 – 7:00 pm",
    prepStart: "17:00",
    prepEnd: "19:00",
    activityTime: "7:00 – 9:00 pm",
    actStart: "19:00",
    actEnd: "21:00",
    teardownTime: "9:00 – 9:30 pm",
    notes: "La Cena de Jóvenes es en el auditorio principal de ICC. Todo lo demás es en el salón multiusos. Horario de sábado · por confirmar.",
    program: [
      { time: "3:00 - 5:00 pm", title: "Decoración y montaje de mesas de gala", responsible: "Comité de Eventos, Sofía Ramírez", completed: false, description: "Montaje de mantelería, centros de mesa y ambientación navideña en el Auditorio." },
      { time: "5:00 - 6:30 pm", title: "Montaje técnico audiovisual especial", responsible: "Marcos Medina, Andrea Peña", completed: false, description: "Luces cálidas, sonido de sala grande y cámaras." },
      { time: "6:30 - 6:50 pm", title: "Oración de todos los servidores Youngers", responsible: "Joel Guzmán, Fernando Pepén", completed: false, description: "Consagración de la noche de gala y acción de gracias por el año 2026." },
      { time: "6:50 - 7:15 pm", title: "Recepción en alfombra y bienvenida", responsible: "Equipo de Protocolo y Bienvenida", completed: false, description: "Photobooth, entrega de identificadores y asientos." },
      { time: "7:15 - 7:35 pm", title: "Alabanza y Adoración especial unida", responsible: "Banda Unida Youngers (JPC + 121)", completed: false, description: "Tiempo de gratitud al Dios fiel." },
      { time: "7:35 - 8:15 pm", title: "Mensaje de Fin de Año", responsible: "Agustín (tentativo)", completed: false, description: "Reflexión bíblica y desafío para el nuevo año." },
      { time: "8:15 - 9:00 pm", title: "Banquete, testimonios y premiaciones", responsible: "Todos", completed: false, description: "Cena de gala, video resumen del año y reconocimientos de fidelidad." },
      { time: "9:00 - 9:30 pm", title: "Desmontaje y orden del Auditorio Principal", responsible: "Todo el equipo Youngers", completed: false, description: "Dejar auditorio listo para el servicio dominical de la iglesia." }
    ],
    serverAssignments: [
      { role: "Coordinación General", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Liderar la celebración anual Youngers." },
      { role: "Coordinador Siervos", serverId: "srv-3", serverName: "Fernando Pepén", status: "Confirmado", duties: "Dirección de programa en tarima." },
      { role: "Coordinador Jotapece", serverId: "srv-4", serverName: "Jonatán Chez", status: "Confirmado", duties: "Protocolo y bienvenida a adolescentes." },
      { role: "Predicador", serverId: "srv-5", serverName: "Agustín (tentativo)", status: "Pendiente", duties: "Mensaje inspiracional de gratitud y desafío espiritual." },
      { role: "Alabanza Unida", serverId: "srv-6", serverName: "Paola Reyes", status: "Confirmado", duties: "Dirección de la banda combinada con Siervos." },
      { role: "Sonido Gran Auditorio", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Operación de consola digital del auditorio." },
      { role: "Multimedia & Video Anual", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Proyección de video memorias 2026." },
      { role: "Banquete y Cena", serverId: "srv-12", serverName: "Sofía Ramírez", status: "Confirmado", duties: "Supervisar el catering y servicio a mesas." },
      { role: "Logística y Desmontaje", serverId: "srv-10", serverName: "Carlos Santana", status: "Confirmado", duties: "Recogida de mesas para el domingo por la mañana." }
    ]
  },
  // ================= HISTÓRICOS: PERÍODO SEPTIEMBRE - DICIEMBRE (Pasadas / Plazo cumplido) =================
  {
    id: "act-sep-1",
    group: "ambos",
    dayOfWeek: "Sáb",
    dayNumber: "12",
    month: "sep",
    year: "2026",
    fullDate: "2026-09-12",
    title: "Gran Apertura Youngers: De Regreso a Casa",
    preacher: "Joel Guzmán",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "5:00 – 7:00 pm",
    prepStart: "17:00",
    prepEnd: "19:00",
    activityTime: "7:00 – 9:00 pm",
    actStart: "19:00",
    actEnd: "21:00",
    teardownTime: "9:00 – 9:30 pm",
    notes: "Culto especial de inicio del ciclo escolar y ministerial 2026-2027.",
    isCompleted: true,
    periodId: "sep-dic",
    program: [
      { time: "5:00 - 6:30 pm", title: "Montaje general y sonido", responsible: "Marcos Medina, Carlos Santana", completed: true },
      { time: "7:00 - 7:30 pm", title: "Dinámicas y Alabanza de bienvenida", responsible: "Paola Reyes, Emmanuel Torres", completed: true },
      { time: "7:30 - 8:30 pm", title: "Mensaje: De Regreso a Casa (Lucas 15)", responsible: "Joel Guzmán", completed: true },
      { time: "8:30 - 9:00 pm", title: "Refrigerio y fotos oficiales", responsible: "Sofía Ramírez", completed: true }
    ],
    serverAssignments: [
      { role: "Dirección", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Liderazgo y visión del nuevo período." },
      { role: "Alabanza", serverId: "srv-6", serverName: "Paola Reyes", status: "Confirmado", duties: "Coordinación musical." },
      { role: "Sonido", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Operación de audio." }
    ]
  },
  // ================= HISTÓRICOS: PERÍODO MAYO - JULIO 2026 =================
  {
    id: "act-hist-jul-1",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "18",
    month: "jul",
    year: "2026",
    fullDate: "2026-07-18",
    title: "Cierre de Ciclo: Jóvenes Transformados",
    preacher: "Samuel Luciano",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "5:00 – 7:00 pm",
    activityTime: "7:00 – 9:00 pm",
    teardownTime: "9:00 – 9:30 pm",
    notes: "Último culto regular antes de la pausa de verano de agosto.",
    isCompleted: true,
    periodId: "may-jul",
    program: [
      { time: "5:00 - 6:30 pm", title: "Montaje y preparación", responsible: "Carlos Santana", completed: true },
      { time: "7:00 - 8:15 pm", title: "Alabanza y Palabra: Romanos 12:2", responsible: "Samuel Luciano", completed: true },
      { time: "8:15 - 9:00 pm", title: "Tiempo de oración y testimonios", responsible: "Líderes JPC", completed: true }
    ],
    serverAssignments: [
      { role: "Predicador", serverId: "srv-2", serverName: "Samuel Luciano", status: "Confirmado", duties: "Mensaje final de serie." },
      { role: "Coordinación", serverId: "srv-4", serverName: "Jonatán Chez", status: "Confirmado", duties: "Dirección de programa." }
    ]
  },
  {
    id: "act-hist-jun-1",
    group: "siervos",
    dayOfWeek: "Vie",
    dayNumber: "19",
    month: "jun",
    year: "2026",
    fullDate: "2026-06-19",
    title: "Vigilia de Oración y Avivamiento 121",
    preacher: "Fernando Pepén",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "7:00 – 9:00 pm",
    activityTime: "9:00 pm – 1:00 am",
    teardownTime: "1:00 – 1:30 am",
    notes: "Noche de búsqueda espiritual profunda, clamor y quebrantamiento.",
    isCompleted: true,
    periodId: "may-jul",
    program: [
      { time: "9:00 - 10:30 pm", title: "Bloque 1: Alabanza e intercesión", responsible: "Paola Reyes, Daniel Marte", completed: true },
      { time: "10:30 - 11:45 pm", title: "Bloque 2: Exposición bíblica", responsible: "Fernando Pepén", completed: true },
      { time: "11:45 - 1:00 am", title: "Bloque 3: Clamor por la juventud", responsible: "Joel Guzmán", completed: true }
    ],
    serverAssignments: [
      { role: "Líder de Vigilia", serverId: "srv-3", serverName: "Fernando Pepén", status: "Confirmado", duties: "Organización de turnos de oración." },
      { role: "Audio", serverId: "srv-7", serverName: "Marcos Medina", status: "Confirmado", duties: "Turno extendido de audio." }
    ]
  },
  {
    id: "act-hist-may-1",
    group: "ambos",
    dayOfWeek: "Sáb",
    dayNumber: "16",
    month: "may",
    year: "2026",
    fullDate: "2026-05-16",
    title: "Conferencia Jóvenes: Identidad y Pureza",
    preacher: "Agustín (tentativo)",
    location: "Auditorio principal ICC",
    locationType: "auditorio",
    prepTime: "4:00 – 6:00 pm",
    activityTime: "6:00 – 9:00 pm",
    teardownTime: "9:00 – 9:45 pm",
    notes: "Tarde de talleres para adolescentes y jóvenes sobre cosmovisión bíblica.",
    isCompleted: true,
    periodId: "may-jul",
    program: [
      { time: "6:00 - 7:15 pm", title: "Sesión Plenaria 1: La mentira de la cultura", responsible: "Agustín", completed: true },
      { time: "7:15 - 7:45 pm", title: "Panel de Preguntas y Respuestas", responsible: "Pastores y Líderes", completed: true },
      { time: "7:45 - 9:00 pm", title: "Sesión Plenaria 2: Firmeza en la Verdad", responsible: "Joel Guzmán", completed: true }
    ],
    serverAssignments: [
      { role: "Coordinación", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Moderación de panel." },
      { role: "Multimedia", serverId: "srv-8", serverName: "Andrea Peña", status: "Confirmado", duties: "Transmisión y diapositivas." }
    ]
  },
  // ================= HISTÓRICOS: PERÍODO ENERO - ABRIL 2026 =================
  {
    id: "act-hist-abr-1",
    group: "ambos",
    dayOfWeek: "Vie",
    dayNumber: "3",
    month: "abr",
    year: "2026",
    fullDate: "2026-04-03",
    title: "Pascua de Resurrección: Por Su Cruz Somos Libres",
    preacher: "Joel Guzmán",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "5:00 – 7:00 pm",
    activityTime: "7:00 – 9:30 pm",
    teardownTime: "9:30 – 10:00 pm",
    notes: "Servicio conmemorativo de Semana Santa con Santa Cena unida.",
    isCompleted: true,
    periodId: "ene-abr",
    program: [
      { time: "7:00 - 7:45 pm", title: "Cantos de redención y memoria", responsible: "Paola Reyes", completed: true },
      { time: "7:45 - 8:45 pm", title: "Mensaje de la Cruz (Isaías 53)", responsible: "Joel Guzmán", completed: true },
      { time: "8:45 - 9:30 pm", title: "Santa Cena y Comunión", responsible: "Líderes Jóvenes", completed: true }
    ],
    serverAssignments: [
      { role: "Predicador", serverId: "srv-1", serverName: "Joel Guzmán", status: "Confirmado", duties: "Administración de la Santa Cena." },
      { role: "Logística", serverId: "srv-10", serverName: "Carlos Santana", status: "Confirmado", duties: "Elementos de la cena y orden." }
    ]
  },
  {
    id: "act-hist-mar-1",
    group: "jotapece",
    dayOfWeek: "Sáb",
    dayNumber: "14",
    month: "mar",
    year: "2026",
    fullDate: "2026-03-14",
    title: "Tarde Deportiva & Evangelística JPC",
    preacher: "Samuel Luciano",
    location: "Cancha Parque Mirador Sur",
    locationType: "fuera",
    isCustomLocation: true,
    customLocationName: "Cancha Parque Mirador Sur",
    customLocationAddress: "Av. Mirador Sur, Puerta 5, Santo Domingo",
    customLocationNotes: "Llevar ropa deportiva y botella de agua personal.",
    prepTime: "2:30 – 3:30 pm",
    activityTime: "3:30 – 6:30 pm",
    teardownTime: "6:30 – 7:00 pm",
    notes: "Torneo relámpago de básquetbol y voleibol con amigos invitados.",
    isCompleted: true,
    periodId: "ene-abr",
    program: [
      { time: "3:30 - 5:15 pm", title: "Partidos deportivos amistosos", responsible: "Emmanuel Torres", completed: true },
      { time: "5:15 - 5:45 pm", title: "Devocional y mensaje evangelístico", responsible: "Samuel Luciano", completed: true },
      { time: "5:45 - 6:30 pm", title: "Merienda y premiación simbólica", responsible: "Sofía Ramírez", completed: true }
    ],
    serverAssignments: [
      { role: "Árbitro y Dinámicas", serverId: "srv-11", serverName: "Emmanuel Torres", status: "Confirmado", duties: "Organizar tablas y silbato." },
      { role: "Evangelismo", serverId: "srv-2", serverName: "Samuel Luciano", status: "Confirmado", duties: "Charla en el medio tiempo." }
    ]
  },
  {
    id: "act-hist-feb-1",
    group: "siervos",
    dayOfWeek: "Vie",
    dayNumber: "20",
    month: "feb",
    year: "2026",
    fullDate: "2026-02-20",
    title: "Taller: Fundamentos de Liderazgo Bíblico",
    preacher: "Fernando Pepén",
    location: "Salón multiusos",
    locationType: "multiusos",
    prepTime: "6:00 – 7:30 pm",
    activityTime: "7:30 – 9:30 pm",
    teardownTime: "9:30 – 10:00 pm",
    notes: "Capacitación intensiva para todos los servidores y nuevos líderes.",
    isCompleted: true,
    periodId: "ene-abr",
    program: [
      { time: "7:30 - 8:30 pm", title: "Módulo 1: El carácter del siervo de Dios", responsible: "Fernando Pepén", completed: true },
      { time: "8:30 - 9:30 pm", title: "Módulo 2: Trabajo en equipo y comunicación", responsible: "Joel Guzmán", completed: true }
    ],
    serverAssignments: [
      { role: "Instructor", serverId: "srv-3", serverName: "Fernando Pepén", status: "Confirmado", duties: "Entrega de manuales y dinámicas." }
    ]
  }
];

// =========================================================
// DEFINICIÓN DE PERÍODOS DE YOUNGERS ICC
// 1. Enero – Abril
// 2. Mayo – Julio
// (Pausa / Receso de Verano: Agosto)
// 3. Septiembre – Diciembre (Período actual)
// =========================================================
export const PERIODS = [
  {
    id: "sep-dic",
    name: "Septiembre – Diciembre",
    shortName: "Sep–Dic",
    season: "Tercer Período (Actual)",
    isCurrent: true,
    months: [8, 9, 10, 11], // Sep (8), Oct (9), Nov (10), Dic (11)
    badgeText: "Período Actual",
    note: "Período activo actualmente en curso."
  },
  {
    id: "may-jul",
    name: "Mayo – Julio",
    shortName: "May–Jul",
    season: "Segundo Período",
    isCurrent: false,
    months: [4, 5, 6], // May (4), Jun (5), Jul (6)
    badgeText: "Período Pasado",
    note: "Período concluido. Actividades archivadas ordenadas por fecha."
  },
  {
    id: "ene-abr",
    name: "Enero – Abril",
    shortName: "Ene–Abr",
    season: "Primer Período",
    isCurrent: false,
    months: [0, 1, 2, 3], // Ene (0), Feb (1), Mar (2), Abr (3)
    badgeText: "Período Pasado",
    note: "Período concluido. Actividades archivadas ordenadas por fecha."
  }
];

export const PERIOD_PAUSE_INFO = {
  title: "Pausa / Receso de Verano (Julio - Agosto)",
  description: "Entre finales de julio y agosto el ministerio entra en pausa y receso ministerial de actividades regulares para recargar fuerzas antes del inicio de Septiembre."
};

/**
 * Determina a qué período pertenece una actividad según su fecha o mes
 */
export function getActivityPeriod(activity) {
  if (activity?.periodId) return activity.periodId;
  
  if (activity?.fullDate) {
    const parts = activity.fullDate.split('-');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10) - 1; // 0-indexed
      if (monthNum >= 8 && monthNum <= 11) return 'sep-dic';
      if (monthNum >= 4 && monthNum <= 6) return 'may-jul';
      if (monthNum >= 0 && monthNum <= 3) return 'ene-abr';
    }
  }

  const m = (activity?.month || '').toLowerCase();
  if (['sep', 'oct', 'nov', 'dic', 'septiembre', 'octubre', 'noviembre', 'diciembre'].some(k => m.includes(k))) {
    return 'sep-dic';
  }
  if (['may', 'jun', 'jul', 'mayo', 'junio', 'julio'].some(k => m.includes(k))) {
    return 'may-jul';
  }
  if (['ene', 'feb', 'mar', 'abr', 'enero', 'febrero', 'marzo', 'abril'].some(k => m.includes(k))) {
    return 'ene-abr';
  }

  return 'sep-dic';
}

/**
 * Verifica si una actividad ya cumplió su plazo (fecha/hora ya pasada o completada)
 */
export function isActivityExpired(activity) {
  if (!activity) return false;
  if (activity.isCompleted || activity.isExpired || activity.isArchived || activity.status === 'completed') {
    return true;
  }

  if (activity.fullDate) {
    const parts = activity.fullDate.split('-').map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      let hour = 22;
      let minute = 0;
      if (activity.actEnd) {
        const [h, m] = activity.actEnd.split(':').map(Number);
        if (!isNaN(h)) hour = h;
        if (!isNaN(m)) minute = m;
      }
      const actDeadline = new Date(year, month - 1, day, hour, minute);
      return new Date() >= actDeadline;
    }
  }

  return false;
}

export const INITIAL_ANNOUNCEMENTS = [
  "La Cena de Jóvenes es en el auditorio principal de ICC. Todo lo demás, en el salón multiusos.",
  "Pendiente: nueva fecha de la actividad evangelística de Los Manguitos (basquetbol), cancelada el 10/10.",
  "Horario tentativo de Los Manguitos: preparación 2:30 pm · actividad 4:00 - 7:00 pm.",
  "Youth ICC · Calendario de logística · actualizado para octubre – diciembre de 2026"
];

// Helper functions for LocalStorage persistence
const STORAGE_ACTIVITIES_KEY = "youngers_icc_activities_v1";
const STORAGE_SERVERS_KEY = "youngers_icc_servers_v1";
const STORAGE_ANNOUNCEMENTS_KEY = "youngers_icc_announcements_v1";

export function loadStoredActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      // Combinar para asegurar que las actividades de períodos históricos estén presentes
      const storedIds = new Set(stored.map(a => a.id));
      const missingInitial = INITIAL_ACTIVITIES.filter(a => !storedIds.has(a.id));
      if (missingInitial.length > 0) {
        const combined = [...stored, ...missingInitial];
        return combined;
      }
      return stored;
    }
  } catch (e) {
    console.error("Error reading activities from localStorage", e);
  }
  return INITIAL_ACTIVITIES;
}

export function saveStoredActivities(activities) {
  try {
    localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(activities));
  } catch (e) {
    console.error("Error saving activities to localStorage", e);
  }
}

export function loadStoredServers() {
  try {
    const raw = localStorage.getItem(STORAGE_SERVERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading servers from localStorage", e);
  }
  return INITIAL_SERVERS;
}

export function saveStoredServers(servers) {
  try {
    localStorage.setItem(STORAGE_SERVERS_KEY, JSON.stringify(servers));
  } catch (e) {
    console.error("Error saving servers to localStorage", e);
  }
}

export function loadStoredAnnouncements() {
  try {
    const raw = localStorage.getItem(STORAGE_ANNOUNCEMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading announcements", e);
  }
  return INITIAL_ANNOUNCEMENTS;
}

export function saveStoredAnnouncements(announcements) {
  try {
    localStorage.setItem(STORAGE_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  } catch (e) {
    console.error("Error saving announcements", e);
  }
}

const STORAGE_PROGRAM_LOCKED_KEY = "youngers_icc_program_locked_v1";
const STORAGE_LOCKED_MESSAGE_KEY = "youngers_icc_locked_message_v1";

export const DEFAULT_LOCKED_MESSAGE = "El programa de actividades y logística se encuentra en preparación por el equipo de liderazgo y no está listo aún. Estará disponible próximamente para todos los servidores y jóvenes.";

export function loadStoredProgramLocked() {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRAM_LOCKED_KEY);
    if (raw !== null) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading program lock state", e);
  }
  return false;
}

export function saveStoredProgramLocked(locked) {
  try {
    localStorage.setItem(STORAGE_PROGRAM_LOCKED_KEY, JSON.stringify(locked));
  } catch (e) {
    console.error("Error saving program lock state", e);
  }
}

export function loadStoredLockedMessage() {
  try {
    const raw = localStorage.getItem(STORAGE_LOCKED_MESSAGE_KEY);
    if (raw) return raw;
  } catch (e) {
    console.error("Error reading locked message", e);
  }
  return DEFAULT_LOCKED_MESSAGE;
}

export function saveStoredLockedMessage(message) {
  try {
    localStorage.setItem(STORAGE_LOCKED_MESSAGE_KEY, message);
  } catch (e) {
    console.error("Error saving locked message", e);
  }
}

export function resetAllToDefaults() {
  try {
    localStorage.removeItem(STORAGE_ACTIVITIES_KEY);
    localStorage.removeItem(STORAGE_SERVERS_KEY);
    localStorage.removeItem(STORAGE_ANNOUNCEMENTS_KEY);
    localStorage.removeItem(STORAGE_PROGRAM_LOCKED_KEY);
    localStorage.removeItem(STORAGE_LOCKED_MESSAGE_KEY);
  } catch (e) {
    console.error("Error resetting data", e);
  }
}

