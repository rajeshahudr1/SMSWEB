/* =============================================================
   users.js — Full-Featured Listing + Form (No page POST)
   Features: DataTable, pagination, search, advanced search,
   sorting, export (CSV/Excel/PDF/Print), import, column toggle,
   confirm modal, file upload validation, bulk actions, AJAX CRUD
   ============================================================= */

/* ── State ── */
var UsersTable = null;
var currentSort = { field: 'name', dir: 'asc' };
var currentPage = 1;
var perPage     = 15;
var totalRows   = 0;
var selectedIds = [];
var importFileObj = null;

/* ── Helpers ── */
function avatarHtml(name, image) {
  if (image) return '<span class="avatar avatar-sm" style="background-image:url(' + image + ')"></span>';
  var initials = (name || 'U').charAt(0).toUpperCase();
  return '<span class="avatar avatar-sm bg-primary-lt text-primary fw-bold">' + initials + '</span>';
}

function statusBadge(s) {
  return parseInt(s) === 1
    ? '<span class="badge bg-success-lt"><span class="status-dot active"></span>Active</span>'
    : '<span class="badge bg-danger-lt"><span class="status-dot inactive"></span>Inactive</span>';
}

function panelBadge(p) {
  var map = { b2b:'bg-azure-lt', b2c:'bg-teal-lt', both:'bg-purple-lt' };
  return '<span class="badge ' + (map[p] || 'bg-secondary-lt') + '">' + (p||'-').toUpperCase() + '</span>';
}

function verifyBadge(v) {
  return parseInt(v) === 1
    ? '<i class="ti ti-circle-check-filled text-success" title="Email verified"></i>'
    : '<i class="ti ti-circle-x text-secondary" title="Not verified"></i>';
}

/* ── Load table data ── */
function loadUsers() {
  var params = {
    page:     currentPage,
    per_page: perPage,
    search:   $('#searchInput').val(),
    role_id:  $('#filterRole').val(),
    status:   $('#filterStatus').val(),
    panel:    $('#filterPanel').val(),
    sort_field: currentSort.field,
    sort_dir:   currentSort.dir,
    date_from:  $('#advFrom').val(),
    date_to:    $('#advTo').val(),
    verified:   $('#advVerified').val(),
    is_org_admin: $('#advAdmin').val(),
  };

  $('#tableBody').html(
    '<tr><td colspan="9" class="text-center py-4 text-secondary">' +
    '<div class="spinner-border spinner-border-sm me-2 text-primary"></div>Loading…</td></tr>'
  );

  $.post(BASE_URL + '/users/paginate', params, function (res) {
    if (!res || res.status !== 200) {
      toastr.error(res.message || 'Failed to load users.');
      $('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger"><i class="ti ti-alert-circle me-2"></i>Failed to load.</td></tr>');
      return;
    }

    var data  = res.data.data   || [];
    var total = res.data.pagination ? res.data.pagination.total : 0;
    totalRows = total;

    $('#badgeTotal').text(total);

    if (data.length === 0) {
      $('#tableBody').html(
        '<tr><td colspan="9" class="text-center py-5 text-secondary">' +
        '<i class="ti ti-users-off mb-2" style="font-size:36px; display:block; opacity:.35;"></i>' +
        'No users found. Try adjusting your search or filters.</td></tr>'
      );
      $('#tableInfo').text('No results found.');
      $('#tablePagination').html('');
      return;
    }

    var html = '';
    var startNum = (currentPage - 1) * perPage;
    data.forEach(function (u, i) {
      var chk  = '<td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="' + u.uuid + '" data-id="' + u.id + '"/></td>';
      var num  = '<td class="text-center text-secondary small">' + (startNum + i + 1) + '</td>';
      var name = '<td><div class="d-flex align-items-center gap-2">' + avatarHtml(u.name, u.profile_image) +
                 '<div><div class="fw-medium">' + (u.name || '–') + '</div>' +
                 '<div class="text-secondary" style="font-size:11.5px;">' + (u.email || '–') + '</div></div></div></td>';
      var email  = '<td class="d-none d-md-table-cell text-secondary small">' + (u.email || '–') + '</td>';
      var phone  = '<td class="d-none d-lg-table-cell text-secondary small">' + (u.phone || '–') + '</td>';
      var role   = '<td class="d-none d-sm-table-cell"><span class="badge bg-secondary-lt">' + (u.role_name || '–') + '</span></td>';
      var panel  = '<td class="d-none d-md-table-cell">' + panelBadge(u.panel_access) + '</td>';
      var status = '<td>' + statusBadge(u.status) + '</td>';

      var actions = '<td class="text-end pe-3"><div class="btn-group btn-group-sm btn-group-action">';
      actions += '<button class="btn btn-outline-primary" onclick="editUser(\'' + u.uuid + '\')" title="Edit"><i class="ti ti-edit"></i></button>';
      actions += '<button class="btn btn-outline-' + (parseInt(u.status) ? 'warning' : 'success') +
                 '" onclick="toggleUserStatus(\'' + u.uuid + '\')" title="' + (parseInt(u.status) ? 'Deactivate' : 'Activate') + '">' +
                 '<i class="ti ti-power"></i></button>';
      actions += '<button class="btn btn-outline-danger" onclick="deleteUser(\'' + u.uuid + '\',\'' + (u.name||'this user') + '\')" title="Delete"><i class="ti ti-trash"></i></button>';
      actions += '</div></td>';

      html += '<tr data-uuid="' + u.uuid + '">' + chk + num + name + email + phone + role + panel + status + actions + '</tr>';
    });
    $('#tableBody').html(html);

    // Table info
    var from = startNum + 1, to = Math.min(startNum + data.length, total);
    $('#tableInfo').html('Showing <strong>' + from + '</strong>–<strong>' + to + '</strong> of <strong>' + total + '</strong> users');

    // Pagination
    renderPagination(total);
    syncBulkBar();

  }).fail(function () {
    toastr.error('Network error. Could not load users.');
    $('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger">Network error.</td></tr>');
  });
}

