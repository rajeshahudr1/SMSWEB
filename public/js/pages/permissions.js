/* ═══════════════════════════════════════════════════════════
   [WEB]  public/js/pages/permissions.js
   Permissions Manager
   - Actions fetched from API enum (dynamic)
   - Menu dropdown (level-wise tree) instead of free text
   - B2B/B2C panel toggle filters everything
   - Modal add/edit (no page navigation)
═══════════════════════════════════════════════════════════ */
'use strict';
var T=function(k,f){return SMS_T(k,f);};

/* ── state ───────────────────────────────────────────── */
var _panel     = 'b2b';
var _grouped   = true;
var _page      = 1;
var _pp        = 50;
var _menus     = [];       /* from API: flat list of menus for current panel */
var _allPerms  = [];       /* cache of loaded permissions for edit lookup */

/* ── Hardcoded fallback — used if API /actions call fails ── */
var _actions = [
    { value: 'view',   label: 'View',   color: 'azure',  icon: 'bi-eye'      },
    { value: 'add',    label: 'Add',    color: 'green',  icon: 'bi-plus-lg'  },
    { value: 'edit',   label: 'Edit',   color: 'orange', icon: 'bi-pencil'   },
    { value: 'delete', label: 'Delete', color: 'red',    icon: 'bi-trash3'   },
    { value: 'export', label: 'Export', color: 'purple', icon: 'bi-download' },
    { value: 'import', label: 'Import', color: 'teal',   icon: 'bi-upload'   },
];

/* ── helpers ─────────────────────────────────────────── */
function _actionColor(action) {
    var a = _actions.find(function(x){ return x.value === action; });
    return a ? a.color : 'secondary';
}
function _filters() {
    return {
        search:     $('#searchInput').val().trim(),
        group_name: $('#filterGroup').val(),
        action:     $('#filterAction').val(),
        panel_type: _panel
    };
}

/* ══════════════════════════════════════════════════════════
   LOAD ACTIONS FROM API (enum)
══════════════════════════════════════════════════════════ */
function loadActions(cb) {
    $.get(BASE_URL + '/permissions/actions', function(res) {
        if (res && res.status === 200 && Array.isArray(res.data) && res.data.length) {
            _actions = res.data;
        }
        /* else: keep hardcoded _actions fallback */
        _fillActionOptions();
        _initSelect2Action();
        if (cb) cb();
    }).fail(function() {
        /* API unavailable — use hardcoded _actions */
        _fillActionOptions();
        _initSelect2Action();
        if (cb) cb();
    });
}

function _fillActionOptions() {
    /* Fill filter dropdown */
    var fOpts = '<option value="">All Actions</option>';
    _actions.forEach(function(a) {
        fOpts += '<option value="' + a.value + '">' + a.label + '</option>';
    });
    $('#filterAction').html(fOpts);
    /* Fill modal form dropdown */
    var mOpts = '';
    _actions.forEach(function(a) {
        mOpts += '<option value="' + a.value + '">' + a.label + '</option>';
    });
    $('#fldAction').html(mOpts);
}

/* ══════════════════════════════════════════════════════════
   LOAD MENUS FROM API (for dropdown, filtered by panel)
══════════════════════════════════════════════════════════ */
function loadMenus(cb) {
    $.get(BASE_URL + '/permissions/menus', { panel_type: _panel }, function(res) {
        _menus = (res && res.status === 200) ? (res.data || []) : [];
        _populateMenuDropdowns();
        if (cb) cb();
    });
}

