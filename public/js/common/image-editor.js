/**
 * SMS Image Editor — Fabric.js based
 * Usage:
 *   SMS_ImageEditor.open({
 *     imageUrl: '/uploads/photo.jpg',
 *     onSave: function(blob, dataUrl) { ... }
 *   });
 */
window.SMS_ImageEditor = (function($) {
    'use strict';

    var _canvas = null;
    var _cropRect = null;
    var _isCropping = false;
    var _drawingMode = null;
    var _history = [];
    var _historyIdx = -1;
    var _savingState = false;
    var _onSave = null;
    var _startPoint = null;
    var _activeColor = '#ff0000';
    var _activeStroke = 3;
    var _tempShape = null;
    var _bgColor = '#ffffff';
    var _canvasW = 0;
    var _canvasH = 0;
    var _zoom = 1;
    var _editActions = []; // Track all edit operations for audit log

    var FILTERS = [
        { name: 'None', filter: null },
        { name: 'Grayscale', filter: function() { return new fabric.Image.filters.Grayscale(); } },
        { name: 'Sepia', filter: function() { return new fabric.Image.filters.Sepia(); } },
        { name: 'Brightness +', filter: function() { return new fabric.Image.filters.Brightness({ brightness: 0.15 }); } },
        { name: 'Brightness -', filter: function() { return new fabric.Image.filters.Brightness({ brightness: -0.15 }); } },
        { name: 'Contrast +', filter: function() { return new fabric.Image.filters.Contrast({ contrast: 0.2 }); } },
        { name: 'Blur', filter: function() { return new fabric.Image.filters.Blur({ blur: 0.1 }); } },
        { name: 'Invert', filter: function() { return new fabric.Image.filters.Invert(); } },
        { name: 'Saturation +', filter: function() { return new fabric.Image.filters.Saturation({ saturation: 0.5 }); } },
    ];

    /* ═══════════════════════════════════════════
       BUILD MODAL
       ═══════════════════════════════════════════ */
    function _buildModal() {
        $('#smsImageEditorModal, #ieStyles').remove();

        var css =
        '<style id="ieStyles">' +
        '#smsImageEditorModal .modal-content{background:#111827;border:none;border-radius:0;}' +
        '#smsImageEditorModal .modal-header{background:#1f2937;border-bottom:1px solid #374151;padding:8px 16px;}' +
        '#smsImageEditorModal .modal-title{color:#f9fafb;font-size:14px;font-weight:600;}' +

        '.ie-toolbar-wrap{background:#1f2937;border-bottom:1px solid #374151;}' +
        '.ie-toolbar-row{display:flex;align-items:center;gap:6px;padding:6px 12px;flex-wrap:wrap;}' +
        '.ie-toolbar-row+.ie-toolbar-row{border-top:1px solid #374151;}' +
        '.ie-sep{width:1px;height:22px;background:#4b5563;flex-shrink:0;}' +
        '.ie-label{color:#9ca3af;font-size:11px;font-weight:500;white-space:nowrap;user-select:none;}' +

        '.ie-tool-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;' +
          'border:1px solid #4b5563;border-radius:6px;background:transparent;color:#d1d5db;cursor:pointer;transition:all .15s;font-size:14px;}' +
        '.ie-tool-btn:hover{background:#374151;color:#fff;border-color:#6b7280;}' +
        '.ie-tool-btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff;}' +
        '.ie-tool-btn i{font-size:14px;line-height:1;}' +

        '.ie-action-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;' +
          'border:1px solid #4b5563;border-radius:6px;background:transparent;color:#d1d5db;cursor:pointer;' +
          'font-size:12px;font-weight:500;transition:all .15s;white-space:nowrap;}' +
        '.ie-action-btn:hover{background:#374151;color:#fff;}' +
        '.ie-action-btn.btn-danger-ie{border-color:#ef4444;color:#ef4444;}' +
        '.ie-action-btn.btn-danger-ie:hover{background:#ef4444;color:#fff;}' +
        '.ie-action-btn.btn-warn-ie{border-color:#f59e0b;color:#f59e0b;}' +
        '.ie-action-btn.btn-warn-ie:hover{background:#f59e0b;color:#fff;}' +

        '.ie-save-btn{padding:6px 16px;border:none;border-radius:6px;background:#3b82f6;color:#fff;font-size:13px;font-weight:600;cursor:pointer;}' +
        '.ie-save-btn:hover{background:#2563eb;}' +
        '.ie-cancel-btn{padding:6px 14px;border:1px solid #4b5563;border-radius:6px;background:transparent;color:#d1d5db;font-size:13px;cursor:pointer;}' +
        '.ie-cancel-btn:hover{background:#374151;color:#fff;}' +

        '.ie-color-input{width:30px;height:28px;padding:1px;border:2px solid #4b5563;border-radius:6px;cursor:pointer;background:transparent;}' +
        '.ie-color-input::-webkit-color-swatch-wrapper{padding:1px;}' +
        '.ie-color-input::-webkit-color-swatch{border-radius:3px;border:none;}' +
        '.ie-select{padding:4px 6px;font-size:12px;background:#111827;color:#d1d5db;border:1px solid #4b5563;border-radius:6px;outline:none;}' +

        '#ieCanvasWrap{flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;padding:16px;background:#0f172a;}' +
        '#ieCanvasWrap .canvas-container{border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,.4);}' +

        '#ieCropApply{position:fixed;z-index:99999;bottom:24px;left:50%;transform:translateX(-50%);padding:8px 24px;' +
          'background:#10b981;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.4);}' +

        /* BG dropdown — opens DOWNWARD */
        '.ie-bg-wrap{position:relative;display:inline-block;}' +
        '.ie-bg-dd{display:none;position:absolute;top:calc(100% + 6px);left:0;' +
          'background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.6);min-width:180px;}' +
        '.ie-bg-dd.show{display:block;}' +
        '.ie-bg-dd::before{content:"";position:absolute;top:-6px;left:16px;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:6px solid #374151;}' +
        '.ie-bg-swatch{width:28px;height:28px;border-radius:6px;border:2px solid #4b5563;cursor:pointer;display:inline-block;margin:2px;transition:all .15s;}' +
        '.ie-bg-swatch:hover{border-color:#fff;transform:scale(1.1);}' +
        '.ie-bg-swatch.active-sw{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.4);}' +

        /* Zoom label */
        '.ie-zoom-label{color:#9ca3af;font-size:11px;min-width:36px;text-align:center;user-select:none;}' +

        /* Responsive */
        '@media(max-width:991px){.ie-toolbar-row{gap:4px;padding:5px 10px;}.ie-tool-btn{width:30px;height:30px;font-size:13px;}.ie-action-btn .ie-btn-text{display:none;}}' +
        '@media(max-width:575px){' +
          '#smsImageEditorModal .modal-header{padding:6px 10px;}' +
          '.ie-toolbar-row{gap:3px;padding:4px 6px;}' +
          '.ie-tool-btn{width:28px;height:28px;font-size:12px;}' +
          '.ie-sep{height:18px;}' +
          '.ie-label{display:none;}' +
          '.ie-color-input{width:26px;height:24px;}' +
          '.ie-select{font-size:11px;padding:3px 4px;max-width:70px;}' +
          '.ie-action-btn{padding:3px 6px;font-size:10px;}' +
          '.ie-action-btn .ie-btn-text{display:none;}' +
          '.ie-save-btn,.ie-cancel-btn{padding:5px 10px;font-size:12px;}' +
          '#ieCanvasWrap{padding:6px;}' +
          '.ie-bg-dd{min-width:150px;padding:8px;}' +
        '}' +
        '</style>';

        var h = css +
        '<div class="modal fade" id="smsImageEditorModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">' +
        '<div class="modal-dialog modal-fullscreen"><div class="modal-content">' +

        /* Header */
        '<div class="modal-header">' +
        '<h6 class="modal-title"><i class="bi bi-brush me-2"></i>Image Editor</h6>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-left:auto;">' +
        '<button type="button" class="btn btn-sm btn-outline-secondary sms-ie-cancel" style="color:#d1d5db;border-color:#4b5563;">Cancel</button>' +
        '<button type="button" class="btn btn-sm btn-primary sms-ie-save"><i class="bi bi-check-lg me-1"></i>Save</button>' +
        '</div></div>' +
        /* Save options bar (hidden by default) — uses project design */
        '<div id="ieSaveBar" style="display:none;background:var(--tblr-primary,#0054a6);padding:10px 16px;">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<span style="color:#fff;font-size:12px;font-weight:600;"><i class="bi bi-save me-1"></i>Save as:</span>' +
        '<button type="button" class="btn btn-sm btn-warning sms-ie-save-replace"><i class="bi bi-arrow-repeat me-1"></i>Replace Original</button>' +
        '<button type="button" class="btn btn-sm btn-success sms-ie-save-new"><i class="bi bi-plus-lg me-1"></i>Save as New Image</button>' +
        '<button type="button" class="btn btn-sm btn-outline-light sms-ie-save-cancel">Back to Editor</button>' +
        '<span id="ieSaveMsg" style="font-size:11px;margin-left:8px;color:#fff;"></span>' +
        '</div></div>' +

        '<div class="modal-body p-0 d-flex flex-column" style="overflow:hidden;">' +

        /* Row 1: Drawing tools + Color + Size + Filter */
        '<div class="ie-toolbar-wrap">' +
        '<div class="ie-toolbar-row">' +
        '<span class="ie-label">Tools</span>' +
        '<button type="button" class="ie-tool-btn sms-ie-tool active" data-tool="select" title="Select / Move"><i class="bi bi-cursor"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-tool" data-tool="crop" title="Crop"><i class="bi bi-crop"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-tool" data-tool="arrow" title="Arrow"><i class="bi bi-arrow-up-right"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-tool" data-tool="circle" title="Circle"><i class="bi bi-circle"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-tool" data-tool="rect" title="Rectangle"><i class="bi bi-square"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-tool" data-tool="text" title="Add Text"><i class="bi bi-fonts"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-tool" data-tool="draw" title="Freehand"><i class="bi bi-pencil"></i></button>' +
        '<div class="ie-sep"></div>' +
        '<span class="ie-label">Color</span>' +
        '<input type="color" id="ieColor" value="#ff0000" class="ie-color-input" title="Color"/>' +
        '<span class="ie-label">Size</span>' +
        '<select id="ieStroke" class="ie-select" style="width:58px;">' +
        '<option value="1">1</option><option value="2">2</option><option value="3" selected>3</option><option value="5">5</option><option value="8">8</option><option value="12">12</option></select>' +
        '<div class="ie-sep"></div>' +
        '<span class="ie-label">Filter</span>' +
        '<select id="ieFilter" class="ie-select" style="width:100px;"><option value="0">None</option>';
        FILTERS.forEach(function(f, i) { if (i > 0) h += '<option value="' + i + '">' + f.name + '</option>'; });
        h += '</select></div>' +

        /* Row 2: Rotate, Undo/Redo, Zoom, Delete, Background */
        '<div class="ie-toolbar-row">' +
        '<span class="ie-label">Rotate</span>' +
        '<button type="button" class="ie-tool-btn sms-ie-rotate-left" title="Rotate Left 90°"><i class="bi bi-arrow-counterclockwise"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-rotate-right" title="Rotate Right 90°"><i class="bi bi-arrow-clockwise"></i></button>' +
        '<div class="ie-sep"></div>' +
        '<button type="button" class="ie-tool-btn sms-ie-undo" title="Undo"><i class="bi bi-arrow-return-left"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-redo" title="Redo"><i class="bi bi-arrow-return-right"></i></button>' +
        '<div class="ie-sep"></div>' +
        /* Zoom */
        '<span class="ie-label">Zoom</span>' +
        '<button type="button" class="ie-tool-btn sms-ie-zoom-out" title="Zoom Out"><i class="bi bi-dash"></i></button>' +
        '<span class="ie-zoom-label" id="ieZoomLabel">100%</span>' +
        '<button type="button" class="ie-tool-btn sms-ie-zoom-in" title="Zoom In"><i class="bi bi-plus"></i></button>' +
        '<button type="button" class="ie-tool-btn sms-ie-zoom-reset" title="Reset Zoom" style="font-size:11px;width:auto;padding:0 6px;">Fit</button>' +
        '<div class="ie-sep"></div>' +
        '<button type="button" class="ie-action-btn btn-danger-ie sms-ie-delete" title="Delete selected (or press Delete key)"><i class="bi bi-trash3"></i><span class="ie-btn-text">Delete</span></button>' +
        '<div class="ie-sep"></div>' +
        /* Background dropdown */
        '<div class="ie-bg-wrap">' +
        '<button type="button" class="ie-action-btn btn-warn-ie sms-ie-bg-toggle" title="Background"><i class="bi bi-palette"></i><span class="ie-btn-text">Background</span></button>' +
        '<div class="ie-bg-dd" id="ieBgDd">' +
        '<div style="color:#9ca3af;font-size:11px;font-weight:600;margin-bottom:6px;">Set Background</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:2px;">' +
        '<div class="ie-bg-swatch active-sw" data-bg="#ffffff" style="background:#fff;" title="White"></div>' +
        '<div class="ie-bg-swatch" data-bg="transparent" style="background:repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 50%/10px 10px;" title="Transparent"></div>' +
        '<div class="ie-bg-swatch" data-bg="#000000" style="background:#000;" title="Black"></div>' +
        '<div class="ie-bg-swatch" data-bg="#ef4444" style="background:#ef4444;" title="Red"></div>' +
        '<div class="ie-bg-swatch" data-bg="#3b82f6" style="background:#3b82f6;" title="Blue"></div>' +
        '<div class="ie-bg-swatch" data-bg="#10b981" style="background:#10b981;" title="Green"></div>' +
        '<div class="ie-bg-swatch" data-bg="#f59e0b" style="background:#f59e0b;" title="Yellow"></div>' +
        '<div class="ie-bg-swatch" data-bg="#8b5cf6" style="background:#8b5cf6;" title="Purple"></div>' +
        '</div>' +
        '<div style="margin-top:8px;display:flex;align-items:center;gap:6px;">' +
        '<input type="color" id="ieBgCustom" value="#ffffff" class="ie-color-input" style="width:28px;height:24px;"/>' +
        '<span style="color:#9ca3af;font-size:11px;">Custom color</span></div>' +
        '<div style="margin-top:8px;border-top:1px solid #374151;padding-top:8px;">' +
        '<div style="color:#9ca3af;font-size:11px;font-weight:600;margin-bottom:4px;">Remove Background</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
        '<span style="color:#9ca3af;font-size:10px;white-space:nowrap;">Tolerance</span>' +
        '<input type="range" id="ieBgTolerance" min="5" max="80" value="25" style="flex:1;height:4px;cursor:pointer;accent-color:#f59e0b;"/>' +
        '<span style="color:#d1d5db;font-size:10px;min-width:24px;" id="ieBgTolVal">25</span>' +
        '</div>' +
        '<button type="button" class="ie-action-btn btn-warn-ie sms-ie-bg-remove-white" style="width:100%;justify-content:center;margin-bottom:4px;"><i class="bi bi-eraser me-1"></i>Remove White BG</button>' +
        '<button type="button" class="ie-action-btn btn-warn-ie sms-ie-bg-pick" style="width:100%;justify-content:center;"><i class="bi bi-eyedropper me-1"></i>Click Image to Pick Color</button>' +
        '</div></div></div>' +
        '</div></div>' +

        /* Canvas */
        '<div id="ieCanvasWrap"><canvas id="ieCanvas"></canvas></div>' +
        '</div></div></div></div>';

        $('body').append(h);
    }

    /* ═══════════════════════════════════════════
       STATE MANAGEMENT
       ═══════════════════════════════════════════ */
    function _saveState() {
        if (_savingState || !_canvas) return;
        _savingState = true;
        _historyIdx++;
        _history = _history.slice(0, _historyIdx);
        _history.push(JSON.stringify(_canvas.toJSON(['_isBgImage', '_isCropRect', 'selectable', 'evented'])));
        _savingState = false;
    }

    function _loadState(idx) {
        if (!_canvas || !_history[idx]) return;
        _savingState = true;
        _canvas.loadFromJSON(_history[idx], function() {
            _canvas.renderAll();
            _canvas.forEachObject(function(o) {
                if (o._isBgImage) { o.selectable = false; o.evented = false; }
            });
            _savingState = false;
        });
    }

    function _undo() { if (_historyIdx > 0) { _historyIdx--; _loadState(_historyIdx); } }
    function _redo() { if (_historyIdx < _history.length - 1) { _historyIdx++; _loadState(_historyIdx); } }

    /* ═══════════════════════════════════════════
       TOOL SWITCHING
       ═══════════════════════════════════════════ */
    function _setTool(tool) {
        if (!_canvas) return;
        _drawingMode = tool;
        _isCropping = false;
        _canvas.isDrawingMode = false;
        _canvas.selection = (tool === 'select');
        _canvas.defaultCursor = 'default';

        _canvas.forEachObject(function(o) {
            if (o._isBgImage || o._isCropRect) { o.selectable = false; o.evented = false; return; }
            o.selectable = (tool === 'select');
            o.evented    = (tool === 'select');
        });

        $('.sms-ie-tool').removeClass('active');
        $('[data-tool="' + tool + '"]').addClass('active');

        if (tool !== 'crop' && _cropRect) {
            _canvas.remove(_cropRect); _cropRect = null; $('#ieCropApply').remove();
        }

        switch (tool) {
            case 'draw':
                _canvas.isDrawingMode = true;
                _canvas.freeDrawingBrush.color = _activeColor;
                _canvas.freeDrawingBrush.width = _activeStroke;
                break;
            case 'crop':
                _isCropping = true;
                _canvas.defaultCursor = 'crosshair';
                break;
            case 'text':
                _canvas.defaultCursor = 'text';
                break;
            case 'select':
                break;
            default:
                _canvas.defaultCursor = 'crosshair';
                break;
        }
    }

    /* ═══════════════════════════════════════════
       CROP
       ═══════════════════════════════════════════ */
    function _applyCrop() {
        if (!_cropRect || !_canvas) return;
        _editActions.push('Crop');
        var l = _cropRect.left, t = _cropRect.top;
        var w = _cropRect.width * _cropRect.scaleX;
        var h = _cropRect.height * _cropRect.scaleY;
        _canvas.remove(_cropRect); _cropRect = null; $('#ieCropApply').remove();

        var url = _canvas.toDataURL({ left: l, top: t, width: w, height: h, format: 'png' });
        fabric.Image.fromURL(url, function(img) {
            _canvas.clear();
            _canvasW = w; _canvasH = h;
            _canvas.setWidth(w); _canvas.setHeight(h);
            img.set({ left: 0, top: 0, selectable: false, evented: false, _isBgImage: true });
            _canvas.add(img);
            _canvas.renderAll();
            _saveState();
            _setTool('select');
        });
    }

    /* ═══════════════════════════════════════════
       FILTER
       ═══════════════════════════════════════════ */
    function _applyFilter(idx) {
        if (!_canvas) return;
        if (FILTERS[idx]) _editActions.push('Filter: ' + FILTERS[idx].name);
        var bgImg = null;
        _canvas.forEachObject(function(o) { if (o._isBgImage) bgImg = o; });
        if (!bgImg) return;
        bgImg.filters = [];
        if (FILTERS[idx] && FILTERS[idx].filter) bgImg.filters.push(FILTERS[idx].filter());
        bgImg.applyFilters();
        _canvas.renderAll();
        _saveState();
    }

    /* ═══════════════════════════════════════════
       ARROW (polygon)
       ═══════════════════════════════════════════ */
    function _createArrow(x1, y1, x2, y2, color, sw) {
        var dx = x2 - x1, dy = y2 - y1;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 8) return null;
        var headLen = Math.max(sw * 5, 18);
        var headW   = Math.max(sw * 3.5, 12);
        var shaftW  = Math.max(sw * 1.2, 3);
        var ux = dx / len, uy = dy / len;
        var px = -uy, py = ux;
        var se = Math.max(len - headLen, 0);
        var pts = [
            { x: x1 + px * shaftW / 2,           y: y1 + py * shaftW / 2 },
            { x: x1 + ux * se + px * shaftW / 2, y: y1 + uy * se + py * shaftW / 2 },
            { x: x1 + ux * se + px * headW / 2,  y: y1 + uy * se + py * headW / 2 },
            { x: x2, y: y2 },
            { x: x1 + ux * se - px * headW / 2,  y: y1 + uy * se - py * headW / 2 },
            { x: x1 + ux * se - px * shaftW / 2, y: y1 + uy * se - py * shaftW / 2 },
            { x: x1 - px * shaftW / 2,           y: y1 - py * shaftW / 2 },
        ];
        return new fabric.Polygon(pts, {
            fill: color, stroke: color, strokeWidth: 0,
            selectable: true, evented: true, objectCaching: false
        });
    }

    /* ═══════════════════════════════════════════
       ROTATE (entire canvas)
       ═══════════════════════════════════════════ */
    function _rotateCanvas(deg) {
        if (!_canvas) return;
        _editActions.push('Rotate ' + deg + '°');
        var w = _canvasW, h = _canvasH;
        // Use toDataURL — safe, no DPI issues
        var dataUrl = _canvas.toDataURL({ format: 'png' });
        var im = new Image();
        im.onload = function() {
            var tmp = document.createElement('canvas');
            var ctx = tmp.getContext('2d');
            if (deg === 90 || deg === -90) { tmp.width = h; tmp.height = w; } else { tmp.width = w; tmp.height = h; }
            ctx.save();
            if (deg === 90) ctx.translate(h, 0);
            else if (deg === -90) ctx.translate(0, w);
            ctx.rotate(deg * Math.PI / 180);
            ctx.drawImage(im, 0, 0, w, h);
            ctx.restore();
            fabric.Image.fromURL(tmp.toDataURL('image/png'), function(fImg) {
                _canvas.clear();
                _canvasW = tmp.width; _canvasH = tmp.height;
                _canvas.setWidth(tmp.width); _canvas.setHeight(tmp.height);
                fImg.set({ left: 0, top: 0, selectable: false, evented: false, _isBgImage: true });
                _canvas.add(fImg);
                _canvas.renderAll();
                _saveState();
            });
        };
        im.src = dataUrl;
    }

    /* ═══════════════════════════════════════════
       ZOOM
       ═══════════════════════════════════════════ */
    function _setZoom(z) {
        if (!_canvas) return;
        z = Math.max(0.1, Math.min(5, z));
        _zoom = z;
        _canvas.setZoom(z);
        _canvas.setWidth(_canvasW * z);
        _canvas.setHeight(_canvasH * z);
        _canvas.renderAll();
        $('#ieZoomLabel').text(Math.round(z * 100) + '%');
    }

    /* ═══════════════════════════════════════════
       BACKGROUND
       ═══════════════════════════════════════════ */
    function _setBg(color) {
        if (!_canvas) return;
        _editActions.push('Background: ' + color);
        _bgColor = color;
        if (color === 'transparent') {
            _canvas.backgroundColor = null;
        } else {
            _canvas.backgroundColor = color;
        }
        _canvas.renderAll();
        _saveState();
        $('.ie-bg-swatch').removeClass('active-sw');
        $('.ie-bg-swatch[data-bg="' + color + '"]').addClass('active-sw');
        if (typeof toastr !== 'undefined') {
            toastr.info(color === 'transparent' ? 'Background set to transparent' : 'Background set to ' + color);
        }
    }

    /**
     * Remove background pixels by color match.
     * @param {number[]} targetRGB — [r,g,b] to remove (e.g. [255,255,255] for white)
     * @param {number} tolerance — 0-255, how far a pixel can differ from target
     */
    function _removeBgByColor(targetRGB, tolerance) {
        if (!_canvas) return;
        _editActions.push('BG Remove (rgb ' + targetRGB.join(',') + ', tolerance ' + tolerance + ')');
        var savedZoom = _zoom;
        _canvas.setZoom(1);
        _canvas.setWidth(_canvasW);
        _canvas.setHeight(_canvasH);
        _canvas.backgroundColor = null;
        _canvas.renderAll();

        var w = _canvasW, h = _canvasH;
        var tmp = document.createElement('canvas');
        tmp.width = w; tmp.height = h;
        var ctx = tmp.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(_canvas.lowerCanvasEl, 0, 0, w, h);
        var id = ctx.getImageData(0, 0, w, h);
        var d = id.data;
        var tr = targetRGB[0], tg = targetRGB[1], tb = targetRGB[2];
        var tol = tolerance * tolerance * 3; // squared distance threshold

        for (var i = 0; i < d.length; i += 4) {
            var dr = d[i] - tr, dg = d[i+1] - tg, db = d[i+2] - tb;
            if (dr * dr + dg * dg + db * db <= tol) {
                d[i+3] = 0; // make transparent
            }
        }
        ctx.putImageData(id, 0, 0);

        fabric.Image.fromURL(tmp.toDataURL('image/png'), function(fImg) {
            _canvas.clear();
            _canvas.backgroundColor = null;
            fImg.set({ left: 0, top: 0, selectable: false, evented: false, _isBgImage: true });
            _canvas.add(fImg);
            _canvas.setZoom(savedZoom);
            _canvas.setWidth(_canvasW * savedZoom);
            _canvas.setHeight(_canvasH * savedZoom);
            _canvas.renderAll();
            _bgColor = 'transparent';
            _zoom = savedZoom;
            _saveState();
            $('.ie-bg-swatch').removeClass('active-sw');
            $('.ie-bg-swatch[data-bg="transparent"]').addClass('active-sw');
            if (typeof toastr !== 'undefined') toastr.success('Background removed');
        });
    }

    /* Get pixel color at canvas coordinates */
    function _getPixelColor(x, y) {
        if (!_canvas) return [255, 255, 255];
        var savedZoom = _zoom;
        _canvas.setZoom(1);
        _canvas.setWidth(_canvasW);
        _canvas.setHeight(_canvasH);
        _canvas.renderAll();

        var tmp = document.createElement('canvas');
        tmp.width = _canvasW; tmp.height = _canvasH;
        var ctx = tmp.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(_canvas.lowerCanvasEl, 0, 0, _canvasW, _canvasH);
        var px = Math.round(x), py = Math.round(y);
        if (px < 0) px = 0; if (py < 0) py = 0;
        if (px >= _canvasW) px = _canvasW - 1; if (py >= _canvasH) py = _canvasH - 1;
        var pix = ctx.getImageData(px, py, 1, 1).data;

        // Restore zoom
        _canvas.setZoom(savedZoom);
        _canvas.setWidth(_canvasW * savedZoom);
        _canvas.setHeight(_canvasH * savedZoom);
        _canvas.renderAll();

        return [pix[0], pix[1], pix[2]];
    }

    /* ═══════════════════════════════════════════
       COLOR → selected object
       ═══════════════════════════════════════════ */
    function _applyColorToSelected(color) {
        if (!_canvas) return;
        var obj = _canvas.getActiveObject();
        if (!obj || obj._isBgImage) return;
        var t = obj.type;
        if (t === 'i-text' || t === 'text' || t === 'textbox') {
            obj.set('fill', color);
        } else if (t === 'polygon' || t === 'triangle') {
            obj.set({ fill: color, stroke: color });
        } else if (t === 'path') {
            obj.set('stroke', color);
        } else {
            obj.set('stroke', color);
            if (obj.fill && obj.fill !== 'transparent') obj.set('fill', color);
        }
        _canvas.renderAll();
        _saveState();
    }

    /* ═══════════════════════════════════════════
       DELETE selected
       ═══════════════════════════════════════════ */
    function _deleteSelected() {
        if (!_canvas) return false;
        var obj = _canvas.getActiveObject();
        if (!obj || obj._isBgImage) return false;
        _canvas.remove(obj);
        _canvas.discardActiveObject();
        _canvas.renderAll();
        _saveState();
        return true;
    }

    /* ═══════════════════════════════════════════
       CANVAS EVENTS
       ═══════════════════════════════════════════ */
    function _bindCanvasEvents() {
        if (!_canvas) return;

        _canvas.on('mouse:down', function(o) {
            /* ── BG PICK: click to sample color, then remove ── */
            if (_drawingMode === 'bgpick') {
                var pp = _canvas.getPointer(o.e);
                var tol = parseInt($('#ieBgTolerance').val()) || 25;
                var rgb = _getPixelColor(pp.x, pp.y);
                if (typeof toastr !== 'undefined') toastr.info('Removing color rgb(' + rgb.join(',') + ') with tolerance ' + tol);
                _removeBgByColor(rgb, tol);
                _setTool('select');
                return;
            }

            if (!_drawingMode || _drawingMode === 'select' || _drawingMode === 'draw') return;
            var p = _canvas.getPointer(o.e);
            _startPoint = { x: p.x, y: p.y };

            /* ── TEXT ── */
            if (_drawingMode === 'text') {
                _startPoint = null;
                var posX = p.x, posY = p.y;

                // Use prompt for reliable text input (IText editing doesn't work in Bootstrap modals)
                setTimeout(function() {
                    var userText = prompt('Enter text:');
                    if (!userText || !userText.trim()) return;
                    _editActions.push('Text: "' + userText.trim().substring(0, 30) + '"');
                    var txt = new fabric.IText(userText.trim(), {
                        left: posX, top: posY,
                        fontSize: 28,
                        fill: _activeColor,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        selectable: true,
                        evented: true
                    });
                    _canvas.add(txt);
                    _canvas.setActiveObject(txt);
                    _canvas.renderAll();
                    _saveState();
                    _setTool('select');
                }, 50);
                return;
            }

            /* ── CROP ── */
            if (_drawingMode === 'crop') {
                if (_cropRect) _canvas.remove(_cropRect);
                _cropRect = new fabric.Rect({
                    left: p.x, top: p.y, width: 1, height: 1,
                    fill: 'rgba(59,130,246,0.12)', stroke: '#3b82f6', strokeWidth: 2,
                    strokeDashArray: [6, 4], selectable: false, evented: false, _isCropRect: true
                });
                _canvas.add(_cropRect);
                return;
            }

            /* ── SHAPES ── */
            if (_drawingMode === 'arrow') {
                _tempShape = new fabric.Line([p.x, p.y, p.x, p.y], {
                    stroke: _activeColor, strokeWidth: Math.max(_activeStroke, 2),
                    strokeDashArray: [4, 3], selectable: false, evented: false
                });
            } else if (_drawingMode === 'circle') {
                _tempShape = new fabric.Circle({
                    left: p.x, top: p.y, radius: 1,
                    fill: 'transparent', stroke: _activeColor, strokeWidth: _activeStroke, selectable: false, evented: false
                });
            } else if (_drawingMode === 'rect') {
                _tempShape = new fabric.Rect({
                    left: p.x, top: p.y, width: 1, height: 1,
                    fill: 'transparent', stroke: _activeColor, strokeWidth: _activeStroke, selectable: false, evented: false
                });
            }
            if (_tempShape) _canvas.add(_tempShape);
        });

        _canvas.on('mouse:move', function(o) {
            if (!_startPoint) return;
            var p = _canvas.getPointer(o.e);

            if (_isCropping && _cropRect) {
                _cropRect.set({ width: Math.abs(p.x - _startPoint.x), height: Math.abs(p.y - _startPoint.y),
                    left: Math.min(p.x, _startPoint.x), top: Math.min(p.y, _startPoint.y) });
                _canvas.renderAll(); return;
            }
            if (!_tempShape) return;

            if (_drawingMode === 'arrow') {
                _tempShape.set({ x2: p.x, y2: p.y });
            } else if (_drawingMode === 'circle') {
                var dx = p.x - _startPoint.x, dy = p.y - _startPoint.y;
                var r = Math.sqrt(dx * dx + dy * dy) / 2;
                _tempShape.set({ radius: r, left: (_startPoint.x + p.x)/2 - r, top: (_startPoint.y + p.y)/2 - r });
            } else if (_drawingMode === 'rect') {
                _tempShape.set({ width: Math.abs(p.x - _startPoint.x), height: Math.abs(p.y - _startPoint.y),
                    left: Math.min(p.x, _startPoint.x), top: Math.min(p.y, _startPoint.y) });
            }
            _canvas.renderAll();
        });

        _canvas.on('mouse:up', function(o) {
            if (_isCropping && _cropRect && _cropRect.width > 5 && _cropRect.height > 5) {
                $('#ieCropApply').remove();
                $('body').append('<button id="ieCropApply"><i class="bi bi-check-lg me-1"></i>Apply Crop</button>');
                $('#ieCropApply').on('click', function() { _applyCrop(); });
                _startPoint = null; return;
            }

            if (_drawingMode === 'arrow' && _tempShape && _startPoint) {
                var ep = _canvas.getPointer(o.e);
                _canvas.remove(_tempShape);
                var arr = _createArrow(_startPoint.x, _startPoint.y, ep.x, ep.y, _activeColor, _activeStroke);
                if (arr) { _canvas.add(arr); _editActions.push('Arrow'); }
                _canvas.renderAll();
                _saveState();
                _setTool('select');
                _startPoint = null; _tempShape = null;
                return;
            }

            if (_tempShape) {
                _editActions.push(_drawingMode === 'circle' ? 'Circle' : _drawingMode === 'rect' ? 'Rectangle' : 'Shape');
                _tempShape.set({ selectable: true, evented: true });
                _canvas.renderAll();
                _saveState();
                _setTool('select');
            }
            _startPoint = null; _tempShape = null;
        });

        /* Text editing done (double-click edit) */
        _canvas.on('text:editing:exited', function(e) {
            if (e.target && !e.target.text.trim()) {
                _canvas.remove(e.target);
            }
            _saveState();
            _setTool('select');
        });

        /* Freehand done */
        _canvas.on('path:created', function() { _editActions.push('Freehand Draw'); _saveState(); });

        /* Object modified */
        _canvas.on('object:modified', function() { _saveState(); });

        /* Mouse wheel zoom */
        _canvas.on('mouse:wheel', function(opt) {
            var delta = opt.e.deltaY;
            var z = _zoom + (delta > 0 ? -0.1 : 0.1);
            _setZoom(z);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
    }

    /* ═══════════════════════════════════════════
       KEYBOARD EVENTS
       ═══════════════════════════════════════════ */
    function _onKeyDown(e) {
        if (!_canvas) return;

        // Don't intercept if user is typing in IText
        var active = _canvas.getActiveObject();
        if (active && active.isEditing) return;

        // Delete / Backspace → delete selected
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Don't delete if focus is in an input/select
            var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
            if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
            if (_deleteSelected()) {
                e.preventDefault();
            }
        }

        // Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); _undo(); }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); _redo(); }
    }

    /* ═══════════════════════════════════════════
       TOOLBAR EVENTS
       ═══════════════════════════════════════════ */
    function _bindToolbarEvents() {
        $(document).off('.smsie');
        $(document).off('keydown.smsie');
        $(document).on('keydown.smsie', _onKeyDown);

        $(document).on('click.smsie', '.sms-ie-tool', function(e) { e.preventDefault(); _setTool($(this).data('tool')); });

        $(document).on('change.smsie', '#ieColor', function() {
            _activeColor = $(this).val();
            if (_canvas && _canvas.isDrawingMode) _canvas.freeDrawingBrush.color = _activeColor;
            _applyColorToSelected(_activeColor);
        });

        $(document).on('change.smsie', '#ieStroke', function() {
            _activeStroke = parseInt($(this).val());
            if (_canvas && _canvas.isDrawingMode) _canvas.freeDrawingBrush.width = _activeStroke;
        });

        $(document).on('change.smsie', '#ieFilter', function() { _applyFilter(parseInt($(this).val())); });
        $(document).on('click.smsie', '.sms-ie-undo', function(e) { e.preventDefault(); _undo(); });
        $(document).on('click.smsie', '.sms-ie-redo', function(e) { e.preventDefault(); _redo(); });

        $(document).on('click.smsie', '.sms-ie-delete', function(e) {
            e.preventDefault();
            if (!_deleteSelected()) {
                if (typeof toastr !== 'undefined') toastr.warning('Select an element first');
            }
        });

        $(document).on('click.smsie', '.sms-ie-rotate-left', function(e) { e.preventDefault(); _rotateCanvas(-90); });
        $(document).on('click.smsie', '.sms-ie-rotate-right', function(e) { e.preventDefault(); _rotateCanvas(90); });

        /* Zoom */
        $(document).on('click.smsie', '.sms-ie-zoom-in', function(e) { e.preventDefault(); _setZoom(_zoom + 0.25); });
        $(document).on('click.smsie', '.sms-ie-zoom-out', function(e) { e.preventDefault(); _setZoom(_zoom - 0.25); });
        $(document).on('click.smsie', '.sms-ie-zoom-reset', function(e) { e.preventDefault(); _setZoom(1); });

        /* Background */
        $(document).on('click.smsie', '.sms-ie-bg-toggle', function(e) { e.preventDefault(); e.stopPropagation(); $('#ieBgDd').toggleClass('show'); });
        $(document).on('click.smsie', function(e) { if (!$(e.target).closest('.sms-ie-bg-toggle, #ieBgDd').length) $('#ieBgDd').removeClass('show'); });
        $(document).on('click.smsie', '.ie-bg-swatch', function(e) { e.preventDefault(); _setBg(String($(this).data('bg'))); });
        $(document).on('change.smsie', '#ieBgCustom', function() { _setBg($(this).val()); });
        $(document).on('input.smsie', '#ieBgTolerance', function() { $('#ieBgTolVal').text($(this).val()); });

        // Remove white background
        $(document).on('click.smsie', '.sms-ie-bg-remove-white', function(e) {
            e.preventDefault();
            var tol = parseInt($('#ieBgTolerance').val()) || 25;
            _removeBgByColor([255, 255, 255], tol);
            $('#ieBgDd').removeClass('show');
        });

        // Pick color from image mode
        $(document).on('click.smsie', '.sms-ie-bg-pick', function(e) {
            e.preventDefault();
            $('#ieBgDd').removeClass('show');
            _drawingMode = 'bgpick';
            _canvas.defaultCursor = 'crosshair';
            _canvas.selection = false;
            _canvas.forEachObject(function(o) { o.selectable = false; o.evented = false; });
            if (typeof toastr !== 'undefined') toastr.info('Click on the background color you want to remove');
        });

        $(document).on('click.smsie', '.sms-ie-cancel', function(e) {
            e.preventDefault();
            var m = bootstrap.Modal.getInstance($('#smsImageEditorModal')[0]);
            if (m) m.hide();
        });

        // Save button → show save options bar (don't close yet!)
        $(document).on('click.smsie', '.sms-ie-save', function(e) {
            e.preventDefault();
            $('#ieSaveBar').slideDown(200);
            $('#ieSaveMsg').html('');
        });

        // Cancel save options
        $(document).on('click.smsie', '.sms-ie-save-cancel', function(e) {
            e.preventDefault();
            $('#ieSaveBar').slideUp(200);
        });

        // Helper: generate blob from canvas
        function _getBlob() {
            if (!_canvas) return null;
            _canvas.discardActiveObject();
            _canvas.setZoom(1);
            _canvas.setWidth(_canvasW);
            _canvas.setHeight(_canvasH);
            _canvas.renderAll();
            var url = _canvas.toDataURL({ format: 'png', quality: 0.92 });
            var bs = atob(url.split(',')[1]);
            var mime = url.split(',')[0].split(':')[1].split(';')[0];
            var ab = new ArrayBuffer(bs.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < bs.length; i++) ia[i] = bs.charCodeAt(i);
            // Restore zoom after export
            _canvas.setZoom(_zoom);
            _canvas.setWidth(_canvasW * _zoom);
            _canvas.setHeight(_canvasH * _zoom);
            _canvas.renderAll();
            return new Blob([ab], { type: mime });
        }

        // Replace Original
        $(document).on('click.smsie', '.sms-ie-save-replace', function(e) {
            e.preventDefault();
            var blob = _getBlob();
            if (!blob) return;
            if (_onSave) {
                var result = _onSave(blob, null, 'replace', _editActions.slice());
                if (result === false) return;
            }
            var m = bootstrap.Modal.getInstance($('#smsImageEditorModal')[0]);
            if (m) m.hide();
        });

        // Save as New
        $(document).on('click.smsie', '.sms-ie-save-new', function(e) {
            e.preventDefault();
            var blob = _getBlob();
            if (!blob) return;
            if (_onSave) {
                var result = _onSave(blob, null, 'new', _editActions.slice());
                if (result === false) return;
            }
            var m = bootstrap.Modal.getInstance($('#smsImageEditorModal')[0]);
            if (m) m.hide();
        });
    }

    /* ═══════════════════════════════════════════
       OPEN
       ═══════════════════════════════════════════ */
    function open(opts) {
        if (!opts || !opts.imageUrl) return;
        _onSave = opts.onSave || null;
        _buildModal();
        _history = []; _historyIdx = -1; _drawingMode = null; _isCropping = false;
        _cropRect = null; _startPoint = null; _tempShape = null;
        _activeColor = '#ff0000'; _activeStroke = 3; _bgColor = '#ffffff'; _savingState = false; _zoom = 1; _editActions = [];

        $('#ieColor').val('#ff0000'); $('#ieStroke').val('3'); $('#ieFilter').val('0');
        $('#ieCropApply').remove(); $('#ieBgDd').removeClass('show'); $('#ieZoomLabel').text('100%');

        _bindToolbarEvents();

        var $modal = $('#smsImageEditorModal');
        var modal = new bootstrap.Modal($modal[0], { backdrop: 'static', keyboard: false });

        $modal.off('shown.bs.modal.ie').on('shown.bs.modal.ie', function() {
            var $w = $('#ieCanvasWrap');
            var maxW = $w.width() - 32;
            var maxH = $w.height() - 32;

            if (_canvas) { try { _canvas.dispose(); } catch(e){} _canvas = null; }

            $('#ieCanvasWrap').html('<canvas id="ieCanvas"></canvas>');
            _canvas = new fabric.Canvas('ieCanvas', { backgroundColor: '#ffffff' });

            fabric.Image.fromURL(opts.imageUrl, function(img) {
                if (!img || !img.width) {
                    if (typeof toastr !== 'undefined') toastr.error('Failed to load image.');
                    return;
                }
                var scale = Math.min(maxW / img.width, maxH / img.height, 1);
                var w = Math.round(img.width * scale);
                var h = Math.round(img.height * scale);
                _canvasW = w; _canvasH = h;
                _canvas.setWidth(w); _canvas.setHeight(h);
                img.set({ left: 0, top: 0, scaleX: scale, scaleY: scale, selectable: false, evented: false, _isBgImage: true });
                _canvas.add(img);
                _canvas.renderAll();
                _saveState();
                _setTool('select');
                _bindCanvasEvents();
            }, { crossOrigin: 'anonymous' });
        });

        $modal.off('hidden.bs.modal.ie').on('hidden.bs.modal.ie', function() {
            $(document).off('.smsie');
            $(document).off('keydown.smsie');
            $('#ieCropApply').remove();
            if (_canvas) { try { _canvas.dispose(); } catch(e){} _canvas = null; }
        });

        modal.show();
    }

    return { open: open };
}(jQuery));