/* ── Pagination renderer ── */
function renderPagination(total) {
  var pages = Math.ceil(total / perPage);
  if (pages <= 1) { $('#tablePagination').html(''); return; }

  var html = '';
  var maxVisible = 5;
  var half = Math.floor(maxVisible / 2);
  var start = Math.max(1, currentPage - half);
  var end   = Math.min(pages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  // Prev
  html += '<button class="sms-page-btn" ' + (currentPage === 1 ? 'disabled' : '') +
          ' onclick="goPage(' + (currentPage - 1) + ')"><i class="ti ti-chevron-left" style="font-size:13px;"></i></button>';
  if (start > 1) {
    html += '<button class="sms-page-btn" onclick="goPage(1)">1</button>';
    if (start > 2) html += '<span class="sms-page-btn" style="cursor:default; border:none;">…</span>';
  }
  for (var p = start; p <= end; p++) {
    html += '<button class="sms-page-btn' + (p === currentPage ? ' active' : '') + '" onclick="goPage(' + p + ')">' + p + '</button>';
  }
  if (end < pages) {
    if (end < pages - 1) html += '<span class="sms-page-btn" style="cursor:default; border:none;">…</span>';
    html += '<button class="sms-page-btn" onclick="goPage(' + pages + ')">' + pages + '</button>';
  }
  // Next
  html += '<button class="sms-page-btn" ' + (currentPage === pages ? 'disabled' : '') +
          ' onclick="goPage(' + (currentPage + 1) + ')"><i class="ti ti-chevron-right" style="font-size:13px;"></i></button>';

  $('#tablePagination').html(html);
}

function goPage(p) {
  currentPage = p;
  loadUsers();
}

/* ── Sorting ── */
$(document).on('click', 'th.sortable', function () {
  var field = $(this).data('field');
  if (currentSort.field === field) {
    currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.field = field; currentSort.dir = 'asc';
  }
  $('th.sortable i').attr('class', 'ti ti-selector ms-1 text-secondary');
  var iconClass = 'ti ti-sort-' + (currentSort.dir === 'asc' ? 'ascending' : 'descending') + ' ms-1 text-primary';
  $(this).find('i').attr('class', iconClass);
  currentPage = 1;
  loadUsers();
});

/* ── Search debounce ── */
var searchTimer;
$(document).on('keyup', '#searchInput', function () {
  var val = $(this).val();
  $('#btnClearSearch').toggleClass('d-none', val === '');
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function () { currentPage = 1; loadUsers(); }, 400);
});
$(document).on('click', '#btnClearSearch', function () {
  $('#searchInput').val('');
  $(this).addClass('d-none');
  currentPage = 1; loadUsers();
});

