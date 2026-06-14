// ══════════════════════════════════════════════════════════════════
// COMPONENTE: LeftPanel — ENJAMBRE 1: Diseño
// Panel lateral: grabación, waveform, transcripción, audio player
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { Mic, Square, LogOut, User, Folder, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useI18n } from '../../hooks/useI18n';
import HardwareAlert from '../ui/HardwareAlert';
import StatusBadge   from '../ui/StatusBadge';
import LanguageToggle from '../ui/LanguageToggle';

export default function LeftPanel({
  isOpen,
  setIsOpen,
  user,
  canvasRef,
  recordingState,
  audioURL,
  hardwareError,
  aiState,
  retryInfo,
  transcription,
  onStartRecording,
  onStopRecording,
  onOpenMyMaps,
}) {
  const { t } = useI18n();

  const isRecording  = recordingState === 'recording';
  const isBusy       = ['processing', 'transcribing', 'classifying'].includes(recordingState) ||
                       ['transcribing', 'classifying'].includes(aiState);
  const displayState = ['transcribing', 'classifying'].includes(aiState) ? aiState : recordingState;

  return (
    <>
      {/* ── Overlay Móvil ────────────────────────────────────────── */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-fade-up"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          w-[360px] max-w-[90vw] h-full flex flex-col border-r border-slate-800 z-50 overflow-y-auto
          absolute md:relative transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backgroundColor: '#0f172a' }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between shrink-0">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight gradient-text">{t('app.name')}</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('app.tagline')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-200"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
            <LanguageToggle />
            {user && (
            <button
              id="btn-logout"
              onClick={() => signOut(auth)}
              className="btn-icon text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 flex-1">

        {/* ── Avatar de usuario ─────────────────────────────────── */}
        {user && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3 min-w-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center shrink-0">
                  <User size={14} className="text-indigo-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.displayName || 'Usuario'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onOpenMyMaps}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors shrink-0"
              title="Mis Mapas Guardados"
            >
              <Folder size={16} />
            </button>
          </div>
        )}

        {/* ── Sección de Grabación ─────────────────────────────── */}
        <div className="panel-section shrink-0">
          <div className="panel-header">
            <span>{t('recorder.label')}</span>
            <StatusBadge state={displayState} t={t} />
          </div>

          {/* Canvas de waveform */}
          <div className="relative bg-slate-950" style={{ height: '80px' }}>
            <canvas
              ref={canvasRef}
              width={320}
              height={80}
              className="w-full h-full block"
              aria-label="Visualizador de forma de onda de audio"
            />
            {/* Overlay de estado cuando no está grabando */}
            {!isRecording && recordingState === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-slate-700"
                      style={{ height: `${8 + Math.sin(i * 0.7) * 6}px` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controles de grabación */}
          <div className="p-4 flex justify-center gap-3 bg-slate-950/50">
            {!isRecording && !isBusy ? (
              <button
                id="btn-start-recording"
                onClick={onStartRecording}
                className="btn-primary"
              >
                <Mic size={15} />
                <span>{t('recorder.start')}</span>
              </button>
            ) : isRecording ? (
              <button
                id="btn-stop-recording"
                onClick={onStopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500
                           active:scale-95 transition-all rounded-xl font-medium text-sm
                           shadow-lg shadow-red-500/20 text-white"
              >
                <Square size={15} />
                <span>{t('recorder.stop')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">
                  {retryInfo
                    ? `Reintentando ${retryInfo.attempt}/${retryInfo.max}...`
                    : t(`recorder.${aiState}`) || t('recorder.processing')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Alerta de hardware ──────────────────────────────── */}
        {hardwareError && <HardwareAlert />}

        {/* ── Reproductor de audio ─────────────────────────────── */}
        {audioURL && (
          <div className="panel-section shrink-0">
            <div className="panel-header">
              <span>{t('audio.label')}</span>
            </div>
            <div className="p-3">
              <audio
                src={audioURL}
                controls
                className="w-full h-8 accent-indigo-500"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        )}

        {/* ── Transcripción ────────────────────────────────────── */}
        <div className="panel-section flex-1 min-h-0 flex flex-col">
          <div className="panel-header shrink-0">
            <span>{t('transcription.label')}</span>
            {transcription && (
              <span className="text-emerald-500 text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Live
              </span>
            )}
          </div>
          <div className="p-4 overflow-y-auto flex-1 text-xs leading-relaxed text-slate-300 font-mono">
            {transcription ? (
              <span>{transcription}</span>
            ) : (
              <span className="text-slate-600 italic">{t('transcription.empty')}</span>
            )}
          </div>
        </div>

      </div>

      {/* ── Footer del panel ─────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <p className="text-[10px] text-slate-600 text-center font-mono">
          {t('canvas.hint')}
        </p>
      </div>
    </aside>
    </>
  );
}
