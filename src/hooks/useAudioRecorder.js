// ══════════════════════════════════════════════════════════════════
// HOOK: useAudioRecorder — ENJAMBRE 4: Backend/Audio Engine
// Gestiona MediaRecorder, Web Audio API y Canvas de waveform
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
  const [recordingState, setRecordingState] = useState('idle');
  // 'idle' | 'recording' | 'processing'
  const [audioURL,       setAudioURL]       = useState(null);
  const [audioBlob,      setAudioBlob]      = useState(null);
  const [hardwareError,  setHardwareError]  = useState(false);

  const audioContextRef   = useRef(null);
  const analyserRef       = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const animationFrameRef = useRef(null);
  const streamRef         = useRef(null);

  // ── Limpieza al desmontar ──────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Visualizador FFT con gradiente neón ───────────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const ctx         = canvas.getContext('2d');
    const bufferLen   = analyserRef.current.frequencyBinCount;
    const dataArray   = new Uint8Array(bufferLen);
    const barWidth    = (canvas.width / bufferLen) * 2.5;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = COLORS.panelBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let x = 0;
      for (let i = 0; i < bufferLen; i++) {
        const barHeight = dataArray[i] / 1.8;
        const gradient  = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0,   COLORS.border);
        gradient.addColorStop(0.5, COLORS.indigo);
        gradient.addColorStop(1,   COLORS.indigoGlow);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    draw();
  }, [canvasRef]);

  // ── Fallback visual cuando no hay micrófono ───────────────────
  const simulateFallbackWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let angle = 0;
    let active = true;

    const simulate = () => {
      if (!active) return;
      animationFrameRef.current = requestAnimationFrame(simulate);
      ctx.fillStyle = COLORS.panelBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth   = 2.5;
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin(x * 0.05 + angle) * (Math.random() * 12 + 6);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      angle += 0.08;
    };
    simulate();

    // Simula 5s de "grabación" y luego llama a onstop
    setTimeout(() => {
      active = false;
      cancelAnimationFrame(animationFrameRef.current);
    }, 5000);
  }, [canvasRef]);

  // ── Inicio de grabación ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    setHardwareError(false);
    cancelAnimationFrame(animationFrameRef.current);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current     = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      audioContextRef.current.createMediaStreamSource(stream).connect(analyserRef.current);

      audioChunksRef.current  = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setRecordingState('recording');
      drawWaveform();
    } catch (err) {
      console.error('[AudioRecorder] Mic error:', err);
      setHardwareError(true);
      setRecordingState('recording'); // permite continuar con simulación
      simulateFallbackWaveform();
    }
  }, [drawWaveform, simulateFallbackWaveform]);

  // ── Detención de grabación ────────────────────────────────────
  const stopRecording = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    setRecordingState('processing');

    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url  = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setAudioURL(url);
          audioContextRef.current?.close();
          streamRef.current?.getTracks().forEach(t => t.stop());
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        // Fallback: no había grabación real
        resolve(null);
      }
    });
  }, []);

  // ── Clear del canvas ──────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  return {
    recordingState,
    setRecordingState,
    audioURL,
    audioBlob,
    hardwareError,
    startRecording,
    stopRecording,
    clearCanvas,
  };
}