/* ── Quick filters ── */
$(document).on('change', '#filterRole, #filterStatus, #filterPanel', function () {
  currentPage = 1; loadUsers();
});

/* ── Advanced search ── */
$(document).on('click', '#btnApplyAdv', function () {
  currentPage = 1; loadUsers();
  bootstrap.Collapse.getInstance(document.getElementById('advSearch'))?.hide();
});
$(document).on('click', '#btnResetAdv', function () {
  $('#advFrom,#advTo').val('');
  $('#advVerified,#advAdmin').val('');
  currentPage = 1; loadUsers();
});

/* ── Refresh ── */
$(document).on('click', '#btnRefresh', function () {
  $(this).find('i').addClass('ti-spin');
  loadUsers();
  setTimeout(function () { $('#btnRefresh i').removeClass('ti-spin'); }, 1000);
});

/* ── Column visibility ── */
$(document).on('change', '#colToggleMenu input[type=checkbox]', function () {
  var col = parseInt($(this).data('col'));
  var vis = $(this).is(':checked');
  var cls;
  if (col === 2) cls = '.d-md-table-cell:nth-child(4)'; // email col index
  // Simple: toggle class on nth-child
  var colMap = { 2:'td:nth-child(4),th:nth-child(4)', 3:'td:nth-child(5),th:nth-child(5)',
                 4:'td:nth-child(6),th:nth-child(6)', 5:'td:nth-child(7),th:nth-child(7)',
                 6:'td:nth-child(8),th:nth-child(8)' };
  if (colMap[col]) {
    $('#datalist').find(colMap[col]).css('display', vis ? '' : 'none');
  }
});

/* ── Select all / bulk ── */
$(document).on('change', '#chkAll', function () {
  $('.row-chk').prop('checked', $(this).is(':checked'));
  syncBulkBar();
});
$(document).on('change', '.row-chk', function () {
  var all = $('.row-chk').length === $('.row-chk:checked').length;
  $('#chkAll').prop('checked', all);
  syncBulkBar();
});
function syncBulkBar() {
  var count = $('.row-chk:checked').length;
  if (count > 0) {
    $('#bulkCount').text(count);
    $('#bulkBar').removeClass('d-none');
  } else {
    $('#bulkBar').addClass('d-none');
  }
}
function bulkAction(action) {
  var uuids = [];
  $('.row-chk:checked').each(function () { uuids.push($(this).data('uuid')); });
  if (!uuids.length) return;
  var emoji = action === 'delete' ? '🗑️' : action === 'activate' ? '✅' : '⚠️';
  var title = action === 'delete' ? 'Delete ' + uuids.length + ' users?' : (action === 'activate' ? 'Activate' : 'Deactivate') + ' ' + uuids.length + ' users?';
  showConfirm({ emoji: emoji, title: title, msg: 'This will affect ' + uuids.length + ' user(s).', color: action === 'delete' ? 'danger' : 'primary',
    onConfirm: function () {
      showLoading();
      $.post(BASE_URL + '/users/bulk-action', { action: action, uuids: JSON.stringify(uuids) }, function (res) {
        hideLoading();
        if (res.status === 200) {
          toastr.success(res.message || 'Done.');
          loadUsers();
          $('#chkAll').prop('checked', false);
        } else {
          toastr.error(res.message || 'Action failed.');
        }
      }).fail(function () { hideLoading(); toastr.error('Network error.'); });
    }
  });
}

