// ══════════════════════════════════════════════════════════════════
// App.jsx — AGENTE LÍDER: Orquestación y Fusión (Flujo Continuo)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { useI18n }          from './hooks/useI18n';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useAIProcessor }   from './hooks/useAIProcessor';
import { useMindMap }       from './hooks/useMindMap';
import { useFirestore }     from './hooks/useFirestore';
import LoginScreen          from './components/auth/LoginScreen';
import LeftPanel            from './components/layout/LeftPanel';
import CanvasPanel          from './components/layout/CanvasPanel';
import MyMapsList           from './components/layout/MyMapsList';

function getShareId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('share');
}

export default function App() {
  const { t } = useI18n();

  const [user, setUser] = useState(undefined); 
  const [authLoading, setAuthLoading] = useState(true);

  const canvasRef = useRef(null);
  const svgRef    = useRef(null);

  const [showMyMaps, setShowMyMaps] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Hooks de enjambres ────────────────────────────────────────
  const {
    recordingState, setRecordingState,
    transcription, interimTranscript, hardwareError,
    startRecording, stopRecording,
  } = useAudioRecorder(canvasRef);

  const {
    aiState, aiError,
    processChunk, resetAI,
  } = useAIProcessor();

  const {
    nodes, setNodes, setNodesAndCommit,
    activeNodeId, setActiveNodeId,
    editingNodeId, setEditingNodeId,
    isDragging,
    loadFromTree, loadFromJSON,
    createNode, deleteNode, updateLabel, resetMap,
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, redo, canUndo, canRedo,
  } = useMindMap(svgRef);

  const {
    saveState, currentMapId, setCurrentMapId,
    autoSave, loadMap, loadSharedMap, generateShareLink,
  } = useFirestore(user?.uid);

  // ── Auto-guardado en segundo plano ─────────────────────────────
  useEffect(() => {
    if (nodes.length > 0) {
      autoSave(nodes);
    }
  }, [nodes, autoSave]);

  // ── Observador de autenticación ──────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Bucle Principal: Inyección en vivo al Mapa ───────────────
  const lastProcessedLenRef = useRef(0);
  const rootNodeIdRef = useRef(null);

  // Cuando arranca a grabar, crea un nodo raíz si el mapa está vacío
  useEffect(() => {
    if (recordingState === 'recording' && nodes.length === 0) {
      const rootId = `root-${Date.now()}`;
      rootNodeIdRef.current = rootId;
      setNodes([{
        id: rootId,
        label: `Sesión del ${new Date().toLocaleDateString()}`,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        parentId: null,
      }]);
    }
  }, [recordingState, nodes.length, setNodes]);

  // Vigila la transcripción en vivo y procesa fragmentos
  useEffect(() => {
    const currentLen = transcription.length;
    const lastLen = lastProcessedLenRef.current;
    
    // Si ha crecido al menos unos ~100 caracteres o termina en un punto
    const newText = transcription.substring(lastLen);
    
    if (newText.length > 80 || (newText.length > 20 && newText.match(/[.!?]$/))) {
      lastProcessedLenRef.current = currentLen;
      
      const locale = t('app.tagline').includes('AI') ? 'en' : 'es';
      
      processChunk(newText, locale).then(newNodes => {
        if (newNodes && newNodes.length > 0) {
          setNodesAndCommit(prevNodes => {
            const updated = [...prevNodes];
            const rootId = rootNodeIdRef.current || prevNodes[0]?.id;
            const rootNode = prevNodes.find(n => n.id === rootId);
            const centerX = rootNode ? rootNode.x : window.innerWidth / 2;
            const centerY = rootNode ? rootNode.y : window.innerHeight / 2;

            // Inyectar en abanico
            newNodes.forEach((n, i) => {
              const angle = Math.random() * Math.PI * 2;
              const radius = 250 + Math.random() * 100;
              const id = `node-${Date.now()}-${i}`;
              updated.push({
                id,
                label: n.label,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                parentId: rootId,
              });
            });
            return updated;
          });
        }
      });
    }
  }, [transcription, processChunk, t, setNodes]);

  const handleStopRecording = async () => {
    await stopRecording();
    setRecordingState('idle');
    lastProcessedLenRef.current = 0; // Reset para próxima vez
  };

  const handleShare = async () => {
    const url = await generateShareLink(nodes);
    if (url) {
      await navigator.clipboard.writeText(url);
      alert(t('canvas.shareSuccess'));
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen" style={{ backgroundColor: '#020617' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Inicializando AudioMap IA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onGuestLogin={() => setUser({ uid: 'guest_local', displayName: 'Invitado', email: 'invitado@local' })} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden text-slate-200" style={{ backgroundColor: '#020617' }}>
      
      {/* ── Lienzo del Mapa Mental (Fondo) ── */}
      <CanvasPanel
        nodes={nodes}
        activeNodeId={activeNodeId}
        editingNodeId={editingNodeId}
        svgRef={svgRef}
        handlePointerDown={handlePointerDown}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
        setActiveNodeId={setActiveNodeId}
        setEditingNodeId={setEditingNodeId}
        updateLabel={updateLabel}
      />

      {/* ── Capa Superior: UI (Panel Obsdian y Controles) ── */}
      <div className="pointer-events-none absolute inset-0 flex">
        {/* Panel Izquierdo: Text Wall */}
        <div className={`pointer-events-auto transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative z-20`}>
          <LeftPanel
            t={t}
            recordingState={recordingState}
            startRecording={startRecording}
            stopRecording={handleStopRecording}
            transcription={transcription}
            interimTranscript={interimTranscript}
            aiState={aiState}
            canvasRef={canvasRef}
            user={user}
            onToggleMyMaps={() => setShowMyMaps(true)}
            onToggleSidebar={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Barra superior móvil */}
        <div className="md:hidden absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-10">
          <button 
            className="pointer-events-auto p-2 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        {/* Menú de Acciones Inferior */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl pointer-events-auto z-10">
          <button 
            onClick={resetMap}
            className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-xl transition-colors"
            title={t('canvas.reset')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <div className="w-px h-8 bg-slate-700/50 mx-1" />

          <button 
            onClick={undo} disabled={!canUndo}
            className="p-3 text-slate-400 hover:text-white disabled:opacity-30 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button 
            onClick={redo} disabled={!canRedo}
            className="p-3 text-slate-400 hover:text-white disabled:opacity-30 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>

          <div className="w-px h-8 bg-slate-700/50 mx-1" />

          <button 
            onClick={handleShare}
            className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Modal: Mis Mapas ── */}
      {showMyMaps && (
        <MyMapsList
          uid={user?.uid}
          onClose={() => setShowMyMaps(false)}
          onLoad={(nodes) => { loadFromJSON(nodes); setShowMyMaps(false); }}
        />
      )}
    </div>
  );
}
