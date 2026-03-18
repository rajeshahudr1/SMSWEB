/* ============================================================
   app.js — SMS Web Global Helpers
   Loaded AFTER jQuery in main.ejs. Safe to use $ here.
   ============================================================ */

/* ── Loading ── */
function showLoading()  { $('#sms-loader').removeClass('hide').show(); }
function hideLoading()  { $('#sms-loader').addClass('hide'); setTimeout(function(){ $('#sms-loader').hide(); }, 300); }

/* ── Button state ── */
function btnLoading($btn) {
    $btn.data('orig', $btn.html()).prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm me-1"></span>' + ($btn.data('loading') || 'Loading...'));
}
function btnReset($btn) {
    $btn.prop('disabled', false).html($btn.data('orig') || $btn.data('original-text') || 'Submit');
}

/* ── AJAX helper ── */
function smsAjax(opts) {
    // opts: { url, method, data, success, error, btn }
    if (opts.btn) btnLoading(opts.btn);
    $.ajax({
        url:         opts.url,
        type:        opts.method || 'POST',
        data:        opts.data,
        processData: opts.fd ? false : true,
        contentType: opts.fd ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
        success: function(res) {
            if (opts.btn) btnReset(opts.btn);
            if (typeof opts.success === 'function') opts.success(res);
        },
        error: function(xhr) {
            if (opts.btn) btnReset(opts.btn);
            if (typeof opts.error === 'function') opts.error(xhr);
            else toastr.error(SMS_T('general.error', 'Network error. Please try again.'));
        }
    });
}

/* ── Confirm dialog (modal) ── */
function smsConfirm(opts) {
    // opts: { icon, title, msg, btnClass, btnText, onConfirm }
    var $m = $('#smsModal');
    $m.html(
        '<div class="modal-dialog modal-sm modal-dialog-centered">' +
        '<div class="modal-content">' +
        '<div class="modal-body text-center py-4 px-4">' +
        '<div class="mb-3" style="font-size:52px;">' + (opts.icon||'⚠️') + '</div>' +
        '<h4 class="mb-1">' + (opts.title||'Confirm') + '</h4>' +
        '<p class="text-secondary small mb-0">' + (opts.msg||'') + '</p>' +
        '</div>' +
        '<div class="modal-footer justify-content-center border-0 pt-0 pb-4 gap-2">' +
        '<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>' +
        '<button class="btn ' + (opts.btnClass||'btn-danger') + '" id="smsConfirmBtn">' + (opts.btnText||'Confirm') + '</button>' +
        '</div></div></div>'
    );
    var modal = new bootstrap.Modal($m[0]);
    modal.show();
    $('#smsConfirmBtn').off('click').on('click', function() {
        modal.hide();
        if (typeof opts.onConfirm === 'function') opts.onConfirm();
    });
}

/* ── Toast shortcuts ── */
function smsSuccess(msg) { toastr.success(msg); }
function smsError(msg)   { toastr.error(msg); }
function smsInfo(msg)    { toastr.info(msg); }

/* ── Pagination builder ── */
function buildPagination(pg, onPage) {
    if (!pg || pg.last_page <= 1) return '';
    var html = '<nav><ul class="pagination pagination-sm mb-0 flex-wrap">';
    html += '<li class="page-item ' + (pg.current_page <= 1 ? 'disabled' : '') + '">' +
            '<a class="page-link" href="#" data-p="' + (pg.current_page - 1) + '"><i class="ti ti-chevron-left"></i></a></li>';

    var pages = [], prev = 0;
    for (var i = 1; i <= pg.last_page; i++) {
        if (i === 1 || i === pg.last_page || Math.abs(i - pg.current_page) <= 1) {
            if (prev && i - prev > 1) pages.push('...');
            pages.push(i); prev = i;
        }
    }
    pages.forEach(function(p) {
        if (p === '...') {
            html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
        } else {
            html += '<li class="page-item ' + (p === pg.current_page ? 'active' : '') + '">' +
                    '<a class="page-link" href="#" data-p="' + p + '">' + p + '</a></li>';
        }
    });
    html += '<li class="page-item ' + (pg.current_page >= pg.last_page ? 'disabled' : '') + '">' +
            '<a class="page-link" href="#" data-p="' + (pg.current_page + 1) + '"><i class="ti ti-chevron-right"></i></a></li>';
    html += '</ul></nav>';

    // Bind after insert
    setTimeout(function() {
        $(document).off('click.smsPage').on('click.smsPage', '.page-link[data-p]', function(e) {
            e.preventDefault();
            var p = parseInt($(this).data('p'));
            if (p > 0) onPage(p);
        });
    }, 0);
    return html;
}

/* ── Select2 init ── */
function initSelect2(ctx, parent) {
    $(ctx || '.select2', parent).each(function() {
        if (!$(this).hasClass('select2-hidden-accessible')) {
            $(this).select2({
                theme: 'bootstrap-5', width: '100%',
                dropdownParent: parent ? $(parent) : $('body')
            });
        }
    });
}

/* ── Location cascade (country → state → city) ── */
function initLocationCascade(ctx) {
    var $ctx     = $(ctx || document);
    var $country = $ctx.find('[name="country_id"], #sCountry');
    var $state   = $ctx.find('[name="state_id"],   #sState');
    var $city    = $ctx.find('[name="city_id"],    #sCity');
    if (!$country.length) return;

    $country.off('change.loc').on('change.loc', function() {
        var cid = $(this).val();
        $state.html('<option value="">Loading...</option>');
        $city.html('<option value="">— Select City —</option>');
        if (!cid) { $state.html('<option value="">— Select State —</option>'); return; }
        $.get(BASE_URL + '/locations/states/' + cid, function(r) {
            var h = '<option value="">— Select State —</option>';
            if (r.status === 200) (r.data||[]).forEach(function(s) { h += '<option value="'+s.id+'">'+s.name+'</option>'; });
            $state.html(h);
            if ($state.hasClass('select2-hidden-accessible')) $state.trigger('change');
        });
    });
    $state.off('change.loc').on('change.loc', function() {
        var sid = $(this).val();
        $city.html('<option value="">Loading...</option>');
        if (!sid) { $city.html('<option value="">— Select City —</option>'); return; }
        $.get(BASE_URL + '/locations/cities/' + sid, function(r) {
            var h = '<option value="">— Select City —</option>';
            if (r.status === 200) {
                var cities = r.data && r.data.data ? r.data.data : r.data;
                (cities||[]).forEach(function(c) { h += '<option value="'+c.id+'">'+c.name+'</option>'; });
            }
            $city.html(h);
            if ($city.hasClass('select2-hidden-accessible')) $city.trigger('change');
        });
    });
}

/* ── Global DOM ready ── */
$(function() {
    // Init Select2 on all pages
    initSelect2();

    // Flatpickr
    if (typeof flatpickr !== 'undefined') {
        $('input[type="date"]').flatpickr({ dateFormat: 'Y-m-d', allowInput: true });
    }

    // Password toggle
    $(document).on('click', '.btn-pwd-toggle', function() {
        var $inp = $(this).closest('.input-group').find('input');
        var isText = $inp.attr('type') === 'text';
        $inp.attr('type', isText ? 'password' : 'text');
        $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });
});
