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

            var acts='<div class="btn-group btn-group-sm">';
            acts+='<button class="btn btn-ghost-primary" onclick="viewRec(\''+r.uuid+'\')" title="'+T('general.preview','View')+'"><i class="bi bi-eye"></i></button>';
            if(deleted){
                acts+='<button class="btn btn-ghost-success" onclick="recoverRec(\''+r.uuid+'\',\''+r.year+'\')" title="Recover"><i class="bi bi-arrow-counterclockwise"></i></button>';
            }else{
                if(editable)acts+='<a href="'+BASE_URL+'/vehicle-years/'+r.uuid+'/edit" class="btn btn-ghost-secondary" title="'+T('btn.edit','Edit')+'"><i class="bi bi-pencil"></i></a>';
                if(editable)acts+='<button class="btn btn-ghost-'+(parseInt(r.status)?'warning':'success')+'" onclick="toggleRec(\''+r.uuid+'\')"><i class="bi bi-toggle-'+(parseInt(r.status)?'on':'off')+'"></i></button>';
                if(deletable)acts+='<button class="btn btn-ghost-danger" onclick="delRec(\''+r.uuid+'\',\''+r.year+'\')"><i class="bi bi-trash3"></i></button>';
            }
            acts+='</div>';
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
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">Not found.</div>');return;}
        var rec=res.data.record||res.data||{};
        var h='<div class="p-4 text-center"><h2 class="mb-2">'+rec.year+'</h2>';
        h+='<div>'+(parseInt(rec.status)?'<span class="badge bg-success-lt">'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
        if(rec.is_global)h+=' <span class="badge bg-azure-lt">Global</span>';
        h+='</div>';
        if(rec.company_name)h+='<div class="text-muted small mt-1"><i class="bi bi-building me-1"></i>'+H.esc(rec.company_name)+'</div>';
        h+='<div class="border-top mt-3 pt-3 text-start"><div class="mb-1"><span class="text-muted small">Created:</span> '+smsFormatDateTime(rec.created_at)+'</div>';
        h+='<div><span class="text-muted small">Updated:</span> '+smsFormatDateTime(rec.updated_at)+'</div></div></div>';
        $b.html(h);
    });
}

function toggleRec(uuid){smsConfirm({title:'Confirm',text:'Toggle status?',onConfirm:function(){$.post(BASE_URL+'/vehicle-years/'+uuid+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function delRec(uuid,year){smsConfirm({title:'Delete',text:'Delete year <strong>'+year+'</strong>?',btnClass:'btn-danger',onConfirm:function(){$.post(BASE_URL+'/vehicle-years/'+uuid+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(uuid,year){smsConfirm({title:'Recover',text:'Recover year <strong>'+year+'</strong>?',btnClass:'btn-success',onConfirm:function(){$.post(BASE_URL+'/vehicle-years/'+uuid+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

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
        if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error('No data.');return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);
        var html='<html><head><title>Vehicle Years</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Vehicle Years ('+rows.length+')</h2><table><thead><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';
        rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    });
}

function openImport(){$('#importStep1').show();$('#importStep2').addClass('d-none');$('#frmImport')[0].reset();bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();}

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
        $.ajax({url:BASE_URL+'/vehicle-years/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){btnReset($btn);$('#importStep1').hide();$('#importStep2').removeClass('d-none');
            if(r.status===200||r.status===201){var d=r.data||{};$('#importSummary').html('<div class="alert alert-'+(d.errors&&d.errors.length?'warning':'success')+' py-2"><strong>'+d.success+'</strong> imported'+(d.errors&&d.errors.length?', <strong>'+d.errors.length+'</strong> errors':'')+'</div>');
                if(d.errors&&d.errors.length){$('#importErrorActions').removeClass('d-none');var tbl='<table class="table table-sm table-bordered"><thead><tr><th>Row</th><th>Data</th><th>Error</th><th>Action</th></tr></thead><tbody>';d.errors.forEach(function(er){tbl+='<tr><td>'+er.row+'</td><td class="small">'+JSON.stringify(er.data)+'</td><td class="text-danger small">'+H.esc(er.error)+'</td><td><button class="btn btn-sm btn-outline-warning btn-retry-row" data-row=\''+JSON.stringify(er.data)+'\'>Retry</button></td></tr>';});tbl+='</tbody></table>';$('#importResultTable').html(tbl);}
                loadData();
            }else{$('#importSummary').html('<div class="alert alert-danger py-2">'+H.esc(r.message||'Failed')+'</div>');}
        },error:function(){btnReset($btn);toastr.error('Network error.');}});
    });
    $(document).on('click','.btn-retry-row',function(){var $btn=$(this);var data=JSON.parse($btn.attr('data-row'));btnLoading($btn);
        $.post(BASE_URL+'/vehicle-years/import/single',data,function(r){btnReset($btn);if(r.status===200||r.status===201){$btn.closest('tr').fadeOut();toastr.success('Imported.');loadData();}else toastr.error(r.message||'Failed.');});
    });
});
