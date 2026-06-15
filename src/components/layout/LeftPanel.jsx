// ══════════════════════════════════════════════════════════════════
// COMPONENTE: LeftPanel — ENJAMBRE 1: Diseño
// Panel lateral estilo Obsidian: Muro de texto continuo y controles
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import { Mic, Square, LogOut, User, Folder, X, Radio } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function LeftPanel({
  t,
  recordingState,
  startRecording,
  stopRecording,
  transcription,
  interimTranscript,
  aiState,
  canvasRef,
  user,
  onToggleMyMaps,
  onToggleSidebar,
}) {
  const isRecording = recordingState === 'recording';
  const textEndRef = useRef(null);

  // Auto-scroll al final del texto cuando hay transcripción nueva
  useEffect(() => {
    if (textEndRef.current) {
      textEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcription, interimTranscript]);

  return (
    <aside
      className="w-[380px] max-w-[90vw] h-full flex flex-col border-r border-slate-800 shadow-2xl z-50 bg-slate-950"
    >
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between shrink-0 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AudioMap IA</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Obsidian Live Mode</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => signOut(auth)}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          )}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-slate-200"
            onClick={onToggleSidebar}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Usuario y Mis Mapas ────────────────────────────────── */}
      {user && (
        <div className="p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
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
              </div>
            </div>
            <button
              onClick={onToggleMyMaps}
              className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-2"
              title="Mis Mapas"
            >
              <Folder size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Visualizador de Onda ─────────────────────────────────── */}
      <div className="relative h-20 w-full shrink-0 border-b border-slate-800 bg-slate-900 overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={380} height={80} />
        {isRecording && (
          <div className="absolute top-2 left-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">LIVE</span>
          </div>
        )}
        {aiState === 'classifying' && (
          <div className="absolute top-2 right-3 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Procesando Nodos...</span>
            <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* ── Muro de Texto (Obsidian Style) ───────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 scroll-smooth font-mono text-sm leading-relaxed">
        {transcription === '' && interimTranscript === '' ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-4">
            <Radio size={32} className="opacity-20" />
            <p>Presiona el micrófono y empieza a hablar. Tu texto aparecerá aquí en tiempo real y el mapa crecerá solo.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-300">
              {transcription}
              <span className="text-slate-500 italic ml-1">{interimTranscript}</span>
              {isRecording && <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse" />}
            </p>
            <div ref={textEndRef} />
          </div>
        )}
      </div>

      {/* ── Controles ────────────────────────────────────────────── */}
      <div className="p-6 shrink-0 bg-slate-900/80 border-t border-slate-800 flex flex-col items-center gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`
            group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-xl
            ${isRecording 
              ? 'bg-red-500/10 text-red-400 border-2 border-red-500/50 hover:bg-red-500/20 shadow-red-500/20' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 shadow-indigo-600/30'
            }
          `}
        >
          {isRecording ? <Square size={24} className="fill-current" /> : <Mic size={26} />}
          
          {/* Anillos de radar */}
          {!isRecording && (
            <div className="absolute inset-0 rounded-full border border-indigo-400 opacity-0 group-hover:animate-ping" />
          )}
        </button>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          {isRecording ? 'Detener Sesión' : 'Iniciar Flujo'}
        </p>
      </div>

    </aside>
  );
}
