/* vehicle-makes-form.js */
'use strict';
$(function() {
    var FD = window._FORM_DATA || {};

    $('#selVehicleType').select2({ placeholder: 'Select Vehicle Type...', allowClear: true, width: '100%',
        ajax: { url: BASE_URL + '/vehicle-types/autocomplete', dataType: 'json', delay: 300,
            data: function(params) { return { search: params.term || '', limit: '' }; },
            processResults: function(res) { return { results: (res.data||[]).map(function(r){ return {id:r.id,text:r.name}; }) }; }, cache: true
        }, minimumInputLength: 0
    });
    var _aiConfig = null;
    function checkAIConfig() {
        $.get(BASE_URL + '/vehicle-makes/ai-config', function(res) {
            if (!res||res.status!==200||!res.data) return;
            _aiConfig = res.data;
            if (_aiConfig.enabled) $('.ai-translate-btn').removeClass('d-none');
        });
    }
    $('#btnTranslateAll').on('click', function() {
        var text = $('#fName').val().trim();
        if (!text) { toastr.error('Enter name first.'); $('#fName').focus(); return; }
        var langs = FD.langs||[]; if (!langs.length) return;
        var $b = $(this), o = $b.html();
        $b.prop('disabled',true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating…');
        $.ajax({ url: BASE_URL+'/vehicle-makes/translate', type:'POST', contentType:'application/json',
            data: JSON.stringify({ text:text, languages:langs, provider:(_aiConfig&&_aiConfig.provider)||'openai' }),
            success: function(res) {
                $b.prop('disabled',false).html(o);
                if (res.status===200&&res.data&&res.data.translations) {
                    var tr=res.data.translations, n=0;
                    for (var lid in tr) { var $i=$('input[name="trans_'+lid+'"]'); if ($i.length&&tr[lid]) { $i.val(tr[lid]); $i.css('background','#d4edda'); (function(el){setTimeout(function(){el.css('background','');},1500);})($i); n++; } }
                    toastr.success(n+' translations filled');
                } else toastr.error(res.message||'Failed.');
            }, error: function() { $b.prop('disabled',false).html(o); toastr.error('Network error.'); }
        });
    });
    $(document).on('click','.ai-single-btn', function() {
        var text=$('#fName').val().trim(); if (!text) { toastr.error('Enter name first.'); return; }
        var $b=$(this), lid=$b.data('lang-id'), lnm=$b.data('lang-name'), lcd=$b.data('lang-code'), o=$b.html();
        $b.prop('disabled',true).html('<span class="spinner-border spinner-border-sm"></span>');
        $.ajax({ url: BASE_URL+'/vehicle-makes/translate', type:'POST', contentType:'application/json',
            data: JSON.stringify({ text:text, languages:[{id:lid,name:lnm,code:lcd}], provider:(_aiConfig&&_aiConfig.provider)||'openai' }),
            success: function(res) {
                $b.prop('disabled',false).html(o);
                if (res.status===200&&res.data&&res.data.translations&&res.data.translations[lid]) {
                    var $i=$('input[name="trans_'+lid+'"]'); $i.val(res.data.translations[lid]);
                    $i.css('background','#d4edda'); setTimeout(function(){$i.css('background','');},1500);
                } else toastr.error('Failed.');
            }, error: function() { $b.prop('disabled',false).html(o); toastr.error('Network error.'); }
        });
    });
    $('#fImage').on('change', function() {
        var f=this.files[0]; if (!f) return;
        if (f.size>5*1024*1024) { toastr.error('Max 5 MB'); $(this).val(''); return; }
        var r=new FileReader();
        r.onload=function(e) { $('#newImagePreview').html('<div class="border rounded p-2 mb-2"><img src="'+e.target.result+'" class="rounded" style="max-width:100%;max-height:140px;object-fit:contain;"/></div>'); };
        r.readAsDataURL(f);
    });
    $('#frmPartType').on('submit', function(e) {
        e.preventDefault();
        var nm=$('#fName').val().trim();
        if (!nm) { toastr.error('Name is required.'); $('#fName').focus(); return; }
        var $btn=$('#btnSubmit'), fd=new FormData(this);
        fd.set('vehicle_type_id', $('#selVehicleType').val() || '');
        var translations={};
        (FD.langIds||[]).forEach(function(lid) { var v=$('input[name="trans_'+lid+'"]').val(); if (v&&v.trim()) translations[lid]=v.trim(); fd.delete('trans_'+lid); });
        fd.append('translations', JSON.stringify(translations));
        btnLoading($btn);
        $.ajax({ url:$(this).attr('action'), type:'POST', data:fd, processData:false, contentType:false,
            success: function(r) { btnReset($btn); if (r.status===200||r.status===201) { toastr.success(r.message||'Saved.'); setTimeout(function(){ window.location='/vehicle-makes'; },800); } else toastr.error(r.message||'Error.'); },
            error: function() { btnReset($btn); toastr.error('Network error.'); }
        });
    });
    checkAIConfig();
});
