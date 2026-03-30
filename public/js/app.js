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
            // Auth check — 401 responses are caught by global handler
            if (res && (res._authExpired || res.status === 401)) return;
            if (typeof opts.success === 'function') opts.success(res);
        },
        error: function(xhr) {
            if (opts.btn) btnReset(opts.btn);
            // 401 is caught by global handler — don't show generic error
            if (xhr.status === 401) return;
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

/* ── Global date formatter — reads SMS_SETTINGS.date_format ── */
var SMS_MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var SMS_MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * smsFormatDate(dateStr)
 * Formats a date string (ISO/DB) using the format from SMS_SETTINGS.date_format.
 * Supported: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD MMM YYYY, DD MMMM YYYY
 */
function smsFormatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
    var dd   = String(d.getDate()).padStart(2, '0');
    var mm   = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    var fmt  = (typeof SMS_SETTINGS !== 'undefined' && SMS_SETTINGS.date_format) ? SMS_SETTINGS.date_format : 'DD/MM/YYYY';
    switch (fmt) {
        case 'MM/DD/YYYY':   return mm + '/' + dd + '/' + yyyy;
        case 'YYYY-MM-DD':   return yyyy + '-' + mm + '-' + dd;
        case 'DD MMM YYYY':  return dd + ' ' + SMS_MONTHS_SHORT[d.getMonth()] + ' ' + yyyy;
        case 'DD MMMM YYYY': return dd + ' ' + SMS_MONTHS_FULL[d.getMonth()] + ' ' + yyyy;
        default:             return dd + '/' + mm + '/' + yyyy;
    }
}

/**
 * smsFormatDateTime(dateStr)
 * Formats date + time using SMS_SETTINGS.date_format + SMS_SETTINGS.time_format + timezone
 */
function smsFormatDateTime(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).slice(0, 19);
    var datePart = smsFormatDate(dateStr);
    var hh = d.getHours(), mm = d.getMinutes();
    var tf = (typeof SMS_SETTINGS !== 'undefined' && SMS_SETTINGS.time_format) ? SMS_SETTINGS.time_format : '12h';
    if (tf === '24h') {
        return datePart + ' ' + String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    }
    var ampm = hh >= 12 ? 'PM' : 'AM';
    var h12 = hh % 12 || 12;
    return datePart + ' ' + String(h12).padStart(2,'0') + ':' + String(mm).padStart(2,'0') + ' ' + ampm;
}


/* ── Global per-page options (must match settings page) ── */
var SMS_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100, 250, 500, 1000];

/**
 * smsInitPerPage(selector)
 * Populates a per-page <select> with options from SMS_PER_PAGE_OPTIONS.
 * Reads current value from SMS_SETTINGS.items_per_page.
 * Includes "All" option. Use on any listing page.
 */
