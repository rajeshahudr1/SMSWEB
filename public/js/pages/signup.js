/* ── signup.js ── SMS Web — 3-step signup ─── */

$(function () {
    var formData = {};

    function btnLoad($btn, text) {
        $btn.prop('disabled', true).data('orig', $btn.html())
            .html('<span class="spinner-border spinner-border-sm me-1"></span>' + text);
    }
    function btnReset($btn) {
        $btn.prop('disabled', false).html($btn.data('orig'));
    }
    function showStep(n) {
        $('#step1,#step2,#step3').hide();
        $('#step' + n).show();
        $('.sms-step').removeClass('active done');
        $('#ind' + n).addClass('active');
        for (var i = 1; i < n; i++) { $('#ind' + i).addClass('done'); }
    }
    function clearErrors() {
        $('[id^="err-"]').html('');
        $('.form-control,.form-select,.sms-input-group input').removeClass('is-invalid');
    }

    // ── STEP 1 → validate + go to step 2 ──
    $('#btnS1Next').on('click', function () {
        clearErrors();
        var ok      = true;
        var company = $('#s1_company').val().trim();
        var yard    = $('#s1_yard_type').val();
        var email   = $('#s1_email').val().trim();

        if (!company) { $('#err-company_name').text('Company name is required.'); $('#s1_company').addClass('is-invalid'); ok = false; }
        if (!yard)    { $('#err-yard_type').text('Please select yard type.');     $('#s1_yard_type').addClass('is-invalid'); ok = false; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            $('#err-email').text('A valid email address is required.');
            $('#s1_email').addClass('is-invalid'); ok = false;
        }
        if (!ok) return;
        $.each($('#frm1').serializeArray(), function (_, f) { formData[f.name] = f.value; });
        showStep(2);
    });

    // ── STEP 2 back ──
    $('#btnS2Back').on('click', function () { showStep(1); });

    // ── Password strength ──
    $('#s2_pw').on('input', function () {
        var v = $(this).val(), s = 0;
        if (v.length >= 8) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        var c = ['#d63939','#f59f00','#2fb344','#2fb344'][Math.max(0, s-1)];
        var w = ['25%','50%','75%','100%'][Math.max(0, s-1)];
        $('#pwBar').css({ width: s ? w : '0', background: c });
    });

    $('#btnToggleS2Pw').on('click', function () {
        var $inp = $('#s2_pw'), isPass = $inp.attr('type') === 'password';
        $inp.attr('type', isPass ? 'text' : 'password');
        $('#s2EyeIcon').toggleClass('ti-eye', !isPass).toggleClass('ti-eye-off', isPass);
    });

    // ── STEP 2 submit ──
    $('#btnS2Submit').on('click', function () {
        clearErrors();
        var name = $('#s2_name').val().trim();
        var pw   = $('#s2_pw').val();
        var cpw  = $('#s2_cpw').val();
        var ok   = true;

        if (!name)      { $('#err-name').text('Full name is required.'); $('#s2_name').addClass('is-invalid'); ok = false; }
        if (pw.length < 8) { $('#err-password').text('Password must be at least 8 characters.'); $('#s2_pw').addClass('is-invalid'); ok = false; }
        if (pw !== cpw) { $('#err-confirm_password').text('Passwords do not match.'); $('#s2_cpw').addClass('is-invalid'); ok = false; }
        if (!ok) return;

        $.each($('#frm2').serializeArray(), function (_, f) { formData[f.name] = f.value; });

        var $btn = $(this);
        btnLoad($btn, 'Creating account…');

        $.ajax({
            url: BASE_URL + '/signup', type: 'POST', data: formData, dataType: 'json',
            success: function (res) {
                btnReset($btn);
                if (res.status === 201) {
                    toastr.success('Account created! Check your email for OTP.');
                    $('#otpEmailDisplay').text(formData.email);
                    showStep(3);
                    setTimeout(function () { $('.sms-otp-box').first().focus(); }, 200);
                } else {
                    toastr.error(res.message || 'Signup failed.');
                }
            },
            error: function () { btnReset($btn); toastr.error('Server error. Please try again.'); }
        });
    });

    // ── OTP input auto-advance ──
    $(document).on('input', '.sms-otp-box', function () {
        var v = $(this).val().replace(/\D/g, '');
        $(this).val(v).toggleClass('filled', !!v);
        if (v.length === 1) $(this).next('.sms-otp-box').focus();
    });
    $(document).on('keydown', '.sms-otp-box', function (e) {
        if (e.key === 'Backspace' && !$(this).val()) $(this).prev('.sms-otp-box').focus();
    });

    // ── OTP submit ──
    $('#frm3').on('submit', function (e) {
        e.preventDefault();
        $('#err-otp').html('');
        var otp = $.map($('.sms-otp-box'), function (el) { return $(el).val(); }).join('');
        if (otp.length < 6) { $('#err-otp').text('Please enter all 6 digits.'); return; }

        var $btn = $('#btnVerifyOTP');
        btnLoad($btn, 'Verifying…');

        $.ajax({
            url: BASE_URL + '/verify-email', type: 'POST',
            data: { email: formData.email, otp: otp }, dataType: 'json',
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) {
                    toastr.success('Email verified! Logging you in…');
                    setTimeout(function () { window.location.href = BASE_URL + '/dashboard'; }, 800);
                } else {
                    $('#err-otp').text(res.message || 'Invalid OTP.');
                }
            },
            error: function () { btnReset($btn); toastr.error('Server error.'); }
        });
    });

    // ── Resend OTP ──
    $('#btnResendOTP').on('click', function () {
        var $btn = $(this);
        $btn.prop('disabled', true).text('Sending…');
        $.post(BASE_URL + '/resend-otp', { email: formData.email }, function (res) {
            $btn.prop('disabled', false).text('Resend OTP');
            if (res.status === 200) toastr.success('New OTP sent!');
            else toastr.error(res.message || 'Failed to resend OTP.');
        }, 'json').fail(function () { $btn.prop('disabled', false).text('Resend OTP'); toastr.error('Server error.'); });
    });

    // ── Google signup button ──
    $('#btnGoogleSignup').on('click', function () {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.prompt();
        } else {
            toastr.warning('Google Sign-In is loading. Please try again.');
        }
    });
});

// ── Google callback (global) ──
function googleSignIn(idToken, mode) {
    $.ajax({
        url: BASE_URL + '/auth/google', type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ id_token: idToken }),
        dataType: 'json',
        success: function (res) {
            if (res.status === 200) {
                if (res.data && res.data.profile_complete === false) {
                    window.location.href = BASE_URL + '/google-complete?token=' + encodeURIComponent(res.data.temp_token);
                } else {
                    toastr.success('Google sign-in successful!');
                    setTimeout(function () { window.location.href = BASE_URL + '/dashboard'; }, 700);
                }
            } else {
                toastr.error(res.message || 'Google sign-in failed.');
            }
        },
        error: function () { toastr.error('Could not connect. Please try again.'); }
    });
}
