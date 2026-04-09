/* warehouses.js — List page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return (typeof SMS_T==='function')?SMS_T(k,f):(f||k);};

function _filters(){
    var f = {page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),sort_field:_sort.field,sort_dir:_sort.dir};
    if($('#filterCompany').length && $('#filterCompany').val()) f.company_id = $('#filterCompany').val();
    var city=$('#filterCity').val();if(city&&city.trim()) f.city=city.trim();
    var country=$('#filterCountry').val();if(country&&country.trim()) f.country=country.trim();
    return f;
}

function _updateFilterBadge(){
    var count=0;
    if($('#filterStatus').val()) count++;
    if($('#filterDeleted').val()) count++;
    if($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val()!=='all') count++;
    if($('#filterCity').val()&&$('#filterCity').val().trim()) count++;
    if($('#filterCountry').val()&&$('#filterCountry').val().trim()) count++;
    if(count>0){$('#filterBadge').text(count).removeClass('d-none');$('#btnClearAllFilters').removeClass('d-none');}
    else{$('#filterBadge').addClass('d-none');$('#btnClearAllFilters').addClass('d-none');}
}

function loadData(){
    var cols=9;
    $('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/warehouses/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-4 text-danger">Failed to load.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-5 text-muted"><i class="bi bi-building d-block mb-2" style="font-size:36px;opacity:.3;"></i>No warehouses found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverPT(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            }else{
                acts+='<li><a class="dropdown-item" href="#" onclick="viewRecord(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>Preview</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/warehouses/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="togglePT(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(parseInt(r.status)?'off':'on')+' me-2 text-'+(parseInt(r.status)?'warning':'success')+'"></i>'+(parseInt(r.status)?'Deactivate':'Activate')+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>Usage</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showQR(\''+r.uuid+'\',\''+H.esc(r.full_code||'')+'\',\''+H.esc(r.full_name||r.name||'')+'\');return false;"><i class="bi bi-qr-code me-2" style="color:#6f42c1;"></i>QR Code</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delPT(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':'';
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span></td>'+
                '<td><code>'+H.esc(r.code||'')+'</code></td>'+
                '<td><code class="text-primary">'+H.esc(r.full_code||'')+'</code></td>'+
                '<td class="d-none d-md-table-cell">'+H.esc(r.city||'')+'</td>'+
                '<td class="d-none d-lg-table-cell">'+H.esc(r.country||'')+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+' to '+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* Actions */
function togglePT(u){$.post(BASE_URL+'/warehouses/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}

function delPT(u,n){
    smsConfirm({icon:'\uD83D\uDDD1\uFE0F',title:T('btn.delete','Delete'),msg:T('general.are_you_sure','Are you sure?')+' <strong>'+H.esc(n)+'</strong>',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),
        onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouses/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});}
    });
}

function recoverPT(u,n){
    smsConfirm({icon:'\u267B\uFE0F',title:T('bulk.recover','Recover'),msg:T('bulk.recover','Recover')+' <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:T('bulk.recover','Recover'),
        onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouses/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});}
    });
}

function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}

function bulkAction(a){
    if(!_sel.length)return;
    var icons={delete:'\uD83D\uDDD1\uFE0F',activate:'\u2705',deactivate:'\u26D4',recover:'\u267B\uFE0F'};
    smsConfirm({icon:icons[a]||'\u26A0\uFE0F',title:a.charAt(0).toUpperCase()+a.slice(1),msg:_sel.length+' items will be affected.',btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a.charAt(0).toUpperCase()+a.slice(1),
        onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouses/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});}
    });
}

/* Usage */
function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title', 'Usage') + ': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/warehouses/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + T('general.failed_load', 'Failed.') + '</div>'); return; }
        smsRenderUsageBody(res.data, 'warehouses', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">' + T('general.network_error', 'Network error.') + '</div>'); });
}

