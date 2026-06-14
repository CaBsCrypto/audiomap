// ══════════════════════════════════════════════════════════════════
// App.jsx — AGENTE LÍDER: Orquestación y Fusión
// Integra todos los enjambres: Auth + Audio + AI + MindMap + Firestore
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

// ── Leer parámetros de URL (share link) ───────────────────────────
function getShareId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('share');
}

export default function App() {
  const { t } = useI18n();

  // ── Estado de autenticación ───────────────────────────────────
  const [user,        setUser]        = useState(undefined); // undefined = cargando
  const [authLoading, setAuthLoading] = useState(true);

  // ── Refs de UI ────────────────────────────────────────────────
  const canvasRef = useRef(null);
  const svgRef    = useRef(null);

  // ── Estado de UI Auxiliar ─────────────────────────────────────
  const [showMyMaps, setShowMyMaps] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Hooks de enjambres ────────────────────────────────────────
  const {
    recordingState, setRecordingState,
    audioURL, audioBlob,
    hardwareError,
    startRecording, stopRecording,
  } = useAudioRecorder(canvasRef);

  const {
    aiState, transcription, aiError, retryInfo,
    processAudio, resetAI,
  } = useAIProcessor();

  const {
    nodes, setNodes,
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

  // ── Observador de autenticación Firebase ─────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Carga del mapa compartido desde URL ───────────────────────
  useEffect(() => {
    const shareId = getShareId();
    if (shareId) {
      loadSharedMap(shareId).then(importedNodes => {
        if (importedNodes) loadFromJSON(importedNodes);
      });
    }
  }, [loadSharedMap, loadFromJSON]);

  // ── Autoguardado en tiempo real cuando cambian los nodos ──────
  useEffect(() => {
    if (user && nodes.length > 0) {
      autoSave(nodes);
    }
  }, [nodes, user, autoSave]);

  // ── Pipeline principal: Grabación → IA → Mapa ─────────────────
  const handleStopRecording = async () => {
    const blob = await stopRecording();
    setRecordingState('processing');

    try {
      const tree = await processAudio(blob, t('app.tagline').includes('AI') ? 'en' : 'es');
      loadFromTree(tree);
    } catch (err) {
      console.error('[App] Error en pipeline IA:', err);
    } finally {
      setRecordingState('idle');
    }
  };

  // ── Handler de share link ─────────────────────────────────────
  const handleShare = async () => {
    const url = await generateShareLink(nodes);
    if (url) {
      await navigator.clipboard.writeText(url);
      alert(t('canvas.shareSuccess'));
    }
  };

  // ── Pantalla de carga ─────────────────────────────────────────
  if (authLoading) {
    return (
      <div
        className="flex items-center justify-center w-screen h-screen"
        style={{ backgroundColor: '#020617' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Inicializando AudioMap IA...</p>
        </div>
      </div>
    );
  }

  // ── Pantalla de login ─────────────────────────────────────────
  if (!user) {
    return (
      <LoginScreen 
        onGuestLogin={() => setUser({ uid: 'guest_local', displayName: 'Invitado', email: 'invitado@local' })} 
      />
    );
  }

  // ── Aplicación principal ──────────────────────────────────────
  return (
    <div
      className="flex w-screen h-screen overflow-hidden font-sans select-none relative"
      style={{ backgroundColor: '#020617' }}
    >
      <LeftPanel
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        user={user}
        canvasRef={canvasRef}
        recordingState={recordingState}
        audioURL={audioURL}
        hardwareError={hardwareError}
        aiState={aiState}
        retryInfo={retryInfo}
        transcription={transcription}
        onStartRecording={startRecording}
        onStopRecording={handleStopRecording}
        onOpenMyMaps={() => setShowMyMaps(true)}
      />

      {showMyMaps && (
        <MyMapsList 
          onClose={() => setShowMyMaps(false)}
          listMaps={listMaps}
          loadMap={loadMap}
          deleteMap={deleteMap}
          currentMapId={currentMapId}
          loadFromJSON={loadFromJSON}
        />
      )}

      <CanvasPanel
        svgRef={svgRef}
        nodes={nodes}
        activeNodeId={activeNodeId}
        editingNodeId={editingNodeId}
        setEditingNodeId={setEditingNodeId}
        isDragging={isDragging}
        saveState={saveState}
        handlePointerDown={handlePointerDown}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
        updateLabel={updateLabel}
        onCreateNode={createNode}
        onDeleteNode={deleteNode}
        onReset={resetMap}
        onShare={handleShare}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}
