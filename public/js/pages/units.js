/* units.js — list page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};
function _filters(){return{page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),company_id:$('#filterCompany').length?$('#filterCompany').val():'',sort_field:_sort.field,sort_dir:_sort.dir};}

function loadData(){
    $('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/units/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">'+T('general.failed_load','Failed.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-rulers d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('units.no_data','No units found')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':((r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
            var isGlobal=!!r.is_global;
            var globalBadge=isGlobal?' <span class="badge bg-azure-lt" style="font-size:9px;">Global</span>':'';
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            var isActive=(r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1);
            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewUnit(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverUnit(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/units/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="toggleUnit(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(isActive?'off':'on')+' me-2 text-'+(isActive?'warning':'success')+'"></i>'+(isActive?'Deactivate':'Activate')+'</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delUnit(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':(isGlobal?' class="table-light"':'');
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span>'+globalBadge+'</td>'+
                '<td class="text-muted">'+H.esc(r.symbol||'—')+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing')+' '+(pg.from||1)+'--'+(pg.to||data.length)+' '+T('general.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewUnit(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/units/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var u=res.data.unit||res.data||{};
        var h='<div class="p-4"><div class="text-center mb-4"><h4 class="mb-1">'+H.esc(u.name||'')+'</h4>';
        if(u.symbol){h+='<div class="mb-1"><span class="badge bg-blue-lt px-3 py-1" style="font-size:14px;">'+H.esc(u.symbol)+'</span></div>';}
        h+='<div>'+((u.status===true||u.status===1||u.status==='1'||parseInt(u.status)===1)?'<span class="badge bg-success-lt">'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
        h+='</div>';
        h+='</div>';
        h+='<div class="border-top pt-3 mb-3">';
        h+='<div class="row g-2">';
        h+='<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">'+T('units.name','Name')+'</div><div class="fw-medium" style="font-size:13px;">'+H.esc(u.name||'')+'</div></div></div>';
        h+='<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">'+T('units.symbol','Symbol')+'</div><div class="fw-medium" style="font-size:13px;">'+H.esc(u.symbol||'—')+'</div></div></div>';
        h+='</div>';
        h+='</div>';
        h+='<div class="border-top pt-3">';
        h+='<div class="mb-2"><span class="text-muted small">'+T('general.created_at','Created')+':</span> '+smsFormatDateTime(u.created_at)+'</div>';
        h+='<div class="mb-2"><span class="text-muted small">'+T('general.updated','Updated')+':</span> '+smsFormatDateTime(u.updated_at)+'</div>';
        h+='</div>';
        h+='</div>';$b.html(h);}).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Error.')+'</div>');});}

/* Actions */
function toggleUnit(u){$.post(BASE_URL+'/units/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delUnit(u,n){smsConfirm({icon:'trash',title:T('units.delete','Delete'),msg:T('general.are_you_sure','Sure?')+' <strong>'+H.esc(n)+'</strong>',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){showLoading();$.post(BASE_URL+'/units/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function recoverUnit(u,n){smsConfirm({icon:'recover',title:T('bulk.recover','Recover'),msg:T('bulk.recover','Recover')+' <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:T('bulk.recover','Recover'),onConfirm:function(){showLoading();$.post(BASE_URL+'/units/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;smsConfirm({icon:'action',title:a,msg:_sel.length+' '+T('units.bulk_affected','items.'),btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a,onConfirm:function(){showLoading();$.post(BASE_URL+'/units/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* Export */
function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/units/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/units/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Units</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Units ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});}

/* Import */
var _pollTimer = null;
var _importResults = [];
function openImport(){
    if(_pollTimer){clearInterval(_pollTimer);_pollTimer=null;}
    $('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').addClass('d-none');
    $('#frmImport')[0].reset();bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();
}
function showImportProgress(jobId,total){$('#importProcessing').addClass('d-none');$('#importStep1').addClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').removeClass('d-none');$('#impTotal').text(total.toLocaleString());$('#impProcessed').text('0');$('#impSuccess').text('0');$('#impErrors').text('0');$('#impPercent').text('0%');$('#impProgressBar').css('width','0%').removeClass('bg-success bg-danger');_pollTimer=setInterval(function(){pollImportStatus(jobId);},2000);}
function pollImportStatus(jobId){$.get(BASE_URL+'/notifications/job/'+jobId,function(res){if(!res||res.status!==200){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('msg.failed_check_status','Failed to check status.'));return;}var d=res.data;$('#impProcessed').text((d.processed_rows||0).toLocaleString());$('#impSuccess').text((d.success_count||0).toLocaleString());$('#impErrors').text((d.error_count||0).toLocaleString());$('#impPercent').text((d.progress||0)+'%');$('#impProgressBar').css('width',(d.progress||0)+'%');if(d.status==='completed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass(d.error_count>0?'bg-warning':'bg-success');if(typeof fetchUnreadCount==='function')fetchUnreadCount();if(d.error_count>0&&d.results&&d.results.length){toastr.warning(T('import.done','Import done:')+' '+d.success_count+' imported, '+d.error_count+' errors.');setTimeout(function(){$('#importStep3').addClass('d-none');$('#importStep2').removeClass('d-none');renderImportResults(d.results);},800);}else{toastr.success('All '+d.success_count+' rows imported!');$('#impProgressBar').addClass('bg-success').css('width','100%').text('100%');$('#importStep3').find('.d-flex').first().after('<div class="text-center py-3 mt-2"><div style="font-size:42px;">OK</div><h5 class="text-success mt-2">All '+d.success_count+' rows imported!</h5><p class="text-muted small">Check your notifications for details.</p></div>');loadData();setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},3000);}}else if(d.status==='failed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass('bg-danger');toastr.error(T('import.failed','Import failed:')+' '+(d.error_message||'Unknown error'));if(typeof fetchUnreadCount==='function')fetchUnreadCount();}}).fail(function(){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('general.connection_lost','Connection lost.'));});}

function renderImportResults(results) {
    _importResults = results;var ok = results.filter(function(r){return r.status==='success';}).length;var err = results.filter(function(r){return r.status==='error';}).length;
    $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' + (err > 0 ? '<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>' : '') + '</div>');
    if(err===0){$('#importResultTable').html('<div class="text-center py-4"><h5 class="text-success mb-2">All '+ok+' rows imported!</h5><p class="text-muted small mb-0">The list has been refreshed.</p></div>');$('#importErrorActions').addClass('d-none');loadData();if(typeof fetchUnreadCount==='function')fetchUnreadCount();setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},3000);return;}
    var h='<table class="table table-sm table-bordered mb-0" style="font-size:11px;white-space:nowrap;"><thead class="table-light"><tr><th style="width:28px;">#</th><th style="min-width:140px;">Name</th><th style="min-width:100px;">Symbol</th><th style="min-width:110px;">Error</th><th style="width:48px;">Retry</th></tr></thead><tbody>';
    results.forEach(function(r,i){if(r.status!=='error')return;var d=r.data||{};var dn=r.name||d.name||'';var ds=d.symbol||'';h+='<tr class="table-danger" id="impRow'+i+'"><td>'+r.row+'</td><td><input type="text" class="form-control form-control-sm imp-name" value="'+H.esc(dn)+'" placeholder="Name *"/></td><td><input type="text" class="form-control form-control-sm imp-symbol" value="'+H.esc(ds)+'" placeholder="Symbol"/></td><td class="small text-danger">'+H.esc(r.message||'Error')+'</td><td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow('+i+')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';});
    h+='</tbody></table>';
    if(ok>0){$('#importResultTable').html('<div class="alert alert-success py-2 mb-3 small"><i class="bi bi-check-circle me-1"></i><strong>'+ok+' rows imported.</strong> Below are '+err+' rows that need attention:</div>'+h);}else{$('#importResultTable').html(h);}
    $('#importErrorActions').removeClass('d-none');loadData();if(typeof fetchUnreadCount==='function')fetchUnreadCount();
}
function retryImportRow(idx){var r=_importResults[idx];if(!r||r.status==='success')return;var $tr=$('#impRow'+idx);var nm=$tr.find('.imp-name').val().trim();var sym=$tr.find('.imp-symbol').val().trim();if(!nm){toastr.error(T('msg.name_required','Name is required.'));return;}var $b=$tr.find('button');btnLoading($b);$.post(BASE_URL+'/units/import/single',{name:nm,symbol:sym},function(res){btnReset($b);if(res.status===200||res.status===201){$tr.removeClass('table-danger').addClass('table-success');$tr.find('input').prop('disabled',true).addClass('bg-light');$tr.find('td:eq(3)').html('<span class="text-success small"><i class="bi bi-check-circle me-1"></i>OK</span>');$tr.find('td:eq(4)').html('—');r.status='success';toastr.success('"'+nm+'" imported.');loadData();var remaining=_importResults.filter(function(x){return x.status==='error';}).length;if(remaining===0){$('#importSummary').html('<div class="alert alert-success py-2 mb-0"><i class="bi bi-check-circle me-1"></i><strong>'+T('import.all_imported','All rows imported!')+'</strong></div>');$('#importErrorActions').addClass('d-none');setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},2000);}else{var ok=_importResults.filter(function(x){return x.status==='success';}).length;$('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>'+ok+' imported</span><span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>'+remaining+' errors</span></div>');}}else{toastr.error(res.message||'Failed.');}}).fail(function(){btnReset($b);toastr.error(T('general.error','Error.'));});}
function retryAllErrors(){_importResults.forEach(function(r,i){if(r.status==='error')retryImportRow(i);});}

/* Init */
$(function(){
    _pp=smsInitPerPage('#perPageSel');loadData();
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterStatus,#filterDeleted,#filterCompany',function(){_page=1;loadData();});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();});
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this);$('#importStep1').addClass('d-none');$('#importProcessing').removeClass('d-none');$.ajax({url:BASE_URL+'/units/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){$('#importProcessing').addClass('d-none');if(r.status===200&&r.data){if(r.data.mode==='background'){showImportProgress(r.data.jobId,r.data.total);}else if(r.data.results){$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}},error:function(){$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');toastr.error(T('general.network_error','Error.'));}});});
    $('#btnRetryAllErrors').on('click',function(){retryAllErrors();});
});
