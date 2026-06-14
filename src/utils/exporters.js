// ══════════════════════════════════════════════════════════════════
// UTILS — Exportadores de Formatos
// ENJAMBRE 3: Frontend — SVG, PNG, Markdown, JSON, Share
// ══════════════════════════════════════════════════════════════════
import html2canvas from 'html2canvas';

/**
 * Exporta el SVG como archivo .svg con estilos autónomos inyectados.
 */
export function exportSVG(svgRef, filename = 'audiomap.svg') {
  const svgEl = svgRef.current;
  if (!svgEl) return;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('style', 'background-color:#020617;');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const svgString = new XMLSerializer().serializeToString(clone);
  downloadBlob(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

/**
 * Exporta el SVG como imagen PNG usando html2canvas.
 */
export async function exportPNG(svgRef, filename = 'audiomap.png') {
  const svgEl = svgRef.current;
  if (!svgEl) return;
  try {
    const canvas = await html2canvas(svgEl, { backgroundColor: '#020617', scale: 2 });
    canvas.toBlob(blob => {
      if (blob) downloadBlob(blob, filename);
    }, 'image/png');
  } catch (err) {
    console.error('[Exporter] PNG export failed:', err);
    // Fallback: exportar SVG en su lugar
    exportSVG(svgRef, filename.replace('.png', '.svg'));
  }
}

/**
 * Genera la representación Markdown del mapa mental.
 */
export function buildMarkdown(nodes) {
  const root = nodes.find(n => n.isMain);
  if (!root) return '';

  const buildBranch = (parentId, depth = 0) => {
    return nodes
      .filter(n => n.parent === parentId)
      .map(n => {
        const indent = '  '.repeat(depth);
        return `${indent}- ${n.label}\n${buildBranch(n.id, depth + 1)}`;
      }).join('');
  };

  return `# ${root.label}\n${buildBranch(root.id, 0)}`;
}

/**
 * Serializa los nodos como JSON descargable.
 */
export function exportJSON(nodes, filename = 'audiomap.json') {
  const data = JSON.stringify({ version: '1.0', nodes }, null, 2);
  downloadBlob(new Blob([data], { type: 'application/json' }), filename);
}

/**
 * Importa nodos desde un archivo JSON.
 * @returns {Promise<Array>} - Array de nodos
 */
export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.nodes && Array.isArray(data.nodes)) {
          resolve(data.nodes);
        } else {
          reject(new Error('Formato JSON inválido'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── Helper interno ──────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
