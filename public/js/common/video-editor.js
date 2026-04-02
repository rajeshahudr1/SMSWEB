/**
 * SMS Video Editor — FFmpeg WASM based (Pipeline Mode)
 *
 * All operations chain together: each result becomes the new source.
 * User applies operations one by one, previews result, then saves.
 *
 * Usage:
 *   SMS_VideoEditor.open({
 *     videoUrl: '/uploads/video.mp4',
 *     fileName: 'video.mp4',
 *     onSave: function(blob, filename) { ... }
 *   });
 */
window.SMS_VideoEditor = (function($) {
    'use strict';

    var _ffmpeg = null;
    var _loaded = false;
    var _loading = false;
    var _onSave = null;
    var _fileName = '';
    var _originalBlob = null; // original video
    var _currentBlob = null;  // current working video (after applied operations)
    var _processing = false;
    var _opCount = 0; // how many operations applied

    /* ═══════════════════════════════════════════
       LOAD FFMPEG
       ═══════════════════════════════════════════ */
    async function _ensureLoaded($status) {
        if (_loaded) return true;
        if (_loading) { if ($status) $status.html('<span class="text-warning">Loading in progress...</span>'); return false; }
        if (typeof FFmpeg === 'undefined' || !FFmpeg.createFFmpeg) {
            if ($status) $status.html('<span class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>FFmpeg not available. Refresh page.</span>');
            return false;
        }
        _loading = true;
        if ($status) $status.html('<div class="d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm text-info"></span><span>Loading video engine (~31MB first time)...</span></div>');
        try {
            _ffmpeg = FFmpeg.createFFmpeg({ log: false, corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' });
            await _ffmpeg.load();
            _loaded = true; _loading = false;
            if ($status) $status.html('<span class="text-success"><i class="bi bi-check-circle me-1"></i>Engine ready</span>');
            return true;
        } catch (e) {
            _loading = false;
            if ($status) $status.html('<span class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>' + (e.message || 'Load failed') + '</span>');
            return false;
        }
    }

    /* ═══════════════════════════════════════════
       RUN FFMPEG
       ═══════════════════════════════════════════ */
    function _lockUI() {
        _processing = true;
        // Disable all tool buttons + show overlay
        $('#smsVideoEditorModal .btn, .ve-btn, .ve-save-btn, .ve-cancel-btn').attr('disabled', true).css('opacity', '.5');
        if (!$('#veOverlay').length) {
            $('#smsVideoEditorModal .ve-tools-grid').css('position','relative').append(
                '<div id="veOverlay" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(17,24,39,.7);z-index:10;display:flex;align-items:center;justify-content:center;border-radius:8px;">' +
                '<div class="text-center text-white"><div class="spinner-border mb-2"></div><div style="font-size:13px;font-weight:600;">Processing video...</div><div class="text-muted small">This may take a while</div></div></div>'
            );
        }
    }
    function _unlockUI() {
        _processing = false;
        $('#smsVideoEditorModal .btn, .ve-btn, .ve-save-btn, .ve-cancel-btn').attr('disabled', false).css('opacity', '');
        $('#veOverlay').remove();
    }

    async function _run(inputBlob, args, outName) {
        if (!_ffmpeg || !_loaded || _processing) return null;
        _lockUI();
        _setStatus('<div class="d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm text-primary"></span><span>Processing... please wait</span></div>');
        var inName = 'input' + _getExt(_fileName);
        try {
            _ffmpeg.FS('writeFile', inName, new Uint8Array(await inputBlob.arrayBuffer()));
            await _ffmpeg.run.apply(_ffmpeg, ['-i', inName].concat(args).concat([outName]));
            var out = _ffmpeg.FS('readFile', outName);
            try { _ffmpeg.FS('unlink', inName); } catch(e){}
            try { _ffmpeg.FS('unlink', outName); } catch(e){}
            var mime = outName.endsWith('.mp3') ? 'audio/mpeg' : outName.endsWith('.gif') ? 'image/gif' : 'video/mp4';
            var blob = new Blob([out.buffer], { type: mime });
            _unlockUI();
            return blob;
        } catch (e) {
            _unlockUI();
            try { _ffmpeg.FS('unlink', inName); } catch(ex){}
            try { _ffmpeg.FS('unlink', outName); } catch(ex){}
            _setStatus('<span class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Error: ' + (e.message || 'Failed') + '</span>');
            return null;
        }
    }

    /* Apply operation → result becomes new current video */
    async function _applyOp(args, outName, label) {
        if (!_currentBlob) return;
        var result = await _run(_currentBlob, args, outName || 'output.mp4');
        if (result) {
            _currentBlob = result;
            _opCount++;
            _updatePlayer();
            _updateOpBadge();
            _setStatus('<span class="text-success"><i class="bi bi-check-circle me-1"></i>' + label + ' applied! (' + _fmtSize(result.size) + ') — ' + _opCount + ' operation(s) total</span>');
        }
    }

    /* Apply operation but output to separate file (audio/gif) — doesn't replace current video */
    async function _exportOp(args, outName, label) {
        if (!_currentBlob) return;
        var result = await _run(_currentBlob, args, outName);
        if (result) {
            _showExport(result, outName, label);
        }
    }

    function _getExt(name) { var m = name.match(/\.[a-zA-Z0-9]+$/); return m ? m[0].toLowerCase() : '.mp4'; }
    function _fmtSize(b) { return b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }
    function _fmtTime(s) {
        if (!s || isNaN(s)) return '00:00:00';
        var h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
        return (h<10?'0':'')+h+':'+(m<10?'0':'')+m+':'+(sec<10?'0':'')+sec;
    }
    function _setStatus(html) { $('#veStatus').html(html); }

    function _updatePlayer() {
        var $p = $('#veEditorPlayer');
        if (!$p.length || !_currentBlob) return;
        var old = $p.attr('src');
        if (old) URL.revokeObjectURL(old);
        var url = URL.createObjectURL(_currentBlob);
        $p.attr('src', url);
        $p[0].load();
    }

    function _updateOpBadge() {
        var $b = $('#veOpCount');
        $b.text(_opCount + ' edit(s)').toggle(_opCount > 0);
        $('#veResetBtn, #veSaveNewBtn, #veSaveReplaceBtn').toggle(_opCount > 0);
    }

    function _showExport(blob, name, label) {
        var $area = $('#veExportArea');
        var url = URL.createObjectURL(blob);
        var h = '<div class="ve-card" style="border-color:#10b981;">' +
            '<div class="ve-card-title" style="color:#10b981;"><i class="bi bi-download me-1"></i>' + label + '</div>';
        if (name.endsWith('.mp3')) h += '<audio src="' + url + '" controls style="width:100%;"></audio>';
        else if (name.endsWith('.gif')) h += '<img src="' + url + '" style="max-width:100%;max-height:150px;border-radius:4px;"/>';
        else h += '<video src="' + url + '" controls playsinline style="max-width:100%;max-height:150px;border-radius:4px;"></video>';
        h += '<div class="mt-2"><button class="ve-btn ve-btn-success ve-dl-export" data-url="' + url + '" data-name="' + name + '"><i class="bi bi-download me-1"></i>Download (' + _fmtSize(blob.size) + ')</button></div></div>';
        $area.append(h);
        $area[0].scrollIntoView({ behavior: 'smooth' });
    }

    /* ═══════════════════════════════════════════
       BUILD MODAL
       ═══════════════════════════════════════════ */
    function _buildModal() {
        $('#smsVideoEditorModal, #veStyles').remove();

        var css =
        '<style id="veStyles">' +
        '#smsVideoEditorModal .modal-content{background:#111827;border:none;}' +
        '#smsVideoEditorModal .modal-header{background:#1f2937;border-bottom:1px solid #374151;padding:8px 16px;}' +
        '#smsVideoEditorModal .modal-title{color:#f9fafb;font-size:14px;font-weight:600;}' +
        '.ve-body{padding:16px;overflow-y:auto;color:#d1d5db;}' +
        '.ve-player-wrap{background:#000;border-radius:8px;overflow:hidden;text-align:center;margin-bottom:8px;}' +
        '.ve-player-wrap video{max-width:100%;max-height:40vh;display:block;margin:0 auto;}' +
        '.ve-time-bar{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:6px 12px;background:#1f2937;border-radius:8px;}' +
        '.ve-time-bar input[type=range]{flex:1;accent-color:#3b82f6;height:6px;}' +
        '.ve-time-bar span{font-family:monospace;font-size:12px;color:#9ca3af;min-width:60px;}' +
        '.ve-card{background:#1f2937;border:1px solid #374151;border-radius:8px;padding:12px;margin-bottom:8px;}' +
        '.ve-card-title{font-size:11px;font-weight:600;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;}' +
        '.ve-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;}' +
        '.ve-row:last-child{margin-bottom:0;}' +
        '.ve-label{font-size:11px;color:#6b7280;min-width:40px;}' +
        '.ve-input{padding:3px 6px;font-size:11px;background:#111827;color:#d1d5db;border:1px solid #4b5563;border-radius:6px;outline:none;width:80px;}' +
        '.ve-input:focus{border-color:#3b82f6;}' +
        '.ve-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border:1px solid #4b5563;border-radius:6px;background:transparent;color:#d1d5db;cursor:pointer;font-size:11px;font-weight:500;transition:all .15s;white-space:nowrap;}' +
        '.ve-btn:hover{background:#374151;color:#fff;}' +
        '.ve-btn:disabled{opacity:.5;cursor:not-allowed;}' +
        '.ve-btn-primary{background:#3b82f6;border-color:#3b82f6;color:#fff;}' +
        '.ve-btn-primary:hover{background:#2563eb;}' +
        '.ve-btn-success{background:#10b981;border-color:#10b981;color:#fff;}' +
        '.ve-btn-success:hover{background:#059669;}' +
        '.ve-btn-danger{border-color:#ef4444;color:#ef4444;}' +
        '.ve-btn-danger:hover{background:#ef4444;color:#fff;}' +
        '.ve-btn-warn{border-color:#f59e0b;color:#f59e0b;}' +
        '.ve-btn-warn:hover{background:#f59e0b;color:#fff;}' +
        '.ve-save-btn{padding:6px 16px;border:none;border-radius:6px;background:#10b981;color:#fff;font-size:13px;font-weight:600;cursor:pointer;}' +
        '.ve-save-btn:hover{background:#059669;}' +
        '.ve-cancel-btn{padding:6px 14px;border:1px solid #4b5563;border-radius:6px;background:transparent;color:#d1d5db;font-size:13px;cursor:pointer;}' +
        '.ve-cancel-btn:hover{background:#374151;color:#fff;}' +
        '.ve-status{padding:6px 10px;background:#1f2937;border-radius:8px;margin-bottom:10px;font-size:12px;}' +
        '.ve-op-badge{display:inline-block;background:#3b82f6;color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:8px;}' +
        '#veExportArea .ve-card{border-color:#10b981;}' +
        /* Two columns layout for tools */
        '.ve-tools-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}' +
        '@media(max-width:767px){.ve-tools-grid{grid-template-columns:1fr;}}' +
        '@media(max-width:575px){.ve-body{padding:10px;}.ve-btn{padding:4px 8px;font-size:10px;}.ve-card{padding:8px;}}' +
        '</style>';

        var h = css +
        '<div class="modal fade" id="smsVideoEditorModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">' +
        '<div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content">' +
        '<div class="modal-header">' +
        '<h6 class="modal-title"><i class="bi bi-film me-2"></i>Video Editor <span class="ve-op-badge" id="veOpCount" style="display:none;">0 edit(s)</span></h6>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-left:auto;">' +
        '<button type="button" class="btn btn-sm btn-warning sms-ve-reset" id="veResetBtn" style="display:none;"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset</button>' +
        '<button type="button" class="btn btn-sm btn-success sms-ve-save-new" id="veSaveNewBtn" style="display:none;"><i class="bi bi-plus-lg me-1"></i>Save as New</button>' +
        '<button type="button" class="btn btn-sm btn-primary sms-ve-save-replace" id="veSaveReplaceBtn" style="display:none;"><i class="bi bi-arrow-repeat me-1"></i>Replace Original</button>' +
        '<button type="button" class="ve-cancel-btn sms-ve-cancel">Close</button>' +
        '</div></div>' +
        '<div class="modal-body p-0"><div class="ve-body">' +

        '<div class="ve-status" id="veStatus">Loading...</div>' +

        /* Player */
        '<div class="ve-player-wrap"><video id="veEditorPlayer" controls playsinline preload="auto"></video></div>' +
        '<div class="ve-time-bar">' +
        '<span id="veCurTime">00:00:00</span>' +
        '<input type="range" id="veScrub" min="0" max="100" step="0.1" value="0"/>' +
        '<span id="veDurTime">00:00:00</span>' +
        '</div>' +

        /* Tools grid */
        '<div class="ve-tools-grid">' +

        /* TRIM */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-scissors me-1"></i>Trim</div>' +
        '<div class="ve-row">' +
        '<span class="ve-label">Start</span><input type="text" id="veTrimStart" class="ve-input" value="00:00:00"/>' +
        '<button class="ve-btn ve-set-start" title="Use current time"><i class="bi bi-cursor"></i></button>' +
        '<span class="ve-label">End</span><input type="text" id="veTrimEnd" class="ve-input" value="00:00:00"/>' +
        '<button class="ve-btn ve-set-end" title="Use current time"><i class="bi bi-cursor"></i></button>' +
        '</div>' +
        '<button class="ve-btn ve-btn-primary ve-do-trim"><i class="bi bi-scissors me-1"></i>Apply Trim</button>' +
        '</div>' +

        /* ROTATE */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-arrow-clockwise me-1"></i>Rotate</div>' +
        '<div class="ve-row">' +
        '<button class="ve-btn ve-do-rotate" data-deg="90">90° CW</button>' +
        '<button class="ve-btn ve-do-rotate" data-deg="180">180°</button>' +
        '<button class="ve-btn ve-do-rotate" data-deg="270">90° CCW</button>' +
        '</div></div>' +

        /* SPEED */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-speedometer me-1"></i>Speed</div>' +
        '<div class="ve-row">' +
        '<button class="ve-btn ve-do-speed" data-speed="0.5">0.5x</button>' +
        '<button class="ve-btn ve-do-speed" data-speed="0.75">0.75x</button>' +
        '<button class="ve-btn ve-do-speed" data-speed="1.5">1.5x</button>' +
        '<button class="ve-btn ve-do-speed" data-speed="2">2x</button>' +
        '</div></div>' +

        /* COMPRESS */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-file-zip me-1"></i>Compress</div>' +
        '<div class="ve-row">' +
        '<span class="ve-label">Quality</span>' +
        '<select id="veCompQ" class="ve-input" style="width:100px;"><option value="28">Medium</option><option value="32">Low</option><option value="23">High</option></select>' +
        '<span class="ve-label">Scale</span>' +
        '<select id="veCompS" class="ve-input" style="width:90px;"><option value="-1">Original</option><option value="720">720p</option><option value="480">480p</option><option value="360">360p</option></select>' +
        '</div>' +
        '<button class="ve-btn ve-btn-primary ve-do-compress"><i class="bi bi-file-zip me-1"></i>Apply</button>' +
        '</div>' +

        /* MUTE */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-volume-mute me-1"></i>Audio</div>' +
        '<div class="ve-row">' +
        '<button class="ve-btn ve-do-mute"><i class="bi bi-volume-mute me-1"></i>Remove Audio</button>' +
        '<button class="ve-btn ve-do-extract-audio"><i class="bi bi-music-note me-1"></i>Extract MP3</button>' +
        '</div></div>' +

        /* CONVERT */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-arrow-left-right me-1"></i>Convert</div>' +
        '<div class="ve-row">' +
        '<button class="ve-btn ve-do-convert" data-fmt="mp4">MP4</button>' +
        '<button class="ve-btn ve-do-convert" data-fmt="webm">WebM</button>' +
        '<button class="ve-btn ve-do-convert" data-fmt="gif">GIF (10s max)</button>' +
        '</div></div>' +

        /* WATERMARK — use canvas overlay instead of drawtext (no font needed) */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-type me-1"></i>Watermark Text</div>' +
        '<div class="ve-row">' +
        '<input type="text" id="veWmText" class="ve-input" style="width:160px;" placeholder="Your text"/>' +
        '<select id="veWmPos" class="ve-input" style="width:90px;"><option value="br">Bottom-R</option><option value="bl">Bottom-L</option><option value="tr">Top-R</option><option value="tl">Top-L</option><option value="c">Center</option></select>' +
        '<select id="veWmSize" class="ve-input" style="width:70px;"><option value="20">Small</option><option value="36" selected>Medium</option><option value="52">Large</option></select>' +
        '</div>' +
        '<button class="ve-btn ve-btn-primary ve-do-watermark"><i class="bi bi-type me-1"></i>Apply Watermark</button>' +
        '</div>' +

        /* CAPTURE FRAME */
        '<div class="ve-card"><div class="ve-card-title"><i class="bi bi-camera me-1"></i>Capture Frame</div>' +
        '<div class="ve-row">' +
        '<button class="ve-btn ve-btn-primary ve-do-capture"><i class="bi bi-camera me-1"></i>Capture Current Frame</button>' +
        '<span class="small text-muted" id="veCaptureMsg"></span>' +
        '</div></div>' +

        '</div>' + // end tools-grid

        /* Export area */
        '<div id="veExportArea"></div>' +

        '</div></div></div></div></div>';

        $('body').append(h);
    }

    /* ═══════════════════════════════════════════
       WATERMARK via Canvas (no FFmpeg font needed)
       ═══════════════════════════════════════════ */
    /* ═══════════════════════════════════════════
       OPEN
       ═══════════════════════════════════════════ */
    async function open(opts) {
        if (!opts || !opts.videoUrl) return;
        _onSave = opts.onSave || null;
        _fileName = opts.fileName || 'video.mp4';
        _originalBlob = null;
        _currentBlob = null;
        _processing = false;
        _opCount = 0;

        _buildModal();

        var $modal = $('#smsVideoEditorModal');
        var modal = new bootstrap.Modal($modal[0], { backdrop: 'static', keyboard: false });
        modal.show();

        // Load video
        _setStatus('<div class="d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm"></span><span>Loading video...</span></div>');
        try {
            var resp = await fetch(opts.videoUrl);
            _originalBlob = await resp.blob();
            _currentBlob = _originalBlob;
            _setStatus('<span class="text-success"><i class="bi bi-check-circle me-1"></i>Video loaded (' + _fmtSize(_originalBlob.size) + ')</span>');
        } catch (e) {
            _setStatus('<span class="text-danger">Failed to load video</span>');
            return;
        }

        _updatePlayer();
        _updateOpBadge();

        // Player time sync
        var $p = $('#veEditorPlayer');
        $p.on('loadedmetadata', function() {
            $('#veDurTime').text(_fmtTime(this.duration));
            $('#veScrub').attr('max', this.duration);
            $('#veTrimEnd').val(_fmtTime(this.duration));
        });
        $p.on('timeupdate', function() {
            $('#veCurTime').text(_fmtTime(this.currentTime));
            if (!$('#veScrub').data('dragging')) $('#veScrub').val(this.currentTime);
        });
        $('#veScrub').on('mousedown touchstart', function() { $(this).data('dragging', true); });
        $('#veScrub').on('mouseup touchend', function() { $(this).data('dragging', false); var p = document.getElementById('veEditorPlayer'); if (p) p.currentTime = parseFloat($(this).val()); });
        $('#veScrub').on('input', function() { var p = document.getElementById('veEditorPlayer'); if (p) p.currentTime = parseFloat($(this).val()); });

        // Load FFmpeg
        await _ensureLoaded($('#veStatus'));

        _bindEvents();
    }

    /* ═══════════════════════════════════════════
       BIND EVENTS
       ═══════════════════════════════════════════ */
    function _bindEvents() {
        $(document).off('.smsve');

        // Set trim times from current
        $(document).on('click.smsve', '.ve-set-start', function(e) { e.preventDefault(); var p = document.getElementById('veEditorPlayer'); if (p) $('#veTrimStart').val(_fmtTime(p.currentTime)); });
        $(document).on('click.smsve', '.ve-set-end', function(e) { e.preventDefault(); var p = document.getElementById('veEditorPlayer'); if (p) $('#veTrimEnd').val(_fmtTime(p.currentTime)); });

        // TRIM
        $(document).on('click.smsve', '.ve-do-trim', function(e) {
            e.preventDefault();
            // Re-encode to avoid keyframe issues (copy mode drops video frames)
            _applyOp(['-ss', $('#veTrimStart').val(), '-to', $('#veTrimEnd').val(), '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac'], 'trimmed.mp4', 'Trim');
        });

        // ROTATE
        $(document).on('click.smsve', '.ve-do-rotate', function(e) {
            e.preventDefault();
            var deg = parseInt($(this).data('deg'));
            var t = deg === 90 ? '1' : deg === 270 ? '2' : '2,transpose=2';
            _applyOp(['-vf', 'transpose=' + t, '-c:a', 'copy'], 'rotated.mp4', 'Rotate ' + deg + '°');
        });

        // SPEED
        $(document).on('click.smsve', '.ve-do-speed', function(e) {
            e.preventDefault();
            var sp = parseFloat($(this).data('speed'));
            _applyOp(['-filter:v', 'setpts=' + (1/sp).toFixed(4) + '*PTS', '-filter:a', 'atempo=' + sp], 'speed.mp4', 'Speed ' + sp + 'x');
        });

        // COMPRESS
        $(document).on('click.smsve', '.ve-do-compress', function(e) {
            e.preventDefault();
            var crf = $('#veCompQ').val(), scale = $('#veCompS').val();
            var args = ['-c:v', 'libx264', '-crf', crf, '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k'];
            if (scale !== '-1') args.push('-vf', 'scale=-2:' + scale);
            _applyOp(args, 'compressed.mp4', 'Compress');
        });

        // MUTE
        $(document).on('click.smsve', '.ve-do-mute', function(e) {
            e.preventDefault();
            _applyOp(['-c:v', 'copy', '-an'], 'muted.mp4', 'Mute');
        });

        // EXTRACT AUDIO (export, doesn't change video)
        $(document).on('click.smsve', '.ve-do-extract-audio', function(e) {
            e.preventDefault();
            _exportOp(['-vn', '-acodec', 'libmp3lame', '-q:a', '2'], 'audio.mp3', 'Extracted Audio');
        });

        // CONVERT (export)
        $(document).on('click.smsve', '.ve-do-convert', function(e) {
            e.preventDefault();
            var fmt = $(this).data('fmt');
            var args = [];
            if (fmt === 'webm') args = ['-c:v', 'libvpx', '-c:a', 'libvorbis', '-q:v', '6'];
            else if (fmt === 'gif') args = ['-vf', 'fps=10,scale=320:-1:flags=lanczos', '-t', '10'];
            else args = ['-c:v', 'libx264', '-c:a', 'aac'];
            _exportOp(args, 'output.' + fmt, 'Converted to ' + fmt.toUpperCase());
        });

        // WATERMARK — create PNG overlay via Canvas, then use FFmpeg overlay filter
        $(document).on('click.smsve', '.ve-do-watermark', async function(e) {
            e.preventDefault();
            var text = $('#veWmText').val();
            if (!text) { toastr.error('Enter watermark text'); return; }
            if (!_currentBlob || !_loaded || _processing) return;

            var pos = $('#veWmPos').val();
            var fontSize = parseInt($('#veWmSize').val()) || 36;

            // Step 1: Get video dimensions from player
            var player = document.getElementById('veEditorPlayer');
            var vw = player ? player.videoWidth : 640;
            var vh = player ? player.videoHeight : 480;
            if (!vw) vw = 640; if (!vh) vh = 480;

            // Step 2: Create watermark PNG overlay via Canvas
            var c = document.createElement('canvas');
            c.width = vw; c.height = vh;
            var ctx = c.getContext('2d');
            // Transparent background
            ctx.clearRect(0, 0, vw, vh);
            ctx.font = 'bold ' + fontSize + 'px Arial, sans-serif';
            var tm = ctx.measureText(text);
            var pad = 20;
            var tx, ty;
            switch (pos) {
                case 'tl': tx = pad; ty = fontSize + pad; break;
                case 'tr': tx = vw - tm.width - pad; ty = fontSize + pad; break;
                case 'bl': tx = pad; ty = vh - pad; break;
                case 'c':  tx = (vw - tm.width) / 2; ty = (vh + fontSize) / 2; break;
                default:   tx = vw - tm.width - pad; ty = vh - pad; break;
            }
            // Draw text with shadow
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(text, tx, ty);

            // Step 3: Convert canvas to PNG blob
            var pngBlob = await new Promise(function(resolve) { c.toBlob(resolve, 'image/png'); });

            // Step 4: Write overlay PNG to FFmpeg FS, then overlay
            _lockUI();
            _setStatus('<div class="d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm text-primary"></span><span>Adding watermark...</span></div>');
            try {
                var inName = 'input' + _getExt(_fileName);
                _ffmpeg.FS('writeFile', inName, new Uint8Array(await _currentBlob.arrayBuffer()));
                _ffmpeg.FS('writeFile', 'watermark.png', new Uint8Array(await pngBlob.arrayBuffer()));
                await _ffmpeg.run('-i', inName, '-i', 'watermark.png', '-filter_complex', 'overlay=0:0', '-c:a', 'copy', 'watermarked.mp4');
                var out = _ffmpeg.FS('readFile', 'watermarked.mp4');
                try { _ffmpeg.FS('unlink', inName); } catch(ex){}
                try { _ffmpeg.FS('unlink', 'watermark.png'); } catch(ex){}
                try { _ffmpeg.FS('unlink', 'watermarked.mp4'); } catch(ex){}
                var blob = new Blob([out.buffer], { type: 'video/mp4' });
                _currentBlob = blob;
                _opCount++;
                _updatePlayer();
                _updateOpBadge();
                _setStatus('<span class="text-success"><i class="bi bi-check-circle me-1"></i>Watermark "' + text + '" applied! (' + _fmtSize(blob.size) + ')</span>');
            } catch(err) {
                _setStatus('<span class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Watermark failed: ' + (err.message || 'Error') + '</span>');
                try { _ffmpeg.FS('unlink', 'input' + _getExt(_fileName)); } catch(ex){}
                try { _ffmpeg.FS('unlink', 'watermark.png'); } catch(ex){}
            }
            _unlockUI();
        });

        // CAPTURE FRAME
        $(document).on('click.smsve', '.ve-do-capture', function(e) {
            e.preventDefault();
            var p = document.getElementById('veEditorPlayer');
            if (!p || !p.videoWidth) return;
            var c = document.createElement('canvas');
            c.width = p.videoWidth; c.height = p.videoHeight;
            c.getContext('2d').drawImage(p, 0, 0);
            c.toBlob(function(blob) {
                if (!blob) return;
                var url = URL.createObjectURL(blob);
                var $area = $('#veExportArea');
                $area.append(
                    '<div class="ve-card" style="border-color:#3b82f6;">' +
                    '<div class="ve-card-title" style="color:#3b82f6;"><i class="bi bi-camera me-1"></i>Captured Frame</div>' +
                    '<img src="' + url + '" style="max-width:100%;max-height:120px;border-radius:4px;"/>' +
                    '<div class="mt-2"><button class="ve-btn ve-btn-success ve-dl-export" data-url="' + url + '" data-name="frame.png"><i class="bi bi-download me-1"></i>Download</button></div></div>'
                );
                $('#veCaptureMsg').text('Frame captured!');
            }, 'image/png');
        });

        // DOWNLOAD EXPORT
        $(document).on('click.smsve', '.ve-dl-export', function(e) {
            e.preventDefault();
            var a = document.createElement('a');
            a.href = $(this).data('url');
            a.download = $(this).data('name');
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });

        // RESET — go back to original
        $(document).on('click.smsve', '.sms-ve-reset', function(e) {
            e.preventDefault();
            _currentBlob = _originalBlob;
            _opCount = 0;
            _updatePlayer();
            _updateOpBadge();
            $('#veExportArea').html('');
            _setStatus('<span class="text-info"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset to original (' + _fmtSize(_originalBlob.size) + ')</span>');
        });

        // SAVE AS NEW
        $(document).on('click.smsve', '.sms-ve-save-new', function(e) {
            e.preventDefault();
            if (_currentBlob && _onSave) {
                var result = _onSave(_currentBlob, _fileName, 'new');
                if (result === false) return; // validation failed, keep editor open
                var m = bootstrap.Modal.getInstance($('#smsVideoEditorModal')[0]);
                if (m) m.hide();
            }
        });

        // REPLACE ORIGINAL
        $(document).on('click.smsve', '.sms-ve-save-replace', function(e) {
            e.preventDefault();
            if (_currentBlob && _onSave) {
                var result = _onSave(_currentBlob, _fileName, 'replace');
                if (result === false) return; // validation failed, keep editor open
                var m = bootstrap.Modal.getInstance($('#smsVideoEditorModal')[0]);
                if (m) m.hide();
            }
        });

        // CANCEL
        $(document).on('click.smsve', '.sms-ve-cancel', function(e) {
            e.preventDefault();
            var m = bootstrap.Modal.getInstance($('#smsVideoEditorModal')[0]);
            if (m) m.hide();
        });

        // Cleanup
        $('#smsVideoEditorModal').off('hidden.bs.modal.ve').on('hidden.bs.modal.ve', function() {
            $(document).off('.smsve');
            var $p = $('#veEditorPlayer');
            if ($p.length) { $p[0].pause(); URL.revokeObjectURL($p.attr('src')); }
        });
    }

    return { open: open };
}(jQuery));
