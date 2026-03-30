/* roles.js */
'use strict';
var T=function(k,f){return SMS_T(k,f);};

var _page = 1;
var _pp   = 15;
var _sort = { field: 'name', dir: 'asc' };

function _filters() {
    var f = {
        page: _page, per_page: _pp,
        search: $('#searchInput').val().trim(),
        status: $('#filterStatus').val(),
        sort_field: _sort.field, sort_dir: _sort.dir,
    };
    if (typeof IS_SUPER !== 'undefined' && IS_SUPER && $('#filterCompany').length) f.company_id = $('#filterCompany').val();
    return f;
}

/* ══════════════════════════════════════════════════════════
   LOAD TABLE
══════════════════════════════════════════════════════════ */
function loadRoles() {
    $('#tableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>');
    $.post(BASE_URL + '/roles/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) {
            $('#tableBody').html('<tr><td colspan="5" class="text-center py-4 text-danger">'+T('general.failed_to_load','Failed to load.')+'</td></tr>');
            return;
        }
        var data = (res.data && res.data.data) || [];
        var pg   = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());

        if (!data.length) {
            $('#tableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted">' +
                '<i class="bi bi-shield-x d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('roles.no_roles_found','No roles found')+'</td></tr>');
            return;
        }

        var start = ((_page - 1) * _pp);
        var rows  = '';
        data.forEach(function(r, i) {
            var status = parseInt(r.status)
                ? '<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('status.active','Active')+'</span>'
                : '<span class="badge bg-danger-lt">'+T('status.inactive','Inactive')+'</span>';
            var permCount     = r.permission_count     || 0;
            var b2bCount      = r.b2b_permission_count || 0;
            var b2cCount      = r.b2c_permission_count || 0;
            var editable  = r.is_editable !== false; /* API sends is_editable flag */

            var actions = '';
            if (editable) {
                actions = '<div class="btn-group btn-group-sm">' +
                    '<a href="' + BASE_URL + '/roles/' + r.uuid + '/edit" class="btn btn-ghost-secondary" title="Edit role"><i class="bi bi-pencil"></i></a>' +
                    '<button class="btn btn-ghost-info" onclick="showUsage(\'' + H.esc(r.uuid) + '\',\'' + H.esc(r.name || '') + '\')" title="Usage"><i class="bi bi-diagram-3"></i></button>' +
                    '<button class="btn btn-ghost-danger" onclick="delRole(\'' + H.esc(r.uuid) + '\',\'' + H.esc(r.name || '') + '\')" title="Delete role"><i class="bi bi-trash3"></i></button>' +
                    '</div>';
            } else {
                actions = '<span class="badge bg-secondary-lt" title="'+T('roles.system_role_hint','System role — cannot be modified')+'"><i class="bi bi-lock-fill me-1"></i>'+T('roles.system','System')+'</span>';
            }

            rows += '<tr>' +
                '<td class="text-muted small">' + (start + i + 1) + '</td>' +
                '<td>' +
                '<div class="fw-medium">' + H.esc(r.name || '') + '</div>' +
                (r.description ? '<div class="text-muted small text-truncate" style="max-width:250px;">' + H.esc(r.description) + '</div>' : '') +
                '</td>' +
                '<td class="d-none d-md-table-cell">' +
                '<div class="d-flex gap-1 flex-wrap">' +
                '<span class="badge bg-primary-lt" title="' + b2bCount + ' B2B permissions"><i class="bi bi-building me-1"></i>' + b2bCount + ' B2B</span>' +
                '<span class="badge bg-success-lt" title="' + b2cCount + ' B2C permissions"><i class="bi bi-person me-1"></i>' + b2cCount + ' B2C</span>' +
                '</div>' +
                '</td>' +
                '<td>' + status + '</td>' +
                '<td class="text-end">' + actions + '</td></tr>';
        });
        $('#tableBody').html(rows);

        /* Info text */
        var from = pg.from || (start + 1);
        var to   = pg.to || (start + data.length);
        $('#tableInfo').text(T('general.showing','Showing') + ' ' + from + '–' + to + ' ' + T('general.of','of') + ' ' + (pg.total || 0));

        /* Pagination */
        $('#tablePagination').html(smsPagination(pg));
    }).fail(function() {
        $('#tableBody').html('<tr><td colspan="5" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');
    });
}

