import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';

/** A4 content width at 96 dpi — must match --invoice-width in invoice-template.css */
export const INVOICE_WIDTH_PX = 794;
const A4_WIDTH_PT  = 595.28;
const A4_HEIGHT_PT = 841.89;
/** A4 content height at 96 dpi (portrait) */
export const A4_CONTENT_HEIGHT_PX =
  INVOICE_WIDTH_PX * (A4_HEIGHT_PT / A4_WIDTH_PT); // ≈ 1123 px

const CANVAS_SCALE = 2; // 2× for crisp text

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function waitForImages(root) {
  const imgs = [...root.querySelectorAll('img')];
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) { resolve(); return; }
          img.onload  = resolve;
          img.onerror = resolve;
          if (img.src) { const s = img.src; img.src = ''; img.src = s; }
        }),
    ),
  );
}

function collectDocumentStyles() {
  return [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map((n) => n.outerHTML)
    .join('\n');
}

function copyImages(source, clone) {
  const srcList  = [...source.querySelectorAll('img')];
  const dstList  = [...clone.querySelectorAll('img')];
  srcList.forEach((src, i) => {
    const dst = dstList[i];
    if (!dst) return;
    dst.src         = src.currentSrc || src.src;
    dst.crossOrigin = 'anonymous';
  });
}

/** Burn alignment classes into inline styles so html2canvas respects them */
function fixCellAlignment(root) {
  root.querySelectorAll('td, th').forEach((cell) => {
    cell.style.boxSizing = 'border-box';
    cell.style.lineHeight = '1.4';

    // vertical
    if (cell.classList.contains('invoice-align-bottom'))
      cell.style.verticalAlign = 'bottom';
    else if (cell.classList.contains('invoice-align-top'))
      cell.style.verticalAlign = 'top';
    else
      cell.style.verticalAlign = 'middle';

    // horizontal — most-specific class wins; leave ambiguous cells alone
    if (cell.classList.contains('invoice-col-desc'))
      cell.style.textAlign = 'left';
    else if (cell.classList.contains('invoice-text-right'))
      cell.style.textAlign = 'right';
    else if (cell.classList.contains('invoice-text-left'))
      cell.style.textAlign = 'left';
    else if (
      cell.classList.contains('invoice-text-center') ||
      cell.classList.contains('invoice-head')
    )
      cell.style.textAlign = 'center';
  });
}

// ─────────────────────────────────────────────────────────────
// Canvas capture
// ─────────────────────────────────────────────────────────────

async function captureInvoiceCanvas(element) {
  /*
   * Strategy: clone the invoice element, place it at the very top-left
   * of the viewport (position:fixed, left:0, top:0) so html2canvas gets
   * getBoundingClientRect() → {left:0, top:0}.  A full-screen white
   * overlay hides the flash from the user.
   */

  // ── Overlay so user doesn't see the temporary full-size invoice ──
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99998',
    'background:#fff',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:Arial,sans-serif', 'font-size:14px', 'color:#555',
  ].join(';');
  overlay.textContent = 'Generating PDF…';
  document.body.appendChild(overlay);

  // ── Clone ────────────────────────────────────────────────────────
  const clone = element.cloneNode(true);
  clone.removeAttribute('id');

  // Override only layout-critical properties; preserve all class-based
  // styles AND the inline CSS variable (--invoice-row-h) set by the template.
  clone.style.position   = 'fixed';
  clone.style.left       = '0';
  clone.style.top        = '0';
  clone.style.zIndex     = '99999'; // above overlay
  clone.style.width      = `${INVOICE_WIDTH_PX}px`;
  clone.style.minWidth   = `${INVOICE_WIDTH_PX}px`;
  clone.style.maxWidth   = `${INVOICE_WIDTH_PX}px`;
  clone.style.transform  = 'none';
  clone.style.zoom       = '1';
  clone.style.margin     = '0';
  clone.style.background = '#ffffff';
  clone.style.overflow   = 'visible';
  clone.style.pointerEvents = 'none';

  copyImages(element, clone);
  document.body.appendChild(clone);
  fixCellAlignment(clone);

  // ── Wait for full layout ─────────────────────────────────────────
  await document.fonts.ready;
  await waitForImages(clone);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => requestAnimationFrame(r));

  const h = Math.max(
    clone.scrollHeight || clone.offsetHeight || 0,
    Math.ceil(A4_CONTENT_HEIGHT_PX),
  );

  // ── Capture ──────────────────────────────────────────────────────
  try {
    return await html2canvas(clone, {
      scale:           CANVAS_SCALE,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: '#ffffff',
      logging:         false,
      letterRendering: true,
      width:           INVOICE_WIDTH_PX,
      height:          h,
      windowWidth:     INVOICE_WIDTH_PX,
      windowHeight:    h,
      scrollX:         0,
      scrollY:         0,
      x:               0,
      y:               0,
    });
  } finally {
    document.body.removeChild(clone);
    document.body.removeChild(overlay);
  }
}

