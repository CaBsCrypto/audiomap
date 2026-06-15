// ══════════════════════════════════════════════════════════════════
// COMPONENTE: NodeGroup — ENJAMBRE 3: Frontend / SVG
// Nodo individual SVG con resplandor, editor inline y drag
// ══════════════════════════════════════════════════════════════════
import React from 'react';
import { NODE_RADIUS } from '../../utils/radialLayout';

const LABEL_WIDTH   = 180;
const LABEL_HEIGHT  = 68;
const LABEL_OFFSET_Y = NODE_RADIUS + 10;

export default function NodeGroup({
  node,
  isActive,
  isEditing,
  onPointerDown,
  onDoubleClick,
  onLabelChange,
  onLabelBlur,
  onLabelKeyDown,
  onNavigateToLinkedMap,
}) {
  const strokeColor = isActive ? '#818cf8' : '#475569';
  const strokeWidth = node.isMain ? 3 : 2;

  return (
    <g
      id={`node-${node.id}`}
      transform={`translate(${node.x}, ${node.y})`}
      onPointerDown={(e) => onPointerDown(e, node)}
      style={{ cursor: 'grab' }}
    >
      {/* Halo exterior de selección animado */}
      {isActive && (
        <circle
          r={NODE_RADIUS + 8}
          fill="none"
          stroke={node.color}
          strokeWidth={1.5}
          opacity={0.5}
          className="animate-pulse"
        />
      )}

      {/* Círculo principal del nodo */}
      <circle
        r={NODE_RADIUS}
        fill="#0f172a"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        style={{
          filter: isActive ? `drop-shadow(0 0 8px ${node.color}80)` : 'none',
          transition: 'filter 0.2s ease',
        }}
      />

      {/* Punto de color jerárquico */}
      <circle r={node.isMain ? 10 : 7} fill={node.color} opacity={0.9} />

      {/* Icono de Portal/Enlace si tiene linkedMapId */}
      {node.linkedMapId && (
        <g
          transform={`translate(${NODE_RADIUS - 3}, ${-NODE_RADIUS + 3})`}
          style={{ cursor: 'pointer' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (onNavigateToLinkedMap) {
              onNavigateToLinkedMap(node.linkedMapId);
            }
          }}
        >
          <circle r={8} fill="#10b981" stroke="#0f172a" strokeWidth={1.5} />
          <path d="M-2 -2 H2 V2 M2 -2 L-2 2" stroke="white" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      )}

      {/* Indicador de nodo raíz */}
      {node.isMain && (
        <circle
          r={NODE_RADIUS - 4}
          fill="none"
          stroke={node.color}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.4}
        />
      )}

      {/* Etiqueta de texto */}
      <foreignObject
        x={-LABEL_WIDTH / 2}
        y={LABEL_OFFSET_Y}
        width={LABEL_WIDTH}
        height={LABEL_HEIGHT}
        className="pointer-events-none select-none overflow-visible"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
        >
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={node.label}
              onChange={(e) => onLabelChange(node.id, e.target.value)}
              onBlur={onLabelBlur}
              onKeyDown={onLabelKeyDown}
              style={{
                pointerEvents: 'all',
                width: '100%',
                background: '#0f172a',
                border: '1px solid #6366f1',
                borderRadius: '6px',
                color: '#e0e7ff',
                fontSize: '11px',
                padding: '3px 6px',
                textAlign: 'center',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          ) : (
            <p
              onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node.id); }}
              style={{
                pointerEvents: 'all',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#a5b4fc' : '#cbd5e1',
                textAlign: 'center',
                maxHeight: `${LABEL_HEIGHT}px`,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4',
                padding: '2px 4px',
                borderRadius: '4px',
                cursor: 'pointer',
                userSelect: 'none',
                background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                transition: 'color 0.15s, background 0.15s',
                wordBreak: 'break-word',
              }}
            >
              {node.label}
            </p>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
