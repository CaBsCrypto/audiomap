// ══════════════════════════════════════════════════════════════════
// COMPONENTE: StatusBadge — ENJAMBRE 1: Diseño
// Indicador de estado visual con colores semánticos
// ══════════════════════════════════════════════════════════════════
import React from 'react';

const STATE_CONFIG = {
  idle:         { color: '#64748b', label: null,          pulse: false },
  recording:    { color: '#ef4444', label: 'recording',   pulse: true  },
  processing:   { color: '#f59e0b', label: 'processing',  pulse: true  },
  transcribing: { color: '#6366f1', label: 'transcribing',pulse: true  },
  classifying:  { color: '#10b981', label: 'classifying', pulse: true  },
  done:         { color: '#10b981', label: 'done',        pulse: false },
  error:        { color: '#ef4444', label: 'error',       pulse: false },
};

export default function StatusBadge({ state, t }) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.idle;
  const label  = t ? t(`recorder.states.${state}`) : state;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`status-dot ${config.pulse ? 'animate-ping' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      {!config.pulse && (
        <span
          className="status-dot absolute"
          style={{ backgroundColor: config.color }}
        />
      )}
      <span className="text-xs text-slate-400 capitalize font-mono">{label}</span>
    </div>
  );
}
