/* vehicle-models-form.js */
'use strict';
$(function() {
    var FD = window._FORM_DATA || {};
    var T = function(k,f){ return SMS_T(k,f); };

    function getCompanyId() {
        var co = $('#selCompany').val();
        if (co && co !== 'all' && co !== 'global') return co;
        if (co === 'global') return 'global';
        return '';
    }

    /* ── Vehicle Year autocomplete ── */
    $('#selVehicleYear').select2({
        placeholder: 'Select Year...', allowClear: true, width: '100%',
        ajax: { url: BASE_URL + '/vehicle-years/autocomplete', dataType: 'json', delay: 300,
            data: function(params) { var d = { search: params.term || '', limit: 50 }; var co = getCompanyId(); if (co) d.company_id = co; return d; },
            processResults: function(res) { return { results: (res.data || []).map(function(r) { return { id: r.id, text: r.name }; }) }; }, cache: true
        }, minimumInputLength: 0
    });

    /* ── Vehicle Type autocomplete ── */
    $('#selVehicleType').select2({
        placeholder: 'Select Type... *', allowClear: true, width: '100%',
        ajax: { url: BASE_URL + '/vehicle-types/autocomplete', dataType: 'json', delay: 300,
            data: function(params) { var d = { search: params.term || '', limit: 50 }; var co = getCompanyId(); if (co) d.company_id = co; return d; },
            processResults: function(res) { return { results: (res.data || []).map(function(r) { return { id: r.id, text: r.name }; }) }; }, cache: true
        }, minimumInputLength: 0
    });

    /* ── Vehicle Make autocomplete (filtered by type) — shows "Make (Type)" ── */
    function fmtMake(item) {
        if (!item.id) return item.text;
        var label = '<strong>' + item.text + '</strong>';
        if (item.vehicle_type_name) label += ' <span class="text-muted small">(' + item.vehicle_type_name + ')</span>';
        return $('<span>' + label + '</span>');
    }
    function fmtMakeSel(item) {
        if (!item.id) return item.text;
        return item.vehicle_type_name ? item.text + ' (' + item.vehicle_type_name + ')' : item.text;
    }
    $('#selVehicleMake').select2({
        placeholder: 'Select Make... *', allowClear: true, width: '100%',
        templateResult: fmtMake, templateSelection: fmtMakeSel,
        ajax: { url: BASE_URL + '/vehicle-makes/autocomplete', dataType: 'json', delay: 300,
            data: function(params) {
                var d = { search: params.term || '', limit: 50 };
                var co = getCompanyId(); if (co) d.company_id = co;
                var tid = $('#selVehicleType').val(); if (tid) d.vehicle_type_id = tid;
                return d;
            },
            processResults: function(res) {
                return { results: (res.data || []).map(function(r) {
                        return { id: r.id, text: r.name, vehicle_type_id: r.vehicle_type_id || null, vehicle_type_name: r.vehicle_type_name || '' };
                    }) };
            }, cache: true
        }, minimumInputLength: 0
    });

    /* ── Auto-fill: when Make is selected, auto-set Vehicle Type if empty ── */
    $('#selVehicleMake').on('select2:select', function(e) {
        var data = e.params.data;
        if (!data) return;
        // Auto-fill vehicle type from the make's linked type
        if (data.vehicle_type_id && data.vehicle_type_name) {
            var currentTypeId = $('#selVehicleType').val();
            if (!currentTypeId) {
                // Set flag BEFORE triggering change so cascade doesn't clear make
                $('#selVehicleType').data('auto-filling', true);
                var newOpt = new Option(data.vehicle_type_name, data.vehicle_type_id, true, true);
                $('#selVehicleType').append(newOpt).trigger('change');
                $('#selVehicleType').data('auto-filling', false);
                toastr.info('Vehicle Type auto-filled: ' + data.vehicle_type_name);
            }
        }
    });

    /* ── Cascade: company → clear all, type → clear make ── */
    $('#selCompany').on('change', function() {
        $('#selVehicleYear').val(null).trigger('change');
        $('#selVehicleType').val(null).trigger('change');
        $('#selVehicleMake').val(null).trigger('change');
    });
    $('#selVehicleType').on('change', function() {
        // Only clear make if type was actively changed by user (not auto-filled)
        if (!$(this).data('auto-filling')) {
            $('#selVehicleMake').val(null).trigger('change');
        }
    });

    /* ── AI Config ── */
    var _aiConfig = null;
    function checkAIConfig() {
        $.get(BASE_URL + '/vehicle-models/ai-config', function(res) {
            if (!res || res.status !== 200 || !res.data) return;
            _aiConfig = res.data;
            if (_aiConfig.enabled) $('.ai-translate-btn').removeClass('d-none');
        });
    }
    $('#btnTranslateAll').on('click', function() {
        var text = $('#fName').val().trim();
        if (!text) { toastr.error('Enter model name first.'); $('#fName').focus(); return; }
        var langs = FD.langs || []; if (!langs.length) return;
        var $b = $(this), o = $b.html();
        $b.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating…');
        $.ajax({ url: BASE_URL + '/vehicle-models/translate', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ text: text, languages: langs, provider: (_aiConfig && _aiConfig.provider) || 'openai' }),
            success: function(res) {
                $b.prop('disabled', false).html(o);
                if (res.status === 200 && res.data && res.data.translations) {
                    var tr = res.data.translations, n = 0;
                    for (var lid in tr) { var $i = $('input[name="trans_' + lid + '"]'); if ($i.length && tr[lid]) { $i.val(tr[lid]); $i.css('background', '#d4edda'); (function(el) { setTimeout(function() { el.css('background', ''); }, 1500); })($i); n++; } }
                    toastr.success(n + ' translations filled');
                } else toastr.error(res.message || T('msg.failed','Failed.'));
            }, error: function() { $b.prop('disabled', false).html(o); toastr.error(T('general.network_error','Network error.')); }
        });
    });
    $(document).on('click', '.ai-single-btn', function() {
        var text = $('#fName').val().trim(); if (!text) { toastr.error('Enter name first.'); return; }
        var $b = $(this), lid = $b.data('lang-id'), lnm = $b.data('lang-name'), lcd = $b.data('lang-code'), o = $b.html();
        $b.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
        $.ajax({ url: BASE_URL + '/vehicle-models/translate', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ text: text, languages: [{ id: lid, name: lnm, code: lcd }], provider: (_aiConfig && _aiConfig.provider) || 'openai' }),
            success: function(res) { $b.prop('disabled', false).html(o); if (res.status === 200 && res.data && res.data.translations && res.data.translations[lid]) { var $i = $('input[name="trans_' + lid + '"]'); $i.val(res.data.translations[lid]); $i.css('background', '#d4edda'); setTimeout(function() { $i.css('background', ''); }, 1500); } else toastr.error(T('msg.failed','Failed.')); },
            error: function() { $b.prop('disabled', false).html(o); toastr.error(T('general.network_error','Network error.')); }
        });
    });

    /* ── Image preview ── */
    $('#fImage').on('change', function() {
        var f = this.files[0]; if (!f) return;
        if (f.size > 5 * 1024 * 1024) { toastr.error('Max 5 MB'); $(this).val(''); return; }
        var r = new FileReader();
        r.onload = function(e) { $('#newImagePreview').html('<div class="border rounded p-2 mb-2"><img src="' + e.target.result + '" class="rounded" style="max-width:100%;max-height:140px;object-fit:contain;"/></div>'); };
        r.readAsDataURL(f);
    });

    /* ── Form submit ── */
    $('#frmPartType').on('submit', function(e) {
        e.preventDefault();
        var nm = $('#fName').val().trim();
        if (!nm) { toastr.error('Model name is required.'); $('#fName').focus(); return; }
        if (nm.length < 2) { toastr.error('Name must be at least 2 characters.'); return; }
        if (!$('#selVehicleType').val()) { toastr.error('Vehicle Type is required.'); return; }
        if (!$('#selVehicleMake').val()) { toastr.error('Vehicle Make is required.'); return; }

        var $btn = $('#btnSubmit'), fd = new FormData(this);
        fd.set('vehicle_year_id', $('#selVehicleYear').val() || '');
        fd.set('vehicle_type_id', $('#selVehicleType').val() || '');
        fd.set('vehicle_make_id', $('#selVehicleMake').val() || '');

        var translations = {};
        (FD.langIds || []).forEach(function(lid) { var v = $('input[name="trans_' + lid + '"]').val(); if (v && v.trim()) translations[lid] = v.trim(); fd.delete('trans_' + lid); });
        fd.append('translations', JSON.stringify(translations));

        btnLoading($btn);
        $.ajax({ url: $(this).attr('action'), type: 'POST', data: fd, processData: false, contentType: false,
            success: function(r) { btnReset($btn); if (r.status === 200 || r.status === 201) { toastr.success(r.message || T('msg.settings_saved','Saved.')); setTimeout(function() { window.location = '/vehicle-models'; }, 800); } else toastr.error(r.message || T('general.error','Error.')); },
            error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
        });
    });

    checkAIConfig();
});