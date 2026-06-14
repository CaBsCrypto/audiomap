// ══════════════════════════════════════════════════════════════════
// COMPONENTE: Toolbar — ENJAMBRE 1: Diseño
// Barra flotante de operaciones del canvas (añadir/eliminar nodo)
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { Plus, Trash2, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

function TooltipBtn({ id, onClick, disabled, children, tooltip, danger = false }) {
  return (
    <div className="tooltip-wrapper">
      <button
        id={id}
        onClick={onClick}
        disabled={disabled}
        className={`${danger ? 'btn-danger' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} btn-icon disabled:opacity-50 disabled:pointer-events-none disabled:grayscale`}
        aria-label={tooltip}
      >
        {children}
      </button>
      <span className="tooltip-content">{tooltip}</span>
    </div>
  );
}

export default function Toolbar({ 
  activeNodeId, nodes, onCreateNode, onDeleteNode, onReset, saveState, t,
  undo, redo, canUndo, canRedo 
}) {
  const activeNode   = nodes.find(n => n.id === activeNodeId);
  const isRootActive = activeNode?.isMain;

  const saveLabel = saveState === 'saving' ? (t?.('canvas.saving') || 'Guardando...') :
                    saveState === 'saved'  ? (t?.('canvas.saved')  || 'Guardado ✓') : null;

  return (
    <div
      className="absolute bottom-6 left-6 flex items-center gap-2 z-10 animate-fade-up"
      style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '8px',
      }}
    >
      <TooltipBtn
        id="btn-add-node"
        onClick={onCreateNode}
        tooltip={t?.('canvas.addNode') || 'Añadir Sub-concepto'}
      >
        <Plus size={18} />
      </TooltipBtn>

      <TooltipBtn
        id="btn-delete-node"
        onClick={onDeleteNode}
        disabled={isRootActive}
        tooltip={t?.('canvas.deleteNode') || 'Eliminar nodo activo'}
        danger
      >
        <Trash2 size={18} />
      </TooltipBtn>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <TooltipBtn
        id="btn-undo"
        onClick={undo}
        disabled={!canUndo}
        tooltip="Deshacer (Ctrl+Z)"
      >
        <Undo2 size={16} />
      </TooltipBtn>

      <TooltipBtn
        id="btn-redo"
        onClick={redo}
        disabled={!canRedo}
        tooltip="Rehacer (Ctrl+Y)"
      >
        <Redo2 size={16} />
      </TooltipBtn>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <TooltipBtn
        id="btn-reset-map"
        onClick={onReset}
        tooltip="Reiniciar mapa"
        danger
      >
        <RotateCcw size={16} />
      </TooltipBtn>

      {saveLabel && (
        <span className="text-xs text-slate-400 pl-2 font-mono pr-1">
          {saveLabel}
        </span>
      )}
    </div>
  );
}
