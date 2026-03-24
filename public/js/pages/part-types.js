/* part-types.js */
'use strict';

var _page = 1, _pp = 15, _sel = [];
var _sort = { field: 'created_at', dir: 'desc' };
var T = function(k,f){ return SMS_T(k,f); };

function _filters() {
    return { page: _page, per_page: _pp, search: $('#searchInput').val().trim(), status: $('#filterStatus').val(), sort_field: _sort.field, sort_dir: _sort.dir };
}

function ptImage(row) {
    var hasSrc = (row.display_image_url || '').indexOf('no-image') === -1 && row.display_image_url;
    return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-pt-img" ' +
        'data-name="' + H.esc(row.part_name || '') + '" ' +
        'data-ext="' + H.esc(row.image_full_url || '') + '" ' +
        'data-up="' + H.esc(row.uploaded_image_url || '') + '">' +
        '<img src="' + H.esc(hasSrc ? row.display_image_url : '/images/no-image.svg') + '" class="rounded border" ' +
        'style="width:40px;height:40px;object-fit:cover;' + (hasSrc ? 'cursor:pointer;' : 'opacity:.5;') + '" ' +
        'onerror="this.src=\'/images/no-image.svg\';this.style.opacity=\'.5\';"/></button>';
}

/* ── Both-images popup (listing + view modal) ── */
function showBothImages($el) {
    var name   = $el.data('name') || '';
    var extUrl = $el.data('ext') || '';
    var upUrl  = $el.data('up') || '';
    if (!extUrl && !upUrl) return;

    $('#imgModalTitle').html('<i class="bi bi-image me-2 text-primary"></i>' + H.esc(name || T('part_types.image_both_title','Part Images')));
    var html = '<div class="row g-3">';

    if (upUrl) {
        html += '<div class="' + (extUrl ? 'col-6' : 'col-12') + '">';
        html += '<div class="border rounded p-2 text-center">';
        html += '<div class="text-muted small mb-2"><i class="bi bi-cloud-upload me-1 text-success"></i><strong>' + T('part_types.image_uploaded','Uploaded') + '</strong></div>';
        html += '<img src="' + H.esc(upUrl) + '" class="rounded" style="max-width:100%;max-height:260px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>' + T('general.no_image','No image') + '</div>\'"/>';
        html += '<div class="mt-2"><a href="' + H.esc(upUrl) + '" target="_blank" class="btn btn-sm btn-outline-primary" download><i class="bi bi-download me-1"></i>' + T('general.download','Download') + '</a></div>';
        html += '</div></div>';
    }

    if (extUrl) {
        html += '<div class="' + (upUrl ? 'col-6' : 'col-12') + '">';
        html += '<div class="border rounded p-2 text-center">';
        html += '<div class="text-muted small mb-2"><i class="bi bi-link-45deg me-1 text-info"></i><strong>' + T('general.external_url','External URL') + '</strong></div>';
        html += '<img src="' + H.esc(extUrl) + '" class="rounded" style="max-width:100%;max-height:260px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>' + T('general.no_image','No image') + '</div>\'"/>';
        html += '<div class="mt-2"><a href="' + H.esc(extUrl) + '" target="_blank" class="btn btn-sm btn-outline-info"><i class="bi bi-box-arrow-up-right me-1"></i>' + T('general.open_file','Open') + '</a></div>';
        html += '<div class="mt-1 small text-muted text-break" style="word-break:break-all;">' + H.esc(extUrl) + '</div>';
        html += '</div></div>';
    }

    html += '</div>';
    $('#imgModalBody').html(html);
    bootstrap.Modal.getOrCreateInstance($('#modalImage')[0]).show();
}

