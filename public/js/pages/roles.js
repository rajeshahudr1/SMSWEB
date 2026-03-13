/* roles.js — list, add, edit, delete roles */

function addRole() {
    loadView(BASE_URL + '/roles/create');
}

function editRole(uuid) {
    loadView(BASE_URL + '/roles/' + uuid + '/edit');
}

function deleteRole(uuid) {
    loadDeleteModal(BASE_URL + '/roles/' + uuid + '/delete');
    $(document).one('shown.bs.modal', '#myModal', function () {
        confirmDelete(BASE_URL + '/roles/' + uuid + '/delete', function () {
            $('#datalist').DataTable().draw();
        });
    });
}

$(function () {

    if ($('#frmRole').length) {

        $('#frmRole').validate({
            errorElement: 'div',
            errorClass:   'invalid-feedback',
            errorPlacement: function (error, element) { error.insertAfter(element); },
            highlight:   function (el) { $(el).addClass('is-invalid'); },
            unhighlight: function (el) { $(el).removeClass('is-invalid'); },
            rules: {
                name: { required: true },
            },
            messages: {
                name: { required: 'Please enter a role name.' },
            },
            submitHandler: function (form) {
                var $btn = $('#btnSubmit');
                btnLoading($btn);
                showLoading();

                $.ajax({
                    url:  $(form).attr('action'),
                    type: 'POST',
                    data: $(form).serialize(),
                    success: function (res) {
                        hideLoading();
                        if (res.status === 200 || res.status === 201) {
                            toastr.success(res.message || 'Saved.');
                            setTimeout(function () {
                                window.location.href = BASE_URL + '/roles';
                            }, 800);
                        } else {
                            toastr.error(res.message || 'Could not save.');
                            btnReset($btn);
                        }
                    },
                    error: function () {
                        hideLoading();
                        btnReset($btn);
                        toastr.error('Could not connect. Please try again.');
                    },
                });
            },
        });
    }

});
