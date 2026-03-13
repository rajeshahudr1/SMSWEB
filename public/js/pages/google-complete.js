/* google-complete.js — complete Google profile */

$(function () {

    function btnLoad($btn, text) {
        $btn.prop('disabled', true)
            .data('orig', $btn.html())
            .html('<span class="spinner-border spinner-border-sm me-1"></span>' + text);
    }
    function btnReset($btn) {
        $btn.prop('disabled', false).html($btn.data('orig'));
    }

    // Read temp_token from URL if not already in hidden field
    var urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken && !$('#gcTempToken').val()) {
        $('#gcTempToken').val(urlToken);
    }

    $('#frmGoogleComplete').validate({
        errorElement:   'span',
        errorClass:     'text-danger',
        errorPlacement: function (error, element) {
            var n = element.attr('name');
            $('#err-' + n).html(error.text());
        },
        highlight:   function (el) { $(el).addClass('is-invalid'); },
        unhighlight: function (el) { $(el).removeClass('is-invalid'); },
        rules: {
            company_name: { required: true },
            yard_type:    { required: true },
            phone:        { required: true },
        },
        messages: {
            company_name: 'Company name is required.',
            yard_type:    'Please select a yard type.',
            phone:        'Phone number is required.',
        },
        submitHandler: function () {
            var $btn = $('#btnGCSubmit');
            btnLoad($btn, 'Setting up...');

            $.ajax({
                url: BASE_URL + '/google-complete',
                type:        'POST',
                data:        $('#frmGoogleComplete').serialize(),
                dataType:    'json',
                success: function (res) {
                    if (res.status === 200 || res.status === 201) {
                        toastr.success('Setup complete! Welcome to SMS.');
                        setTimeout(function () { window.location.href = BASE_URL + '/dashboard'; }, 800);
                    } else {
                        toastr.error(res.message || 'Setup failed. Please try again.');
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
