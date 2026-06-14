// ══════════════════════════════════════════════════════════════════
// COMPONENTE: MyMapsList — ENJAMBRE 1 & 2: Diseño + DB
// Lista de mapas guardados en Firestore
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { Folder, X, Map as MapIcon, Trash2, Clock } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

export default function MyMapsList({ 
  onClose, 
  listMaps, 
  loadMap, 
  deleteMap, 
  currentMapId, 
  loadFromJSON 
}) {
  const { t, locale } = useI18n();
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    listMaps().then(data => {
      if (isMounted) {
        setMaps(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [listMaps]);

  const handleLoad = async (mapId) => {
    const loadedNodes = await loadMap(mapId);
    if (loadedNodes) {
      loadFromJSON(loadedNodes);
      onClose();
    }
  };

  const handleDelete = async (e, mapId) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este mapa?')) {
      await deleteMap(mapId);
      setMaps(prev => prev.filter(m => m.id !== mapId));
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-up bg-slate-950/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ background: '#0f172a', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Folder size={18} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-200">Mis Mapas Guardados</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : maps.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3 text-slate-500">
              <MapIcon size={32} className="opacity-50" />
              <p className="text-sm">No tienes mapas guardados aún.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {maps.map(m => {
                const isCurrent = m.id === currentMapId;
                const rootNode = m.nodes?.find(n => n.isMain);
                
                return (
                  <div
                    key={m.id}
                    onClick={() => !isCurrent && handleLoad(m.id)}
                    className={`
                      group relative flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer
                      ${isCurrent 
                        ? 'border-indigo-500/50 bg-indigo-500/10' 
                        : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                          ${isCurrent ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}
                        `}>
                          <MapIcon size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-200 truncate max-w-[200px]">
                            {rootNode ? rootNode.label : 'Mapa sin tema'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {formatDate(m.updatedAt)}
                            </span>
                            <span>{m.nodes?.length || 0} nodos</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="text-[10px] font-medium text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/20">
                            Actual
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, m.id)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar mapa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
