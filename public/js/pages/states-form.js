/* states-form.js */
'use strict';
$(function(){
    var F = window._FORM || {};
    var T = function(k,f){ return SMS_T(k,f); };

    $('#fldCountry').select2({ placeholder: 'Search country...', allowClear: true, width: '100%',
        ajax: { url: BASE_URL + '/countries/autocomplete', dataType: 'json', delay: 250,
            data: function(p) { return { search: p.term || '', limit: 50 }; },
            processResults: function(r) { return { results: (r.data||[]).map(function(x){ return {id:x.id, text:x.name}; }) }; }, cache: true
        }, minimumInputLength: 0
    });

    // Pre-select on edit
    if (F.fkId && F.fkName) {
        var opt = new Option(F.fkName, F.fkId, true, true);
        $('#fldCountry').append(opt).trigger('change');
    }

    $('#frmSave').on('submit', function(e) {
        e.preventDefault(); var $b = $('#btnSave'); btnLoading($b);
        var data = {}; $(this).serializeArray().forEach(function(f) { data[f.name] = f.value; });
        var url = F.isEdit ? BASE_URL + '/states/' + F.uuid : BASE_URL + '/states';
        $.post(url, data, function(res) {
            btnReset($b);
            if (res.status === 200 || res.status === 201) { toastr.success(res.message || T('msg.settings_saved','Saved.')); window.location.href = BASE_URL + '/states'; }
            else toastr.error(res.message || T('msg.failed','Failed.'));
        }).fail(function() { btnReset($b); toastr.error(T('general.network_error','Network error.')); });
    });
});
