/* part-catalogs.js — index page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};
function _filters(){
    var f={page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),sort_field:_sort.field,sort_dir:_sort.dir};
    if($('#filterCompany').length)f.company_id=$('#filterCompany').val();
    if($('#filterPartType').val())f.part_type_id=$('#filterPartType').val();
    if($('#filterPartLocation').val())f.part_location_id=$('#filterPartLocation').val();
    if($('#filterPartGroup').val())f.part_group_id=$('#filterPartGroup').val();
    if($('#filterPartSide').val())f.part_side_id=$('#filterPartSide').val();
    if($('#filterVehicleType').val())f.vehicle_type_id=$('#filterVehicleType').val();
    if($('#filterMasterPart').val()!=='')f.is_master_part=$('#filterMasterPart').val();
    if($('#filterBodyCar').val()!=='')f.depends_body_car=$('#filterBodyCar').val();
    if($('#filterIndividual').val()!=='')f.is_individual=$('#filterIndividual').val();
    return f;
}

function pcImg(r){var s=r.first_gallery_image||r.display_image_url||'',ok=s&&s.indexOf('no-image')===-1;return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-pc-img" data-uuid="'+H.esc(r.uuid||'')+'" data-name="'+H.esc(r.name||'')+'"><img src="'+H.esc(ok?s:'/images/no-image.svg')+'" class="rounded border" style="width:40px;height:40px;object-fit:cover;'+(ok?'cursor:pointer;':'opacity:.5;')+'" onerror="this.src=\'/images/no-image.svg\';this.style.opacity=\'.5\';"/></button>';}

function showAllImages($el){
    var uuid=$el.data('uuid')||'',n=$el.data('name')||'';
    if(!uuid)return;
    $('#imgModalTitle').html('<i class="bi bi-images me-2 text-primary"></i>'+H.esc(n||T('part_catalogs.image_both_title','Images')));
    $('#imgModalBody').html('<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalImage')[0]).show();
    $.get(BASE_URL+'/part-catalogs/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$('#imgModalBody').html('<div class="text-muted text-center py-3">Failed to load.</div>');return;}
        var pc=res.data.part_catalog||res.data||{};
        var images=res.data.images||pc.images||[];var up=pc.uploaded_image_url||'';var ext=pc.image_full_url||'';
        if(!images.length&&!up&&!ext){$('#imgModalBody').html('<div class="text-muted text-center py-3">'+T('general.no_image','No images')+'</div>');return;}
        var h='';
        if(images.length){
            h+='<div class="row g-2">';
            images.forEach(function(img){
                var imgUrl=img.display_url||img.image_url||img.url||'';
                h+='<div class="col-4 col-sm-3"><div class="border rounded p-1 text-center">'+
                    '<a href="'+H.esc(imgUrl)+'" target="_blank"><img src="'+H.esc(imgUrl)+'" class="rounded" style="width:100%;height:80px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/></a>'+
                    '</div></div>';
            });
            h+='</div>';
        }
        if(ext){
            h+='<div class="border-top mt-3 pt-3"><div class="text-muted small mb-2"><i class="bi bi-link-45deg me-1 text-info"></i>'+T('general.external_url','External URL')+'</div>'+
                '<div class="text-center"><img src="'+H.esc(ext)+'" class="rounded" style="max-width:100%;max-height:200px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/></div>'+
                '<div class="mt-1 small text-muted text-break text-center" style="word-break:break-all;">'+H.esc(ext)+'</div></div>';
        }
        $('#imgModalBody').html(h);
    });
}

function loadData(){
    $('#tableBody').html('<tr><td colspan="13" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/part-catalogs/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="13" class="text-center py-4 text-danger">'+T('general.failed_load','Failed.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="13" class="text-center py-5 text-muted"><i class="bi bi-journal-bookmark d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('part_catalogs.no_data','No part catalogs found')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':((r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
            var isGlobal=!!r.is_global;
            var globalBadge=isGlobal?' <span class="badge bg-azure-lt" style="font-size:9px;">Global</span>':'';
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            var isMaster=(r.is_master_part===true||r.is_master_part===1||r.is_master_part==='1'||r._has_override&&r.is_master_part);
            var masterBadge=isMaster?'<span class="badge bg-purple-lt"><i class="bi bi-star-fill me-1" style="font-size:9px;"></i>Yes</span>':'<span class="text-muted small">No</span>';

            var isActive=(r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1);
            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end" style="min-width:160px;">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewPC(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>'+T('general.preview','View')+'</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverPC(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>'+T('bulk.recover','Recover')+'</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/part-catalogs/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>'+T('btn.edit','Edit')+'</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="togglePC(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(isActive?'on':'off')+' me-2 text-'+(isActive?'warning':'success')+'"></i>'+(isActive?T('general.deactivate','Deactivate'):T('general.activate','Activate'))+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>'+T('usage.title','Usage')+'</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"/></li>';acts+='<li><a class="dropdown-item text-danger" href="#" onclick="delPC(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>'+T('btn.delete','Delete')+'</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':'';
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td><td>'+pcImg(r)+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span></td>'+
                '<td class="d-none d-lg-table-cell small">'+H.esc(r.part_type_name||'—')+'</td>'+
                '<td class="d-none d-lg-table-cell small">'+H.esc(r.part_location_name||'—')+'</td>'+
                '<td class="d-none d-xl-table-cell small">'+H.esc(r.part_group_name||'—')+'</td>'+
                '<td class="d-none d-xl-table-cell small">'+H.esc(r.part_side_name||'—')+'</td>'+
                '<td class="d-none d-xl-table-cell small">'+(r.vehicle_percentage ? '<span class="badge bg-purple-lt">'+parseFloat(r.vehicle_percentage).toFixed(2)+'%</span>' : '<span class="text-muted">0%</span>')+'</td>'+
                '<td>'+masterBadge+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing')+' '+(pg.from||1)+'–'+(pg.to||data.length)+' '+T('general.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="13" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewPC(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/part-catalogs/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var pc=res.data.part_catalog||res.data||{},langs=res.data.languages||[],trans=pc.translations||[];
        var up=pc.uploaded_image_url||'',ext=pc.image_full_url||'';
        var images=res.data.images||pc.images||[];
        var assignedParts=res.data.assigned_parts||pc.assigned_parts||[];
        var h='<div class="p-4"><div class="text-center mb-4"><h4 class="mb-1">'+H.esc(pc.name||'')+'</h4>';
        h+='<div>'+((pc.status===true||pc.status===1||pc.status==='1'||parseInt(pc.status)===1)?'<span class="badge bg-success-lt">'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
        if(parseInt(pc.is_master_part))h+=' <span class="badge bg-info-lt">'+T('part_catalogs.is_master_part','Master Part')+'</span>';
        h+='</div></div>';

        /* Gallery images */
        if(images.length){
            h+='<div class="mb-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-images me-1 text-primary"></i>'+T('part_catalogs.images','Images')+' ('+images.length+')</h6><div class="row g-2">';
            images.forEach(function(img){
                var imgUrl=img.display_url||img.url||img.image_url||'';
                h+='<div class="col-3"><div class="border rounded p-1 text-center"><a href="'+H.esc(imgUrl)+'" target="_blank"><img src="'+H.esc(imgUrl)+'" class="rounded" style="width:100%;height:70px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/></a></div></div>';
            });
            h+='</div></div>';
        } else if(!ext) {
            h+='<div class="text-center mb-3"><img src="/images/no-image.svg" style="width:80px;opacity:.4;"/></div>';
        }
        if(ext){
            h+='<div class="'+(images.length?'border-top pt-3 ':'')+'mb-3"><div class="text-muted small mb-1"><i class="bi bi-link-45deg me-1 text-info"></i>'+T('general.external_url','External URL')+'</div>'+
                '<div class="text-center"><img src="'+H.esc(ext)+'" class="rounded" style="max-height:120px;max-width:100%;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/></div>'+
                '<div class="mt-1 small text-muted text-break text-center" style="word-break:break-all;">'+H.esc(ext)+'</div></div>';
        }

        /* Details */
        h+='<div class="border-top pt-3 mb-3">';
        var details=[
            {label:T('part_catalogs.part_type','Part Type'), val:pc.part_type_name||''},
            {label:T('part_catalogs.part_location','Part Location'), val:pc.part_location_name||''},
            {label:T('part_catalogs.part_group','Part Group'), val:pc.part_group_name||''},
            {label:T('part_catalogs.part_side','Part Side'), val:pc.part_side_name||''},
            {label:T('part_catalogs.vehicle_type','Vehicle Type'), val:pc.vehicle_type_name||''},
            {label:T('part_catalogs.num_car_doors','Car Doors'), val:pc.number_of_car_doors||''},
            {label:T('part_catalogs.height','Height'), val:pc.height||''},
            {label:T('part_catalogs.weight','Weight'), val:pc.weight||''},
            {label:T('part_catalogs.length','Length'), val:pc.length||''},
            {label:T('part_catalogs.width','Width'), val:pc.width||''},
            {label:T('part_catalogs.depends_body_car','Depends Body Car'), val:parseInt(pc.depends_body_car)?'Yes':'No'},
            {label:T('part_catalogs.individual','Individual'), val:parseInt(pc.individual)?'Yes':'No'}
        ];
        h+='<div class="row g-2">';
        details.forEach(function(d){
            if(d.val){h+='<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">'+H.esc(d.label)+'</div><div class="fw-medium" style="font-size:13px;">'+H.esc(String(d.val))+'</div></div></div>';}
        });
        h+='</div></div>';

        /* Assigned parts */
        if(assignedParts.length){
            h+='<div class="border-top pt-3 mb-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-diagram-2 me-1 text-primary"></i>'+T('part_catalogs.assigned_parts','Assigned Sub-Parts')+' ('+assignedParts.length+')</h6><div class="d-flex flex-wrap gap-2">';
            assignedParts.forEach(function(p){h+='<span class="badge bg-azure-lt px-2 py-2" style="font-size:12px;cursor:pointer;" onclick="viewPC(\''+H.esc(p.uuid||'')+'\')" title="Click to view details">'+H.esc(p.name||'')+'</span>';});
            h+='</div></div>';
        }

        h+='<div class="border-top pt-3 mb-3">';
        h+='<div class="mb-2"><span class="text-muted small">'+T('general.created_at','Created')+':</span> '+smsFormatDateTime(pc.created_at)+'</div>';
        h+='<div class="mb-2"><span class="text-muted small">'+T('general.updated','Updated')+':</span> '+smsFormatDateTime(pc.updated_at)+'</div>';
        h+='</div>';

        /* Translations */
        if(langs.length>0){var tM={};trans.forEach(function(t){tM[t.language_id]=t.name;});h+='<div class="border-top pt-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-translate me-1 text-primary"></i>'+T('part_catalogs.translations','Translations')+'</h6><div class="row g-2">';langs.forEach(function(l){var v=tM[l.id]?H.esc(tM[l.id]):'<span class="text-muted fst-italic">—</span>';h+='<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">'+(l.flag?l.flag+' ':'')+H.esc(l.name)+'</div><div class="fw-medium" style="font-size:13px;">'+v+'</div></div></div>';});h+='</div></div>';}
        h+='</div>';$b.html(h);}).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Error.')+'</div>');});}