/* ── Load table ── */
function loadData() {
    $('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>' + T('general.loading','Loading…') + '</td></tr>');
    $.post(BASE_URL + '/part-types/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) { $('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">' + T('general.failed_load','Failed.') + '</td></tr>'); return; }
        var data = (res.data && res.data.data) || [];
        var pg   = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());
        if (!data.length) { $('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-gear-wide-connected d-block mb-2" style="font-size:36px;opacity:.3;"></i>' + T('part_types.no_data','No part types found') + '</td></tr>'); $('#tableInfo').text(''); $('#tablePagination').html(''); return; }

        var start = ((_page - 1) * _pp), rows = '';
        data.forEach(function(r, i) {
            var status = parseInt(r.status) ? '<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>' + T('general.active','Active') + '</span>' : '<span class="badge bg-danger-lt">' + T('general.inactive','Inactive') + '</span>';
            var acts = '<div class="btn-group btn-group-sm">';
            acts += '<button class="btn btn-ghost-primary" onclick="viewPT(\'' + r.uuid + '\')" title="' + T('general.preview','View') + '"><i class="bi bi-eye"></i></button>';
            acts += '<a href="' + BASE_URL + '/part-types/' + r.uuid + '/edit" class="btn btn-ghost-secondary" title="' + T('btn.edit','Edit') + '"><i class="bi bi-pencil"></i></a>';
            acts += '<button class="btn btn-ghost-' + (parseInt(r.status) ? 'warning' : 'success') + '" onclick="togglePT(\'' + r.uuid + '\')"><i class="bi bi-toggle-' + (parseInt(r.status) ? 'on' : 'off') + '"></i></button>';
            acts += '<button class="btn btn-ghost-danger" onclick="delPT(\'' + r.uuid + '\',\'' + H.esc(r.part_name || '') + '\')"><i class="bi bi-trash3"></i></button>';
            acts += '</div>';
            rows += '<tr><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="' + r.uuid + '"/></td>' +
                '<td class="text-muted small">' + (start + i + 1) + '</td><td>' + ptImage(r) + '</td>' +
                '<td><span class="fw-medium">' + H.esc(r.part_name || '') + '</span></td><td>' + status + '</td>' +
                '<td class="d-none d-md-table-cell text-muted small">' + smsFormatDate(r.created_at) + '</td>' +
                '<td class="text-end">' + acts + '</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing') + ' ' + (pg.from || 1) + '–' + (pg.to || data.length) + ' ' + T('general.of','of') + ' ' + (pg.total || 0));
        $('#tablePagination').html(smsPagination(pg));
        updateBulk();
    }).fail(function() { $('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">' + T('general.network_error','Network error.') + '</td></tr>'); });
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

