// ══════════════════════════════════════════════════════════════════
// HOOK: useAudioRecorder — ENJAMBRE 4: Backend/Audio Engine (Live Speech)
// Utiliza OpenAI Whisper API con segmentación en clausuras aisladas
// para prevenir race conditions y lograr transcripción de alta fidelidad.
// ══════════════════════════════════════════════════════════════════
import { useState, useRef, useCallback, useEffect } from 'react';

const COLORS = {
  panelBg:    '#0f172a',
  border:     '#1e293b',
  indigo:     '#6366f1',
  indigoGlow: '#818cf8',
  amber:      '#f59e0b',
};

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY;
const CHUNK_INTERVAL_MS = 8000; // Fraccionamiento de audio cada 8 segundos

export function useAudioRecorder(canvasRef, canvasRefMobile) {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [transcription, setTranscription] = useState(''); // Texto final confirmado
  const [interimTranscript, setInterimTranscript] = useState(''); // Estado temporal/errores
  const [hardwareError, setHardwareError] = useState(false);

  const currentRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);
  const fullTranscriptRef = useRef('');
  const animationFrameRef = useRef(null);
  const timeoutIdRef = useRef(null);

  // ── Simulador visual de onda sonora ──────────────────────────────
  const startVisualizer = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    let angle = 0;
    
    const draw = () => {
      if (!isRecordingRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      
      const canvases = [canvasRef.current, canvasRefMobile?.current].filter(Boolean);
      canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
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
      });
      angle += 0.15;
    };
    draw();
  }, [canvasRef, canvasRefMobile]);

  const stopVisualizer = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    const canvases = [canvasRef.current, canvasRefMobile?.current].filter(Boolean);
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = COLORS.panelBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }, [canvasRef, canvasRefMobile]);

  // ── Consumo de OpenAI Whisper API ───────────────────────────────
  const transcribeAudioChunk = async (audioBlob) => {
    if (!OPENAI_KEY || OPENAI_KEY.startsWith('sk-proj-xxxx') || OPENAI_KEY === '') {
      console.warn("[Whisper] Falta o es inválida la clave VITE_OPENAI_KEY.");
      setInterimTranscript("Error: Falta clave OpenAI en configuración.");
      return;
    }

    const formData = new FormData();
    const mime = audioBlob.type || 'audio/webm';
    const extension = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    
    formData.append('file', audioBlob, `chunk.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    try {
      setInterimTranscript("Transcribiendo...");
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data.text?.trim();
      if (text) {
        const separator = fullTranscriptRef.current ? ' ' : '';
        fullTranscriptRef.current += separator + text;
        setTranscription(fullTranscriptRef.current);
        setInterimTranscript('');
      } else {
        setInterimTranscript('');
      }
    } catch (err) {
      console.error("[Whisper] Error en la transcripción:", err);
      setInterimTranscript(`Error: ${err.message}`);
    }
  };

  // ── Iniciar Grabación Recursiva por Bloques ──────────────────────
  const startRecording = useCallback(async () => {
    try {
      setHardwareError(false);
      fullTranscriptRef.current = '';
      setTranscription('');
      setInterimTranscript('Iniciando micrófono...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/mp4' };
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
          options = {};
        }
      }

      isRecordingRef.current = true;
      setRecordingState('recording');
      startVisualizer();

      const recordNextChunk = () => {
        if (!isRecordingRef.current || !streamRef.current) return;

        const chunks = [];
        const recorder = new MediaRecorder(streamRef.current, options);
        currentRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType });
          if (audioBlob.size > 1000) {
            transcribeAudioChunk(audioBlob);
          }
          
          // Encadenar la siguiente grabación si sigue activo
          if (isRecordingRef.current) {
            recordNextChunk();
          }
        };

        recorder.start();

        // Limitar la duración de este chunk a 8 segundos
        timeoutIdRef.current = setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, CHUNK_INTERVAL_MS);
      };

      // Arrancar el primer segmento
      recordNextChunk();

    } catch (err) {
      console.error("[Audio] No se pudo acceder al micrófono:", err);
      setHardwareError(true);
      setRecordingState('idle');
      setInterimTranscript(`Error mic: ${err.message}`);
    }
  }, [startVisualizer]);

  // ── Detener Grabación ───────────────────────────────────────────
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setRecordingState('idle');
    setInterimTranscript('');
    stopVisualizer();

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    if (currentRecorderRef.current && currentRecorderRef.current.state !== 'inactive') {
      try {
        currentRecorderRef.current.stop();
      } catch (e) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [stopVisualizer]);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    recordingState,
    setRecordingState,
    transcription,
    interimTranscript,
    hardwareError,
    startRecording,
    stopRecording,
  };
}
