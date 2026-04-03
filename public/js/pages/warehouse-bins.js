/* warehouse-bins.js */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};

function _filters(){
    var f={page:_page,per_page:_pp,search:$('#searchInput').val().trim(),sort_field:_sort.field,sort_dir:_sort.dir};
    if($('#filterStatus').val()) f.status=$('#filterStatus').val();
    if($('#filterDeleted').val()) f.show_deleted=$('#filterDeleted').val();
    if($('#filterWarehouse').val()) f.warehouse_id=$('#filterWarehouse').val();
    if($('#filterZone').val()) f.zone_id=$('#filterZone').val();
    if($('#filterShelf').val()) f.shelf_id=$('#filterShelf').val();
    if($('#filterRack').val()) f.rack_id=$('#filterRack').val();
    if($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val()!=='all') f.company_id=$('#filterCompany').val();
    return f;
}

function _updateFilterBadge(){
    var count=0;
    if($('#filterStatus').val()) count++;
    if($('#filterDeleted').val()) count++;
    if($('#filterWarehouse').val()) count++;
    if($('#filterZone').val()) count++;
    if($('#filterShelf').val()) count++;
    if($('#filterRack').val()) count++;
    if($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val()!=='all') count++;
    if(count>0){$('#filterBadge').text(count).removeClass('d-none');$('#btnClearAllFilters').removeClass('d-none');}else{$('#filterBadge').addClass('d-none');$('#btnClearAllFilters').addClass('d-none');}
}

function _initSidebarSelect2(){
    if(!$.fn.select2)return;
    function _cid(){return ($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val()!=='all') ? $('#filterCompany').val() : '';}
    $('#filterWarehouse').select2({dropdownParent:$('#filterSidebar'),placeholder:'All Warehouses',allowClear:true,width:'100%',
        ajax:{url:BASE_URL+'/warehouses/autocomplete',dataType:'json',delay:250,data:function(params){var d={q:params.term||''};if(_cid())d.company_id=_cid();return d;},
            processResults:function(res){return{results:(res.data||[]).map(function(w){return{id:w.id,text:w.name+' ('+(w.code||'')+')'};})};}
    }});
    $('#filterZone').select2({dropdownParent:$('#filterSidebar'),placeholder:'All Zones',allowClear:true,width:'100%',
        ajax:{url:BASE_URL+'/warehouse-zones/autocomplete',dataType:'json',delay:250,data:function(params){var wh=$('#filterWarehouse').val();var d={q:params.term||''};if(wh)d.warehouse_id=wh;if(_cid())d.company_id=_cid();return d;},
            processResults:function(res){return{results:(res.data||[]).map(function(z){return{id:z.id,text:z.name+' ('+(z.code||'')+')'};})};}
    }});
    $('#filterShelf').select2({dropdownParent:$('#filterSidebar'),placeholder:'All Shelves',allowClear:true,width:'100%',
        ajax:{url:BASE_URL+'/warehouse-shelves/autocomplete',dataType:'json',delay:250,data:function(params){var zn=$('#filterZone').val();var d={q:params.term||''};if(zn)d.zone_id=zn;if(_cid())d.company_id=_cid();return d;},
            processResults:function(res){return{results:(res.data||[]).map(function(s){return{id:s.id,text:s.name+' ('+(s.code||'')+')'};})};}
    }});
    $('#filterRack').select2({dropdownParent:$('#filterSidebar'),placeholder:'All Racks',allowClear:true,width:'100%',
        ajax:{url:BASE_URL+'/warehouse-racks/autocomplete',dataType:'json',delay:250,data:function(params){var sh=$('#filterShelf').val();var d={q:params.term||''};if(sh)d.shelf_id=sh;if(_cid())d.company_id=_cid();return d;},
            processResults:function(res){return{results:(res.data||[]).map(function(r){return{id:r.id,text:r.name+' ('+(r.code||'')+')'};})};}
    }});
    // Company change -> clear all
    $('#filterCompany').off('change.wh').on('change.wh',function(){$('#filterWarehouse').val(null).trigger('change.select2');$('#filterZone').val(null).trigger('change.select2');$('#filterShelf').val(null).trigger('change.select2');$('#filterRack').val(null).trigger('change.select2');});
}

