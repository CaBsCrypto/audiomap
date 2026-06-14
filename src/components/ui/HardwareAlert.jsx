// ══════════════════════════════════════════════════════════════════
// COMPONENTE: HardwareAlert — ENJAMBRE 5: QA
// Banner de advertencia cuando el micrófono no tiene permisos
// ══════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

export default function HardwareAlert({ onDismiss }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      id="hardware-alert"
      className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-800/50 animate-slide-in"
      style={{ background: 'rgba(120,53,15,0.25)' }}
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-300">{t('hardware.errorTitle')}</p>
        <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">{t('hardware.errorMsg')}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-amber-600 hover:text-amber-400 transition-colors shrink-0 mt-0.5"
        aria-label="Cerrar alerta"
      >
        <X size={14} />
      </button>
    </div>
  );
}
