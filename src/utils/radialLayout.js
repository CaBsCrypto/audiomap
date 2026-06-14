// ══════════════════════════════════════════════════════════════════
// UTILS — Algoritmo de Distribución Radial
// ENJAMBRE 3: Frontend — posicionamiento automático de nodos
// ══════════════════════════════════════════════════════════════════

export const VIEWBOX_SIZE    = 1000;
export const NODE_RADIUS     = 26;
export const REPULSION_FORCE = 90;
const BASE_RADIUS = 220;

/**
 * Distribuye nodos hijos alrededor de un nodo padre en forma radial.
 * @param {object} parent  - Nodo padre { x, y }
 * @param {number} count   - Número de hijos a distribuir
 * @param {number} depth   - Profundidad del nivel (1 = primer nivel)
 * @param {number} angleOffset - Ángulo de inicio en radianes (opcional)
 * @returns {Array<{x, y}>} Posiciones calculadas
 */
export function radialPositions(parent, count, depth = 1, angleOffset = 0) {
  if (count === 0) return [];
  const radius = BASE_RADIUS * Math.max(1, depth * 0.85);
  return Array.from({ length: count }, (_, i) => {
    const angle = angleOffset + ((2 * Math.PI) / count) * i;
    return {
      x: clamp(parent.x + radius * Math.cos(angle), NODE_RADIUS * 2, VIEWBOX_SIZE - NODE_RADIUS * 2),
      y: clamp(parent.y + radius * Math.sin(angle), NODE_RADIUS * 2, VIEWBOX_SIZE - NODE_RADIUS * 2),
    };
  });
}

/**
 * Calcula las posiciones de todos los nodos de un árbol usando layout radial recursivo.
 * @param {object} tree  - { root: string, branches: [{label, children: []}] }
 * @returns {Array}       - Array de nodos con id, label, x, y, parent, color, isMain
 */
export function buildNodesFromTree(tree) {
  const palette = [
    '#6366f1', '#10b981', '#f59e0b', '#ec4899',
    '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6',
  ];

  const centerX = VIEWBOX_SIZE / 2;
  const centerY = VIEWBOX_SIZE / 2;
  const rootId  = 'root';

  const nodes = [{
    id:     rootId,
    label:  tree.root,
    x:      centerX,
    y:      centerY,
    parent: null,
    isMain: true,
    color:  '#6366f1',
    depth:  0,
  }];

  const processLevel = (branches, parentId, parentX, parentY, depth, angleOffset) => {
    const positions = radialPositions({ x: parentX, y: parentY }, branches.length, depth, angleOffset);
    branches.forEach((branch, i) => {
      const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const color = palette[i % palette.length];
      nodes.push({
        id,
        label:  branch.label,
        x:      positions[i].x,
        y:      positions[i].y,
        parent: parentId,
        isMain: false,
        color,
        depth,
      });

      // Recursión para sub-ramas
      if (branch.children && branch.children.length > 0) {
        const branchAngle = ((2 * Math.PI) / branches.length) * i + angleOffset;
        processLevel(branch.children, id, positions[i].x, positions[i].y, depth + 1, branchAngle);
      }
    });
  };

  if (tree.branches && tree.branches.length > 0) {
    processLevel(tree.branches, rootId, centerX, centerY, 1, 0);
  }

  return nodes;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
