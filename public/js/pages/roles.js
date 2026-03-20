/* roles.js */
'use strict';

var _page = 1;
var _pp   = 15;
var _sort = { field: 'name', dir: 'asc' };

function _filters() {
    return {
        page: _page, per_page: _pp,
        search: $('#searchInput').val().trim(),
        status: $('#filterStatus').val(),
        sort_field: _sort.field, sort_dir: _sort.dir,
    };
}

/* ══════════════════════════════════════════════════════════
   LOAD TABLE
══════════════════════════════════════════════════════════ */
function loadRoles() {
    $('#tableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>');
    $.post(BASE_URL + '/roles/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) {
            $('#tableBody').html('<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load.</td></tr>');
            return;
        }
        var data = (res.data && res.data.data) || [];
        var pg   = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());

        if (!data.length) {
            $('#tableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted">' +
                '<i class="bi bi-shield-x d-block mb-2" style="font-size:36px;opacity:.3;"></i>No roles found</td></tr>');
            return;
        }

        var start = ((_page - 1) * _pp);
        var rows  = '';
        data.forEach(function(r, i) {
            var status = parseInt(r.status)
                ? '<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>'
                : '<span class="badge bg-danger-lt">Inactive</span>';
            var permCount = r.permission_count || 0;
            var editable  = r.is_editable !== false; /* API sends is_editable flag */

            var actions = '';
            if (editable) {
                actions = '<div class="btn-group btn-group-sm">' +
                    '<a href="' + BASE_URL + '/roles/' + r.uuid + '/edit" class="btn btn-ghost-secondary" title="Edit role"><i class="bi bi-pencil"></i></a>' +
                    '<button class="btn btn-ghost-danger" onclick="delRole(\'' + H.esc(r.uuid) + '\',\'' + H.esc(r.name || '') + '\')" title="Delete role"><i class="bi bi-trash3"></i></button>' +
                    '</div>';
            } else {
                actions = '<span class="badge bg-secondary-lt" title="System role — cannot be modified"><i class="bi bi-lock-fill me-1"></i>System</span>';
            }

            rows += '<tr>' +
                '<td class="text-muted small">' + (start + i + 1) + '</td>' +
                '<td>' +
                '<div class="fw-medium">' + H.esc(r.name || '') + '</div>' +
                (r.description ? '<div class="text-muted small text-truncate" style="max-width:250px;">' + H.esc(r.description) + '</div>' : '') +
                '</td>' +
                '<td class="d-none d-md-table-cell">' +
                '<span class="badge bg-secondary-lt" title="' + permCount + ' permissions assigned">' + permCount + ' perms</span>' +
                '</td>' +
                '<td>' + status + '</td>' +
                '<td class="text-end">' + actions + '</td></tr>';
        });
        $('#tableBody').html(rows);

        /* Info text */
        var from = pg.from || (start + 1);
        var to   = pg.to || (start + data.length);
        $('#tableInfo').text('Showing ' + from + '–' + to + ' of ' + (pg.total || 0));

        /* Pagination */
        $('#tablePagination').html(smsPagination(pg));
    }).fail(function() {
        $('#tableBody').html('<tr><td colspan="5" class="text-center py-4 text-danger">Network error.</td></tr>');
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
function delRole(uuid, name) {
    smsConfirm({
        icon: '🗑️', title: 'Delete Role',
        msg: 'Delete <strong>' + H.esc(name) + '</strong>?<br><small class="text-muted">Users with this role will lose their permissions.</small>',
        btnClass: 'btn-danger', btnText: 'Delete',
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL + '/roles/' + uuid + '/delete', function(r) {
                hideLoading();
                if (r.status === 200) { toastr.success(r.message); loadRoles(); }
                else toastr.error(r.message);
            }).fail(function() { hideLoading(); toastr.error('Network error.'); });
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
$(function() {
    _pp = smsInitPerPage('#perPageSel');
    _initSelect2();
    loadRoles();

    /* Search debounce */
    var st;
    $('#searchInput').on('input', function() {
        clearTimeout(st);
        st = setTimeout(function() { _page = 1; loadRoles(); }, 380);
    });

    /* Filter change */
    $(document).on('change', '#filterStatus', function() { _page = 1; loadRoles(); });

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