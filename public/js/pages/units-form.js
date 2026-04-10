/* units-form.js */
'use strict';

$(function() {
    var FD = window._FORM_DATA || {};
    var T  = function(k,f){ return typeof SMS_T==='function'?SMS_T(k,f):(f||k); };

    /* ══════════════════════════════════════════════════════
       FORM SUBMIT
    ══════════════════════════════════════════════════════ */
    $('#frmUnit').on('submit', function(e) {
        e.preventDefault();
        var unitName = $('#fName').val().trim();
        if (!unitName) { toastr.error('Unit name is required.'); $('#fName').focus(); return; }

        var $btn = $('#btnSubmit');
        var data = {};

        // Gather form fields
        data.name = unitName;
        data.symbol = ($('#fSymbol').val() || '').trim();
        if ($('select[name="company_id"]').length) data.company_id = $('select[name="company_id"]').val();
        if ($('select[name="status"]').length) data.status = $('select[name="status"]').val();
        // Collect translations
        var trans = {};
        $('.trans-input').each(function() { var lid = $(this).data('lang-id'); var v = $(this).val().trim(); if (lid) trans[lid] = v; });
        data.translations = trans;

        btnLoading($btn);
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(r) {
                btnReset($btn);
                if (r.status === 200 || r.status === 201) {
                    toastr.success(r.message || T('msg.settings_saved','Saved.'));
                    setTimeout(function() { window.location = '/units'; }, 800);
                } else toastr.error(r.message || T('general.error','Error.'));
            },
            error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
        });
    });
});
