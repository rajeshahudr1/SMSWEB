/* profile.js */

$(function () {

    // ── Profile form ────────────────────────────────
    $('#frmProfile').validate({
        errorElement: 'div',
        errorClass:   'invalid-feedback',
        errorPlacement: function (error, element) { error.insertAfter(element); },
        highlight:   function (el) { $(el).addClass('is-invalid'); },
        unhighlight: function (el) { $(el).removeClass('is-invalid'); },
        rules:    { name: { required: true } },
        messages: { name: { required: 'Please enter your name.' } },
        submitHandler: function (form) {
            var $btn = $('#btnProfile');
            btnLoading($btn);

            $.ajax({
                url:  BASE_URL + '/profile',
                type: 'POST',
                data: $(form).serialize(),
                success: function (res) {
                    if (res.status === 200) {
                        toastr.success(res.message || 'Profile updated.');
                    } else {
                        toastr.error(res.message || 'Could not save profile.');
                    }
                    btnReset($btn);
                },
                error: function () {
                    btnReset($btn);
                    toastr.error('Could not connect. Please try again.');
                },
            });
        },
    });

    // ── Change password form ─────────────────────────
    $('#frmPassword').validate({
        errorElement: 'div',
        errorClass:   'invalid-feedback',
        errorPlacement: function (error, element) { error.insertAfter(element); },
        highlight:   function (el) { $(el).addClass('is-invalid'); },
        unhighlight: function (el) { $(el).removeClass('is-invalid'); },
        rules: {
            current_password: { required: true },
            password:         { required: true, minlength: 8 },
            confirm_password: { required: true, equalTo: '#newPwd' },
        },
        messages: {
            current_password: { required: 'Please enter current password.' },
            password:         { required: 'Please enter a new password.', minlength: 'Minimum 8 characters.' },
            confirm_password: { required: 'Please confirm new password.', equalTo: 'Passwords do not match.' },
        },
        submitHandler: function (form) {
            var $btn = $('#btnPassword');
            btnLoading($btn);

            $.ajax({
                url:  BASE_URL + '/profile/change-password',
                type: 'POST',
                data: $(form).serialize(),
                success: function (res) {
                    if (res.status === 200) {
                        toastr.success(res.message || 'Password changed.');
                        $('#frmPassword')[0].reset();
                    } else {
                        toastr.error(res.message || 'Could not change password.');
                    }
                    btnReset($btn);
                },
                error: function () {
                    btnReset($btn);
                    toastr.error('Could not connect. Please try again.');
                },
            });
        },
    });

});