function loadData(){
    var cols=8;
    $('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/warehouse-bins/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-4 text-danger">Failed to load data.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-5 text-muted"><i class="bi bi-box-seam d-block mb-2" style="font-size:36px;opacity:.3;"></i>No bins found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverPT(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            }else{
                acts+='<li><a class="dropdown-item" href="#" onclick="viewRecord(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>Preview</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/warehouse-bins/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="togglePT(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(parseInt(r.status)?'off':'on')+' me-2 text-'+(parseInt(r.status)?'warning':'success')+'"></i>'+(parseInt(r.status)?'Deactivate':'Activate')+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>Usage</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showQR(\''+r.uuid+'\',\''+H.esc(r.full_code||'')+'\',\''+H.esc(r.full_name||r.name||'')+'\');return false;"><i class="bi bi-qr-code me-2" style="color:#6f42c1;"></i>QR Code</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delPT(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':'';
            var fullCode=r.full_code||'';
            var qrBadge=fullCode?'<span class="badge bg-info-lt ms-1 sms-qr-inline" role="button" title="QR: '+H.esc(fullCode)+'" onclick="showQR(\''+r.uuid+'\',\''+H.esc(fullCode)+'\',\''+H.esc(r.full_name||r.name||'')+'\');return false;" style="cursor:pointer;"><i class="bi bi-qr-code"></i></span>':'';
            var fullName=r.full_name||'';
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span></td>'+
                '<td><code>'+H.esc(r.code||'')+'</code></td>'+
                '<td><code>'+H.esc(fullCode)+'</code>'+qrBadge+'</td>'+
                '<td class="small">'+H.esc(fullName)+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+'–'+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

function togglePT(u){$.post(BASE_URL+'/warehouse-bins/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delPT(u,n){smsConfirm({icon:'🗑️',title:'Delete',msg:'Are you sure you want to delete <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-danger',btnText:'Delete',onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouse-bins/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}
function recoverPT(u,n){smsConfirm({icon:'♻️',title:'Recover',msg:'Recover <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:'Recover',onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouse-bins/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;var icons={delete:'🗑️',activate:'✅',deactivate:'⛔',recover:'♻️'};smsConfirm({icon:icons[a]||'⚠️',title:a,msg:_sel.length+' items will be affected.',btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a,onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouse-bins/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error('Network error.');});}});}

function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text('Usage: ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/warehouse-bins/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">Failed to load.</div>'); return; }
        smsRenderUsageBody(res.data, 'warehouse-bins', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">Network error.</div>'); });
}

/* View modal */
function viewRecord(uuid){
    var $b=$('#viewBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/warehouse-bins/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">Not found.</div>');return;}
        var w=(res.data&&res.data.bin)||res.data||{};

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

        h+=_section('Basic Information','bi-box-seam',
            _r('Name',w.name)+_r('Code',w.code)+_r('Full Code',w.full_code)+_r('Full Name',w.full_name)+_r('Description',w.description));

        h+=_section('Parent Hierarchy','bi-diagram-3',
            _r('Warehouse',w.warehouse_name)+_r('Zone',w.zone_name)+_r('Shelf',w.shelf_name)+_r('Rack',w.rack_name)+_r('Rack Full Code',w.rack_full_code));

        h+=_section('Status & Dates','bi-calendar-event',
            _rb('Status',statusBadge)+_r('Created',w.created_at)+_r('Updated',w.updated_at));

        h+='</div>';
        $b.html(h);
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">Network error.</div>');});
}

/* QR Code modal */
function showQR(uuid, fullCode, fullName){
    var $b=$('#qrBody');
    if(!$b.length){
        // Fallback: use #qrCodeDisplay pattern
        $('#qrFullCode').text(fullCode||'');
        $('#qrFullName').text(fullName||'');
        var $display=$('#qrCodeDisplay');
        $display.empty();
        bootstrap.Modal.getOrCreateInstance($('#modalQR')[0]).show();
        if(typeof qrcode!=='undefined'){
            var qr=qrcode(0,'M');
            qr.addData(fullCode||uuid);
            qr.make();
            $display.html(qr.createSvgTag({cellSize:4,margin:4}));
        } else {
            var imgUrl='https://quickchart.io/qr?text='+encodeURIComponent(fullCode||uuid)+'&size=200';
            $display.html('<img src="'+imgUrl+'" alt="QR Code" style="width:200px;height:200px;"/>');
        }
        return;
    }
    $b.html('<div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalQR')[0]).show();

    var h = '';
    if (typeof qrcode !== 'undefined') {
        var qr = qrcode(0, 'M');
        qr.addData(fullCode || '');
        qr.make();
        h += '<div class="mb-3" id="qrImgWrap">' + qr.createSvgTag({ cellSize: 4, margin: 4 }) + '</div>';
    } else {
        var qrUrl = 'https://quickchart.io/qr?text=' + encodeURIComponent(fullCode) + '&size=200';
        h += '<div class="mb-3" id="qrImgWrap"><img src="' + qrUrl + '" style="width:200px;height:200px;" id="qrImg"/></div>';
    }
    h += '<div class="fw-semibold" style="font-size:16px;">' + H.esc(fullCode) + '</div>';
    h += '<div class="text-muted small mb-3">' + H.esc(fullName) + '</div>';
    h += '<div class="d-flex gap-2 justify-content-center">';
    h += '<button class="btn btn-sm btn-outline-primary" onclick="printQR()"><i class="bi bi-printer me-1"></i>Print</button>';
    h += '<button class="btn btn-sm btn-outline-success" onclick="downloadQR(\'' + H.esc(fullCode) + '\')"><i class="bi bi-download me-1"></i>Download</button>';
    h += '</div>';
    $b.html(h);
}

function printQR(){
    var wrap = $('#qrImgWrap');
    if(!wrap.length) wrap = $('#qrCodeDisplay');
    var svg = wrap.html();
    var code = wrap.next().text() || $('#qrFullCode').text();
    var w = window.open('', '_blank', 'width=400,height=500');
    w.document.write('<html><head><title>QR Code</title></head><body style="text-align:center;padding:20px;">' + svg + '<br/><strong>' + code + '</strong></body></html>');
    w.document.close();
    setTimeout(function(){ w.print(); }, 400);
}

function downloadQR(name){
    var svg = $('#qrImgWrap svg')[0] || $('#qrCodeDisplay svg')[0];
    if (!svg) return;
    var canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    var ctx = canvas.getContext('2d');
    var data = new XMLSerializer().serializeToString(svg);
    var img = new Image();
    img.onload = function(){
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
        var a = document.createElement('a');
        a.download = 'QR-' + (name || 'code') + '.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
}

/* Legacy QR Print & Download buttons (if modal uses #btnQRPrint/#btnQRDownload) */
$(document).on('click','#btnQRPrint',function(){ printQR(); });
$(document).on('click','#btnQRDownload',function(){ downloadQR($('#qrFullCode').text()||'code'); });

function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/warehouse-bins/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/warehouse-bins/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Warehouse Bins</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Warehouse Bins ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error('Failed.');});}

$(function(){
    _pp=smsInitPerPage('#perPageSel');_initSidebarSelect2();loadData();
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});

    // Sidebar: cascade logic
    $('#filterWarehouse').on('change',function(){$('#filterZone').val(null).trigger('change.select2');$('#filterShelf').val(null).trigger('change.select2');$('#filterRack').val(null).trigger('change.select2');});
    $('#filterZone').on('change',function(){$('#filterShelf').val(null).trigger('change.select2');$('#filterRack').val(null).trigger('change.select2');});
    $('#filterShelf').on('change',function(){$('#filterRack').val(null).trigger('change.select2');});

    // Sidebar: Apply button
    $('#btnApplyFilters').on('click',function(){_page=1;loadData();_updateFilterBadge();});
    // Sidebar: Clear All
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');$('#filterWarehouse').val(null).trigger('change.select2');$('#filterZone').val(null).trigger('change.select2');$('#filterShelf').val(null).trigger('change.select2');$('#filterRack').val(null).trigger('change.select2');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();_updateFilterBadge();});
    $('#btnClearAllFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');$('#filterWarehouse').val(null).trigger('change.select2');$('#filterZone').val(null).trigger('change.select2');$('#filterShelf').val(null).trigger('change.select2');$('#filterRack').val(null).trigger('change.select2');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();_updateFilterBadge();});

    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
});
