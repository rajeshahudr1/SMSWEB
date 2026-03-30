/* master-languages.js */
'use strict';

var _page = 1, _pp = 15;
var _sort = { field: 'sort_order', dir: 'asc' };
var _availableLangs = [];
var T = function(k,f){ return SMS_T(k,f); };

function _filters() {
    return { page: _page, per_page: _pp, search: $('#searchInput').val().trim(), status: $('#filterStatus').val(), sort_field: _sort.field, sort_dir: _sort.dir };
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
    $('#tableBody').html('<tr><td colspan="9" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>' + T('general.loading','Loading…') + '</td></tr>');
    $.post(BASE_URL + '/master-languages/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) { $('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger">' + T('general.failed_load','Failed.') + '</td></tr>'); return; }
        var data = (res.data && res.data.data) || [], pg = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());
        if (!data.length) { $('#tableBody').html('<tr><td colspan="9" class="text-center py-5 text-muted"><i class="bi bi-translate d-block mb-2" style="font-size:36px;opacity:.3;"></i>' + T('master_lang.no_data','No languages found') + '</td></tr>'); $('#tableInfo').text(''); $('#tablePagination').html(''); return; }

        var start = ((_page - 1) * _pp), rows = '';
        data.forEach(function(r, i) {
            var status = parseInt(r.status) ? '<span class="badge bg-success-lt">' + T('general.active','Active') + '</span>' : '<span class="badge bg-danger-lt">' + T('general.inactive','Inactive') + '</span>';
            var def = parseInt(r.is_default) ? '<span class="badge bg-warning-lt"><i class="bi bi-star-fill me-1" style="font-size:9px;"></i>' + T('master_lang.default','Default') + '</span>' : '<span class="text-muted">—</span>';
            rows += '<tr><td class="text-muted small">' + (start + i + 1) + '</td>' +
                '<td style="font-size:20px;">' + H.esc(r.flag || '—') + '</td>' +
                '<td><span class="fw-medium">' + H.esc(r.name) + '</span></td>' +
                '<td><code class="text-primary">' + H.esc(r.code) + '</code></td>' +
                '<td class="d-none d-md-table-cell text-muted">' + H.esc(r.native_name || '—') + '</td>' +
                '<td>' + def + '</td><td class="text-muted">' + (r.sort_order || 0) + '</td><td>' + status + '</td>' +
                '<td class="text-end"><div class="btn-group btn-group-sm">' +
                '<button class="btn btn-ghost-primary" onclick="editLang(\'' + r.uuid + '\')" title="' + T('btn.edit','Edit') + '"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-ghost-' + (parseInt(r.status) ? 'warning' : 'success') + '" onclick="toggleLang(\'' + r.uuid + '\')"><i class="bi bi-toggle-' + (parseInt(r.status) ? 'on' : 'off') + '"></i></button>' +
                '<button class="btn btn-ghost-info" onclick="showUsage(\'' + r.uuid + '\',\'' + H.esc(r.name) + '\')"><i class="bi bi-diagram-3"></i></button>' +
                '<button class="btn btn-ghost-danger" onclick="delLang(\'' + r.uuid + '\',\'' + H.esc(r.name) + '\')"><i class="bi bi-trash3"></i></button>' +
                '</div></td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing') + ' ' + (pg.from || 1) + '–' + (pg.to || data.length) + ' ' + T('general.of','of') + ' ' + (pg.total || 0));
        $('#tablePagination').html(smsPagination(pg));
    }).fail(function() { $('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger">' + T('general.network_error','Network error.') + '</td></tr>'); });
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
        $('#ddlWrap').hide();
        bootstrap.Modal.getOrCreateInstance($('#modalForm')[0]).show();
    }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); });
}

