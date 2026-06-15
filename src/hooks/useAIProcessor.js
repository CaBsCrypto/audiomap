// ══════════════════════════════════════════════════════════════════
// HOOK: useAIProcessor — ENJAMBRE 4: Backend IA (Live Processing)
// Pipeline: Fragmento de texto (Web Speech) → Gemini → Nodos JSON
// Extrae conceptos de un stream de texto en tiempo real.
// ══════════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import { parseGeminiResponse } from '../utils/textProcessor';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
const MAX_RETRIES = 3;

async function withRetry(fn, maxRetries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ── Clasificación semántica de fragmentos con Gemini ──────────────
async function extractNodesWithGemini(textChunk, locale = 'es') {
  const systemPrompt = locale === 'es'
    ? `Eres un asistente de mapas mentales en tiempo real. Analiza este nuevo fragmento de la conversación en curso.
Extrae hasta 3 ideas clave o conceptos fuertes que acaben de mencionarse.
Devuelve SOLO un array JSON válido con esta estructura exacta:
[{"label": "Idea clave", "children": [{"label": "Detalle 1", "children": []}]}]
Si no hay nada relevante o es texto de relleno, devuelve []. Sin texto extra, solo el JSON.`
    : `You are a real-time mind map assistant. Analyze this new chunk of an ongoing conversation.
Extract up to 3 key ideas or strong concepts just mentioned.
Return ONLY a valid JSON array with this exact structure:
[{"label": "Key Idea", "children": [{"label": "Detail 1", "children": []}]}]
If nothing is relevant or it's filler text, return []. No extra text, only JSON.`;

  const body = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\nFragmento a analizar:\n${textChunk}`,
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
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
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/(\[[\s\S]*\])/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

  try {
    const nodes = JSON.parse(jsonString);
    return Array.isArray(nodes) ? nodes : [];
  } catch (e) {
    console.error("Error parseando Gemini JSON:", e, jsonString);
    return [];
  }
}

export function useAIProcessor() {
  const [aiState, setAIState] = useState('idle'); // 'idle' | 'classifying' | 'done' | 'error'
  const [aiError, setAIError] = useState(null);

  const processChunk = useCallback(async (textChunk, locale = 'es') => {
    if (!textChunk || textChunk.trim().length < 10) return []; // Ignorar fragmentos muy cortos
    
    setAIError(null);

    if (!GEMINI_KEY || GEMINI_KEY.startsWith('AIzaxxx')) {
      return []; // Silencioso sin clave
    }

    try {
      setAIState('classifying');
      const nodes = await withRetry(() => extractNodesWithGemini(textChunk, locale));
      setAIState('done');
      return nodes;
    } catch (err) {
      console.error("[AI] Error procesando chunk:", err);
      setAIError('gemini');
      setAIState('error');
      return [];
    }
  }, []);

  const resetAI = useCallback(() => {
    setAIState('idle');
    setAIError(null);
  }, []);

  return {
    aiState,
    aiError,
    processChunk,
    resetAI,
  };
}
