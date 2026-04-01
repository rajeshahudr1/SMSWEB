/* activity-logs.js */
'use strict';
var _page=1, _pp=15, _sort={field:'created_at',dir:'desc'};

function _filters(){
    return {
        page:_page, per_page:_pp,
        search:     $('#searchInput').val().trim(),
        module:     $('#filterModule').val() || '',
        action:     $('#filterAction').val() || '',
        user_id:    $('#filterUser').val() || '',
        date_from:  $('#filterDateFrom').val() || '',
        date_to:    $('#filterDateTo').val() || '',
        company_id: $('#filterCompany').length ? $('#filterCompany').val() : '',
        sort_field: _sort.field,
        sort_dir:   _sort.dir,
    };
}

var ACTION_COLORS = {create:'success',update:'info',delete:'danger',recover:'warning',import:'purple',export:'azure',login:'primary',logout:'secondary',bulk_delete:'danger',bulk_activate:'success',bulk_deactivate:'warning',add:'success',edit:'info',view:'azure'};
function actionBadge(a){
    var c=ACTION_COLORS[a]||'secondary';
    var icon={create:'plus-lg',add:'plus-lg',update:'pencil',edit:'pencil',delete:'trash3',recover:'arrow-counterclockwise',import:'upload',export:'download',login:'box-arrow-in-right',logout:'box-arrow-left',view:'eye'}[a]||'circle';
    return '<span class="badge bg-'+c+'-lt"><i class="bi bi-'+icon+' me-1"></i>'+esc(a)+'</span>';
}
function moduleBadge(m){
    if(!m) return '<span class="text-muted">–</span>';
    var label=m.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
    return '<span class="badge bg-secondary-lt">'+esc(label)+'</span>';
}
function esc(s){return s?$('<span>').text(s).html():'';}
function fmtVal(v){
    if(v===null||v===undefined||v==='') return '<span class="text-muted fst-italic">(empty)</span>';
    if(typeof v==='object'){
        if(Array.isArray(v)) return esc(v.map(function(t){var lang=t.language_name||t.language_code||t.code||t.native_name||('lang#'+(t.language_id||t.id||'?'));return lang+': '+(t.name||t.value||'');}).join(', '));
        try{return '<code class="small">'+esc(JSON.stringify(v))+'</code>';}catch(e){return esc(String(v));}
    }
    var s=String(v); if(s.length>120)s=s.substring(0,120)+'…'; return esc(s);
}

function loadStats(){
    $.get(BASE_URL+'/activity-logs/stats',function(res){
        if(!res||res.status!==200) return;
        var d=res.data; $('#statTotal').text((d.total_today||0).toLocaleString());
        var ba={}; (d.by_action||[]).forEach(function(r){ba[r.action]=parseInt(r.count);});
        $('#statCreate').text((ba.create||0).toLocaleString());
        $('#statUpdate').text((ba.update||0).toLocaleString());
        $('#statDelete').text((ba.delete||0).toLocaleString());
    });
}