/* Usage modal */
function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title', 'Usage') + ': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/part-catalogs/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + T('general.failed_load', 'Failed.') + '</div>'); return; }
        smsRenderUsageBody(res.data, 'part-catalogs', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">' + T('general.network_error', 'Network error.') + '</div>'); });
}

/* Actions */
function togglePC(u){$.post(BASE_URL+'/part-catalogs/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delPC(u,n){smsConfirm({icon:'🗑️',title:T('part_catalogs.delete','Delete'),msg:T('general.are_you_sure','Sure?')+' <strong>'+H.esc(n)+'</strong>',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){showLoading();$.post(BASE_URL+'/part-catalogs/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function recoverPC(u,n){smsConfirm({icon:'♻️',title:T('bulk.recover','Recover'),msg:T('bulk.recover','Recover')+' <strong>'+H.esc(n)+'</strong> and its translations?',btnClass:'btn-success',btnText:T('bulk.recover','Recover'),onConfirm:function(){showLoading();$.post(BASE_URL+'/part-catalogs/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;var icons={delete:'🗑️',activate:'✅',deactivate:'⛔',recover:'♻️'};smsConfirm({icon:icons[a]||'⚠️',title:a.charAt(0).toUpperCase()+a.slice(1),msg:_sel.length+' '+T('part_catalogs.bulk_affected','items.'),btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a.charAt(0).toUpperCase()+a.slice(1),onConfirm:function(){showLoading();$.post(BASE_URL+'/part-catalogs/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* Bulk Percentage */
var _pctParts = {}; // {id: {name, pct}}
function openBulkPercentage(){
    _pctParts = {};
    $('#bulkPctValue').val('');
    $('#pctPartSearch').val('');
    $('#pctSearchDropdown').hide();
    _renderPctParts();
    bootstrap.Modal.getOrCreateInstance($('#modalBulkPct')[0]).show();
    setTimeout(function(){$('#pctPartSearch').focus();},300);
}
function _renderPctParts(){
    var keys=Object.keys(_pctParts);
    $('#pctSelectedCount').text(keys.length);
    if(!keys.length){$('#pctSelectedParts').html('<tr id="pctEmptyMsg"><td colspan="3" class="text-muted text-center py-3">Search and add parts above</td></tr>');return;}
    var h='';
    keys.forEach(function(id){
        var p=_pctParts[id];
        h+='<tr data-id="'+id+'"><td>'+H.esc(p.name)+'</td><td class="text-center"><span class="badge bg-purple-lt">'+(p.pct||0)+'%</span></td><td class="text-center"><button class="btn btn-sm btn-ghost-danger p-0 pct-remove" data-id="'+id+'" style="width:22px;height:22px;"><i class="bi bi-x-lg" style="font-size:10px;"></i></button></td></tr>';
    });
    $('#pctSelectedParts').html(h);
}
$(document).on('click','.pct-remove',function(){delete _pctParts[$(this).data('id')];_renderPctParts();});

/* Export */
function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/part-catalogs/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/part-catalogs/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Part Catalogs</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Part Catalogs ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});}

/* ── Import ── */
var _pollTimer = null;
var _importResults = [];
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
                toastr.warning(T('import.done','Import done:')+' '+d.success_count+' imported, '+d.error_count+' errors. Fix errors below.');
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
            toastr.error(T('import.failed','Import failed:')+' '+(d.error_message||'Unknown error'));
            if(typeof fetchUnreadCount==='function') fetchUnreadCount();
        }
    }).fail(function(){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('general.connection_lost','Connection lost.'));});
}