/* View modal */
function viewRecord(uuid){
    var $b=$('#viewBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/warehouses/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var w=(res.data&&res.data.warehouse)||res.data||{};

        function _r(label,val){if(!val&&val!==0)return '';var v=String(val);if(/^\d{4}-\d{2}-\d{2}/.test(v))v=typeof smsFormatDate==='function'?smsFormatDate(v):v;return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value">'+H.esc(v)+'</span></div></div>';}
        function _rb(label,html){if(!html||html==='\u2014')return '';return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value">'+html+'</span></div></div>';}
        function _section(title,icon,content){if(!content)return '';return '<div class="mb-3"><div class="fw-semibold small mb-1" style="color:var(--tblr-primary);"><i class="bi '+icon+' me-1"></i>'+title+'</div><div class="border rounded p-2"><div class="row g-0">'+content+'</div></div></div>';}

        var h='<div class="p-3">';
        // Header badges
        h+='<div class="d-flex flex-wrap gap-2 mb-3 align-items-center">';
        if(w.code)h+='<span class="badge bg-primary-lt" style="font-size:12px;">'+H.esc(w.code)+'</span>';
        if(w.full_code)h+='<span class="badge bg-azure-lt" style="font-size:12px;">'+H.esc(w.full_code)+'</span>';
        var statusBadge=parseInt(w.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>':'<span class="badge bg-danger-lt">Inactive</span>';
        h+=statusBadge;
        h+='</div>';

        h+=_section('Basic Information','bi-building',
            _r('Name',w.name)+_r('Code',w.code)+_r('Full Code',w.full_code)+_r('Full Name',w.full_name)+_r('Description',w.description));

        h+=_section('Address','bi-geo-alt',
            _r('Address',w.address)+_r('City',w.city)+_r('State',w.state)+_r('Country',w.country));

        h+=_section('Contact','bi-person-lines-fill',
            _r('Contact Person',w.contact_person)+_r('Phone',w.contact_phone)+_r('Email',w.contact_email));

        h+=_section('Status & Dates','bi-calendar-event',
            _rb('Status',statusBadge)+_r('Created',w.created_at)+_r('Updated',w.updated_at));

        h+='</div>';
        $b.html(h);
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Network error.')+'</div>');});
}

/* QR Code modal */
function showQR(uuid, fullCode, fullName){
    $('#qrFullCode').text(fullCode||'');
    $('#qrFullName').text(fullName||'');
    var $display=$('#qrCodeDisplay');
    $display.empty();
    bootstrap.Modal.getOrCreateInstance($('#modalQR')[0]).show();

    // Use qrcode-generator library
    if(typeof qrcode!=='undefined'){
        var qr=qrcode(0,'M');
        qr.addData(fullCode||uuid);
        qr.make();
        var img=qr.createImgTag(6,8);
        $display.html(img);
    } else {
        // Fallback: use Google Charts QR API
        var imgUrl='https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl='+encodeURIComponent(fullCode||uuid);
        $display.html('<img src="'+imgUrl+'" alt="QR Code" style="width:200px;height:200px;"/>');
    }
}

/* QR Print & Download */
$(document).on('click','#btnQRPrint',function(){
    var content=$('#qrCodeDisplay').html();
    var code=$('#qrFullCode').text();
    var name=$('#qrFullName').text();
    var w=window.open('','_blank','width=400,height=500');
    w.document.write('<html><head><title>QR Code - '+code+'</title><style>body{font-family:Arial;text-align:center;padding:40px;}h2{margin:10px 0 5px;font-size:18px;}p{color:#666;font-size:14px;}</style></head><body>'+content+'<h2>'+code+'</h2><p>'+name+'</p></body></html>');
    w.document.close();
    setTimeout(function(){w.print();},400);
});

$(document).on('click','#btnQRDownload',function(){
    var img=$('#qrCodeDisplay img')[0];
    if(!img)return;
    var canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth||img.width;
    canvas.height=img.naturalHeight||img.height;
    var ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    var a=document.createElement('a');
    a.href=canvas.toDataURL('image/png');
    a.download='QR_'+($('#qrFullCode').text()||'code')+'.png';
    a.click();
});

/* Export */
function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/warehouses/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/warehouses/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Warehouses</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Warehouses ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error('Failed.');});}

/* Init */
$(function(){
    _pp=smsInitPerPage('#perPageSel');loadData();
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();_updateFilterBadge();},380);});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    // Sidebar: Apply button
    $('#btnApplyFilters').on('click',function(){_page=1;loadData();_updateFilterBadge();});
    // Sidebar: Clear All
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');$('#filterCity,#filterCountry').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();_updateFilterBadge();});
    $('#btnClearAllFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');$('#filterCity,#filterCountry').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();_updateFilterBadge();});
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
});
