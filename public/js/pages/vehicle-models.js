/* vehicle-models.js — v5 full rewrite */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};
function _filters(){return{page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),company_id:$('#filterCompany').length?$('#filterCompany').val():'',sort_field:_sort.field,sort_dir:_sort.dir};}

function ptImg(r){var s=r.display_image_url||'',ok=s&&s.indexOf('no-image')===-1;return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-pt-img" data-name="'+H.esc(r.name||'')+'" data-ext="'+H.esc(r.image_full_url||'')+'" data-up="'+H.esc(r.uploaded_image_url||'')+'"><img src="'+H.esc(ok?s:'/images/no-image.svg')+'" class="rounded border" style="width:40px;height:40px;object-fit:cover;'+(ok?'cursor:pointer;':'opacity:.5;')+'" onerror="this.src=\'/images/no-image.svg\';this.style.opacity=\'.5\';"/></button>';}

function showBothImages($el){var n=$el.data('name')||'',ext=$el.data('ext')||'',up=$el.data('up')||'';if(!ext&&!up)return;
    $('#imgModalTitle').html('<i class="bi bi-image me-2 text-primary"></i>'+H.esc(n||T('vehicle_models.image_both_title','Images')));
    var h='<div class="row g-3">';
    if(up){h+='<div class="'+(ext?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-2"><i class="bi bi-cloud-upload me-1 text-success"></i><strong>'+T('vehicle_models.image_uploaded','Uploaded')+'</strong></div><img src="'+H.esc(up)+'" class="rounded" style="max-width:100%;max-height:260px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>'+T('general.no_image','No image')+'</div>\'"/><div class="mt-2"><a href="'+H.esc(up)+'" target="_blank" class="btn btn-sm btn-outline-primary" download><i class="bi bi-download me-1"></i>'+T('general.download','Download')+'</a></div></div></div>';}
    if(ext){h+='<div class="'+(up?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-2"><i class="bi bi-link-45deg me-1 text-info"></i><strong>'+T('general.external_url','External URL')+'</strong></div><img src="'+H.esc(ext)+'" class="rounded" style="max-width:100%;max-height:260px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>'+T('general.no_image','No image')+'</div>\'"/><div class="mt-2"><a href="'+H.esc(ext)+'" target="_blank" class="btn btn-sm btn-outline-info"><i class="bi bi-box-arrow-up-right me-1"></i>'+T('general.open_file','Open')+'</a></div><div class="mt-1 small text-muted text-break" style="word-break:break-all;">'+H.esc(ext)+'</div></div></div>';}
    h+='</div>';$('#imgModalBody').html(h);bootstrap.Modal.getOrCreateInstance($('#modalImage')[0]).show();}

function loadData(){
    $('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading…')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
// Show/hide bulk recover button
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/vehicle-models/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">'+T('general.failed_load','Failed.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-gear-wide-connected d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('vehicle_models.no_data','No data')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
            var isGlobal=!!r.is_global;
            var globalBadge=isGlobal?' <span class="badge bg-azure-lt" style="font-size:9px;">Global</span>':'';
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            var acts='<div class="btn-group btn-group-sm">';
            acts+='<button class="btn btn-ghost-primary" onclick="viewPT(\''+r.uuid+'\')" title="'+T('general.preview','View')+'"><i class="bi bi-eye"></i></button>';
            if(deleted){
                acts+='<button class="btn btn-ghost-success" onclick="recoverPT(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\')" title="Recover"><i class="bi bi-arrow-counterclockwise"></i></button>';
            }else{
                if(editable)acts+='<a href="'+BASE_URL+'/vehicle-models/'+r.uuid+'/edit" class="btn btn-ghost-secondary" title="'+T('btn.edit','Edit')+'"><i class="bi bi-pencil"></i></a>';
                if(editable)acts+='<button class="btn btn-ghost-'+(parseInt(r.status)?'warning':'success')+'" onclick="togglePT(\''+r.uuid+'\')"><i class="bi bi-toggle-'+(parseInt(r.status)?'on':'off')+'"></i></button>';
                if(deletable)acts+='<button class="btn btn-ghost-danger" onclick="delPT(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\')"><i class="bi bi-trash3"></i></button>';
            }
            acts+='</div>';
            var rowClass=deleted?' class="table-secondary"':(isGlobal?' class="table-light"':'');
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td><td>'+ptImg(r)+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span>'+globalBadge+'</td><td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing')+' '+(pg.from||1)+'–'+(pg.to||data.length)+' '+T('general.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="7" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">…</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewPT(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/vehicle-models/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var pt=res.data.part_type||{},langs=res.data.languages||[],trans=pt.translations||[];
        var up=pt.uploaded_image_url||'',ext=pt.image_full_url||'';
        var h='<div class="p-4"><div class="text-center mb-4"><h4 class="mb-1">'+H.esc(pt.name||'')+'</h4>';
        h+='<div>'+(parseInt(pt.status)?'<span class="badge bg-success-lt">'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
        if(pt.is_global)h+=' <span class="badge bg-azure-lt">Global</span>';
        h+='</div>';
        if(pt.company_name)h+='<div class="text-muted small mt-1"><i class="bi bi-building me-1"></i>'+H.esc(pt.company_name)+'</div>';
        h+='</div>';
        /* Both images */
        if(up||ext){h+='<div class="row g-2 mb-3">';
            if(up){h+='<div class="'+(ext?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-1"><i class="bi bi-cloud-upload me-1 text-success"></i>'+T('vehicle_models.image_uploaded','Uploaded')+'</div><img src="'+H.esc(up)+'" class="rounded sms-pt-img" style="max-height:140px;max-width:100%;object-fit:contain;cursor:pointer;" data-name="'+H.esc(pt.name||'')+'" data-ext="'+H.esc(ext)+'" data-up="'+H.esc(up)+'" onerror="this.src=\'/images/no-image.svg\';"/><div class="mt-1"><a href="'+H.esc(up)+'" target="_blank" class="small">'+T('general.view_file','View')+'</a> · <a href="'+H.esc(up)+'" download class="small">'+T('general.download','Download')+'</a></div></div></div>';}
            if(ext){h+='<div class="'+(up?'col-6':'col-12')+'"><div class="border rounded p-2 text-center"><div class="text-muted small mb-1"><i class="bi bi-link-45deg me-1 text-info"></i>'+T('general.external_url','External URL')+'</div><img src="'+H.esc(ext)+'" class="rounded sms-pt-img" style="max-height:140px;max-width:100%;object-fit:contain;cursor:pointer;" data-name="'+H.esc(pt.name||'')+'" data-ext="'+H.esc(ext)+'" data-up="'+H.esc(up)+'" onerror="this.src=\'/images/no-image.svg\';"/><div class="mt-1"><a href="'+H.esc(ext)+'" target="_blank" class="small">'+T('general.open_file','Open')+'</a></div><div class="mt-1 small text-muted text-break" style="word-break:break-all;">'+H.esc(ext)+'</div></div></div>';}
            h+='</div>';}else{h+='<div class="text-center mb-3"><img src="/images/no-image.svg" style="width:100px;opacity:.4;"/></div>';}
        h+='<div class="border-top pt-3 mb-3">';
        h+='<div class="mb-2"><span class="text-muted small">'+T('general.created_at','Created')+':</span> '+smsFormatDateTime(pt.created_at)+'</div>';
        h+='<div class="mb-2"><span class="text-muted small">'+T('general.updated','Updated')+':</span> '+smsFormatDateTime(pt.updated_at)+'</div>';
        h+='</div>';
        if(langs.length>0){var tM={};trans.forEach(function(t){tM[t.language_id]=t.name;});h+='<div class="border-top pt-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-translate me-1 text-primary"></i>'+T('vehicle_models.translations','Translations')+'</h6><div class="row g-2">';langs.forEach(function(l){var v=tM[l.id]?H.esc(tM[l.id]):'<span class="text-muted fst-italic">—</span>';h+='<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">'+(l.flag?l.flag+' ':'')+H.esc(l.name)+'</div><div class="fw-medium" style="font-size:13px;">'+v+'</div></div></div>';});h+='</div></div>';}
        h+='</div>';$b.html(h);}).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Error.')+'</div>');});}

/* Actions */
function togglePT(u){$.post(BASE_URL+'/vehicle-models/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delPT(u,n){smsConfirm({icon:'🗑️',title:T('vehicle_models.delete','Delete'),msg:T('general.are_you_sure','Sure?')+' <strong>'+H.esc(n)+'</strong>',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-models/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function recoverPT(u,n){smsConfirm({icon:'♻️',title:'Recover',msg:'Recover <strong>'+H.esc(n)+'</strong> and its translations?',btnClass:'btn-success',btnText:'Recover',onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-models/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;smsConfirm({icon:'⚡',title:a,msg:_sel.length+' '+T('vehicle_models.bulk_affected','items.'),btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a,onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-models/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* Export */
function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'){window.location.href=BASE_URL+'/vehicle-models/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/vehicle-models/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Part Brands</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Part Brands ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error('Failed.');});}
function openImport(){$('#importStep1').show();$('#importStep2').addClass('d-none');$('#frmImport')[0].reset();bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();}

var _importResults = []; // store import results for retry

function renderImportResults(results) {
    _importResults = results;
    var ok = results.filter(function(r){return r.status==='success';}).length;
    var err = results.filter(function(r){return r.status==='error';}).length;

    $('#importSummary').html(
        '<div class="d-flex gap-2">' +
        '<span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' +
        '<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>' +
        '</div>'
    );

    if (err === 0) {
        $('#importResultTable').html('<div class="alert alert-success py-2 small">All rows imported successfully!</div>');
        $('#importErrorActions').addClass('d-none');
        loadData();
        setTimeout(function(){ bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide(); }, 1500);
        return;
    }

    var h = '<table class="table table-sm table-bordered mb-0"><thead><tr><th style="width:30px;">#</th><th>Part Name</th><th style="width:80px;">Status</th><th>Error</th><th style="width:110px;">Action</th></tr></thead><tbody>';
    results.forEach(function(r, i) {
        if (r.status === 'success') {
            h += '<tr class="table-success" id="impRow' + i + '"><td>' + r.row + '</td><td>' + H.esc(r.name) + '</td><td><span class="badge bg-success-lt"><i class="bi bi-check"></i> OK</span></td><td>—</td><td>—</td></tr>';
        } else {
            h += '<tr class="table-danger" id="impRow' + i + '" data-idx="' + i + '">' +
                '<td>' + r.row + '</td>' +
                '<td><input type="text" class="form-control form-control-sm imp-name" value="' + H.esc(r.name) + '" data-idx="' + i + '"/></td>' +
                '<td><span class="badge bg-danger-lt"><i class="bi bi-x"></i></span></td>' +
                '<td class="small text-danger">' + H.esc(r.message || 'Error') + '</td>' +
                '<td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow(' + i + ')"><i class="bi bi-arrow-repeat me-1"></i>Retry</button></td>' +
                '</tr>';
        }
    });
    h += '</tbody></table>';
    $('#importResultTable').html(h);
    $('#importErrorActions').removeClass('d-none');
    loadData();
}

function retryImportRow(idx) {
    var r = _importResults[idx];
    if (!r || r.status === 'success') return;
    var newName = $('#impRow' + idx + ' .imp-name').val().trim();
    if (!newName) { toastr.error('Part name is required.'); return; }

    var $tr = $('#impRow' + idx);
    $tr.find('button').prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

    $.post(BASE_URL + '/vehicle-models/import/single', { name: newName, image_url: (r.data && r.data['image url']) || '' }, function(res) {
        if (res.status === 200 || res.status === 201) {
            _importResults[idx].status = 'success';
            _importResults[idx].name = newName;
            $tr.removeClass('table-danger').addClass('table-success');
            $tr.html('<td>' + r.row + '</td><td>' + H.esc(newName) + '</td><td><span class="badge bg-success-lt"><i class="bi bi-check"></i> OK</span></td><td>—</td><td>—</td>');
            toastr.success('"' + newName + '" imported.');
            // Check if all done
            var remaining = _importResults.filter(function(x){return x.status==='error';}).length;
            if (remaining === 0) {
                $('#importSummary').html('<div class="alert alert-success py-2 small">All rows imported!</div>');
                $('#importErrorActions').addClass('d-none');
                loadData();
                setTimeout(function(){ bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide(); }, 1500);
            } else {
                renderImportSummary();
            }
        } else {
            $tr.find('button').prop('disabled', false).html('<i class="bi bi-arrow-repeat me-1"></i>Retry');
            $tr.find('.text-danger').last().text(res.message || 'Failed.');
            toastr.error(res.message || 'Failed.');
        }
    }).fail(function() {
        $tr.find('button').prop('disabled', false).html('<i class="bi bi-arrow-repeat me-1"></i>Retry');
        toastr.error(T('general.network_error','Error.'));
    });
}

function renderImportSummary() {
    var ok = _importResults.filter(function(r){return r.status==='success';}).length;
    var err = _importResults.filter(function(r){return r.status==='error';}).length;
    $('#importSummary').html('<div class="d-flex gap-2"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span><span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span></div>');
}

function retryAllErrors() {
    var pending = [];
    _importResults.forEach(function(r, i) { if (r.status === 'error') pending.push(i); });
    if (!pending.length) return;
    var idx = 0;
    function next() {
        if (idx >= pending.length) { renderImportSummary(); return; }
        retryImportRow(pending[idx]);
        idx++;
        setTimeout(next, 500);
    }
    next();
}

/* Init */
$(function(){
    _pp=smsInitPerPage('#perPageSel');loadData();
    $(document).on('click','.sms-pt-img',function(e){e.stopPropagation();showBothImages($(this));});
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterStatus,#filterDeleted,#filterCompany',function(){_page=1;loadData();});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();});
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this),$b=$('#btnImport');btnLoading($b);$.ajax({url:BASE_URL+'/vehicle-models/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){btnReset($b);if(r.status===200&&r.data&&r.data.results){$('#importStep1').hide();$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}else{toastr.error(r.message||'Failed.');}},error:function(){btnReset($b);toastr.error(T('general.network_error','Error.'));}});});
    $('#btnRetryAllErrors').on('click',function(){retryAllErrors();});
});