/* ══════════════════════════════════════════════════════
   CONFIRM MODAL
   ══════════════════════════════════════════════════════ */
function showConfirm(opts) {
  $('#confirmEmoji').text(opts.emoji || '⚠️');
  $('#confirmTitle').text(opts.title || 'Are you sure?');
  $('#confirmMsg').text(opts.msg   || 'This action cannot be undone.');
  var $btn = $('#btnConfirmDo');
  $btn.removeClass('btn-danger btn-primary btn-warning').addClass('btn-' + (opts.color || 'danger'));
  $btn.off('click').on('click', function () {
    var modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
    modal.hide();
    if (opts.onConfirm) opts.onConfirm();
  });
  new bootstrap.Modal(document.getElementById('confirmModal')).show();
}

/* ══════════════════════════════════════════════════════
   ADD / EDIT USER (Offcanvas form)
   ══════════════════════════════════════════════════════ */
function openUserForm(uuid) {
  var url = uuid ? BASE_URL + '/users/' + uuid + '/edit' : BASE_URL + '/users/create';
  $('#canvasUserTitle').html(uuid
    ? '<i class="ti ti-edit me-2 text-primary"></i>Edit User'
    : '<i class="ti ti-user-plus me-2 text-primary"></i>Add User');
  $('#canvasUserBody').html('<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>');
  var canvas = new bootstrap.Offcanvas(document.getElementById('canvasUser'));
  canvas.show();
  $.get(url, function (html) {
    $('#canvasUserBody').html(html);
    // Re-init Select2 inside offcanvas
    $('#canvasUserBody .select2').select2({ theme: 'bootstrap-5', width: '100%', dropdownParent: $('#canvasUser') });
    // File upload init inside form
    initFileUpload('#canvasUserBody');
    // Bind form submit
    bindUserForm(uuid);
  }).fail(function () {
    $('#canvasUserBody').html('<div class="alert alert-danger m-3">Failed to load form.</div>');
  });
}

function bindUserForm(uuid) {
  $('#frmUser').validate({
    errorElement: 'div',
    errorClass:   'invalid-feedback d-block',
    errorPlacement: function (error, element) {
      if (element.hasClass('select2-hidden-accessible')) {
        error.insertAfter(element.next('.select2-container'));
      } else {
        error.insertAfter(element);
      }
    },
    highlight:   function (el) { $(el).addClass('is-invalid'); },
    unhighlight: function (el) { $(el).removeClass('is-invalid'); },
    rules: {
      name:             { required: true, minlength: 2 },
      email:            { required: true, email: true },
      role_id:          { required: true },
      password:         { required: !uuid, minlength: 8 },
      confirm_password: { equalTo: '#password' },
    },
    messages: {
      name:             { required: 'Full name is required.', minlength: 'Minimum 2 characters.' },
      email:            { required: 'Email is required.', email: 'Enter a valid email.' },
      role_id:          { required: 'Please select a role.' },
      password:         { required: 'Password is required.', minlength: 'Minimum 8 characters.' },
      confirm_password: { equalTo: 'Passwords do not match.' },
    },
    submitHandler: function (form) {
      var $btn = $(form).find('[type=submit]');
      var origHtml = $btn.html();
      $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving…');
      showLoading();
      $.ajax({
        url:  $(form).attr('action'),
        type: 'POST',
        data: $(form).serialize(),
        success: function (res) {
          hideLoading();
          if (res.status === 200 || res.status === 201) {
            toastr.success(res.message || 'User saved successfully!');
            bootstrap.Offcanvas.getInstance(document.getElementById('canvasUser')).hide();
            loadUsers();
          } else {
            toastr.error(res.message || 'Could not save.');
            $btn.prop('disabled', false).html(origHtml);
          }
        },
        error: function () {
          hideLoading(); $btn.prop('disabled', false).html(origHtml);
          toastr.error('Connection error. Please try again.');
        }
      });
    }
  });
}

