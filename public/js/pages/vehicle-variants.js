/* vehicle-variants.js — list page (v2) */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var _importResults = [];
var T=function(k,f){return typeof SMS_T==='function'?SMS_T(k,f):(f||k);};

function clearOneFilter(id) { $('#' + id).val(null).trigger('change'); applyFilters(); }
function clearInputFilter(id) { $('#' + id).val(''); applyFilters(); }

function _filters(){
    return {
        page: _page, per_page: _pp,
        search: $('#searchInput').val().trim(),
        status: $('#filterStatus').val(),
        show_deleted: $('#filterDeleted').val(),
        company_id: $('#filterCompany').length ? $('#filterCompany').val() : '',
        vehicle_year_ids: ($('#filterVehicleYear').val()||[]).join(','),
        vehicle_type_ids: ($('#filterVehicleType').val()||[]).join(','),
        vehicle_make_ids: ($('#filterVehicleMake').val()||[]).join(','),
        vehicle_model_ids: ($('#filterVehicleModel').val()||[]).join(','),
        date_from: $('#filterDateFrom').val() || '',
        date_to: $('#filterDateTo').val() || '',
        start_year_from: $('#filterStartYearFrom').val() || '',
        start_year_to: $('#filterStartYearTo').val() || '',
        end_year_from: $('#filterEndYearFrom').val() || '',
        end_year_to: $('#filterEndYearTo').val() || '',
        month_initial: $('#filterMonthInitial').val() || '',
        month_final: $('#filterMonthFinal').val() || '',
        sort_field: _sort.field, sort_dir: _sort.dir
    };
}

