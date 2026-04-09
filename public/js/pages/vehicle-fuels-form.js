/* vehicle-fuels-form.js */
'use strict';
var T=function(k,f){return (typeof SMS_T==='function')?SMS_T(k,f):(f||k);};

$(function() {
    var FD = window._FORM_DATA || {};
    var T  = function(k,f){ return typeof SMS_T==='function'?SMS_T(k,f):(f||k); };
    var _aiConfig = null; // { openai: true/false, gemini: true/false }

    /* ══════════════════════════════════════════════════════
       AI CONFIG — check on load, show/hide translate buttons
    ══════════════════════════════════════════════════════ */
    function checkAIConfig() {
        $.get(BASE_URL + '/vehicle-fuels/ai-config', function(res) {
            if (!res || res.status !== 200 || !res.data) return;
            _aiConfig = res.data;
            /* Only show AI buttons if AI translation is enabled globally */
            if (_aiConfig.enabled && (_aiConfig.openai || _aiConfig.gemini)) {
                $('.ai-translate-btn').removeClass('d-none');
            }
        });
    }

    /* ══════════════════════════════════════════════════════
       TRANSLATE ALL — one call, all languages
    ══════════════════════════════════════════════════════ */
    $('#btnTranslateAll').on('click', function() {
        var text = $('#fName').val().trim();
        if (!text) { toastr.error('Enter part name first.'); $('#fName').focus(); return; }

        var langs = FD.langs || [];
        if (!langs.length) return;

        var $btn = $(this);
        var origHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating…');

        var provider = (_aiConfig && _aiConfig.provider) ? _aiConfig.provider : (_aiConfig.gemini ? 'gemini' : 'openai');

        $.ajax({
            url: BASE_URL + '/vehicle-fuels/translate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ text: text, languages: langs, provider: provider }),
            success: function(res) {
                $btn.prop('disabled', false).html(origHtml);
                if (res.status === 200 && res.data && res.data.translations) {
                    var tr = res.data.translations;
                    var filled = 0;
                    for (var langId in tr) {
                        var $inp = $('input[name="trans_' + langId + '"]');
                        if ($inp.length && tr[langId]) {
                            $inp.val(tr[langId]);
                            // Flash green briefly
                            $inp.css('background', '#d4edda');
                            (function($el){ setTimeout(function(){ $el.css('background', ''); }, 1500); })($inp);
                            filled++;
                        }
                    }
                    toastr.success(filled + ' translations filled' + (res.data.provider ? ' via ' + res.data.provider : ''));
                } else {
                    toastr.error(res.message || 'Translation failed.');
                }
            },
            error: function() {
                $btn.prop('disabled', false).html(origHtml);
                toastr.error(T('general.network_error', 'Network error.'));
            }
        });
    });

    /* ══════════════════════════════════════════════════════
       TRANSLATE SINGLE — per-field button
    ══════════════════════════════════════════════════════ */
    $(document).on('click', '.ai-single-btn', function() {
        var text = $('#fName').val().trim();
        if (!text) { toastr.error('Enter part name first.'); $('#fName').focus(); return; }

        var $btn = $(this);
        var langId   = $btn.data('lang-id');
        var langName = $btn.data('lang-name');
        var langCode = $btn.data('lang-code');

        var origHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        var provider = (_aiConfig && _aiConfig.provider) ? _aiConfig.provider : (_aiConfig.gemini ? 'gemini' : 'openai');

        $.ajax({
            url: BASE_URL + '/vehicle-fuels/translate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                text: text,
                languages: [{ id: langId, name: langName, code: langCode }],
                provider: provider
            }),
            success: function(res) {
                $btn.prop('disabled', false).html(origHtml);
                if (res.status === 200 && res.data && res.data.translations) {
                    var val = res.data.translations[langId];
                    if (val) {
                        var $inp = $('input[name="trans_' + langId + '"]');
                        $inp.val(val);
                        $inp.css('background', '#d4edda');
                        setTimeout(function(){ $inp.css('background', ''); }, 1500);
                        toastr.success(langName + ': ' + val);
                    } else {
                        toastr.warning('No translation returned for ' + langName);
                    }
                } else {
                    toastr.error(res.message || T('msg.failed','Failed.'));
                }
            },
            error: function() {
                $btn.prop('disabled', false).html(origHtml);
                toastr.error(T('general.network_error', 'Network error.'));
            }
        });
    });

    /* ══════════════════════════════════════════════════════
       IMAGE PREVIEW on file select
    ══════════════════════════════════════════════════════ */
    $('#fImage').on('change', function() {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toastr.error('Max 5 MB'); $(this).val(''); return; }
        var reader = new FileReader();
        reader.onload = function(e) {
            $('#newImagePreview').html(
                '<div class="border rounded p-2 mb-2"><div class="text-muted small mb-1"><i class="bi bi-file-earmark-image me-1"></i>' + T('general.preview','Preview') + '</div>' +
                '<img src="' + e.target.result + '" class="rounded" style="max-width:100%;max-height:160px;object-fit:contain;"/></div>'
            );
        };
        reader.readAsDataURL(file);
        $('#fRemoveImg').prop('checked', false);
    });

    $('#fRemoveImg').on('change', function() {
        if ($(this).is(':checked')) { $('#fImage').val(''); $('#newImagePreview').html(''); }
    });

    /* ── Image popup ── */
    $(document).on('click', '.sms-img-preview', function() {
        var $img     = $(this);
        var title    = $img.data('title') || T('vehicle_fuels.image_preview','Image Preview');
        var uploaded = $img.data('uploaded') || '';
        var external = $img.data('external') || '';
        if (!uploaded && !external) return;

        $('#imgPopupTitle').text(title);
        var html = '<div class="row g-3">';
        if (uploaded) {
            html += '<div class="' + (external ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
            html += '<div class="text-muted small mb-2"><i class="bi bi-cloud-upload me-1 text-success"></i><strong>' + T('vehicle_fuels.image_uploaded','Uploaded') + '</strong></div>';
            html += '<img src="' + H.esc(uploaded) + '" class="rounded" style="max-width:100%;max-height:240px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/>';
            html += '<div class="mt-2"><a href="' + H.esc(uploaded) + '" target="_blank" class="btn btn-sm btn-outline-primary" download><i class="bi bi-download me-1"></i>' + T('general.download','Download') + '</a></div>';
            html += '</div></div>';
        }
        if (external) {
            html += '<div class="' + (uploaded ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
            html += '<div class="text-muted small mb-2"><i class="bi bi-link-45deg me-1 text-info"></i><strong>' + T('general.external_url','External URL') + '</strong></div>';
            html += '<img src="' + H.esc(external) + '" class="rounded" style="max-width:100%;max-height:240px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/>';
            html += '<div class="mt-2"><a href="' + H.esc(external) + '" target="_blank" class="btn btn-sm btn-outline-info"><i class="bi bi-box-arrow-up-right me-1"></i>' + T('general.open_file','Open') + '</a></div>';
            html += '</div></div>';
        }
        html += '</div>';
        $('#imgPopupBody').html(html);
        bootstrap.Modal.getOrCreateInstance($('#modalImageForm')[0]).show();
    });

    /* ══════════════════════════════════════════════════════
       FORM SUBMIT
    ══════════════════════════════════════════════════════ */
    $('#frmPartType').on('submit', function(e) {
        e.preventDefault();
        var partName = $('#fName').val().trim();
        if (!partName) { toastr.error('Part name is required.'); $('#fName').focus(); return; }

        var $btn = $('#btnSubmit');
        var fd   = new FormData(this);

        var translations = {};
        (FD.langIds || []).forEach(function(lid) {
            var val = $('input[name="trans_' + lid + '"]').val();
            if (val && val.trim()) translations[lid] = val.trim();
            fd.delete('trans_' + lid);
        });
        fd.append('translations', JSON.stringify(translations));

        btnLoading($btn);
        $.ajax({
            url: $(this).attr('action'), type: 'POST', data: fd, processData: false, contentType: false,
            success: function(r) {
                btnReset($btn);
                if (r.status === 200 || r.status === 201) {
                    toastr.success(r.message || T('msg.settings_saved','Saved.'));
                    setTimeout(function() { window.location = '/vehicle-fuels'; }, 800);
                } else toastr.error(r.message || T('general.error','Error.'));
            },
            error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
        });
    });

    /* ── Init ── */
    checkAIConfig();
});