function loadData(){
    $('#tableBody').html('<tr><td colspan="8" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…</td></tr>');
    $.post(BASE_URL+'/activity-logs/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="8" class="text-center py-4 text-danger">Failed to load.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="8" class="text-center py-5 text-muted"><i class="bi bi-clock-history d-block mb-2" style="font-size:36px;opacity:.3;"></i>No activity found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}
        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var un=r.user_name||r.user_email||'<span class="text-muted">System</span>';
            var desc=esc(r.description||''); if(desc.length>60)desc=desc.substring(0,60)+'…';
            var rec=r.record_name?esc(r.record_name):'<span class="text-muted">–</span>';
            var dt=typeof smsFormatDateTime==='function'?smsFormatDateTime(r.created_at):new Date(r.created_at).toLocaleString();
            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewDetail('+r.id+');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(r.record_uuid&&r.module)acts+='<li><a class="dropdown-item" href="#" onclick="viewHistory(\''+esc(r.module)+'\',\''+esc(r.record_uuid)+'\');return false;"><i class="bi bi-clock-history me-2 text-info"></i>History</a></li>';
            acts+='</ul></div>';
            rows+='<tr><td class="text-muted small">'+(start+i+1)+'</td><td><div class="fw-medium small">'+un+'</div>'+(r.ip_address?'<div class="text-muted" style="font-size:11px;">'+esc(r.ip_address)+'</div>':'')+'</td><td>'+moduleBadge(r.module)+'</td><td>'+actionBadge(r.action)+'</td><td class="small">'+desc+'</td><td class="d-none d-lg-table-cell small">'+rec+'</td><td class="d-none d-md-table-cell text-muted small">'+dt+'</td><td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+'–'+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(buildPagination(pg,function(p){_page=p;loadData();}));
    }).fail(function(){$('#tableBody').html('<tr><td colspan="8" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

/* ── Export ── */
function doExport(fmt){
    var p=_filters(); delete p.page; delete p.per_page; p.format=fmt;
    window.location.href=BASE_URL+'/activity-logs/export?'+$.param(p);
}

/* ── View Detail ── */
function viewDetail(id){
    var $b=$('#detailBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalDetail')[0]).show();
    $.get(BASE_URL+'/activity-logs/'+id,function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">Not found.</div>');return;}
        var d=res.data,h='<div class="p-3">';
        h+='<div class="row mb-3"><div class="col-sm-6"><div class="text-muted small">User</div><div class="fw-semibold">'+(esc(d.user_name)||esc(d.user_email)||'System')+'</div></div>';
        h+='<div class="col-sm-6"><div class="text-muted small">Company</div><div class="fw-semibold">'+(esc(d.company_name)||'–')+'</div></div></div>';
        h+='<div class="row mb-3"><div class="col-sm-3"><div class="text-muted small">Module</div>'+moduleBadge(d.module)+'</div>';
        h+='<div class="col-sm-3"><div class="text-muted small">Action</div>'+actionBadge(d.action)+'</div>';
        h+='<div class="col-sm-3"><div class="text-muted small">Record</div><div>'+esc(d.record_name||'–')+'</div></div>';
        h+='<div class="col-sm-3"><div class="text-muted small">Date</div><div class="small">'+(typeof smsFormatDateTime==='function'?smsFormatDateTime(d.created_at):new Date(d.created_at).toLocaleString())+'</div></div></div>';
        h+='<div class="mb-3"><div class="text-muted small">Description</div><div>'+esc(d.description||'–')+'</div></div>';
        if(d.ip_address)h+='<div class="mb-3"><div class="text-muted small">IP Address</div><div class="small">'+esc(d.ip_address)+'</div></div>';
        if(d.import_total)h+='<div class="mb-3 p-2 rounded bg-light border"><div class="text-muted small mb-1">Import Summary</div><span class="badge bg-secondary me-1">Total: '+d.import_total+'</span><span class="badge bg-success me-1">Success: '+(d.import_success||0)+'</span><span class="badge bg-danger">Errors: '+(d.import_errors||0)+'</span></div>';
        if(d.export_count)h+='<div class="mb-3 p-2 rounded bg-light border"><div class="text-muted small mb-1">Export Summary</div><span class="badge bg-secondary me-1">Rows: '+d.export_count+'</span><span class="badge bg-info">Format: '+(d.export_format||'–')+'</span></div>';
        if(d.changes_summary){
            h+='<div class="mb-3"><div class="text-muted small mb-1">Changes</div><div class="bg-light border rounded p-2" style="font-size:12px;max-height:250px;overflow-y:auto;">';
            d.changes_summary.split(', ').forEach(function(p){var m=p.match(/^(.+?):\s*(.+?)\s*→\s*(.+)$/);if(m){h+='<div class="mb-1"><span class="fw-semibold text-primary">'+esc(m[1])+'</span>: <span class="text-danger text-decoration-line-through">'+esc(m[2])+'</span> → <span class="text-success fw-medium">'+esc(m[3])+'</span></div>';}else h+='<div class="mb-1">'+esc(p)+'</div>';});
            h+='</div></div>';
        }
        if(d.old_values||d.new_values){
            h+='<div class="accordion mb-3" id="accValues">';
            if(d.old_values)h+='<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed py-2 small" type="button" data-bs-toggle="collapse" data-bs-target="#colOld">Old Values</button></h2><div id="colOld" class="accordion-collapse collapse" data-bs-parent="#accValues"><div class="accordion-body p-2"><pre class="mb-0 small" style="max-height:200px;overflow:auto;">'+esc(JSON.stringify(d.old_values,null,2))+'</pre></div></div></div>';
            if(d.new_values)h+='<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed py-2 small" type="button" data-bs-toggle="collapse" data-bs-target="#colNew">New Values</button></h2><div id="colNew" class="accordion-collapse collapse" data-bs-parent="#accValues"><div class="accordion-body p-2"><pre class="mb-0 small" style="max-height:200px;overflow:auto;">'+esc(JSON.stringify(d.new_values,null,2))+'</pre></div></div></div>';
            h+='</div>';
        }
        h+='</div>'; $b.html(h);
    });
}

/* ── History ── */
function viewHistory(module,uuid){
    var $b=$('#historyBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalHistory')[0]).show();
    $.get(BASE_URL+'/activity-logs/record/'+module+'/'+uuid,function(res){
        if(!res||res.status!==200||!res.data||!res.data.length){$b.html('<div class="alert alert-info m-3">No history found.</div>');return;}
        var logs=res.data,h='<div class="p-3"><p class="text-muted small mb-2">Select two entries to compare:</p>';
        h+='<div class="d-flex gap-2 mb-3"><button class="btn btn-sm btn-warning" id="btnCompareSelected" disabled onclick="compareSelected()"><i class="bi bi-arrow-left-right me-1"></i>Compare Selected</button></div>';
        h+='<div class="list-group list-group-flush">';
        logs.forEach(function(l){
            var dt=typeof smsFormatDateTime==='function'?smsFormatDateTime(l.created_at):new Date(l.created_at).toLocaleString();
            h+='<label class="list-group-item list-group-item-action d-flex align-items-start gap-2" style="cursor:pointer;">';
            h+='<input type="checkbox" class="form-check-input mt-1 compare-chk" data-id="'+l.id+'" onchange="checkCompare()">';
            h+='<div class="flex-grow-1"><div class="d-flex align-items-center gap-2">'+actionBadge(l.action)+'<span class="text-muted small">'+dt+'</span></div>';
            h+='<div class="small mt-1">'+esc(l.description||'')+'</div>';
            if(l.changes_summary){var cs=l.changes_summary;if(cs.length>120)cs=cs.substring(0,120)+'…';h+='<div class="text-muted mt-1" style="font-size:11px;">'+esc(cs)+'</div>';}
            if(l.user_name)h+='<div class="text-muted" style="font-size:11px;"><i class="bi bi-person me-1"></i>'+esc(l.user_name)+'</div>';
            h+='</div></label>';
        });
        h+='</div></div>'; $b.html(h);
    });
}
function checkCompare(){var c=$('.compare-chk:checked');$('#btnCompareSelected').prop('disabled',c.length!==2);if(c.length>2)c.eq(0).prop('checked',false);}
function compareSelected(){var ids=[];$('.compare-chk:checked').each(function(){ids.push(parseInt($(this).data('id')));});if(ids.length!==2)return;ids.sort(function(a,b){return a-b;});doCompare(ids[0],ids[1]);}

