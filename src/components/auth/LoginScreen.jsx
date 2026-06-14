// ══════════════════════════════════════════════════════════════════
// COMPONENTE: LoginScreen — ENJAMBRE 1: Diseño & UX/UI
// Pantalla de autenticación Google OAuth con glassmorphism
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useI18n } from '../../hooks/useI18n';

// Generador de partículas de fondo
function BackgroundParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size:  Math.random() * 4 + 2,
    left:  Math.random() * 100,
    top:   Math.random() * 100,
    delay: Math.random() * 6,
    duration: Math.random() * 8 + 6,
    color: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#10b981' : '#818cf8',
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            width:            `${p.size}px`,
            height:           `${p.size}px`,
            left:             `${p.left}%`,
            top:              `${p.top}%`,
            backgroundColor:  p.color,
            animationDuration:`${p.duration}s`,
            animationDelay:   `${p.delay}s`,
            opacity:          0.4,
            boxShadow:        `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginScreen({ onGuestLogin }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('[Auth] Google login error:', err);
      setError(t('auth.error'));
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center w-screen h-screen overflow-hidden"
      style={{ backgroundColor: '#020617' }}
    >
      <BackgroundParticles />

      {/* Orb de fondo decorativo */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Tarjeta principal */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-up">
        <div
          className="rounded-3xl border border-slate-800/80 p-10 flex flex-col items-center gap-8"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 25px 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* Logo / Marca */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                boxShadow: '0 0 30px rgba(99,102,241,0.4)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
                <circle cx="6"  cy="10" r="3" fill="white" opacity="0.6"/>
                <circle cx="26" cy="10" r="3" fill="white" opacity="0.6"/>
                <circle cx="6"  cy="22" r="3" fill="white" opacity="0.6"/>
                <circle cx="26" cy="22" r="3" fill="white" opacity="0.6"/>
                <line x1="16" y1="16" x2="6"  y2="10" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                <line x1="16" y1="16" x2="26" y2="10" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                <line x1="16" y1="16" x2="6"  y2="22" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                <line x1="16" y1="16" x2="26" y2="22" stroke="white" strokeWidth="1.5" opacity="0.4"/>
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
              {t('app.name')}
            </h1>
          </div>

          {/* Texto descriptivo */}
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-slate-100">{t('auth.title')}</p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{t('auth.subtitle')}</p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {['Whisper AI', 'Gemini 2.0', 'Firebase', 'SVG Export'].map(feat => (
              <span
                key={feat}
                className="px-3 py-1 text-xs font-medium rounded-full border border-slate-700 text-slate-300"
                style={{ background: 'rgba(30,41,59,0.6)' }}
              >
                {feat}
              </span>
            ))}
          </div>

          {/* Botón Google */}
          <button
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl
                       font-semibold text-sm text-slate-100 border border-slate-700
                       transition-all duration-200 active:scale-95 disabled:opacity-60
                       disabled:cursor-not-allowed hover:border-indigo-600"
            style={{
              background: loading
                ? 'rgba(15,23,42,0.8)'
                : 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.2)',
            }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>{t('auth.loading')}</span>
              </>
            ) : (
              <>
                {/* Google SVG Icon */}
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>{t('auth.loginButton')}</span>
              </>
            )}
          </button>

          {/* Botón Invitado */}
          <button
            id="btn-guest-login"
            onClick={onGuestLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl
                       font-medium text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            Continuar sin cuenta (Modo Local)
          </button>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 text-center animate-fade-up">{error}</p>
          )}

          <p className="text-xs text-slate-600 text-center">
            Al continuar, aceptas los Términos de Servicio y la Política de Privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}
