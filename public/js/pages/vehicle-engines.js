/* vehicle-engines.js — list page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};
function _filters(){return{page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),company_id:$('#filterCompany').length?$('#filterCompany').val():'',start_year_from:$('#filterStartYearFrom').val()||'',start_year_to:$('#filterStartYearTo').val()||'',end_year_from:$('#filterEndYearFrom').val()||'',end_year_to:$('#filterEndYearTo').val()||'',kw_min:$('#filterKwMin').val()||'',hp_min:$('#filterHpMin').val()||'',variant_ids:($('#filterVariant').val()||[]).join(','),sort_field:_sort.field,sort_dir:_sort.dir};}

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
            var vNames = r.variant_names || '';
            var vTitle = vNames ? vNames : 'No variants linked';
            var variantBadge = '<a href="#" class="text-decoration-none" onclick="openVariantModal(\''+r.uuid+'\',\''+H.esc(r.motor_code||'')+'\');return false;">';
            if (r.variant_count) {
                variantBadge += '<span class="badge bg-indigo-lt" style="cursor:pointer;" title="'+H.esc(vTitle)+'" data-bs-toggle="tooltip" data-bs-html="true">'+r.variant_count+' variant'+(r.variant_count>1?'s':'')+'</span>';
            } else {
                variantBadge += '<span class="badge bg-secondary-lt" style="cursor:pointer;" title="Click to add variants" data-bs-toggle="tooltip"><i class="bi bi-plus-lg me-1"></i>Add</span>';
            }
            variantBadge += '</a>';

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewRec(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverRec(\''+r.uuid+'\',\''+H.esc(r.motor_code||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/vehicle-engines/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="toggleRec(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(parseInt(r.status)?'off':'on')+' me-2 text-'+(parseInt(r.status)?'warning':'success')+'"></i>'+(parseInt(r.status)?'Deactivate':'Activate')+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.manufacturer_engine||r.motor_code||'')+'\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>Usage</a></li>';
                if(deletable)acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delRec(\''+r.uuid+'\',\''+H.esc(r.motor_code||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':(isGlobal?' class="table-light"':'');
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td>'+H.trunc(r.motor_code||'',20,'fw-semibold font-monospace')+'</td>'+
                '<td>'+H.trunc(r.manufacturer_engine||'',25,'fw-medium')+globalBadge+'</td>'+
                '<td>'+variantBadge+'</td>'+
                '<td class="d-none d-lg-table-cell text-muted small">'+(r.kw?'<span title="'+r.kw+' Kilowatts" data-bs-toggle="tooltip">'+r.kw+'</span>':'—')+'</td>'+
                '<td class="d-none d-lg-table-cell text-muted small">'+(r.hp?'<span title="'+r.hp+' Horsepower" data-bs-toggle="tooltip">'+r.hp+'</span>':'—')+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing')+' '+(pg.from||1)+'–'+(pg.to||data.length)+' '+T('general.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
        if(typeof smsInitTooltips==='function') smsInitTooltips('#tableBody');
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

        // Detail table
        h+='<div class="border-top pt-3 mb-3">';
        h+='<table class="table table-sm mb-0" style="font-size:13px;"><tbody>';
        h+='<tr><td class="text-muted fw-medium" style="width:160px;"><i class="bi bi-hash me-1"></i>Motor Code</td><td><span class="fw-semibold font-monospace">'+H.esc(rec.motor_code||'')+'</span></td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-gear me-1"></i>Engine Name</td><td>'+H.esc(rec.manufacturer_engine||'')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-calendar me-1"></i>Start Year</td><td>'+(rec.start_year||'<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-calendar-check me-1"></i>End Year</td><td>'+(rec.end_year||'<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-lightning me-1"></i>KW (Kilowatts)</td><td>'+(rec.kw?'<strong>'+rec.kw+'</strong> kW':'<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-speedometer me-1"></i>HP (Horsepower)</td><td>'+(rec.hp?'<strong>'+rec.hp+'</strong> hp':'<span class="text-muted">—</span>')+'</td></tr>';
        h+='<tr><td class="text-muted fw-medium"><i class="bi bi-building me-1"></i>Company</td><td>'+H.esc(rec.company_name||'—')+'</td></tr>';
        h+='</tbody></table></div>';

        // Variants with details
        h+='<div class="border-top pt-3 mb-3"><div class="fw-medium mb-2"><i class="bi bi-sliders2-vertical me-1 text-primary"></i>Linked Variants <span class="badge bg-indigo-lt">'+vars.length+'</span></div>';
        if(vars.length){
            h+='<div class="d-flex flex-wrap gap-1">';
            vars.forEach(function(v){ h+='<span class="badge bg-indigo-lt px-2 py-1" title="'+H.esc(v.name)+'" data-bs-toggle="tooltip">'+H.esc(v.name)+'</span>'; });
            h+='</div>';
        } else {
            h+='<div class="text-muted small fst-italic">No variants linked to this engine.</div>';
        }
        h+='</div>';

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

function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title', 'Usage') + ': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/vehicle-engines/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + T('general.failed_load', 'Failed.') + '</div>'); return; }
        smsRenderUsageBody(res.data, 'vehicle-engines', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">' + T('general.network_error', 'Network error.') + '</div>'); });
}

function toggleRec(uuid){smsConfirm({title:T('general.confirm','Confirm'),text:T('general.toggle_confirm','Toggle status?'),onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/'+uuid+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function delRec(uuid,name){smsConfirm({title:T('btn.delete','Delete'),text:T('general.delete_confirm','Delete')+ ' <strong>'+name+'</strong>?',btnClass:'btn-danger',onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/'+uuid+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(uuid,name){smsConfirm({title:T('bulk.recover','Recover'),text:T('bulk.recover','Recover')+' <strong>'+name+'</strong>?',btnClass:'btn-success',onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/'+uuid+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

function updateBulk(){var c=$('.row-chk:checked').length;_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(c);if(c>0)$('#bulkBar').removeClass('d-none');else $('#bulkBar').addClass('d-none');}
function bulkAction(action){if(!_sel.length)return;smsConfirm({title:action.charAt(0).toUpperCase()+action.slice(1),text:action+' '+_sel.length+' items?',onConfirm:function(){$.post(BASE_URL+'/vehicle-engines/bulk-action',{action:action,uuids:_sel},function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

function doExport(fmt){var f=_filters();f.format=fmt;if(fmt==='print'){var w=window.open('','_blank');w.document.write('<html><body><p>Loading...</p></body></html>');$.post(BASE_URL+'/vehicle-engines/export',f,function(r){if(r.status===200&&r.data&&r.data.rows){var rows=r.data.rows;if(!rows.length){w.document.body.innerHTML='<p>No data</p>';return;}var hd=Object.keys(rows[0]);var tbl='<table border=1 cellpadding=4 cellspacing=0><tr>'+hd.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr>';rows.forEach(function(row){tbl+='<tr>'+hd.map(function(h){return '<td>'+(row[h]||'')+'</td>';}).join('')+'</tr>';});tbl+='</table>';w.document.body.innerHTML=tbl;w.print();}else{w.document.body.innerHTML='<p>Failed</p>';}});return;}
    if(fmt==='csv'||fmt==='excel'){var form=$('<form method="POST" action="'+BASE_URL+'/vehicle-engines/export"></form>');for(var k in f)form.append('<input type="hidden" name="'+k+'" value="'+f[k]+'"/>');$('body').append(form);form.submit();form.remove();return;}
    if(fmt==='pdf'){$.post(BASE_URL+'/vehicle-engines/export',f,function(r){if(r.status===200)toastr.info(T('msg.pdf_export','PDF export — use browser print.'));else toastr.error(T('msg.failed','Failed.'));});}}

/* Import */
function openImport(){$('#importStep1').removeClass('d-none');$('#importStep2').addClass('d-none');$('#importFile').val('');bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();}