/* ── Filter Chips ── */
function updateFilterChips() {
    var chips = [], count = 0;
    var co = $('#filterCompany').length ? $('#filterCompany').val() : 'all';
    if (co && co !== 'all') { chips.push('<span class="badge bg-blue-lt pe-1">' + H.esc($('#filterCompany option:selected').text()) + ' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterCompany\')"></button></span>'); count++; }
    var years = $('#filterVehicleYear').val() || [];
    if (years.length) { var n=[]; $('#filterVehicleYear option:selected').each(function(){n.push($(this).text());}); chips.push('<span class="badge bg-cyan-lt pe-1">Year: '+H.esc(n.join(', '))+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterVehicleYear\')"></button></span>'); count++; }
    var types = $('#filterVehicleType').val() || [];
    if (types.length) { var n=[]; $('#filterVehicleType option:selected').each(function(){n.push($(this).text());}); chips.push('<span class="badge bg-indigo-lt pe-1">Type: '+H.esc(n.join(', '))+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterVehicleType\')"></button></span>'); count++; }
    var makes = $('#filterVehicleMake').val() || [];
    if (makes.length) { var n=[]; $('#filterVehicleMake option:selected').each(function(){n.push($(this).text());}); chips.push('<span class="badge bg-purple-lt pe-1">Make: '+H.esc(n.join(', '))+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterVehicleMake\')"></button></span>'); count++; }
    var st = $('#filterStatus').val();
    if (st !== '') { chips.push('<span class="badge bg-'+(st==='1'?'success':'danger')+'-lt pe-1">'+(st==='1'?'Active':'Inactive')+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterStatus\')"></button></span>'); count++; }
    var df = $('#filterDateFrom').val(), dt = $('#filterDateTo').val();
    if (df || dt) { chips.push('<span class="badge bg-teal-lt pe-1">Date: '+(df||'...')+' ~ '+(dt||'...')+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearInputFilter(\'filterDateFrom\');clearInputFilter(\'filterDateTo\')"></button></span>'); count++; }
    var syf = $('#filterStartYearFrom').val(), syt = $('#filterStartYearTo').val();
    if (syf || syt) { chips.push('<span class="badge bg-orange-lt pe-1">Start Yr: '+(syf||'...')+'-'+(syt||'...')+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearInputFilter(\'filterStartYearFrom\');clearInputFilter(\'filterStartYearTo\')"></button></span>'); count++; }
    var eyf = $('#filterEndYearFrom').val(), eyt = $('#filterEndYearTo').val();
    if (eyf || eyt) { chips.push('<span class="badge bg-orange-lt pe-1">End Yr: '+(eyf||'...')+'-'+(eyt||'...')+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearInputFilter(\'filterEndYearFrom\');clearInputFilter(\'filterEndYearTo\')"></button></span>'); count++; }
    var mi = $('#filterMonthInitial').val(), mf = $('#filterMonthFinal').val();
    if (mi) { chips.push('<span class="badge bg-lime-lt pe-1">M.Initial: '+mi+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterMonthInitial\')"></button></span>'); count++; }
    if (mf) { chips.push('<span class="badge bg-lime-lt pe-1">M.Final: '+mf+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterMonthFinal\')"></button></span>'); count++; }
    var del = $('#filterDeleted').val();
    if (del) { chips.push('<span class="badge bg-dark-lt pe-1">'+(del==='only'?'Deleted':'All')+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="clearOneFilter(\'filterDeleted\')"></button></span>'); count++; }
    $('#activeFiltersBar').html(chips.join(' '));
    if (count > 0) $('#filterCount').text(count).removeClass('d-none'); else $('#filterCount').addClass('d-none');
}
function applyFilters() { _page = 1; updateFilterChips(); loadData(); }

function fmtProd(year, month) {
    if (!year && !month) return '<span class="text-muted">—</span>';
    var parts = [];
    if (year) parts.push(year);
    if (month) parts.push('M' + month);
    return '<span class="small">' + parts.join('-') + '</span>';
}

/* ── Image button (same as part-types) ── */
function vmImg(r){
    var s=r.display_image_url||'',ok=s&&s.indexOf('no-image')===-1;
    return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-vm-img" data-name="'+H.esc(r.name||'')+'" data-ext="'+H.esc(r.image_full_url||'')+'" data-up="'+H.esc(r.uploaded_image_url||'')+'"><img src="'+H.esc(ok?s:'/images/no-image.svg')+'" class="rounded border" style="width:40px;height:40px;object-fit:cover;'+(ok?'cursor:pointer;':'opacity:.5;')+'" onerror="this.src=\'/images/no-image.svg\';this.style.opacity=\'.5\';"/></button>';
}

function showBothImages($el){
    var n=$el.data('name')||'',ext=$el.data('ext')||'',up=$el.data('up')||'';
    if(!ext&&!up)return;
    $('#imgModalTitle').html('<i class="bi bi-image me-2 text-primary"></i>'+H.esc(n||'Images'));
    var h='<div class="row g-3">';
    if(up){h+='<div class="'+(ext?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-2"><i class="bi bi-cloud-upload me-1 text-success"></i><strong>Uploaded</strong></div><img src="'+H.esc(up)+'" class="rounded" style="max-width:100%;max-height:260px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/><div class="mt-2"><a href="'+H.esc(up)+'" target="_blank" class="btn btn-sm btn-outline-primary" download><i class="bi bi-download me-1"></i>Download</a></div></div></div>';}
    if(ext){h+='<div class="'+(up?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-2"><i class="bi bi-link-45deg me-1 text-info"></i><strong>External URL</strong></div><img src="'+H.esc(ext)+'" class="rounded" style="max-width:100%;max-height:260px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/><div class="mt-2"><a href="'+H.esc(ext)+'" target="_blank" class="btn btn-sm btn-outline-info"><i class="bi bi-box-arrow-up-right me-1"></i>Open</a></div><div class="mt-1 small text-muted text-break" style="word-break:break-all;">'+H.esc(ext)+'</div></div></div>';}
    h+='</div>';
    $('#imgModalBody').html(h);
    bootstrap.Modal.getOrCreateInstance($('#modalImage')[0]).show();
}

/* ── Load Data — 12 columns ── */
function loadData(){
    $('#tableBody').html('<tr><td colspan="13" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/vehicle-variants/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="13" class="text-center py-4 text-danger">Failed.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="13" class="text-center py-5 text-muted"><i class="bi bi-car-front-fill d-block mb-2" style="font-size:36px;opacity:.3;"></i>No vehicle variants found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt">Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt">Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
            var isGlobal=!!r.is_global;
            var gb=isGlobal?' <span class="badge bg-azure-lt" style="font-size:9px;">G</span>':'';
            var ed=r.is_editable!==false&&!deleted;
            var dl=r.is_deletable!==false&&!deleted;
            var yearBadge = r.vehicle_year_name ? '<span class="badge bg-cyan-lt" title="'+H.esc(r.vehicle_year_name)+'" data-bs-toggle="tooltip">' + H.esc(r.vehicle_year_name) + '</span>' : '<span class="text-muted">—</span>';
            var typeBadge = r.vehicle_type_name ? '<span class="badge bg-blue-lt text-truncate" style="max-width:120px;" title="'+H.esc(r.vehicle_type_name)+'" data-bs-toggle="tooltip">' + H.esc(r.vehicle_type_name) + '</span>' : '<span class="text-muted">—</span>';
            var makeBadge = r.vehicle_make_name ? '<span class="badge bg-purple-lt text-truncate" style="max-width:120px;" title="'+H.esc(r.vehicle_make_name)+'" data-bs-toggle="tooltip">' + H.esc(r.vehicle_make_name) + '</span>' : '<span class="text-muted">—</span>';
            var modelBadge = r.vehicle_model_name ? '<span class="badge bg-teal-lt text-truncate" style="max-width:120px;" title="'+H.esc(r.vehicle_model_name)+'" data-bs-toggle="tooltip">' + H.esc(r.vehicle_model_name) + '</span>' : '<span class="text-muted">—</span>';
            var prodStart = fmtProd(r.start_year, r.month_initial);
            var prodEnd = fmtProd(r.end_year, r.month_final);

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewRec(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverRec(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            } else {
                if(ed)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/vehicle-variants/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(ed)acts+='<li><a class="dropdown-item" href="#" onclick="toggleRec(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(parseInt(r.status)?'off':'on')+' me-2 text-'+(parseInt(r.status)?'warning':'success')+'"></i>'+(parseInt(r.status)?'Deactivate':'Activate')+'</a></li>';
                if(dl)acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delRec(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';
            }
            acts+='</ul></div>';
            var rc=deleted?' class="table-secondary"':(isGlobal?' class="table-light"':'');
            rows+='<tr'+rc+'><td><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td>'+vmImg(r)+'</td>'+
                '<td>'+H.trunc(r.name||'',22,'fw-medium')+gb+'</td>'+
                '<td>'+typeBadge+'</td>'+
                '<td>'+yearBadge+'</td>'+
                '<td>'+makeBadge+'</td>'+
                '<td>'+modelBadge+'</td>'+
                '<td>'+prodStart+'</td>'+
                '<td>'+prodEnd+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+'\u2013'+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(buildPagination(pg,function(p){_page=p;loadData();}));updateBulk();
        if(typeof smsInitTooltips==='function') smsInitTooltips('#tableBody');
    }).fail(function(){$('#tableBody').html('<tr><td colspan="13" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

/* ── View — all details (image same as part-types) ── */
function viewRec(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/vehicle-variants/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">Not found.</div>');return;}
        var rec=res.data.record||res.data||{},trans=rec.translations||[];
        var up=rec.uploaded_image_url||'',ext=rec.image_full_url||'';
        var h='<div class="p-4">';

        /* Header */
        h+='<div class="text-center mb-3">';
        h+='<h4 class="mb-1">'+H.esc(rec.name||'')+'</h4>';
        h+=(parseInt(rec.status)?'<span class="badge bg-success-lt">Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
        if(rec.is_global)h+=' <span class="badge bg-azure-lt">Global</span>';
        if(rec.company_name)h+='<div class="text-muted small mt-1"><i class="bi bi-building me-1"></i>'+H.esc(rec.company_name)+'</div>';
        h+='</div>';

        /* Both images — same as part-types */
        if(up||ext){h+='<div class="row g-2 mb-3">';
            if(up){h+='<div class="'+(ext?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-1"><i class="bi bi-cloud-upload me-1 text-success"></i>Uploaded</div><img src="'+H.esc(up)+'" class="rounded sms-vm-img" style="max-height:140px;max-width:100%;object-fit:contain;cursor:pointer;" data-name="'+H.esc(rec.name||'')+'" data-ext="'+H.esc(ext)+'" data-up="'+H.esc(up)+'" onerror="this.src=\'/images/no-image.svg\';"/><div class="mt-1"><a href="'+H.esc(up)+'" target="_blank" class="small">View</a> · <a href="'+H.esc(up)+'" download class="small">Download</a></div></div></div>';}
            if(ext){h+='<div class="'+(up?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-1"><i class="bi bi-link-45deg me-1 text-info"></i>External URL</div><img src="'+H.esc(ext)+'" class="rounded sms-vm-img" style="max-height:140px;max-width:100%;object-fit:contain;cursor:pointer;" data-name="'+H.esc(rec.name||'')+'" data-ext="'+H.esc(ext)+'" data-up="'+H.esc(up)+'" onerror="this.src=\'/images/no-image.svg\';"/><div class="mt-1"><a href="'+H.esc(ext)+'" target="_blank" class="small">Open</a></div><div class="mt-1 small text-muted text-break" style="word-break:break-all;">'+H.esc(ext)+'</div></div></div>';}
            h+='</div>';}else{h+='<div class="text-center mb-3"><img src="/images/no-image.svg" style="width:100px;opacity:.4;"/></div>';}

        /* Detail table */
        h+='<div class="border-top pt-3 mb-3">';
        h+='<table class="table table-sm mb-0" style="font-size:13px;"><tbody>';
        h+='<tr><td class="text-muted fw-medium" style="width:160px;"><i class="bi bi-car-front me-1"></i>Vehicle Type</td><td>'+(rec.vehicle_type_name ? '<span class="badge bg-blue-lt">'+H.esc(rec.vehicle_type_name)+'</span>' : '<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-calendar3 me-1"></i>Vehicle Year</td><td>'+(rec.vehicle_year_name ? '<span class="badge bg-cyan-lt">'+H.esc(rec.vehicle_year_name)+'</span>' : '<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-building me-1"></i>Vehicle Make</td><td>'+(rec.vehicle_make_name ? '<span class="badge bg-purple-lt">'+H.esc(rec.vehicle_make_name)+'</span>' : '<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-car-front-fill me-1"></i>Vehicle Model</td><td>'+(rec.vehicle_model_name ? '<span class="badge bg-teal-lt">'+H.esc(rec.vehicle_model_name)+'</span>' : '<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-lightning me-1"></i>KW (Kilowatts)</td><td>'+(rec.kw ? '<strong>'+rec.kw+'</strong> kW' : '<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-speedometer me-1"></i>HP (Horsepower)</td><td>'+(rec.hp ? '<strong>'+rec.hp+'</strong> hp' : '<span class="text-muted">—</span>')+'</td></tr>';
        h+='</tbody></table></div>';

        /* Production Period */
        h+='<div class="border-top pt-3 mb-3"><div class="fw-medium mb-2"><i class="bi bi-calendar-range me-1 text-primary"></i>Production Period</div>';
        h+='<div class="row g-2 text-center">';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">Start Year</div><strong>'+(rec.start_year||'—')+'</strong></div></div>';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">Month Initial</div><strong>'+(rec.month_initial||'—')+'</strong></div></div>';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">End Year</div><strong>'+(rec.end_year||'—')+'</strong></div></div>';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">Month Final</div><strong>'+(rec.month_final||'—')+'</strong></div></div>';
        h+='</div></div>';

        /* Translations */
        if(trans.length){h+='<div class="border-top pt-3 mb-3"><div class="fw-medium mb-2"><i class="bi bi-translate me-1 text-primary"></i>Translations</div><div class="row g-2">';trans.forEach(function(tr){h+='<div class="col-6"><div class="border rounded p-2 small">'+(tr.flag||'')+' '+tr.language_name+': <strong>'+H.esc(tr.name)+'</strong></div></div>';});h+='</div></div>';}

        /* Timestamps */
        h+='<div class="border-top pt-3"><div class="mb-1 text-muted small"><i class="bi bi-clock me-1"></i>Created: '+smsFormatDateTime(rec.created_at)+'</div><div class="text-muted small"><i class="bi bi-clock-history me-1"></i>Updated: '+smsFormatDateTime(rec.updated_at)+'</div></div>';
        h+='</div>';
        $b.html(h);
    });
}

function toggleRec(u){smsConfirm({title:'Confirm',text:'Toggle status?',onConfirm:function(){$.post(BASE_URL+'/vehicle-variants/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function delRec(u,n){smsConfirm({title:'Delete',text:'Delete <strong>'+n+'</strong>?',btnClass:'btn-danger',onConfirm:function(){$.post(BASE_URL+'/vehicle-variants/'+u+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(u,n){smsConfirm({title:'Recover',text:'Recover <strong>'+n+'</strong>?',btnClass:'btn-success',onConfirm:function(){$.post(BASE_URL+'/vehicle-variants/'+u+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function updateBulk(){var c=$('.row-chk:checked').length;_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(c);if(c>0)$('#bulkBar').removeClass('d-none');else $('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;smsConfirm({title:a,text:a+' '+_sel.length+' items?',onConfirm:function(){$.ajax({url:BASE_URL+'/vehicle-variants/bulk-action',type:'POST',contentType:'application/json',data:JSON.stringify({action:a,uuids:_sel}),success:function(r){if(r.status===200){toastr.success(r.message);$('#selectAll').prop('checked',false);_sel=[];loadData();}else toastr.error(r.message);},error:function(){toastr.error('Network error.');}});}});}

/* ── Export ── */
function doExport(fmt){
    var p=_filters();delete p.page;delete p.per_page;p.format=fmt;
    if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){
        // Step 1: POST with check=1 to see if background or inline
        showLoading();
        var checkP=$.extend({},p,{check:'1'});
        $.post(BASE_URL+'/vehicle-variants/export',checkP,function(res){
            hideLoading();
            if(!res||res.status!==200){toastr.error(res?res.message:'Failed.');return;}
            if(res.data&&res.data.mode==='background'){
                toastr.info('Export is processing in background. You will receive a notification and email when ready.');
                if(typeof smsTrackJob==='function') smsTrackJob(res.data.jobId,{onComplete:function(job){if(typeof fetchUnreadCount==='function')fetchUnreadCount();if(job.status==='completed')toastr.success('Export ready! Check notifications to download.');else toastr.error('Export failed.');}});
                return;
            }
            // Step 2: Small export → trigger actual file download via GET
            window.location.href=BASE_URL+'/vehicle-variants/export?'+$.param(p);
        }).fail(function(){hideLoading();toastr.error('Network error.');});
        return;
    }
    // Print — needs JSON rows to build HTML in browser
    showLoading();
    $.post(BASE_URL+'/vehicle-variants/export',p,function(res){
        hideLoading();
        if(!res||res.status!==200){toastr.error(res?res.message:'Failed.');return;}
        if(res.data&&res.data.mode==='background'){
            toastr.info('Export is processing in background. You will receive a notification and email when ready.');
            return;
        }
        if(!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);
        var html='<html><head><title>Vehicle Variants</title><style>body{font-family:Arial;font-size:11px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:4px 6px;}th{background:#f0f4f8;font-weight:600;}</style></head><body><h2>Vehicle Variants ('+rows.length+')</h2><table><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr>';
        rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    }).fail(function(){hideLoading();toastr.error('Failed.');});
}

/* ── Import ── */
var _pollTimer = null;
function openImport(){
    if(_pollTimer){clearInterval(_pollTimer);_pollTimer=null;}
    $('#importProcessing').addClass('d-none');
    $('#importStep1').removeClass('d-none');
    $('#importStep2').addClass('d-none');
    $('#importStep3').addClass('d-none');
    $('#frmImport')[0].reset();
    bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();
}

/* ── Progress bar for background import ── */
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
        if(!res||res.status!==200){clearInterval(_pollTimer);_pollTimer=null;toastr.error('Failed to check status.');return;}
        var d=res.data;
        $('#impProcessed').text((d.processed_rows||0).toLocaleString());
        $('#impSuccess').text((d.success_count||0).toLocaleString());
        $('#impErrors').text((d.error_count||0).toLocaleString());
        $('#impPercent').text((d.progress||0)+'%');
        $('#impProgressBar').css('width',(d.progress||0)+'%');
        if(d.status==='completed'){
            clearInterval(_pollTimer);_pollTimer=null;
            $('#impProgressBar').addClass(d.error_count>0?'bg-warning':'bg-success');
            // Refresh notification bell immediately
            if(typeof fetchUnreadCount==='function') fetchUnreadCount();
            if(d.error_count>0 && d.results && d.results.length){
                toastr.warning('Import done: '+d.success_count+' imported, '+d.error_count+' errors. Fix errors below.');
                setTimeout(function(){
                    $('#importStep3').addClass('d-none');$('#importStep2').removeClass('d-none');
                    renderImportResults(d.results);
                },800);
            } else {
                // All success — show clear message in progress area + auto close
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
    }).fail(function(){clearInterval(_pollTimer);_pollTimer=null;toastr.error('Connection lost.');});
}

function renderImportResults(results) {
    _importResults = results;
    var ok = results.filter(function(r){return r.status==='success';}).length;
    var err = results.filter(function(r){return r.status==='error';}).length;
    $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' + (err > 0 ? '<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>' : '') + '</div>');

    // All success — show clear message + auto close
    if (err === 0) {
        $('#importResultTable').html(
            '<div class="text-center py-4">' +
            '<div style="font-size:52px;margin-bottom:12px;">✅</div>' +
            '<h5 class="text-success mb-2">All ' + ok + ' rows imported successfully!</h5>' +
            '<p class="text-muted small mb-0">The list has been refreshed with new data.</p>' +
            '</div>'
        );
        $('#importErrorActions').addClass('d-none');
        loadData();
        // Refresh notification bell
        if (typeof fetchUnreadCount === 'function') fetchUnreadCount();
        // Auto close after 3 seconds
        setTimeout(function(){ try { bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide(); } catch(e){} }, 3000);
        return;
    }

    // Has errors — show only error rows with editable fields
    var h = '<table class="table table-sm table-bordered mb-0" style="font-size:11px;white-space:nowrap;"><thead class="table-light"><tr>' +
        '<th style="width:28px;">#</th>' +
        '<th style="min-width:110px;">Variant Name</th>' +
        '<th style="min-width:90px;">Type</th>' +
        '<th style="min-width:90px;">Make</th>' +
        '<th style="min-width:90px;">Model</th>' +
        '<th style="min-width:55px;">Year</th>' +
        '<th style="min-width:60px;">Start Yr</th>' +
        '<th style="min-width:48px;">M.Init</th>' +
        '<th style="min-width:60px;">End Yr</th>' +
        '<th style="min-width:48px;">M.Final</th>' +
        '<th style="min-width:50px;">KW</th>' +
        '<th style="min-width:50px;">HP</th>' +
        '<th style="min-width:90px;">Image URL</th>' +
        '<th style="min-width:110px;">Error</th>' +
        '<th style="width:48px;">Retry</th>' +
        '</tr></thead><tbody>';

    results.forEach(function(r, i) {
        if (r.status !== 'error') return; // skip success rows
        var d = r.data || {};
        var dn = r.name || d.name || d['variant name'] || d['variant_name'] || d.variant || '';
        var dt = d.vehicle_type || d['vehicle type'] || d.type || '';
        var dm = d.vehicle_make || d['vehicle make'] || d.make || '';
        var dy = d.vehicle_year || d['vehicle year'] || d.year || '';
        var dsy = d.start_year || d['start year'] || d['start_year'] || '';
        var dmi = d.month_initial || d['month initial'] || d['month_initial'] || '';
        var dey = d.end_year || d['end year'] || d['end_year'] || '';
        var dmf = d.month_final || d['month final'] || d['month_final'] || '';
        var dmo = d.vehicle_model || d['vehicle model'] || d.model || '';
        var dkw = d.kw || d.kilowatts || '';
        var dhp = d.hp || d.horsepower || '';
        var diu = d.image_url || d['image url'] || d['image_url'] || '';

        h += '<tr class="table-danger" id="impRow' + i + '">' +
            '<td>' + r.row + '</td>' +
            '<td><input type="text" class="form-control form-control-sm imp-name" value="' + H.esc(dn) + '" placeholder="Name *"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-type" value="' + H.esc(dt) + '" placeholder="Type *"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-make" value="' + H.esc(dm) + '" placeholder="Make *"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-model" value="' + H.esc(dmo) + '" placeholder="Model *"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-year" value="' + H.esc(dy) + '" placeholder="Year *" style="width:55px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-sy" value="' + H.esc(dsy) + '" placeholder="Start" style="width:60px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-mi" value="' + H.esc(dmi) + '" placeholder="M.I" style="width:48px;" min="1" max="12"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-ey" value="' + H.esc(dey) + '" placeholder="End" style="width:60px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-mf" value="' + H.esc(dmf) + '" placeholder="M.F" style="width:48px;" min="1" max="12"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-kw" value="' + H.esc(dkw) + '" placeholder="KW" style="width:50px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-hp" value="' + H.esc(dhp) + '" placeholder="HP" style="width:50px;"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-iu" value="' + H.esc(diu) + '" placeholder="URL" style="width:90px;"/></td>' +
            '<td class="small text-danger">' + H.esc(r.message || 'Error') + '</td>' +
            '<td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow(' + i + ')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';
    });
    h += '</tbody></table>';

    // Show success count summary above error table
    if (ok > 0) {
        $('#importResultTable').html('<div class="alert alert-success py-2 mb-3 small"><i class="bi bi-check-circle me-1"></i><strong>' + ok + ' rows imported successfully.</strong> Below are the ' + err + ' rows that need attention:</div>' + h);
    } else {
        $('#importResultTable').html(h);
    }
    $('#importErrorActions').removeClass('d-none');
    loadData();
    if (typeof fetchUnreadCount === 'function') fetchUnreadCount();
}

function retryImportRow(idx) {
    var r = _importResults[idx]; if (!r || r.status === 'success') return;
    var $tr = $('#impRow' + idx);
    var nm = $tr.find('.imp-name').val().trim();
    var vt = $tr.find('.imp-type').val().trim();
    var vmk = $tr.find('.imp-make').val().trim();
    var vmo = $tr.find('.imp-model').val().trim();
    var vy = $tr.find('.imp-year').val().trim();
    var kw = $tr.find('.imp-kw').val().trim();
    var hp = $tr.find('.imp-hp').val().trim();
    var sy = $tr.find('.imp-sy').val().trim();
    var mi = $tr.find('.imp-mi').val().trim();
    var ey = $tr.find('.imp-ey').val().trim();
    var mf = $tr.find('.imp-mf').val().trim();
    var iu = $tr.find('.imp-iu').val().trim();
    if (!nm) { toastr.error('Variant name is required.'); return; }
    if (!vt) { toastr.error('Vehicle type is required.'); return; }
    if (!vmk) { toastr.error('Vehicle make is required.'); return; }
    if (!vmo) { toastr.error('Vehicle model is required.'); return; }
    if (!vy) { toastr.error('Vehicle year is required.'); return; }
    var $b = $tr.find('button'); btnLoading($b);
    $.post(BASE_URL + '/vehicle-variants/import/single', {
        name: nm, vehicle_type: vt, vehicle_make: vmk, vehicle_model: vmo, vehicle_year: vy,
        month_initial: mi, month_final: mf, start_year: sy, end_year: ey, kw: kw, hp: hp, image_url: iu
    }, function(res) {
        btnReset($b);
        if (res.status === 200 || res.status === 201) {
            $tr.removeClass('table-danger').addClass('table-success');
            $tr.find('input').prop('disabled', true).addClass('bg-light');
            $tr.find('td:eq(13)').html('<span class="text-success small"><i class="bi bi-check-circle me-1"></i>OK</span>');
            $tr.find('td:eq(14)').html('\u2014');
            r.status = 'success';
            toastr.success('"' + nm + '" imported.');
            loadData();
            // Check if all errors are now fixed
            var remaining = _importResults.filter(function(x){return x.status==='error';}).length;
            if (remaining === 0) {
                $('#importSummary').html('<div class="alert alert-success py-2 mb-0"><i class="bi bi-check-circle me-1"></i><strong>All rows imported successfully!</strong></div>');
                $('#importErrorActions').addClass('d-none');
                setTimeout(function(){ try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){} },2000);
            } else {
                var ok = _importResults.filter(function(x){return x.status==='success';}).length;
                $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span><span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + remaining + ' errors</span></div>');
            }
        } else { toastr.error(res.message || 'Failed.'); }
    }).fail(function() { btnReset($b); toastr.error('Error.'); });
}
function retryAllErrors() { _importResults.forEach(function(r, i) { if (r.status === 'error') retryImportRow(i); }); }

/* ── Init ── */
$(function(){
    smsInitPerPage('#perPageSel'); _pp = parseInt($('#perPageSel').val()) || 15;

    $('#filterVehicleYear').select2({ placeholder: 'Select years...', allowClear: true, multiple: true, width: '100%', dropdownParent: $('#filterSidebar'),
        ajax: { url: BASE_URL + '/vehicle-years/autocomplete', dataType: 'json', delay: 300,
            data: function(p) { var d = { search: p.term || '', limit: 50 }; var co = $('#filterCompany').val(); if (co && co !== 'all') d.company_id = co; return d; },
            processResults: function(r) { return { results: (r.data||[]).map(function(x){return {id:x.id,text:x.name};}) }; }, cache: true
        }, minimumInputLength: 0
    });

    $('#filterVehicleType').select2({ placeholder: 'Select types...', allowClear: true, multiple: true, width: '100%', dropdownParent: $('#filterSidebar'),
        ajax: { url: BASE_URL + '/vehicle-types/autocomplete', dataType: 'json', delay: 300,
            data: function(p) { var d = { search: p.term || '', limit: 50 }; var co = $('#filterCompany').val(); if (co && co !== 'all') d.company_id = co; return d; },
            processResults: function(r) { return { results: (r.data||[]).map(function(x){return {id:x.id,text:x.name};}) }; }, cache: true
        }, minimumInputLength: 0
    });

    function fmtMakeDd(item) {
        if (!item.id) return item.text;
        var lbl = item.text;
        if (item.vehicle_type_name) lbl += ' <span class="text-muted" style="font-size:11px;">(' + item.vehicle_type_name + ')</span>';
        return $('<span>' + lbl + '</span>');
    }
    $('#filterVehicleModel').select2({
        theme:'bootstrap-5',allowClear:true,placeholder:'All Models',
        ajax:{url:BASE_URL+'/vehicle-models/autocomplete',dataType:'json',delay:250,
            data:function(p){var d={search:p.term||''};
                var tids=$('#filterVehicleType').val();if(tids&&tids.length)d.vehicle_type_ids=tids.join(',');
                var mids=$('#filterVehicleMake').val();if(mids&&mids.length)d.vehicle_make_ids=mids.join(',');
                return d;},
            processResults:function(r){return{results:(r.data||[]).map(function(x){return{id:x.id,text:x.name};})};},cache:true},
        minimumInputLength:0
    }).on('change',function(){_page=1;loadData();});

    $('#filterVehicleMake').select2({ placeholder: 'Select makes...', allowClear: true, multiple: true, width: '100%', dropdownParent: $('#filterSidebar'),
        templateResult: fmtMakeDd,
        ajax: { url: BASE_URL + '/vehicle-makes/autocomplete', dataType: 'json', delay: 300,
            data: function(p) {
                var d = { search: p.term || '', limit: 50 };
                var co = $('#filterCompany').val(); if (co && co !== 'all') d.company_id = co;
                var tids = $('#filterVehicleType').val();
                if (tids && tids.length) d.vehicle_type_ids = tids.join(',');
                return d;
            },
            processResults: function(r) { return { results: (r.data||[]).map(function(x){return {id:x.id, text:x.name, vehicle_type_name: x.vehicle_type_name||''};}) }; }, cache: true
        }, minimumInputLength: 0
    });

    $('#filterCompany').on('change', function() { $('#filterVehicleYear,#filterVehicleType,#filterVehicleMake').val(null).trigger('change'); });
    $('#filterVehicleType').on('change', function() { $('#filterVehicleMake').val(null).trigger('change'); });

    $('#btnApplyFilters').on('click', function() { bootstrap.Offcanvas.getOrCreateInstance($('#filterSidebar')[0]).hide(); applyFilters(); });
    $('#btnClearFilters').on('click', function() {
        if($('#filterCompany').length)$('#filterCompany').val('all');
        $('#filterVehicleYear,#filterVehicleType,#filterVehicleMake').val(null).trigger('change');
        $('#filterStatus').val(''); $('#filterDeleted').val('');
        $('#filterDateFrom,#filterDateTo').val('');
        $('#filterStartYearFrom,#filterStartYearTo,#filterEndYearFrom,#filterEndYearTo').val('');
        $('#filterMonthInitial,#filterMonthFinal').val('');
        applyFilters();
    });

    var _st; $('#searchInput').on('keyup', function() { clearTimeout(_st); _st = setTimeout(function() { _page = 1; loadData(); }, 400); });
    $('#perPageSel').on('change', function() { _pp = ($(this).val() === 'all') ? 99999 : (parseInt($(this).val()) || 15); _page = 1; loadData(); });

    $(document).on('click', 'th.sortable', function() { var f = $(this).data('field'); if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc'; else { _sort.field = f; _sort.dir = 'asc'; } _page = 1; loadData(); });
    $(document).on('click', '.sms-pg', function(e) { e.preventDefault(); var p = parseInt($(this).data('p')); if (p > 0 && p !== _page) { _page = p; loadData(); } });
    $(document).on('change', '#selectAll', function() { $('.row-chk').prop('checked', $(this).is(':checked')); updateBulk(); });
    $(document).on('change', '.row-chk', updateBulk);
    $('#btnClearBulk').on('click', function() { $('#selectAll,.row-chk').prop('checked', false); updateBulk(); });

    /* ── Image click (same as part-types) ── */
    $(document).on('click','.sms-vm-img',function(e){e.stopPropagation();showBothImages($(this));});

    $('#frmImport').on('submit', function(e) { e.preventDefault(); var fd = new FormData(this), $b = $('#btnImport'); btnLoading($b);
        // Show processing spinner
        $('#importStep1').addClass('d-none');
        $('#importStep2').addClass('d-none');
        $('#importStep3').addClass('d-none');
        $('#importProcessing').removeClass('d-none');
        $.ajax({ url: BASE_URL + '/vehicle-variants/import', type: 'POST', data: fd, processData: false, contentType: false,
            success: function(r) {
                btnReset($b);
                $('#importProcessing').addClass('d-none');
                if (r.status === 200 && r.data) {
                    if (r.data.jobId) {
                        // Background mode — show progress bar
                        showImportProgress(r.data.jobId, r.data.total);
                    } else if (r.data.results) {
                        // Sync mode — show results directly
                        $('#importStep2').removeClass('d-none');
                        renderImportResults(r.data.results);
                    } else {
                        toastr.error('Unexpected response.');
                        $('#importStep1').removeClass('d-none');
                    }
                } else {
                    toastr.error(r.message || 'Failed.');
                    $('#importStep1').removeClass('d-none');
                }
            },
            error: function() { btnReset($b); $('#importProcessing').addClass('d-none'); $('#importStep1').removeClass('d-none'); toastr.error('Network error.'); }
        });
    });
    $('#btnRetryAllErrors').on('click', retryAllErrors);

    updateFilterChips(); loadData();
});