function _populateMenuDropdowns() {
    var mOpts = '<option value="">— Select Menu —</option>';
    var gOpts = '<option value="">All Menus</option>';
    _menus.forEach(function(m) {
        var lvl  = m.level || 1;
        var indent = '';
        for (var i = 1; i < lvl; i++) indent += '\u00a0\u00a0\u00a0\u00a0';
        var title = H.esc(m.title);
        mOpts += '<option value="' + m.id + '">' + indent + title + '  (L' + lvl + ')</option>';
        gOpts += '<option value="' + H.esc(m.title) + '">' + indent + title + '  (L' + lvl + ')</option>';
    });

    /* Modal menu select — just fill HTML, Select2 inits when modal opens */
    var curMenu = $('#fldMenuId').val();
    $('#fldMenuId').html(mOpts);
    if (curMenu) $('#fldMenuId').val(curMenu);

    /* Filter group select — fill + init Select2 */
    var curGroup = $('#filterGroup').val();
    $('#filterGroup').html(gOpts);
    if (curGroup) $('#filterGroup').val(curGroup);
    _initSelect2Filters();
}

/* ── Select2 custom template: icon + title + level badge ── */
function _s2MenuTemplate(state) {
    if (!state.id) return state.text;
    /* Find menu in our cached _menus array by id */
    var m = _menus.find(function(x){ return String(x.id) === String(state.id); });
    /* Fallback: try matching by title (for filter dropdown which uses title as value) */
    if (!m) m = _menus.find(function(x){ return x.title === state.id; });
    if (!m) return state.text;

    var lvl    = m.level || 1;
    var icon   = (m.icon || '').replace(/^bi\s+/, '').replace(/^ti\s+/, '') || 'circle';
    var indent = '';
    for (var i = 1; i < lvl; i++) indent += '<span style="display:inline-block;width:16px;"></span>';

    var html = '<span style="display:inline-flex;align-items:center;line-height:1.4;">'
        + indent
        + '<i class="bi bi-' + H.esc(icon) + '" style="font-size:13px;color:var(--tblr-primary);width:18px;text-align:center;margin-right:5px;flex-shrink:0;"></i>'
        + '<span style="margin-right:5px;">' + H.esc(m.title) + '</span>'
        + '<span class="badge bg-secondary-lt" style="font-size:9px;">L' + lvl + '</span>'
        + '</span>';
    return $(html);
}

/* ── Select2 template for action dropdown: icon + colored badge ── */
function _s2ActionTemplate(state) {
    if (!state.id) return state.text;
    /* Find action in our _actions array */
    var a = _actions.find(function(x){ return x.value === state.id; });
    if (!a) return state.text;

    var icon = a.icon || '';
    var iconHtml = icon
        ? '<i class="bi ' + H.esc(icon) + '" style="font-size:11px;margin-right:3px;"></i>'
        : '';

    var html = '<span style="display:inline-flex;align-items:center;">'
        + '<span class="badge bg-' + a.color + '-lt" style="font-size:10.5px;padding:3px 8px;">'
        + iconHtml + H.esc(a.label)
        + '</span></span>';
    return $(html);
}

/* ── Init Select2: filter bar action only ── */
function _initSelect2Action() {
    var $el = $('#filterAction');
    if (!$el.length) return;
    try { if ($el.data('select2')) $el.select2('destroy'); } catch(e){}
    $el.select2({
        theme: 'bootstrap-5',
        allowClear: true,
        placeholder: 'All Actions',
        templateResult: _s2ActionTemplate,
        templateSelection: _s2ActionTemplate,
        width: 'resolve',
        minimumResultsForSearch: -1,
    });
}

/* ── Init Select2: filter bar all dropdowns ── */
function _initSelect2Filters() {
    var $grp = $('#filterGroup');
    if ($grp.length) {
        try { if ($grp.data('select2')) $grp.select2('destroy'); } catch(e){}
        $grp.select2({
            theme: 'bootstrap-5',
            allowClear: true,
            placeholder: 'All Menus',
            templateResult: _s2MenuTemplate,
            templateSelection: _s2MenuTemplate,
            width: 'resolve',
        });
    }
    _initSelect2Action();
}

