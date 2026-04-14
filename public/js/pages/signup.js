/* ── signup.js ── SMS Web — 4-step signup ── */
/* Depends on: /js/common/location.js, /js/common/phone.js  */
var T=function(k,f){return SMS_T(k,f);};

$(function () {
    var formData  = {};   // accumulates text fields from steps 1–3
    var fileInput = null; // address_proof File object (step 2)

    /* ══════════════════════════════════════
       HELPERS
    ══════════════════════════════════════ */
    function showStep(n) {
        $('#step1,#step2,#step3,#step4').hide();
        $('#step' + n).show();
        $('.sms-step').removeClass('active done');
        $('#ind' + n).addClass('active');
        for (var i = 1; i < n; i++) $('#ind' + i).addClass('done');
        var $p = $('.sms-auth-cover__right');
        if ($p.length) $p[0].scrollTop = 0;
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function fieldErr(id, msg) { $('#err-' + id).text(msg); }
    function clearErrors() {
        $('[id^="err-"]').text('');
        $('.is-invalid').removeClass('is-invalid');
    }
    function btnLoading($b) {
        $b.prop('disabled', true).data('orig', $b.html())
            .html('<span class="spinner-border spinner-border-sm me-1"></span>Processing…');
    }
    function btnReset($b) { $b.prop('disabled', false).html($b.data('orig')); }

    /* ══════════════════════════════════════
       PHONE WIDGET (Step 1) — via SMS_Phone
    ══════════════════════════════════════ */
    SMS_Phone.init({ wrapEl: '#s1PhoneWrap', hiddenEl: '#s1_phone' });

    /* ══════════════════════════════════════
       LOCATION CASCADE (Step 2) — via SMS_Location
    ══════════════════════════════════════ */
    SMS_Location.init({
        countryEl: '#s2_country',
        stateEl:   '#s2_state',
        cityEl:    '#s2_city',
    });

    /* ══════════════════════════════════════
       FILE UPLOAD — Step 2 drag & drop
    ══════════════════════════════════════ */
    $('#s2_proof').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        var icon = file.type.indexOf('image') !== -1 ? 'bi-file-image' :
            file.name.endsWith('.pdf')         ? 'bi-file-pdf'   : 'bi-file-earmark';
        $('#s2ProofLabel').html(
            '<i class="bi ' + icon + ' fs-4 d-block mb-1 text-success"></i>' +
            '<span class="fw-medium text-success">' + file.name + '</span>' +
            '<small class="d-block text-muted mt-1">' + (file.size / 1024).toFixed(0) + ' KB &nbsp;·&nbsp; Click to change</small>'
        );
    });

    $('#s2ProofUploadBox').on('dragover dragleave', function (e) {
        e.preventDefault();
        $(this).toggleClass('drag-over', e.type === 'dragover');
    }).on('drop', function (e) {
        e.preventDefault();
        $(this).removeClass('drag-over');
        var dt = e.originalEvent.dataTransfer;
        if (dt && dt.files.length) {
            document.getElementById('s2_proof').files = dt.files;
            $('#s2_proof').trigger('change');
        }
    });

    /* ══════════════════════════════════════
       STEP 1 → validate + advance
    ══════════════════════════════════════ */
    $('#btnS1Next').on('click', function () {
        clearErrors();
        var ok      = true;
        var company = $('#s1_company').val().trim();
        var reg     = $('#s1_reg').val().trim();
        var email   = $('#s1_email').val().trim();

        if (!company) {
            fieldErr('company_name', T('form.company_required','Company name is required.'));
            $('#s1_company').addClass('is-invalid'); ok = false;
        }
        if (!reg) {
            fieldErr('registration_number', T('form.reg_required','Registration number is required.'));
            $('#s1_reg').addClass('is-invalid'); ok = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            fieldErr('email', T('form.valid_email_required','A valid email address is required.'));
            $('#s1_email').addClass('is-invalid'); ok = false;
        }
        var phoneResult = SMS_Phone.validate('#s1PhoneWrap');
        if (!phoneResult.valid) {
            fieldErr('phone', phoneResult.error);
            $('#s1PhoneWrap .sms-phone-group').addClass('is-invalid');
            ok = false;
        }
        if (!ok) return;

        formData.company_name        = company;
        formData.registration_number = reg;
        formData.email               = email;
        formData.phone               = phoneResult.value;

        showStep(2);
    });

    /* ══════════════════════════════════════
       STEP 2 → validate + advance
    ══════════════════════════════════════ */
    $('#btnS2Back').on('click', function () { showStep(1); });

    $('#btnS2Next').on('click', function () {
        clearErrors();
        var ok      = true;
        var locVals = SMS_Location.getValues('#s2_country', '#s2_state', '#s2_city');
        var zip     = $('#s2_zip').val().trim();
        var address = $('#s2_address').val().trim();

        if (!locVals.country_id) { fieldErr('country_id', T('form.country_required','Country is required.')); ok = false; }
        if (!locVals.state_id)   { fieldErr('state_id',   T('form.state_required','State is required.'));   ok = false; }
        if (!locVals.city_id)    { fieldErr('city_id',    T('form.city_required','City is required.'));     ok = false; }
        if (!zip)                { fieldErr('zip_code',   T('form.zip_required','ZIP code is required.')); ok = false; }
        if (!address)            { fieldErr('address',    T('form.address_required','Address is required.'));  ok = false; }

        var fileEl = document.getElementById('s2_proof');
        if (fileEl && fileEl.files.length > 0) {
            var file  = fileEl.files[0];
            var ext   = file.name.split('.').pop().toLowerCase();
            var valid = ['jpg','jpeg','png','pdf','doc','docx'].indexOf(ext) !== -1;
            if (!valid) {
                fieldErr('address_proof', T('form.file_type_invalid','Only JPG, PNG, PDF, DOC or DOCX files allowed.'));
                ok = false;
            } else if (file.size > 10 * 1024 * 1024) {
                fieldErr('address_proof', T('msg.file_under_10mb','File must be under 10MB.'));
                ok = false;
            } else {
                fileInput = file;
            }
        } else {
            fileInput = null;
        }

        if (!ok) return;

        formData.country_id = locVals.country_id;
        formData.state_id   = locVals.state_id;
        formData.city_id    = locVals.city_id;
        formData.zip_code   = zip;
        formData.address    = address;

        showStep(3);
    });

    /* ══════════════════════════════════════
       STEP 3 → validate + submit
    ══════════════════════════════════════ */
    $('#btnS3Back').on('click', function () { showStep(2); });

    $('#s3_pw').on('input', function () {
        var v = $(this).val(), s = 0;
        if (v.length >= 8) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        var colors = ['#d63939','#f59f00','#2fb344','#2fb344'];
        var widths = ['25%','50%','75%','100%'];
        $('#pwBar').css({ width: s ? widths[s-1] : '0', background: s ? colors[s-1] : '' });
    });

    $('#btnToggleS3Pw').on('click', function () {
        var $i = $('#s3_pw'), isP = $i.attr('type') === 'password';
        $i.attr('type', isP ? 'text' : 'password');
        $('#s3EyeIcon').toggleClass('bi-eye', !isP).toggleClass('bi-eye-slash', isP);
    });

    $('#btnS3Submit').on('click', function () {
        clearErrors();
        var name = $('#s3_name').val().trim();
        var pw   = $('#s3_pw').val();
        var cpw  = $('#s3_cpw').val();
        var ok   = true;

        if (!name)         { fieldErr('name',             T('form.name_required','Full name is required.'));             $('#s3_name').addClass('is-invalid'); ok = false; }
        if (pw.length < 8) { fieldErr('password',         T('auth.pw_min_8','Password must be at least 8 chars.')); $('#s3_pw').addClass('is-invalid');   ok = false; }
        if (pw !== cpw)    { fieldErr('confirm_password', T('auth.pw_mismatch','Passwords do not match.'));            $('#s3_cpw').addClass('is-invalid');   ok = false; }
        if (!ok) return;

        formData.name             = name;
        formData.password         = pw;
        formData.confirm_password = cpw;

        var fd = new FormData();
        Object.keys(formData).forEach(function (k) {
            if (formData[k] !== undefined && formData[k] !== null && formData[k] !== '') {
                fd.append(k, formData[k]);
            }
        });
        if (fileInput) fd.append('address_proof', fileInput, fileInput.name);

        var $btn = $(this);
        btnLoading($btn);

        $.ajax({
            url:         BASE_URL + '/signup',
            type:        'POST',
            data:        fd,
            processData: false,
            contentType: false,
            dataType:    'json',
            success: function (res) {
                btnReset($btn);
                if (res.status === 201) {
                    toastr.success(T('auth.account_created','Account created! Check your email for OTP.'));
                    $('#otpEmailDisplay').text(formData.email);
                    showStep(4);
                    setTimeout(function () { $('.sms-otp-box').first().focus(); }, 200);
                } else {
                    var msg = (res.errors && res.errors[0]) ? res.errors[0].message : res.message;
                    toastr.error(msg || T('auth.signup_failed','Signup failed.'));
                }
            },
            error: function () { btnReset($btn); toastr.error(T('general.server_error','Server error. Please try again.')); },
        });
    });

    /* ══════════════════════════════════════
       STEP 4 — OTP
    ══════════════════════════════════════ */
    $(document).on('input', '.sms-otp-box', function () {
        var v = $(this).val().replace(/\D/g, '');
        $(this).val(v).toggleClass('filled', !!v);
        if (v) $(this).next('.sms-otp-box').focus();
    });
    $(document).on('keydown', '.sms-otp-box', function (e) {
        if (e.key === 'Backspace' && !$(this).val()) $(this).prev('.sms-otp-box').focus();
    });

    $('#btnVerifyOTP').on('click', function () {
        $('#err-otp').text('');
        var otp = $.map($('.sms-otp-box'), function (el) { return $(el).val(); }).join('');
        if (otp.length < 6) { $('#err-otp').text(T('auth.enter_6_digits','Please enter all 6 digits.')); return; }

        var $btn = $(this).prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-1"></span>Verifying…');

        $.post(BASE_URL + '/verify-email', { email: formData.email, otp: otp }, function (res) {
            $btn.prop('disabled', false).html('Verify &amp; Login');
            if (res.status === 200) {
                toastr.success(T('auth.email_verified','Email verified! Logging you in…'));
                setTimeout(function () { window.location.href = res.redirect || (BASE_URL + '/dashboard'); }, 800);
            } else {
                $('#err-otp').text(res.message || T('auth.invalid_otp','Invalid OTP.'));
            }
        }, 'json').fail(function () {
            $btn.prop('disabled', false).html('Verify &amp; Login');
            toastr.error(T('general.server_error_short','Server error.'));
        });
    });

    $('#btnResendOTP').on('click', function () {
        var $btn = $(this).prop('disabled', true).text(T('msg.sending','Sending…'));
        $.post(BASE_URL + '/resend-otp', { email: formData.email }, function (res) {
            $btn.prop('disabled', false).text('Resend OTP');
            if (res.status === 200) toastr.success(T('auth.otp_sent','New OTP sent!'));
            else toastr.error(res.message || T('auth.failed_resend','Failed to resend.'));
        }, 'json').fail(function () {
            $btn.prop('disabled', false).text('Resend OTP');
        });
    });

    /* ── Google button ── */
    $('#btnGoogleSignup').on('click', function () {
        if (typeof google !== 'undefined' && google.accounts) google.accounts.id.prompt();
        else toastr.warning(T('auth.google_loading','Google Sign-In is loading. Please try again.'));
    });

}); // end $(function)