function renderImportResults(results) {
    _importResults = results;
    var ok = results.filter(function(r){return r.status==='success';}).length;
    var err = results.filter(function(r){return r.status==='error';}).length;
    $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' + (err > 0 ? '<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>' : '') + '</div>');

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
        if (typeof fetchUnreadCount === 'function') fetchUnreadCount();
        setTimeout(function(){ try { bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide(); } catch(e){} }, 3000);
        return;
    }

    var h = '<table class="table table-sm table-bordered mb-0" style="font-size:11px;white-space:nowrap;"><thead class="table-light"><tr>' +
        '<th style="width:28px;">#</th>' +
        '<th style="min-width:100px;">Name</th>' +
        '<th style="min-width:75px;">Part Type</th>' +
        '<th style="min-width:75px;">Location</th>' +
        '<th style="min-width:70px;">Group</th>' +
        '<th style="min-width:65px;">Side</th>' +
        '<th style="min-width:70px;">V.Type</th>' +
        '<th style="min-width:45px;">Doors</th>' +
        '<th style="min-width:50px;">Height</th>' +
        '<th style="min-width:50px;">Weight</th>' +
        '<th style="min-width:50px;">Length</th>' +
        '<th style="min-width:50px;">Width</th>' +
        '<th style="min-width:70px;">Image URL</th>' +
        '<th style="min-width:100px;">Error</th>' +
        '<th style="width:44px;">Retry</th>' +
        '</tr></thead><tbody>';

    results.forEach(function(r, i) {
        if (r.status !== 'error') return;
        var d = r.data || {};
        var dn = r.name || d.name || d['part name'] || d['part_name'] || '';
        var dpt = d.part_type || d['part type'] || d['part_type'] || '';
        var dpl = d.part_location || d['part location'] || d['part_location'] || '';
        var dpg = d.part_group || d['part group'] || d['part_group'] || '';
        var dps = d.part_side || d['part side'] || d['part_side'] || '';
        var dvt = d.vehicle_type || d['vehicle type'] || d['vehicle_type'] || '';
        var dcd = d.number_of_car_doors || d['car doors'] || d['number_of_car_doors'] || '';
        var dh = d.height || ''; var dw = d.weight || ''; var dl = d.length || ''; var dwi = d.width || '';
        var diu = d.image_url || d['image url'] || d['image_url'] || '';

        h += '<tr class="table-danger" id="impRow' + i + '">' +
            '<td>' + r.row + '</td>' +
            '<td><input type="text" class="form-control form-control-sm imp-name" value="' + H.esc(dn) + '" placeholder="Name *"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-pt" value="' + H.esc(dpt) + '" placeholder="Type" style="width:75px;"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-pl" value="' + H.esc(dpl) + '" placeholder="Location" style="width:75px;"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-pg" value="' + H.esc(dpg) + '" placeholder="Group" style="width:70px;"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-ps" value="' + H.esc(dps) + '" placeholder="Side" style="width:65px;"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-vt" value="' + H.esc(dvt) + '" placeholder="V.Type" style="width:70px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-cd" value="' + H.esc(dcd) + '" placeholder="0" style="width:45px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-ht" value="' + H.esc(dh) + '" step="0.01" placeholder="0" style="width:50px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-wt" value="' + H.esc(dw) + '" step="0.01" placeholder="0" style="width:50px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-ln" value="' + H.esc(dl) + '" step="0.01" placeholder="0" style="width:50px;"/></td>' +
            '<td><input type="number" class="form-control form-control-sm imp-wd" value="' + H.esc(dwi) + '" step="0.01" placeholder="0" style="width:50px;"/></td>' +
            '<td><input type="text" class="form-control form-control-sm imp-iu" value="' + H.esc(diu) + '" placeholder="URL" style="width:70px;"/></td>' +
            '<td class="small text-danger">' + H.esc(r.message || 'Error') + '</td>' +
            '<td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow(' + i + ')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';
    });
    h += '</tbody></table>';

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
    var iu = $tr.find('.imp-iu').val().trim();
    if (!nm) { toastr.error(T('msg.name_required','Name is required.')); return; }
    var $b = $tr.find('button'); btnLoading($b);
    $.post(BASE_URL + '/part-catalogs/import/single', {
        name: nm, image_url: iu,
        part_type: $tr.find('.imp-pt').val().trim(),
        part_location: $tr.find('.imp-pl').val().trim(),
        part_group: $tr.find('.imp-pg').val().trim(),
        part_side: $tr.find('.imp-ps').val().trim(),
        vehicle_type: $tr.find('.imp-vt').val().trim(),
        number_of_car_doors: $tr.find('.imp-cd').val().trim(),
        height: $tr.find('.imp-ht').val().trim(),
        weight: $tr.find('.imp-wt').val().trim(),
        length: $tr.find('.imp-ln').val().trim(),
        width: $tr.find('.imp-wd').val().trim()
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
    }).fail(function() { btnReset($b); toastr.error(T('general.error','Error.')); });
}
function retryAllErrors() { _importResults.forEach(function(r, i) { if (r.status === 'error') retryImportRow(i); }); }

