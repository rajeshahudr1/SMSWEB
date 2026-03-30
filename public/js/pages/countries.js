/* countries.js */
'use strict';
var T=function(k,f){return SMS_T(k,f);};
var _page=1,_pp=15,_sel=[],_sort={field:'name',dir:'asc'},_importResults=[],_pollTimer=null;
function _filters(){var p={page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),sort_field:_sort.field,sort_dir:_sort.dir};return p;}

function loadData(){
    $('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
    var isDel=$('#filterDeleted').val()==='only';if(isDel)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');
    $.post(BASE_URL+'/countries/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">'+T('msg.failed','Failed.')+'</td></tr>');return;}
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
                acts+='<button class="btn btn-ghost-info" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\')"><i class="bi bi-diagram-3"></i></button>';
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
    }).fail(function(){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function viewRec(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/countries/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('msg.not_found','Not found.')+'</div>');return;}
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

function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text('Usage: ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/countries/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">'+T('msg.failed','Failed.')+'</div>'); return; }
        var d = res.data || {};
        if (!d.hasDependencies || !d.dependencies || !d.dependencies.length) {
            $b.html('<div class="text-center py-4"><i class="bi bi-check-circle text-success d-block mb-2" style="font-size:48px;"></i><p class="text-muted">'+T('usage.not_used','This record is not used anywhere.')+'</p></div>');
            return;
        }
        var h = '';
        d.dependencies.forEach(function(dep) {
            h += '<div class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center"><strong>' + H.esc(dep.label || dep.table) + '</strong><span class="badge bg-primary rounded-pill">' + dep.count + '</span></div>';
            if (dep.records && dep.records.length) {
                h += '<div class="table-responsive"><table class="table table-sm table-hover mb-0"><tbody>';
                dep.records.forEach(function(r, i) {
                    h += '<tr><td class="text-muted" style="width:40px;">' + (i + 1) + '</td><td>' + H.esc(r.display_name || r.name || r.full_name || r.uuid || '-') + '</td></tr>';
                });
                h += '</tbody></table></div>';
                if (dep.count > dep.records.length) h += '<div class="card-footer text-muted small">and ' + (dep.count - dep.records.length) + ' more...</div>';
            }
            h += '</div>';
        });
        $b.html(h);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Network error.')+'</div>'); });
}

