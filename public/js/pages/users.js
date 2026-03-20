/* users.js */
'use strict';

var _page  = 1;
var _pp    = 15;
var _sort  = { field: 'created_at', dir: 'desc' };
var _sel   = [];

function _filters() {
    return {
        page: _page, per_page: _pp,
        search:     $('#searchInput').val().trim(),
        role_id:    $('#filterRole').val(),
        status:     $('#filterStatus').val(),
        sort_field: _sort.field, sort_dir: _sort.dir,
    };
}

function ava(name, img) {
    if (img) return '<span class="avatar avatar-sm" style="background-image:url(' + img + ')"></span>';
    return '<span class="avatar avatar-sm bg-primary-lt text-primary fw-bold">' + (name || 'U').charAt(0).toUpperCase() + '</span>';
}

/* ══════════════════════════════════════════════════════════
   LOAD TABLE
══════════════════════════════════════════════════════════ */
function loadUsers() {
    $('#tableBody').html('<tr><td colspan="8" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
    $.post(BASE_URL + '/users/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) {
            $('#tableBody').html('<tr><td colspan="8" class="text-center py-4 text-danger"><i class="bi bi-exclamation-circle me-1"></i>Failed to load.</td></tr>');
            return;
        }
        var data = (res.data && res.data.data) || [];
        var pg   = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());

        if (!data.length) {
            $('#tableBody').html('<tr><td colspan="8" class="text-center py-5 text-muted"><i class="bi bi-people d-block mb-2" style="font-size:36px;opacity:.3;"></i>No users found</td></tr>');
            $('#tableInfo').text(''); $('#tablePagination').html('');
            return;
        }

        var start = ((_page - 1) * _pp);
        var rows  = '';
        data.forEach(function(u, i) {
            var status = parseInt(u.status)
                ? '<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>'
                : '<span class="badge bg-danger-lt">Inactive</span>';
            var editable  = u.is_editable !== false;
            var deletable = u.is_deletable !== false;

            /* Action buttons */
            var acts = '<div class="btn-group btn-group-sm">';
            /* View — always */
            acts += '<button class="btn btn-ghost-primary" onclick="viewUser(\'' + u.uuid + '\')" title="View details"><i class="bi bi-eye"></i></button>';
            if (editable) {
                acts += '<a href="' + BASE_URL + '/users/' + u.uuid + '/edit" class="btn btn-ghost-secondary" title="Edit user"><i class="bi bi-pencil"></i></a>';
            }
            if (deletable) {
                acts += '<button class="btn btn-ghost-danger" onclick="delUser(\'' + u.uuid + '\',\'' + H.esc(u.name || '') + '\')" title="Delete user"><i class="bi bi-trash3"></i></button>';
            }
            acts += '</div>';

            rows += '<tr data-uuid="' + u.uuid + '">' +
                '<td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="' + u.uuid + '" title="Select"/></td>' +
                '<td class="text-muted small">' + (start + i + 1) + '</td>' +
                '<td><div class="d-flex align-items-center gap-2">' + ava(u.name, u.profile_image_url) +
                '<div><div class="fw-medium">' + H.esc(u.name || '') + '</div>' +
                '<div class="text-muted" style="font-size:11.5px;">' + H.esc(u.email || '') + '</div></div></div></td>' +
                '<td class="d-none d-md-table-cell text-muted small">' + H.esc(u.email || '') + '</td>' +
                '<td class="d-none d-lg-table-cell text-muted small">' + H.esc(u.phone || '—') + '</td>' +
                '<td class="d-none d-sm-table-cell"><span class="badge bg-secondary-lt">' + H.esc(u.role_name || '—') + '</span></td>' +
                '<td>' + status + '</td>' +
                '<td class="text-end">' + acts + '</td></tr>';
        });
        $('#tableBody').html(rows);

        var from = pg.from || (start + 1);
        var to   = pg.to || (start + data.length);
        $('#tableInfo').text('Showing ' + from + '–' + to + ' of ' + (pg.total || 0));
        $('#tablePagination').html(smsPagination(pg));
        updateBulk();
    }).fail(function() {
        $('#tableBody').html('<tr><td colspan="8" class="text-center py-4 text-danger">Network error.</td></tr>');
    });
}

