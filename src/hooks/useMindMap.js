// ══════════════════════════════════════════════════════════════════
// HOOK: useMindMap — ENJAMBRE 3: Frontend
// Estado del grafo de nodos + operaciones CRUD
// ══════════════════════════════════════════════════════════════════
import { useState, useCallback, useRef } from 'react';
import { buildNodesFromTree, VIEWBOX_SIZE, NODE_RADIUS } from '../utils/radialLayout';
import { applyRepulsion, screenToSVG } from '../utils/repulsion';

const INITIAL_NODES = [{
  id:     '1',
  label:  'Tema Central',
  x:      VIEWBOX_SIZE / 2,
  y:      VIEWBOX_SIZE / 2,
  parent: null,
  isMain: true,
  color:  '#6366f1',
  depth:  0,
}];

export function useMindMap(svgRef) {
  const [nodes,         _setNodes]        = useState(INITIAL_NODES);
  const [activeNodeId,  setActiveNodeId]  = useState('1');
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [isDragging,    setIsDragging]    = useState(false);

  // ── Historial (Undo/Redo) ──────────────────────────────────────
  const historyRef = useRef([INITIAL_NODES]);
  const historyIndexRef = useRef(0);
  const [, forceUpdate] = useState({});

  const commitHistory = useCallback((newNodes) => {
    const currentHist = historyRef.current;
    const currentIdx = historyIndexRef.current;
    
    const newHist = currentHist.slice(0, currentIdx + 1);
    newHist.push(newNodes);
    if (newHist.length > 50) newHist.shift();
    
    historyRef.current = newHist;
    historyIndexRef.current = newHist.length - 1;
    forceUpdate({});
  }, []);

  const setNodes = useCallback((valOrFn) => {
    _setNodes(valOrFn);
  }, []);

  const setNodesAndCommit = useCallback((valOrFn) => {
    const next = typeof valOrFn === 'function' ? valOrFn(nodes) : valOrFn;
    commitHistory(next);
    _setNodes(next);
  }, [nodes, commitHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      _setNodes(historyRef.current[historyIndexRef.current]);
      forceUpdate({});
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      _setNodes(historyRef.current[historyIndexRef.current]);
      forceUpdate({});
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const dragInfoRef = useRef({ nodeId: null, offsetX: 0, offsetY: 0 });

  // ── Cargar mapa desde árbol AI ─────────────────────────────────
  const loadFromTree = useCallback((tree) => {
    const newNodes = buildNodesFromTree(tree);
    setNodesAndCommit(newNodes);
    setActiveNodeId(newNodes.find(n => n.isMain)?.id || '1');
    setEditingNodeId(null);
  }, [setNodesAndCommit]);

  // ── Cargar mapa desde JSON (importación) ─────────────────────
  const loadFromJSON = useCallback((importedNodes) => {
    if (!Array.isArray(importedNodes) || importedNodes.length === 0) return;
    setNodesAndCommit(importedNodes);
    setActiveNodeId(importedNodes.find(n => n.isMain)?.id || importedNodes[0].id);
    setEditingNodeId(null);
  }, [setNodesAndCommit]);

  // ── Crear sub-nodo del nodo activo ────────────────────────────
  const createNode = useCallback(() => {
    const parent = nodes.find(n => n.id === activeNodeId);
    if (!parent) return;

    const angle    = Math.random() * Math.PI * 2;
    const distance = 150;
    const newNode  = {
      id:     `node-${Date.now()}`,
      label:  'Nuevo Concepto',
      x:      Math.max(NODE_RADIUS * 2, Math.min(VIEWBOX_SIZE - NODE_RADIUS * 2, parent.x + distance * Math.cos(angle))),
      y:      Math.max(NODE_RADIUS * 2, Math.min(VIEWBOX_SIZE - NODE_RADIUS * 2, parent.y + distance * Math.sin(angle))),
      parent: parent.id,
      isMain: false,
      color:  '#818cf8',
      depth:  (parent.depth || 0) + 1,
    };

    setNodesAndCommit(prev => [...prev, newNode]);
    setActiveNodeId(newNode.id);
  }, [nodes, activeNodeId, setNodesAndCommit]);

  // ── Eliminar nodo activo (y sus hijos recursivamente) ─────────
  const deleteNode = useCallback(() => {
    const nodeToDelete = nodes.find(n => n.id === activeNodeId);
    if (!nodeToDelete || nodeToDelete.isMain) return; // Protección raíz

    const collectDescendants = (id, visited = new Set()) => {
      if (visited.has(id)) return [];
      visited.add(id);
      const directChildren = nodes.filter(n => n.parent === id).map(n => n.id);
      return directChildren.reduce((acc, childId) => {
        return [...acc, childId, ...collectDescendants(childId, visited)];
      }, []);
    };

    const toDelete = new Set([activeNodeId, ...collectDescendants(activeNodeId)]);
    setNodesAndCommit(prev => prev.filter(n => !toDelete.has(n.id)));
    setActiveNodeId('1');
  }, [nodes, activeNodeId, setNodesAndCommit]);

  // ── Actualizar etiqueta de nodo ───────────────────────────────
  const updateLabel = useCallback((id, newLabel) => {
    setNodesAndCommit(prev => prev.map(n => n.id === id ? { ...n, label: newLabel } : n));
  }, [setNodesAndCommit]);

  // ── Reset completo del mapa ───────────────────────────────────
  const resetMap = useCallback(() => {
    setNodesAndCommit(INITIAL_NODES);
    setActiveNodeId('1');
    setEditingNodeId(null);
  }, [setNodesAndCommit]);

  // ── Drag & Drop ───────────────────────────────────────────────
  const handlePointerDown = useCallback((e, node) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;

    const { x, y } = screenToSVG(e.clientX, e.clientY, svg);
    dragInfoRef.current = { nodeId: node.id, offsetX: x - node.x, offsetY: y - node.y };
    setIsDragging(true);
    setActiveNodeId(node.id);
  }, [svgRef]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging || !dragInfoRef.current.nodeId) return;
    const svg = svgRef.current;
    if (!svg) return;

    const { x: rawX, y: rawY } = screenToSVG(e.clientX, e.clientY, svg);
    const targetX = Math.max(NODE_RADIUS * 2, Math.min(VIEWBOX_SIZE - NODE_RADIUS * 2, rawX - dragInfoRef.current.offsetX));
    const targetY = Math.max(NODE_RADIUS * 2, Math.min(VIEWBOX_SIZE - NODE_RADIUS * 2, rawY - dragInfoRef.current.offsetY));

    setNodes(prev => applyRepulsion(prev, dragInfoRef.current.nodeId, targetX, targetY));
  }, [isDragging, svgRef]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setNodesAndCommit(prev => prev); // Commit final drag state
    }
    setIsDragging(false);
    dragInfoRef.current.nodeId = null;
  }, [isDragging, setNodesAndCommit]);

  return {
    nodes,
    setNodes,
    setNodesAndCommit,
    activeNodeId,
    setActiveNodeId,
    editingNodeId,
    setEditingNodeId,
    isDragging,
    loadFromTree,
    loadFromJSON,
    createNode,
    deleteNode,
    updateLabel,
    resetMap,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