// ─────────────────────────────────────────────────────────────
// Page slicer  (full-width, no fit-to-page scaling)
// ─────────────────────────────────────────────────────────────

function sliceCanvasIntoPages(canvas) {
  // canvas.width = INVOICE_WIDTH_PX * CANVAS_SCALE
  const pageH = Math.round((A4_CONTENT_HEIGHT_PX / INVOICE_WIDTH_PX) * canvas.width);
  const slices = [];
  let y = 0;

  while (y < canvas.height) {
    const sliceH = Math.min(pageH, canvas.height - y);
    const slice  = document.createElement('canvas');
    slice.width  = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    slices.push(slice);
    y += sliceH;
  }

  return slices;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export async function generatePdfFromElement(elementId, filename = 'invoice.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const canvas     = await captureInvoiceCanvas(element);
  const pageSlices = sliceCanvasIntoPages(canvas);
  const pdfDoc     = await PDFDocument.create();

  for (const slice of pageSlices) {
    const page        = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
    const imgData     = slice.toDataURL('image/png');
    const pngImage    = await pdfDoc.embedPng(imgData);
    const drawW       = A4_WIDTH_PT;
    const drawH       = (slice.height / slice.width) * drawW;

    page.drawImage(pngImage, {
      x:      0,
      y:      A4_HEIGHT_PT - drawH,
      width:  drawW,
      height: drawH,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  const url      = URL.createObjectURL(blob);

  const link      = document.createElement('a');
  link.href       = url;
  link.download   = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printInvoice(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc    = iframe.contentDocument || iframe.contentWindow.document;
  const styles = collectDocumentStyles();

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Print Invoice</title>
    ${styles}
    <style>
      @page { size: A4 portrait; margin: 0; }
      html, body {
        margin: 0; padding: 0; background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { display: flex; justify-content: center; }
      .invoice-container, #invoice-preview {
        width: ${INVOICE_WIDTH_PX}px !important;
        min-width: ${INVOICE_WIDTH_PX}px !important;
        max-width: ${INVOICE_WIDTH_PX}px !important;
        padding: 18px 22px !important;
        margin: 0 auto !important;
        background: #fff !important;
        transform: none !important;
        zoom: 1 !important;
        overflow: visible !important;
      }
      .invoice-container table, #invoice-preview table {
        table-layout: fixed !important;
        width: 100% !important;
        border-collapse: collapse !important;
        border-spacing: 0 !important;
      }
      .invoice-container td, .invoice-container th,
      #invoice-preview td, #invoice-preview th {
        box-sizing: border-box !important;
        vertical-align: middle !important;
        line-height: 1.4 !important;
        font-family: Arial, Helvetica, sans-serif !important;
      }
      .invoice-col-desc { text-align: left !important; }
      .invoice-text-right { text-align: right !important; }
      .invoice-text-center, .invoice-head { text-align: center !important; }
      .invoice-head.invoice-col-desc,
      .invoice-col-desc { text-align: left !important; }
      .invoice-align-bottom { vertical-align: bottom !important; }
      .invoice-align-top    { vertical-align: top !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    </style>
  </head>
  <body>${element.outerHTML}</body>
</html>`);
  doc.close();

  const triggerPrint = async () => {
    await document.fonts.ready;
    await waitForImages(doc.body);
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  if (iframe.contentWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 400);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 400);
  }
}