function doCompare(oldId,newId){
    var $b=$('#compareBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalCompare')[0]).show();
    $.post(BASE_URL+'/activity-logs/compare',{log_id_old:oldId,log_id_new:newId},function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">Failed.</div>');return;}
        var d=res.data,h='<div class="p-3">';
        h+='<div class="row mb-3"><div class="col-sm-6"><div class="p-2 rounded border bg-light"><div class="text-muted small">Older (#'+d.log_old.id+')</div><div class="fw-semibold small">'+esc(d.log_old.description||'–')+'</div><div class="text-muted" style="font-size:11px;">'+esc(d.log_old.user_name||'–')+' • '+(typeof smsFormatDateTime==='function'?smsFormatDateTime(d.log_old.created_at):new Date(d.log_old.created_at).toLocaleString())+'</div></div></div>';
        h+='<div class="col-sm-6"><div class="p-2 rounded border bg-light"><div class="text-muted small">Newer (#'+d.log_new.id+')</div><div class="fw-semibold small">'+esc(d.log_new.description||'–')+'</div><div class="text-muted" style="font-size:11px;">'+esc(d.log_new.user_name||'–')+' • '+(typeof smsFormatDateTime==='function'?smsFormatDateTime(d.log_new.created_at):new Date(d.log_new.created_at).toLocaleString())+'</div></div></div></div>';
        var diff=(d.diff||[]).filter(function(f){return f.changed;});
        if(!diff.length){h+='<div class="alert alert-info">No differences found.</div>';}
        else{
            h+='<div class="mb-2"><span class="badge bg-warning-lt">'+diff.length+' field(s) changed</span></div>';
            h+='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead class="table-light"><tr><th style="width:25%;">Field</th><th style="width:37%;">Old Value</th><th style="width:38%;">New Value</th></tr></thead><tbody>';
            diff.forEach(function(f){h+='<tr class="table-warning"><td class="fw-medium">'+esc(f.field)+'</td><td><span class="text-danger">'+fmtVal(f.old_value)+'</span></td><td><span class="text-success fw-medium">'+fmtVal(f.new_value)+'</span></td></tr>';});
            h+='</tbody></table></div>';
        }
        h+='</div>'; $b.html(h);
    });
}

