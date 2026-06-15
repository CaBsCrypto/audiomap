// ══════════════════════════════════════════════════════════════════
// COMPONENTE: MindMapSVG — ENJAMBRE 3: Frontend
// Lienzo SVG interactivo con pan, zoom y drag-and-drop
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from 'react';
import EdgePath   from './EdgePath';
import NodeGroup  from './NodeGroup';
import { VIEWBOX_SIZE } from '../../utils/radialLayout';

export default function MindMapSVG({
  svgRef,
  nodes,
  activeNodeId,
  editingNodeId,
  setEditingNodeId,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  updateLabel,
  onNavigateToLinkedMap,
}) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // ── Wheel Event (Zoom) ──────────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e) => {
      e.preventDefault(); // Requiere non-passive listener
      const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
      
      setTransform(prev => {
        const newScale = Math.max(0.2, Math.min(5, prev.scale * scaleAdjust));
        // Ajustar x, y para mantener el zoom centrado
        const viewWidth = VIEWBOX_SIZE / prev.scale;
        const newViewWidth = VIEWBOX_SIZE / newScale;
        const offset = (viewWidth - newViewWidth) / 2;
        
        return {
          scale: newScale,
          x: prev.x + offset,
          y: prev.y + offset
        };
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [svgRef]);

  // ── Panning handlers ─────────────────────────────────────────────
  const onPointerDownBg = useCallback((e) => {
    setIsPanning(true);
    panStartRef.current = { 
      x: e.clientX, 
      y: e.clientY, 
      tx: transform.x, 
      ty: transform.y 
    };
  }, [transform]);

  const onPointerMoveGlobal = useCallback((e) => {
    if (isPanning) {
      // Diferencia en píxeles de pantalla, la dividimos por la escala para obtener la diferencia en SVG
      const dx = (e.clientX - panStartRef.current.x) / transform.scale;
      const dy = (e.clientY - panStartRef.current.y) / transform.scale;
      
      setTransform(prev => ({
        ...prev,
        x: panStartRef.current.tx - dx,
        y: panStartRef.current.ty - dy,
      }));
    } else {
      handlePointerMove(e);
    }
  }, [isPanning, transform.scale, handlePointerMove]);

  const onPointerUpGlobal = useCallback((e) => {
    setIsPanning(false);
    handlePointerUp(e);
  }, [handlePointerUp]);

  return (
    <svg
      ref={svgRef}
      id="mindmap-svg"
      viewBox={`${transform.x} ${transform.y} ${VIEWBOX_SIZE / transform.scale} ${VIEWBOX_SIZE / transform.scale}`}
      className={`w-full h-full block select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        backgroundColor: '#020617',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDownBg}
      onPointerMove={onPointerMoveGlobal}
      onPointerUp={onPointerUpGlobal}
      onPointerLeave={onPointerUpGlobal}
    >
      {/* ── Definiciones ──────────────────────────────────────────── */}
      <defs>
        <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#1e293b" opacity="0.8" />
        </pattern>
        <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0d1829" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>

      {/* ── Fondo (infinito relativo al viewBox) ─────────────────── */}
      <rect 
        x={transform.x - VIEWBOX_SIZE} 
        y={transform.y - VIEWBOX_SIZE} 
        width={VIEWBOX_SIZE * 3} 
        height={VIEWBOX_SIZE * 3} 
        fill="url(#bg-glow)" 
      />
      <rect 
        x={transform.x - VIEWBOX_SIZE} 
        y={transform.y - VIEWBOX_SIZE} 
        width={VIEWBOX_SIZE * 3} 
        height={VIEWBOX_SIZE * 3} 
        fill="url(#dot-grid)" 
      />

      {/* ── Enlaces ──────────────────────────────────────────────── */}
      <g id="edges-layer">
        {nodes.map(node => {
          if (!node.parent) return null;
          const parentNode = nodes.find(n => n.id === node.parent);
          return (
            <EdgePath
              key={`edge-${node.id}`}
              node={node}
              parentNode={parentNode}
              isActive={node.id === activeNodeId || node.parent === activeNodeId}
            />
          );
        })}
      </g>

      {/* ── Nodos ────────────────────────────────────────────────── */}
      <g id="nodes-layer">
        {nodes.map(node => (
          <NodeGroup
            key={node.id}
            node={node}
            isActive={node.id === activeNodeId}
            isEditing={node.id === editingNodeId}
            onPointerDown={(e, n) => {
              e.stopPropagation(); // Evita iniciar panning al arrastrar un nodo
              handlePointerDown(e, n);
            }}
            onDoubleClick={(id) => setEditingNodeId(id)}
            onLabelChange={updateLabel}
            onLabelBlur={() => setEditingNodeId(null)}
            onLabelKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingNodeId(null);
            }}
            onNavigateToLinkedMap={onNavigateToLinkedMap}
          />
        ))}
      </g>
    </svg>
  );
}
