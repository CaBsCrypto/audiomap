// ══════════════════════════════════════════════════════════════════
// HOOK: useAudioRecorder — ENJAMBRE 4: Backend/Audio Engine (Live Speech)
// Utiliza Web Speech API (webkitSpeechRecognition) para transcripción
// continua y en vivo, eliminando el costo y retardo de Whisper.
// ══════════════════════════════════════════════════════════════════
import { useState, useRef, useCallback, useEffect } from 'react';

const COLORS = {
  panelBg:    '#0f172a',
  border:     '#1e293b',
  indigo:     '#6366f1',
  indigoGlow: '#818cf8',
  amber:      '#f59e0b',
};

export function useAudioRecorder(canvasRef) {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [transcription, setTranscription] = useState(''); // Texto final confirmado
  const [interimTranscript, setInterimTranscript] = useState(''); // Texto parcial mientras habla
  const [hardwareError, setHardwareError] = useState(false);

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const fullTranscriptRef = useRef(''); // Ref para evitar problemas de dependencias en callbacks

  // Simulador visual de ondas (ya que no capturamos stream de audio crudo)
  const animationFrameRef = useRef(null);

  // ── Simulador visual de onda sonora ──────────────────────────────
  const startVisualizer = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;
    
    const draw = () => {
      if (!isRecordingRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      
      ctx.fillStyle = COLORS.panelBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = COLORS.indigoGlow;
      ctx.lineWidth = 2.5;
      
      for (let x = 0; x < canvas.width; x++) {
        const amplitude = Math.random() * 15 + 10; 
        const y = canvas.height / 2 + Math.sin(x * 0.05 + angle) * amplitude;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      angle += 0.15;
    };
    draw();
  }, [canvasRef]);

  const stopVisualizer = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = COLORS.panelBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = COLORS.border;
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
  }, [canvasRef]);

  // ── Inicializar Speech Recognition ──────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Web Speech API no es compatible con este navegador.");
      setHardwareError(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES'; 
    
    recognition.onresult = (event) => {
      let currentInterim = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinal += event.results[i][0].transcript + ' ';
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (newFinal) {
        fullTranscriptRef.current += newFinal;
        setTranscription(fullTranscriptRef.current);
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event) => {
      console.warn("Speech Recognition Error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setHardwareError(true);
        isRecordingRef.current = false;
        setRecordingState('idle');
        stopVisualizer();
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        setTimeout(() => {
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch(e) {}
          }
        }, 1000); // Backoff for 1 second to avoid infinite freeze
      }
    };

    recognitionRef.current = recognition;

    return () => {
      stopVisualizer();
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, [startVisualizer, stopVisualizer]);

  // ── Acciones de UI ──────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!recognitionRef.current || hardwareError) {
      console.error("Hardware no disponible para grabar.");
      return;
    }
    setTranscription('');
    setInterimTranscript('');
    fullTranscriptRef.current = '';
    
    isRecordingRef.current = true;
    setRecordingState('recording');
    
    try {
      recognitionRef.current.start();
      startVisualizer();
    } catch (err) {
      console.warn("Recognition ya estaba corriendo");
    }
  }, [startVisualizer, hardwareError]);

  const stopRecording = useCallback(async () => {
    isRecordingRef.current = false;
    setRecordingState('processing'); 
    stopVisualizer();
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    const finalResult = fullTranscriptRef.current + interimTranscript;
    setInterimTranscript('');
    
    return finalResult;
  }, [stopVisualizer, interimTranscript]);

  return {
    recordingState, setRecordingState,
    transcription,
    interimTranscript,
    hardwareError,
    startRecording, stopRecording
  };
}
