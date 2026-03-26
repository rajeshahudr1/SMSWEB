/* cities-form.js */
'use strict';
$(function(){
    var F = window._FORM || {};

    $('#fldState').select2({ placeholder: 'Search state...', allowClear: true, width: '100%',
        ajax: { url: BASE_URL + '/states/autocomplete', dataType: 'json', delay: 250,
            data: function(p) { return { search: p.term || '', limit: 50 }; },
            processResults: function(r) { return { results: (r.data||[]).map(function(x){ return {id:x.id, text:x.name}; }) }; }, cache: true
        }, minimumInputLength: 0
    });

    // Pre-select on edit
    if (F.fkId && F.fkName) {
        var opt = new Option(F.fkName, F.fkId, true, true);
        $('#fldState').append(opt).trigger('change');
    }

    $('#frmSave').on('submit', function(e) {
        e.preventDefault(); var $b = $('#btnSave'); btnLoading($b);
        var data = {}; $(this).serializeArray().forEach(function(f) { data[f.name] = f.value; });
        var url = F.isEdit ? BASE_URL + '/cities/' + F.uuid : BASE_URL + '/cities';
        $.post(url, data, function(res) {
            btnReset($b);
            if (res.status === 200 || res.status === 201) { toastr.success(res.message || 'Saved.'); window.location.href = BASE_URL + '/cities'; }
            else toastr.error(res.message || 'Failed.');
        }).fail(function() { btnReset($b); toastr.error('Network error.'); });
    });
});