/* ── Init Select2: modal menu + action dropdowns ── */
function _initSelect2Modal() {
    var $parent = $('#modalPerm .modal-content');

    var $menu = $('#fldMenuId');
    if ($menu.length) {
        try { if ($menu.data('select2')) $menu.select2('destroy'); } catch(e){}
        $menu.select2({
            theme: 'bootstrap-5',
            placeholder: '— Select Menu —',
            templateResult: _s2MenuTemplate,
            templateSelection: _s2MenuTemplate,
            width: '100%',
            dropdownParent: $parent,
        });
    }

    var $act = $('#fldAction');
    if ($act.length) {
        try { if ($act.data('select2')) $act.select2('destroy'); } catch(e){}
        $act.select2({
            theme: 'bootstrap-5',
            placeholder: 'Select Action',
            templateResult: _s2ActionTemplate,
            templateSelection: _s2ActionTemplate,
            width: '100%',
            minimumResultsForSearch: -1,
            dropdownParent: $parent,
        });
    }
}

/* ══════════════════════════════════════════════════════════
   LOAD GROUPED VIEW
══════════════════════════════════════════════════════════ */
function loadGrouped() {
    $('#permGroups').html(
        '<div class="text-center py-5 text-muted">' +
        '<div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</div>'
    );
    $.get(BASE_URL + '/permissions/data', Object.assign({ grouped: 1 }, _filters()), function(res) {
        if (!res || res.status !== 200) {
            $('#permGroups').html('<div class="text-center text-danger py-4">'+T('general.failed_to_load','Failed to load.')+'</div>');
            return;
        }
        var groups = res.data;
        var total = 0;
        var html  = '';
        _allPerms = [];

        Object.keys(groups).forEach(function(gname) {
            var perms = groups[gname];
            total += perms.length;
            perms.forEach(function(p) { _allPerms.push(p); });

            /* Find matching menu for the icon */
            var menuMatch = _menus.find(function(m){ return m.title === gname; });
            var menuIcon  = menuMatch ? (menuMatch.icon || '').replace(/^bi\s+/,'').replace(/^ti\s+/,'') : '';
            var iconHtml  = menuIcon
                ? '<i class="bi bi-' + H.esc(menuIcon) + ' me-2 text-primary" style="font-size:14px;"></i>'
                : '<i class="bi bi-folder2 me-2 text-primary" style="font-size:14px;"></i>';

            html += '<div class="sms-perm-group">' +
                '<div class="sms-perm-group__header">' +
                iconHtml +
                '<span class="fw-semibold" style="font-size:13.5px;">' + H.esc(gname) + '</span>' +
                '<span class="badge bg-secondary-lt rounded-pill ms-2" style="font-size:10.5px;">' + perms.length + '</span>' +
                '</div><div class="sms-perm-group__body">';

            perms.forEach(function(p) {
                var color = _actionColor(p.action);
                html += '<div class="sms-perm-chip">' +
                    '<span class="badge bg-' + color + '-lt" style="font-size:10px;min-width:44px;text-align:center;">' + H.esc(p.action || '') + '</span>' +
                    '<span class="sms-perm-chip__name">' + H.esc(p.display_name || p.name) + '</span>' +
                    '<code class="sms-perm-chip__key d-none d-md-inline">' + H.esc(p.name) + '</code>' +
                    '<div class="sms-perm-chip__acts">' +
                    '<button class="btn btn-ghost-warning btn-xs p-1" onclick="openEditPerm(\'' + H.esc(p.uuid) + '\')" title="Edit"><i class="bi bi-pencil" style="font-size:12px;"></i></button>' +
                    '<button class="btn btn-ghost-danger btn-xs p-1" onclick="delPerm(\'' + H.esc(p.uuid) + '\',\'' + H.esc(p.display_name || p.name) + '\')" title="Delete"><i class="bi bi-trash3" style="font-size:12px;"></i></button>' +
                    '</div></div>';
            });
            html += '</div></div>';
        });

        if (!html) {
            html = '<div class="text-center text-muted py-5">' +
                '<i class="bi bi-key" style="font-size:48px;opacity:.12;display:block;margin:0 auto 12px;"></i>' +
                '<p class="fw-semibold mb-1" style="font-size:14px;">'+T('permissions.no_permissions_found','No permissions found')+'</p>' +
                '<p class="text-muted mb-0" style="font-size:13px;">'+T('permissions.try_changing_filters','Try changing your filters or panel.')+'</p></div>';
        }
        $('#permGroups').html(html);
        $('#badgeTotal').text(total);
    });
}