function saveLang() {
    var uuid = $('#editUuid').val();
    var payload = { name: $('#fName').val().trim(), code: $('#fCode').val().trim().toLowerCase(), native_name: $('#fNative').val().trim(), flag: $('#fFlag').val().trim(), sort_order: $('#fSort').val() || 0, is_default: $('#fDefault').is(':checked') ? 1 : 0, status: $('#fStatus').is(':checked') ? 1 : 0 };
    if (!payload.name) { toastr.error(T('master_lang.name','Language name') + ' is required.'); return; }
    if (!payload.code) { toastr.error(T('master_lang.code','Code') + ' is required.'); return; }
    smsAjax({ url: uuid ? BASE_URL + '/master-languages/' + uuid : BASE_URL + '/master-languages', data: payload, btn: $('#btnSave'),
        success: function(r) { if (r.status === 200 || r.status === 201) { toastr.success(r.message); bootstrap.Modal.getOrCreateInstance($('#modalForm')[0]).hide(); loadData(); } else toastr.error(r.message || T('general.error','Error.')); }
    });
}

function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title', 'Usage') + ': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/master-languages/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + T('general.failed_load', 'Failed.') + '</div>'); return; }
        var d = res.data || {};
        if (!d.hasDependencies || !d.dependencies || !d.dependencies.length) {
            $b.html('<div class="text-center py-4"><i class="bi bi-check-circle text-success d-block mb-2" style="font-size:48px;"></i><p class="text-muted">' + T('usage.not_used', 'This record is not used anywhere.') + '</p></div>');
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
                if (dep.count > dep.records.length) h += '<div class="card-footer text-muted small">' + T('usage.and_more', 'and') + ' ' + (dep.count - dep.records.length) + ' ' + T('usage.more', 'more...') + '</div>';
            }
            h += '</div>';
        });
        $b.html(h);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">' + T('general.network_error', 'Network error.') + '</div>'); });
}

function toggleLang(uuid) { $.post(BASE_URL + '/master-languages/' + uuid + '/toggle-status', function(r) { if (r.status === 200) { toastr.success(r.message); loadData(); } else toastr.error(r.message); }); }

function delLang(uuid, name) {
    smsConfirm({ icon: '🗑️', title: T('master_lang.delete','Delete Language'), msg: T('general.are_you_sure','Are you sure?') + ' <strong>' + H.esc(name) + '</strong>', btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
        onConfirm: function() { showLoading(); $.post(BASE_URL + '/master-languages/' + uuid + '/delete', function(r) { hideLoading(); if (r.status === 200) { toastr.success(r.message); loadData(); } else toastr.error(r.message); }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); }); }
    });
}

$(function() {
    _pp = smsInitPerPage('#perPageSel');
    loadAvailableLangs(); loadData();
    $(document).on('change', '#ddlAvailable', onDDLChange);
    var st;
    $('#searchInput').on('input', function() { clearTimeout(st); st = setTimeout(function() { _page = 1; loadData(); }, 380); });
    $(document).on('change', '#filterStatus', function() { _page = 1; loadData(); });
    $('#perPageSel').on('change', function() { var v = $(this).val(); _pp = (v === 'all') ? 99999 : (parseInt(v) || 15); _page = 1; loadData(); });
    $('#btnClearFilters').on('click', function() { $('#searchInput').val(''); $('#filterStatus').val(''); _page = 1; loadData(); });
    $(document).on('click', 'th.sortable', function() { var f = $(this).data('field'); if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc'; else { _sort.field = f; _sort.dir = 'asc'; } $('th.sortable i').attr('class', 'bi bi-arrow-down-up text-muted small'); $(this).find('i').attr('class', 'bi bi-sort-' + (_sort.dir === 'asc' ? 'up' : 'down') + ' text-primary small'); _page = 1; loadData(); });
    $(document).on('click', '.sms-pg', function(e) { e.preventDefault(); var p = parseInt($(this).data('p')); if (p > 0 && p !== _page) { _page = p; loadData(); } });
    $('#frmLang').on('submit', function(e) { e.preventDefault(); saveLang(); });
});