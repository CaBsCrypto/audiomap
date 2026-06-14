// ══════════════════════════════════════════════════════════════════
// HOOK: useI18n — Selector de idioma ES/EN
// ══════════════════════════════════════════════════════════════════
import { useState, useCallback, createContext, useContext } from 'react';
import { es } from '../i18n/es';
import { en } from '../i18n/en';

const translations = { es, en };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('audiomap-locale') || 'es';
  });

  const toggleLocale = useCallback(() => {
    setLocale(prev => {
      const next = prev === 'es' ? 'en' : 'es';
      localStorage.setItem('audiomap-locale', next);
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