/* Init */
function _loadAdvFilters(){
    var $parent=$('#filterSidebar');
    var ddls=[
        {sel:'#filterPartType',url:'/part-types/autocomplete',ph:'All Part Types'},
        {sel:'#filterPartLocation',url:'/part-locations/autocomplete',ph:'All Locations'},
        {sel:'#filterPartGroup',url:'/part-groups/autocomplete',ph:'All Groups'},
        {sel:'#filterPartSide',url:'/part-sides/autocomplete',ph:'All Sides'},
        {sel:'#filterVehicleType',url:'/vehicle-types/autocomplete',ph:'All Vehicle Types'},
    ];
    ddls.forEach(function(d){
        if(!$(d.sel).length)return;
        $(d.sel).select2({placeholder:d.ph,allowClear:true,width:'100%',theme:'bootstrap-5',
            dropdownParent:$parent,
            ajax:{url:BASE_URL+d.url,dataType:'json',delay:300,
                data:function(p){return{search:p.term||'',limit:50};},
                processResults:function(r){return{results:(r.data||[]).map(function(v){return{id:v.id,text:v.name||v.part_name||''};})};},
                cache:true},minimumInputLength:0
        });
    });
}

function _updateFilterCount(){
    var c=0;
    if($('#filterCompany').length&&$('#filterCompany').val()&&$('#filterCompany').val()!=='all')c++;
    if($('#filterPartType').val())c++;
    if($('#filterPartLocation').val())c++;
    if($('#filterPartGroup').val())c++;
    if($('#filterPartSide').val())c++;
    if($('#filterVehicleType').val())c++;
    if($('#filterMasterPart').val()!=='')c++;
    if($('#filterBodyCar').val()!=='')c++;
    if($('#filterIndividual').val()!=='')c++;
    if(c>0)$('#filterCount').text(c).removeClass('d-none');else $('#filterCount').addClass('d-none');
}