function toggleRec(u){$.post(BASE_URL+'/countries/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delRec(u,n){smsConfirm({title:T('btn.delete','Delete'),msg:T('btn.delete','Delete')+' <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){$.post(BASE_URL+'/countries/'+u+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(u,n){smsConfirm({title:T('bulk.recover','Recover'),msg:T('bulk.recover','Recover')+' <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:T('bulk.recover','Recover'),onConfirm:function(){$.post(BASE_URL+'/countries/'+u+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;var _t=a==='delete'?T('btn.delete','Delete'):a==='recover'?T('bulk.recover','Recover'):a;smsConfirm({title:_t,msg:_sel.length+' '+T('bulk.items_will_be','items will be')+' '+_t.toLowerCase()+'.',btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:_t,onConfirm:function(){$.ajax({url:BASE_URL+'/countries/bulk-action',type:'POST',contentType:'application/json',data:JSON.stringify({action:a,uuids:_sel}),success:function(r){if(r.status===200){toastr.success(r.message);$('#selectAll').prop('checked',false);loadData();}else toastr.error(r.message);}});}});}

function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;
    if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/countries/export?'+$.param(p);return;}
    showLoading();$.post(BASE_URL+'/countries/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Countries</title><style>body{font-family:Arial;font-size:11px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:4px 6px;}th{background:#f0f4f8;font-weight:600;}</style></head><body><h2>Countries ('+rows.length+')</h2><table><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    }).fail(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});
}

function openImport(){
    if(_pollTimer){clearInterval(_pollTimer);_pollTimer=null;}
    $('#importProcessing').addClass('d-none');
    $('#importStep1').removeClass('d-none');
    $('#importStep2').addClass('d-none');
    $('#importStep3').addClass('d-none');
    $('#frmImport')[0].reset();
    bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();
}

function showImportProgress(jobId, total){
    $('#importProcessing').addClass('d-none');
    $('#importStep1').addClass('d-none');
    $('#importStep2').addClass('d-none');
    $('#importStep3').removeClass('d-none');
    $('#impTotal').text(total.toLocaleString());$('#impProcessed').text('0');$('#impSuccess').text('0');$('#impErrors').text('0');$('#impPercent').text('0%');
    $('#impProgressBar').css('width','0%').removeClass('bg-success bg-danger');
    _pollTimer = setInterval(function(){ pollImportStatus(jobId); }, 2000);
}

function pollImportStatus(jobId){
    $.get(BASE_URL+'/notifications/job/'+jobId, function(res){
        if(!res||res.status!==200){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('msg.failed_check_status','Failed to check status.'));return;}
        var d=res.data;
        $('#impProcessed').text((d.processed_rows||0).toLocaleString());
        $('#impSuccess').text((d.success_count||0).toLocaleString());
        $('#impErrors').text((d.error_count||0).toLocaleString());
        $('#impPercent').text((d.progress||0)+'%');
        $('#impProgressBar').css('width',(d.progress||0)+'%');
        if(d.status==='completed'){
            clearInterval(_pollTimer);_pollTimer=null;
            $('#impProgressBar').addClass(d.error_count>0?'bg-warning':'bg-success');
            if(typeof fetchUnreadCount==='function') fetchUnreadCount();
            if(d.error_count>0 && d.results && d.results.length){
                toastr.warning('Import done: '+d.success_count+' imported, '+d.error_count+' errors. Fix errors below.');
                setTimeout(function(){
                    $('#importStep3').addClass('d-none');$('#importStep2').removeClass('d-none');
                    renderImportResults(d.results);
                },800);
            } else {
                toastr.success('All '+d.success_count+' rows imported successfully!');
                $('#impProgressBar').addClass('bg-success').css('width','100%').text('100%');
                $('#importStep3').find('.d-flex').first().after(
                    '<div class="text-center py-3 mt-2"><div style="font-size:42px;">✅</div><h5 class="text-success mt-2">All '+d.success_count+' rows imported!</h5><p class="text-muted small">Check your notifications for details.</p></div>'
                );
                loadData();
                setTimeout(function(){ try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){} },3000);
            }
        } else if(d.status==='failed'){
            clearInterval(_pollTimer);_pollTimer=null;
            $('#impProgressBar').addClass('bg-danger');
            toastr.error('Import failed: '+(d.error_message||'Unknown error'));
            if(typeof fetchUnreadCount==='function') fetchUnreadCount();
        }
    }).fail(function(){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('general.network_error','Connection lost.'));});
}

function renderImportResults(results) {
    _importResults = results;
    var ok = results.filter(function(r){return r.status==='success';}).length;
    var err = results.filter(function(r){return r.status==='error';}).length;
    $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' + (err>0?'<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>':'') + '</div>');
    if (err === 0) {
        $('#importResultTable').html('<div class="text-center py-4"><div style="font-size:52px;margin-bottom:12px;">✅</div><h5 class="text-success mb-2">All ' + ok + ' rows imported successfully!</h5><p class="text-muted small mb-0">The list has been refreshed with new data.</p></div>');
        $('#importErrorActions').addClass('d-none'); loadData();
        if(typeof fetchUnreadCount==='function') fetchUnreadCount();
        setTimeout(function(){ try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){} }, 3000);
        return;
    }
    var h = '<table class="table table-sm table-bordered mb-0" style="font-size:11px;white-space:nowrap;"><thead class="table-light"><tr>' +
        '<th style="width:28px;">#</th>' +
        '<th style="min-width:120px;">Name</th>' +
        '<th style="min-width:70px;">Code</th>' +
        '<th style="min-width:70px;">Phone Code</th>' +
        '<th style="min-width:110px;">Error</th>' +
        '<th style="width:48px;">Retry</th>' +
        '</tr></thead><tbody>';
    results.forEach(function(r, i) {
        if (r.status !== 'error') return;
        var d = r.data || {};
        var dn = r.name || d.name || d['name'] || '';
        var dc = d.sort_name || d['sort_name'] || d.code || d['code'] || '';
        var dp = d.phone_code || d['phone_code'] || '';
        h += '<tr class="table-danger" id="impRow' + i + '">' +
            '<td>' + r.row + '</td>' +
            '<td><input type="text" class="form-control form-control-sm imp-name" value="' + H.esc(dn) + '" placeholder="Name *"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-code" value="' + H.esc(dc) + '" placeholder="Code"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-phone" value="' + H.esc(dp) + '" placeholder="Phone"/></td>' +
            '<td class="small text-danger">' + H.esc(r.message || 'Error') + '</td>' +
            '<td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow(' + i + ')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';
    });
    h += '</tbody></table>';
    if (ok > 0) {
        $('#importResultTable').html('<div class="alert alert-success py-2 mb-3 small"><i class="bi bi-check-circle me-1"></i><strong>' + ok + ' rows imported successfully.</strong> Below are the ' + err + ' rows that need attention:</div>' + h);
    } else {
        $('#importResultTable').html(h);
    }
    $('#importErrorActions').removeClass('d-none'); loadData();
    if(typeof fetchUnreadCount==='function') fetchUnreadCount();
}

function retryImportRow(idx){
    var r=_importResults[idx];if(!r||r.status==='success')return;
    var $tr=$('#impRow'+idx);
    var nm=$tr.find('.imp-name').val().trim();
    var cd=$tr.find('.imp-code').val().trim();
    var ph=$tr.find('.imp-phone').val().trim();
    if(!nm){toastr.error(T('msg.name_required','Name required.'));return;}
    var $b=$tr.find('button');btnLoading($b);
    $.post(BASE_URL+'/countries/import/single',{name:nm,sort_name:cd,phone_code:ph},function(res){
        btnReset($b);
        if(res.status===200||res.status===201){
            r.status='success';
            $tr.removeClass('table-danger').addClass('table-success');
            $tr.find('input').prop('disabled',true).addClass('bg-light');
            $tr.find('td:eq(4)').html('<span class="text-success small"><i class="bi bi-check-circle me-1"></i>OK</span>');
            $tr.find('td:eq(5)').html('\u2014');
            toastr.success('"'+nm+'" imported.');
            loadData();
            var remaining=_importResults.filter(function(x){return x.status==='error';}).length;
            if(remaining===0){
                $('#importSummary').html('<div class="alert alert-success py-2 mb-0"><i class="bi bi-check-circle me-1"></i><strong>All rows imported successfully!</strong></div>');
                $('#importErrorActions').addClass('d-none');
                setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},2000);
            } else {
                var ok=_importResults.filter(function(x){return x.status==='success';}).length;
                $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>'+ok+' imported</span><span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>'+remaining+' errors</span></div>');
            }
        }else{toastr.error(res.message||'Failed.');}
    }).fail(function(){btnReset($b);toastr.error(T('general.error','Error.'));});
}
function retryAllErrors(){_importResults.forEach(function(r,i){if(r.status==='error')retryImportRow(i);});}

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
            success:function(r){btnReset($b);$('#importProcessing').addClass('d-none');
                if(r.status===200&&r.data&&r.data.mode==='background'){showImportProgress(r.data.jobId,r.data.total||0);return;}
                if(r.status===200&&r.data&&r.data.results){$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}else{toastr.error(r.message||T('msg.failed','Failed.'));$('#importStep1').removeClass('d-none');}},
            error:function(){btnReset($b);$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');toastr.error(T('general.network_error','Network error.'));}
        });
    });
    $('#btnRetryAllErrors').on('click',function(){retryAllErrors();});
});