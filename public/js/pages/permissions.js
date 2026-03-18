/* permissions.js */
'use strict';

var _grouped = true, _page = 1, _pp = 50;

function _filters(){ return { search:$('#searchInput').val().trim(), group_name:$('#filterGroup').val(), action:$('#filterAction').val() }; }

function loadGrouped() {
    $('#permGroups').html('<div class="card"><div class="card-body text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</div></div>');
    $.get(BASE_URL+'/permissions/data', Object.assign({grouped:1}, _filters()), function(res){
        if(!res||res.status!==200){ $('#permGroups').html('<div class="card"><div class="card-body text-center text-danger py-4">Failed to load.</div></div>'); return; }
        var groups = res.data; var total = 0; var html = '';
        // Populate group filter
        var gOpts = '<option value="">All Groups</option>';
        Object.keys(groups).forEach(function(g){ gOpts += '<option value="'+H.esc(g)+'">'+H.esc(g)+'</option>'; });
        var cur = $('#filterGroup').val(); $('#filterGroup').html(gOpts).val(cur);

        Object.keys(groups).forEach(function(gname){
            var perms = groups[gname]; total += perms.length;
            var aColor = {view:'azure',add:'green',edit:'orange',delete:'red',export:'purple'};
            html += '<div class="card mb-3">' +
                '<div class="card-header"><div class="card-title">'+H.esc(gname)+
                ' <span class="badge bg-secondary-lt ms-1">'+perms.length+'</span></div></div>' +
                '<div class="card-body"><div class="d-flex flex-wrap gap-2">';
            perms.forEach(function(p){
                var color = aColor[p.action]||'secondary';
                html += '<div class="border rounded px-3 py-2 d-flex align-items-center gap-2" style="font-size:13px;">' +
                    '<span class="badge bg-'+color+'-lt" style="font-size:10px;">'+H.esc(p.action||'')+'</span>' +
                    '<span>'+H.esc(p.display_name||p.name)+'</span>' +
                    '<div class="ms-auto d-flex gap-1">' +
                    '<a href="'+BASE_URL+'/permissions/'+p.uuid+'/edit" class="btn btn-ghost-secondary btn-xs p-1" title="Edit"><i class="bi bi-pencil" style="font-size:12px;"></i></a>' +
                    '<button class="btn btn-ghost-danger btn-xs p-1" onclick="delPerm(\''+p.uuid+'\',\''+H.esc(p.display_name||p.name)+'\')" title="Delete"><i class="bi bi-trash3" style="font-size:12px;"></i></button>' +
                    '</div></div>';
            });
            html += '</div></div></div>';
        });
        if(!html) html='<div class="card"><div class="card-body text-center text-muted py-5">No permissions found.</div></div>';
        $('#permGroups').html(html);
        $('#badgeTotal').text(total);
    });
}

function loadFlat() {
    $('#flatTableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>');
    $.get(BASE_URL+'/permissions/data', Object.assign({page:_page,per_page:_pp}, _filters()), function(res){
        if(!res||res.status!==200) return;
        var data=(res.data&&res.data.data)||[]; var pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){ $('#flatTableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted">No permissions found.</td></tr>'); return; }
        var start=((_page-1)*_pp), rows='';
        data.forEach(function(p,i){
            rows += '<tr>' +
                '<td class="text-muted small">'+(start+i+1)+'</td>' +
                '<td><code class="small">'+H.esc(p.name||'')+'</code></td>' +
                '<td class="d-none d-sm-table-cell">'+H.esc(p.display_name||'')+'</td>' +
                '<td class="d-none d-md-table-cell"><span class="badge bg-secondary-lt">'+H.esc(p.group_name||'')+'</span></td>' +
                '<td class="d-none d-md-table-cell"><span class="badge bg-primary-lt">'+H.esc(p.action||'')+'</span></td>' +
                '<td><span class="badge bg-azure-lt">'+H.esc(p.panel_type||'')+'</span></td>' +
                '<td class="text-end"><div class="btn-group btn-group-sm">' +
                '<a href="'+BASE_URL+'/permissions/'+p.uuid+'/edit" class="btn btn-ghost-secondary"><i class="bi bi-pencil"></i></a>' +
                '<button class="btn btn-ghost-danger" onclick="delPerm(\''+p.uuid+'\',\''+H.esc(p.display_name||p.name)+'\')"><i class="bi bi-trash3"></i></button>' +
                '</div></td></tr>';
        });
        $('#flatTableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||start+1)+'–'+(pg.to||start+data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(buildPagination(pg, function(p){ _page=p; loadFlat(); }));
    });
}

function loadAll(){ _grouped ? loadGrouped() : loadFlat(); }

function delPerm(uuid, name) {
    smsConfirm({ icon:'🗑️', title:'Delete Permission', msg:'Delete <strong>'+H.esc(name)+'</strong>?', btnClass:'btn-danger', btnText:'Delete',
        onConfirm: function(){
            showLoading();
            $.post(BASE_URL+'/permissions/'+uuid+'/delete', function(r){ hideLoading(); if(r.status===200){toastr.success(r.message);loadAll();}else toastr.error(r.message); }).fail(function(){ hideLoading(); toastr.error('Network error.'); });
        }
    });
}

$(function(){
    loadAll();
    var st;
    $('#searchInput').on('input', function(){ clearTimeout(st); st=setTimeout(loadAll, 380); });
    $('#filterGroup,#filterAction').on('change', loadAll);
    $('#btnClearFilters').on('click', function(){ $('#filterGroup,#filterAction').val(''); $('#searchInput').val(''); loadAll(); });
    $('#btnViewGroup').on('click', function(){
        _grouped=true; $(this).addClass('active'); $('#btnViewFlat').removeClass('active');
        $('#groupedView').removeClass('d-none'); $('#flatView').addClass('d-none');
        loadGrouped();
    });
    $('#btnViewFlat').on('click', function(){
        _grouped=false; $(this).addClass('active'); $('#btnViewGroup').removeClass('active');
        $('#groupedView').addClass('d-none'); $('#flatView').removeClass('d-none');
        loadFlat();
    });
});
