/* users.js */
'use strict';

var _page   = 1;
var _pp     = 15;
var _sort   = { field:'created_at', dir:'desc' };
var _total  = 0;
var _sel    = [];
var _impFile = null;

function _filters() {
    return {
        page:       _page,
        per_page:   _pp,
        search:     $('#searchInput').val().trim(),
        role_id:    $('#filterRole').val(),
        status:     $('#filterStatus').val(),
        panel:      $('#filterPanel').val(),
        verified:   $('#filterVerified').val(),
        sort_field: _sort.field,
        sort_dir:   _sort.dir,
    };
}

function ava(name, img) {
    if (img) return '<span class="avatar avatar-sm" style="background-image:url('+img+')"></span>';
    return '<span class="avatar avatar-sm bg-primary-lt text-primary fw-bold">'+(name||'U').charAt(0).toUpperCase()+'</span>';
}
function statusBadge(s) {
    return parseInt(s)
        ? '<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>'
        : '<span class="badge bg-danger-lt">Inactive</span>';
}
function panelBadge(p) {
    var m={b2b:'azure',b2c:'teal',both:'purple'};
    return '<span class="badge bg-'+(m[p]||'secondary')+'-lt">'+(p||'—').toUpperCase()+'</span>';
}

/* ── Load table ── */
function loadUsers() {
    $('#tableBody').html('<tr><td colspan="9" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>');
    $.post(BASE_URL + '/users/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) {
            $('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger"><i class="bi bi-exclamation-circle me-1"></i>Failed to load.</td></tr>');
            return;
        }
        var data = (res.data && res.data.data) || [];
        var pg   = (res.data && res.data.pagination) || {};
        _total   = pg.total || 0;
        _page    = pg.current_page || 1;

        $('#badgeTotal').text(_total.toLocaleString());

        if (!data.length) {
            $('#tableBody').html('<tr><td colspan="9" class="text-center py-5 text-muted"><i class="bi bi-people d-block mb-2" style="font-size:36px;opacity:.3;"></i>No users found</td></tr>');
            $('#tableInfo').text(''); $('#tablePagination').html(''); return;
        }

        var start = ((_page - 1) * _pp);
        var rows  = '';
        data.forEach(function(u, i) {
            rows += '<tr data-uuid="' + u.uuid + '">' +
                '<td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+u.uuid+'"/></td>' +
                '<td class="text-muted small">'+(start+i+1)+'</td>' +
                '<td><div class="d-flex align-items-center gap-2">'+ava(u.name, u.profile_image_url)+
                '<div><div class="fw-medium">'+H.esc(u.name||'')+'</div>'+
                '<div class="text-muted" style="font-size:11.5px;">'+H.esc(u.email||'')+'</div></div></div></td>' +
                '<td class="d-none d-md-table-cell text-muted small">'+H.esc(u.email||'')+'</td>' +
                '<td class="d-none d-lg-table-cell text-muted small">'+H.esc(u.phone||'—')+'</td>' +
                '<td class="d-none d-sm-table-cell"><span class="badge bg-secondary-lt">'+H.esc(u.role_name||'—')+'</span></td>' +
                '<td class="d-none d-md-table-cell">'+panelBadge(u.panel_access)+'</td>' +
                '<td>'+statusBadge(u.status)+'</td>' +
                '<td class="text-end"><div class="btn-group btn-group-sm">' +
                '<a href="'+BASE_URL+'/users/'+u.uuid+'/edit" class="btn btn-ghost-secondary" title="Edit"><i class="bi bi-pencil"></i></a>' +
                '<button class="btn btn-ghost-secondary" onclick="toggleStatus(\''+u.uuid+'\','+u.status+')" title="Toggle"><i class="bi bi-power"></i></button>' +
                '<button class="btn btn-ghost-danger" onclick="delUser(\''+u.uuid+'\',\''+H.esc(u.name||'')+'\''+')" title="Delete"><i class="bi bi-trash3"></i></button>' +
                '</div></td></tr>';
        });
        $('#tableBody').html(rows);

        var from = pg.from || (start + 1);
        var to   = pg.to   || (start + data.length);
        $('#tableInfo').text('Showing ' + from + '–' + to + ' of ' + _total);
        $('#tablePagination').html(buildPagination(pg, function(p) { _page = p; loadUsers(); }));
        updateBulk();
    }).fail(function() {
        $('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger">Network error.</td></tr>');
    });
}

/* ── Toggle status ── */
function toggleStatus(uuid, cur) {
    var action = parseInt(cur) ? 'Deactivate' : 'Activate';
    smsConfirm({
        icon: parseInt(cur) ? '⚠️' : '✅',
        title: action + ' user?',
        msg: 'This will change the user\'s access to the system.',
        btnClass: parseInt(cur) ? 'btn-warning' : 'btn-success',
        btnText: action,
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL + '/users/' + uuid + '/toggle-status', function(r) {
                hideLoading();
                if (r.status === 200) { toastr.success(r.message); loadUsers(); }
                else toastr.error(r.message);
            }).fail(function() { hideLoading(); toastr.error('Network error.'); });
        }
    });
}

