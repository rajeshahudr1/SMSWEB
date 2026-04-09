/* warehouse-zones.js */
'use strict';
var T=function(k,f){return (typeof SMS_T==='function')?SMS_T(k,f):(f||k);};
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
function _filters(){var f={page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),warehouse_id:$('#filterWarehouse').val(),sort_field:_sort.field,sort_dir:_sort.dir};if($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val()!=='all') f.company_id = $('#filterCompany').val();return f;}

function _updateFilterCount(){
    var c=0;
    if($('#filterWarehouse').val()) c++;
    if($('#filterStatus').val()) c++;
    if($('#filterDeleted').val()) c++;
    if($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val()!=='all') c++;
    if(c>0){$('#filterCount').text(c).removeClass('d-none');$('#filterBadge').text(c).removeClass('d-none');$('#btnClearAllFilters').removeClass('d-none');}
    else{$('#filterCount').addClass('d-none');$('#filterBadge').addClass('d-none');$('#btnClearAllFilters').addClass('d-none');}
}

function loadWarehouses(){
    var $el=$('#filterWarehouse');
    $el.select2({
        dropdownParent: $('#filterSidebar'),
        placeholder: 'All Warehouses',
        allowClear: true,
        width: '100%',
        ajax: {
            url: BASE_URL + '/warehouses/autocomplete',
            dataType: 'json',
            delay: 250,
            data: function(params) {
                var d = { q: params.term || '' };
                if ($('#filterCompany').length && $('#filterCompany').val() && $('#filterCompany').val() !== 'all') d.company_id = $('#filterCompany').val();
                return d;
            },
            processResults: function(res) {
                return { results: (res.data || []).map(function(w) { return { id: w.id, text: w.name + ' (' + (w.code || '') + ')' }; }) };
            }
        }
    });
    // Company change → clear warehouse
    $('#filterCompany').off('change.wh').on('change.wh', function() {
        $el.val(null).trigger('change');
    });
}

function loadData(){
    var cols=8;
    $('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/warehouse-zones/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-4 text-danger">Failed to load data.</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-5 text-muted"><i class="bi bi-grid-3x3-gap d-block mb-2" style="font-size:36px;opacity:.3;"></i>No zones found</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

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
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/warehouse-zones/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="togglePT(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(parseInt(r.status)?'off':'on')+' me-2 text-'+(parseInt(r.status)?'warning':'success')+'"></i>'+(parseInt(r.status)?'Deactivate':'Activate')+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>Usage</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showQR(\''+r.uuid+'\',\''+H.esc(r.full_code||'')+'\',\''+H.esc(r.full_name||r.name||'')+'\');return false;"><i class="bi bi-qr-code me-2 text-dark"></i>QR Code</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delPT(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':'';
            var whName=(r.warehouse&&r.warehouse.name)?r.warehouse.name:(r.warehouse_name||'');
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span></td>'+
                '<td><code>'+H.esc(r.code||'')+'</code></td>'+
                '<td><code>'+H.esc(r.full_code||'')+'</code></td>'+
                '<td class="d-none d-md-table-cell">'+H.esc(whName)+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('pagination.showing','Showing')+' '+(pg.from||1)+'–'+(pg.to||data.length)+' '+T('pagination.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="'+cols+'" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

function togglePT(u){$.post(BASE_URL+'/warehouse-zones/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delPT(u,n){smsConfirm({icon:'🗑️',title:T('btn.delete','Delete'),msg:'Are you sure you want to delete <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouse-zones/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});}});}
function recoverPT(u,n){smsConfirm({icon:'♻️',title:T('btn.recover','Recover'),msg:'Recover <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:T('btn.recover','Recover'),onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouse-zones/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;var icons={delete:'🗑️',activate:'✅',deactivate:'⛔',recover:'♻️'};smsConfirm({icon:icons[a]||'⚠️',title:a,msg:_sel.length+' '+T('bulk.items_affected','items will be affected.'),btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a,onConfirm:function(){showLoading();$.post(BASE_URL+'/warehouse-zones/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});}});}

