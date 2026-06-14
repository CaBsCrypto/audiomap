// ══════════════════════════════════════════════════════════════════
// COMPONENTE: EdgePath — ENJAMBRE 3: Frontend / SVG
// Renderiza las curvas Bézier cúbicas entre nodos
// ══════════════════════════════════════════════════════════════════
import React from 'react';

export default function EdgePath({ node, parentNode, isActive }) {
  if (!parentNode) return null;

  // Puntos de control cúbicos verticales
  const midY1 = parentNode.y + (node.y - parentNode.y) * 0.45;
  const midY2 = node.y       - (node.y - parentNode.y) * 0.45;
  const d = `M ${parentNode.x} ${parentNode.y} C ${parentNode.x} ${midY1}, ${node.x} ${midY2}, ${node.x} ${node.y}`;

  return (
    <path
      key={`edge-${node.id}`}
      d={d}
      fill="none"
      stroke={isActive ? node.color : '#334155'}
      strokeWidth={isActive ? 2.5 : 1.5}
      strokeLinecap="round"
      opacity={isActive ? 0.9 : 0.5}
      className="transition-all duration-200"
    />
  );
}
