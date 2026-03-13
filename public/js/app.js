/* =====================================================
   app.js  —  SMS Web  (loaded on every page)
   Global helpers: loading, toastr, ajax, form submit,
   Select2 init, location cascades, delete confirm.
   Uses jQuery (loaded before this file in main.ejs).
   ===================================================== */

/* ── Toastr defaults ─────────────────────────────── */
toastr.options = {
    closeButton:   true,
    progressBar:   true,
    positionClass: 'toast-top-right',
    timeOut:       4000,
    newestOnTop:   true,
};

/* ── Show / hide full-page loading spinner ─────────
   Usage:  showLoading();   hideLoading();
   ─────────────────────────────────────────────────── */
function showLoading() {
    $('#page-loading').addClass('show');
}
function hideLoading() {
    $('#page-loading').removeClass('show');
}

/* ── Disable / restore a submit button ─────────────
   Usage:
     btnLoading($('#btnSubmit'));
     btnReset($('#btnSubmit'));
   ─────────────────────────────────────────────────── */
function btnLoading($btn) {
    $btn.prop('disabled', true).html($btn.data('loading') || 'Loading...');
}
function btnReset($btn) {
    $btn.prop('disabled', false).html($btn.data('original-text') || $btn.data('text') || 'Submit');
}

/* ── Standard AJAX form submit helper ───────────────
   Handles validation errors, success redirect/reload.

   Usage in page JS:
     submitForm({
       formId:      '#frmUser',
       btnId:       '#btnSubmit',
       onSuccess:   function(res) { ... }   // optional
     });
   ─────────────────────────────────────────────────── */
function submitForm(options) {
    var $form = $(options.formId);
    var $btn  = $(options.btnId || '#btnSubmit');

    $form.on('submit', function (e) {
        e.preventDefault();

        // jQuery Validate check
        if ($form.validate && !$form.valid()) return;

        btnLoading($btn);
        showLoading();

        $.ajax({
            url:  $form.attr('action'),
            type: 'POST',
            data: $form.serialize(),
            success: function (res) {
                hideLoading();
                if (res.status === 200 || res.status === 201) {
                    toastr.success(res.message || 'Saved successfully.');
                    if (options.onSuccess) {
                        options.onSuccess(res);
                    } else if (options.redirect) {
                        setTimeout(function () {
                            window.location.href = BASE_URL + options.redirect;
                        }, 800);
                    } else {
                        setTimeout(function () { location.reload(); }, 800);
                    }
                } else {
                    toastr.error(res.message || 'Something went wrong.');
                    btnReset($btn);
                }
            },
            error: function () {
                hideLoading();
                btnReset($btn);
                toastr.error('Could not connect. Please try again.');
            },
        });
    });
}

/* ── AJAX GET — load HTML into a container ──────────
   Used by list pages to load create/edit form via AJAX
   instead of full page reload (like vibrant pattern).

   Usage:
     loadView(BASE_URL + '/users/create', '#divMainContainer');
   ─────────────────────────────────────────────────── */
function loadView(url, containerId) {
    containerId = containerId || '#divMainContainer';
    showLoading();
    $.get(url, function (html) {
        $(containerId).html(html);
        hideLoading();
        // Re-init Select2 inside loaded content
        $(containerId).find('.select2').each(function () {
            if (!$(this).hasClass('select2-hidden-accessible')) {
                $(this).select2({ theme: 'bootstrap-5', width: '100%' });
            }
        });
        // Re-init flatpickr date inputs
        $(containerId).find('.datepicker').each(function () {
            flatpickr(this, { dateFormat: 'Y-m-d' });
        });
    }).fail(function () {
        hideLoading();
        toastr.error('Failed to load. Please try again.');
    });
}

/* ── Delete confirm via modal ───────────────────────
   Load confirm modal HTML from server then show it.

   Usage:
     loadDeleteModal(BASE_URL + '/users/' + uuid + '/delete');
   ─────────────────────────────────────────────────── */
function loadDeleteModal(url) {
    showLoading();
    $.get(url, function (html) {
        $('#myModal').html(html);
        var modal = new bootstrap.Modal(document.getElementById('myModal'));
        modal.show();
        hideLoading();
    }).fail(function () {
        hideLoading();
        toastr.error('Failed to load. Please try again.');
    });
}

/* ── AJAX POST delete (used inside delete modal) ────
   Usage:
     confirmDelete(BASE_URL + '/users/' + uuid + '/delete', function() {
       $('#datalist').DataTable().draw();
     });
   ─────────────────────────────────────────────────── */