/* ── Variant Edit from List ── */
function openVariantModal(uuid, code) {
    $('#varEngineUuid').val(uuid);
    $('#varEngineLabel').text(code);

    // Init Select2 for variant selection
    if (!$('#selVariantIds').data('select2')) {
        $('#selVariantIds').select2({
            theme: 'bootstrap-5', allowClear: true, placeholder: 'Search variants...',
            dropdownParent: $('#modalVariants'),
            ajax: {
                url: BASE_URL + '/vehicle-variants/autocomplete',
                dataType: 'json', delay: 300,
                data: function(p) { return { search: p.term || '' }; },
                processResults: function(res) {
                    return { results: (res.data || []).map(function(r) { return { id: r.id, text: r.name }; }) };
                }, cache: true
            },
            minimumInputLength: 0
        });
    }

    // Clear old selection
    $('#selVariantIds').val(null).trigger('change');

    // Load current variants for this engine
    $.get(BASE_URL + '/vehicle-engines/' + uuid + '/view-data', function(res) {
        if (res && res.status === 200) {
            var rec = res.data.record || res.data || {};
            var vars = rec.variants || [];
            vars.forEach(function(v) {
                if ($('#selVariantIds').find('option[value="' + v.id + '"]').length === 0) {
                    $('#selVariantIds').append(new Option(v.name, v.id, true, true));
                }
            });
            $('#selVariantIds').trigger('change');
        }
    });

    bootstrap.Modal.getOrCreateInstance($('#modalVariants')[0]).show();
}
window.openVariantModal = openVariantModal;