/* ══════════════════════════════════════════════════════════
   PAGINATION
══════════════════════════════════════════════════════════ */
function smsPagination(pg) {
    if (!pg || pg.last_page <= 1) return '';
    var cp = pg.current_page, lp = pg.last_page;
    var h = '<nav aria-label="Pagination"><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';
    h += '<li class="page-item ' + (cp <= 1 ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="1" title="First page"><i class="bi bi-chevron-double-left"></i></a></li>';
    h += '<li class="page-item ' + (cp <= 1 ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + (cp - 1) + '" title="Previous page"><i class="bi bi-chevron-left"></i></a></li>';
    var pages = [], prev = 0;
    for (var i = 1; i <= lp; i++) {
        if (i === 1 || i === lp || Math.abs(i - cp) <= 1) {
            if (prev && i - prev > 1) pages.push('...');
            pages.push(i); prev = i;
        }
    }
    pages.forEach(function(p) {
        if (p === '...') h += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        else h += '<li class="page-item ' + (p === cp ? 'active' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + p + '" title="Page ' + p + '">' + p + '</a></li>';
    });
    h += '<li class="page-item ' + (cp >= lp ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + (cp + 1) + '" title="Next page"><i class="bi bi-chevron-right"></i></a></li>';
    h += '<li class="page-item ' + (cp >= lp ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + lp + '" title="Last page"><i class="bi bi-chevron-double-right"></i></a></li>';
    h += '</ul></nav>';
    return h;
}

/* ══════════════════════════════════════════════════════════
   VIEW USER MODAL — split layout
   Left:  user profile + details
   Right: menus + permissions (B2B/B2C tabs)
══════════════════════════════════════════════════════════ */
function viewUser(uuid) {
    var $m    = $('#modalViewUser');
    var $body = $('#viewUserBody');
    $body.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($m[0]).show();

    $.get(BASE_URL + '/users/' + uuid + '/view-data', function(res) {
        if (!res || res.status !== 200) {
            $body.html('<div class="alert alert-danger m-3">Failed to load user details.</div>');
            return;
        }
        var u     = res.data.user || {};
        var perms = res.data.permissions || [];
        var menus = res.data.menus || [];

        var html = '<div class="row g-0">';

        /* ═══════ LEFT COLUMN — User Profile ═══════ */
        html += '<div class="col-lg-5 border-end">';
        html += '<div class="p-4">';

        /* Avatar + name header */
        html += '<div class="text-center mb-4">';
        if (u.profile_image_url) {
            html += '<span class="avatar avatar-xl mb-3" style="background-image:url(' + u.profile_image_url + ');"></span>';
        } else {
            html += '<span class="avatar avatar-xl bg-primary-lt text-primary mb-3" style="font-size:28px;font-weight:700;">' + (u.name || 'U').charAt(0).toUpperCase() + '</span>';
        }
        html += '<h4 class="mb-1">' + H.esc(u.name || '') + '</h4>';
        html += '<div class="text-muted small">' + H.esc(u.email || '') + '</div>';
        var sBadge = parseInt(u.status)
            ? '<span class="badge bg-success-lt mt-2">Active</span>'
            : '<span class="badge bg-danger-lt mt-2">Inactive</span>';
        if (parseInt(u.is_super_admin)) sBadge += ' <span class="badge bg-red-lt mt-2">Super Admin</span>';
        else if (parseInt(u.is_org_admin)) sBadge += ' <span class="badge bg-warning-lt mt-2">Org Admin</span>';
        html += '<div>' + sBadge + '</div>';
        html += '</div>';

        /* Info rows */
        html += '<div class="mb-3" style="border-top:1px solid var(--tblr-border-color);padding-top:16px;">';
        html += _viewRow('bi-shield-check', 'Role',    '<span class="badge bg-primary-lt">' + H.esc(u.role_name || '—') + '</span>');
        html += _viewRow('bi-telephone',    'Phone',   H.esc(u.phone || '—'));
        html += _viewRow('bi-calendar3',    'Joined',  smsFormatDate(u.created_at));
        if (u.gender) html += _viewRow('bi-person',  'Gender', u.gender.charAt(0).toUpperCase() + u.gender.slice(1));
        if (u.dob)    html += _viewRow('bi-cake2',   'DOB',    smsFormatDate(u.dob));
        if (u.address) html += _viewRow('bi-geo-alt', 'Address', H.esc(u.address));
        if (u.zip_code) html += _viewRow('bi-mailbox', 'ZIP',   H.esc(u.zip_code));
        if (u.aadhar_no) html += _viewRow('bi-credit-card', 'Aadhar', H.esc(u.aadhar_no));
        if (u.pan_no)    html += _viewRow('bi-card-text',   'PAN',    H.esc(u.pan_no));
        html += '</div>';

        /* Menus accessible */
        if (menus.length) {
            html += '<div style="border-top:1px solid var(--tblr-border-color);padding-top:16px;">';
            html += '<h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-list-nested me-1 text-primary"></i>Menus Accessible <span class="badge bg-secondary-lt ms-1">' + menus.length + '</span></h6>';
            html += '<div class="d-flex flex-wrap gap-1">';
            menus.forEach(function(m) {
                var icon = (m.icon || '').replace(/^bi\s+/, '').replace(/^ti\s+/, '') || 'circle';
                html += '<span class="badge bg-secondary-lt px-2 py-1" style="font-size:11px;"><i class="bi bi-' + H.esc(icon) + ' me-1"></i>' + H.esc(m.title) + '</span>';
            });
            html += '</div></div>';
        }

        html += '</div>'; /* end p-4 */
        html += '</div>'; /* end left col */

        /* ═══════ RIGHT COLUMN — Permissions ═══════ */
        html += '<div class="col-lg-7">';
        html += '<div class="p-4">';

        if (perms.length) {
            var b2b = {}, b2c = {}, b2bCnt = 0, b2cCnt = 0;
            perms.forEach(function(p) {
                if (p.panel_type === 'b2b' || p.panel_type === 'both') {
                    if (!b2b[p.group_name]) b2b[p.group_name] = [];
                    b2b[p.group_name].push(p); b2bCnt++;
                }
                if (p.panel_type === 'b2c' || p.panel_type === 'both') {
                    if (!b2c[p.group_name]) b2c[p.group_name] = [];
                    b2c[p.group_name].push(p); b2cCnt++;
                }
            });

            html += '<h6 class="fw-semibold mb-3" style="font-size:13px;"><i class="bi bi-key me-1 text-primary"></i>Permissions</h6>';

            /* B2B / B2C Tabs */
            html += '<ul class="nav nav-tabs nav-fill mb-0" role="tablist">';
            html += '<li class="nav-item"><button class="nav-link active py-2" data-bs-toggle="tab" data-bs-target="#vTabB2B" style="font-size:13px;">';
            html += '<i class="bi bi-building me-1"></i>B2B <span class="badge bg-primary-lt rounded-pill ms-1" style="font-size:10px;">' + b2bCnt + '</span></button></li>';
            html += '<li class="nav-item"><button class="nav-link py-2" data-bs-toggle="tab" data-bs-target="#vTabB2C" style="font-size:13px;">';
            html += '<i class="bi bi-person me-1"></i>B2C <span class="badge bg-success-lt rounded-pill ms-1" style="font-size:10px;">' + b2cCnt + '</span></button></li>';
            html += '</ul>';

            html += '<div class="tab-content border border-top-0 rounded-bottom" style="max-height:420px;overflow-y:auto;">';
            html += '<div class="tab-pane fade show active p-3" id="vTabB2B">' + _renderPermTable(b2b) + '</div>';
            html += '<div class="tab-pane fade p-3" id="vTabB2C">' + _renderPermTable(b2c) + '</div>';
            html += '</div>';
        } else {
            html += '<div class="text-center text-muted py-5">';
            html += '<i class="bi bi-key" style="font-size:48px;opacity:.12;display:block;margin-bottom:12px;"></i>';
            html += '<p class="fw-semibold mb-1">No permissions assigned</p>';
            html += '<p class="text-muted mb-0 small">This user has no role or the role has no permissions.</p>';
            html += '</div>';
        }

        html += '</div>'; /* end p-4 */
        html += '</div>'; /* end right col */

        html += '</div>'; /* end row */
        $body.html(html);
    }).fail(function() {
        $body.html('<div class="alert alert-danger m-3">Network error loading user.</div>');
    });
}

/* ── View modal helpers ── */
function _viewRow(icon, label, value) {
    return '<div class="d-flex align-items-start gap-2 mb-2">' +
        '<i class="bi ' + icon + ' text-muted flex-shrink-0" style="font-size:14px;width:20px;text-align:center;margin-top:2px;"></i>' +
        '<div><div class="text-muted" style="font-size:11px;line-height:1.2;">' + label + '</div>' +
        '<div class="fw-medium" style="font-size:13px;">' + value + '</div></div></div>';
}

function _renderPermTable(groups) {
    var keys = Object.keys(groups);
    if (!keys.length) return '<div class="text-muted text-center py-4 small">No permissions in this panel.</div>';
    var aColor = { view:'azure', add:'green', edit:'orange', 'delete':'red', 'export':'purple', 'import':'teal' };
    var aIcon  = { view:'bi-eye', add:'bi-plus-lg', edit:'bi-pencil', 'delete':'bi-trash3', 'export':'bi-download', 'import':'bi-upload' };
    var html = '';
    keys.forEach(function(gname) {
        html += '<div class="mb-3">';
        html += '<div class="d-flex align-items-center gap-2 mb-1">';
        html += '<span class="fw-semibold" style="font-size:12.5px;">' + H.esc(gname) + '</span>';
        html += '<span class="badge bg-secondary-lt rounded-pill" style="font-size:9px;">' + groups[gname].length + '</span>';
        html += '</div>';
        html += '<div class="d-flex flex-wrap gap-1">';
        groups[gname].forEach(function(p) {
            var c = aColor[p.action] || 'secondary';
            var i = aIcon[p.action]  || 'bi-circle';
            html += '<span class="badge bg-' + c + '-lt" style="font-size:10.5px;padding:3px 8px;">' +
                '<i class="bi ' + i + ' me-1" style="font-size:10px;"></i>' + H.esc(p.action) + '</span>';
        });
        html += '</div></div>';
    });
    return html;
}

/* ══════════════════════════════════════════════════════════
   ACTIONS
══════════════════════════════════════════════════════════ */
function delUser(uuid, name) {
    smsConfirm({
        icon: '🗑️', title: 'Delete User',
        msg: 'Delete <strong>' + H.esc(name) + '</strong>? This cannot be undone.',
        btnClass: 'btn-danger', btnText: 'Delete',
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL + '/users/' + uuid + '/delete', function(r) {
                hideLoading();
                if (r.status === 200) { toastr.success(r.message); loadUsers(); }
                else toastr.error(r.message);
            }).fail(function() { hideLoading(); toastr.error('Network error.'); });
        }
    });
}

/* ── Bulk ── */
function updateBulk() {
    _sel = [];
    $('.row-chk:checked').each(function() { _sel.push($(this).data('uuid')); });
    $('#bulkCount').text(_sel.length);
    _sel.length > 0 ? $('#bulkBar').removeClass('d-none') : $('#bulkBar').addClass('d-none');
}
function bulkAction(action) {
    if (!_sel.length) return;
    smsConfirm({
        icon: '⚡', title: 'Bulk ' + action,
        msg: _sel.length + ' users will be affected.',
        btnClass: action === 'delete' ? 'btn-danger' : 'btn-primary',
        btnText: action.charAt(0).toUpperCase() + action.slice(1),
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL + '/users/bulk-action', { action: action, uuids: JSON.stringify(_sel) }, function(r) {
                hideLoading();
                if (r.status === 200) { toastr.success(r.message); loadUsers(); }
                else toastr.error(r.message);
            }).fail(function() { hideLoading(); toastr.error('Network error.'); });
        }
    });
}

/* ══════════════════════════════════════════════════════════
   SELECT2 TEMPLATES
══════════════════════════════════════════════════════════ */
function _s2RoleTemplate(state) {
    if (!state.id) return state.text;
    return $('<span style="display:inline-flex;align-items:center;gap:5px;"><i class="bi bi-shield-check" style="font-size:12px;color:var(--tblr-primary);"></i><span>' + H.esc(state.text) + '</span></span>');
}
function _s2StatusTemplate(state) {
    if (!state.id) return state.text;
    var color = state.id === '1' ? 'success' : 'danger';
    var icon  = state.id === '1' ? 'bi-check-circle' : 'bi-x-circle';
    return $('<span style="display:inline-flex;align-items:center;gap:4px;"><i class="bi ' + icon + '" style="font-size:12px;"></i><span class="badge bg-' + color + '-lt" style="font-size:10.5px;">' + state.text + '</span></span>');
}

function _initSelect2() {
    try { if ($('#filterRole').data('select2'))   $('#filterRole').select2('destroy'); } catch(e){}
    try { if ($('#filterStatus').data('select2')) $('#filterStatus').select2('destroy'); } catch(e){}
    $('#filterRole').select2({
        theme: 'bootstrap-5', allowClear: true, placeholder: 'All Roles',
        templateResult: _s2RoleTemplate, templateSelection: _s2RoleTemplate, width: 'resolve',
    });
    $('#filterStatus').select2({
        theme: 'bootstrap-5', allowClear: true, placeholder: 'All Status',
        templateResult: _s2StatusTemplate, templateSelection: _s2StatusTemplate, width: 'resolve', minimumResultsForSearch: -1,
    });
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
$(function() {
    _pp = smsInitPerPage('#perPageSel');
    _initSelect2();
    loadUsers();

    var st;
    $('#searchInput').on('input', function() { clearTimeout(st); st = setTimeout(function() { _page = 1; loadUsers(); }, 380); });
    $(document).on('change', '#filterRole, #filterStatus', function() { _page = 1; loadUsers(); });
    $('#perPageSel').on('change', function() { var v = $(this).val(); _pp = (v === 'all') ? 99999 : (parseInt(v) || 15); _page = 1; loadUsers(); });
    $('#btnClearFilters').on('click', function() {
        $('#searchInput').val('');
        try { $('#filterRole').val('').trigger('change.select2'); } catch(e) { $('#filterRole').val(''); }
        try { $('#filterStatus').val('').trigger('change.select2'); } catch(e) { $('#filterStatus').val(''); }
        _page = 1; loadUsers();
    });

    $(document).on('click', 'th.sortable', function() {
        var f = $(this).data('field');
        if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc';
        else { _sort.field = f; _sort.dir = 'asc'; }
        $('th.sortable i').attr('class', 'bi bi-arrow-down-up text-muted small');
        $(this).find('i').attr('class', 'bi bi-sort-' + (_sort.dir === 'asc' ? 'up' : 'down') + ' text-primary small');
        _page = 1; loadUsers();
    });

    $(document).on('click', '.sms-pg', function(e) { e.preventDefault(); var p = parseInt($(this).data('p')); if (p > 0 && p !== _page) { _page = p; loadUsers(); } });
    $(document).on('change', '#selectAll', function() { $('.row-chk').prop('checked', $(this).is(':checked')); updateBulk(); });
    $(document).on('change', '.row-chk', updateBulk);
    $('#btnClearBulk').on('click', function() { $('#selectAll,.row-chk').prop('checked', false); updateBulk(); });
});