function confirmDelete(url, onSuccess) {
    var $btn = $('#btnDeleteConfirm');
    $btn.off('click').on('click', function () {
        btnLoading($btn);
        showLoading();
        $.post(url, function (res) {
            hideLoading();
            bootstrap.Modal.getInstance(document.getElementById('myModal')).hide();
            if (res.status === 200) {
                toastr.success(res.message || 'Deleted successfully.');
                if (onSuccess) onSuccess(res);
            } else {
                toastr.error(res.message || 'Delete failed.');
                btnReset($btn);
            }
        }).fail(function () {
            hideLoading();
            btnReset($btn);
            toastr.error('Could not connect. Please try again.');
        });
    });
}

/* ── Location cascade helpers ────────────────────────
   Used on any form with country → state → city dropdowns.

   loadStates(countryId, selectedStateId, selectedCityId)
   loadCities(stateId, selectedCityId)
   ─────────────────────────────────────────────────── */
function loadStates(countryId, selectedStateId, selectedCityId) {
    if (!countryId) {
        $('#state_id').html('<option value="">-- Select State --</option>');
        $('#city_id').html('<option value="">-- Select City --</option>');
        return;
    }
    $.get(BASE_URL + '/locations/countries/' + countryId + '/states', function (res) {
        var html = '<option value="">-- Select State --</option>';
        if (res.status === 200 && res.data) {
            $.each(res.data, function (i, s) {
                html += '<option value="' + s.id + '"' + (s.id == selectedStateId ? ' selected' : '') + '>' + s.name + '</option>';
            });
        }
        $('#state_id').html(html).trigger('change.select2');

        // If editing, preload cities too
        if (selectedStateId) {
            loadCities(selectedStateId, selectedCityId);
        }
    });
}

function loadCities(stateId, selectedCityId) {
    if (!stateId) {
        $('#city_id').html('<option value="">-- Select City --</option>');
        return;
    }
    $.get(BASE_URL + '/locations/states/' + stateId + '/cities', function (res) {
        var html = '<option value="">-- Select City --</option>';
        if (res.status === 200 && res.data) {
            $.each(res.data, function (i, c) {
                html += '<option value="' + c.id + '"' + (c.id == selectedCityId ? ' selected' : '') + '>' + c.name + '</option>';
            });
        }
        $('#city_id').html(html).trigger('change.select2');
    });
}

/* ── Toggle active/inactive status ──────────────────
   Usage:  toggleStatus(BASE_URL + '/users/' + uuid + '/toggle-status', table)
   ─────────────────────────────────────────────────── */
function toggleStatus(url, table) {
    showLoading();
    $.post(url, function (res) {
        hideLoading();
        if (res.status === 200) {
            toastr.success(res.message || 'Status updated.');
            if (table) table.draw(false);  // redraw without resetting pagination
        } else {
            toastr.error(res.message || 'Failed to update status.');
        }
    }).fail(function () {
        hideLoading();
        toastr.error('Could not connect. Please try again.');
    });
}

/* ── Init all global components on DOM ready ──────── */
$(function () {

    // Select2 on any element with .select2 class
    $('.select2').each(function () {
        if (!$(this).hasClass('select2-hidden-accessible')) {
            $(this).select2({ theme: 'bootstrap-5', width: '100%' });
        }
    });

    // Flatpickr on any input with .datepicker class
    if (typeof flatpickr !== 'undefined') {
        $('.datepicker').each(function () {
            flatpickr(this, { dateFormat: 'Y-m-d', allowInput: true });
        });
        $('.datetimepicker').each(function () {
            flatpickr(this, { dateFormat: 'Y-m-d H:i', enableTime: true, allowInput: true });
        });
    }

    // Password toggle — any input with a sibling #togglePassword
    $(document).on('click', '#togglePassword', function () {
        var $input = $(this).closest('.input-group').find('input[type=password], input[type=text]');
        var $icon  = $(this).find('i');
        if ($input.attr('type') === 'password') {
            $input.attr('type', 'text');
            $icon.removeClass('ti-eye').addClass('ti-eye-off');
        } else {
            $input.attr('type', 'password');
            $icon.removeClass('ti-eye-off').addClass('ti-eye');
        }
    });

    // Scroll to first invalid field on form submit
    $(document).on('submit', 'form', function () {
        var $first = $(this).find('.is-invalid').first();
        if ($first.length) {
            $('html, body').animate({ scrollTop: $first.offset().top - 100 }, 400);
        }
    });

});