$(function(){
    smsInitPerPage('#perPageSel');_pp=parseInt($('#perPageSel').val())||15;
    loadData();
    $('#perPageSel').on('change',function(){_pp=parseInt($(this).val())||15;_page=1;loadData();});
    var _debounce;
    $('#searchInput').on('input',function(){clearTimeout(_debounce);_debounce=setTimeout(function(){_page=1;loadData();},400);});

    // Sidebar variant Select2
    $('#filterVariant').select2({
        theme:'bootstrap-5', allowClear:true, placeholder:'Search variants...',
        dropdownParent: $('#filterSidebar'),
        ajax:{url:BASE_URL+'/vehicle-variants/autocomplete',dataType:'json',delay:250,
            data:function(p){return{search:p.term||''};},
            processResults:function(r){return{results:(r.data||[]).map(function(x){return{id:x.id,text:x.name};})};},cache:true},
        minimumInputLength:0
    });

    // Apply filters
    $('#btnApplyFilters').on('click',function(){_page=1;loadData();updateFilterCount();});

    // Clear all filters
    function clearAllFilters(){
        $('#searchInput').val('');$('#filterStatus').val('');$('#filterDeleted').val('');
        $('#filterStartYearFrom,#filterStartYearTo,#filterEndYearFrom,#filterEndYearTo,#filterKwMin,#filterHpMin').val('');
        $('#filterVariant').val(null).trigger('change');
        if($('#filterCompany').length)$('#filterCompany').val('all');
        _page=1;loadData();updateFilterCount();
    }
    $('#btnClearFilters').on('click',clearAllFilters);
    $('#btnClearFilters2').on('click',clearAllFilters);

    // Filter count badge
    function updateFilterCount(){
        var n=0;
        if($('#filterStatus').val())n++;
        if($('#filterDeleted').val())n++;
        if($('#filterCompany').length&&$('#filterCompany').val()&&$('#filterCompany').val()!=='all')n++;
        if($('#filterStartYearFrom').val()||$('#filterStartYearTo').val())n++;
        if($('#filterEndYearFrom').val()||$('#filterEndYearTo').val())n++;
        if($('#filterKwMin').val())n++;
        if($('#filterHpMin').val())n++;
        if(($('#filterVariant').val()||[]).length)n++;
        if(n>0){$('#filterCount').text(n).removeClass('d-none');}else{$('#filterCount').addClass('d-none');}
    }
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p&&p!==_page){_page=p;loadData();}});
    $(document).on('click','.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}_page=1;loadData();});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',function(){updateBulk();});
    $('#btnClearBulk').on('click',function(){$('#selectAll').prop('checked',false);$('.row-chk').prop('checked',false);updateBulk();});

    // Import form
    var _importResults = [];
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this);var $btn=$('#btnImport');btnLoading($btn);
        $.ajax({url:BASE_URL+'/vehicle-engines/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){
                btnReset($btn);$('#importStep1').addClass('d-none');$('#importStep2').removeClass('d-none');
                if(r.status!==200){$('#importSummary').html('<div class="alert alert-danger py-2">'+H.esc(r.message||'Failed')+'</div>');return;}
                _importResults = (r.data && r.data.results) || [];
                showImportResults(_importResults);
            },error:function(){btnReset($btn);toastr.error(T('general.network_error','Network error.'));}});
    });

    function showImportResults(results){
        var ok=results.filter(function(r){return r.status==='success';}).length;
        var err=results.filter(function(r){return r.status==='error';}).length;
        $('#importSummary').html('<div class="d-flex gap-2 flex-wrap"><span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>'+ok+' imported</span>'+(err>0?'<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>'+err+' errors</span>':'')+'</div>');
        if(err===0){$('#importResultTable').html('<div class="text-center py-4"><div style="font-size:52px;margin-bottom:12px;">✅</div><h5 class="text-success">All '+ok+' rows imported!</h5></div>');$('#importErrorActions').addClass('d-none');loadData();return;}
        var h='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:11px;"><thead class="table-light"><tr>'+
            '<th style="width:28px;">#</th>'+
            '<th style="min-width:120px;">Engine Name</th>'+
            '<th style="min-width:80px;">Motor Code</th>'+
            '<th style="min-width:55px;">Start Yr</th>'+
            '<th style="min-width:55px;">End Yr</th>'+
            '<th style="min-width:45px;">KW</th>'+
            '<th style="min-width:45px;">HP</th>'+
            '<th style="min-width:120px;">Variant Names</th>'+
            '<th style="min-width:110px;">Error</th>'+
            '<th style="width:48px;">Retry</th>'+
            '</tr></thead><tbody>';
        results.forEach(function(r,i){
            if(r.status!=='error') return;
            var d=r.data||{};
            var mfg=r.manufacturer_engine||d.manufacturer_engine||d['manufacturer engine']||d.engine||'';
            var mc=r.motor_code||d.motor_code||d['motor code']||d.code||'';
            var sy=d.start_year||d['start year']||'';
            var ey=d.end_year||d['end year']||'';
            var kw=d.kw||d.kilowatts||'';
            var hp=d.hp||d.horsepower||'';
            var vn=d.variant_names||d['variant names']||d.variants||'';
            h+='<tr class="table-danger" id="impRow'+i+'">'+
                '<td>'+r.row+'</td>'+
                '<td><input type="text" class="form-control form-control-sm imp-mfg" value="'+H.esc(mfg)+'" placeholder="Engine *" maxlength="255"/></td>'+
                '<td><input type="text" class="form-control form-control-sm imp-code" value="'+H.esc(mc)+'" placeholder="Code *" maxlength="255"/></td>'+
                '<td><input type="number" class="form-control form-control-sm imp-sy" value="'+H.esc(sy)+'" style="width:55px;"/></td>'+
                '<td><input type="number" class="form-control form-control-sm imp-ey" value="'+H.esc(ey)+'" style="width:55px;"/></td>'+
                '<td><input type="number" class="form-control form-control-sm imp-kw" value="'+H.esc(kw)+'" style="width:45px;"/></td>'+
                '<td><input type="number" class="form-control form-control-sm imp-hp" value="'+H.esc(hp)+'" style="width:45px;"/></td>'+
                '<td><input type="text" class="form-control form-control-sm imp-vn" value="'+H.esc(vn)+'" placeholder="var1;var2"/></td>'+
                '<td class="small text-danger">'+H.esc(r.message||'Error')+'</td>'+
                '<td><button class="btn btn-sm btn-outline-warning" onclick="retryRow('+i+')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';
        });
        h+='</tbody></table></div>';
        if(ok>0)$('#importResultTable').html('<div class="alert alert-success py-2 mb-3 small"><i class="bi bi-check-circle me-1"></i><strong>'+ok+' rows imported.</strong> '+err+' rows need attention:</div>'+h);
        else $('#importResultTable').html(h);
        $('#importErrorActions').removeClass('d-none');
        loadData();
    }

    window.retryRow = function(idx){
        var r=_importResults[idx]; if(!r||r.status==='success') return;
        var $tr=$('#impRow'+idx);
        var mfg=$tr.find('.imp-mfg').val().trim();
        var mc=$tr.find('.imp-code').val().trim();
        if(!mfg){toastr.error(T('msg.name_required','Engine name is required.'));return;}
        if(!mc){toastr.error(T('msg.motor_code_required','Motor code is required.'));return;}
        if(mfg.length>255){toastr.error(T('msg.engine_name_max','Engine name max 255 chars.'));return;}
        if(mc.length>255){toastr.error(T('msg.motor_code_max','Motor code max 255 chars.'));return;}
        var $b=$tr.find('button');btnLoading($b);
        $.post(BASE_URL+'/vehicle-engines/import/single',{
            manufacturer_engine:mfg, motor_code:mc,
            start_year:$tr.find('.imp-sy').val(), end_year:$tr.find('.imp-ey').val(),
            kw:$tr.find('.imp-kw').val(), hp:$tr.find('.imp-hp').val(),
            variant_names:$tr.find('.imp-vn').val()
        },function(res){
            btnReset($b);
            if(res.status===200||res.status===201){
                $tr.removeClass('table-danger').addClass('table-success');
                $tr.find('input').prop('disabled',true).addClass('bg-light');
                $tr.find('td:eq(8)').html('<span class="text-success"><i class="bi bi-check-circle me-1"></i>OK</span>');
                $tr.find('td:eq(9)').html('—');
                r.status='success'; toastr.success(mc+' imported.'); loadData();
            } else toastr.error(res.message||'Failed.');
        });
    };

    // Save variants from modal
    $('#btnSaveVariants').on('click', function() {
        var uuid = $('#varEngineUuid').val();
        var ids = $('#selVariantIds').val() || [];
        var $btn = $(this); btnLoading($btn);
        $.post(BASE_URL + '/vehicle-engines/' + uuid + '/update-variants', {
            variant_ids: JSON.stringify(ids)
        }, function(res) {
            btnReset($btn);
            if (res.status === 200) {
                toastr.success(res.message || 'Variants updated.');
                bootstrap.Modal.getOrCreateInstance($('#modalVariants')[0]).hide();
                loadData();
            } else {
                toastr.error(res.message || 'Failed.');
            }
        }).fail(function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); });
    });

    $('#btnRetryAllErrors').on('click',function(){
        _importResults.forEach(function(r,i){if(r.status==='error')retryRow(i);});
    });
});