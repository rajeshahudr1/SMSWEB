/* roles.js */
'use strict';

var _page = 1, _pp = 15, _sort = {field:'name', dir:'asc'};

function _filters() {
    return { page:_page, per_page:_pp, search:$('#searchInput').val().trim(), panel_type:$('#filterPanel').val(), status:$('#filterStatus').val(), sort_field:_sort.field, sort_dir:_sort.dir };
}

function loadRoles() {
    $('#tableBody').html('<tr><td colspan="6" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>');
    $.post(BASE_URL + '/roles/paginate', _filters(), function(res) {
        if (!res || res.status !== 200) { $('#tableBody').html('<tr><td colspan="6" class="text-center py-4 text-danger">Failed to load.</td></tr>'); return; }
        var data = (res.data && res.data.data) || [];
        var pg   = (res.data && res.data.pagination) || {};
        $('#badgeTotal').text((pg.total || 0).toLocaleString());

        if (!data.length) { $('#tableBody').html('<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-shield-x d-block mb-2" style="font-size:36px;opacity:.3;"></i>No roles found</td></tr>'); return; }

        var start = ((_page-1)*_pp), rows = '';
        data.forEach(function(r, i) {
            var panel  = r.panel_type==='b2c' ? '<span class="badge bg-teal-lt">B2C</span>' : r.panel_type==='both' ? '<span class="badge bg-purple-lt">Both</span>' : '<span class="badge bg-azure-lt">B2B</span>';
            var status = parseInt(r.status) ? '<span class="badge bg-success-lt">Active</span>' : '<span class="badge bg-danger-lt">Inactive</span>';
            rows += '<tr>' +
                '<td class="text-muted small">'+(start+i+1)+'</td>' +
                '<td><div class="fw-medium">'+H.esc(r.name||'')+'</div>' + (r.description ? '<div class="text-muted small">'+H.esc(r.description||'')+'</div>' : '') + '</td>' +
                '<td class="d-none d-sm-table-cell">'+panel+'</td>' +
                '<td class="d-none d-md-table-cell"><span class="badge bg-secondary-lt">'+(r.permission_count||0)+' perms</span></td>' +
                '<td>'+status+'</td>' +
                '<td class="text-end"><div class="btn-group btn-group-sm">' +
                '<a href="'+BASE_URL+'/roles/'+r.uuid+'/edit" class="btn btn-ghost-secondary" title="Edit"><i class="bi bi-pencil"></i></a>' +
                '<button class="btn btn-ghost-danger" onclick="delRole(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\')" title="Delete"><i class="bi bi-trash3"></i></button>' +
                '</div></td></tr>';
        });
        $('#tableBody').html(rows);
        var from=pg.from||(start+1), to=pg.to||(start+data.length);
        $('#tableInfo').text('Showing '+from+'–'+to+' of '+(pg.total||0));
        $('#tablePagination').html(buildPagination(pg, function(p){ _page=p; loadRoles(); }));
    }).fail(function(){ $('#tableBody').html('<tr><td colspan="6" class="text-center py-4 text-danger">Network error.</td></tr>'); });
}

function delRole(uuid, name) {
    smsConfirm({ icon:'🗑️', title:'Delete Role', msg:'Delete <strong>'+H.esc(name)+'</strong>? This cannot be undone.', btnClass:'btn-danger', btnText:'Delete',
        onConfirm: function(){
            showLoading();
            $.post(BASE_URL+'/roles/'+uuid+'/delete', function(r){ hideLoading(); if(r.status===200){toastr.success(r.message);loadRoles();}else toastr.error(r.message); }).fail(function(){ hideLoading(); toastr.error('Network error.'); });
        }
    });
}

$(function(){
    _pp = parseInt($('#perPageSel').val())||15;
    loadRoles();
    var st;
    $('#searchInput').on('input', function(){ clearTimeout(st); st=setTimeout(function(){ _page=1; loadRoles(); },380); });
    $('#filterPanel,#filterStatus').on('change', function(){ _page=1; loadRoles(); });
    $('#perPageSel').on('change', function(){ _pp=parseInt($(this).val()); _page=1; loadRoles(); });
    $('#btnClearFilters').on('click', function(){ $('#filterPanel,#filterStatus').val(''); $('#searchInput').val(''); _page=1; loadRoles(); });
    $(document).on('click','th.sortable',function(){
        var f=$(this).data('field');
        if(_sort.field===f) _sort.dir=_sort.dir==='asc'?'desc':'asc'; else{_sort.field=f;_sort.dir='asc';}
        $('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');
        $(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');
        _page=1; loadRoles();
    });
    $('#expCsv').on('click', function(e){ e.preventDefault(); window.location.href=BASE_URL+'/roles/export?format=csv&'+$.param(_filters()); });
});