/* ══════════════════════════════════════════════════════════
   LOAD FLAT TABLE VIEW
══════════════════════════════════════════════════════════ */
function loadFlat() {
    $('#flatTableBody').html(
        '<tr><td colspan="7" class="text-center py-5 text-muted">' +
        '<div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>'
    );
    $.get(BASE_URL + '/permissions/data', Object.assign({ page: _page, per_page: _pp }, _filters()), function(res) {
        if (!res || res.status !== 200) return;
        var data = (res.data && res.data.data) || [];
        var pg   = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());

        data.forEach(function(p) {
            if (!_allPerms.find(function(x){ return x.uuid === p.uuid; })) _allPerms.push(p);
        });

        if (!data.length) {
            $('#flatTableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted">'+T('permissions.no_permissions_found','No permissions found.')+'</td></tr>');
            return;
        }
        var start = ((_page - 1) * _pp);
        var rows  = '';
        data.forEach(function(p, i) {
            var color = _actionColor(p.action);
            rows += '<tr>' +
                '<td class="text-muted small">' + (start + i + 1) + '</td>' +
                '<td><code class="small">' + H.esc(p.name || '') + '</code></td>' +
                '<td class="d-none d-sm-table-cell">' + H.esc(p.display_name || '') + '</td>' +
                '<td class="d-none d-md-table-cell"><span class="badge bg-secondary-lt">' + H.esc(p.group_name || '') + '</span></td>' +
                '<td class="d-none d-md-table-cell"><span class="badge bg-' + color + '-lt">' + H.esc(p.action || '') + '</span></td>' +
                '<td><span class="badge bg-azure-lt">' + H.esc(p.panel_type || '') + '</span></td>' +
                '<td class="text-end"><div class="btn-group btn-group-sm">' +
                '<button class="btn btn-ghost-warning" onclick="openEditPerm(\'' + H.esc(p.uuid) + '\')"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-ghost-danger" onclick="delPerm(\'' + H.esc(p.uuid) + '\',\'' + H.esc(p.display_name || p.name) + '\')"><i class="bi bi-trash3"></i></button>' +
                '</div></td></tr>';
        });
        $('#flatTableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing') + ' ' + (pg.from || start + 1) + '–' + (pg.to || start + data.length) + ' ' + T('general.of','of') + ' ' + (pg.total || 0));
        $('#tablePagination').html(buildPagination(pg, function(p) { _page = p; loadFlat(); }));
    });
}

function loadAll() { _grouped ? loadGrouped() : loadFlat(); }

/* ══════════════════════════════════════════════════════════
   MODAL — ADD
══════════════════════════════════════════════════════════ */
function _updatePanelDisplay(panel) {
    var p    = panel || _panel;
    var lbl  = p === 'both' ? 'Both Panels' : (p.toUpperCase() + ' Only');
    var bg   = p === 'b2c' ? 'bg-success-lt text-success' : 'bg-primary-lt text-primary';
    var icon = p === 'b2c' ? 'bi-person' : 'bi-building';
    $('#fldPanelType').val(p);
    $('#panelDisplay').html('<span class="badge ' + bg + ' px-2"><i class="bi ' + icon + ' me-1"></i>' + lbl + '</span>');
}