$(document).on('click','.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='desc';}_page=1;loadData();});

$(function(){
    // Per page from settings
    if(typeof smsInitPerPage==='function'){_pp=smsInitPerPage('#perPageSel');}
    else{$('#perPageSel').val(_pp);}

    loadStats();
    loadData();

    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=v==='all'?99999:(parseInt(v)||15);_page=1;loadData();});

    var debounce;
    $('#searchInput').on('input',function(){clearTimeout(debounce);debounce=setTimeout(function(){_page=1;loadData();},400);});
    $('#filterModule,#filterAction,#filterUser,#filterCompany,#filterDateFrom,#filterDateTo').on('change',function(){_page=1;loadData();});

    // Toggle advanced filter
    $('#btnToggleFilter').on('click',function(){
        var $af=$('#advancedFilters');
        $af.toggleClass('d-none');
        $(this).toggleClass('btn-outline-primary btn-primary');
    });

    // Clear all filters
    $('#btnClearFilters').on('click',function(){
        $('#searchInput').val('');
        $('#filterModule,#filterAction,#filterUser').val('');
        $('#filterDateFrom,#filterDateTo').val('');
        if($('#filterCompany').length)$('#filterCompany').val('all');
        _page=1;loadData();
    });

    // Modal backdrop cleanup
    $('#modalDetail,#modalHistory,#modalCompare').on('hidden.bs.modal',function(){
        var open=$('.modal.show').length;
        if(open===0){$('.modal-backdrop').remove();$('body').removeClass('modal-open').css({overflow:'',paddingRight:''});}
        else{var bd=$('.modal-backdrop').length;while(bd>open){$('.modal-backdrop').last().remove();bd--;}$('body').addClass('modal-open');}
    });
});