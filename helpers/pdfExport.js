/**
 * helpers/pdfExport.js — Shared PDF export for all master modules
 * ═══════════════════════════════════════════════════════════════
 * INSTALL: npm install pdfkit --save
 *
 * Usage in any web controller:
 *   const pdfExport = require('../helpers/pdfExport');
 *   if (format === 'pdf') return pdfExport.generate(res, 'Part Types', rows, columns);
 */

'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generate and send a PDF file as download
 *
 * @param {Response} res        Express response object
 * @param {string}   title      Report title e.g. "Part Types"
 * @param {Array}    rows       Array of objects [{name:'x', status:'Active'}, ...]
 * @param {Array}    [columns]  Optional column config: [{key:'name', label:'Name', width:200}, ...]
 *                              If not provided, auto-generates from first row keys.
 */
function generate(res, title, rows, columns) {
    if (!rows || !rows.length) {
        return res.json({ status: 200, message: 'No data to export.' });
    }

    // Auto-detect columns from row keys if not provided
    if (!columns || !columns.length) {
        const keys = Object.keys(rows[0]).filter(k =>
            !['id', 'uuid', 'organization_id', 'created_by', 'updated_by', 'deleted_by',
              'deleted_at', 'image_url', 'image_full_url', 'uploaded_image_url',
              'display_image_url', 'is_editable', 'is_deletable', 'is_global',
              'is_super_admin', 'is_org_admin', 'variant_count'].includes(k)
        );
        columns = keys.map(k => ({
            key: k,
            label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            width: null // auto
        }));
    }

    // ── Create PDF ──
    const doc = new PDFDocument({
        size: 'A4',
        layout: columns.length > 5 ? 'landscape' : 'portrait',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
        info: { Title: title, Author: 'SMS - Scrap Management System' }
    });

    // ── Stream to response ──
    const filename = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ── Colors ──
    const PRIMARY    = '#0054a6';
    const HEADER_BG  = '#f0f4f8';
    const BORDER     = '#d0d5dd';
    const ALT_ROW    = '#f9fafb';
    const TEXT_DARK   = '#1a1a2e';
    const TEXT_MUTED  = '#667085';

    // ── Calculate column widths ──
    const totalCustomWidth = columns.reduce((s, c) => s + (c.width || 0), 0);
    const autoCount = columns.filter(c => !c.width).length;
    const autoWidth = autoCount > 0 ? (pageWidth - 30 - totalCustomWidth) / autoCount : 0; // 30 for # column
    const NUM_COL_W = 30;

    function getColWidth(col) {
        return col.width || Math.max(autoWidth, 60);
    }

    // ── Header ──
    function drawHeader() {
        doc.fontSize(18).fillColor(PRIMARY).font('Helvetica-Bold')
           .text(title, doc.page.margins.left, 20, { align: 'left' });
        doc.fontSize(9).fillColor(TEXT_MUTED).font('Helvetica')
           .text('Exported: ' + new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) + '  |  Total: ' + rows.length + ' records',
                 doc.page.margins.left, 42, { align: 'left' });
        doc.moveTo(doc.page.margins.left, 56)
           .lineTo(doc.page.margins.left + pageWidth, 56)
           .strokeColor(PRIMARY).lineWidth(1.5).stroke();
    }

    // ── Table header row ──
    function drawTableHeader(y) {
        const h = 22;
        // Background
        doc.rect(doc.page.margins.left, y, pageWidth, h).fill(HEADER_BG);
        // Border
        doc.rect(doc.page.margins.left, y, pageWidth, h).strokeColor(BORDER).lineWidth(0.5).stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_DARK);
        let x = doc.page.margins.left + 4;

        // # column
        doc.text('#', x, y + 6, { width: NUM_COL_W, align: 'center' });
        x += NUM_COL_W;

        // Data columns
        columns.forEach(col => {
            const w = getColWidth(col);
            doc.text(col.label, x + 3, y + 6, { width: w - 6, align: 'left' });
            x += w;
        });

        return y + h;
    }

    // ── Data row ──
    function drawDataRow(row, idx, y) {
        const h = 20;
        // Alternate row background
        if (idx % 2 === 1) {
            doc.rect(doc.page.margins.left, y, pageWidth, h).fill(ALT_ROW);
        }
        // Row border
        doc.rect(doc.page.margins.left, y, pageWidth, h).strokeColor(BORDER).lineWidth(0.3).stroke();

        doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_DARK);
        let x = doc.page.margins.left + 4;

        // #
        doc.fillColor(TEXT_MUTED).text(String(idx + 1), x, y + 5, { width: NUM_COL_W, align: 'center' });
        x += NUM_COL_W;

        // Data columns
        columns.forEach(col => {
            const w = getColWidth(col);
            let val = row[col.key];
            if (val === null || val === undefined) val = '';
            val = String(val);

            // Status badge (simple text coloring)
            if (col.key === 'status') {
                const isActive = val === '1' || val.toLowerCase() === 'active';
                doc.fillColor(isActive ? '#12b76a' : '#f04438')
                   .text(isActive ? 'Active' : 'Inactive', x + 3, y + 5, { width: w - 6 });
            } else {
                doc.fillColor(TEXT_DARK)
                   .text(val.substring(0, 60), x + 3, y + 5, { width: w - 6 });
            }
            x += w;
        });

        return y + h;
    }

    // ── Footer ──
    function drawFooter() {
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(7).fillColor(TEXT_MUTED).font('Helvetica')
               .text(
                   'SMS - Scrap Management System  |  Page ' + (i + 1) + ' of ' + range.count,
                   doc.page.margins.left,
                   doc.page.height - 30,
                   { width: pageWidth, align: 'center' }
               );
        }
    }

    // ── Render ──
    drawHeader();
    let y = 65;
    y = drawTableHeader(y);

    for (let i = 0; i < rows.length; i++) {
        // Check if we need a new page
        if (y + 22 > doc.page.height - 50) {
            doc.addPage();
            y = 20;
            y = drawTableHeader(y);
        }
        y = drawDataRow(rows[i], i, y);
    }

    // Summary row
    y += 8;
    doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica-Oblique')
       .text('Total records: ' + rows.length, doc.page.margins.left, y);

    drawFooter();
    doc.end();
}

module.exports = { generate };
