/* QR + Barcode Helper */
function generateQR(el, text, size) {
    size = size || 200;
    if (!text) { el.innerHTML = '<div style="padding:20px;color:#94a3b8;">No data</div>'; return; }
    try {
        var qr = qrcode(0, 'H');
        qr.addData(text);
        qr.make();
        el.innerHTML = qr.createSvgTag(Math.floor(size / qr.getModuleCount()), 0);
        var svg = el.querySelector('svg');
        if (svg) { svg.style.width = size + 'px'; svg.style.height = size + 'px'; }
    } catch (e) { el.innerHTML = '<div style="padding:16px;color:#ef4444;font-size:11px;">QR Error</div>'; }
}

function generateBarcode(el, text) {
    if (!text) { el.innerHTML = '<div style="padding:20px;color:#94a3b8;">No data</div>'; return; }
    try {
        var canvas = document.createElement('canvas');
        el.innerHTML = '';
        el.appendChild(canvas);
        // Auto-adjust width based on text length to fit popup
        var barWidth = text.length > 20 ? 1 : text.length > 12 ? 1.5 : 2;
        JsBarcode(canvas, text, { format: 'CODE128', width: barWidth, height: 50, displayValue: true, fontSize: 11, margin: 4 });
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
    } catch (e) { el.innerHTML = '<div style="padding:16px;color:#ef4444;font-size:11px;">Barcode Error</div>'; }
}

/**
 * Show QR/Barcode popup with tabs
 * @param {string} qrVal - value to encode
 * @param {string} title - bold title
 * @param {string} subtitle - description
 * @param {string} extra - small extra text
 */
function showCodePopup(qrVal, title, subtitle, extra) {
    var $m = $('#codeModal');
    if (!$m.length) {
        $('body').append(
            '<div class="modal fade" id="codeModal" tabindex="-1">' +
            '<div class="modal-dialog modal-dialog-centered" style="max-width:420px;">' +
            '<div class="modal-content">' +
            '<div class="modal-header py-2">' +
            '  <ul class="nav nav-tabs card-header-tabs" style="font-size:13px;" id="codeTabNav">' +
            '    <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#codeTabBar"><i class="bi bi-upc me-1"></i>Barcode</a></li>' +
            '    <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#codeTabQR"><i class="bi bi-qr-code me-1"></i>QR Code</a></li>' +
            '  </ul>' +
            '  <button type="button" class="btn-close ms-auto" data-bs-dismiss="modal"></button>' +
            '</div>' +
            '<div class="modal-body text-center p-4">' +
            '  <div class="tab-content">' +
            '    <div class="tab-pane fade show active" id="codeTabBar"><div id="codeBarCanvas" style="display:inline-block;padding:12px;background:#fff;border-radius:10px;border:2px solid #e2e8f0;max-width:100%;overflow:hidden;"></div></div>' +
            '    <div class="tab-pane fade" id="codeTabQR"><div id="codeQrCanvas" style="display:inline-block;padding:12px;background:#fff;border-radius:10px;border:2px solid #e2e8f0;"></div></div>' +
            '  </div>' +
            '  <div id="codeInfo" style="margin-top:12px;"></div>' +
            '</div>' +
            '<div class="modal-footer py-2 justify-content-center gap-2">' +
            '  <button type="button" class="btn btn-sm btn-primary" onclick="printCode()"><i class="bi bi-printer me-1"></i>Print (Paper)</button>' +
            '  <button type="button" class="btn btn-sm btn-purple" id="btnLabelPrint" onclick="printToLabel()" style="background:#7c3aed;color:#fff;border:none;"><i class="bi bi-tag me-1"></i>Label Printer</button>' +
            '  <button type="button" class="btn btn-ghost-secondary btn-sm" data-bs-dismiss="modal">Close</button>' +
            '</div>' +
            '</div></div></div>'
        );
        $m = $('#codeModal');
    }

    // Store data for label printing
    _codePopupData = { qrVal: qrVal, title: title, subtitle: subtitle, extra: extra };

    // Generate QR
    generateQR($('#codeQrCanvas')[0], qrVal, 200);
    // Generate Barcode
    generateBarcode($('#codeBarCanvas')[0], qrVal);

    // Info
    var e = typeof H !== 'undefined' ? H.esc : function(s) { return String(s || ''); };
    var h = '<div style="font-size:18px;font-weight:800;margin-bottom:4px;">' + e(title) + '</div>';
    h += '<div style="font-size:13px;color:#475569;font-weight:600;">' + e(subtitle) + '</div>';
    if (extra) h += '<div style="font-size:11px;color:#94a3b8;margin-top:4px;">' + e(extra) + '</div>';
    $('#codeInfo').html(h);

    // Reset to Barcode tab (first/default)
    $('#codeTabNav a:first').tab('show');
    bootstrap.Modal.getOrCreateInstance($m[0]).show();
}

// Store current popup data for label printing
var _codePopupData = {};

function printToLabel(type) {
    var d = _codePopupData;
    if (!d.qrVal) return;

    // Auto-detect type from active tab if not specified
    if (!type) {
        var isBarTab = $('#codeTabBar').hasClass('show') || $('#codeTabBar').hasClass('active');
        if (isBarTab) type = 'barcode';
        else if (d.qrVal.indexOf('|') !== -1) type = 'unit';
        else type = 'id';
    }

    if (typeof WebLabelPrinter === 'undefined') {
        toastr.error('Label printer module not loaded.');
        return;
    }

    var promise;
    if (type === 'id') {
        promise = WebLabelPrinter.printQrInternalId(d.qrVal);
    } else if (type === 'unit') {
        var parts = d.qrVal.split('|');
        promise = WebLabelPrinter.printQrUnit(parts[0], parts[1]);
    } else if (type === 'loc' || type === 'barcode') {
        promise = WebLabelPrinter.printBarcode(d.qrVal);
    } else {
        promise = WebLabelPrinter.printQrInternalId(d.qrVal);
    }
    promise
        .then(function() { toastr.success('Label printed!'); })
        .catch(function(e) { toastr.error(e.message || 'Print failed.'); });
}

function printCode() {
    // Print whichever tab is active
    var activeTab = $('#codeTabQR').hasClass('show') ? 'qr' : 'bar';
    var codeHtml = activeTab === 'qr' ? $('#codeQrCanvas').html() : $('#codeBarCanvas').html();
    var infoHtml = $('#codeInfo').html();
    var w = window.open('', '_blank', 'width=302,height=500');
    w.document.write(
        '<html><head><title>Print</title><style>' +
        '@page{size:80mm auto;margin:2mm;}' +
        'body{font-family:Arial,sans-serif;text-align:center;padding:4mm 2mm;margin:0;width:76mm;}' +
        'svg,img,canvas{max-width:60mm!important;height:auto!important;}' +
        'div{font-size:10pt;line-height:1.3;}' +
        '</style></head><body>' +
        '<div style="padding:4px;">' + codeHtml + '</div>' +
        '<div style="margin-top:6px;">' + infoHtml + '</div>' +
        '</body></html>'
    );
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
}

/* Auto-check Print Agent on page load (silent) */
$(function() {
    if (typeof WebLabelPrinter !== 'undefined') {
        WebLabelPrinter.autoConnect();
    }
});