function _autoDisplayName() {
    var menuId = $('#fldMenuId').val();
    var action = $('#fldAction').val();
    if (!menuId || !action) return;
    var m = _menus.find(function(x){ return String(x.id) === String(menuId); });
    var a = _actions.find(function(x){ return x.value === action; });
    if (!m || !a) return;
    $('#fldDisplayName').val(a.label + ' ' + m.title);
}

function openAddPerm() {
    $('#frmPermission')[0].reset();
    $('#editUuid').val('');
    $('#permKeyRow').hide();
    $('#modalPermTitle').html('<i class="bi bi-key me-2 text-primary"></i>Add Permission');
    $('#btnPermSave').html('<i class="bi bi-floppy me-1"></i>Create');
    _updatePanelDisplay();
    /* Refresh menus for current panel, then init Select2 and show */
    loadMenus(function() {
        _initSelect2Modal();
        $('#fldMenuId').val('').trigger('change.select2');
        $('#fldAction').val('view').trigger('change.select2');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPerm')).show();
    });
}

/* ══════════════════════════════════════════════════════════
   MODAL — EDIT
══════════════════════════════════════════════════════════ */
function openEditPerm(uuid) {
    var p = _allPerms.find(function(x) { return x.uuid === uuid; });
    if (!p) { toastr.error(T('permissions.not_found_refresh','Permission not found. Please refresh.')); return; }

    $('#frmPermission')[0].reset();
    $('#editUuid').val(uuid);
    $('#modalPermTitle').html('<i class="bi bi-pencil me-2 text-primary"></i>Edit Permission');
    $('#btnPermSave').html('<i class="bi bi-floppy me-1"></i>Update');
    _updatePanelDisplay(p.panel_type || _panel);

    var menuPanel = p.panel_type || _panel;
    $.get(BASE_URL + '/permissions/menus', { panel_type: menuPanel }, function(res) {
        var editMenus = (res && res.status === 200) ? (res.data || []) : _menus;

        /* Temporarily set _menus so the Select2 template can find items */
        var savedMenus = _menus;
        _menus = editMenus;

        var mOpts = '<option value="">— Select Menu —</option>';
        editMenus.forEach(function(m) {
            var lvl = m.level || 1;
            var indent = '';
            for (var i = 1; i < lvl; i++) indent += '\u00a0\u00a0\u00a0\u00a0';
            var sel = (p.menu_id && String(m.id) === String(p.menu_id)) ? ' selected' : '';
            mOpts += '<option value="' + m.id + '"' + sel + '>'
                + indent + H.esc(m.title) + '  (L' + lvl + ')</option>';
        });
        $('#fldMenuId').html(mOpts);
        $('#fldAction').val(p.action || 'view');
        $('#fldDisplayName').val(p.display_name || '');
        $('#permKeyDisplay').val(p.name || '');
        $('#permKeyRow').show();

        _initSelect2Modal();

        /* Restore _menus for filter bar (only if panel is different) */
        if (menuPanel !== _panel) _menus = savedMenus;

        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPerm')).show();
    });
}

/* ══════════════════════════════════════════════════════════
   SUBMIT ADD / EDIT
══════════════════════════════════════════════════════════ */
function submitPerm(e) {
    e.preventDefault();

    /* Validation */
    if (!$('#fldMenuId').val()) {
        toastr.error(T('permissions.select_menu','Please select a menu.'));
        $('#fldMenuId').focus();
        return;
    }
    if (!$('#fldDisplayName').val().trim()) {
        toastr.error(T('permissions.display_name_required','Display name is required.'));
        $('#fldDisplayName').focus();
        return;
    }

    var uuid   = $('#editUuid').val();
    var isEdit = !!uuid;
    var url    = isEdit ? BASE_URL + '/permissions/' + uuid : BASE_URL + '/permissions';

    var $btn = $('#btnPermSave');
    var orig = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>'+T('general.saving','Saving...'));

    smsAjax({
        url:  url,
        data: $('#frmPermission').serialize(),
        success: function(r) {
            $btn.prop('disabled', false).html(orig);
            if (r.status === 200 || r.status === 201) {
                toastr.success(r.message || T('msg.settings_saved','Saved.'));
                bootstrap.Modal.getInstance(document.getElementById('modalPerm'))?.hide();
                loadAll();
            } else {
                toastr.error(r.message || T('permissions.error_saving','Error saving.'));
            }
        },
        error: function() {
            $btn.prop('disabled', false).html(orig);
            toastr.error(T('general.network_error','Network error.'));
        }
    });
}

