/* vehicle-engines.js — list page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};
function _filters(){return{page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),company_id:$('#filterCompany').length?$('#filterCompany').val():'',sort_field:_sort.field,sort_dir:_sort.dir};}

function loadData(){
    $('#tableBody').html('<tr><td colspan="10" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading…')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/vehicle-engines/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="10" class="text-center py-4 text-danger">'+T('general.failed_load','Failed.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="10" class="text-center py-5 text-muted"><i class="bi bi-gear-wide d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('vehicle_engines.no_data','No data')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
            var isGlobal=!!r.is_global;
            var globalBadge=isGlobal?' <span class="badge bg-azure-lt" style="font-size:9px;">Global</span>':'';
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;
            var variantBadge=r.variant_count?'<span class="badge bg-indigo-lt">'+r.variant_count+' variant'+(r.variant_count>1?'s':'')+'</span>':'<span class="text-muted small">—</span>';

            var acts='<div class="btn-group btn-group-sm">';
            acts+='<button class="btn btn-ghost-primary" onclick="viewRec(\''+r.uuid+'\')" title="'+T('general.preview','View')+'"><i class="bi bi-eye"></i></button>';
            if(deleted){
                acts+='<button class="btn btn-ghost-success" onclick="recoverRec(\''+r.uuid+'\',\''+H.esc(r.motor_code||'')+'\')" title="Recover"><i class="bi bi-arrow-counterclockwise"></i></button>';
            }else{
                if(editable)acts+='<a href="'+BASE_URL+'/vehicle-engines/'+r.uuid+'/edit" class="btn btn-ghost-secondary" title="'+T('btn.edit','Edit')+'"><i class="bi bi-pencil"></i></a>';
                if(editable)acts+='<button class="btn btn-ghost-'+(parseInt(r.status)?'warning':'success')+'" onclick="toggleRec(\''+r.uuid+'\')"><i class="bi bi-toggle-'+(parseInt(r.status)?'on':'off')+'"></i></button>';
                if(deletable)acts+='<button class="btn btn-ghost-danger" onclick="delRec(\''+r.uuid+'\',\''+H.esc(r.motor_code||'')+'\')"><i class="bi bi-trash3"></i></button>';
            }
            acts+='</div>';
            var rowClass=deleted?' class="table-secondary"':(isGlobal?' class="table-light"':'');
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td><span class="fw-semibold font-monospace">'+H.esc(r.motor_code||'')+'</span></td>'+
                '<td><span class="fw-medium">'+H.esc(r.manufacturer_engine||'')+'</span>'+globalBadge+'</td>'+
                '<td>'+variantBadge+'</td>'+
                '<td class="d-none d-lg-table-cell text-muted small">'+(r.kw||'—')+'</td>'+
                '<td class="d-none d-lg-table-cell text-muted small">'+(r.hp||'—')+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing')+' '+(pg.from||1)+'–'+(pg.to||data.length)+' '+T('general.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="10" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">…</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'" ><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewRec(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/vehicle-engines/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var rec=res.data.record||{},langs=res.data.languages||[],trans=rec.translations||[],vars=rec.variants||[];
        var h='<div class="p-4">';
        h+='<div class="text-center mb-3"><h4 class="mb-1 font-monospace">'+H.esc(rec.motor_code||'')+'</h4>';
        h+='<div class="text-muted">'+H.esc(rec.manufacturer_engine||'')+'</div>';
        h+='<div class="mt-1">'+(parseInt(rec.status)?'<span class="badge bg-success-lt">'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');
        if(rec.is_global)h+=' <span class="badge bg-azure-lt">Global</span>';
        h+='</div>';
        if(rec.company_name)h+='<div class="text-muted small mt-1"><i class="bi bi-building me-1"></i>'+H.esc(rec.company_name)+'</div>';
        h+='</div>';

        // Specs
        h+='<div class="row g-2 mb-3 text-center">';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">Start Year</div><div class="fw-medium">'+(rec.start_year||'—')+'</div></div></div>';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">End Year</div><div class="fw-medium">'+(rec.end_year||'—')+'</div></div></div>';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">KW</div><div class="fw-medium">'+(rec.kw||'—')+'</div></div></div>';
        h+='<div class="col-3"><div class="border rounded p-2"><div class="text-muted small">HP</div><div class="fw-medium">'+(rec.hp||'—')+'</div></div></div>';
        h+='</div>';

        // Variants
        if(vars.length){
            h+='<div class="border-top pt-3 mb-3"><div class="fw-medium mb-2"><i class="bi bi-sliders2-vertical me-1 text-primary"></i>'+T('vehicle_engines.variants','Variants')+' <span class="badge bg-indigo-lt">'+vars.length+'</span></div>';
            h+='<div class="d-flex flex-wrap gap-1">';
            vars.forEach(function(v){ h+='<span class="badge bg-secondary-lt">'+H.esc(v.name)+'</span>'; });
            h+='</div></div>';
        }

        // Translations
        if(trans.length){
            h+='<div class="border-top pt-3 mb-3"><div class="fw-medium mb-2"><i class="bi bi-translate me-1 text-primary"></i>'+T('vehicle_engines.translations','Translations')+'</div><div class="row g-2">';
            trans.forEach(function(tr){h+='<div class="col-6"><div class="border rounded p-2 small">'+(tr.flag?'<span class="me-1">'+tr.flag+'</span>':'')+tr.language_name+': <strong>'+H.esc(tr.name)+'</strong></div></div>';});
            h+='</div></div>';
        }

        h+='<div class="border-top pt-3">';
        h+='<div class="mb-1"><span class="text-muted small">'+T('general.created_at','Created')+':</span> '+smsFormatDateTime(rec.created_at)+'</div>';
        h+='<div><span class="text-muted small">'+T('general.updated_at','Updated')+':</span> '+smsFormatDateTime(rec.updated_at)+'</div>';
        h+='</div></div>';
        $b.html(h);
    });
}

function toggleRec(uuid){smsConfirm({title:T('general.confirm','Confirm'),text:T('general.toggle_confirm','Toggle status?'),onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/'+uuid+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function delRec(uuid,name){smsConfirm({title:T('btn.delete','Delete'),text:T('general.delete_confirm','Delete')+ ' <strong>'+name+'</strong>?',btnClass:'btn-danger',onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/'+uuid+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(uuid,name){smsConfirm({title:'Recover',text:'Recover <strong>'+name+'</strong>?',btnClass:'btn-success',onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/'+uuid+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

function updateBulk(){var c=$('.row-chk:checked').length;_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(c);if(c>0)$('#bulkBar').removeClass('d-none');else $('#bulkBar').addClass('d-none');}
function bulkAction(action){if(!_sel.length)return;smsConfirm({title:action.charAt(0).toUpperCase()+action.slice(1),text:action+' '+_sel.length+' items?',onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/bulk-action',{action:action,uuids:_sel},function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

function doExport(fmt){var f=_filters();f.format=fmt;if(fmt==='print'){var w=window.open('','_blank');w.document.write('<html><body><p>Loading...</p></body></html>');$.post(BASE_URL+'/vehicle-engines/export',f,function(r){if(r.status===200&&r.data&&r.data.rows){var rows=r.data.rows;if(!rows.length){w.document.body.innerHTML='<p>No data</p>';return;}var hd=Object.keys(rows[0]);var tbl='<table border=1 cellpadding=4 cellspacing=0><tr>'+hd.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr>';rows.forEach(function(row){tbl+='<tr>'+hd.map(function(h){return '<td>'+(row[h]||'')+'</td>';}).join('')+'</tr>';});tbl+='</table>';w.document.body.innerHTML=tbl;w.print();}else{w.document.body.innerHTML='<p>Failed</p>';}});return;}
    if(fmt==='csv'||fmt==='excel'){var form=$('<form method="POST" action="'+BASE_URL+'/vehicle-engines/export"></form>');for(var k in f)form.append('<input type="hidden" name="'+k+'" value="'+f[k]+'"/>');$('body').append(form);form.submit();form.remove();return;}
    if(fmt==='pdf'){$.post(BASE_URL+'/vehicle-engines/export',f,function(r){if(r.status===200)toastr.info('PDF export — use browser print.');else toastr.error('Failed.');});}}

/* Import */
function openImport(){$('#importStep1').removeClass('d-none');$('#importStep2').addClass('d-none');$('#importFile').val('');bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();}
$(function(){
    smsInitPerPage('#perPageSel');_pp=parseInt($('#perPageSel').val())||15;
    loadData();
    $('#perPageSel').on('change',function(){_pp=parseInt($(this).val())||15;_page=1;loadData();});
    $('#searchInput').on('keyup',$.debounce(400,function(){_page=1;loadData();}));
    $('#filterStatus,#filterDeleted,#filterCompany').on('change',function(){_page=1;loadData();});
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus').val('');$('#filterDeleted').val('');if($('#filterCompany').length)$('#filterCompany').val('all');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p&&p!==_page){_page=p;loadData();}});
    $(document).on('click','.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}_page=1;loadData();});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',function(){updateBulk();});
    $('#btnClearBulk').on('click',function(){$('#selectAll').prop('checked',false);$('.row-chk').prop('checked',false);updateBulk();});

    // Import form
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this);var $btn=$('#btnImport');btnLoading($btn);
        $.ajax({url:BASE_URL+'/vehicle-engines/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){btnReset($btn);$('#importStep1').addClass('d-none');$('#importStep2').removeClass('d-none');
            if(r.status===200||r.status===201){var d=r.data||{};var sum='<div class="alert alert-'+(d.errors&&d.errors.length?'warning':'success')+' py-2"><strong>'+d.success+'</strong> imported'+(d.errors&&d.errors.length?', <strong>'+d.errors.length+'</strong> errors':'')+'</div>';$('#importSummary').html(sum);
                if(d.errors&&d.errors.length){$('#importErrorActions').removeClass('d-none');var tbl='<div class="table-responsive"><table class="table table-sm table-bordered"><thead><tr><th>Row</th><th>Data</th><th>Error</th><th>Action</th></tr></thead><tbody>';
                    d.errors.forEach(function(er,idx){tbl+='<tr data-idx="'+idx+'"><td>'+er.row+'</td><td class="small text-break">'+JSON.stringify(er.data)+'</td><td class="text-danger small">'+H.esc(er.error)+'</td><td><button class="btn btn-sm btn-outline-warning btn-retry-row" data-row=\''+JSON.stringify(er.data)+'\'>Retry</button></td></tr>';});
                    tbl+='</tbody></table></div>';$('#importResultTable').html(tbl);
                }else{$('#importResultTable').html('');$('#importErrorActions').addClass('d-none');}
                loadData();
            }else{$('#importSummary').html('<div class="alert alert-danger py-2">'+H.esc(r.message||'Failed')+'</div>');}
        },error:function(){btnReset($btn);toastr.error('Network error.');}});
    });

    $(document).on('click','.btn-retry-row',function(){var $btn=$(this);var data=JSON.parse($btn.attr('data-row'));btnLoading($btn);
        $.post(BASE_URL+'/vehicle-engines/import/single',data,function(r){btnReset($btn);if(r.status===200||r.status===201){$btn.closest('tr').fadeOut();toastr.success('Row imported.');loadData();}else toastr.error(r.message||'Failed.');});
    });
});
