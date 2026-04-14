/* packages.js — Packages list page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'sort_order',dir:'asc'};
function _filters(){return{page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),is_trial:$('#filterTrial').val()||'',show_deleted:$('#filterDeleted').val(),date_from:$('#filterDateFrom').val()||'',date_to:$('#filterDateTo').val()||'',sort_field:_sort.field,sort_dir:_sort.dir};}
function updateFilterCount(){var c=0;if($('#filterStatus').val())c++;if($('#filterTrial').val())c++;if($('#filterDeleted').val())c++;if($('#filterDateFrom').val())c++;if($('#filterDateTo').val())c++;if(c>0)$('#filterCount').text(c).removeClass('d-none');else $('#filterCount').addClass('d-none');}

/* Export */
function doExport(fmt){
    var p=_filters();p.format=fmt;delete p.page;delete p.per_page;
    showLoading();
    $.post(BASE_URL+'/packages/export',p,function(res){
        hideLoading();
        if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);
        if(fmt==='csv'||fmt==='excel'){
            var csv=cols.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',')+'\n';
            rows.forEach(function(r){csv+=cols.map(function(c){return '"'+String(r[c]==null?'':r[c]).replace(/"/g,'""')+'"';}).join(',')+'\n';});
            var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
            var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='packages-'+Date.now()+'.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
            toastr.success('Export ready.');return;
        }
        var html='<html><head><title>Packages</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}</style></head><body><h2>Packages ('+rows.length+')</h2><table><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr>';
        rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    }).fail(function(){hideLoading();toastr.error('Failed.');});
}

function loadData(){
    $('#tableBody').html('<tr><td colspan="10" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/packages/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="10" class="text-center py-4 text-danger">Failed to load data.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="10" class="text-center py-5 text-muted"><i class="bi bi-box-seam d-block mb-2" style="font-size:36px;opacity:.3;"></i>No packages found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':((r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
            var isDefault=!!(r.is_default===true||r.is_default===1||parseInt(r.is_default)===1);
            var defaultBadge=isDefault?' <span class="badge bg-azure-lt" style="font-size:9px;">Default</span>':'';
            var modulesCount=r.modules_count||((r.modules&&r.modules.length)||0);
            var orgsCount=r.organizations_count||((r.organizations&&r.organizations.length)||0);
            var isActive=(r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1);

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewPkg(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverPkg(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            }else{
                acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/packages/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="togglePkg(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(isActive?'off':'on')+' me-2 text-'+(isActive?'warning':'success')+'"></i>'+(isActive?'Deactivate':'Activate')+'</a></li>';
                acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delPkg(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':'';
            var badgeColors={most_popular:'blue',recommended:'purple',best_value:'green','new':'yellow',enterprise:'dark',trial:'pink',custom:'indigo'};
            var badgeLabels={most_popular:'Popular',recommended:'Recommended',best_value:'Best Value','new':'New',enterprise:'Enterprise',trial:'Trial',custom:'Custom'};
            var badgeHtml=r.badge?'<span class="badge bg-'+(badgeColors[r.badge]||'secondary')+'-lt" style="font-size:9px;">'+H.esc(badgeLabels[r.badge]||r.badge)+'</span>':'<span class="text-muted">-</span>';
            var disc=parseInt(r.yearly_discount_pct)||0;
            var yearlyPrice=r.price>0?Math.round(r.price*12*(1-disc/100)*100)/100:0;
            var typeHtml='';
            if(r.is_custom)typeHtml='<span class="badge bg-indigo-lt" style="font-size:9px;">Custom</span>';
            else if(r.is_trial)typeHtml='<span class="badge bg-warning-lt" style="font-size:9px;">Trial '+r.trial_days+'d</span>';
            else typeHtml='<span class="badge bg-azure-lt" style="font-size:9px;">Standard</span>';

            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span>'+defaultBadge+'</td>'+
                '<td>'+badgeHtml+'</td>'+
                '<td>'+(r.is_custom?'<span class="text-muted">-</span>':(r.role_name?H.esc(r.role_name):'<span class="text-muted">-</span>'))+'</td>'+
                '<td class="text-end">'+(r.is_custom?'<span class="text-muted">Custom</span>':(r.price>0?H.currency(r.price):'<span class="text-success">Free</span>'))+'</td>'+
                '<td class="text-end">'+(r.is_custom?'':disc>0?H.currency(yearlyPrice)+' <span class="text-success small">(-'+disc+'%)</span>':'<span class="text-muted">-</span>')+'</td>'+
                '<td>'+typeHtml+'</td>'+
                '<td><span class="badge bg-secondary-lt">'+orgsCount+'</span></td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+'-'+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="10" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewPkg(uuid){
    var $b=$('#viewBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/packages/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200||!res.data){$b.html('<div class="alert alert-danger m-3">Not found.</div>');return;}
        renderViewModal(res.data);
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">Network error.</div>');});
}

function renderViewModal(pkg){
    var $b=$('#viewBody');
    var badgeColors={most_popular:'blue',recommended:'purple',best_value:'green','new':'yellow',enterprise:'dark',trial:'pink',custom:'indigo'};
    var badgeLabels={most_popular:'Most Popular',recommended:'Recommended',best_value:'Best Value','new':'New',enterprise:'Enterprise',trial:'Trial',custom:'Custom'};
    var disc=parseInt(pkg.yearly_discount_pct)||0;
    var yearlyPrice=pkg.price>0?Math.round(pkg.price*12*(1-disc/100)*100)/100:0;

    var h='<div class="p-4">';
    h+='<div class="text-center mb-3"><h4 class="mb-1">'+H.esc(pkg.name||'')+'</h4>';
    h+='<div class="d-flex justify-content-center gap-2 flex-wrap">';
    if(pkg.badge) h+='<span class="badge bg-'+(badgeColors[pkg.badge]||'secondary')+'-lt">'+H.esc(badgeLabels[pkg.badge]||pkg.badge)+'</span>';
    h+=((parseInt(pkg.status))?'<span class="badge bg-success-lt">Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
    if(pkg.is_default) h+='<span class="badge bg-azure-lt">Default</span>';
    if(pkg.is_custom) h+='<span class="badge bg-indigo-lt">Custom Plan</span>';
    if(pkg.is_trial) h+='<span class="badge bg-warning-lt">Trial '+pkg.trial_days+'d</span>';
    h+='</div></div>';

    h+='<div class="row g-2 mb-3">';
    if(!pkg.is_custom){
        h+='<div class="col-sm-3"><div class="border rounded p-2"><div class="text-muted small">Role</div><div class="fw-medium">'+(pkg.role_name?H.esc(pkg.role_name):'-')+'</div></div></div>';
        h+='<div class="col-sm-3"><div class="border rounded p-2"><div class="text-muted small">Monthly</div><div class="fw-medium">'+(pkg.price>0?H.currency(pkg.price):'Free')+'</div></div></div>';
        h+='<div class="col-sm-3"><div class="border rounded p-2"><div class="text-muted small">Yearly</div><div class="fw-medium">'+(yearlyPrice>0?H.currency(yearlyPrice)+(disc>0?' <small class="text-success">-'+disc+'%</small>':''):'Free')+'</div></div></div>';
        h+='<div class="col-sm-3"><div class="border rounded p-2"><div class="text-muted small">Modules</div><div class="fw-medium"><span class="badge bg-primary-lt">'+(pkg.modules?pkg.modules.length:0)+'</span></div></div></div>';
    } else {
        h+='<div class="col-12"><div class="border rounded p-2 text-center"><span style="font-size:18px;font-weight:800;color:#6366f1;">Custom Pricing</span><div class="text-muted small">Contact us for a tailored quote</div></div></div>';
    }
    if(pkg.is_trial&&pkg.trial_verification_amount>0) h+='<div class="col-sm-3"><div class="border rounded p-2"><div class="text-muted small">Verification</div><div class="fw-medium">'+H.currency(pkg.trial_verification_amount)+'</div></div></div>';
    h+='</div>';

    if(pkg.description){
        h+='<div class="mb-3"><div class="text-muted small mb-1">Description</div><div class="border rounded p-2">'+H.esc(pkg.description)+'</div></div>';
    }

    // Show modules + limits
    if(pkg.modules && pkg.modules.length){
        var limMap = {};
        if (pkg.limits) pkg.limits.forEach(function(l) { limMap[l.permission_group] = parseInt(l.limit_value) || 0; });
        h+='<div class="mb-3"><div class="text-muted small mb-2">Assigned Modules</div>';
        h+='<div class="border rounded overflow-hidden">';
        pkg.modules.forEach(function(m, i){
            var name = typeof m === 'string' ? m : (m.permission_group || m);
            var lim = limMap[name];
            h+='<div class="d-flex align-items-center px-3 py-1'+(i%2===0?' bg-light':'')+'" style="font-size:12px;">';
            h+='<i class="bi bi-check-circle-fill text-success me-2" style="font-size:10px;"></i>';
            h+='<span class="flex-fill">'+H.esc(name)+'</span>';
            if (lim !== undefined && lim > 0) h+='<span class="badge bg-warning-lt">Limit: '+lim+'</span>';
            else if (lim === 0) h+='<span class="badge bg-secondary-lt">Unlimited</span>';
            h+='</div>';
        });
        h+='</div></div>';
    }

    h+='<div class="border-top pt-3">';
    h+='<div class="mb-2"><span class="text-muted small">Created:</span> '+smsFormatDateTime(pkg.created_at)+'</div>';
    h+='<div class="mb-2"><span class="text-muted small">Updated:</span> '+smsFormatDateTime(pkg.updated_at)+'</div>';
    h+='</div>';

    h+='</div>';
    $b.html(h);
}

/* Actions */
function togglePkg(u){$.post(BASE_URL+'/packages/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delPkg(u,n){smsConfirm({title:'Delete Package',msg:'Are you sure you want to delete <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-danger',btnText:'Delete',onConfirm:function(){showLoading();$.post(BASE_URL+'/packages/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}
function recoverPkg(u,n){smsConfirm({title:'Recover Package',msg:'Recover <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:'Recover',onConfirm:function(){showLoading();$.post(BASE_URL+'/packages/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;smsConfirm({title:a.charAt(0).toUpperCase()+a.slice(1),msg:_sel.length+' items will be '+a+'d.',btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a.charAt(0).toUpperCase()+a.slice(1),onConfirm:function(){showLoading();$.post(BASE_URL+'/packages/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}

/* Init */
$(function(){
    if($('#tableBody').length === 0) return;

    _pp=smsInitPerPage('#perPageSel');loadData();

    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterStatus,#filterTrial,#filterDeleted,#filterDateFrom,#filterDateTo',function(){_page=1;updateFilterCount();loadData();});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterTrial,#filterDeleted,#filterDateFrom,#filterDateTo').val('');updateFilterCount();_page=1;loadData();});
    $('#btnClearAdvFilters').on('click',function(){$('#filterStatus,#filterTrial,#filterDeleted,#filterDateFrom,#filterDateTo').val('');updateFilterCount();_page=1;loadData();});
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
});
