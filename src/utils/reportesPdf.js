import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSrc from '../assets/GreenAlert - logo principal.png';

// Paleta consistente con DescargarDatos.jsx
const C = {
  verde:      [21, 128, 61],
  verdeClaro: [220, 252, 231],
  verdeBorde: [187, 247, 208],
  oscuro:     [30, 41, 59],
  medio:      [71, 85, 105],
  claro:      [148, 163, 184],
  filaAlt:    [248, 250, 252],
  filaNorm:   [255, 255, 255],
  borde:      [226, 232, 240],
  headerBg:   [21, 128, 61],
  // accents por estado (header de filas en KPI summary)
  rojo:       [220, 38, 38],
  ambar:      [217, 119, 6],
  azul:       [37, 99, 235],
};

const ESTADO_LABELS = {
  pendiente:   'Pendiente',
  en_revision: 'En revisión',
  verificado:  'Verificado',
  en_proceso:  'En proceso',
  resuelto:    'Resuelto',
  rechazado:   'Rechazado',
};

const SEVERIDAD_LABELS = {
  bajo:    'Bajo',
  medio:   'Medio',
  alto:    'Alto',
  critico: 'Crítico',
};

// Color del badge de estado en la tabla
const ESTADO_COLOR = {
  pendiente:   [156, 163, 175],
  en_revision: [37, 99, 235],
  verificado:  [139, 92, 246],
  en_proceso:  [217, 119, 6],
  resuelto:    [22, 163, 74],
  rechazado:   [220, 38, 38],
};

const fmtFecha = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('es-CO', { dateStyle: 'medium' }); }
  catch { return String(v); }
};

const fmtFiltroValor = (v) => v ? String(v).replace(/_/g, ' ') : 'Todos';

