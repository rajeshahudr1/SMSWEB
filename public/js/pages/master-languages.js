/* master-languages.js */
'use strict';

var _page = 1, _pp = 15;
var _sort = { field: 'sort_order', dir: 'asc' };
var _availableLangs = [];
var T = function(k,f){ return SMS_T(k,f); };

function _filters() {
    var f = { page: _page, per_page: _pp, search: $('#searchInput').val().trim(), status: $('#filterStatus').val(), sort_field: _sort.field, sort_dir: _sort.dir };
    if (typeof IS_SUPER !== 'undefined' && IS_SUPER && $('#filterCompany').length) f.company_id = $('#filterCompany').val();
    return f;
}

function loadOrganizations() {
    if (typeof IS_SUPER === 'undefined' || !IS_SUPER) return;
    $.get(BASE_URL + '/master-languages/organizations', function(res) {
        if (!res || res.status !== 200) return;
        var h = '<option value="">' + T('general.companies','Companies') + '</option>';
        h += '<option value="global">' + T('general.global_super_admin','Global (Super Admin)') + '</option>';
        (res.data || []).forEach(function(o) { h += '<option value="' + o.id + '">' + H.esc(o.company_name) + '</option>'; });
        $('#filterCompany').html(h);
        // Also populate the form company select
        var fh = '<option value="">' + T('general.global_super_admin','Global (Super Admin)') + '</option>';
        (res.data || []).forEach(function(o) { fh += '<option value="' + o.id + '">' + H.esc(o.company_name) + '</option>'; });
        $('#fCompany').html(fh);
    });
}

function loadAvailableLangs() {
    $.get(BASE_URL + '/master-languages/available', function(res) {
        if (!res || res.status !== 200) return;
        _availableLangs = res.data || [];
        var h = '<option value="">— ' + T('master_lang.select_ph','Type or select a language') + ' —</option>';
        _availableLangs.forEach(function(l, i) { h += '<option value="' + i + '">' + (l.flag || '') + ' ' + H.esc(l.name) + ' (' + H.esc(l.code) + ') — ' + H.esc(l.nativeName || '') + '</option>'; });
        $('#ddlAvailable').html(h);
        try { if ($('#ddlAvailable').data('select2')) $('#ddlAvailable').select2('destroy'); $('#ddlAvailable').select2({ theme: 'bootstrap-5', width: '100%', placeholder: '— ' + T('master_lang.select_ph','Select') + ' —', allowClear: true, dropdownParent: $('#modalForm') }); } catch(e){}
    });
}

function onDDLChange() {
    var idx = $('#ddlAvailable').val();
    if (idx === '' || idx === null) return;
    var lang = _availableLangs[parseInt(idx)];
    if (!lang) return;
    $('#fName').val(lang.name || ''); $('#fCode').val(lang.code || ''); $('#fNative').val(lang.nativeName || ''); $('#fFlag').val(lang.flag || '');
}