/* ══════════════════════════════════════
   GOOGLE — global callbacks
   (must be outside $(function) so Google SDK can call them)
══════════════════════════════════════ */
function handleGoogleCredential(response) {
    if (window.googleSignIn) googleSignIn(response.credential);
}

function googleSignIn(idToken) {
    $.ajax({
        url:         BASE_URL + '/auth/google',
        type:        'POST',
        contentType: 'application/json',
        data:        JSON.stringify({ id_token: idToken }),
        dataType:    'json',
        success: function (res) {
            if (res.status === 200) {
                if (res.data && res.data.profile_complete === false) {
                    var gd = res.data.google_data || {};
                    var qs = '?token='  + encodeURIComponent(res.data.temp_token)
                        + '&gname='  + encodeURIComponent(gd.name    || '')
                        + '&gemail=' + encodeURIComponent(gd.email   || '')
                        + '&gpic='   + encodeURIComponent(gd.picture || '');
                    window.location.href = BASE_URL + '/google-complete' + qs;
                } else {
                    toastr.success(T('auth.google_signin_success','Google sign-in successful!'));
                    setTimeout(function () { window.location.href = res.redirect || (BASE_URL + '/dashboard'); }, 700);
                }
            } else {
                toastr.error(res.message || T('auth.google_signin_failed','Google sign-in failed.'));
            }
        },
        error: function () { toastr.error(T('general.could_not_connect_retry','Could not connect. Please try again.')); },
    });
}