function smsInitPerPage(selector) {
    var $sel = $(selector || '#perPageSel');
    if (!$sel.length) return 15;
    var current = (typeof SMS_SETTINGS !== 'undefined' && SMS_SETTINGS.items_per_page)
        ? SMS_SETTINGS.items_per_page : '15';
    var html = '';
    SMS_PER_PAGE_OPTIONS.forEach(function(n) {
        html += '<option value="' + n + '"' + (String(n) === String(current) ? ' selected' : '') + '>' + n + ' rows</option>';
    });
    html += '<option value="all"' + (current === 'all' ? ' selected' : '') + '>All rows</option>';
    $sel.html(html);
    return current === 'all' ? 99999 : (parseInt(current) || 15);
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

    /* ══════════════════════════════════════════════════════
       GLOBAL AUTH GUARD — catches 401 on ALL AJAX calls
       ══════════════════════════════════════════════════════ */
    var _authRedirecting = false; // Prevent multiple redirects

    // 1. Catch HTTP 401 status from server
    $(document).ajaxError(function(event, xhr, settings) {
        if (xhr.status === 401 && !_authRedirecting) {
            _authRedirecting = true;
            _showSessionExpired();
        }
    });

    // 2. Catch JSON responses with { status: 401 } or { _authExpired: true }
    $(document).ajaxComplete(function(event, xhr, settings) {
        if (_authRedirecting) return;
        try {
            var ct = xhr.getResponseHeader('Content-Type') || '';
            if (ct.indexOf('json') === -1) return;
            var data = typeof xhr.responseJSON !== 'undefined' ? xhr.responseJSON : JSON.parse(xhr.responseText);
            if (data && (data._authExpired === true || data.status === 401)) {
                _authRedirecting = true;
                _showSessionExpired();
            }
        } catch(e) { /* not JSON, ignore */ }
    });

    function _showSessionExpired() {
        // Show toast and redirect after brief delay
        if (typeof toastr !== 'undefined') {
            toastr.error('Session expired. Redirecting to login...', '', {
                timeOut: 2000, closeButton: false, progressBar: true
            });
        }
        setTimeout(function() {
            window.location.href = BASE_URL + '/login?expired=1';
        }, 1500);
    }

    // 3. Check URL param on login page (session expired redirect)
    if (window.location.pathname.indexOf('/login') !== -1) {
        var params = new URLSearchParams(window.location.search);
        if (params.get('expired') === '1') {
            if (typeof toastr !== 'undefined') {
                toastr.warning('Your session has expired. Please login again.');
            }
            // Clean URL without reload
            if (window.history.replaceState) {
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }
});

/* ── Usage Modal — shared renderer with Edit / Delete actions ── */
var _usageCtx = {}; // tracks which record's usage modal is open

function smsRenderUsageBody(data, sourceModule, sourceUuid, sourceName) {
    _usageCtx = { module: sourceModule, uuid: sourceUuid, name: sourceName };
    var $b = $('#usageBody');
    var d = data || {};
    if (!d.hasDependencies || !d.dependencies || !d.dependencies.length) {
        $b.html('<div class="text-center py-4"><i class="bi bi-check-circle text-success d-block mb-2" style="font-size:48px;"></i><p class="text-muted">' + SMS_T('usage.not_used', 'This record is not used anywhere.') + '</p></div>');
        return;
    }
    var h = '';
    d.dependencies.forEach(function(dep) {
        var mod = dep.module || dep.table;
        h += '<div class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center"><strong>' + H.esc(dep.label || dep.table) + '</strong><span class="badge bg-primary rounded-pill">' + dep.count + '</span></div>';
        if (dep.records && dep.records.length) {
            h += '<div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead><tr><th style="width:36px">#</th><th>' + SMS_T('table.name','Name') + '</th><th style="width:80px" class="text-end">' + SMS_T('table.actions','Actions') + '</th></tr></thead><tbody>';
            dep.records.forEach(function(r, i) {
                var nm = r.display_name || r.name || r.full_name || r.uuid || '-';
                h += '<tr><td class="text-muted">' + (i + 1) + '</td>';
                h += '<td>' + H.esc(nm) + '</td>';
                h += '<td class="text-end text-nowrap">';
                if (r.uuid) {
                    h += '<a href="' + BASE_URL + '/' + H.esc(mod) + '/' + H.esc(r.uuid) + '/edit" class="btn btn-sm btn-ghost-primary py-0 px-1" title="' + SMS_T('btn.edit','Edit') + '" target="_blank"><i class="bi bi-pencil"></i></a>';
                    h += ' <button class="btn btn-sm btn-ghost-danger py-0 px-1 usage-del-btn" title="' + SMS_T('btn.delete','Delete') + '" data-mod="' + H.esc(mod) + '" data-uuid="' + H.esc(r.uuid) + '" data-name="' + H.esc(nm) + '"><i class="bi bi-trash"></i></button>';
                }
                h += '</td></tr>';
            });
            h += '</tbody></table></div>';
            if (dep.count > dep.records.length) h += '<div class="card-footer text-muted small">' + SMS_T('usage.and_more', 'and') + ' ' + (dep.count - dep.records.length) + ' ' + SMS_T('usage.more', 'more...') + '</div>';
        }
        h += '</div>';
    });
    $b.html(h);
}

/* Delete a dependent record from inside the usage modal */
$(document).on('click', '.usage-del-btn', function() {
    var $btn = $(this);
    var mod  = $btn.data('mod');
    var uuid = $btn.data('uuid');
    var name = $btn.data('name');
    smsConfirm({
        icon: '🗑️',
        title: SMS_T('btn.delete', 'Delete'),
        msg: SMS_T('general.are_you_sure', 'Are you sure?') + ' <strong>' + H.esc(name) + '</strong>',
        btnClass: 'btn-danger',
        btnText: SMS_T('btn.yes_delete', 'Yes, delete'),
        onConfirm: function() {
            $.post(BASE_URL + '/' + mod + '/' + uuid + '/delete', function(r) {
                if (r.status === 200) {
                    toastr.success(r.message);
                    // Refresh usage modal to reflect the deletion
                    smsRefreshUsage();
                    // Reload the parent page table if available
                    if (typeof loadData === 'function') loadData();
                } else {
                    toastr.error(r.message);
                }
            }).fail(function() {
                toastr.error(SMS_T('general.network_error', 'Network error.'));
            });
        }
    });
});

/* Reload usage modal content after a dependent record is deleted */
function smsRefreshUsage() {
    if (!_usageCtx.module) return;
    var $b = $('#usageBody');
    $b.html('<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>');
    $.get(BASE_URL + '/' + _usageCtx.module + '/' + _usageCtx.uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + SMS_T('general.failed_load', 'Failed.') + '</div>'); return; }
        smsRenderUsageBody(res.data, _usageCtx.module, _usageCtx.uuid, _usageCtx.name);
    }).fail(function() {
        $b.html('<div class="alert alert-danger m-3">' + SMS_T('general.network_error', 'Network error.') + '</div>');
    });
}

/* ── Tooltip init — call after dynamic content loads ── */
function smsInitTooltips(container) {
    var sel = container || document;
    var els = $(sel).find('[data-bs-toggle="tooltip"]');
    els.each(function() {
        var old = bootstrap.Tooltip.getInstance(this);
        if (old) old.dispose();
        new bootstrap.Tooltip(this, { trigger: 'hover', delay: { show: 300, hide: 0 } });
    });
}