/* ── View modal ── */
function viewPT(uuid) {
    var $body = $('#viewBody');
    $body.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL + '/part-types/' + uuid + '/view-data', function(res) {
        if (!res || res.status !== 200) { $body.html('<div class="alert alert-danger m-3">' + T('general.not_found','Not found.') + '</div>'); return; }
        var pt = res.data.part_type || {}, langs = res.data.languages || [], trans = pt.translations || [];
        var upUrl = pt.uploaded_image_url || '', extUrl = pt.image_full_url || '';
        var html = '<div class="p-4">';
        html += '<div class="text-center mb-4"><h4 class="mb-1">' + H.esc(pt.part_name || '') + '</h4>';
        html += '<div>' + (parseInt(pt.status) ? '<span class="badge bg-success-lt">' + T('general.active','Active') + '</span>' : '<span class="badge bg-danger-lt">' + T('general.inactive','Inactive') + '</span>') + '</div></div>';

        /* Both images side by side */
        if (upUrl || extUrl) {
            html += '<div class="row g-2 mb-3">';
            if (upUrl) {
                html += '<div class="' + (extUrl ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
                html += '<div class="text-muted small mb-1"><i class="bi bi-cloud-upload me-1 text-success"></i>' + T('part_types.image_uploaded','Uploaded') + '</div>';
                html += '<img src="' + H.esc(upUrl) + '" class="rounded sms-pt-img" style="max-height:140px;max-width:100%;object-fit:contain;cursor:pointer;" data-name="' + H.esc(pt.part_name||'') + '" data-ext="' + H.esc(extUrl) + '" data-up="' + H.esc(upUrl) + '" onerror="this.src=\'/images/no-image.svg\';this.classList.remove(\'sms-pt-img\');"/>';
                html += '<div class="mt-1"><a href="' + H.esc(upUrl) + '" target="_blank" class="small">' + T('general.view_file','View') + '</a> · <a href="' + H.esc(upUrl) + '" download class="small">' + T('general.download','Download') + '</a></div>';
                html += '</div></div>';
            }
            if (extUrl) {
                html += '<div class="' + (upUrl ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
                html += '<div class="text-muted small mb-1"><i class="bi bi-link-45deg me-1 text-info"></i>' + T('general.external_url','External URL') + '</div>';
                html += '<img src="' + H.esc(extUrl) + '" class="rounded sms-pt-img" style="max-height:140px;max-width:100%;object-fit:contain;cursor:pointer;" data-name="' + H.esc(pt.part_name||'') + '" data-ext="' + H.esc(extUrl) + '" data-up="' + H.esc(upUrl) + '" onerror="this.src=\'/images/no-image.svg\';this.classList.remove(\'sms-pt-img\');"/>';
                html += '<div class="mt-1"><a href="' + H.esc(extUrl) + '" target="_blank" class="small">' + T('general.open_file','Open') + '</a></div>';
                html += '<div class="mt-1 small text-muted text-break" style="word-break:break-all;">' + H.esc(extUrl) + '</div>';
                html += '</div></div>';
            }
            html += '</div>';
        } else {
            html += '<div class="text-center mb-3"><img src="/images/no-image.svg" style="width:100px;opacity:.4;"/></div>';
        }

        html += '<div class="border-top pt-3 mb-3"><div class="mb-2"><span class="text-muted small">' + T('general.created_at','Created') + ':</span> ' + smsFormatDate(pt.created_at) + '</div></div>';

        if (langs.length > 0) {
            var tMap = {}; trans.forEach(function(t) { tMap[t.language_id] = t.name; });
            html += '<div class="border-top pt-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-translate me-1 text-primary"></i>' + T('part_types.translations','Translations') + '</h6><div class="row g-2">';
            langs.forEach(function(l) {
                var val = tMap[l.id] ? H.esc(tMap[l.id]) : '<span class="text-muted fst-italic">—</span>';
                html += '<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">' + (l.flag ? l.flag + ' ' : '') + H.esc(l.name) + '</div><div class="fw-medium" style="font-size:13px;">' + val + '</div></div></div>';
            });
            html += '</div></div>';
        }
        html += '</div>';
        $body.html(html);
    }).fail(function() { $body.html('<div class="alert alert-danger m-3">' + T('general.network_error','Network error.') + '</div>'); });
}

/* ── Actions ── */
function togglePT(uuid) { $.post(BASE_URL + '/part-types/' + uuid + '/toggle-status', function(r) { if (r.status === 200) { toastr.success(r.message); loadData(); } else toastr.error(r.message); }); }
function delPT(uuid, name) {
    smsConfirm({ icon: '🗑️', title: T('part_types.delete','Delete Part Type'), msg: T('general.are_you_sure','Are you sure?') + ' <strong>' + H.esc(name) + '</strong><br><small class="text-muted">' + T('part_types.confirm_delete','Translations will also be removed.') + '</small>', btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
        onConfirm: function() { showLoading(); $.post(BASE_URL + '/part-types/' + uuid + '/delete', function(r) { hideLoading(); if (r.status === 200) { toastr.success(r.message); loadData(); } else toastr.error(r.message); }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); }); }
    });
}
function updateBulk() { _sel = []; $('.row-chk:checked').each(function() { _sel.push($(this).data('uuid')); }); $('#bulkCount').text(_sel.length); _sel.length > 0 ? $('#bulkBar').removeClass('d-none') : $('#bulkBar').addClass('d-none'); }
function bulkAction(action) {
    if (!_sel.length) return;
    smsConfirm({ icon: '⚡', title: action, msg: _sel.length + ' ' + T('part_types.bulk_affected','part types affected.'), btnClass: action === 'delete' ? 'btn-danger' : 'btn-primary', btnText: action,
        onConfirm: function() { showLoading(); $.post(BASE_URL + '/part-types/bulk-action', { action: action, uuids: JSON.stringify(_sel) }, function(r) { hideLoading(); if (r.status === 200) { toastr.success(r.message); loadData(); } else toastr.error(r.message); }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); }); }
    });
}