function loadData() {
    var colSpan = (typeof IS_SUPER !== 'undefined' && IS_SUPER) ? 10 : 9;
    $('#tableBody').html('<tr><td colspan="' + colSpan + '" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>' + T('general.loading','Loading…') + '</td></tr>');
    $.post(BASE_URL + '/master-languages/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) { $('#tableBody').html('<tr><td colspan="' + colSpan + '" class="text-center py-4 text-danger">' + T('general.failed_load','Failed.') + '</td></tr>'); return; }
        var data = (res.data && res.data.data) || [], pg = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());
        if (!data.length) { $('#tableBody').html('<tr><td colspan="' + colSpan + '" class="text-center py-5 text-muted"><i class="bi bi-translate d-block mb-2" style="font-size:36px;opacity:.3;"></i>' + T('master_lang.no_data','No languages found') + '</td></tr>'); $('#tableInfo').text(''); $('#tablePagination').html(''); return; }

        var start = ((_page - 1) * _pp), rows = '';
        data.forEach(function(r, i) {
            var status = parseInt(r.status) ? '<span class="badge bg-success-lt">' + T('general.active','Active') + '</span>' : '<span class="badge bg-danger-lt">' + T('general.inactive','Inactive') + '</span>';
            var def = parseInt(r.is_default) ? '<span class="badge bg-warning-lt"><i class="bi bi-star-fill me-1" style="font-size:9px;"></i>' + T('master_lang.default','Default') + '</span>' : '<span class="text-muted">—</span>';
            var editable = r.is_editable !== false;
            var deletable = r.is_deletable !== false;

            var rowId = 'lr_' + i;

            rows += '<tr class="sms-lang-row" data-target="#' + rowId + '" style="cursor:pointer;">' +
                '<td class="text-muted small">' + (start + i + 1) + '</td>' +
                '<td style="font-size:20px;">' + H.esc(r.flag || '—') + '</td>' +
                '<td><span class="fw-medium">' + H.esc(r.name) + '</span></td>' +
                '<td><code class="text-primary">' + H.esc(r.code) + '</code></td>' +
                '<td class="d-none d-md-table-cell text-muted">' + H.esc(r.native_name || '—') + '</td>';

            if (typeof IS_SUPER !== 'undefined' && IS_SUPER) {
                rows += '<td class="d-none d-md-table-cell">' + (r.is_global ? '<span class="badge bg-azure-lt">' + T('general.global_super_admin','Global') + '</span>' : '<span class="text-muted small">' + H.esc(r.company_name || '—') + '</span>') + '</td>';
            }

            rows += '<td>' + def + '</td><td class="text-muted">' + (r.sort_order || 0) + '</td><td>' + status + '</td>' +
                '<td class="text-end"><div class="dropdown">';
            rows += '<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            rows += '<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            if (editable) rows += '<li><a class="dropdown-item" href="#" onclick="editLang(\'' + r.uuid + '\');return false;"><i class="bi bi-pencil me-2 text-secondary"></i>' + T('btn.edit','Edit') + '</a></li>';
            rows += '<li><a class="dropdown-item" href="#" onclick="toggleLang(\'' + r.uuid + '\');return false;"' + (!editable ? ' style="pointer-events:none;opacity:.5;"' : '') + '><i class="bi bi-toggle-' + (parseInt(r.status) ? 'off' : 'on') + ' me-2 text-' + (parseInt(r.status) ? 'warning' : 'success') + '"></i>' + (parseInt(r.status) ? 'Deactivate' : 'Activate') + '</a></li>';
            rows += '<li><a class="dropdown-item" href="#" onclick="showUsage(\'' + r.uuid + '\',\'' + H.esc(r.name) + '\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>Usage</a></li>';
            if (deletable) rows += '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delLang(\'' + r.uuid + '\',\'' + H.esc(r.name) + '\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';
            rows += '</ul></div></td></tr>';

            // Expandable detail row
            rows += '<tr class="sms-lang-detail" id="' + rowId + '" style="display:none;">' +
                '<td colspan="' + colSpan + '" style="background:var(--tblr-bg-surface-secondary);padding:10px 16px;">' +
                '<div class="row g-2" style="font-size:12px;">' +
                '<div class="col-sm-4"><span class="text-muted">Name:</span> <strong>' + H.esc(r.name) + '</strong></div>' +
                '<div class="col-sm-4"><span class="text-muted">Code:</span> <code>' + H.esc(r.code) + '</code></div>' +
                '<div class="col-sm-4"><span class="text-muted">Native:</span> ' + H.esc(r.native_name || '—') + '</div>' +
                '<div class="col-sm-4"><span class="text-muted">Flag:</span> <span style="font-size:18px;">' + H.esc(r.flag || '—') + '</span></div>' +
                '<div class="col-sm-4"><span class="text-muted">Default:</span> ' + (parseInt(r.is_default) ? '<span class="badge bg-warning-lt">Yes</span>' : 'No') + '</div>' +
                '<div class="col-sm-4"><span class="text-muted">Sort Order:</span> ' + (r.sort_order || 0) + '</div>' +
                (r.created_at ? '<div class="col-sm-6"><span class="text-muted">Created:</span> ' + smsFormatDateTime(r.created_at) + '</div>' : '') +
                (r.updated_at ? '<div class="col-sm-6"><span class="text-muted">Updated:</span> ' + smsFormatDateTime(r.updated_at) + '</div>' : '') +
                '</div></td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing') + ' ' + (pg.from || 1) + '–' + (pg.to || data.length) + ' ' + T('general.of','of') + ' ' + (pg.total || 0));
        $('#tablePagination').html(smsPagination(pg));
    }).fail(function() { $('#tableBody').html('<tr><td colspan="' + colSpan + '" class="text-center py-4 text-danger">' + T('general.network_error','Network error.') + '</td></tr>'); });
}

