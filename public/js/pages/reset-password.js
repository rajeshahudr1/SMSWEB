/* ── reset-password.js ── */

$(function () {
    // Password strength
    $('#newPw').on('input', function () {
        var v = $(this).val(), s = 0;
        if (v.length >= 8) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        var c = ['#d63939','#f59f00','#2fb344','#2fb344'][Math.max(0, s-1)];
        var w = ['25%','50%','75%','100%'][Math.max(0, s-1)];
        $('#pwBar').css({ width: s ? w : '0', background: c });
    });

    $('#btnTogglePw').on('click', function () {
        var $inp = $('#newPw'), isPass = $inp.attr('type') === 'password';
        $inp.attr('type', isPass ? 'text' : 'password');
        $('#eyeIcon').toggleClass('ti-eye', !isPass).toggleClass('ti-eye-off', isPass);
    });

    $('#frmReset').validate({
        errorElement: 'span', errorClass: 'text-danger',
        errorPlacement: function (e, el) { $('#err-' + el.attr('name')).html(e.text()); },
        highlight:   function (el) { $(el).addClass('is-invalid'); },
        unhighlight: function (el) { $(el).removeClass('is-invalid'); },
        rules: {
            password:         { required: true, minlength: 8 },
            confirm_password: { required: true, equalTo: '#newPw' },
        },
        messages: {
            password:         { required: 'Password is required.', minlength: 'Min 8 characters.' },
            confirm_password: { required: 'Please confirm your password.', equalTo: 'Passwords do not match.' },
        },
        submitHandler: function () {
            var $btn = $('#btnReset');
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Resetting…');

            $.post(BASE_URL + '/reset-password', $('#frmReset').serialize(), function (res) {
                if (res.status === 200) {
                    toastr.success('Password reset! Redirecting to login…');
                    setTimeout(function () { window.location.href = BASE_URL + '/login'; }, 1500);
                } else {
                    toastr.error(res.message || 'Reset failed. Link may have expired.');
                    $btn.prop('disabled', false).html('<i class="ti ti-check me-1"></i> Reset Password');
                }
            }, 'json').fail(function () {
                toastr.error('Server error.');
                $btn.prop('disabled', false).html('<i class="ti ti-check me-1"></i> Reset Password');
            });
        }
    });
});