/* ── Export ── */
function doExport(format) {
    var params = _filters(); params.format = format; delete params.page; delete params.per_page;
    if (format === 'csv' || format === 'excel') { window.location.href = BASE_URL + '/part-types/export?' + $.param(params); return; }
    showLoading();
    $.post(BASE_URL + '/part-types/export', params, function(res) {
        hideLoading();
        if (!res || res.status !== 200 || !res.data || !res.data.rows || !res.data.rows.length) { toastr.error(T('general.no_data','No data.')); return; }
        var rows = res.data.rows, cols = Object.keys(rows[0]);
        var html = '<html><head><title>' + T('part_types.title','Part Types') + '</title><style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>' + T('part_types.title','Part Types') + ' (' + rows.length + ')</h2><table><thead><tr>';
        cols.forEach(function(c) { html += '<th>' + H.esc(c) + '</th>'; });
        html += '</tr></thead><tbody>';
        rows.forEach(function(r) { html += '<tr>'; cols.forEach(function(c) { html += '<td>' + H.esc(String(r[c]||'')) + '</td>'; }); html += '</tr>'; });
        html += '</tbody></table></body></html>';
        var win = window.open('', '_blank'); win.document.write(html); win.document.close();
        if (format === 'print') setTimeout(function() { win.print(); }, 400);
    }).fail(function() { hideLoading(); toastr.error(T('general.error','Export failed.')); });
}
function openImport() { $('#frmImport')[0].reset(); $('#importResult').addClass('d-none').html(''); bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show(); }

/* ── Init ── */
$(function() {
    _pp = smsInitPerPage('#perPageSel');
    loadData();
    $(document).on('click', '.sms-pt-img', function(e) { e.stopPropagation(); showBothImages($(this)); });
    var st;
    $('#searchInput').on('input', function() { clearTimeout(st); st = setTimeout(function() { _page = 1; loadData(); }, 380); });
    $(document).on('change', '#filterStatus', function() { _page = 1; loadData(); });
    $('#perPageSel').on('change', function() { var v = $(this).val(); _pp = (v === 'all') ? 99999 : (parseInt(v) || 15); _page = 1; loadData(); });
    $('#btnClearFilters').on('click', function() { $('#searchInput').val(''); $('#filterStatus').val(''); _page = 1; loadData(); });
    $(document).on('click', 'th.sortable', function() { var f = $(this).data('field'); if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc'; else { _sort.field = f; _sort.dir = 'asc'; } $('th.sortable i').attr('class', 'bi bi-arrow-down-up text-muted small'); $(this).find('i').attr('class', 'bi bi-sort-' + (_sort.dir === 'asc' ? 'up' : 'down') + ' text-primary small'); _page = 1; loadData(); });
    $(document).on('click', '.sms-pg', function(e) { e.preventDefault(); var p = parseInt($(this).data('p')); if (p > 0 && p !== _page) { _page = p; loadData(); } });
    $(document).on('change', '#selectAll', function() { $('.row-chk').prop('checked', $(this).is(':checked')); updateBulk(); });
    $(document).on('change', '.row-chk', updateBulk);
    $('#btnClearBulk').on('click', function() { $('#selectAll,.row-chk').prop('checked', false); updateBulk(); });
    $('#frmImport').on('submit', function(e) { e.preventDefault(); var fd = new FormData(this), $btn = $('#btnImport'); btnLoading($btn);
        $.ajax({ url: BASE_URL + '/part-types/import', type: 'POST', data: fd, processData: false, contentType: false, success: function(r) { btnReset($btn); var h = ''; if (r.status === 200) { h += '<div class="alert alert-success py-2 small mb-0">' + H.esc(r.message) + '</div>'; if (r.data && r.data.errors && r.data.errors.length) { h += '<div class="mt-2 small text-muted" style="max-height:120px;overflow-y:auto;">'; r.data.errors.forEach(function(e) { h += '<div>• ' + H.esc(e) + '</div>'; }); h += '</div>'; } loadData(); } else h = '<div class="alert alert-danger py-2 small mb-0">' + H.esc(r.message || T('general.error','Failed.')) + '</div>'; $('#importResult').removeClass('d-none').html(h); }, error: function() { btnReset($btn); $('#importResult').removeClass('d-none').html('<div class="alert alert-danger py-2 small mb-0">' + T('general.network_error','Network error.') + '</div>'); } });
    });
});