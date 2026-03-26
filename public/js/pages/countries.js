/* countries.js */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'name',dir:'asc'},_importResults=[];
function _filters(){var p={page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),sort_field:_sort.field,sort_dir:_sort.dir};return p;}

function loadData(){
    $('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
    var isDel=$('#filterDeleted').val()==='only';if(isDel)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');
    $.post(BASE_URL+'/countries/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">Failed.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-geo-alt d-block mb-2" style="font-size:36px;opacity:.3;"></i>No countries found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}
        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var del=!!r.deleted_at;
            var st=del?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
            var acts='<div class="btn-group btn-group-sm">';
            acts+='<button class="btn btn-ghost-primary" onclick="viewRec(\''+r.uuid+'\')"><i class="bi bi-eye"></i></button>';
            if(del)acts+='<button class="btn btn-ghost-success" onclick="recoverRec(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\')"><i class="bi bi-arrow-counterclockwise"></i></button>';
            else{
                acts+='<a href="'+BASE_URL+'/countries/'+r.uuid+'/edit" class="btn btn-ghost-secondary"><i class="bi bi-pencil"></i></a>';
                acts+='<button class="btn btn-ghost-'+(parseInt(r.status)?'warning':'success')+'" onclick="toggleRec(\''+r.uuid+'\')"><i class="bi bi-toggle-'+(parseInt(r.status)?'on':'off')+'"></i></button>';
                acts+='<button class="btn btn-ghost-danger" onclick="delRec(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\')"><i class="bi bi-trash3"></i></button>';
            }
            acts+='</div>';
            rows+='<tr'+(del?' class="table-secondary"':'')+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>';
            rows+='<td class="text-muted small">'+(start+i+1)+'</td>';
            rows+='<td><span class="fw-medium">'+H.esc(r.name||'')+'</span></td>';
            rows+='<td class="d-none d-md-table-cell">'+H.esc(r.sort_name||'')+'</td>'+'<td class="d-none d-md-table-cell">'+H.esc(r.phone_code||'')+'</td>';
            rows+='<td>'+st+'</td>';
            rows+='<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>';
            rows+='<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+'–'+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(buildPagination(pg,function(p){_page=p;loadData();}));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

function viewRec(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/countries/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">Not found.</div>');return;}
        var r=res.data;
        var h='<div class="p-4"><div class="text-center mb-4"><h4 class="mb-1">'+H.esc(r.name||'')+'</h4>';
        h+='<div>'+(parseInt(r.status)?'<span class="badge bg-success-lt">Active</span>':'<span class="badge bg-danger-lt">Inactive</span>')+'</div></div>';
        h+='<div class="border-top pt-3 mb-3">';
        h+='<div class="mb-2"><span class="text-muted small">Code:</span> '+H.esc(r.sort_name||'—')+'</div>';h+='<div class="mb-2"><span class="text-muted small">Phone Code:</span> '+H.esc(r.phone_code||'—')+'</div>';
        h+='<div class="mb-2"><span class="text-muted small">Created:</span> '+smsFormatDateTime(r.created_at)+'</div>';
        h+='</div></div>';
        $b.html(h);
    });
}

function toggleRec(u){$.post(BASE_URL+'/countries/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delRec(u,n){smsConfirm({title:'Delete',msg:'Delete <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-danger',btnText:'Delete',onConfirm:function(){$.post(BASE_URL+'/countries/'+u+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(u,n){smsConfirm({title:'Recover',msg:'Recover <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:'Recover',onConfirm:function(){$.post(BASE_URL+'/countries/'+u+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;smsConfirm({title:a,msg:_sel.length+' items will be '+a+'d.',btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a,onConfirm:function(){$.ajax({url:BASE_URL+'/countries/bulk-action',type:'POST',contentType:'application/json',data:JSON.stringify({action:a,uuids:_sel}),success:function(r){if(r.status===200){toastr.success(r.message);$('#selectAll').prop('checked',false);loadData();}else toastr.error(r.message);}});}});}

function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;
    if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/countries/export?'+$.param(p);return;}
    showLoading();$.post(BASE_URL+'/countries/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Countries</title><style>body{font-family:Arial;font-size:11px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:4px 6px;}th{background:#f0f4f8;font-weight:600;}</style></head><body><h2>Countries ('+rows.length+')</h2><table><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    }).fail(function(){hideLoading();toastr.error('Failed.');});
}

function openImport(){$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');$('#importStep2').addClass('d-none');$('#frmImport')[0].reset();bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();}


function renderImportResults(results) {
    _importResults = results;
    var ok = results.filter(function(r){return r.status==='success';}).length;
    var err = results.filter(function(r){return r.status==='error';}).length;
    $('#importSummary').html('<div class="d-flex gap-2"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' + (err>0?'<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>':'') + '</div>');
    if (err === 0) {
        $('#importResultTable').html('<div class="text-center py-4"><div style="font-size:52px;margin-bottom:12px;">✅</div><h5 class="text-success mb-2">All ' + ok + ' rows imported!</h5></div>');
        $('#importErrorActions').addClass('d-none'); loadData();
        setTimeout(function(){ try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){} }, 3000);
        return;
    }
    var h = '<table class="table table-sm table-bordered mb-0" style="font-size:11px;"><thead class="table-light"><tr><th>#</th><th>Name</th><th>Error</th><th>Retry</th></tr></thead><tbody>';
    results.forEach(function(r, i) {
        if (r.status !== 'error') return;
        var d = r.data || {};
        h += '<tr class="table-danger" id="impRow' + i + '"><td>' + r.row + '</td>';
        h += '<td><input type="text" class="form-control form-control-sm imp-name" value="' + H.esc(r.name||d.name||d['name']||'') + '"/></td>';
        h += '<td class="small text-danger">' + H.esc(r.message) + '</td>';
        h += '<td><button class="btn btn-sm btn-outline-warning" onclick="retryRow(' + i + ')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';
    });
    h += '</tbody></table>';
    $('#importResultTable').html(h);
    $('#importErrorActions').removeClass('d-none'); loadData();
}

function retryRow(idx){
    var r=_importResults[idx];if(!r||r.status==='success')return;
    var nm=$('#impRow'+idx+' .imp-name').val().trim();if(!nm){toastr.error('Name required.');return;}
    var $tr=$('#impRow'+idx);$tr.find('button').prop('disabled',true).html('<span class="spinner-border spinner-border-sm"></span>');
    $.post(BASE_URL+'/countries/import/single',{name:nm},function(res){
        if(res.status===200||res.status===201){_importResults[idx].status='success';$tr.removeClass('table-danger').addClass('table-success');$tr.html('<td>'+r.row+'</td><td>'+H.esc(nm)+'</td><td class="text-success small">OK</td><td>—</td>');toastr.success('Imported.');
            var rem=_importResults.filter(function(x){return x.status==='error';}).length;if(rem===0){$('#importSummary').html('<div class="alert alert-success py-2 mb-0">All rows imported!</div>');$('#importErrorActions').addClass('d-none');setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},2000);}
        }else{$tr.find('button').prop('disabled',false).html('<i class="bi bi-arrow-repeat"></i>');toastr.error(res.message||'Failed.');}
    }).fail(function(){$tr.find('button').prop('disabled',false).html('<i class="bi bi-arrow-repeat"></i>');toastr.error('Error.');});
}

$(function(){
    _pp=smsInitPerPage('#perPageSel');loadData();
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterStatus,#filterDeleted,#filterFK',function(){_page=1;loadData();});
    $('#perPageSel').on('change',function(){_pp=($(this).val()==='all')?99999:(parseInt($(this).val())||15);_page=1;loadData();});
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted,#filterFK').val('');_page=1;loadData();});
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this),$b=$('#btnImport');btnLoading($b);
        $('#importStep1').addClass('d-none');$('#importProcessing').removeClass('d-none');
        $.ajax({url:BASE_URL+'/countries/import',type:'POST',data:fd,processData:false,contentType:false,
            success:function(r){btnReset($b);$('#importProcessing').addClass('d-none');if(r.status===200&&r.data&&r.data.results){$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}else{toastr.error(r.message||'Failed.');$('#importStep1').removeClass('d-none');}},
            error:function(){btnReset($b);$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');toastr.error('Network error.');}
        });
    });
    $('#btnRetryAllErrors').on('click',function(){_importResults.forEach(function(r,i){if(r.status==='error')retryRow(i);});});
});