function cargarImagen(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Genera un PDF estilizado con la lista de reportes filtrados y un resumen de KPIs.
 * @param {Object} opts
 * @param {Array}  opts.reportes  Lista de reportes (formato del endpoint /reportes/export?format=json)
 * @param {Object} opts.stats     Stats globales del dashboard (total_reportes, pendientes, resueltos, etc.)
 * @param {Object} opts.filtros   Filtros aplicados (categoria, estado, dateFrom, dateTo)
 * @param {String} opts.usuario   Nombre del usuario que exporta
 */
export async function generarReportesPDF({ reportes = [], stats = {}, filtros = {}, usuario = '' }) {
  // Apaisado para que la tabla quepa cómoda
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 0;

  const logoBase64 = await cargarImagen(logoSrc);

  // ── Marca de agua ──
  const marcaDeAgua = (pageH) => {
    if (!logoBase64) return;
    const wSize = 100;
    const hSize = 100;
    doc.setGState(new doc.GState({ opacity: 0.04 }));
    doc.addImage(logoBase64, 'PNG', (W - wSize) / 2, (pageH - hSize) / 2, wSize, hSize);
    doc.setGState(new doc.GState({ opacity: 1 }));
  };

  // ── Cabecera para páginas secundarias ──
  const cabeceraRepetida = () => {
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, W, 12, 'F');
    doc.setFillColor(...C.verde);
    doc.rect(0, 0, W, 0.8, 'F');
    if (logoBase64) doc.addImage(logoBase64, 'PNG', 8, 2, 8, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.verde);
    doc.text('GreenAlert', 18, 7.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.claro);
    doc.text('Reporte de Dashboard', 42, 7.5);
    doc.setDrawColor(...C.borde);
    doc.setLineWidth(0.3);
    doc.line(0, 12, W, 12);
  };

  // ── Título de sección ──
  const seccionTitulo = (titulo) => {
    if (y > H - 35) { doc.addPage(); cabeceraRepetida(); marcaDeAgua(H); y = 20; }
    doc.setFillColor(...C.verde);
    doc.roundedRect(14, y - 5.5, W - 28, 11, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(titulo, 20, y + 1.5);
    y += 13;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // PÁGINA 1 — HEADER
  // ═════════════════════════════════════════════════════════════════════════
  marcaDeAgua(H);

  doc.setFillColor(...C.verde);
  doc.rect(0, 0, W, 1.2, 'F');
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 1.2, W, 38, 'F');

  if (logoBase64) doc.addImage(logoBase64, 'PNG', 14, 5, 22, 22);
  const textX = logoBase64 ? 40 : 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...C.verde);
  doc.text('GreenAlert', textX, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.medio);
  doc.text('Monitoreo Ambiental Ciudadano', textX, 23);

  // Fecha + usuario
  doc.setFontSize(8);
  doc.setTextColor(...C.claro);
  const ahora = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(`Generado: ${ahora}`, W - 14, 16, { align: 'right' });
  if (usuario) doc.text(`Por: ${usuario}`, W - 14, 22, { align: 'right' });

  doc.setDrawColor(...C.verdeBorde);
  doc.setLineWidth(0.5);
  doc.line(14, 32, W - 14, 32);

  // Título del documento
  y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...C.oscuro);
  doc.text('Reporte de Actividad Ambiental', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.medio);
  doc.text(`${reportes.length} reporte${reportes.length !== 1 ? 's' : ''} incluido${reportes.length !== 1 ? 's' : ''} en este documento`, 14, y);
  y += 10;

  // ═════════════════════════════════════════════════════════════════════════
  // FILTROS APLICADOS
  // ═════════════════════════════════════════════════════════════════════════
  seccionTitulo('Filtros aplicados');
  const filtrosFilas = [
    ['Categoría', fmtFiltroValor(filtros.categoria)],
    ['Estado',    fmtFiltroValor(filtros.estado)],
    ['Desde',     filtros.dateFrom || '—'],
    ['Hasta',     filtros.dateTo || '—'],
  ];
  autoTable(doc, {
    startY: y,
    body: filtrosFilas,
    theme: 'plain',
    margin: { left: 14, right: 14 },
    styles: { font: 'helvetica', fontSize: 9, textColor: C.oscuro, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: C.verde, cellWidth: 40 },
    },
    willDrawCell: (data) => {
      doc.setFillColor(...(data.row.index % 2 === 0 ? C.filaNorm : C.filaAlt));
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ═════════════════════════════════════════════════════════════════════════
  // RESUMEN DE KPIs (cards horizontales)
  // ═════════════════════════════════════════════════════════════════════════
  if (stats && Object.keys(stats).length > 0) {
    seccionTitulo('Resumen de la plataforma');

    const total = Number(stats.total_reportes ?? 0);
    const resPct = total > 0 ? Math.round((Number(stats.resueltos ?? 0) / total) * 100) : 0;

    const kpis = [
      { label: 'Total reportes', value: stats.total_reportes ?? 0,     color: C.azul },
      { label: 'Pendientes',     value: stats.pendientes ?? 0,         color: C.rojo },
      { label: 'En revisión',    value: stats.en_revision ?? 0,        color: C.ambar },
      { label: 'Resueltos',      value: stats.resueltos ?? 0,          color: C.verde },
      { label: '% Resolución',   value: `${resPct}%`,                  color: C.verde },
      { label: 'Municipios',     value: stats.municipios_activos ?? 0, color: C.medio },
    ];

    const cardW = (W - 28 - (kpis.length - 1) * 3) / kpis.length;
    const cardH = 18;
    kpis.forEach((k, i) => {
      const x = 14 + i * (cardW + 3);
      doc.setFillColor(...C.filaAlt);
      doc.setDrawColor(...C.borde);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'FD');
      // Acento superior
      doc.setFillColor(...k.color);
      doc.roundedRect(x, y, cardW, 1.2, 0.5, 0.5, 'F');
      // Valor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...k.color);
      doc.text(String(k.value), x + cardW / 2, y + 9, { align: 'center' });
      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.medio);
      doc.text(k.label, x + cardW / 2, y + 14.5, { align: 'center' });
    });
    y += cardH + 10;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // TABLA DE REPORTES
  // ═════════════════════════════════════════════════════════════════════════
  if (reportes.length === 0) {
    if (y > H - 25) { doc.addPage(); cabeceraRepetida(); marcaDeAgua(H); y = 20; }
    doc.setFillColor(...C.filaAlt);
    doc.setDrawColor(...C.borde);
    doc.roundedRect(14, y, W - 28, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...C.claro);
    doc.text('No hay reportes que coincidan con los filtros aplicados.', W / 2, y + 11, { align: 'center' });
    y += 22;
  } else {
    if (y > H - 40) { doc.addPage(); cabeceraRepetida(); marcaDeAgua(H); y = 20; }
    seccionTitulo(`Listado de reportes (${reportes.length})`);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['#', 'Título', 'Categoría', 'Severidad', 'Estado', 'Municipio', 'Autor', 'Fecha']],
      body: reportes.map((r, i) => [
        i + 1,
        r.titulo ?? '—',
        (r.tipo_contaminacion ?? '').replace(/_/g, ' '),
        SEVERIDAD_LABELS[r.nivel_severidad] ?? r.nivel_severidad ?? '—',
        ESTADO_LABELS[r.estado] ?? r.estado ?? '—',
        r.municipio ?? '—',
        [r.autor_nombre, r.autor_apellido].filter(Boolean).join(' ') || '—',
        fmtFecha(r.created_at),
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica', fontSize: 8, textColor: C.oscuro,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        lineColor: C.borde, lineWidth: 0.2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: C.headerBg, textColor: [255, 255, 255],
        fontStyle: 'bold', fontSize: 8.5,
      },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 32 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 35 },
        6: { cellWidth: 40 },
        7: { cellWidth: 28, halign: 'center' },
      },
      alternateRowStyles: { fillColor: C.filaAlt },
      didParseCell: (data) => {
        // Colorea la celda Estado según el valor original
        if (data.section === 'body' && data.column.index === 4) {
          const original = reportes[data.row.index]?.estado;
          const color = ESTADO_COLOR[original];
          if (color) data.cell.styles.textColor = color;
        }
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) { cabeceraRepetida(); marcaDeAgua(H); }
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // AVISO FINAL
  // ═════════════════════════════════════════════════════════════════════════
  if (y > H - 25) { doc.addPage(); cabeceraRepetida(); marcaDeAgua(H); y = 20; }
  doc.setFillColor(...C.verdeClaro);
  doc.setDrawColor(...C.verdeBorde);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, W - 28, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.verde);
  doc.text('Documento generado automáticamente desde el panel de administración de GreenAlert.', W / 2, y + 5.5, { align: 'center' });
  doc.text('La información refleja el estado de la plataforma al momento de la exportación.', W / 2, y + 10, { align: 'center' });

  // ═════════════════════════════════════════════════════════════════════════
  // FOOTER en todas las páginas
  // ═════════════════════════════════════════════════════════════════════════
  const totalPags = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.getHeight();

    doc.setDrawColor(...C.borde);
    doc.setLineWidth(0.3);
    doc.line(14, pH - 12, W - 14, pH - 12);

    doc.setFillColor(...C.verde);
    doc.rect(0, pH - 1.2, W, 1.2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.claro);
    doc.text('GreenAlert © 2026 — Monitoreo Ambiental Ciudadano', 14, pH - 5);
    doc.text(`Página ${i} de ${totalPags}`, W - 14, pH - 5, { align: 'right' });

    if (logoBase64) {
      doc.setGState(new doc.GState({ opacity: 0.3 }));
      doc.addImage(logoBase64, 'PNG', W / 2 - 3, pH - 10, 6, 6);
      doc.setGState(new doc.GState({ opacity: 1 }));
    }
  }

  const nombreArchivo = `GreenAlert_Reportes_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nombreArchivo);
  return nombreArchivo;
}
