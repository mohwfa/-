/**
 * Comprehensive, resilient printing utility for paper invoices, vouchers, reports, and account statements.
 * Supports:
 * - Standard A4 paper size (portrait: 210mm x 297mm) for Invoices, Reports, and Account Statements.
 * - Standard A5 paper size (landscape: 210mm x 148mm) for Receipt & Payment Vouchers (سندات القبض والصرف).
 * Works reliably inside iframe sandboxes, desktop browsers, mobile devices, and popup-restricted environments.
 */

export type PrintPaperSize = 'A4' | 'A5_landscape' | 'A4_portrait';

export interface PrintDocumentOptions {
  title?: string;
  companyName?: string;
  autoPrint?: boolean;
  paperSize?: PrintPaperSize;
}

/**
 * Extracts all host styles and stylesheets to guarantee exact typography and styling in print
 */
const getHostStyles = (): string => {
  if (typeof document === 'undefined') return '';
  let styles = '';
  try {
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleElements.forEach((el) => {
      styles += el.outerHTML + '\n';
    });
  } catch (e) {
    console.warn('Could not extract host styles:', e);
  }
  return styles;
};

/**
 * Returns complete styled HTML document for printable A4 or A5 Landscape documents
 */
export const buildPrintableHtml = (
  contentHtml: string,
  options: PrintDocumentOptions = {}
): string => {
  const {
    title = 'مستند مالي رسمي',
    companyName = 'المنظومة المالية',
    paperSize = 'A4',
    autoPrint = false,
  } = options;

  const isA5 = paperSize === 'A5_landscape';
  const hostStyles = getHostStyles();

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${companyName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  
  ${hostStyles}

  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      background-color: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      direction: rtl;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      padding: ${isA5 ? '10px' : '18px'};
      margin: 0 auto;
      max-width: ${isA5 ? '210mm' : '210mm'};
      background: #ffffff;
    }

    .no-print {
      display: none !important;
    }

    .print-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 18px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      margin-bottom: 16px;
      font-family: 'Cairo', sans-serif;
    }

    .btn-print {
      background-color: #059669;
      color: #ffffff;
      border: none;
      padding: 9px 20px;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      transition: background-color 0.2s;
    }

    .btn-print:hover {
      background-color: #047857;
    }

    .btn-close {
      background-color: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }

    .btn-close:hover {
      background-color: #f1f5f9;
    }

    /* Page Rules & Dimensions */
    @page {
      size: ${isA5 ? 'A5 landscape' : 'A4 portrait'};
      margin: ${isA5 ? '5mm 8mm' : '8mm 10mm'};
    }

    @media print {
      .print-toolbar,
      .no-print {
        display: none !important;
      }

      body {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        background: #ffffff !important;
      }

      .paper-frame {
        border: none !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
    }

    /* In standalone preview / iframe, ensure print elements are visible */
    .print-only,
    .hidden.print\\:block,
    [class*="print:block"] {
      display: block !important;
    }

    .paper-frame {
      width: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: ${isA5 ? '16px' : '24px'};
      margin: 0 auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: ${isA5 ? '5px 7px' : '7px 10px'};
      text-align: right;
      font-size: ${isA5 ? '11px' : '12px'};
    }

    th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="print-toolbar no-print">
    <div style="font-weight: 800; font-size: 13px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
      <span>📄</span>
      <span>${isA5 ? 'معاينة سند مالي (A5 أفقي)' : 'معاينة مستند مالي (A4 رأسي)'}: ${title}</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="btn-print" onclick="window.print()">
        🖨️ طباعة الآن (${isA5 ? 'A5 أفقي' : 'A4'})
      </button>
      <button class="btn-close" onclick="window.close()">
        ✕ إغلاق
      </button>
    </div>
  </div>

  <div class="paper-frame">
    ${contentHtml}
  </div>

  <script>
    ${autoPrint ? `
      window.addEventListener('load', function() {
        setTimeout(function() {
          try {
            window.focus();
            window.print();
          } catch(e) {
            console.error('Auto print trigger failed:', e);
          }
        }, 150);
      });
    ` : ''}
  </script>
</body>
</html>`;
};

/**
 * Direct print trigger.
 * Prints the target element using an isolated hidden iframe with all styles attached,
 * ensuring clean A4 portrait or A5 landscape rendering without showing app chrome or modal backdrops.
 * Falls back to styled main-window printing if iframe printing is restricted.
 */
export const printElement = (
  elementIdOrHtml: string,
  options: PrintDocumentOptions = {}
): boolean => {
  let contentHtml = '';
  const trimmed = (elementIdOrHtml || '').trim();
  if (trimmed.startsWith('<')) {
    contentHtml = trimmed;
  } else {
    const elem = typeof document !== 'undefined' ? document.getElementById(trimmed) : null;
    if (elem) {
      contentHtml = elem.innerHTML;
    } else {
      contentHtml = trimmed;
    }
  }

  if (!contentHtml.trim()) {
    console.warn('Content is empty for printElement');
    return fallbackToWindowPrint();
  }

  const fullHtml = buildPrintableHtml(contentHtml, { ...options, autoPrint: false });

  // Approach 1: Print via a dedicated iframe with active layout (DO NOT use visibility:hidden or display:none)
  try {
    let iframe = document.getElementById('__app_print_frame__') as HTMLIFrameElement;
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }

    iframe = document.createElement('iframe');
    iframe.id = '__app_print_frame__';
    // Must be in the active render tree for Chromium to allow print()
    iframe.setAttribute(
      'style',
      'position:fixed;right:0;bottom:0;width:1px;height:1px;border:none;opacity:0.01;pointer-events:none;z-index:-1;'
    );
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(fullHtml);
      doc.close();

      const triggerIframePrint = () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } else {
            fallbackToWindowPrint();
          }
        } catch (err) {
          console.warn('iframe.contentWindow.print failed, falling back to window.print()', err);
          fallbackToWindowPrint();
        }
      };

      // Allow styles, fonts, and images to settle before triggering print dialog
      setTimeout(triggerIframePrint, 200);
      return true;
    }
  } catch (iframeError) {
    console.warn('Error setting up print iframe:', iframeError);
  }

  // Approach 2: Main window print fallback with temporary print styling
  return fallbackToWindowPrint();
};

const fallbackToWindowPrint = (): boolean => {
  try {
    document.body.classList.add('print-active-fallback');
    window.focus();
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-active-fallback');
    }, 1200);
    return true;
  } catch (err) {
    console.error('window.print fallback failed:', err);
    return false;
  }
};

/**
 * Opens document in a dedicated standalone window with clean A4 or A5 layout and triggers print
 */
export const openPrintWindow = (
  elementIdOrHtml: string,
  options: PrintDocumentOptions = {}
): Window | null => {
  let contentHtml = '';
  const trimmed = (elementIdOrHtml || '').trim();
  if (trimmed.startsWith('<')) {
    contentHtml = trimmed;
  } else {
    const elem = typeof document !== 'undefined' ? document.getElementById(trimmed) : null;
    if (elem) {
      contentHtml = elem.innerHTML;
    } else {
      contentHtml = trimmed;
    }
  }

  if (!contentHtml.trim()) {
    console.warn('Content is empty for print window');
    return null;
  }

  const fullHtml = buildPrintableHtml(contentHtml, { ...options, autoPrint: true });

  // Direct popup with document.write (fastest & most supported)
  try {
    const printWin = window.open('', '_blank', 'width=950,height=750,resizable=yes,scrollbars=yes,status=yes');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      printWin.focus();
      return printWin;
    }
  } catch (e) {
    console.warn('Direct popup document.write failed, trying blob url', e);
  }

  // Blob URL fallback
  try {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWin = window.open(url, '_blank');
    if (printWin) {
      return printWin;
    }
  } catch (e) {
    console.warn('Blob window.open blocked', e);
  }

  return null;
};

/**
 * Downloads document as self-contained HTML file for offline printing or PDF archiving
 */
export const downloadPrintableHtml = (
  elementIdOrHtml: string,
  filename: string,
  options: PrintDocumentOptions = {}
) => {
  let contentHtml = '';
  const trimmed = (elementIdOrHtml || '').trim();
  if (trimmed.startsWith('<')) {
    contentHtml = trimmed;
  } else {
    const elem = typeof document !== 'undefined' ? document.getElementById(trimmed) : null;
    if (elem) {
      contentHtml = elem.innerHTML;
    } else {
      contentHtml = trimmed;
    }
  }

  const fullHtml = buildPrintableHtml(contentHtml, { ...options, autoPrint: false });
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
