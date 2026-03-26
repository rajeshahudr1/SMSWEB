/**
 * helpers/pdfExport.js — Shared PDF export for all master modules
 * ═══════════════════════════════════════════════════════════════
 * INSTALL: npm install pdfkit --save
 *
 * Auto-layout:
 *   ≤ 6 columns → horizontal table (landscape if > 4)
 *   > 6 columns → vertical card layout (label: value per row, one card per record)
 */

'use strict';

const PDFDocument = require('pdfkit');

// ── Colors ──
const PRIMARY   = '#0054a6';
const HEADER_BG = '#f0f4f8';
const CARD_BG   = '#f9fafb';
const BORDER    = '#d0d5dd';
const ALT_ROW   = '#f4f6fa';
const TEXT_DARK  = '#1a1a2e';
const TEXT_MUTED = '#667085';
const SUCCESS    = '#12b76a';
const DANGER     = '#f04438';
const LABEL_BG   = '#edf0f5';

function filterColumns(row) {
    const skip = ['id', 'uuid', 'organization_id', 'created_by', 'updated_by', 'deleted_by',
        'deleted_at', 'image_url', 'image_full_url', 'uploaded_image_url',
        'display_image_url', 'is_editable', 'is_deletable', 'is_global',
        'is_super_admin', 'is_org_admin', 'variant_count'];
    return Object.keys(row).filter(k => !skip.includes(k));
}

