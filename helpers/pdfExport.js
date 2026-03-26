/**
 * helpers/pdfExport.js — Shared PDF export (v2 — no bufferPages)
 * Draws footer on every page inline. Zero ghost pages.
 */
'use strict';
const PDFDocument = require('pdfkit');

const PRIMARY   = '#0054a6';
const HEADER_BG = '#f0f4f8';
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
function formatLabel(key) { return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function formatValue(val, key) {
    if (val === null || val === undefined || val === '') return '—';
    const s = String(val);
    if (key === 'status' || key === 'Status') return (s === '1' || s.toLowerCase() === 'active') ? 'Active' : 'Inactive';
    return s;
}
function isStatusActive(val) { const s = String(val || ''); return s === '1' || s.toLowerCase() === 'active'; }

function generate(res, title, rows, columns) {
    if (!rows || !rows.length) return res.json({ status: 200, message: 'No data to export.' });

    if (!columns || !columns.length) {
        const keys = filterColumns(rows[0]);
        columns = keys.map(k => ({ key: k, label: formatLabel(k), width: null }));
    }

    const useCards = columns.length > 6;

    // NO bufferPages — draw footer per page inline
    const doc = new PDFDocument({
        size: 'A4',
        layout: useCards ? 'portrait' : (columns.length > 4 ? 'landscape' : 'portrait'),
        margins: { top: 40, bottom: 50, left: 40, right: 40 },
        autoFirstPage: false,
        info: { Title: title, Author: 'SMS - Scrap Management System' }
    });

    const filename = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    let pageNum = 0;
    const exportDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    // ── Add page with header + footer ──
    function addNewPage() {
        // Draw footer on previous page before creating new one
        if (pageNum > 0) drawFooterOnCurrentPage();
        doc.addPage();
        pageNum++;
        const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const mLeft = doc.page.margins.left;
        // Header only on first page
        if (pageNum === 1) {
            doc.fontSize(18).fillColor(PRIMARY).font('Helvetica-Bold').text(title, mLeft, 20, { lineBreak: false });
            doc.fontSize(9).fillColor(TEXT_MUTED).font('Helvetica').text('Exported: ' + exportDate + '  |  Total: ' + rows.length + ' records', mLeft, 42, { lineBreak: false });
            doc.moveTo(mLeft, 56).lineTo(mLeft + pageW, 56).strokeColor(PRIMARY).lineWidth(1.5).stroke();
            return 65;
        }
        return 20;
    }

    function drawFooterOnCurrentPage() {
        const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const pageH = doc.page.height;
        const mLeft = doc.page.margins.left;
        // Draw directly — no switchToPage, no buffering
        doc.save();
        doc.fontSize(7).fillColor(TEXT_MUTED).font('Helvetica');
        doc.text('SMS - Scrap Management System  |  Page ' + pageNum, mLeft, pageH - 30, { width: pageW, align: 'center', lineBreak: false });
        doc.restore();
    }

    function getPageW() { return doc.page.width - doc.page.margins.left - doc.page.margins.right; }
    function getPageH() { return doc.page.height; }
    function getML() { return doc.page.margins.left; }
    // Bottom limit — leave space for footer
    function getBottomLimit() { return doc.page.height - 50; }

    // ═══ CARD LAYOUT ═══
    if (useCards) {
        const LABEL_W = 150;
        let y = addNewPage();

        for (let ri = 0; ri < rows.length; ri++) {
            const row = rows[ri];
            const pageW = getPageW();
            const VALUE_W = pageW - LABEL_W;
            const mLeft = getML();
            const ROW_H = 18;

            const visibleCols = columns.filter(c => { const v = row[c.key]; return v !== null && v !== undefined && v !== ''; });
            const cardH = (visibleCols.length * ROW_H) + 20 + 22;

            if (y + cardH > getBottomLimit()) { y = addNewPage(); }

            // Card title bar
            doc.rect(mLeft, y, pageW, 22).fill(PRIMARY);
            doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold')
                .text('#' + (ri + 1) + '  —  ' + formatValue(row[columns[0].key] || row[columns[1].key], ''), mLeft + 8, y + 6, { width: pageW - 16, lineBreak: false });
            y += 22;

            let rowIdx = 0;
            visibleCols.forEach(col => {
                const val = formatValue(row[col.key], col.key);
                const rowY = y + 10 + (rowIdx * ROW_H);
                if (rowIdx % 2 === 0) doc.rect(mLeft, rowY, pageW, ROW_H).fill(ALT_ROW);
                doc.rect(mLeft, rowY, LABEL_W, ROW_H).fill(LABEL_BG);
                doc.rect(mLeft, rowY, LABEL_W, ROW_H).strokeColor(BORDER).lineWidth(0.3).stroke();
                doc.fontSize(7.5).font('Helvetica-Bold').fillColor(TEXT_MUTED).text(col.label, mLeft + 6, rowY + 4, { width: LABEL_W - 12, lineBreak: false });
                doc.rect(mLeft + LABEL_W, rowY, VALUE_W, ROW_H).strokeColor(BORDER).lineWidth(0.3).stroke();
                if (col.key === 'status' || col.key === 'Status') {
                    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(isStatusActive(row[col.key]) ? SUCCESS : DANGER).text(val, mLeft + LABEL_W + 6, rowY + 4, { width: VALUE_W - 12, lineBreak: false });
                } else {
                    doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_DARK).text(val.substring(0, 120), mLeft + LABEL_W + 6, rowY + 4, { width: VALUE_W - 12, lineBreak: false });
                }
                rowIdx++;
            });
            const cardEndY = y + 10 + (rowIdx * ROW_H) + 10;
            doc.rect(mLeft, y, pageW, cardEndY - y).strokeColor(BORDER).lineWidth(0.5).stroke();
            y = cardEndY + 12;
        }

        // Footer on last page
        drawFooterOnCurrentPage();
        doc.end();
        return;
    }

    // ═══ TABLE LAYOUT ═══
    const NUM_COL_W = 30;
    const totalCustomWidth = columns.reduce((s, c) => s + (c.width || 0), 0);
    const autoCount = columns.filter(c => !c.width).length;

    let y = addNewPage();
    const pageW = getPageW();
    const mLeft = getML();
    const autoWidth = autoCount > 0 ? (pageW - NUM_COL_W - totalCustomWidth) / autoCount : 0;

    function getColWidth(col) { return col.width || Math.max(autoWidth, 60); }

    function drawTableHeader(startY) {
        const h = 22;
        doc.rect(mLeft, startY, pageW, h).fill(HEADER_BG);
        doc.rect(mLeft, startY, pageW, h).strokeColor(BORDER).lineWidth(0.5).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_DARK);
        let x = mLeft + 4;
        doc.text('#', x, startY + 6, { width: NUM_COL_W, align: 'center', lineBreak: false });
        x += NUM_COL_W;
        columns.forEach(col => {
            const w = getColWidth(col);
            doc.text(col.label, x + 3, startY + 6, { width: w - 6, lineBreak: false });
            x += w;
        });
        return startY + h;
    }

    function drawDataRow(row, idx, startY) {
        const h = 20;
        if (idx % 2 === 1) doc.rect(mLeft, startY, pageW, h).fill(ALT_ROW);
        doc.rect(mLeft, startY, pageW, h).strokeColor(BORDER).lineWidth(0.3).stroke();
        let x = mLeft + 4;
        doc.fontSize(7.5).font('Helvetica').fillColor(TEXT_MUTED).text(String(idx + 1), x, startY + 5, { width: NUM_COL_W, align: 'center', lineBreak: false });
        x += NUM_COL_W;
        columns.forEach(col => {
            const w = getColWidth(col);
            const val = formatValue(row[col.key], col.key);
            if (col.key === 'status' || col.key === 'Status') {
                doc.fillColor(isStatusActive(row[col.key]) ? SUCCESS : DANGER).text(val, x + 3, startY + 5, { width: w - 6, lineBreak: false });
            } else {
                doc.fillColor(TEXT_DARK).text(val.substring(0, 60), x + 3, startY + 5, { width: w - 6, lineBreak: false });
            }
            x += w;
        });
        return startY + h;
    }

    y = drawTableHeader(y);
    for (let i = 0; i < rows.length; i++) {
        if (y + 22 > getBottomLimit()) { y = addNewPage(); y = drawTableHeader(y); }
        y = drawDataRow(rows[i], i, y);
    }

    drawFooterOnCurrentPage();
    doc.end();
}

module.exports = { generate };