/* ══════════════════════════════════════════════════════════
   PAGINATION — first/prev/numbers/next/last with icons
══════════════════════════════════════════════════════════ */
function smsPagination(pg) {
    if (!pg || pg.last_page <= 1) return '';

    var cp = pg.current_page;
    var lp = pg.last_page;
    var h  = '<nav aria-label="Pagination"><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';

    /* First */
    h += '<li class="page-item ' + (cp <= 1 ? 'disabled' : '') + '">' +
        '<a class="page-link sms-pg" href="#" data-p="1" title="First page"><i class="bi bi-chevron-double-left"></i></a></li>';
    /* Prev */
    h += '<li class="page-item ' + (cp <= 1 ? 'disabled' : '') + '">' +
        '<a class="page-link sms-pg" href="#" data-p="' + (cp - 1) + '" title="Previous page"><i class="bi bi-chevron-left"></i></a></li>';

    /* Page numbers with smart ellipsis */
    var pages = [], prev = 0;
    for (var i = 1; i <= lp; i++) {
        if (i === 1 || i === lp || Math.abs(i - cp) <= 1) {
            if (prev && i - prev > 1) pages.push('...');
            pages.push(i);
            prev = i;
        }
    }
    pages.forEach(function(p) {
        if (p === '...') {
            h += '<li class="page-item disabled"><span class="page-link">…</span></li>';
        } else {
            h += '<li class="page-item ' + (p === cp ? 'active' : '') + '">' +
                '<a class="page-link sms-pg" href="#" data-p="' + p + '" title="Page ' + p + '">' + p + '</a></li>';
        }
    });

    /* Next */
    h += '<li class="page-item ' + (cp >= lp ? 'disabled' : '') + '">' +
        '<a class="page-link sms-pg" href="#" data-p="' + (cp + 1) + '" title="Next page"><i class="bi bi-chevron-right"></i></a></li>';
    /* Last */
    h += '<li class="page-item ' + (cp >= lp ? 'disabled' : '') + '">' +
        '<a class="page-link sms-pg" href="#" data-p="' + lp + '" title="Last page"><i class="bi bi-chevron-double-right"></i></a></li>';

    h += '</ul></nav>';
    return h;
}

/* ══════════════════════════════════════════════════════════
   DELETE
══════════════════════════════════════════════════════════ */
function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text('Usage: ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/roles/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">'+T('msg.failed','Failed.')+'</div>'); return; }
        var d = res.data || {};
        if (!d.hasDependencies || !d.dependencies || !d.dependencies.length) {
            $b.html('<div class="text-center py-4"><i class="bi bi-check-circle text-success d-block mb-2" style="font-size:48px;"></i><p class="text-muted">'+T('general.not_used_anywhere','This record is not used anywhere.')+'</p></div>');
            return;
        }
        var h = '';
        d.dependencies.forEach(function(dep) {
            h += '<div class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center"><strong>' + H.esc(dep.label || dep.table) + '</strong><span class="badge bg-primary rounded-pill">' + dep.count + '</span></div>';
            if (dep.records && dep.records.length) {
                h += '<div class="table-responsive"><table class="table table-sm table-hover mb-0"><tbody>';
                dep.records.forEach(function(r, i) {
                    h += '<tr><td class="text-muted" style="width:40px;">' + (i + 1) + '</td><td>' + H.esc(r.display_name || r.name || r.full_name || r.uuid || '-') + '</td></tr>';
                });
                h += '</tbody></table></div>';
                if (dep.count > dep.records.length) h += '<div class="card-footer text-muted small">and ' + (dep.count - dep.records.length) + ' more...</div>';
            }
            h += '</div>';
        });
        $b.html(h);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Network error.')+'</div>'); });
}

