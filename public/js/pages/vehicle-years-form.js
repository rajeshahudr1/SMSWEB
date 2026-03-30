/* vehicle-years-form.js — simplified: year integer only */
'use strict';

$(function() {
    var T = function(k,f){ return SMS_T(k,f); };

    // Block non-numeric input
    $('#fYear').on('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    $('#frmYear').on('submit', function(e) {
        e.preventDefault();

        var yearVal = $('#fYear').val().trim();
        if (!yearVal) { toastr.error('Year is required.'); $('#fYear').focus(); return; }

        var yr = parseInt(yearVal);
        if (isNaN(yr) || yr < 1900 || yr > 2100) {
            toastr.error('Enter a valid year between 1900 and 2100.');
            $('#fYear').focus();
            return;
        }

        var $btn = $('#btnSubmit');
        var payload = { year: yr };

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
                    toastr.success(r.message || T('msg.settings_saved','Saved.'));
                    setTimeout(function() { window.location = '/vehicle-years'; }, 800);
                } else {
                    toastr.error(r.message || T('general.error','Error.'));
                }
            },
            error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
        });
    });
});
