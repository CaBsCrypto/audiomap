// ══════════════════════════════════════════════════════════════════
// i18n — ENGLISH
// ══════════════════════════════════════════════════════════════════
export const en = {
  app: {
    name: 'AudioMap AI',
    tagline: 'Structural Transcription & AI Ideation',
  },
  auth: {
    title: 'Turn your voice into structured ideas',
    subtitle: 'Record, transcribe with Whisper, and generate mind maps with Gemini.',
    loginButton: 'Continue with Google',
    loading: 'Signing in...',
    error: 'Sign-in failed. Please try again.',
  },
  recorder: {
    label: 'Voice Capture',
    start: 'Record Microphone',
    stop: 'Stop Recording',
    processing: 'Processing...',
    transcribing: 'Transcribing with Whisper...',
    classifying: 'Classifying with Gemini...',
    done: 'Analysis complete',
    states: {
      idle: 'Idle',
      recording: 'Recording',
      paused: 'Paused',
      processing: 'Processing',
      transcribing: 'Transcribing',
      classifying: 'Classifying',
    },
  },
  hardware: {
    errorTitle: 'Hardware unavailable',
    errorMsg: 'Microphone permission denied. Running heuristic simulation.',
  },
  audio: {
    label: 'Processed Audio',
    retry: 'Retry',
    attempt: 'Attempt {{n}} of {{max}}...',
  },
  transcription: {
    label: 'Raw Transcription',
    empty: 'Waiting for audio input...',
  },
  canvas: {
    exportSVG: 'Export SVG',
    exportPNG: 'Export PNG',
    copyMarkdown: 'Copy Markdown',
    downloadJSON: 'Download JSON',
    shareLink: 'Share Link',
    addNode: 'Add Sub-concept',
    deleteNode: 'Delete active node',
    hint: 'Double-click labels to edit · Drag to move nodes',
    shareSuccess: 'Link copied to clipboard!',
    markdownSuccess: 'Markdown structure copied for Notion.',
    saving: 'Saving...',
    saved: 'Saved',
  },
  errors: {
    whisper: 'Audio transcription failed.',
    gemini: 'Failed to classify ideas with Gemini.',
    network: 'No connection. Retrying...',
    firestore: 'Failed to save to cloud.',
  },
};
