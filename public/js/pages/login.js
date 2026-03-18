/* ── login.js ── SMS Web ───────────────────────── */

$(function () {

    // ── Helpers ──────────────────────────────────
    function btnLoad($btn, text) {
        $btn.prop('disabled', true)
            .data('orig', $btn.html())
            .html('<span class="spinner-border spinner-border-sm me-1" role="status"></span>' + text);
    }
    function btnReset($btn) {
        $btn.prop('disabled', false).html($btn.data('orig'));
    }

    // ── Panel selector ───────────────────────────
    $(document).on('click', '.sms-panel-chip', function () {
        $('.sms-panel-chip').removeClass('active');
        $(this).addClass('active');
        $('#fPanel').val($(this).data('panel'));
    });

    // ── Password show/hide ───────────────────────
    $('#btnTogglePw').on('click', function () {
        var $inp = $('#fPassword');
        var isPass = $inp.attr('type') === 'password';
        $inp.attr('type', isPass ? 'text' : 'password');
        $('#eyeIcon').toggleClass('bi-eye', !isPass).toggleClass('bi-eye-slash', isPass);
    });

    // ── Google button click → open picker ────────
    $('#btnGoogleLogin').on('click', function () {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.prompt();
        } else {
            toastr.warning('Google Sign-In is loading. Please try again in a moment.');
        }
    });

    // ── Form validation + submit ─────────────────
    $('#frmLogin').validate({
        errorElement:   'span',
        errorClass:     'text-danger',
        errorPlacement: function (error, element) {
            var errId = element.attr('id') === 'fEmail' ? 'err-email' : 'err-password';
            $('#' + errId).html(error.text());
        },
        highlight:   function (el) { $(el).addClass('is-invalid'); },
        unhighlight: function (el) { $(el).removeClass('is-invalid'); },
        rules: {
            email:    { required: true, email: true },
            password: { required: true },
        },
        messages: {
            email:    { required: 'Please enter your email.', email: 'Enter a valid email address.' },
            password: { required: 'Please enter your password.' },
        },
        submitHandler: function () {
            var $btn = $('#btnLogin');
            btnLoad($btn, 'Signing in...');

            $.ajax({
                url:         BASE_URL + '/login',
                type:        'POST',
                data:        $('#frmLogin').serialize(),
                dataType:    'json',
                success: function (res) {
                    if (res.status === 200) {
                        toastr.success('Login successful! Redirecting...');
                        setTimeout(function () {
                            window.location.href = '/dashboard';
                        }, 700);
                    } else if (res.status === 403) {
                        // Email not verified
                        toastr.warning(res.message);
                        setTimeout(function () {
                            window.location.href = '/verify-email?email=' + encodeURIComponent($('#fEmail').val());
                        }, 1800);
                        btnReset($btn);
                    } else {
                        toastr.error(res.message || 'Invalid email or password.');
                        btnReset($btn);
                    }
                },
                error: function () {
                    toastr.error('Server error. Please try again.');
                    btnReset($btn);
                }
            });
        }
    });

});

// ── Google credential callback ────────────────────
// called by Google Identity Services (defined globally so GIS can reach it)
function googleSignIn(idToken, mode) {
    mode = mode || 'login';
    var $btn = $('#btnGoogleLogin');
    $btn.prop('disabled', true).html(
        '<span class="spinner-border spinner-border-sm me-1"></span>Connecting...'
    );

    $.ajax({
        url:         BASE_URL + '/auth/google',
        type:        'POST',
        contentType: 'application/json',
        data:        JSON.stringify({ id_token: idToken }),
        dataType:    'json',
        success: function (res) {
            if (res.status === 200) {
                if (res.data && res.data.profile_complete === false) {
                    // New Google user — complete profile
                    var gd = res.data.google_data || {};
                    var qs = '?token='  + encodeURIComponent(res.data.temp_token)
                        + '&gname='  + encodeURIComponent(gd.name    || '')
                        + '&gemail=' + encodeURIComponent(gd.email   || '')
                        + '&gpic='   + encodeURIComponent(gd.picture || '');
                    window.location.href = BASE_URL + '/google-complete' + qs;
                } else {
                    toastr.success('Google login successful!');
                    setTimeout(function () { window.location.href = '/dashboard'; }, 700);
                }
            } else {
                toastr.error(res.message || 'Google sign-in failed.');
                $btn.prop('disabled', false).html(
                    '<img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" height="20"> Continue with Google'
                );
            }
        },
        error: function () {
            toastr.error('Could not connect. Please try again.');
            $btn.prop('disabled', false).html(
                '<img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" height="20"> Continue with Google'
            );
        }
    });
}