function formatLabel(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(val, key) {
    if (val === null || val === undefined || val === '') return '—';
    const s = String(val);
    if (key === 'status' || key === 'Status') {
        return (s === '1' || s.toLowerCase() === 'active') ? 'Active' : 'Inactive';
    }
    return s;
}

function isStatusActive(val) {
    const s = String(val || '');
    return s === '1' || s.toLowerCase() === 'active';
}

/**
 * Generate and send a PDF file as download
 */
function generate(res, title, rows, columns) {
    if (!rows || !rows.length) {
        return res.json({ status: 200, message: 'No data to export.' });
    }

    // Auto-detect columns
    if (!columns || !columns.length) {
        const keys = filterColumns(rows[0]);
        columns = keys.map(k => ({ key: k, label: formatLabel(k), width: null }));
    }

    const useCards = columns.length > 6;

    const doc = new PDFDocument({
        size: 'A4',
        layout: useCards ? 'portrait' : (columns.length > 4 ? 'landscape' : 'portrait'),
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
        info: { Title: title, Author: 'SMS - Scrap Management System' }
    });

    const filename = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageH = doc.page.height;
    const mLeft = doc.page.margins.left;

    // ── Page Header ──
    function drawPageHeader() {
        doc.fontSize(18).fillColor(PRIMARY).font('Helvetica-Bold')
            .text(title, mLeft, 20);
        doc.fontSize(9).fillColor(TEXT_MUTED).font('Helvetica')
            .text('Exported: ' + new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) + '  |  Total: ' + rows.length + ' records', mLeft, 42);
        doc.moveTo(mLeft, 56).lineTo(mLeft + pageW, 56).strokeColor(PRIMARY).lineWidth(1.5).stroke();
    }

    // ── Page Footer ──
    function drawFooter() {
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(7).fillColor(TEXT_MUTED).font('Helvetica')
                .text('SMS - Scrap Management System  |  Page ' + (i + 1) + ' of ' + range.count,
                    mLeft, pageH - 30, { width: pageW, align: 'center' });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  CARD LAYOUT (> 6 columns)
    //  Each record = vertical card with label: value rows
    // ═══════════════════════════════════════════════════════
    if (useCards) {
        const LABEL_W = 150;
        const VALUE_W = pageW - LABEL_W;
        const ROW_H = 18;
        const CARD_PAD = 10;
        const CARD_GAP = 12;

        drawPageHeader();
        let y = 65;

        for (let ri = 0; ri < rows.length; ri++) {
            const row = rows[ri];

            // Calculate card height
            const visibleCols = columns.filter(c => {
                const v = row[c.key];
                return v !== null && v !== undefined && v !== '';
            });
            const cardH = (visibleCols.length * ROW_H) + CARD_PAD * 2 + 24; // 24 for card title

            // Check if card fits on page
            if (y + cardH > pageH - 50) {
                doc.addPage();
                y = 20;
            }

            // ── Card title bar ──
            doc.rect(mLeft, y, pageW, 22).fill(PRIMARY);
            doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold')
                .text('#' + (ri + 1) + '  —  ' + formatValue(row[columns[0].key] || row[columns[1].key], ''), mLeft + 8, y + 6, { width: pageW - 16 });
            y += 22;

            // ── Card border ──
            const cardStartY = y;

            // ── Label: Value rows ──
            let rowIdx = 0;
            visibleCols.forEach(col => {
                const val = formatValue(row[col.key], col.key);
                const rowY = y + CARD_PAD + (rowIdx * ROW_H);

                // Alternating row bg
                if (rowIdx % 2 === 0) {
                    doc.rect(mLeft, rowY, pageW, ROW_H).fill(ALT_ROW);
                }

                // Label (left side — grey background)
                doc.rect(mLeft, rowY, LABEL_W, ROW_H).fill(LABEL_BG);
                doc.rect(mLeft, rowY, LABEL_W, ROW_H).strokeColor(BORDER).lineWidth(0.3).stroke();
                doc.fontSize(7.5).font('Helvetica-Bold').fillColor(TEXT_MUTED)
                    .text(col.label, mLeft + 6, rowY + 4, { width: LABEL_W - 12, align: 'left' });

                // Value (right side)
                doc.rect(mLeft + LABEL_W, rowY, VALUE_W, ROW_H).strokeColor(BORDER).lineWidth(0.3).stroke();

                // Status coloring
                if (col.key === 'status' || col.key === 'Status') {
                    doc.fontSize(7.5).font('Helvetica-Bold')
                        .fillColor(isStatusActive(row[col.key]) ? SUCCESS : DANGER)
                        .text(val, mLeft + LABEL_W + 6, rowY + 4, { width: VALUE_W - 12 });
                } else {
                    doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_DARK)
                        .text(val.substring(0, 120), mLeft + LABEL_W + 6, rowY + 4, { width: VALUE_W - 12 });
                }

                rowIdx++;
            });

            // Card outer border
            const cardEndY = y + CARD_PAD + (rowIdx * ROW_H) + CARD_PAD;
            doc.rect(mLeft, cardStartY, pageW, cardEndY - cardStartY).strokeColor(BORDER).lineWidth(0.5).stroke();

            y = cardEndY + CARD_GAP;
        }

        // Summary
        if (y + 20 > pageH - 50) { doc.addPage(); y = 20; }
        doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica-Oblique')
            .text('Total records: ' + rows.length, mLeft, y);

        drawFooter();
        doc.end();
        return;
    }

    // ═══════════════════════════════════════════════════════
    //  TABLE LAYOUT (≤ 6 columns) — compact horizontal table
    // ═══════════════════════════════════════════════════════
    const NUM_COL_W = 30;
    const totalCustomWidth = columns.reduce((s, c) => s + (c.width || 0), 0);
    const autoCount = columns.filter(c => !c.width).length;
    const autoWidth = autoCount > 0 ? (pageW - NUM_COL_W - totalCustomWidth) / autoCount : 0;

    function getColWidth(col) { return col.width || Math.max(autoWidth, 60); }

    function drawTableHeader(y) {
        const h = 22;
        doc.rect(mLeft, y, pageW, h).fill(HEADER_BG);
        doc.rect(mLeft, y, pageW, h).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_DARK);
        let x = mLeft + 4;
        doc.text('#', x, y + 6, { width: NUM_COL_W, align: 'center' });
        x += NUM_COL_W;
        columns.forEach(col => {
            const w = getColWidth(col);
            doc.text(col.label, x + 3, y + 6, { width: w - 6, align: 'left' });
            x += w;
        });
        return y + h;
    }

    function drawDataRow(row, idx, y) {
        const h = 20;
        if (idx % 2 === 1) doc.rect(mLeft, y, pageW, h).fill(ALT_ROW);
        doc.rect(mLeft, y, pageW, h).strokeColor(BORDER).lineWidth(0.3).stroke();
        doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_DARK);
        let x = mLeft + 4;
        doc.fillColor(TEXT_MUTED).text(String(idx + 1), x, y + 5, { width: NUM_COL_W, align: 'center' });
        x += NUM_COL_W;
        columns.forEach(col => {
            const w = getColWidth(col);
            const val = formatValue(row[col.key], col.key);
            if (col.key === 'status' || col.key === 'Status') {
                doc.fillColor(isStatusActive(row[col.key]) ? SUCCESS : DANGER)
                    .text(val, x + 3, y + 5, { width: w - 6 });
            } else {
                doc.fillColor(TEXT_DARK).text(val.substring(0, 60), x + 3, y + 5, { width: w - 6 });
            }
            x += w;
        });
        return y + h;
    }

    drawPageHeader();
    let y = 65;
    y = drawTableHeader(y);

    for (let i = 0; i < rows.length; i++) {
        if (y + 22 > pageH - 50) { doc.addPage(); y = 20; y = drawTableHeader(y); }
        y = drawDataRow(rows[i], i, y);
    }

    y += 8;
    doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica-Oblique')
        .text('Total records: ' + rows.length, mLeft, y);

    drawFooter();
    doc.end();
}

module.exports = { generate };