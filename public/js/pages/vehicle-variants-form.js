/* vehicle-variants-form.js */
'use strict';
$(function() {
    var FD = window._FORM_DATA || {};

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


    /* ── Vehicle Model autocomplete (filtered by type + make) ── */
    $('#selVehicleModel').select2({
        theme: 'bootstrap-5', allowClear: true, placeholder: 'Select Model...',
        ajax: { url: BASE_URL + '/vehicle-models/autocomplete', dataType: 'json', delay: 300,
            data: function(p) {
                var d = { search: p.term || '' };
                var tid = $('#selVehicleType').val(); if (tid) d.vehicle_type_id = tid;
                var mid = $('#selVehicleMake').val(); if (mid) d.vehicle_make_id = mid;
                return d;
            },
            processResults: function(res) { return { results: (res.data||[]).map(function(r) {
                    return { id: r.id, text: r.name,
                        vehicle_type_id: r.vehicle_type_id, vehicle_type_name: r.vehicle_type_name,
                        vehicle_make_id: r.vehicle_make_id, vehicle_make_name: r.vehicle_make_name,
                        vehicle_year_id: r.vehicle_year_id, vehicle_year_name: r.vehicle_year_name };
                }) }; }, cache: true
        }, minimumInputLength: 0
    });

    /* ── Reverse cascade: Model selected → auto-fill Year, Type, Make ── */
    $('#selVehicleModel').on('select2:select', function(e) {
        var data = e.params.data;
        if (!data) return;
        _autoFilling = true;

        // Auto-fill Vehicle Type
        if (data.vehicle_type_id && data.vehicle_type_name) {
            if ($('#selVehicleType').find('option[value="' + data.vehicle_type_id + '"]').length === 0) {
                $('#selVehicleType').append(new Option(data.vehicle_type_name, data.vehicle_type_id, true, true));
            } else {
                $('#selVehicleType').val(data.vehicle_type_id);
            }
            $('#selVehicleType').trigger('change');
        }

        // Auto-fill Vehicle Make
        setTimeout(function() {
            if (data.vehicle_make_id && data.vehicle_make_name) {
                var makeLabel = data.vehicle_type_name ? data.vehicle_make_name + ' (' + data.vehicle_type_name + ')' : data.vehicle_make_name;
                if ($('#selVehicleMake').find('option[value="' + data.vehicle_make_id + '"]').length === 0) {
                    $('#selVehicleMake').append(new Option(makeLabel, data.vehicle_make_id, true, true));
                } else {
                    $('#selVehicleMake').val(data.vehicle_make_id);
                }
                $('#selVehicleMake').trigger('change');
            }

            // Auto-fill Vehicle Year
            setTimeout(function() {
                if (data.vehicle_year_id && data.vehicle_year_name) {
                    if ($('#selVehicleYear').find('option[value="' + data.vehicle_year_id + '"]').length === 0) {
                        $('#selVehicleYear').append(new Option(data.vehicle_year_name, data.vehicle_year_id, true, true));
                    } else {
                        $('#selVehicleYear').val(data.vehicle_year_id);
                    }
                    $('#selVehicleYear').trigger('change');
                }
                _autoFilling = false;
                toastr.info('Year, Type & Make auto-filled from Model');
            }, 50);
        }, 50);
    });

    /* ── Auto-fill flag (plain var, not jQuery data) ── */
    var _autoFilling = false;

    /* ── Auto-fill: when Make selected → set Type from make's linked type → keep make ── */
    $('#selVehicleMake').on('select2:select', function(e) {
        var data = e.params.data;
        if (!data || !data.vehicle_type_id || !data.vehicle_type_name) return;

        var savedMakeId = data.id;
        var savedMakeName = data.text;
        var savedTypeName = data.vehicle_type_name;
        var typeId = data.vehicle_type_id;
        var typeName = data.vehicle_type_name;

        // Only auto-fill type if empty or different
        var currentTypeId = $('#selVehicleType').val();
        if (currentTypeId && String(currentTypeId) === String(typeId)) return; // already correct type

        // 1. Set flag so cascade does NOT clear make
        _autoFilling = true;

        // 2. Set Vehicle Type
        // Remove old options and add new one
        if ($('#selVehicleType').find('option[value="' + typeId + '"]').length === 0) {
            $('#selVehicleType').append(new Option(typeName, typeId, true, true));
        } else {
            $('#selVehicleType').val(typeId);
        }
        $('#selVehicleType').trigger('change');

        // 3. Re-ensure make is still selected (in case something cleared it)
        setTimeout(function() {
            if (!$('#selVehicleMake').val() || $('#selVehicleMake').val() != savedMakeId) {
                if ($('#selVehicleMake').find('option[value="' + savedMakeId + '"]').length === 0) {
                    var label = savedTypeName ? savedMakeName + ' (' + savedTypeName + ')' : savedMakeName;
                    $('#selVehicleMake').append(new Option(label, savedMakeId, true, true));
                } else {
                    $('#selVehicleMake').val(savedMakeId);
                }
                $('#selVehicleMake').trigger('change');
            }
            _autoFilling = false;
        }, 50);

        if (!currentTypeId) toastr.info('Vehicle Type auto-filled: ' + typeName);
    });

    /* ── Cascade: company → clear all, type → clear make (unless auto-filling) ── */
    $('#selCompany').on('change', function() {
        $('#selVehicleYear').val(null).trigger('change');
        $('#selVehicleType').val(null).trigger('change');
        $('#selVehicleMake').val(null).trigger('change');
        $('#selVehicleModel').val(null).trigger('change');
    });
    $('#selVehicleType').on('change', function() {
        if (!_autoFilling) {
            $('#selVehicleMake').val(null).trigger('change');
            $('#selVehicleModel').val(null).trigger('change');
        }
    });
    $('#selVehicleMake').on('change', function() {
        if (!_autoFilling) {
            $('#selVehicleModel').val(null).trigger('change');
        }
    });

    /* ── AI Config ── */
    var _aiConfig = null;
    function checkAIConfig() {
        $.get(BASE_URL + '/vehicle-variants/ai-config', function(res) {
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
        $.ajax({ url: BASE_URL + '/vehicle-variants/translate', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ text: text, languages: langs, provider: (_aiConfig && _aiConfig.provider) || 'openai' }),
            success: function(res) {
                $b.prop('disabled', false).html(o);
                if (res.status === 200 && res.data && res.data.translations) {
                    var tr = res.data.translations, n = 0;
                    for (var lid in tr) { var $i = $('input[name="trans_' + lid + '"]'); if ($i.length && tr[lid]) { $i.val(tr[lid]); $i.css('background', '#d4edda'); (function(el) { setTimeout(function() { el.css('background', ''); }, 1500); })($i); n++; } }
                    toastr.success(n + ' translations filled');
                } else toastr.error(res.message || 'Failed.');
            }, error: function() { $b.prop('disabled', false).html(o); toastr.error('Network error.'); }
        });
    });
    $(document).on('click', '.ai-single-btn', function() {
        var text = $('#fName').val().trim(); if (!text) { toastr.error('Enter name first.'); return; }
        var $b = $(this), lid = $b.data('lang-id'), lnm = $b.data('lang-name'), lcd = $b.data('lang-code'), o = $b.html();
        $b.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
        $.ajax({ url: BASE_URL + '/vehicle-variants/translate', type: 'POST', contentType: 'application/json',
            data: JSON.stringify({ text: text, languages: [{ id: lid, name: lnm, code: lcd }], provider: (_aiConfig && _aiConfig.provider) || 'openai' }),
            success: function(res) { $b.prop('disabled', false).html(o); if (res.status === 200 && res.data && res.data.translations && res.data.translations[lid]) { var $i = $('input[name="trans_' + lid + '"]'); $i.val(res.data.translations[lid]); $i.css('background', '#d4edda'); setTimeout(function() { $i.css('background', ''); }, 1500); } else toastr.error('Failed.'); },
            error: function() { $b.prop('disabled', false).html(o); toastr.error('Network error.'); }
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
        if (!nm) { toastr.error('Variant name is required.'); $('#fName').focus(); return; }
        if (nm.length < 2) { toastr.error('Name must be at least 2 characters.'); return; }
        if (!$('#selVehicleType').val()) { toastr.error('Vehicle Type is required.'); return; }
        if (!$('#selVehicleMake').val()) { toastr.error('Vehicle Make is required.'); return; }
        if (!$('#selVehicleModel').val()) { toastr.error('Vehicle Model is required.'); return; }
        if (!$('#selVehicleYear').val()) { toastr.error('Vehicle Year is required.'); return; }

        var $btn = $('#btnSubmit'), fd = new FormData(this);
        fd.set('vehicle_year_id', $('#selVehicleYear').val() || '');
        fd.set('vehicle_type_id', $('#selVehicleType').val() || '');
        fd.set('vehicle_make_id', $('#selVehicleMake').val() || '');
        fd.set('vehicle_model_id', $('#selVehicleModel').val() || '');

        var translations = {};
        (FD.langIds || []).forEach(function(lid) { var v = $('input[name="trans_' + lid + '"]').val(); if (v && v.trim()) translations[lid] = v.trim(); fd.delete('trans_' + lid); });
        fd.append('translations', JSON.stringify(translations));

        btnLoading($btn);
        $.ajax({ url: $(this).attr('action'), type: 'POST', data: fd, processData: false, contentType: false,
            success: function(r) { btnReset($btn); if (r.status === 200 || r.status === 201) { toastr.success(r.message || 'Saved.'); setTimeout(function() { window.location = '/vehicle-variants'; }, 800); } else toastr.error(r.message || 'Error.'); },
            error: function() { btnReset($btn); toastr.error('Network error.'); }
        });
    });

    checkAIConfig();
});