function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title','Usage')+': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/warehouse-zones/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">'+T('general.failed_load','Failed.')+'</div>'); return; }
        smsRenderUsageBody(res.data, 'warehouse-zones', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Network error.')+'</div>'); });
}

function viewRecord(uuid){
    var $b=$('#viewBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/warehouse-zones/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var d=res.data&&res.data.zone?res.data.zone:(res.data||{});

        function _r(label,val){if(!val&&val!==0)return '';var v=String(val);if(/^\d{4}-\d{2}-\d{2}/.test(v))v=smsFormatDate(v);return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value">'+H.esc(v)+'</span></div></div>';}
        function _rb(label,html){if(!html||html==='—')return '';return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value">'+html+'</span></div></div>';}
        function _section(title,icon,content){return '<div class="mb-3"><div class="fw-semibold small mb-1" style="color:var(--tblr-primary);"><i class="bi '+icon+' me-1"></i>'+title+'</div><div class="border rounded p-2"><div class="row g-0">'+content+'</div></div></div>';}

        var statusBadge=parseInt(d.status)?'<span class="badge bg-success-lt">Active</span>':'<span class="badge bg-danger-lt">Inactive</span>';
        if(d.deleted_at) statusBadge='<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>';

        var h='<div class="p-3">';
        h+='<div class="d-flex flex-wrap gap-2 mb-3 align-items-center">';
        if(d.full_code)h+='<span class="badge bg-primary-lt" style="font-size:12px;">'+H.esc(d.full_code)+'</span>';
        h+=statusBadge;
        h+='</div>';

        h+=_section('Zone Information','bi-grid-3x3-gap',
            _r('Name',d.name)+_r('Code',d.code)+_r('Full Code',d.full_code)+_r('Full Name',d.full_name)+_r('Warehouse',d.warehouse_name)+_r('Description',d.description));
        h+=_section('Status','bi-flag',
            _rb('Status',statusBadge));

        h+='<div class="border-top mt-3 pt-2 d-flex flex-wrap gap-3" style="font-size:11px;">';
        h+='<span class="text-muted">Created: '+smsFormatDateTime(d.created_at)+'</span>';
        h+='<span class="text-muted">Updated: '+smsFormatDateTime(d.updated_at)+'</span>';
        h+='</div>';
        h+='</div>';
        $b.html(h);
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Network error.')+'</div>');});
}

function showQR(uuid, fullCode, fullName){
    var $b=$('#qrBody');
    $b.html('<div class="text-center py-3"><span class="spinner-border spinner-border-sm"></span></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalQR')[0]).show();

    // Generate QR using local qrcode-generator library
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
    var svg = $('#qrImgWrap').html();
    var w = window.open('', '_blank', 'width=400,height=500');
    w.document.write('<html><head><title>QR Code</title></head><body style="text-align:center;padding:20px;">' + svg + '<br/><strong>' + ($('#qrImgWrap').next().text()) + '</strong></body></html>');
    w.document.close();
    setTimeout(function(){ w.print(); }, 400);
}

function downloadQR(name){
    var svg = $('#qrImgWrap svg')[0];
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

function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/warehouse-zones/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/warehouse-zones/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Warehouse Zones</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Warehouse Zones ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error(T('general.failed','Failed.'));});}

$(function(){
    _pp=smsInitPerPage('#perPageSel');loadWarehouses();loadData();
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});

    // Sidebar: Apply
    $('#btnApplyFilters').on('click',function(){_page=1;_updateFilterCount();loadData();});
    // Sidebar: Clear All
    $('#btnClearAdvFilters').on('click',function(){$('#filterWarehouse').val(null).trigger('change');$('#filterStatus,#filterDeleted').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_updateFilterCount();});
    // Inline clear
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterWarehouse').val(null).trigger('change');$('#filterStatus,#filterDeleted').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_updateFilterCount();_page=1;loadData();});
    $('#btnClearAllFilters').on('click',function(){$('#searchInput').val('');$('#filterWarehouse').val(null).trigger('change');$('#filterStatus,#filterDeleted').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_updateFilterCount();_page=1;loadData();});

    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
});
