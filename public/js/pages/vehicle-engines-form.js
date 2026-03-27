/* vehicle-engines-form.js */
'use strict';

$(function() {
    var FD = window._FORM_DATA || {};
    var T  = function(k,f){ return typeof SMS_T==='function'?SMS_T(k,f):(f||k); };
    var _aiConfig = null;

    /* ══════════════════════════════════════════════════════
       VARIANTS — Multi-select autocomplete (Select2 AJAX)
    ══════════════════════════════════════════════════════ */
    $('#selVariants').select2({
        placeholder: T('vehicle_engines.select_variants', 'Search and select variants...'),
        allowClear: true,
        multiple: true,
        width: '100%',
        ajax: {
            url: BASE_URL + '/vehicle-variants/autocomplete',
            dataType: 'json',
            delay: 300,
            data: function(params) {
                return { search: params.term || '', limit: '' };
            },
            processResults: function(res) {
                return {
                    results: (res.data || []).map(function(r) {
                        return { id: r.id, text: r.name };
                    })
                };
            },
            cache: true
        },
        minimumInputLength: 0  // Show results on open without typing
    });

    // Pre-populate existing variants on edit
    if (FD.existingVariants && FD.existingVariants.length) {
        FD.existingVariants.forEach(function(v) {
            if (!$('#selVariants').find('option[value="' + v.id + '"]').length) {
                var opt = new Option(v.text, v.id, true, true);
                $('#selVariants').append(opt);
            }
        });
        $('#selVariants').trigger('change');
    }

    /* ══════════════════════════════════════════════════════
       AI CONFIG
    ══════════════════════════════════════════════════════ */
    function checkAIConfig() {
        $.get(BASE_URL + '/vehicle-engines/ai-config', function(res) {
            if (!res || res.status !== 200 || !res.data) return;
            _aiConfig = res.data;
            if (_aiConfig.enabled && (_aiConfig.openai || _aiConfig.gemini || _aiConfig.provider)) {
                $('.ai-translate-btn').removeClass('d-none');
            }
        });
    }

    /* ══════════════════════════════════════════════════════
       TRANSLATE ALL
    ══════════════════════════════════════════════════════ */
    $('#btnTranslateAll').on('click', function() {
        var text = $('#fManufacturerEngine').val().trim();
        if (!text) { toastr.error('Enter manufacturer engine name first.'); $('#fManufacturerEngine').focus(); return; }

        var langs = FD.langs || [];
        if (!langs.length) return;

        var $btn = $(this);
        var origHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating…');

        var provider = (_aiConfig && _aiConfig.provider) ? _aiConfig.provider : 'openai';

        $.ajax({
            url: BASE_URL + '/vehicle-engines/translate',
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
       TRANSLATE SINGLE
    ══════════════════════════════════════════════════════ */
    $(document).on('click', '.ai-single-btn', function() {
        var text = $('#fManufacturerEngine').val().trim();
        if (!text) { toastr.error('Enter manufacturer engine name first.'); $('#fManufacturerEngine').focus(); return; }

        var $btn = $(this);
        var langId   = $btn.data('lang-id');
        var langName = $btn.data('lang-name');
        var langCode = $btn.data('lang-code');

        var origHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        var provider = (_aiConfig && _aiConfig.provider) ? _aiConfig.provider : 'openai';

        $.ajax({
            url: BASE_URL + '/vehicle-engines/translate',
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
                    toastr.error(res.message || 'Failed.');
                }
            },
            error: function() {
                $btn.prop('disabled', false).html(origHtml);
                toastr.error(T('general.network_error', 'Network error.'));
            }
        });
    });

    /* ══════════════════════════════════════════════════════
       FORM SUBMIT (JSON — no image upload)
    ══════════════════════════════════════════════════════ */
    $('#frmEngine').on('submit', function(e) {
        e.preventDefault();

        var motorCode = $('#fMotorCode').val().trim();
        var mfgEngine = $('#fManufacturerEngine').val().trim();
        if (!motorCode) { toastr.error('Motor code is required.'); $('#fMotorCode').focus(); return; }
        if (!mfgEngine) { toastr.error('Manufacturer engine is required.'); $('#fManufacturerEngine').focus(); return; }
        if (motorCode.length > 255) { toastr.error('Motor code max 255 characters.'); return; }
        if (mfgEngine.length > 255) { toastr.error('Engine name max 255 characters.'); return; }

        var $btn = $('#btnSubmit');

        // Collect translations
        var translations = {};
        (FD.langIds || []).forEach(function(lid) {
            var val = $('input[name="trans_' + lid + '"]').val();
            if (val && val.trim()) translations[lid] = val.trim();
        });

        // Collect variant IDs
        var variantIds = $('#selVariants').val() || [];

        var payload = {
            manufacturer_engine: mfgEngine,
            motor_code: motorCode,
            start_year: $('#fStartYear').val() || null,
            end_year:   $('#fEndYear').val()   || null,
            kw:         $('#fKw').val()         || null,
            hp:         $('#fHp').val()         || null,
            translations: JSON.stringify(translations),
            variant_ids:  JSON.stringify(variantIds.map(function(v){ return parseInt(v); }))
        };

        // Company
        if ($('#selCompany').length) payload.company_id = $('#selCompany').val();

        // Status (edit only)
        var $status = $('select[name="status"]');
        if ($status.length) payload.status = $status.val();

        btnLoading($btn);
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function(r) {
                btnReset($btn);
                if (r.status === 200 || r.status === 201) {
                    toastr.success(r.message || 'Saved.');
                    setTimeout(function() { window.location = '/vehicle-engines'; }, 800);
                } else toastr.error(r.message || 'Error.');
            },
            error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
        });
    });

    /* ── Init ── */
    checkAIConfig();
});
