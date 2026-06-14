// ══════════════════════════════════════════════════════════════════
// COMPONENTE: LanguageToggle — ENJAMBRE 1: Diseño
// Selector ES/EN con animación de transición
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { useI18n } from '../../hooks/useI18n';

export default function LanguageToggle() {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      id="btn-language-toggle"
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700
                 hover:border-slate-600 bg-slate-900 hover:bg-slate-800 transition-all
                 duration-150 text-xs font-semibold text-slate-300 select-none"
      aria-label="Cambiar idioma"
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className={locale === 'es' ? 'text-slate-100' : 'text-slate-500'}>ES</span>
      <span className="text-slate-600">/</span>
      <span className={locale === 'en' ? 'text-slate-100' : 'text-slate-500'}>EN</span>
    </button>
  );
}