/* shortcuts */
function editUser(uuid) { openUserForm(uuid); }

function toggleUserStatus(uuid) {
  showLoading();
  $.post(BASE_URL + '/users/' + uuid + '/toggle-status', function (res) {
    hideLoading();
    if (res.status === 200) { toastr.success(res.message || 'Status updated.'); loadUsers(); }
    else toastr.error(res.message || 'Failed to update status.');
  }).fail(function () { hideLoading(); toastr.error('Network error.'); });
}

function deleteUser(uuid, name) {
  showConfirm({
    emoji: '🗑️', title: 'Delete User?',
    msg: 'Delete "' + (name||'this user') + '"? This cannot be undone.',
    color: 'danger',
    onConfirm: function () {
      showLoading();
      $.post(BASE_URL + '/users/' + uuid + '/delete', function (res) {
        hideLoading();
        if (res.status === 200) { toastr.success(res.message || 'User deleted.'); loadUsers(); }
        else toastr.error(res.message || 'Delete failed.');
      }).fail(function () { hideLoading(); toastr.error('Network error.'); });
    }
  });
}

/* ══════════════════════════════════════════════════════
   EXPORT (CSV / Excel / PDF / Print)
   ══════════════════════════════════════════════════════ */
function exportData(type) {
  var params = {
    format:  type,
    search:  $('#searchInput').val(),
    role_id: $('#filterRole').val(),
    status:  $('#filterStatus').val(),
    panel:   $('#filterPanel').val(),
  };

  if (type === 'print') {
    window.print(); return;
  }
  if (type === 'pdf') {
    showLoading();
    $.post(BASE_URL + '/users/export', params, function (res) {
      hideLoading();
      if (res.status === 200 && res.data && res.data.url) {
        window.open(res.data.url, '_blank');
      } else {
        // Fallback: build PDF client-side with visible data
        exportPdfClientSide();
      }
    }).fail(function () { hideLoading(); exportPdfClientSide(); });
    return;
  }

  // CSV / Excel via server
  var qs = $.param(params);
  window.location.href = BASE_URL + '/users/export?' + qs;
}

