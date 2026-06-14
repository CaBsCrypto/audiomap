// ══════════════════════════════════════════════════════════════════
// UTILS — Sistema de Fuerzas Repulsivas Euclidianas
// ENJAMBRE 3: QA — Mitigación de solapamiento de nodos
// ══════════════════════════════════════════════════════════════════
import { REPULSION_FORCE, VIEWBOX_SIZE, NODE_RADIUS } from './radialLayout';

const DAMPING = 0.2;

/**
 * Aplica fuerzas repulsivas entre el nodo en movimiento y el resto.
 * @param {Array}  nodes       - Array completo de nodos
 * @param {string} movingId    - ID del nodo siendo arrastrado
 * @param {number} targetX     - Nueva X del nodo en movimiento
 * @param {number} targetY     - Nueva Y del nodo en movimiento
 * @returns {Array} - Nuevo array de nodos con posiciones ajustadas
 */
export function applyRepulsion(nodes, movingId, targetX, targetY) {
  return nodes.map(node => {
    if (node.id === movingId) {
      return { ...node, x: targetX, y: targetY };
    }

    const dx = node.x - targetX;
    const dy = node.y - targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < REPULSION_FORCE && distance > 0) {
      const force = (REPULSION_FORCE - distance) / distance;
      const newX = clamp(node.x + dx * force * DAMPING, NODE_RADIUS * 2, VIEWBOX_SIZE - NODE_RADIUS * 2);
      const newY = clamp(node.y + dy * force * DAMPING, NODE_RADIUS * 2, VIEWBOX_SIZE - NODE_RADIUS * 2);
      return { ...node, x: newX, y: newY };
    }

    return node;
  });
}

/**
 * Convierte coordenadas de pantalla a coordenadas SVG usando matriz nativa.
 */
export function screenToSVG(clientX, clientY, svgElement) {
  const pt = svgElement.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const cursorPt = pt.matrixTransform(svgElement.getScreenCTM().inverse());
  return { x: cursorPt.x, y: cursorPt.y };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
