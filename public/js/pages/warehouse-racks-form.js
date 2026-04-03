/* warehouse-racks-form.js */
'use strict';
$(function(){
    var FD = window._FORM_DATA || {};

    /* Warehouse Select2 — shows name (code), filtered by company */
    function initWarehouseSelect2() {
        $('#fWarehouse').select2({
            theme: 'bootstrap-5',
            placeholder: 'Select Warehouse',
            allowClear: true,
            width: '100%',
            ajax: {
                url: BASE_URL + '/warehouses/autocomplete',
                dataType: 'json',
                delay: 250,
                data: function(params) {
                    var d = { q: params.term || '' };
                    if (FD.isSuperAdmin && $('#fCompany').val()) d.company_id = $('#fCompany').val();
                    return d;
                },
                processResults: function(res) {
                    return { results: (res.data || []).map(function(w) {
                        return { id: w.id, text: w.name + ' (' + (w.code || '') + ')' };
                    })};
                }
            }
        });
    }
    initWarehouseSelect2();

    /* Zone Select2 */
    function initZoneSelect2() {
        $('#fZone').select2({
            theme: 'bootstrap-5',
            placeholder: 'Select Zone',
            allowClear: true,
            width: '100%',
            ajax: {
                url: BASE_URL + '/warehouse-zones/autocomplete',
                dataType: 'json',
                delay: 250,
                data: function(params) {
                    var d = { q: params.term || '', warehouse_id: $('#fWarehouse').val() };
                    if (FD.isSuperAdmin && $('#fCompany').val()) d.company_id = $('#fCompany').val();
                    return d;
                },
                processResults: function(res) {
                    return { results: (res.data || []).map(function(z) {
                        return { id: z.id, text: z.name + ' (' + (z.code || '') + ')' };
                    })};
                }
            }
        });
    }
    initZoneSelect2();

    /* Shelf Select2 */
    function initShelfSelect2() {
        $('#fShelf').select2({
            theme: 'bootstrap-5',
            placeholder: 'Select Shelf',
            allowClear: true,
            width: '100%',
            ajax: {
                url: BASE_URL + '/warehouse-shelves/autocomplete',
                dataType: 'json',
                delay: 250,
                data: function(params) {
                    var d = { q: params.term || '', zone_id: $('#fZone').val() };
                    if (FD.isSuperAdmin && $('#fCompany').val()) d.company_id = $('#fCompany').val();
                    return d;
                },
                processResults: function(res) {
                    return { results: (res.data || []).map(function(s) {
                        return { id: s.id, text: s.name + ' (' + (s.code || '') + ')' };
                    })};
                }
            }
        });
    }
    initShelfSelect2();

    /* Company change → clear all child dropdowns */
    $('#fCompany').on('change', function() {
        $('#fWarehouse').val(null).trigger('change');
        $('#fZone').val(null).trigger('change');
        $('#fShelf').val(null).trigger('change');
    });

    /* Cascade: warehouse -> clear zone & shelf */
    $('#fWarehouse').on('change', function() {
        $('#fZone').val(null).trigger('change');
        $('#fShelf').val(null).trigger('change');
    });

    /* Cascade: zone -> clear shelf */
    $('#fZone').on('change', function() {
        $('#fShelf').val(null).trigger('change');
    });

    /* Pre-select on edit */
    if (FD.isEdit && FD.warehouseId) {
        $.get(BASE_URL + '/warehouses/autocomplete', { id: FD.warehouseId }, function(res) {
            if (res && res.data && res.data.length) {
                var w = res.data[0];
                $('#fWarehouse').append(new Option(w.name + ' (' + (w.code || '') + ')', w.id, true, true)).trigger('change');
            }
        });
    }
    if (FD.isEdit && FD.zoneId) {
        $.get(BASE_URL + '/warehouse-zones/autocomplete', { id: FD.zoneId }, function(res) {
            if (res && res.data && res.data.length) {
                var z = res.data[0];
                $('#fZone').append(new Option(z.name + ' (' + (z.code || '') + ')', z.id, true, true)).trigger('change');
            }
        });
    }
    if (FD.isEdit && FD.shelfId) {
        $.get(BASE_URL + '/warehouse-shelves/autocomplete', { id: FD.shelfId }, function(res) {
            if (res && res.data && res.data.length) {
                var s = res.data[0];
                $('#fShelf').append(new Option(s.name + ' (' + (s.code || '') + ')', s.id, true, true)).trigger('change');
            }
        });
    }

    /* Form submit */
    $('#frmMain').on('submit', function(e) {
        e.preventDefault();
        if (FD.isSuperAdmin && $('#fCompany').length && !$('#fCompany').val()) {
            toastr.error('Please select a company.');
            $('#fCompany').focus();
            return;
        }
        if (!$('#fWarehouse').val()) { toastr.error('Please select a warehouse.'); return; }
        if (!$('#fZone').val()) { toastr.error('Please select a zone.'); return; }
        if (!$('#fShelf').val()) { toastr.error('Please select a shelf.'); return; }
        if (!$('#fName').val().trim()) { toastr.error('Rack name is required.'); $('#fName').focus(); return; }
        if (!$('#fCode').val().trim()) { toastr.error('Rack code is required.'); $('#fCode').focus(); return; }

        var data = {};
        $(this).serializeArray().forEach(function(f) { data[f.name] = f.value; });
        data.warehouse_id = $('#fWarehouse').val();
        data.zone_id = $('#fZone').val();
        data.shelf_id = $('#fShelf').val();
        if (!FD.isEdit) data.status = 1;

        var $btn = $('#btnSubmit');
        btnLoading($btn);
        $.ajax({
            url: $(this).attr('action'), type: 'POST',
            data: JSON.stringify(data), contentType: 'application/json',
            success: function(r) {
                btnReset($btn);
                if (r.status === 200 || r.status === 201) {
                    toastr.success(r.message || 'Saved.');
                    setTimeout(function() { window.location = '/warehouse-racks'; }, 800);
                } else toastr.error(r.message || 'Error.');
            },
            error: function() { btnReset($btn); toastr.error('Network error.'); }
        });
    });
});