function exportPdfClientSide() {
  if (typeof pdfMake === 'undefined') { toastr.warning('PDF library loading…'); return; }
  var rows = [];
  $('#tableBody tr').each(function () {
    var cells = [];
    $(this).find('td').each(function (i) {
      if (i > 0 && i < 8) cells.push($(this).text().trim().replace(/\s+/g,' '));
    });
    if (cells.length) rows.push(cells);
  });
  var docDef = {
    content: [
      { text: 'User List — SMS Platform', style: 'header' },
      { text: 'Exported: ' + new Date().toLocaleString(), style: 'sub', margin: [0,0,0,12] },
      {
        table: {
          headerRows: 1,
          widths: ['auto','*','*','auto','auto','auto'],
          body: [
            [
              {text:'#',bold:true},{text:'Name',bold:true},{text:'Email',bold:true},
              {text:'Role',bold:true},{text:'Panel',bold:true},{text:'Status',bold:true}
            ],
            ...rows
          ]
        }, layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      header: { fontSize:16, bold:true, color:'#0054a6' },
      sub:    { fontSize:10, color:'#667380' }
    },
    defaultStyle: { fontSize: 10 }
  };
  pdfMake.createPdf(docDef).download('users-sms-' + Date.now() + '.pdf');
  toastr.success('PDF downloaded.');
}

$(document).on('click', '#expCsv',   function () { exportData('csv');   });
$(document).on('click', '#expExcel', function () { exportData('excel'); });
$(document).on('click', '#expPdf',   function () { exportData('pdf');   });
$(document).on('click', '#expPrint', function () { exportData('print'); });

/* ══════════════════════════════════════════════════════
   IMPORT
   ══════════════════════════════════════════════════════ */
$(document).on('click', '#btnImport', function () {
  new bootstrap.Modal(document.getElementById('modalImport')).show();
});

$(document).on('click', '#importDropzone', function (e) {
  if ($(e.target).is('input')) return;
  $('#importFile').click();
});

$(document).on('change', '#importFile', function () {
  handleImportFile(this.files[0]);
});

// Drag & drop
$(document).on('dragover', '#importDropzone', function (e) {
  e.preventDefault(); $(this).addClass('dragover');
});
$(document).on('dragleave drop', '#importDropzone', function (e) {
  e.preventDefault(); $(this).removeClass('dragover');
  if (e.type === 'drop' && e.originalEvent.dataTransfer.files[0]) {
    handleImportFile(e.originalEvent.dataTransfer.files[0]);
  }
});

var ALLOWED_IMPORT = ['text/csv','application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
var MAX_IMPORT_MB = 5;

function handleImportFile(file) {
  if (!file) return;
  var ext  = file.name.split('.').pop().toLowerCase();
  var ok   = ['csv','xlsx','xls'].includes(ext);
  var size = file.size / (1024 * 1024);

  importFileObj = null;
  $('#btnDoImport').prop('disabled', true);
  $('#importFileList').empty();

  if (!ok) {
    renderFileItem(file, 'error', 'Only .csv, .xlsx, .xls files are allowed.');
    toastr.error('Invalid file type. Only CSV or Excel files accepted.');
    return;
  }
  if (size > MAX_IMPORT_MB) {
    renderFileItem(file, 'error', 'File exceeds 5 MB limit.');
    toastr.error('File too large. Maximum 5 MB allowed.');
    return;
  }

  importFileObj = file;
  renderFileItem(file, 'ok', null);
  $('#btnDoImport').prop('disabled', false);
}

function renderFileItem(file, state, errorMsg) {
  var ext    = file.name.split('.').pop().toLowerCase();
  var icons  = { csv:'ti-file-text text-success', xlsx:'ti-file-spreadsheet text-success', xls:'ti-file-spreadsheet text-success' };
  var icon   = icons[ext] || 'ti-file text-secondary';
  var size   = (file.size / 1024).toFixed(0) + ' KB';
  var item   = $('<div class="sms-file-item ' + (state === 'error' ? 'error' : '') + '">');
  item.html(
    '<i class="ti ' + icon + ' sms-file-item__icon"></i>' +
    '<span class="sms-file-item__name" title="' + file.name + '">' + file.name + '</span>' +
    '<span class="badge-ext">' + ext + '</span>' +
    '<span class="sms-file-item__size">' + size + '</span>' +
    (state === 'error' ? '<span class="text-danger small ms-2">' + errorMsg + '</span>' : '') +
    '<button class="sms-file-item__del" onclick="clearImport()" title="Remove"><i class="ti ti-x"></i></button>'
  );
  $('#importFileList').html(item);
}

function clearImport() {
  importFileObj = null;
  $('#importFile').val('');
  $('#importFileList').empty();
  $('#btnDoImport').prop('disabled', true);
}

$(document).on('click', '#btnDoImport', function () {
  if (!importFileObj) return;
  var fd = new FormData();
  fd.append('file', importFileObj);

  $('#importProgress').removeClass('d-none');
  $('#importPct').text('0%');
  $('#importBar').css('width', '0%');
  $(this).prop('disabled', true);

  $.ajax({
    url: BASE_URL + '/users/import',
    type:        'POST',
    data:        fd,
    processData: false,
    contentType: false,
    xhr: function () {
      var x = new XMLHttpRequest();
      x.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
          var pct = Math.round(e.loaded / e.total * 100);
          $('#importBar').css('width', pct + '%');
          $('#importPct').text(pct + '%');
        }
      });
      return x;
    },
    success: function (res) {
      $('#importProgress').addClass('d-none');
      if (res.status === 200) {
        toastr.success(res.message || 'Import successful!');
        bootstrap.Modal.getInstance(document.getElementById('modalImport')).hide();
        loadUsers();
        clearImport();
      } else {
        toastr.error(res.message || 'Import failed.');
        $('#btnDoImport').prop('disabled', false);
      }
    },
    error: function () {
      $('#importProgress').addClass('d-none');
      toastr.error('Upload failed. Please try again.');
      $('#btnDoImport').prop('disabled', false);
    }
  });
});

