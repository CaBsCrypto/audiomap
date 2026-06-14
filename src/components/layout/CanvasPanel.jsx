// ══════════════════════════════════════════════════════════════════
// COMPONENTE: CanvasPanel — ENJAMBRE 3: Frontend
// Panel derecho: SVG interactivo + toolbar flotante + export menu
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import MindMapSVG from '../mindmap/MindMapSVG';
import Toolbar    from '../ui/Toolbar';
import ExportMenu from '../ui/ExportMenu';
import { useI18n } from '../../hooks/useI18n';
import { Menu } from 'lucide-react';

export default function CanvasPanel({
  svgRef,
  nodes,
  activeNodeId,
  editingNodeId,
  setEditingNodeId,
  isDragging,
  saveState,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  updateLabel,
  onCreateNode,
  onDeleteNode,
  onReset,
  onShare,
  onOpenSidebar,
  undo,
  redo,
  canUndo,
  canRedo,
}) {
  const { t } = useI18n();

  return (
    <main
      className="flex-1 h-full relative overflow-hidden"
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* ── Barra superior flotante ──────────────────────────────── */}
      <div className="absolute top-5 right-5 flex items-center gap-3 z-10">
        <ExportMenu svgRef={svgRef} nodes={nodes} onShare={onShare} />
      </div>

      {/* ── Botones Superior Izquierda ───────────────────────────── */}
      <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
        {/* Botón menú móvil */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <Menu size={16} />
        </button>

        {/* Contador de nodos */}
        <div
          className="px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-500 font-mono hidden sm:block"
          style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)' }}
        >
          {nodes.length} nodos · {nodes.filter(n => !n.isMain).length} ramas
        </div>
      </div>

      {/* ── Canvas SVG principal ─────────────────────────────────── */}
      <MindMapSVG
        svgRef={svgRef}
        nodes={nodes}
        activeNodeId={activeNodeId}
        editingNodeId={editingNodeId}
        setEditingNodeId={setEditingNodeId}
        handlePointerDown={handlePointerDown}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
        updateLabel={updateLabel}
      />

      {/* ── Toolbar flotante inferior ────────────────────────────── */}
      <Toolbar
        activeNodeId={activeNodeId}
        nodes={nodes}
        onCreateNode={onCreateNode}
        onDeleteNode={onDeleteNode}
        onReset={onReset}
        saveState={saveState}
        t={t}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* ── Hint footer ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-4 right-5 z-10 px-3 py-1.5 rounded-lg border border-slate-800
                   text-[10px] text-slate-600 font-mono pointer-events-none"
        style={{ background: 'rgba(2,6,23,0.8)' }}
      >
        {t('canvas.hint')}
      </div>
    </main>
  );
}
