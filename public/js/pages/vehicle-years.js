/* vehicle-years.js — list page (simplified: year integer, no image) */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'year',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};
function _filters(){return{page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),company_id:$('#filterCompany').length?$('#filterCompany').val():'',sort_field:_sort.field,sort_dir:_sort.dir};}

function loadData(){
    $('#tableBody').html('<tr><td colspan="6" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading…')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/vehicle-years/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="6" class="text-center py-4 text-danger">'+T('general.failed_load','Failed.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-calendar3 d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('vehicle_years.no_data','No data')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
            var isGlobal=!!r.is_global;
            var globalBadge=isGlobal?' <span class="badge bg-azure-lt" style="font-size:9px;">Global</span>':'';
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewRec(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverRec(\''+r.uuid+'\',\''+r.year+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/vehicle-years/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="toggleRec(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(parseInt(r.status)?'off':'on')+' me-2 text-'+(parseInt(r.status)?'warning':'success')+'"></i>'+(parseInt(r.status)?'Deactivate':'Activate')+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+(r.year||r.name||'')+'\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>Usage</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delRec(\''+r.uuid+'\',\''+r.year+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':(isGlobal?' class="table-light"':'');
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td><span class="fw-semibold fs-5">'+r.year+'</span>'+globalBadge+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing')+' '+(pg.from||1)+'–'+(pg.to||data.length)+' '+T('general.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(buildPagination(pg,function(p){_page=p;loadData();}));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="6" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function viewRec(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/vehicle-years/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">' + T('general.not_found','Not found.') + '</div>');return;}
        var rec=res.data.record||res.data||{};
        var h='<div class="p-4 text-center"><h2 class="mb-2">'+rec.year+'</h2>';
        h+='<div>'+(parseInt(rec.status)?'<span class="badge bg-success-lt">'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
        h+='</div>';
        h+='<div class="border-top mt-3 pt-3 text-start"><div class="mb-1"><span class="text-muted small">Created:</span> '+smsFormatDateTime(rec.created_at)+'</div>';
        h+='<div><span class="text-muted small">Updated:</span> '+smsFormatDateTime(rec.updated_at)+'</div></div></div>';
        $b.html(h);
    });
}

function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title', 'Usage') + ': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/vehicle-years/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + T('general.failed_load', 'Failed.') + '</div>'); return; }
        smsRenderUsageBody(res.data, 'vehicle-years', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">' + T('general.network_error', 'Network error.') + '</div>'); });
}

