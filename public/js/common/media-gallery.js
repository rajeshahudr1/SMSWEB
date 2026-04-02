/**
 * SMS Media Gallery — Reusable image & video gallery module
 *
 * Usage:
 *   var gallery = new SMS_MediaGallery({
 *     type: 'image',  // or 'video'
 *     containerSelector: '#imageGalleryGrid',
 *     countSelector: '#imageGalleryCount',
 *     fileInputSelector: '#fImages',
 *     previewSelector: '#imageUploadPreview',
 *     uploadBtnSelector: '#btnUploadImages',
 *     baseUrl: '/vehicle-inventories',
 *     entityUuid: 'xxx-xxx',
 *     maxCount: 20,
 *     maxSizeMB: 5,
 *     allowedExts: ['.jpg','.jpeg','.png','.gif','.webp'],
 *     items: [],  // initial items
 *     // API paths (relative to baseUrl/entityUuid)
 *     uploadPath: '/images',         // POST, multipart
 *     deletePath: '/images/delete',  // POST, { image_id }
 *     reorderPath: '/images/reorder', // POST, { order }
 *     replacePath: '/images/:id/replace', // POST, multipart (image editor)
 *     fieldName: 'images',           // FormData field name
 *     idField: 'id',                 // field name for item ID
 *     urlField: 'display_url',       // field for display URL
 *     enableEditor: true,            // show edit button (image editor)
 *     enableVideoEditor: false,      // show video editor button
 *     onItemsChanged: function(items) {} // callback when items change
 *   });
 */