function delRole(uuid, name) {
    smsConfirm({
        icon: '🗑️', title: T('btn.delete','Delete') + ' ' + T('roles.role','Role'),
        msg: T('btn.delete','Delete') + ' <strong>' + H.esc(name) + '</strong>?<br><small class="text-muted">'+T('roles.delete_warning','Users with this role will lose their permissions.')+'</small>',
        btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL + '/roles/' + uuid + '/delete', function(r) {
                hideLoading();
                if (r.status === 200) { toastr.success(r.message); loadRoles(); }
                else toastr.error(r.message);
            }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); });
        }
    });
}

/* ══════════════════════════════════════════════════════════
   SELECT2 — status filter
══════════════════════════════════════════════════════════ */
function _s2StatusTemplate(state) {
    if (!state.id) return state.text;
    var color = state.id === '1' ? 'success' : 'danger';
    var icon  = state.id === '1' ? 'bi-check-circle' : 'bi-x-circle';
    return $('<span style="display:inline-flex;align-items:center;gap:4px;">' +
        '<i class="bi ' + icon + '" style="font-size:12px;"></i>' +
        '<span class="badge bg-' + color + '-lt" style="font-size:10.5px;">' + state.text + '</span>' +
        '</span>');
}

function _initSelect2() {
    try { if ($('#filterStatus').data('select2')) $('#filterStatus').select2('destroy'); } catch (e) {}
    $('#filterStatus').select2({
        theme: 'bootstrap-5', allowClear: true, placeholder: 'All Status',
        templateResult: _s2StatusTemplate, templateSelection: _s2StatusTemplate,
        width: 'resolve', minimumResultsForSearch: -1,
    });
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
function _loadOrgs() {
    if (typeof IS_SUPER === 'undefined' || !IS_SUPER || !$('#filterCompany').length) return;
    $.get(BASE_URL + '/roles/organizations', function(res) {
        if (!res || res.status !== 200) return;
        var h = '<option value="all">' + T('general.companies','All Companies') + '</option>';
        (res.data || []).forEach(function(o) { h += '<option value="' + o.id + '">' + H.esc(o.company_name) + '</option>'; });
        $('#filterCompany').html(h);
    });
}

$(function() {
    _pp = smsInitPerPage('#perPageSel');
    _initSelect2();
    _loadOrgs();
    loadRoles();

    /* Search debounce */
    var st;
    $('#searchInput').on('input', function() {
        clearTimeout(st);
        st = setTimeout(function() { _page = 1; loadRoles(); }, 380);
    });

    /* Filter change */
    $(document).on('change', '#filterStatus, #filterCompany', function() { _page = 1; loadRoles(); });

    /* Per page — handle "all" */
    $('#perPageSel').on('change', function() {
        var v = $(this).val();
        _pp = (v === 'all') ? 99999 : (parseInt(v) || 15);
        _page = 1;
        loadRoles();
    });

    /* Clear filters */
    $('#btnClearFilters').on('click', function() {
        $('#searchInput').val('');
        try { $('#filterStatus').val('').trigger('change.select2'); } catch (e) { $('#filterStatus').val(''); }
        if ($('#filterCompany').length) $('#filterCompany').val('all');
        _page = 1;
        loadRoles();
    });

    /* Sorting */
    $(document).on('click', 'th.sortable', function() {
        var f = $(this).data('field');
        if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc';
        else { _sort.field = f; _sort.dir = 'asc'; }
        $('th.sortable i').attr('class', 'bi bi-arrow-down-up text-muted small');
        $(this).find('i').attr('class', 'bi bi-sort-' + (_sort.dir === 'asc' ? 'up' : 'down') + ' text-primary small');
        _page = 1;
        loadRoles();
    });

    /* Pagination clicks */
    $(document).on('click', '.sms-pg', function(e) {
        e.preventDefault();
        var p = parseInt($(this).data('p'));
        if (p > 0 && p !== _page) { _page = p; loadRoles(); }
    });
});