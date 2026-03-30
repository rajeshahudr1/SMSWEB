/* ── google-complete.js ── SMS Web ── */
/* Depends on: /js/common/location.js, /js/common/phone.js */
var T=function(k,f){return SMS_T(k,f);};

$(function () {

    /* DEBUG — remove after confirming token is present */
    var _tok = $('#gcTempToken').val();
    console.log('[google-complete] temp_token value:', _tok ? _tok.slice(0,40)+'...' : 'EMPTY — this causes Session expired error');

    /* PHONE WIDGET */
    SMS_Phone.init({ wrapEl: '#gcPhoneWrap', hiddenEl: '#gc_phone' });

    /* LOCATION CASCADE */
    SMS_Location.init({
        countryEl: '#gc_country',
        stateEl:   '#gc_state',
        cityEl:    '#gc_city',
    });

    /* FILE UPLOAD drag & drop */
    $('#gc_proof').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        var icon = file.type.indexOf('image') !== -1 ? 'bi-file-image' :
            file.name.endsWith('.pdf')         ? 'bi-file-pdf'   : 'bi-file-earmark';
        $('#gcProofLabel').html(
            '<i class="bi ' + icon + ' fs-4 d-block mb-1 text-success"></i>' +
            '<span class="fw-medium text-success">' + file.name + '</span>' +
            '<small class="d-block text-muted mt-1">' + (file.size / 1024).toFixed(0) + ' KB &nbsp;·&nbsp; Click to change</small>'
        );
    });

    var $gcBox = $('#gcProofUploadBox');
    if ($gcBox.length) {
        $gcBox.on('dragover dragleave', function (e) {
            e.preventDefault();
            $(this).toggleClass('drag-over', e.type === 'dragover');
        });
        $gcBox.on('drop', function (e) {
            e.preventDefault();
            $(this).removeClass('drag-over');
            var dt = e.originalEvent.dataTransfer;
            if (dt && dt.files.length) {
                document.getElementById('gc_proof').files = dt.files;
                $('#gc_proof').trigger('change');
            }
        });
    }

    /* FORM SUBMIT */
    $('#frmGoogleComplete').on('submit', function (e) {
        e.preventDefault();
        $('[id^="err-"]').text('');
        $('.is-invalid').removeClass('is-invalid');

        var tempTok  = $('#gcTempToken').val();
        var company  = $('#gc_company').val().trim();
        var reg      = $('#gc_reg').val().trim();
        var zip      = $('#gc_zip').val().trim();
        var address  = $('#gc_address').val().trim();
        var locVals  = SMS_Location.getValues('#gc_country', '#gc_state', '#gc_city');
        var phoneRes = SMS_Phone.validate('#gcPhoneWrap');
        var fileEl   = document.getElementById('gc_proof');
        var ok       = true;

        if (!tempTok) { toastr.error(T('auth.session_expired','Session expired. Please sign in with Google again.')); return; }
        if (!company) { $('#err-company_name').text(T('form.company_required','Company name is required.')); ok = false; }
        if (!locVals.country_id) { $('#err-country_id').text(T('form.country_required','Country is required.')); ok = false; }
        if (!locVals.state_id)   { $('#err-state_id').text(T('form.state_required','State is required.'));   ok = false; }
        if (!locVals.city_id)    { $('#err-city_id').text(T('form.city_required','City is required.'));     ok = false; }
        if (!zip)    { $('#err-zip_code').text(T('form.zip_required','ZIP code is required.')); ok = false; }
        if (!address){ $('#err-address').text(T('form.address_required','Address is required.'));  ok = false; }

        // Phone required on this form
        if (!phoneRes.valid) {
            $('#err-phone').text(phoneRes.error || T('form.valid_phone_required','Valid phone number required.'));
            $('#gcPhoneWrap .sms-phone-group').addClass('is-invalid');
            ok = false;
        }

        // Address proof file — optional but validate if provided
        var proofFile = null;
        if (fileEl && fileEl.files.length > 0) {
            var file = fileEl.files[0];
            var ext  = file.name.split('.').pop().toLowerCase();
            if (['jpg','jpeg','png','pdf','doc','docx'].indexOf(ext) === -1) {
                $('#err-address_proof').text(T('form.file_type_invalid','Only JPG, PNG, PDF, DOC or DOCX files allowed.'));
                ok = false;
            } else if (file.size > 10 * 1024 * 1024) {
                $('#err-address_proof').text(T('msg.file_under_10mb','File must be under 10MB.'));
                ok = false;
            } else {
                proofFile = file;
            }
        }

        if (!ok) return;

        // Build multipart FormData
        var fd = new FormData();
        fd.append('temp_token',          tempTok);
        fd.append('company_name',        company);
        fd.append('registration_number', reg);
        fd.append('phone',               phoneRes.value);
        fd.append('country_id',          locVals.country_id);
        fd.append('state_id',            locVals.state_id);
        fd.append('city_id',             locVals.city_id);
        fd.append('zip_code',            zip);
        fd.append('address',             address);
        if (proofFile) fd.append('address_proof', proofFile, proofFile.name);

        var $btn = $('#btnGCSubmit')
            .prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-1"></span>'+T('auth.setting_up','Setting up…'));

        $.ajax({
            url:         BASE_URL + '/google-complete',
            type:        'POST',
            data:        fd,
            processData: false,
            contentType: false,
            dataType:    'json',
            success: function (res) {
                if (res.status === 200 || res.status === 201) {
                    toastr.success(T('auth.setup_complete','Setup complete! Welcome to SMS.'));
                    setTimeout(function () { window.location.href = BASE_URL + '/dashboard'; }, 700);
                } else {
                    var msg = (res.errors && res.errors[0]) ? res.errors[0].message : res.message;
                    toastr.error(msg || T('auth.setup_failed','Setup failed.'));
                    $btn.prop('disabled', false)
                        .html('<i class="bi bi-check-lg me-1"></i> Complete Setup &amp; Login');
                }
            },
            error: function () {
                toastr.error(T('general.server_error','Server error. Please try again.'));
                $btn.prop('disabled', false)
                    .html('<i class="bi bi-check-lg me-1"></i> Complete Setup &amp; Login');
            },
        });
    });
});