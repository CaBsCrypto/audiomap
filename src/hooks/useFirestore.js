// ══════════════════════════════════════════════════════════════════
// HOOK: useFirestore — ENJAMBRE 2: Base de Datos
// Autoguardado con debounce + carga + share link
// Reglas de Oro: sin queries complejos, rutas estrictas
// ══════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc, setDoc, getDoc, collection, getDocs, deleteDoc
} from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

const DEBOUNCE_MS = 1500;

/**
 * Ruta de datos privados del usuario:
 * /artifacts/{appId}/users/{userId}/maps/{mapId}
 */
function mapDocRef(userId, mapId) {
  return doc(db, 'artifacts', APP_ID, 'users', userId, 'maps', mapId);
}

/**
 * Ruta de enlace público compartido:
 * /artifacts/{appId}/public/data/shares/{shareId}
 */
function shareDocRef(shareId) {
  return doc(db, 'artifacts', APP_ID, 'public', 'data', 'shares', shareId);
}

export function useFirestore(userId) {
  const [saveState,   setSaveState]   = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [currentMapId, setCurrentMapId] = useState(() => `map-${Date.now()}`);
  const debounceTimer = useRef(null);

  // ── Autoguardado con debounce ──────────────────────────────────
  const autoSave = useCallback((nodes) => {
    if (!userId || userId === 'guest_local' || !nodes || nodes.length === 0) return;

    clearTimeout(debounceTimer.current);
    setSaveState('saving');

    debounceTimer.current = setTimeout(async () => {
      try {
        const docRef = mapDocRef(userId, currentMapId);
        // Sin orderBy/limit/where — guardado simple de documento
        await setDoc(docRef, {
          nodes,
          updatedAt: new Date().toISOString(),
          mapId: currentMapId,
          userId,
        }, { merge: true });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch (err) {
        console.error('[Firestore] Error al guardar:', err);
        setSaveState('error');
      }
    }, DEBOUNCE_MS);
  }, [userId, currentMapId]);

  // ── Carga de mapa por ID ───────────────────────────────────────
  const loadMap = useCallback(async (mapId) => {
    if (!userId || userId === 'guest_local') return null;
    try {
      const snap = await getDoc(mapDocRef(userId, mapId));
      if (snap.exists()) {
        setCurrentMapId(mapId);
        return snap.data().nodes || null;
      }
      return null;
    } catch (err) {
      console.error('[Firestore] Error al cargar mapa:', err);
      return null;
    }
  }, [userId]);

  // ── Lista de mapas del usuario ─────────────────────────────────
  // Descarga toda la colección y procesa en memoria JS (Regla de Oro)
  const listMaps = useCallback(async () => {
    if (!userId || userId === 'guest_local') return [];
    try {
      const colRef = collection(db, 'artifacts', APP_ID, 'users', userId, 'maps');
      const snapshot = await getDocs(colRef); // Sin orderBy — orden en cliente
      const maps = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      // Ordenar en memoria por fecha de actualización
      return maps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (err) {
      console.error('[Firestore] Error al listar mapas:', err);
      return [];
    }
  }, [userId]);

  // ── Crear enlace público de solo lectura ───────────────────────
  const generateShareLink = useCallback(async (nodes) => {
    if (!userId || userId === 'guest_local') return null;
    try {
      const shareId = `share-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await setDoc(shareDocRef(shareId), {
        nodes,
        createdAt: new Date().toISOString(),
        createdBy: userId,
      });
      return `${window.location.origin}/?share=${shareId}`;
    } catch (err) {
      console.error('[Firestore] Error al crear share:', err);
      return null;
    }
  }, [userId]);

  // ── Leer mapa compartido (sin auth requerida para lectura pública) ──
  const loadSharedMap = useCallback(async (shareId) => {
    try {
      const snap = await getDoc(shareDocRef(shareId));
      if (snap.exists()) return snap.data().nodes || null;
      return null;
    } catch (err) {
      console.error('[Firestore] Error al cargar mapa compartido:', err);
      return null;
    }
  }, []);

  // ── Eliminar mapa ─────────────────────────────────────────────
  const deleteMap = useCallback(async (mapId) => {
    if (!userId || userId === 'guest_local') return;
    try {
      await deleteDoc(mapDocRef(userId, mapId));
    } catch (err) {
      console.error('[Firestore] Error al eliminar mapa:', err);
    }
  }, [userId]);

  // Limpiar debounce al desmontar
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  return {
    saveState,
    currentMapId,
    setCurrentMapId,
    autoSave,
    loadMap,
    listMaps,
    generateShareLink,
    loadSharedMap,
    deleteMap,
  };
}
