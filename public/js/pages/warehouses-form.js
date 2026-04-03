/* warehouses-form.js */
'use strict';
$(function(){
    var FD = window._FORM_DATA || {};

    /* Form submit */
    $('#frmMain').on('submit', function(e){
        e.preventDefault();
        var name = $('#fName').val().trim();
        if(!name){ toastr.error('Warehouse name is required.'); $('#fName').focus(); return; }
        var code = $('#fCode').val().trim();
        if(!code){ toastr.error('Warehouse code is required.'); $('#fCode').focus(); return; }

        if (FD.isSuperAdmin && $('#fCompany').length && !$('#fCompany').val()) {
            toastr.error('Please select a company.');
            $('#fCompany').focus();
            return;
        }

        var data = {};
        $(this).serializeArray().forEach(function(f){ data[f.name] = f.value; });
        if (!FD.isEdit) data.status = 1;

        var $btn = $('#btnSubmit');
        btnLoading($btn);
        $.ajax({
            url: $(this).attr('action'), type: 'POST',
            data: JSON.stringify(data), contentType: 'application/json',
            success: function(r){
                btnReset($btn);
                if(r.status===200||r.status===201){
                    toastr.success(r.message||'Saved.');
                    setTimeout(function(){ window.location='/warehouses'; },800);
                } else toastr.error(r.message||'Error.');
            },
            error: function(){ btnReset($btn); toastr.error('Network error.'); }
        });
    });
});
