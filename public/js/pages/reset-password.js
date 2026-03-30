/* ── reset-password.js ── SMS Web ── */
var T=function(k,f){return SMS_T(k,f);};

$(function () {

    // If token field is absent (token was invalid on load), do nothing
    if (!$('#resetToken').length || !$('#resetToken').val()) return;

    /* Password strength */
    $('#newPw').on('input', function () {
        var v = $(this).val(), s = 0;
        if (v.length >= 8) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        var c = ['#d63939','#f59f00','#2fb344','#2fb344'][Math.max(0, s - 1)];
        var w = ['25%','50%','75%','100%'][Math.max(0, s - 1)];
        $('#pwBar').css({ width: s ? w : '0', background: c });
    });

    /* Toggle password visibility */
    $('#btnTogglePw').on('click', function () {
        var $inp = $('#newPw'), isPass = $inp.attr('type') === 'password';
        $inp.attr('type', isPass ? 'text' : 'password');
        $('#eyeIcon').toggleClass('bi-eye', !isPass).toggleClass('bi-eye-slash', isPass);
    });

    /* Form submit */
    $('#frmReset').on('submit', function (e) {
        e.preventDefault();

        // Clear previous errors
        $('#err-password,#err-confirm_password').text('');
        $('#newPw,#cfmPw').removeClass('is-invalid');

        var token = $('#resetToken').val();
        var pw    = $('#newPw').val();
        var cpw   = $('#cfmPw').val();
        var ok    = true;

        // Client-side validation
        if (!token) {
            toastr.error(T('auth.token_missing','Reset token is missing. Please request a new reset link.'));
            return;
        }
        if (!pw) {
            $('#err-password').text(T('auth.pw_required','Password is required.'));
            $('#newPw').addClass('is-invalid'); ok = false;
        } else if (pw.length < 8) {
            $('#err-password').text(T('auth.pw_min_8','Password must be at least 8 characters.'));
            $('#newPw').addClass('is-invalid'); ok = false;
        }
        if (!cpw) {
            $('#err-confirm_password').text(T('auth.confirm_pw','Please confirm your password.'));
            $('#cfmPw').addClass('is-invalid'); ok = false;
        } else if (pw !== cpw) {
            $('#err-confirm_password').text(T('auth.pw_mismatch','Passwords do not match.'));
            $('#cfmPw').addClass('is-invalid'); ok = false;
        }
        if (!ok) return;

        var $btn = $('#btnReset');
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>'+T('auth.resetting','Resetting…'));

        $.ajax({
            url:      BASE_URL + '/reset-password',
            type:     'POST',
            data:     { token: token, password: pw, confirm_password: cpw },
            dataType: 'json',
            success: function (res) {
                if (res.status === 200) {
                    toastr.success(T('auth.pw_reset_success','Password reset! Redirecting to login…'));
                    setTimeout(function () { window.location.href = BASE_URL + '/login'; }, 1500);
                } else {
                    toastr.error(res.message || T('auth.reset_failed','Reset failed. Link may have expired.'));
                    $btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i> Reset Password');
                }
            },
            error: function () {
                toastr.error(T('general.server_error','Server error. Please try again.'));
                $btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i> Reset Password');
            }
        });
    });
});