/* ══════════════════════════════════════════════════════════
   DELETE
══════════════════════════════════════════════════════════ */
function delPerm(uuid, name) {
    smsConfirm({
        icon: '🗑️',
        title: T('btn.delete','Delete') + ' ' + T('permissions.permission','Permission'),
        msg: T('btn.delete','Delete') + ' <strong>' + H.esc(name) + '</strong>?<br><small class="text-muted">'+T('permissions.delete_warning','This will also remove it from all roles.')+'</small>',
        btnClass: 'btn-danger',
        btnText: T('btn.delete','Delete'),
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL + '/permissions/' + uuid + '/delete', function(r) {
                hideLoading();
                if (r.status === 200) { toastr.success(r.message); loadAll(); }
                else toastr.error(r.message);
            }).fail(function() { hideLoading(); toastr.error(T('general.network_error','Network error.')); });
        }
    });
}

/* ══════════════════════════════════════════════════════════
   PANEL TOGGLE
══════════════════════════════════════════════════════════ */
$('#panelGroup').on('click', '.sms-panel-btn', function() {
    $('#panelGroup .sms-panel-btn').removeClass('active');
    $(this).addClass('active');
    _panel = $(this).data('panel');
    _page  = 1;
    loadMenus();   /* refresh menus for new panel */
    loadAll();
});

/* ══════════════════════════════════════════════════════════
   VIEW TOGGLE
══════════════════════════════════════════════════════════ */
$('#btnViewGroup').on('click', function() {
    _grouped = true;
    $('.sms-view-btn').removeClass('active');
    $(this).addClass('active');
    $('#groupedView').removeClass('d-none'); $('#flatView').addClass('d-none');
    loadGrouped();
});
$('#btnViewFlat').on('click', function() {
    _grouped = false;
    $('.sms-view-btn').removeClass('active');
    $(this).addClass('active');
    $('#groupedView').addClass('d-none'); $('#flatView').removeClass('d-none');
    loadFlat();
});

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
$(function() {
    /* Load actions enum from API, then menus, then data */
    loadActions(function() {
        loadMenus(function() {
            loadAll();
        });
    });

    /* Search debounce */
    var st;
    $('#searchInput').on('input', function() {
        clearTimeout(st);
        st = setTimeout(function() { _page = 1; loadAll(); }, 380);
    });

    /* Filter change — Select2 triggers 'change' natively */
    $(document).on('change', '#filterGroup, #filterAction', function() { _page = 1; loadAll(); });

    /* Clear filters — reset Select2 values properly */
    $('#btnClearFilters').on('click', function() {
        $('#searchInput').val('');
        if ($('#filterGroup').data('select2'))  $('#filterGroup').val('').trigger('change.select2');
        else $('#filterGroup').val('');
        if ($('#filterAction').data('select2')) $('#filterAction').val('').trigger('change.select2');
        else $('#filterAction').val('');
        _page = 1;
        loadAll();
    });

    /* Add button */
    $('#btnAddPerm').on('click', openAddPerm);

    /* Form submit */
    $('#frmPermission').on('submit', submitPerm);

    /* Auto-generate display name when menu or action changes */
    $(document).on('change', '#fldMenuId, #fldAction', _autoDisplayName);
});