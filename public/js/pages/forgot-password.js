/* ── forgot-password.js ── */

$(function () {
    $('#frmForgot').validate({
        errorElement: 'span', errorClass: 'text-danger',
        errorPlacement: function (e, el) { $('#err-' + el.attr('name')).html(e.text()); },
        highlight:   function (el) { $(el).closest('.sms-input-group,input').addClass('is-invalid'); },
        unhighlight: function (el) { $(el).closest('.sms-input-group,input').removeClass('is-invalid'); },
        rules:    { email: { required: true, email: true } },
        messages: { email: { required: 'Please enter your email.', email: 'Enter a valid email address.' } },
        submitHandler: function () {
            var $btn = $('#btnForgot');
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Sending…');

            $.post(BASE_URL + '/forgot-password', $('#frmForgot').serialize(), function (res) {
                if (res.status === 200) {
                    toastr.success(res.message || 'Reset link sent! Check your inbox.');
                    $('#frmForgot')[0].reset();
                } else {
                    toastr.error(res.message || 'Could not send reset link.');
                }
                $btn.prop('disabled', false).html('<i class="bi bi-send me-1"></i> Send Reset Link');
            }, 'json').fail(function () {
                toastr.error('Server error. Please try again.');
                $btn.prop('disabled', false).html('<i class="bi bi-send me-1"></i> Send Reset Link');
            });
        }
    });
});