/* ══════════════════════════════════════════════════════
   FILE UPLOAD VALIDATION (for user profile image in form)
   ══════════════════════════════════════════════════════ */
function initFileUpload(scope) {
  var ALLOWED_IMG = ['jpg','jpeg','png','gif','webp'];
  var MAX_IMG_MB  = 2;
  var $scope = $(scope || 'body');

  $scope.find('.sms-dropzone').each(function () {
    var $dz    = $(this);
    var $input = $dz.find('input[type=file]');
    var $list  = $dz.closest('.mb-3').find('.sms-file-list');

    $dz.off('click').on('click', function (e) {
      if (!$(e.target).is('input')) $input.click();
    });

    $input.off('change').on('change', function () {
      validateImageFile(this.files[0], $list, $dz);
    });

    $dz.off('dragover').on('dragover', function (e) { e.preventDefault(); $(this).addClass('dragover'); });
    $dz.off('dragleave drop').on('dragleave drop', function (e) {
      e.preventDefault(); $(this).removeClass('dragover');
      if (e.type === 'drop' && e.originalEvent.dataTransfer.files[0]) {
        validateImageFile(e.originalEvent.dataTransfer.files[0], $list, $dz);
        $input[0].files = e.originalEvent.dataTransfer.files;
      }
    });
  });

  function validateImageFile(file, $list, $dz) {
    if (!file) return;
    var ext  = file.name.split('.').pop().toLowerCase();
    var ok   = ALLOWED_IMG.includes(ext);
    var size = file.size / (1024 * 1024);
    $list.empty();
    if (!ok) {
      showFileError($list, file, 'Only ' + ALLOWED_IMG.join(', ') + ' images allowed.');
      return;
    }
    if (size > MAX_IMG_MB) {
      showFileError($list, file, 'Image too large. Max ' + MAX_IMG_MB + ' MB.');
      return;
    }
    // Preview
    var reader = new FileReader();
    reader.onload = function (e) {
      var item = $('<div class="sms-file-item">');
      item.html(
        '<img src="' + e.target.result + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">' +
        '<span class="sms-file-item__name">' + file.name + '</span>' +
        '<span class="badge-ext">' + ext + '</span>' +
        '<span class="sms-file-item__size">' + (size*1024).toFixed(0) + ' KB</span>'
      );
      $list.html(item);
      $dz.find('.sms-dropzone__title').text('Image selected ✓');
    };
    reader.readAsDataURL(file);
  }

  function showFileError($list, file, msg) {
    var item = $('<div class="sms-file-item error">');
    item.html(
      '<i class="ti ti-alert-circle text-danger sms-file-item__icon"></i>' +
      '<span class="sms-file-item__name">' + file.name + '</span>' +
      '<span class="text-danger small">' + msg + '</span>'
    );
    $list.html(item);
    toastr.error(msg);
  }
}

/* ══════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */
$(function () {
  perPage = parseInt('<%- (settings && settings.items_per_page) ? settings.items_per_page : 15 %>') || 15;
  loadUsers();

  // Add user button
  $('#btnAddUser').on('click', function () { openUserForm(); });
});
