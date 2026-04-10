/* depollutions.js — Depollutions list page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var TYPE_LABELS = {1:'Vehicle Waste',2:'Part Waste',3:'Other Waste'};
var TYPE_COLORS = {1:'blue',2:'orange',3:'green'};

function _filters(){
    return {
        page:_page,per_page:_pp,
        search:$('#searchInput').val().trim(),
        type:$('#advFilterType').val()||'',
        show_deleted:$('#filterDeleted').val(),
        company_id:$('#filterCompany').length?$('#filterCompany').val():'',
        created_from:$('#filterCreatedFrom').val()||'',
        created_to:$('#filterCreatedTo').val()||'',
        sort_field:_sort.field,sort_dir:_sort.dir
    };
}

function loadData(){
    $('#tableBody').html('<tr><td colspan="9" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/depollutions/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger">Failed to load data.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="9" class="text-center py-5 text-muted"><i class="bi bi-droplet-half d-block mb-2" style="font-size:36px;opacity:.3;"></i>No depollutions found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            // Type badge
            var tp = parseInt(r.type)||0;
            var typeBadge = '<span class="badge bg-'+( TYPE_COLORS[tp]||'secondary')+'-lt">'+H.esc(TYPE_LABELS[tp]||'Unknown')+'</span>';

            // Vehicle / Part info
            var vpInfo = '';
            if (tp === 1) {
                vpInfo = H.esc(r.vehicle_internal_id || '');
                if (r.registration_plate_no) vpInfo += (vpInfo ? ' ' : '') + '<code>' + H.esc(r.registration_plate_no) + '</code>';
                if (!vpInfo) vpInfo = '<span class="text-muted">-</span>';
            } else if (tp === 2) {
                vpInfo = H.esc(r.part_internal_id || r.part_code || '');
                if (r.part_catalog_name) vpInfo += (vpInfo ? ' - ' : '') + H.esc(r.part_catalog_name);
                if (!vpInfo) vpInfo = '<span class="text-muted">-</span>';
            } else {
                vpInfo = '<span class="text-muted">&mdash;</span>';
            }

            // Description (truncated)
            var desc = r.description ? H.esc(r.description) : '<span class="text-muted">-</span>';
            if (r.description && r.description.length > 60) desc = '<span title="' + H.esc(r.description) + '">' + H.esc(r.description.substring(0, 57)) + '...</span>';

            // Total wastage
            var wastage = r.total_wastage_value != null && r.total_wastage_value !== '' ? parseFloat(r.total_wastage_value).toFixed(4) : '<span class="text-muted">0.0000</span>';

            // LER count
            var lerCount = r.lers_count || (r.lers ? r.lers.length : 0) || 0;
            var lerBadge = lerCount > 0 ? '<span class="badge bg-purple-lt">' + lerCount + ' LER' + (lerCount !== 1 ? 's' : '') + '</span>' : '<span class="text-muted">-</span>';

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewDepollution(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverDepollution(\''+r.uuid+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/depollutions/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delDepollution(\''+r.uuid+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':'';
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td>'+typeBadge+'</td>'+
                '<td>'+vpInfo+'</td>'+
                '<td>'+desc+'</td>'+
                '<td class="fw-medium">'+wastage+'</td>'+
                '<td>'+lerBadge+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+'-'+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="9" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewDepollution(uuid){
    var $b=$('#viewBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/depollutions/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200||!res.data){$b.html('<div class="alert alert-danger m-3">Not found.</div>');return;}
        renderViewModal(res.data);
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">Network error.</div>');});
}

function renderViewModal(dp){
    var $b=$('#viewBody');
    var tp = parseInt(dp.type)||0;
    var h='<div class="p-4">';

    // Header with type badge
    h+='<div class="text-center mb-4">';
    h+='<div class="mb-2"><span class="badge bg-'+(TYPE_COLORS[tp]||'secondary')+'-lt fs-6">'+H.esc(TYPE_LABELS[tp]||'Unknown')+'</span></div>';
    h+='</div>';

    // Vehicle info (type=1)
    if (tp === 1 && dp.vehicle_internal_id) {
        h+='<div class="border rounded p-3 mb-3">';
        h+='<div class="text-muted small mb-1"><i class="bi bi-truck me-1"></i>Vehicle</div>';
        h+='<div class="fw-medium">'+H.esc(dp.vehicle_internal_id||'');
        if (dp.registration_plate_no) h+=' - <code>'+H.esc(dp.registration_plate_no)+'</code>';
        h+='</div>';
        if (dp.vehicle_make || dp.vehicle_model) {
            h+='<div class="text-muted small">'+H.esc((dp.vehicle_make||'')+' '+(dp.vehicle_model||''))+'</div>';
        }
        h+='</div>';
    }

    // Parts info (type=2)
    if (tp === 2 && dp.parts && dp.parts.length) {
        h+='<div class="border rounded p-3 mb-3">';
        h+='<div class="text-muted small mb-1"><i class="bi bi-box-seam me-1"></i>Parts ('+dp.parts.length+')</div>';
        h+='<div class="d-flex flex-wrap gap-1">';
        dp.parts.forEach(function(p) {
            h+='<span class="badge bg-orange-lt">'+H.esc((p.part_code||'')+(p.catalog_name?' - '+p.catalog_name:''))+'</span>';
        });
        h+='</div></div>';
    }

    // Description
    if (dp.description) {
        h+='<div class="mb-3"><div class="text-muted small mb-1">Description</div><div class="border rounded p-2">'+H.esc(dp.description)+'</div></div>';
    }

    // LER codes table
    var lers = dp.lers || [];
    if (lers.length) {
        h+='<div class="mb-3"><div class="text-muted small mb-2"><i class="bi bi-recycle me-1"></i>LER Codes ('+lers.length+')</div>';
        h+='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead class="table-light"><tr><th>LER Code</th><th>Name</th><th>Unit</th><th>Wastage</th><th>Notes</th></tr></thead><tbody>';
        lers.forEach(function(l) {
            h+='<tr><td><code>'+H.esc(l.ler_code||'-')+'</code></td><td>'+H.esc(l.ler_name||'-')+'</td><td>'+H.esc(l.unit_symbol||l.unit_name||'-')+'</td><td class="fw-medium">'+(l.wastage_value!=null?parseFloat(l.wastage_value).toFixed(4):'-')+'</td><td>'+H.esc(l.notes||'-')+'</td></tr>';
        });
        h+='</tbody></table></div></div>';
    }

    // Total wastage
    h+='<div class="row g-3 mb-3">';
    h+='<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted small">Total Wastage Value</div><div class="fw-bold text-primary fs-5">'+(dp.total_wastage_value!=null?parseFloat(dp.total_wastage_value).toFixed(4):'0.0000')+'</div></div></div>';
    h+='</div>';

    // Timestamps
    h+='<div class="border-top pt-3">';
    h+='<div class="mb-2"><span class="text-muted small">Created:</span> '+smsFormatDateTime(dp.created_at)+'</div>';
    h+='<div class="mb-2"><span class="text-muted small">Updated:</span> '+smsFormatDateTime(dp.updated_at)+'</div>';
    h+='</div>';

    h+='</div>';
    $b.html(h);
}

/* Actions */
function delDepollution(u){smsConfirm({title:'Delete Depollution',msg:'Are you sure you want to delete this depollution record?',btnClass:'btn-danger',btnText:'Delete',onConfirm:function(){showLoading();$.post(BASE_URL+'/depollutions/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}
function recoverDepollution(u){smsConfirm({title:'Recover Depollution',msg:'Recover this depollution record?',btnClass:'btn-success',btnText:'Recover',onConfirm:function(){showLoading();$.post(BASE_URL+'/depollutions/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;smsConfirm({title:a.charAt(0).toUpperCase()+a.slice(1),msg:_sel.length+' items will be '+a+'d.',btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a.charAt(0).toUpperCase()+a.slice(1),onConfirm:function(){showLoading();$.post(BASE_URL+'/depollutions/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}

/* Export */
function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/depollutions/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/depollutions/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Depollutions</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Depollutions ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error('Failed.');});}

/* ── Import ── */
var _pollTimer = null;
var _importResults = [];
function openImport(){
    if(_pollTimer){clearInterval(_pollTimer);_pollTimer=null;}
    $('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').addClass('d-none');
    $('#frmImport')[0].reset();bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();
}
function showImportProgress(jobId,total){$('#importProcessing').addClass('d-none');$('#importStep1').addClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').removeClass('d-none');$('#impTotal').text(total.toLocaleString());$('#impProcessed').text('0');$('#impSuccess').text('0');$('#impErrors').text('0');$('#impPercent').text('0%');$('#impProgressBar').css('width','0%').removeClass('bg-success bg-danger');_pollTimer=setInterval(function(){pollImportStatus(jobId);},2000);}
function pollImportStatus(jobId){$.get(BASE_URL+'/notifications/job/'+jobId,function(res){if(!res||res.status!==200){clearInterval(_pollTimer);_pollTimer=null;toastr.error('Failed to check status.');return;}var d=res.data;$('#impProcessed').text((d.processed_rows||0).toLocaleString());$('#impSuccess').text((d.success_count||0).toLocaleString());$('#impErrors').text((d.error_count||0).toLocaleString());$('#impPercent').text((d.progress||0)+'%');$('#impProgressBar').css('width',(d.progress||0)+'%');if(d.status==='completed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass(d.error_count>0?'bg-warning':'bg-success');if(typeof fetchUnreadCount==='function')fetchUnreadCount();if(d.error_count>0&&d.results&&d.results.length){toastr.warning('Import done: '+d.success_count+' imported, '+d.error_count+' errors.');setTimeout(function(){$('#importStep3').addClass('d-none');$('#importStep2').removeClass('d-none');renderImportResults(d.results);},800);}else{toastr.success('All '+d.success_count+' rows imported!');$('#impProgressBar').addClass('bg-success').css('width','100%').text('100%');loadData();setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},3000);}}else if(d.status==='failed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass('bg-danger');toastr.error('Import failed: '+(d.error_message||'Unknown error'));if(typeof fetchUnreadCount==='function')fetchUnreadCount();}}).fail(function(){clearInterval(_pollTimer);_pollTimer=null;toastr.error('Connection lost.');});}

function renderImportResults(results) {
    _importResults = results;var ok = results.filter(function(r){return r.status==='success';}).length;var err = results.filter(function(r){return r.status==='error';}).length;
    $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' + (err > 0 ? '<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>' : '') + '</div>');
    if(err===0){$('#importResultTable').html('<div class="text-center py-4"><h5 class="text-success mb-2">All '+ok+' rows imported!</h5></div>');$('#importErrorActions').addClass('d-none');loadData();setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},3000);return;}
    var h='<table class="table table-sm table-bordered mb-0" style="font-size:11px;white-space:nowrap;"><thead class="table-light"><tr><th style="width:28px;">#</th><th style="min-width:100px;">Type</th><th style="min-width:140px;">Description</th><th style="min-width:110px;">Error</th><th style="width:48px;">Retry</th></tr></thead><tbody>';
    results.forEach(function(r,i){if(r.status!=='error')return;var d=r.data||{};h+='<tr class="table-danger" id="impRow'+i+'"><td>'+r.row+'</td><td><input type="text" class="form-control form-control-sm imp-type" value="'+H.esc(d.type||'')+'" placeholder="Type *"/></td><td><input type="text" class="form-control form-control-sm imp-desc" value="'+H.esc(d.description||'')+'" placeholder="Description"/></td><td class="small text-danger">'+H.esc(r.message||'Error')+'</td><td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow('+i+')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';});
    h+='</tbody></table>';
    if(ok>0){$('#importResultTable').html('<div class="alert alert-success py-2 mb-3 small"><i class="bi bi-check-circle me-1"></i><strong>'+ok+' rows imported.</strong> Below are '+err+' rows that need attention:</div>'+h);}else{$('#importResultTable').html(h);}
    $('#importErrorActions').removeClass('d-none');loadData();
}
function retryImportRow(idx){var r=_importResults[idx];if(!r||r.status==='success')return;var $tr=$('#impRow'+idx);var tp=$tr.find('.imp-type').val().trim();var dc=$tr.find('.imp-desc').val().trim();if(!tp){toastr.error('Type is required.');return;}var $b=$tr.find('button');btnLoading($b);$.post(BASE_URL+'/depollutions/import/single',{type:tp,description:dc},function(res){btnReset($b);if(res.status===200||res.status===201){$tr.removeClass('table-danger').addClass('table-success');$tr.find('input').prop('disabled',true).addClass('bg-light');$tr.find('td:eq(3)').html('<span class="text-success small"><i class="bi bi-check-circle me-1"></i>OK</span>');$tr.find('td:eq(4)').html('-');r.status='success';toastr.success('Row imported.');loadData();var remaining=_importResults.filter(function(x){return x.status==='error';}).length;if(remaining===0){$('#importSummary').html('<div class="alert alert-success py-2 mb-0"><i class="bi bi-check-circle me-1"></i><strong>All rows imported!</strong></div>');$('#importErrorActions').addClass('d-none');setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},2000);}else{var ok2=_importResults.filter(function(x){return x.status==='success';}).length;$('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>'+ok2+' imported</span><span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>'+remaining+' errors</span></div>');}}else{toastr.error(res.message||'Failed.');}}).fail(function(){btnReset($b);toastr.error('Error.');});}
function retryAllErrors(){_importResults.forEach(function(r,i){if(r.status==='error')retryImportRow(i);});}

/* Advanced filter counter */
function updateFilterCount() {
    var cnt = 0;
    if ($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val() !== 'all') cnt++;
    if ($('#advFilterType').val()) cnt++;
    if ($('#filterDeleted').val()) cnt++;
    if ($('#filterCreatedFrom').val()) cnt++;
    if ($('#filterCreatedTo').val()) cnt++;
    if (cnt > 0) { $('#filterCount').text(cnt).removeClass('d-none'); } else { $('#filterCount').addClass('d-none'); }
}

/* Init */
$(function(){
    if($('#tableBody').length === 0) return;

    _pp=smsInitPerPage('#perPageSel');loadData();

    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterType',function(){_page=1;loadData();});
    // Advanced filter changes
    $(document).on('change','#filterDeleted,#filterCompany,#advFilterType,#filterCreatedFrom,#filterCreatedTo',function(){_page=1;updateFilterCount();loadData();});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#advFilterType,#filterDeleted,#filterCreatedFrom,#filterCreatedTo').val('');if($('#filterCompany').length)$('#filterCompany').val('all');updateFilterCount();_page=1;loadData();});
    $('#btnClearAdvFilters').on('click',function(){$('#advFilterType,#filterDeleted,#filterCreatedFrom,#filterCreatedTo').val('');if($('#filterCompany').length)$('#filterCompany').val('all');updateFilterCount();_page=1;loadData();});
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this);$('#importStep1').addClass('d-none');$('#importProcessing').removeClass('d-none');$.ajax({url:BASE_URL+'/depollutions/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){$('#importProcessing').addClass('d-none');if(r.status===200&&r.data){if(r.data.mode==='background'){showImportProgress(r.data.jobId,r.data.total);}else if(r.data.results){$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}},error:function(){$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');toastr.error('Network error.');}});});
    $('#btnRetryAllErrors').on('click',function(){retryAllErrors();});

    // ── Tab switching: All Records vs Group by LER ──
    var _currentView = 'all';
    $(document).on('click', '#tabAllRecords, #tabGroupLer', function(e) {
        e.preventDefault();
        var view = $(this).data('view');
        if (view === _currentView) return;
        _currentView = view;
        $('.nav-tabs .nav-link').removeClass('active');
        $(this).addClass('active');
        if (view === 'all') {
            $('#viewAll').show(); $('#viewLer').hide();
        } else {
            $('#viewAll').hide(); $('#viewLer').show();
            loadGroupByLer();
        }
    });

    function loadGroupByLer() {
        var $body = $('#lerGroupBody');
        $body.html('<tr><td colspan="7" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
        var params = {};
        if ($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val() !== 'all') params.company_id = $('#filterCompany').val();
        $.get(BASE_URL + '/depollutions/group-by-ler', params, function(res) {
            if (!res || res.status !== 200 || !res.data || !res.data.length) {
                $body.html('<tr><td colspan="7" class="text-center py-5 text-muted">No LER data found</td></tr>');
                return;
            }
            var h = '';
            res.data.forEach(function(r, i) {
                var unitTxt = r.unit_symbol ? H.esc(r.unit_symbol) : (r.unit_name ? H.esc(r.unit_name) : '-');
                h += '<tr class="ler-group-row" data-ler-id="' + r.ler_id + '" style="cursor:pointer;" title="Click to expand">';
                h += '<td class="text-muted">' + (i + 1) + '</td>';
                h += '<td class="fw-medium"><i class="bi bi-chevron-right me-1 text-muted ler-chevron"></i>' + H.esc(r.ler_name || '') + '</td>';
                h += '<td><code>' + H.esc(r.ler_code || '') + '</code></td>';
                h += '<td>' + unitTxt + '</td>';
                h += '<td class="text-end">' + parseFloat(r.default_value_sum || 0).toFixed(4) + '</td>';
                h += '<td class="text-end fw-bold text-primary">' + parseFloat(r.actual_value_sum || 0).toFixed(4) + '</td>';
                h += '<td class="text-end"><span class="badge bg-secondary-lt">' + (r.record_count || 0) + ' records</span></td>';
                h += '</tr>';
            });
            $body.html(h);
        }).fail(function() { $body.html('<tr><td colspan="7" class="text-center py-4 text-danger">Network error</td></tr>'); });
    }

    // Click LER group row → open modal with paginated records
    var _lerModalPage = 1, _lerModalLerId = null, _lerModalPP = 15;
    $(document).on('click', '.ler-group-row', function() {
        _lerModalLerId = $(this).data('ler-id');
        _lerModalPage = 1;
        var lerName = $(this).find('td').eq(1).text().trim();
        var lerCode = $(this).find('code').text().trim();
        // Create modal if not exists
        var $modal = $('#lerDetailModal');
        if (!$modal.length) {
            $('body').append(
                '<div class="modal fade" id="lerDetailModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width:900px;"><div class="modal-content">' +
                '<div class="modal-header py-3"><h5 class="modal-title fw-semibold" id="lerDetailTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
                '<div class="modal-body p-0" id="lerDetailBody"></div>' +
                '<div class="modal-footer py-2 d-flex justify-content-between">' +
                '<div id="lerDetailInfo" class="text-muted small"></div>' +
                '<div class="d-flex gap-2"><div id="lerDetailPagination"></div>' +
                '<button type="button" class="btn btn-primary btn-sm" id="btnLerBulkSave"><i class="bi bi-floppy me-1"></i>Update All Values</button></div>' +
                '</div></div></div></div>'
            );
            $modal = $('#lerDetailModal');
        }
        $('#lerDetailTitle').html('<i class="bi bi-recycle me-2 text-primary"></i>' + H.esc(lerName) + ' <code class="ms-2">' + H.esc(lerCode) + '</code>');
        bootstrap.Modal.getOrCreateInstance($modal[0]).show();
        loadLerDetailPage();
    });

    function loadLerDetailPage() {
        var $body = $('#lerDetailBody');
        $body.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
        var params = { ler_id: _lerModalLerId, page: _lerModalPage, per_page: _lerModalPP };
        if ($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val() !== 'all') params.company_id = $('#filterCompany').val();
        $.get(BASE_URL + '/depollutions/group-by-ler-detail', params, function(res) {
            if (!res || res.status !== 200 || !res.data || !res.data.rows || !res.data.rows.length) {
                // Try old format (flat array)
                var rows = (res && res.data && Array.isArray(res.data)) ? res.data : (res && res.data && res.data.rows) ? res.data.rows : [];
                if (!rows.length) { $body.html('<div class="text-center py-5 text-muted">No records found</div>'); return; }
                renderLerDetailRows(rows, 0);
                $('#lerDetailInfo').text(rows.length + ' records');
                $('#lerDetailPagination').empty();
                return;
            }
            var pg = res.data;
            renderLerDetailRows(pg.rows || pg.data || [], ((pg.current_page||1)-1) * _lerModalPP);
            $('#lerDetailInfo').text('Showing ' + (pg.from||1) + '-' + (pg.to||pg.rows.length) + ' of ' + (pg.total||pg.rows.length));
            if (pg.last_page > 1) {
                var ph = '';
                for (var p = 1; p <= pg.last_page; p++) {
                    ph += '<button class="btn btn-sm ' + (p === pg.current_page ? 'btn-primary' : 'btn-outline-secondary') + ' ler-detail-pg" data-p="' + p + '">' + p + '</button> ';
                }
                $('#lerDetailPagination').html(ph);
            } else { $('#lerDetailPagination').empty(); }
        }).fail(function() { $body.html('<div class="text-center py-4 text-danger">Network error</div>'); });
    }

    function renderLerDetailRows(rows, offset) {
        var h = '<div class="table-responsive"><table class="table table-sm table-hover mb-0" style="font-size:12px;">';
        h += '<thead class="table-light"><tr><th>#</th><th>Type</th><th>Vehicle / Part</th><th>Description</th><th style="width:130px;">Wastage Value</th><th>Created</th></tr></thead><tbody>';
        rows.forEach(function(r, i) {
            var info = parseInt(r.type)===1 ? H.esc(r.vehicle_internal_id||'')+(r.registration_plate_no?' '+H.esc(r.registration_plate_no):'') : parseInt(r.type)===2 ? H.esc(r.part_internal_id||r.part_code||'')+(r.part_catalog_name?' - '+H.esc(r.part_catalog_name):'') : 'Other';
            h += '<tr><td>'+(offset+i+1)+'</td>';
            h += '<td><span class="badge bg-'+(TYPE_COLORS[r.type]||'secondary')+'-lt">'+(TYPE_LABELS[r.type]||'')+'</span></td>';
            h += '<td>'+(info||'-')+'</td>';
            h += '<td>'+H.esc((r.description||'').substring(0,60))+'</td>';
            h += '<td><input type="number" class="form-control form-control-sm ler-detail-wastage" step="0.0001" value="'+parseFloat(r.wastage_value||0).toFixed(4)+'" data-dl-id="'+r.depollution_ler_id+'" data-original="'+parseFloat(r.wastage_value||0).toFixed(4)+'"/></td>';
            h += '<td class="text-muted small">'+smsFormatDateTime(r.created_at)+'</td></tr>';
        });
        h += '</tbody></table></div>';
        $('#lerDetailBody').html(h);
    }

    $(document).on('click', '.ler-detail-pg', function() {
        _lerModalPage = parseInt($(this).data('p'));
        loadLerDetailPage();
    });

    // Bulk update from modal
    $(document).on('click', '#btnLerBulkSave', function() {
        var $btn = $(this), updates = [];
        $('#lerDetailBody .ler-detail-wastage').each(function() {
            var dlId = $(this).data('dl-id'), newVal = $(this).val(), origVal = $(this).data('original');
            if (newVal !== String(origVal)) updates.push({ depollution_ler_id: dlId, wastage_value: newVal });
        });
        if (!updates.length) { toastr.info('No changes to save.'); return; }
        btnLoading($btn);
        $.ajax({ url: BASE_URL+'/depollutions/bulk-update-wastage', type:'POST', contentType:'application/json', data: JSON.stringify({updates:updates}),
            success: function(r) { btnReset($btn); if(r.status===200){toastr.success('Updated '+updates.length+' value(s).'); loadLerDetailPage(); loadGroupByLer();}else toastr.error(r.message||'Failed.'); },
            error: function() { btnReset($btn); toastr.error('Network error.'); }
        });
    });
});