window.SMS_MediaGallery = function(opts) {
    'use strict';

    var _items = opts.items || [];
    var _pendingFiles = [];
    var _orderChanged = false;
    var _type = opts.type || 'image';
    var _isImage = _type === 'image';
    var _maxCount = opts.maxCount || 20;
    var _maxSize = opts.maxSizeMB || 5;
    var _allowedExts = opts.allowedExts || (_isImage ? ['.jpg','.jpeg','.png','.gif','.webp'] : ['.mp4','.mov','.avi','.mkv','.webm','.wmv','.flv','.m4v']);
    var _baseApiUrl = (opts.baseUrl || '') + '/' + (opts.entityUuid || '');
    var _uploadPath = opts.uploadPath || (_isImage ? '/images' : '/videos');
    var _deletePath = opts.deletePath || (_isImage ? '/images/delete' : '/videos/delete');
    var _reorderPath = opts.reorderPath || (_isImage ? '/images/reorder' : '/videos/reorder');
    var _replacePath = opts.replacePath || '/images/:id/replace';
    var _fieldName = opts.fieldName || (_isImage ? 'images' : 'videos');
    var _idField = opts.idField || 'id';
    var _urlField = opts.urlField || 'display_url';
    var _altUrlField = _isImage ? 'image_url' : 'video_url';
    var _enableEditor = opts.enableEditor !== false && _isImage;
    var _enableVideoEditor = opts.enableVideoEditor === true && !_isImage;

    var T = (typeof window.T === 'function') ? window.T : function(k, d) { return d || k; };
    var H = (typeof window.H === 'object' && window.H.esc) ? window.H : { esc: function(s) { return $('<div>').text(s||'').html(); } };
    var BASE_URL = opts._baseUrl || (typeof window.BASE_URL !== 'undefined' ? window.BASE_URL : '');

    function _getUrl(item) {
        return item[_urlField] || item[_altUrlField] || item.url || '';
    }
    function _getId(item) {
        return item[_idField] || item.image_id || item.video_id || '';
    }

    /* ═══════════════════════════════════════════
       RENDER GALLERY
       ═══════════════════════════════════════════ */
    function renderGallery() {
        var $grid = $(opts.containerSelector);
        if (!$grid.length) return;
        if (opts.countSelector) $(opts.countSelector).text(_items.length);

        if (!_items.length) {
            $grid.html('<div class="text-muted small text-center py-3 w-100">' + T('general.no_items', 'No ' + _type + 's uploaded yet.') + '</div>');
            return;
        }

        var html = '';
        _items.forEach(function(item, idx) {
            var url = _getUrl(item);
            var id = _getId(item);

            html += '<div class="col-6 col-sm-4 col-md-3 sms-media-card" draggable="true" data-id="' + id + '" data-idx="' + idx + '">';
            html += '<div class="border rounded p-1 text-center position-relative" style="cursor:grab;' + (_isImage ? '' : 'background:#000;') + '">';

            if (_isImage) {
                html += '<img src="' + H.esc(url) + '" class="rounded sms-media-preview" data-idx="' + idx + '" style="width:100%;height:100px;object-fit:cover;cursor:pointer;" onerror="this.src=\'/images/no-image.svg\';" title="' + T('general.click_preview','Click to preview') + '"/>';
            } else {
                // Video thumbnail
                html += '<div class="sms-media-preview" data-idx="' + idx + '" data-url="' + H.esc(url) + '" style="position:relative;width:100%;height:100px;cursor:pointer;overflow:hidden;border-radius:4px;">';
                html += '<video src="' + H.esc(url) + '#t=1" preload="metadata" muted playsinline style="width:100%;height:100px;object-fit:cover;pointer-events:none;"></video>';
                html += '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.2);">';
                html += '<i class="bi bi-play-circle-fill" style="font-size:32px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);"></i></div></div>';
            }

            // Edit button (top-left)
            if (_enableEditor || _enableVideoEditor) {
                html += '<button type="button" class="btn btn-sm btn-info position-absolute top-0 start-0 m-1 sms-media-edit" data-id="' + id + '" data-idx="' + idx + '" data-url="' + H.esc(url) + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;" title="Edit"><i class="bi bi-' + (_isImage ? 'pencil' : 'scissors') + '"></i></button>';
            }

            // Delete button (top-right)
            html += '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 sms-media-delete" data-id="' + id + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;"><i class="bi bi-trash3"></i></button>';

            html += '<div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-grip-vertical"></i> Drag</div>';
            html += '</div></div>';
        });

        if (_orderChanged) {
            html += '<div class="col-12 mt-2"><button type="button" class="btn btn-sm btn-warning sms-media-save-order"><i class="bi bi-arrows-move me-1"></i>' + T('general.save_order','Save Order') + '</button></div>';
        }

        $grid.html(html);
        _initDragDrop();
        if (opts.onItemsChanged) opts.onItemsChanged(_items);
    }

    /* ═══════════════════════════════════════════
       PENDING FILES PREVIEW
       ═══════════════════════════════════════════ */
    function renderPendingPreview() {
        var $preview = $(opts.previewSelector);
        if (!$preview.length) return;
        $preview.html('');
        if (!_pendingFiles.length) return;

        _pendingFiles.forEach(function(file, idx) {
            if (_isImage) {
                var url = URL.createObjectURL(file);
                $preview.append(
                    '<div class="col-4 col-sm-3"><div class="border rounded p-1 text-center position-relative">' +
                    '<img src="' + url + '" class="rounded" style="width:100%;height:70px;object-fit:cover;"/>' +
                    '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 sms-pending-remove" data-idx="' + idx + '" style="width:20px;height:20px;padding:0;line-height:20px;font-size:10px;border-radius:50%;"><i class="bi bi-x"></i></button>' +
                    '</div></div>'
                );
            } else {
                // Video — generate thumbnail
                var cardId = 'smsPendVid_' + idx;
                $preview.append(
                    '<div class="col-4 col-sm-3" id="' + cardId + '"><div class="border rounded p-1 text-center position-relative" style="background:#000;">' +
                    '<div class="d-flex align-items-center justify-content-center" style="height:70px;"><span class="spinner-border spinner-border-sm text-light"></span></div>' +
                    '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 sms-pending-remove" data-idx="' + idx + '" style="width:20px;height:20px;padding:0;line-height:20px;font-size:10px;border-radius:50%;"><i class="bi bi-x"></i></button>' +
                    '<div class="text-light text-truncate px-1" style="font-size:9px;background:rgba(0,0,0,.6);">' + H.esc(file.name) + '</div>' +
                    '</div></div>'
                );
                _genVideoThumb(file, cardId);
            }
        });
        $preview.append(
            '<div class="col-12 mt-1"><span class="text-muted small me-2">' + _pendingFiles.length + ' file(s) selected</span>' +
            '<button type="button" class="btn btn-sm btn-outline-danger sms-pending-clear-all"><i class="bi bi-x-lg me-1"></i>Clear All</button></div>'
        );
    }

    function _genVideoThumb(file, cardId) {
        var url = URL.createObjectURL(file);
        var video = document.createElement('video');
        video.preload = 'metadata'; video.muted = true; video.playsInline = true;
        video.onloadeddata = function() { video.currentTime = Math.min(1, video.duration / 4); };
        video.onseeked = function() {
            try {
                var c = document.createElement('canvas'); c.width = 160; c.height = 90;
                c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
                var thumb = c.toDataURL('image/jpeg', 0.6);
                var $card = $('#' + cardId + ' .d-flex');
                if ($card.length) {
                    $card.replaceWith('<div style="position:relative;height:70px;"><img src="' + thumb + '" style="width:100%;height:70px;object-fit:cover;border-radius:4px;"/>' +
                        '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:20px;"><i class="bi bi-play-circle-fill"></i></div></div>');
                }
            } catch(e) {}
            URL.revokeObjectURL(url);
        };
        video.onerror = function() { URL.revokeObjectURL(url); };
        video.src = url;
    }

    /* ═══════════════════════════════════════════
       DRAG & DROP REORDER
       ═══════════════════════════════════════════ */
    function _initDragDrop() {
        var $cards = $(opts.containerSelector + ' .sms-media-card');
        var dragSrcEl = null;
        $cards.off('dragstart dragover dragenter dragleave drop dragend');
        $cards.on('dragstart', function(e) { dragSrcEl = this; $(this).css('opacity', '0.4'); e.originalEvent.dataTransfer.effectAllowed = 'move'; });
        $cards.on('dragover', function(e) { e.preventDefault(); });
        $cards.on('dragenter', function(e) { e.preventDefault(); $(this).find('.border').addClass('border-primary border-2'); });
        $cards.on('dragleave', function() { $(this).find('.border').removeClass('border-primary border-2'); });
        $cards.on('drop', function(e) {
            e.preventDefault(); e.stopPropagation();
            $(this).find('.border').removeClass('border-primary border-2');
            if (dragSrcEl === this) return;
            var from = parseInt($(dragSrcEl).data('idx'));
            var to = parseInt($(this).data('idx'));
            var moved = _items.splice(from, 1)[0];
            _items.splice(to, 0, moved);
            _orderChanged = true;
            renderGallery();
        });
        $cards.on('dragend', function() { $(this).css('opacity', '1'); });
    }

    /* ═══════════════════════════════════════════
       BIND EVENTS (call once)
       ═══════════════════════════════════════════ */
    function bindEvents() {
        var ns = '.smsmg_' + _type; // namespace

        // File input change — accumulate files
        $(opts.fileInputSelector).off('change' + ns).on('change' + ns, function() {
            var files = this.files;
            if (!files || !files.length) return;
            if (_items.length + _pendingFiles.length + files.length > _maxCount) {
                toastr.error('Maximum ' + _maxCount + ' ' + _type + 's allowed.');
                $(this).val(''); return;
            }
            for (var i = 0; i < files.length; i++) {
                var ext = '.' + files[i].name.split('.').pop().toLowerCase();
                if (_allowedExts.indexOf(ext) === -1) { toastr.error('"' + files[i].name + '" — invalid format.'); continue; }
                if (files[i].size > _maxSize * 1024 * 1024) { toastr.error('"' + files[i].name + '" exceeds ' + _maxSize + ' MB'); continue; }
                _pendingFiles.push(files[i]);
            }
            $(this).val('');
            renderPendingPreview();
        });

        // Remove single pending
        $(document).off('click' + ns, '.sms-pending-remove').on('click' + ns, '.sms-pending-remove', function(e) {
            e.preventDefault();
            _pendingFiles.splice(parseInt($(this).data('idx')), 1);
            renderPendingPreview();
        });

        // Clear all pending
        $(document).off('click' + ns, '.sms-pending-clear-all').on('click' + ns, '.sms-pending-clear-all', function(e) {
            e.preventDefault();
            _pendingFiles = [];
            renderPendingPreview();
        });

        // Upload button
        $(opts.uploadBtnSelector).off('click' + ns).on('click' + ns, function() {
            if (!_pendingFiles.length) { toastr.error('Select files first.'); return; }
            var fd = new FormData();
            _pendingFiles.forEach(function(f) { fd.append(_fieldName, f); });
            var $btn = $(this);
            if (typeof btnLoading === 'function') btnLoading($btn);
            $.ajax({
                url: BASE_URL + _baseApiUrl + _uploadPath,
                type: 'POST', data: fd, processData: false, contentType: false,
                success: function(r) {
                    if (typeof btnReset === 'function') btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || 'Uploaded.');
                        if (Array.isArray(r.data)) _items = r.data;
                        _pendingFiles = [];
                        renderGallery();
                        renderPendingPreview();
                    } else { toastr.error(r.message || 'Error.'); }
                },
                error: function() { if (typeof btnReset === 'function') btnReset($btn); toastr.error('Upload failed.'); }
            });
        });

        // Delete
        $(document).off('click' + ns, '.sms-media-delete').on('click' + ns, '.sms-media-delete', function(e) {
            e.preventDefault(); e.stopPropagation();
            var itemId = $(this).data('id');
            if (!itemId) return;
            smsConfirm({
                icon: '\uD83D\uDDD1\uFE0F', title: 'Delete', msg: 'Delete this ' + _type + '?',
                btnClass: 'btn-danger', btnText: 'Delete',
                onConfirm: function() {
                    showLoading();
                    $.post(BASE_URL + _baseApiUrl + _deletePath, (_isImage ? { image_id: itemId } : { video_id: itemId }), function(r) {
                        hideLoading();
                        if (r.status === 200) {
                            toastr.success(r.message || 'Deleted.');
                            _items = _items.filter(function(it) { return String(_getId(it)) !== String(itemId); });
                            renderGallery();
                        } else { toastr.error(r.message || 'Error.'); }
                    }).fail(function() { hideLoading(); toastr.error('Network error.'); });
                }
            });
        });

        // Save order
        $(document).off('click' + ns, '.sms-media-save-order').on('click' + ns, '.sms-media-save-order', function() {
            var order = _items.map(function(it) { return _getId(it); });
            var $btn = $(this); if (typeof btnLoading === 'function') btnLoading($btn);
            $.post(BASE_URL + _baseApiUrl + _reorderPath, { order: JSON.stringify(order) }, function(r) {
                if (typeof btnReset === 'function') btnReset($btn);
                if (r.status === 200) { toastr.success('Order saved.'); _orderChanged = false; renderGallery(); }
                else toastr.error(r.message || 'Error.');
            }).fail(function() { if (typeof btnReset === 'function') btnReset($btn); toastr.error('Failed.'); });
        });

        // Preview (click thumbnail)
        $(document).off('click' + ns, '.sms-media-preview').on('click' + ns, '.sms-media-preview', function(e) {
            e.preventDefault();
            var idx = parseInt($(this).data('idx'));
            if (_isImage) {
                _showImagePreview(idx);
            } else {
                _showVideoPlayer(idx);
            }
        });

        // Image editor
        if (_enableEditor) {
            $(document).off('click' + ns, '.sms-media-edit').on('click' + ns, '.sms-media-edit', function(e) {
                e.preventDefault(); e.stopPropagation();
                var id = $(this).data('id');
                var url = $(this).data('url');
                if (!id || !url || typeof SMS_ImageEditor === 'undefined') return;
                SMS_ImageEditor.open({
                    imageUrl: url,
                    onSave: function(blob, dataUrl, mode) {
                        var $msg = $('#ieSaveMsg');
                        if (blob.size > _maxSize * 1024 * 1024) {
                            $msg.html('<span style="color:#ef4444;">Image too large! Max: ' + _maxSize + ' MB</span>');
                            toastr.error('Image too large! Max: ' + _maxSize + ' MB');
                            return false;
                        }
                        if (mode === 'new' && _items.length >= _maxCount) {
                            $msg.html('<span style="color:#ef4444;">Max ' + _maxCount + ' images reached.</span>');
                            toastr.error('Maximum ' + _maxCount + ' images.');
                            return false;
                        }
                        var fd = new FormData();
                        if (mode === 'replace') {
                            fd.append('image', blob, 'edited.png');
                            $msg.html('<span style="color:#3b82f6;"><span class="spinner-border spinner-border-sm me-1"></span>Replacing...</span>');
                            $.ajax({
                                url: BASE_URL + _baseApiUrl + _replacePath.replace(':id', id),
                                type: 'POST', data: fd, processData: false, contentType: false,
                                success: function(r) { if (r.status === 200) { toastr.success('Replaced.'); _items = r.data; renderGallery(); } else { $msg.html('<span style="color:#ef4444;">' + (r.message||'Error') + '</span>'); } },
                                error: function() { $msg.html('<span style="color:#ef4444;">Failed</span>'); }
                            });
                        } else {
                            fd.append(_fieldName, blob, 'edited.png');
                            $msg.html('<span style="color:#3b82f6;"><span class="spinner-border spinner-border-sm me-1"></span>Uploading...</span>');
                            $.ajax({
                                url: BASE_URL + _baseApiUrl + _uploadPath,
                                type: 'POST', data: fd, processData: false, contentType: false,
                                success: function(r) { if (r.status === 200 || r.status === 201) { toastr.success('Saved as new.'); if (Array.isArray(r.data)) _items = r.data; renderGallery(); } else { $msg.html('<span style="color:#ef4444;">' + (r.message||'Error') + '</span>'); } },
                                error: function() { $msg.html('<span style="color:#ef4444;">Failed</span>'); }
                            });
                        }
                    }
                });
            });
        }

        // Video editor
        if (_enableVideoEditor) {
            $(document).off('click' + ns, '.sms-media-edit').on('click' + ns, '.sms-media-edit', function(e) {
                e.preventDefault(); e.stopPropagation();
                var idx = parseInt($(this).data('idx'));
                var url = $(this).data('url');
                var id = $(this).data('id');
                if (!url || typeof SMS_VideoEditor === 'undefined') return;
                SMS_VideoEditor.open({
                    videoUrl: url,
                    fileName: _type + '_' + id + '.mp4',
                    onSave: function(blob, filename, mode) {
                        if (blob.size > _maxSize * 1024 * 1024) {
                            toastr.error('Video too large! Max: ' + _maxSize + ' MB. Try compressing.');
                            $('#veStatus').html('<span class="text-danger">Video too large! Use Compress.</span>');
                            return false;
                        }
                        if (mode === 'new' && _items.length >= _maxCount) {
                            toastr.error('Maximum ' + _maxCount + ' videos.');
                            return false;
                        }
                        var fd = new FormData();
                        fd.append(_fieldName, blob, filename);
                        if (mode === 'replace' && id) {
                            showLoading();
                            $.post(BASE_URL + _baseApiUrl + _deletePath, { video_id: id }, function() {
                                $.ajax({ url: BASE_URL + _baseApiUrl + _uploadPath, type: 'POST', data: fd, processData: false, contentType: false,
                                    success: function(r) { hideLoading(); if (r.status === 200 || r.status === 201) { toastr.success('Replaced.'); if (Array.isArray(r.data)) _items = r.data; renderGallery(); } else toastr.error(r.message||'Error.'); },
                                    error: function() { hideLoading(); toastr.error('Failed.'); } });
                            }).fail(function() { hideLoading(); toastr.error('Delete failed.'); });
                        } else {
                            showLoading();
                            $.ajax({ url: BASE_URL + _baseApiUrl + _uploadPath, type: 'POST', data: fd, processData: false, contentType: false,
                                success: function(r) { hideLoading(); if (r.status === 200 || r.status === 201) { toastr.success('Saved.'); if (Array.isArray(r.data)) _items = r.data; renderGallery(); } else toastr.error(r.message||'Error.'); },
                                error: function() { hideLoading(); toastr.error('Failed.'); } });
                        }
                    }
                });
            });
        }
    }

    /* ═══════════════════════════════════════════
       PREVIEW MODALS
       ═══════════════════════════════════════════ */
    function _showImagePreview(idx) {
        if (!_items[idx]) return;
        var url = _getUrl(_items[idx]);
        var h = '<div class="text-center"><img src="' + H.esc(url) + '" class="rounded" style="max-width:100%;max-height:70vh;object-fit:contain;"/></div>';
        h += '<div class="d-flex justify-content-between mt-3">';
        h += '<button class="btn btn-sm btn-outline-secondary sms-mg-nav" data-idx="' + (idx-1) + '" ' + (idx <= 0 ? 'disabled' : '') + '><i class="bi bi-chevron-left me-1"></i>Previous</button>';
        h += '<span class="text-muted small align-self-center">' + (idx+1) + ' / ' + _items.length + '</span>';
        h += '<button class="btn btn-sm btn-outline-secondary sms-mg-nav" data-idx="' + (idx+1) + '" ' + (idx >= _items.length - 1 ? 'disabled' : '') + '>Next<i class="bi bi-chevron-right ms-1"></i></button>';
        h += '</div>';
        $('#viewBody').html(h);
        bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    }

    function _showVideoPlayer(idx) {
        if (!_items[idx]) return;
        var url = _getUrl(_items[idx]);
        var h = '<div class="text-center" style="background:#000;border-radius:8px;overflow:hidden;">';
        h += '<video src="' + H.esc(url) + '" controls autoplay playsinline style="max-width:100%;max-height:70vh;display:block;margin:0 auto;"></video></div>';
        h += '<div class="d-flex justify-content-between mt-3">';
        h += '<button class="btn btn-sm btn-outline-secondary sms-mg-nav" data-idx="' + (idx-1) + '" ' + (idx <= 0 ? 'disabled' : '') + '><i class="bi bi-chevron-left me-1"></i>Previous</button>';
        h += '<span class="text-muted small align-self-center">' + (idx+1) + ' / ' + _items.length + '</span>';
        h += '<button class="btn btn-sm btn-outline-secondary sms-mg-nav" data-idx="' + (idx+1) + '" ' + (idx >= _items.length - 1 ? 'disabled' : '') + '>Next<i class="bi bi-chevron-right ms-1"></i></button>';
        h += '</div>';
        $('#viewBody').html(h);
        bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    }

    // Nav buttons in preview modal
    $(document).off('click.smsmgnav').on('click.smsmgnav', '.sms-mg-nav', function(e) {
        e.preventDefault();
        var idx = parseInt($(this).data('idx'));
        if (_isImage) _showImagePreview(idx);
        else _showVideoPlayer(idx);
    });

    /* ═══════════════════════════════════════════
       PUBLIC API
       ═══════════════════════════════════════════ */
    this.render = renderGallery;
    this.bind = bindEvents;
    this.getItems = function() { return _items; };
    this.setItems = function(items) { _items = items; renderGallery(); };
    this.getPendingFiles = function() { return _pendingFiles; };

    // Auto-init
    renderGallery();
    bindEvents();
};
