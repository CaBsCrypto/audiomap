// ══════════════════════════════════════════════════════════════════
// i18n — ESPAÑOL
// ══════════════════════════════════════════════════════════════════
export const es = {
  app: {
    name: 'AudioMap IA',
    tagline: 'Transcripción Estructural e Ideación con IA',
  },
  auth: {
    title: 'Convierte tu voz en ideas estructuradas',
    subtitle: 'Graba, transcribe con Whisper y genera mapas mentales con Gemini.',
    loginButton: 'Continuar con Google',
    loading: 'Iniciando sesión...',
    error: 'Error al iniciar sesión. Intenta de nuevo.',
  },
  recorder: {
    label: 'Captura de Voz',
    start: 'Grabar Micrófono',
    stop: 'Detener Grabación',
    processing: 'Procesando...',
    transcribing: 'Transcribiendo con Whisper...',
    classifying: 'Clasificando con Gemini...',
    done: 'Análisis completado',
    states: {
      idle: 'Inactivo',
      recording: 'Grabando',
      paused: 'Pausado',
      processing: 'Procesando',
      transcribing: 'Transcribiendo',
      classifying: 'Clasificando',
    },
  },
  hardware: {
    errorTitle: 'Hardware no disponible',
    errorMsg: 'Permisos de micrófono denegados. Simulación heurística activa.',
  },
  audio: {
    label: 'Audio Procesado',
    retry: 'Reintentar',
    attempt: 'Intento {{n}} de {{max}}...',
  },
  transcription: {
    label: 'Transcripción Textual',
    empty: 'Esperando entrada de audio...',
  },
  canvas: {
    exportSVG: 'Exportar SVG',
    exportPNG: 'Exportar PNG',
    copyMarkdown: 'Copiar Markdown',
    downloadJSON: 'Descargar JSON',
    shareLink: 'Compartir Enlace',
    addNode: 'Añadir Sub-concepto',
    deleteNode: 'Eliminar nodo activo',
    hint: 'Doble clic sobre etiquetas para editar · Arrastra para mover nodos',
    shareSuccess: '¡Enlace copiado al portapapeles!',
    markdownSuccess: 'Estructura Markdown copiada para Notion.',
    saving: 'Guardando...',
    saved: 'Guardado',
  },
  errors: {
    whisper: 'Error en la transcripción de audio.',
    gemini: 'Error al clasificar ideas con Gemini.',
    network: 'Sin conexión. Reintentando...',
    firestore: 'Error al guardar en la nube.',
  },
};