function smsPagination(pg) {
    if (!pg || pg.last_page <= 1) return '';
    var cp = pg.current_page, lp = pg.last_page;
    var h = '<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';
    h += '<li class="page-item ' + (cp <= 1 ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';
    h += '<li class="page-item ' + (cp <= 1 ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + (cp - 1) + '"><i class="bi bi-chevron-left"></i></a></li>';
    var pages = [], prev = 0;
    for (var i = 1; i <= lp; i++) { if (i === 1 || i === lp || Math.abs(i - cp) <= 1) { if (prev && i - prev > 1) pages.push('...'); pages.push(i); prev = i; } }
    pages.forEach(function(p) { if (p === '...') h += '<li class="page-item disabled"><span class="page-link">…</span></li>'; else h += '<li class="page-item ' + (p === cp ? 'active' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + p + '">' + p + '</a></li>'; });
    h += '<li class="page-item ' + (cp >= lp ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + (cp + 1) + '"><i class="bi bi-chevron-right"></i></a></li>';
    h += '<li class="page-item ' + (cp >= lp ? 'disabled' : '') + '"><a class="page-link sms-pg" href="#" data-p="' + lp + '"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';
    return h;
}

function openForm() {
    $('#editUuid').val(''); $('#modalTitle').html('<i class="bi bi-translate me-2 text-primary"></i>' + T('master_lang.add','Add Language'));
    $('#frmLang')[0].reset(); $('#fStatus').prop('checked', true); $('#ddlWrap').show();
    if ($('#fCompany').length) $('#fCompany').val('');
    try { $('#ddlAvailable').val('').trigger('change.select2'); } catch(e) { $('#ddlAvailable').val(''); }
    bootstrap.Modal.getOrCreateInstance($('#modalForm')[0]).show();
}

function editLang(uuid) {
    showLoading();
    $.get(BASE_URL + '/master-languages/' + uuid, function(res) {
        hideLoading();
        if (!res || res.status !== 200) { toastr.error(T('general.not_found','Not found.')); return; }
        var d = res.data;
        $('#editUuid').val(d.uuid); $('#modalTitle').html('<i class="bi bi-translate me-2 text-primary"></i>' + T('master_lang.edit','Edit Language'));
        $('#fName').val(d.name); $('#fCode').val(d.code); $('#fNative').val(d.native_name || '');
        $('#fFlag').val(d.flag || ''); $('#fSort').val(d.sort_order || 0);
        $('#fDefault').prop('checked', !!parseInt(d.is_default)); $('#fStatus').prop('checked', !!parseInt(d.status));
        if ($('#fCompany').length) $('#fCompany').val(d.organization_id || '');
        $('#ddlWrap').hide();
        bootstrap.Modal.getOrCreateInstance($('#modalForm')[0]).show();
    }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); });
}

function saveLang() {
    var uuid = $('#editUuid').val();
    var payload = { name: $('#fName').val().trim(), code: $('#fCode').val().trim().toLowerCase(), native_name: $('#fNative').val().trim(), flag: $('#fFlag').val().trim(), sort_order: $('#fSort').val() || 0, is_default: $('#fDefault').is(':checked') ? 1 : 0, status: $('#fStatus').is(':checked') ? 1 : 0 };
    if ($('#fCompany').length) payload.company_id = $('#fCompany').val() || '';
    if (!payload.name) { toastr.error(T('master_lang.name','Language name') + ' is required.'); return; }
    if (!payload.code) { toastr.error(T('master_lang.code','Code') + ' is required.'); return; }
    smsAjax({ url: uuid ? BASE_URL + '/master-languages/' + uuid : BASE_URL + '/master-languages', data: payload, btn: $('#btnSave'),
        success: function(r) { if (r.status === 200 || r.status === 201) { toastr.success(r.message); bootstrap.Modal.getOrCreateInstance($('#modalForm')[0]).hide(); loadData(); } else toastr.error(r.message || T('general.error','Error.')); }
    });
}

/* Usage */
function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title', 'Usage') + ': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/master-languages/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + T('general.failed_load', 'Failed.') + '</div>'); return; }
        smsRenderUsageBody(res.data, 'master-languages', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">' + T('general.network_error', 'Network error.') + '</div>'); });
}

function toggleLang(uuid) { $.post(BASE_URL + '/master-languages/' + uuid + '/toggle-status', function(r) { if (r.status === 200) { toastr.success(r.message); loadData(); } else toastr.error(r.message); }); }

function delLang(uuid, name) {
    smsConfirm({ icon: '🗑️', title: T('master_lang.delete','Delete Language'), msg: T('general.are_you_sure','Are you sure?') + ' <strong>' + H.esc(name) + '</strong>', btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
        onConfirm: function() { showLoading(); $.post(BASE_URL + '/master-languages/' + uuid + '/delete', function(r) { hideLoading(); if (r.status === 200) { toastr.success(r.message); loadData(); } else toastr.error(r.message); }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); }); }
    });
}

