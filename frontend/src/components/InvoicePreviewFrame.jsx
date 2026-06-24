import { useEffect, useRef, useState } from 'react';
import { INVOICE_WIDTH_PX } from '@/utils/pdfGenerator';

/**
 * Renders invoice at full A4 width, scaling down only when the viewport is
 * narrower. Shows zoom %, page chrome, and a scrollable paper background.
 */
export default function InvoicePreviewFrame({ children, className = '' }) {
  const viewportRef = useRef(null);
  const contentRef  = useRef(null);
  const [scale,        setScale]       = useState(1);
  const [scaledHeight, setScaledHeight] = useState(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content  = contentRef.current;
    if (!viewport || !content) return;

    const update = () => {
      const availW = viewport.clientWidth - 32; // 16px each side gutter
      const s      = availW > 0 ? Math.min(1, availW / INVOICE_WIDTH_PX) : 1;
      setScale(s);
      setScaledHeight((content.offsetHeight || 0) * s);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    ro.observe(content);
    return () => ro.disconnect();
  }, [children]);

  const pct = Math.round(scale * 100);

  return (
    <div
      ref={viewportRef}
      className={`relative w-full ${className}`}
      style={{ background: '#d1d5db', minHeight: 400 }}
    >
      {/* Zoom badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          zIndex: 10,
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          fontSize: 11,
          fontFamily: 'monospace',
          padding: '2px 7px',
          borderRadius: 4,
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.04em',
        }}
      >
        {pct}%
      </div>

      {/* Paper page */}
      <div style={{ padding: '16px 16px 24px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width:     INVOICE_WIDTH_PX * scale,
            height:    scaledHeight || 'auto',
            flexShrink: 0,
            overflow:  'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)',
            background: '#fff',
            position:  'relative',
          }}
        >
          {/* Actual invoice content (unscaled, shifted) */}
          <div
            ref={contentRef}
            style={{
              width:           INVOICE_WIDTH_PX,
              transform:       `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
