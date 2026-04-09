/* warehouse-zones-form.js */
'use strict';
var T=function(k,f){return (typeof SMS_T==='function')?SMS_T(k,f):(f||k);};
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

    /* Company change → clear warehouse */
    $('#fCompany').on('change', function() {
        $('#fWarehouse').val(null).trigger('change');
    });

    /* Pre-select warehouse on edit */
    if (FD.isEdit && FD.warehouseId) {
        $.get(BASE_URL + '/warehouses/autocomplete', { id: FD.warehouseId }, function(res) {
            if (res && res.data && res.data.length) {
                var w = res.data[0];
                $('#fWarehouse').append(new Option(w.name + ' (' + (w.code || '') + ')', w.id, true, true)).trigger('change');
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
        if (!$('#fWarehouse').val()) {
            toastr.error('Please select a warehouse.');
            return;
        }
        if (!$('#fName').val().trim()) {
            toastr.error('Zone name is required.');
            $('#fName').focus();
            return;
        }
        if (!$('#fCode').val().trim()) {
            toastr.error('Zone code is required.');
            $('#fCode').focus();
            return;
        }

        var data = {};
        $(this).serializeArray().forEach(function(f) { data[f.name] = f.value; });
        data.warehouse_id = $('#fWarehouse').val();
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
                    setTimeout(function() { window.location = '/warehouse-zones'; }, 800);
                } else toastr.error(r.message || 'Error.');
            },
            error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
        });
    });
});