/* Export */
function doExport(fmt) {
    var p = _filters(); delete p.page; delete p.per_page; p.per_page = 99999;
    showLoading();
    $.post(BASE_URL + '/master-languages/paginate', p, function(res) {
        hideLoading();
        if (!res || res.status !== 200 || !res.data || !res.data.data || !res.data.data.length) { toastr.error(T('general.no_data','No data.')); return; }
        var rows = res.data.data;
        var html = '<html><head><title>Master Languages</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body>';
        html += '<h2>Master Languages (' + rows.length + ')</h2><table><thead><tr><th>#</th><th>Flag</th><th>Name</th><th>Code</th><th>Native Name</th><th>Default</th><th>Sort</th><th>Status</th></tr></thead><tbody>';
        rows.forEach(function(r, i) {
            html += '<tr><td>' + (i+1) + '</td><td>' + H.esc(r.flag || '') + '</td><td>' + H.esc(r.name) + '</td><td>' + H.esc(r.code) + '</td><td>' + H.esc(r.native_name || '') + '</td><td>' + (parseInt(r.is_default) ? 'Yes' : 'No') + '</td><td>' + (r.sort_order || 0) + '</td><td>' + (parseInt(r.status) ? 'Active' : 'Inactive') + '</td></tr>';
        });
        html += '</tbody></table></body></html>';
        if (fmt === 'csv') {
            var csv = '#,Flag,Name,Code,Native Name,Default,Sort,Status\n';
            rows.forEach(function(r, i) { csv += (i+1) + ',"' + (r.flag||'') + '","' + (r.name||'') + '","' + (r.code||'') + '","' + (r.native_name||'') + '",' + (parseInt(r.is_default)?'Yes':'No') + ',' + (r.sort_order||0) + ',' + (parseInt(r.status)?'Active':'Inactive') + '\n'; });
            var blob = new Blob([csv], { type: 'text/csv' });
            var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'master-languages.csv'; a.click();
            return;
        }
        var w = window.open('', '_blank'); w.document.write(html); w.document.close();
        if (fmt === 'print') setTimeout(function() { w.print(); }, 400);
    }).fail(function() { hideLoading(); toastr.error(T('general.failed','Failed.')); });
}

$(function() {
    _pp = smsInitPerPage('#perPageSel');
    loadAvailableLangs(); loadData();
    if (typeof IS_SUPER !== 'undefined' && IS_SUPER) loadOrganizations();
    $(document).on('change', '#ddlAvailable', onDDLChange);
    var st;
    $('#searchInput').on('input', function() { clearTimeout(st); st = setTimeout(function() { _page = 1; loadData(); }, 380); });
    $(document).on('change', '#filterStatus, #filterCompany', function() { _page = 1; loadData(); });
    $('#perPageSel').on('change', function() { var v = $(this).val(); _pp = (v === 'all') ? 99999 : (parseInt(v) || 15); _page = 1; loadData(); });
    $('#btnClearFilters').on('click', function() { $('#searchInput').val(''); $('#filterStatus').val(''); if ($('#filterCompany').length) $('#filterCompany').val(''); _page = 1; loadData(); });
    $(document).on('click', 'th.sortable', function() { var f = $(this).data('field'); if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc'; else { _sort.field = f; _sort.dir = 'asc'; } $('th.sortable i').attr('class', 'bi bi-arrow-down-up text-muted small'); $(this).find('i').attr('class', 'bi bi-sort-' + (_sort.dir === 'asc' ? 'up' : 'down') + ' text-primary small'); _page = 1; loadData(); });
    $(document).on('click', '.sms-pg', function(e) { e.preventDefault(); var p = parseInt($(this).data('p')); if (p > 0 && p !== _page) { _page = p; loadData(); } });
    $('#frmLang').on('submit', function(e) { e.preventDefault(); saveLang(); });

    /* Expand/Collapse row details */
    $(document).on('click', '.sms-lang-row', function(e) {
        if ($(e.target).closest('.dropdown, .btn, a').length) return; // don't toggle on dropdown click
        var $detail = $($(this).data('target'));
        $detail.toggle();
        $(this).toggleClass('table-active');
    });
    $('#btnExpandAll').on('click', function() { $('.sms-lang-detail').show(); $('.sms-lang-row').addClass('table-active'); });
    $('#btnCollapseAll').on('click', function() { $('.sms-lang-detail').hide(); $('.sms-lang-row').removeClass('table-active'); });
});
