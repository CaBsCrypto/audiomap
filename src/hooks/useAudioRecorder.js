// ══════════════════════════════════════════════════════════════════
// HOOK: useAudioRecorder — ENJAMBRE 4: Backend/Audio Engine (Live Speech)
// Utiliza OpenAI Whisper API para transcripción continua en bloques,
// logrando una precisión profesional compatible con cualquier navegador móvil.
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
const CHUNK_INTERVAL_MS = 8000; // Rotación de audio cada 8 segundos

export function useAudioRecorder(canvasRef, canvasRefMobile) {
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [transcription, setTranscription] = useState(''); // Texto final confirmado
  const [interimTranscript, setInterimTranscript] = useState(''); // Texto parcial simulado (compatible)
  const [hardwareError, setHardwareError] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalIdRef = useRef(null);
  const isRecordingRef = useRef(false);
  const fullTranscriptRef = useRef('');
  const animationFrameRef = useRef(null);

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
      return;
    }

    const formData = new FormData();
    const mime = audioBlob.type || 'audio/webm';
    const extension = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    
    formData.append('file', audioBlob, `chunk.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper HTTP status ${response.status}`);
      }

      const data = await response.json();
      const text = data.text?.trim();
      if (text) {
        // Concatenar al historial de transcripción
        const separator = fullTranscriptRef.current ? ' ' : '';
        fullTranscriptRef.current += separator + text;
        setTranscription(fullTranscriptRef.current);
      }
    } catch (err) {
      console.error("[Whisper] Error en la transcripción:", err);
    }
  };

  // ── Iniciar Grabación ───────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setHardwareError(false);
      audioChunksRef.current = [];
      fullTranscriptRef.current = '';
      setTranscription('');
      setInterimTranscript('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Selección de códec compatible
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/mp4' };
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
          options = {};
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        audioChunksRef.current = [];
        if (audioBlob.size > 1000) {
          transcribeAudioChunk(audioBlob);
        }
      };

      isRecordingRef.current = true;
      setRecordingState('recording');
      startVisualizer();
      
      mediaRecorder.start();

      // Bucle de rotación de chunks de audio cada 8 segundos
      intervalIdRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          // Detener el recorder actual dispara onstop y envía el buffer a Whisper
          mediaRecorderRef.current.stop();
          
          // Arrancar de inmediato el siguiente recorder con el mismo stream nativo
          if (isRecordingRef.current && streamRef.current) {
            try {
              const nextRecorder = new MediaRecorder(streamRef.current, options);
              mediaRecorderRef.current = nextRecorder;
              nextRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
                }
              };
              nextRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: nextRecorder.mimeType });
                audioChunksRef.current = [];
                if (audioBlob.size > 1000) {
                  transcribeAudioChunk(audioBlob);
                }
              };
              nextRecorder.start();
            } catch (e) {
              console.error("[Audio] Error rotando MediaRecorder:", e);
            }
          }
        }
      }, CHUNK_INTERVAL_MS);

    } catch (err) {
      console.error("[Audio] No se pudo acceder al micrófono:", err);
      setHardwareError(true);
      setRecordingState('idle');
    }
  }, [startVisualizer]);

  // ── Detener Grabación ───────────────────────────────────────────
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setRecordingState('idle');
    stopVisualizer();

    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [stopVisualizer]);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
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
