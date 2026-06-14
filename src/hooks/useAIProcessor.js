// ══════════════════════════════════════════════════════════════════
// HOOK: useAIProcessor — ENJAMBRE 4: Backend IA
// Pipeline: Blob audio → Whisper → texto → Gemini → árbol JSON
// Con retry exponencial: 1s → 2s → 4s → 8s → 16s
// ══════════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import { cleanTranscription, parseGeminiResponse, heuristicSplit } from '../utils/textProcessor';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
const MAX_RETRIES = 5;

// ── Retry con backoff exponencial ─────────────────────────────────
async function withRetry(fn, maxRetries = MAX_RETRIES, onRetry) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
      console.warn(`[AI] Intento ${attempt + 1}/${maxRetries} fallido. Reintentando en ${delay}ms...`);
      onRetry?.(attempt + 1, maxRetries);
      await sleep(delay);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Transcripción con Whisper ─────────────────────────────────────
async function transcribeWithWhisper(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'es');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.text;
}

// ── Clasificación semántica con Gemini ────────────────────────────
async function classifyWithGemini(transcription, locale = 'es') {
  const systemPrompt = locale === 'es'
    ? `Eres un asistente de mapas mentales. Analiza el texto y devuelve SOLO un JSON válido con esta estructura exacta:
{"root": "tema central en menos de 8 palabras", "branches": [{"label": "idea principal", "children": [{"label": "sub-idea", "children": []}]}]}
Máximo 6 ramas principales, máximo 3 niveles de profundidad. Sin texto extra, solo el JSON.`
    : `You are a mind map assistant. Analyze the text and return ONLY valid JSON with this exact structure:
{"root": "central theme in less than 8 words", "branches": [{"label": "main idea", "children": [{"label": "sub-idea", "children": []}]}]}
Maximum 6 main branches, maximum 3 depth levels. No extra text, only JSON.`;

  const body = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\nTexto a analizar:\n${transcription}`,
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extraer JSON de posibles markdown code fences
  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

  return parseGeminiResponse(jsonString, transcription, locale);
}

// ══════════════════════════════════════════════════════════════════
export function useAIProcessor() {
  const [aiState,        setAIState]        = useState('idle');
  // 'idle' | 'transcribing' | 'classifying' | 'done' | 'error'
  const [transcription,  setTranscription]  = useState('');
  const [aiError,        setAIError]        = useState(null);
  const [retryInfo,      setRetryInfo]      = useState(null);
  // { attempt: number, max: number }

  const processAudio = useCallback(async (audioBlob, locale = 'es') => {
    setAIError(null);
    setRetryInfo(null);

    // ── FASE 1: Whisper ──────────────────────────────────────────
    let rawText = '';

    if (!audioBlob || !OPENAI_KEY || OPENAI_KEY.startsWith('sk-xxx')) {
      // Modo demo sin clave real
      console.warn('[AI] Sin clave Whisper, usando texto de demostración');
      rawText = 'Diseñaremos un SaaS disruptivo. Por lo tanto, requerimos arquitectura modular con React y componentes reutilizables. Luego, implementaremos estrategias SEO avanzadas con keywords semánticas. Por ejemplo, flujos automáticos mediante webhooks operacionales y microservicios escalables.';
    } else {
      try {
        setAIState('transcribing');
        rawText = await withRetry(
          () => transcribeWithWhisper(audioBlob),
          MAX_RETRIES,
          (attempt, max) => setRetryInfo({ attempt, max })
        );
        setRetryInfo(null);
      } catch (err) {
        setAIError('whisper');
        setAIState('error');
        // Fallback heurístico
        rawText = 'Análisis de voz no disponible. Por lo tanto, mapa generado con datos de ejemplo. Luego, configure su clave de API de OpenAI en el archivo .env.';
      }
    }

    const cleaned = cleanTranscription(rawText);
    setTranscription(cleaned);

    // ── FASE 2: Gemini ───────────────────────────────────────────
    let tree;

    if (!GEMINI_KEY || GEMINI_KEY.startsWith('AIzaxxx')) {
      console.warn('[AI] Sin clave Gemini, usando heurística local');
      tree = heuristicSplit(cleaned, locale);
    } else {
      try {
        setAIState('classifying');
        setRetryInfo(null);
        tree = await withRetry(
          () => classifyWithGemini(cleaned, locale),
          MAX_RETRIES,
          (attempt, max) => setRetryInfo({ attempt, max })
        );
        setRetryInfo(null);
      } catch (err) {
        setAIError('gemini');
        tree = heuristicSplit(cleaned, locale);
      }
    }

    setAIState('done');
    return tree;
  }, []);

  const resetAI = useCallback(() => {
    setAIState('idle');
    setTranscription('');
    setAIError(null);
    setRetryInfo(null);
  }, []);

  return {
    aiState,
    transcription,
    aiError,
    retryInfo,
    processAudio,
    resetAI,
  };
}