function toggleRec(uuid){smsConfirm({title:T('general.confirm','Confirm'),text:T('msg.toggle_status','Toggle status?'),onConfirm:function(){$.post(BASE_URL+'/vehicle-years/'+uuid+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function delRec(uuid,year){smsConfirm({title:T('btn.delete','Delete'),text:T('btn.delete','Delete')+' year <strong>'+year+'</strong>?',btnClass:'btn-danger',onConfirm:function(){$.post(BASE_URL+'/vehicle-years/'+uuid+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(uuid,year){smsConfirm({title:T('bulk.recover','Recover'),text:T('bulk.recover','Recover')+' year <strong>'+year+'</strong>?',btnClass:'btn-success',onConfirm:function(){$.post(BASE_URL+'/vehicle-years/'+uuid+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

function updateBulk(){var c=$('.row-chk:checked').length;_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(c);if(c>0)$('#bulkBar').removeClass('d-none');else $('#bulkBar').addClass('d-none');}
function bulkAction(action){if(!_sel.length)return;smsConfirm({title:action,text:action+' '+_sel.length+' items?',onConfirm:function(){$.post(BASE_URL+'/vehicle-years/bulk-action',{action:action,uuids:_sel},function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

function doExport(fmt){
    var p=_filters(); delete p.page; delete p.per_page; p.format=fmt;
    if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){
        window.location.href=BASE_URL+'/vehicle-years/export?'+$.param(p);
        return;
    }
    // Print
    $.post(BASE_URL+'/vehicle-years/export',p,function(res){
        if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);
        var html='<html><head><title>Vehicle Years</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Vehicle Years ('+rows.length+')</h2><table><thead><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';
        rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    });
}

/* ── Import ── */
var _pollTimer = null;var _importResults = [];
function openImport(){if(_pollTimer){clearInterval(_pollTimer);_pollTimer=null;}$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').addClass('d-none');$('#frmImport')[0].reset();bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();}
function showImportProgress(jobId,total){$('#importProcessing').addClass('d-none');$('#importStep1').addClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').removeClass('d-none');$('#impTotal').text(total.toLocaleString());$('#impProcessed').text('0');$('#impSuccess').text('0');$('#impErrors').text('0');$('#impPercent').text('0%');$('#impProgressBar').css('width','0%').removeClass('bg-success bg-danger');_pollTimer=setInterval(function(){pollImportStatus(jobId);},2000);}
function pollImportStatus(jobId){$.get(BASE_URL+'/notifications/job/'+jobId,function(res){if(!res||res.status!==200){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('msg.failed_check_status','Failed to check status.'));return;}var d=res.data;$('#impProcessed').text((d.processed_rows||0).toLocaleString());$('#impSuccess').text((d.success_count||0).toLocaleString());$('#impErrors').text((d.error_count||0).toLocaleString());$('#impPercent').text((d.progress||0)+'%');$('#impProgressBar').css('width',(d.progress||0)+'%');if(d.status==='completed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass(d.error_count>0?'bg-warning':'bg-success');if(typeof fetchUnreadCount==='function')fetchUnreadCount();if(d.error_count>0&&d.results&&d.results.length){toastr.warning(T('import.done','Import done:')+' '+d.success_count+' imported, '+d.error_count+' errors.');setTimeout(function(){$('#importStep3').addClass('d-none');$('#importStep2').removeClass('d-none');renderImportResults(d.results);},800);}else{toastr.success('All '+d.success_count+' rows imported!');$('#impProgressBar').addClass('bg-success').css('width','100%').text('100%');$('#importStep3').find('.d-flex').first().after('<div class="text-center py-3 mt-2"><div style="font-size:42px;">✅</div><h5 class="text-success mt-2">All '+d.success_count+' rows imported!</h5><p class="text-muted small">Check your notifications for details.</p></div>');loadData();setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},3000);}}else if(d.status==='failed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass('bg-danger');toastr.error(T('import.failed','Import failed:')+' '+(d.error_message||'Unknown error'));if(typeof fetchUnreadCount==='function')fetchUnreadCount();}}).fail(function(){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('general.connection_lost','Connection lost.'));});}
function renderImportResults(results){_importResults=results;var ok=results.filter(function(r){return r.status==='success';}).length;var err=results.filter(function(r){return r.status==='error';}).length;$('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>'+ok+' imported</span>'+(err>0?'<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>'+err+' errors</span>':'')+'</div>');if(err===0){$('#importResultTable').html('<div class="text-center py-4"><div style="font-size:52px;margin-bottom:12px;">✅</div><h5 class="text-success mb-2">All '+ok+' rows imported!</h5></div>');$('#importErrorActions').addClass('d-none');loadData();if(typeof fetchUnreadCount==='function')fetchUnreadCount();setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},3000);return;}var h='<table class="table table-sm table-bordered mb-0" style="font-size:11px;white-space:nowrap;"><thead class="table-light"><tr><th style="width:28px;">#</th><th style="min-width:80px;">Year</th><th style="min-width:110px;">Error</th><th style="width:48px;">Retry</th></tr></thead><tbody>';results.forEach(function(r,i){if(r.status!=='error')return;var d=r.data||{};var dy=r.year||d.year||d['year']||'';h+='<tr class="table-danger" id="impRow'+i+'"><td>'+r.row+'</td><td><input type="number" class="form-control form-control-sm imp-year" value="'+H.esc(String(dy))+'" placeholder="Year *" style="width:80px;"/></td><td class="small text-danger">'+H.esc(r.message||'Error')+'</td><td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow('+i+')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';});h+='</tbody></table>';if(ok>0){$('#importResultTable').html('<div class="alert alert-success py-2 mb-3 small"><i class="bi bi-check-circle me-1"></i><strong>'+ok+' rows imported.</strong> Below are '+err+' rows that need attention:</div>'+h);}else{$('#importResultTable').html(h);}$('#importErrorActions').removeClass('d-none');loadData();if(typeof fetchUnreadCount==='function')fetchUnreadCount();}
function retryImportRow(idx){var r=_importResults[idx];if(!r||r.status==='success')return;var $tr=$('#impRow'+idx);var yr=$tr.find('.imp-year').val().trim();if(!yr){toastr.error(T('msg.year_required','Year is required.'));return;}var $b=$tr.find('button');btnLoading($b);$.post(BASE_URL+'/vehicle-years/import/single',{year:yr},function(res){btnReset($b);if(res.status===200||res.status===201){$tr.removeClass('table-danger').addClass('table-success');$tr.find('input').prop('disabled',true).addClass('bg-light');$tr.find('td:eq(2)').html('<span class="text-success small"><i class="bi bi-check-circle me-1"></i>OK</span>');$tr.find('td:eq(3)').html('\u2014');r.status='success';toastr.success('Year '+yr+' imported.');loadData();var remaining=_importResults.filter(function(x){return x.status==='error';}).length;if(remaining===0){$('#importSummary').html('<div class="alert alert-success py-2 mb-0"><i class="bi bi-check-circle me-1"></i><strong>'+T('import.all_imported','All rows imported!')+'</strong></div>');$('#importErrorActions').addClass('d-none');setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},2000);}else{var ok=_importResults.filter(function(x){return x.status==='success';}).length;$('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>'+ok+' imported</span><span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>'+remaining+' errors</span></div>');}}else{toastr.error(res.message||'Failed.');}}).fail(function(){btnReset($b);toastr.error(T('general.error','Error.'));});}
function retryAllErrors(){_importResults.forEach(function(r,i){if(r.status==='error')retryImportRow(i);});}

$(function(){
    smsInitPerPage('#perPageSel');_pp=parseInt($('#perPageSel').val())||15;loadData();
    $('#perPageSel').on('change',function(){_pp=parseInt($(this).val())||15;_page=1;loadData();});
    var _searchTimer;$('#searchInput').on('keyup',function(){clearTimeout(_searchTimer);_searchTimer=setTimeout(function(){_page=1;loadData();},400);});
    // Only allow numbers in search
    $('#searchInput').on('input',function(){this.value=this.value.replace(/[^0-9]/g,'');});
    $('#filterStatus,#filterDeleted,#filterCompany').on('change',function(){_page=1;loadData();});
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus').val('');$('#filterDeleted').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();});
    $(document).on('click','.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}_page=1;loadData();});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',function(){updateBulk();});
    $('#btnClearBulk').on('click',function(){$('#selectAll').prop('checked',false);$('.row-chk').prop('checked',false);updateBulk();});

    // Import
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this);var $btn=$('#btnImport');btnLoading($btn);
        $.ajax({url:BASE_URL+'/vehicle-years/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){btnReset($btn);
            if(r.status===200&&r.data){
                if(r.data.mode==='background'){$('#importStep1').addClass('d-none');showImportProgress(r.data.jobId, r.data.total);}
                else if(r.data.results){$('#importStep1').addClass('d-none');$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}
                else{$('#importStep1').hide();$('#importStep2').removeClass('d-none');var d=r.data;$('#importSummary').html('<div class="alert alert-'+(d.errors&&d.errors.length?'warning':'success')+' py-2"><strong>'+(d.success||0)+'</strong> imported'+(d.errors&&d.errors.length?', <strong>'+d.errors.length+'</strong> errors':'')+'</div>');if(d.errors&&d.errors.length){$('#importErrorActions').removeClass('d-none');var tbl='<table class="table table-sm table-bordered"><thead><tr><th>Row</th><th>Data</th><th>Error</th><th>Action</th></tr></thead><tbody>';d.errors.forEach(function(er){tbl+='<tr><td>'+er.row+'</td><td class="small">'+JSON.stringify(er.data)+'</td><td class="text-danger small">'+H.esc(er.error)+'</td><td><button class="btn btn-sm btn-outline-warning btn-retry-row" data-row=\''+JSON.stringify(er.data)+'\'>Retry</button></td></tr>';});tbl+='</tbody></table>';$('#importResultTable').html(tbl);}loadData();}
            }else{toastr.error(r.message||'Failed.');}
        },error:function(){btnReset($btn);toastr.error(T('general.network_error','Network error.'));}});
    });
    $(document).on('click','.btn-retry-row',function(){var $btn=$(this);var data=JSON.parse($btn.attr('data-row'));btnLoading($btn);
        $.post(BASE_URL+'/vehicle-years/import/single',data,function(r){btnReset($btn);if(r.status===200||r.status===201){$btn.closest('tr').fadeOut();toastr.success(T('import.imported','Imported.'));loadData();}else toastr.error(r.message||'Failed.');});
    });
    $('#btnRetryAllErrors').on('click',function(){retryAllErrors();});
});