/* ── Delete ── */
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
    var n = _sel.length;
    $('#bulkCount').text(n);
    n > 0 ? $('#bulkBar').removeClass('d-none') : $('#bulkBar').addClass('d-none');
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

/* ── Export ── */
function doExport(fmt) {
    window.location.href = BASE_URL + '/users/export?' + $.param(Object.assign(_filters(), { format: fmt }));
}

/* ── Import ── */
function setImportFile(file) {
    if (!file) return;
    var ext = file.name.split('.').pop().toLowerCase();
    if (!['csv','xlsx','xls'].includes(ext)) { toastr.error('Only CSV or Excel files.'); return; }
    if (file.size > 5 * 1024 * 1024) { toastr.error('Max file size 5 MB.'); return; }
    _impFile = file;
    $('#importFileList').html(
        '<div class="d-flex align-items-center gap-2 p-2 bg-success-lt rounded small">' +
        '<i class="bi bi-file-check text-success"></i><span>' + file.name + '</span>' +
        '<span class="text-muted ms-auto">' + (file.size / 1024).toFixed(0) + ' KB</span></div>'
    );
    $('#btnDoImport').prop('disabled', false);
}

/* ── INIT ── */
$(function() {
    _pp = parseInt($('#perPageSel').val()) || 15;
    loadUsers();

    // Search debounce
    var st;
    $('#searchInput').on('input', function() {
        clearTimeout(st); var v = $(this).val();
        st = setTimeout(function() { _page = 1; loadUsers(); }, 380);
    });

    // Filters
    $('#filterRole,#filterStatus,#filterPanel,#filterVerified').on('change', function() { _page = 1; loadUsers(); });
    $('#btnClearFilters').on('click', function() {
        $('#filterRole,#filterStatus,#filterPanel,#filterVerified').val('');
        $('#searchInput').val('');
        _page = 1; loadUsers();
    });
    $('#perPageSel').on('change', function() { _pp = parseInt($(this).val()); _page = 1; loadUsers(); });

    // Sorting
    $(document).on('click', 'th.sortable', function() {
        var f = $(this).data('field');
        if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc';
        else { _sort.field = f; _sort.dir = 'asc'; }
        $('th.sortable i').attr('class', 'bi bi-arrow-down-up text-muted small');
        $(this).find('i').attr('class', 'bi bi-sort-' + (_sort.dir === 'asc' ? 'up' : 'down') + ' text-primary small');
        _page = 1; loadUsers();
    });

    // Select all
    $(document).on('change', '#selectAll', function() { $('.row-chk').prop('checked', $(this).is(':checked')); updateBulk(); });
    $(document).on('change', '.row-chk', function() { updateBulk(); });
    $('#btnClearBulk').on('click', function() { $('#selectAll,.row-chk').prop('checked', false); updateBulk(); });

    // Export
    $('#expCsv').on('click',   function(e) { e.preventDefault(); doExport('csv'); });
    $('#expExcel').on('click', function(e) { e.preventDefault(); doExport('excel'); });

    // Import
    $('#btnImport').on('click',  function(e) { e.preventDefault(); new bootstrap.Modal(document.getElementById('modalImport')).show(); });
    $('#importBrowse').on('click', function(e) { e.preventDefault(); $('#importFile').click(); });
    $('#importDropzone').on('click', function(e) { if (!$(e.target).is('#importBrowse')) $('#importFile').click(); });
    $('#importFile').on('change', function() { setImportFile(this.files[0]); });
    $('#importDropzone')
        .on('dragover',  function(e) { e.preventDefault(); $(this).addClass('drag-over'); })
        .on('dragleave', function()  { $(this).removeClass('drag-over'); })
        .on('drop',      function(e) { e.preventDefault(); $(this).removeClass('drag-over'); setImportFile(e.originalEvent.dataTransfer.files[0]); });

    $('#btnDoImport').on('click', function() {
        if (!_impFile) return;
        var fd = new FormData(); fd.append('file', _impFile);
        $(this).prop('disabled', true);
        $('#importProgress').removeClass('d-none');
        $.ajax({
            url: BASE_URL + '/users/import', type: 'POST',
            data: fd, processData: false, contentType: false,
            xhr: function() {
                var x = new XMLHttpRequest();
                x.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) $('#importBar').css('width', Math.round(e.loaded / e.total * 100) + '%');
                });
                return x;
            },
            success: function(r) {
                $('#importProgress').addClass('d-none');
                if (r.status === 200) {
                    toastr.success(r.message || 'Import successful!');
                    bootstrap.Modal.getInstance(document.getElementById('modalImport')).hide();
                    _impFile = null; $('#importFile').val(''); $('#importFileList').empty(); $('#btnDoImport').prop('disabled', true);
                    loadUsers();
                } else {
                    toastr.error(r.message || 'Import failed.');
                    $('#btnDoImport').prop('disabled', false);
                }
            },
            error: function() {
                $('#importProgress').addClass('d-none');
                toastr.error('Upload failed.'); $('#btnDoImport').prop('disabled', false);
            }
        });
    });
});