$(function(){
    _pp=smsInitPerPage('#perPageSel');_loadAdvFilters();loadData();
    $(document).on('click','.sms-pc-img',function(e){e.stopPropagation();showAllImages($(this));});
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterStatus,#filterDeleted',function(){_page=1;loadData();});
    // Sidebar filter changes — reload on offcanvas hide
    $('#filterSidebar').on('hidden.bs.offcanvas',function(){_page=1;_updateFilterCount();loadData();});
    $(document).on('change','#filterCompany,#filterMasterPart,#filterBodyCar,#filterIndividual',function(){/* updated on sidebar close */});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    // Clear inline filters
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');_clearAdvFilters();_page=1;loadData();});
    // Clear advanced filters
    $('#btnClearAdvFilters').on('click',function(){_clearAdvFilters();});

    function _clearAdvFilters(){
        $('#filterMasterPart,#filterBodyCar,#filterIndividual').val('');
        if($('#filterCompany').length)$('#filterCompany').val('all');
        ['#filterPartType','#filterPartLocation','#filterPartGroup','#filterPartSide','#filterVehicleType'].forEach(function(s){try{$(s).val(null).trigger('change.select2');}catch(e){$(s).val('');}});
        _updateFilterCount();
    }
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this),$b=$('#btnImport');$('#importStep1').addClass('d-none');$('#importProcessing').removeClass('d-none');$.ajax({url:BASE_URL+'/part-catalogs/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){$('#importProcessing').addClass('d-none');if(r.status===200&&r.data){if(r.data.mode==='background'){showImportProgress(r.data.jobId, r.data.total);}else if(r.data.results){$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}},error:function(){$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');toastr.error(T('general.network_error','Error.'));}});});
    $('#btnRetryAllErrors').on('click',function(){retryAllErrors();});

    /* ── Bulk Percentage: Search + Add ── */
    var _pctSearchTimer;
    $('#pctPartSearch').on('input',function(){
        clearTimeout(_pctSearchTimer);
        var val=$(this).val().trim();
        if(!val){$('#pctSearchDropdown').hide();return;}
        _pctSearchTimer=setTimeout(function(){
            $.get(BASE_URL+'/part-catalogs/autocomplete',{search:val,limit:20},function(res){
                if(!res||res.status!==200||!res.data||!res.data.length){$('#pctSearchDropdown').html('<div class="text-muted small text-center py-2">No parts found</div>').show();return;}
                var h='';
                res.data.forEach(function(r){
                    var added=!!_pctParts[r.id];
                    h+='<div class="d-flex align-items-center justify-content-between py-2 px-3 border-bottom pct-search-row'+(added?' bg-light':'')+'" style="font-size:13px;cursor:pointer;" data-id="'+r.id+'" data-name="'+H.esc(r.name||'')+'" data-pct="'+(r.vehicle_percentage||0)+'">';
                    h+='<span class="text-truncate me-2">'+H.esc(r.name||'')+'</span>';
                    h+='<button type="button" class="btn btn-sm p-0 flex-shrink-0 pct-add-btn '+(added?'btn-success':'btn-outline-success')+'" data-id="'+r.id+'" data-name="'+H.esc(r.name||'')+'" data-pct="'+(r.vehicle_percentage||0)+'" style="width:26px;height:26px;border-radius:50%;" '+(added?'disabled':'')+'>'+(added?'<i class="bi bi-check-lg"></i>':'<i class="bi bi-plus-lg"></i>')+'</button>';
                    h+='</div>';
                });
                $('#pctSearchDropdown').html(h).show();
            });
        },300);
    });
    $('#pctPartSearch').on('focus',function(){if($(this).val().trim())$('#pctSearchDropdown').show();});
    $(document).on('click',function(e){if(!$(e.target).closest('#pctPartSearch,#pctSearchDropdown').length)$('#pctSearchDropdown').hide();});

    $(document).on('click','.pct-search-row',function(){
        var id=$(this).data('id'),nm=$(this).data('name'),pct=$(this).data('pct');
        if(_pctParts[id])return;
        _pctParts[id]={name:nm,pct:pct||0};
        _renderPctParts();
        // Update dropdown button state
        $(this).addClass('bg-light').find('.pct-add-btn').prop('disabled',true).removeClass('btn-outline-success').addClass('btn-success').html('<i class="bi bi-check-lg"></i>');
    });
    $(document).on('click','.pct-add-btn',function(e){e.stopPropagation();$(this).closest('.pct-search-row').click();});

    $('#btnApplyBulkPct').on('click',function(){
        var ids=Object.keys(_pctParts);
        var pct=$('#bulkPctValue').val();
        if(!ids.length){toastr.error('Add at least one part.');return;}
        if(!pct&&pct!=='0'){toastr.error('Enter a percentage.');return;}
        var $btn=$(this);btnLoading($btn);
        $.ajax({url:BASE_URL+'/part-catalogs/bulk-percentage',type:'POST',contentType:'application/json',
            data:JSON.stringify({part_ids:ids.map(function(v){return parseInt(v);}),percentage:parseFloat(pct)}),
            success:function(r){
                btnReset($btn);
                if(r.status===200){toastr.success(r.message||'Updated.');bootstrap.Modal.getOrCreateInstance($('#modalBulkPct')[0]).hide();loadData();}
                else toastr.error(r.message||'Failed.');
            },error:function(){btnReset($btn);toastr.error('Error.');}
        });
    });
});
