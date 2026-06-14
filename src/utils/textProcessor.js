// ══════════════════════════════════════════════════════════════════
// UTILS — Procesador de Texto Heurístico
// ENJAMBRE 4: Backend — Limpieza y fallback cuando Gemini no responde
// ══════════════════════════════════════════════════════════════════

// Conectores lógicos para split heurístico
const CONNECTORS_ES = /(?:por lo tanto|luego|además|también|sin embargo|por ejemplo|en consecuencia|por otro lado|finalmente|primero|segundo|tercero)/gi;
const CONNECTORS_EN = /(?:therefore|furthermore|however|for example|additionally|in conclusion|on the other hand|finally|first|second|third)/gi;

/**
 * Limpia el texto crudo de transcripción Whisper.
 * Elimina muletillas, normaliza espacios y puntuación.
 */
export function cleanTranscription(raw) {
  return raw
    .replace(/\b(eh|um|uh|mmm|este|pues|bueno|o sea|básicamente)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/([.!?])\s*([a-záéíóúA-ZÁÉÍÓÚ])/g, '$1 $2')
    .trim();
}

/**
 * Fallback heurístico: split por conectores cuando Gemini falla.
 * Devuelve un árbol compatible con buildNodesFromTree().
 * @param {string} text - Texto limpio de transcripción
 * @param {string} locale - 'es' | 'en'
 * @returns {{ root: string, branches: Array }}
 */
export function heuristicSplit(text, locale = 'es') {
  const connectors = locale === 'es' ? CONNECTORS_ES : CONNECTORS_EN;
  const parts = text.split(connectors).map(s => s.trim()).filter(s => s.length > 3);

  if (parts.length === 0) {
    return { root: text.slice(0, 60) || 'Idea Principal', branches: [] };
  }

  const [rootText, ...rest] = parts;
  return {
    root: truncate(rootText, 60),
    branches: rest.map(label => ({ label: truncate(label, 80), children: [] })),
  };
}

/**
 * Valida y parsea el JSON devuelto por Gemini.
 * Si falla, aplica heuristicSplit como fallback.
 */
export function parseGeminiResponse(jsonString, rawText, locale) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.root && Array.isArray(parsed.branches)) {
      return parsed;
    }
    throw new Error('Invalid structure');
  } catch {
    console.warn('[TextProcessor] Gemini JSON inválido, usando fallback heurístico');
    return heuristicSplit(rawText, locale);
  }
}

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}
