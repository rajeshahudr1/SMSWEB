/* menus.js — SMS Web (Super Admin only) */
'use strict';

var currentPanel = 'b2b';

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function showLoading() { $('#page-loading').addClass('show'); }
function hideLoading() { $('#page-loading').removeClass('show'); }

/* ── load tree ─────────────────────────────────────────── */
function loadMenuTree() {
    $('#menuTree').html('<div class="text-center py-5 text-secondary"><div class="spinner-border spinner-border-sm me-2 text-primary"></div>Loading...</div>');
    $.get(BASE_URL + '/menus/data?panel_type=' + currentPanel + '&tree=1', function (res) {
        if (!res || res.status !== 200) { $('#menuTree').html('<div class="text-danger text-center py-4">Failed to load.</div>'); return; }
        var tree = res.data;
        if (!tree.length) { $('#menuTree').html('<div class="text-center py-5 text-secondary"><i class="bi bi-list mb-2" style="font-size:34px;display:block;opacity:.3;"></i>No menus. Click Add Menu to create.</div>'); return; }
        $('#menuTree').html(renderTree(tree, 0));
    });
}

function renderTree(items, depth) {
    var html = '<ul class="list-unstyled' + (depth > 0 ? ' ms-4' : '') + '">';
    items.forEach(function (m) {
        var levelColor = ['primary','secondary','muted'];
        var levelBadge = ['bg-primary-lt','bg-secondary-lt','bg-light text-dark'];
        var visible = parseInt(m.is_visible);

        html += '<li class="mb-2">' +
            '<div class="d-flex align-items-center gap-2 p-2 border rounded bg-body-secondary" style="border-left:3px solid var(--tblr-primary) !important;">' +
            '<i class="bi bi-grip-vertical text-muted" style="cursor:grab; font-size:16px;"></i>' +
            '<span class="badge ' + (levelBadge[depth]||levelBadge[2]) + ' flex-shrink-0">L' + m.level + '</span>' +
            '<i class="ti ' + escHtml(m.icon||'ti-circle') + ' text-' + (levelColor[depth]||'secondary') + '"></i>' +
            '<span class="fw-medium small flex-grow-1">' + escHtml(m.title) + '</span>' +
            (m.route_path ? '<code class="text-muted" style="font-size:10px;">' + escHtml(m.route_path) + '</code>' : '') +
            (m.permission_key ? '<span class="badge bg-warning-lt" style="font-size:10px;">' + escHtml(m.permission_key) + '</span>' : '') +
            '<div class="btn-group btn-group-sm ms-auto">' +
            '<button class="btn btn-ghost-secondary btn-sm" onclick="toggleVisibility(\'' + m.uuid + '\',' + visible + ')" title="' + (visible?'Hide':'Show') + '">' +
            '<i class="bi ' + (visible ? 'bi-eye' : 'bi-eye-slash') + '"></i></button>' +
            '<button class="btn btn-ghost-secondary btn-sm" onclick="editMenu(\'' + m.uuid + '\')" title="Edit"><i class="bi bi-pencil"></i></button>' +
            '<button class="btn btn-ghost-danger btn-sm" onclick="deleteMenu(\'' + m.uuid + '\',\'' + escHtml(m.title) + '\')" title="Delete"><i class="bi bi-trash3"></i></button>' +
            '</div></div>';

        if (m.children && m.children.length) {
            html += renderTree(m.children, depth + 1);
        }
        html += '</li>';
    });
    return html + '</ul>';
}

/* ── offcanvas form ─────────────────────────────────────── */
function openMenuForm(uuid) {
    var url = uuid ? BASE_URL + '/menus/' + uuid + '/edit' : BASE_URL + '/menus/create';
    $('#offcanvasTitle').text(uuid ? 'Edit Menu Item' : 'Add Menu Item');
    $('#offcanvasBody').html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    new bootstrap.Offcanvas(document.getElementById('offcanvasMenu')).show();
    $.get(url, function (html) {
        $('#offcanvasBody').html(html);
        if ($.fn.select2) $('#offcanvasBody .select2').select2({ theme:'bootstrap-5', width:'100%', dropdownParent:$('#offcanvasMenu') });
        $('#offcanvasBody').off('submit','#frmMenu').on('submit','#frmMenu', function (e) {
            e.preventDefault();
            var uuid2 = $(this).data('uuid');
            var url2  = uuid2 ? BASE_URL + '/menus/' + uuid2 : BASE_URL + '/menus';
            var $btn  = $(this).find('[type=submit]').prop('disabled',true).text('Saving...');
            $.post(url2, $(this).serialize(), function (res) {
                $btn.prop('disabled',false).text('Save');
                if (res.status===200||res.status===201) {
                    toastr.success(res.message||'Saved.');
                    bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasMenu')).hide();
                    loadMenuTree();
                } else toastr.error(res.message||'Error.');
            }).fail(function () { $btn.prop('disabled',false).text('Save'); toastr.error('Network error.'); });
        });
    });
}

function editMenu(uuid) { openMenuForm(uuid); }

function deleteMenu(uuid, title) {
    if (!confirm('Delete menu item "' + title + '"?')) return;
    showLoading();
    $.post(BASE_URL + '/menus/' + uuid + '/delete', function (res) {
        hideLoading();
        if (res.status===200) { toastr.success(res.message); loadMenuTree(); }
        else toastr.error(res.message);
    }).fail(function () { hideLoading(); toastr.error('Network error.'); });
}

function toggleVisibility(uuid, current) {
    showLoading();
    $.ajax({ url: BASE_URL + '/menus/' + uuid + '/toggle-visibility', type: 'POST', success: function (res) {
        hideLoading();
        if (res.status===200) { toastr.success(res.message); loadMenuTree(); }
        else toastr.error(res.message);
    }, error: function () { hideLoading(); toastr.error('Network error.'); }});
}

$(function () {
    loadMenuTree();

    $('#btnAddMenu').on('click', function () { openMenuForm(); });

    // Panel switch
    $('[data-panel]').on('click', function () {
        $('[data-panel]').removeClass('active');
        $(this).addClass('active');
        currentPanel = $(this).data('panel');
        loadMenuTree();
    });
});
