// ══════════════════════════════════════════════════════════════════
// COMPONENTE: ExportMenu — ENJAMBRE 3: Frontend
// Dropdown de exportación: SVG, PNG, Markdown, JSON, Share
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileImage, FileText, Share2, Code2, Copy } from 'lucide-react';
import { exportSVG, exportPNG, exportJSON, buildMarkdown } from '../../utils/exporters';
import { useI18n } from '../../hooks/useI18n';

export default function ExportMenu({ svgRef, nodes, onShare }) {
  const { t } = useI18n();
  const [open,    setOpen]    = useState(false);
  const [copied,  setCopied]  = useState(false);
  const menuRef = useRef(null);

  // Cierre al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopyMarkdown = async () => {
    const md = buildMarkdown(nodes);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const handleShare = async () => {
    setOpen(false);
    await onShare?.();
  };

  const menuItems = [
    {
      id: 'export-svg',
      icon: <Code2 size={14} />,
      label: t('canvas.exportSVG'),
      action: () => { exportSVG(svgRef); setOpen(false); },
    },
    {
      id: 'export-png',
      icon: <FileImage size={14} />,
      label: t('canvas.exportPNG'),
      action: () => { exportPNG(svgRef); setOpen(false); },
    },
    {
      id: 'copy-markdown',
      icon: <Copy size={14} />,
      label: copied ? '¡Copiado!' : t('canvas.copyMarkdown'),
      action: handleCopyMarkdown,
    },
    {
      id: 'download-json',
      icon: <FileText size={14} />,
      label: t('canvas.downloadJSON'),
      action: () => { exportJSON(nodes); setOpen(false); },
    },
    {
      id: 'share-link',
      icon: <Share2 size={14} />,
      label: t('canvas.shareLink'),
      action: handleShare,
      divider: true,
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        id="btn-export-menu"
        onClick={() => setOpen(o => !o)}
        className="btn-secondary"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download size={14} />
        <span>Exportar</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-52 rounded-xl border border-slate-800
                     shadow-2xl z-50 overflow-hidden animate-fade-up"
          style={{ background: '#0f172a', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
        >
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {item.divider && <div className="h-px bg-slate-800 mx-2" />}
              <button
                id={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium
                           text-slate-300 hover:bg-slate-800 hover:text-slate-100
                           transition-colors duration-100 text-left"
              >
                <span className="text-slate-500">{item.icon}</span>
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
