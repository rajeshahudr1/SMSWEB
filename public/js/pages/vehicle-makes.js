/* vehicle-makes.js — list page with advanced offcanvas filters */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var _importResults = [];
var T=function(k,f){return typeof SMS_T==='function'?SMS_T(k,f):(f||k);};

function _filters(){
    return {
        page: _page, per_page: _pp,
        search: $('#searchInput').val().trim(),
        status: $('#filterStatus').val(),
        show_deleted: $('#filterDeleted').val(),
        company_id: $('#filterCompany').length ? $('#filterCompany').val() : '',
        vehicle_type_ids: ($('#filterVehicleType').val()||[]).join(','),
        sort_field: _sort.field, sort_dir: _sort.dir
    };
}

/* ══════════════════════════════════════════════════════
   ACTIVE FILTER CHIPS — show below search bar
══════════════════════════════════════════════════════ */
function updateFilterChips() {
    var chips = [], count = 0;
    var co = $('#filterCompany').length ? $('#filterCompany').val() : 'all';
    if (co && co !== 'all') {
        var cTxt = co === 'global' ? 'Global' : ($('#filterCompany option:selected').text() || co);
        chips.push('<span class="badge bg-blue-lt pe-1">' + H.esc(cTxt) + ' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="$(\'#filterCompany\').val(\'all\').trigger(\'change\');applyFilters();"></button></span>');
        count++;
    }
    var types = $('#filterVehicleType').val() || [];
    if (types.length) {
        var names = [];
        $('#filterVehicleType option:selected').each(function(){ names.push($(this).text()); });
        chips.push('<span class="badge bg-indigo-lt pe-1">' + H.esc(names.join(', ')) + ' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="$(\'#filterVehicleType\').val(null).trigger(\'change\');applyFilters();"></button></span>');
        count++;
    }
    var st = $('#filterStatus').val();
    if (st !== '') { chips.push('<span class="badge bg-'+(st==='1'?'success':'danger')+'-lt pe-1">'+(st==='1'?'Active':'Inactive')+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="$(\'#filterStatus\').val(\'\');applyFilters();"></button></span>'); count++; }
    var del = $('#filterDeleted').val();
    if (del) { chips.push('<span class="badge bg-dark-lt pe-1">'+(del==='only'?'Deleted Only':'All Records')+' <button class="btn-close btn-close-sm ms-1" style="font-size:8px;" onclick="$(\'#filterDeleted\').val(\'\');applyFilters();"></button></span>'); count++; }

    $('#activeFiltersBar').html(chips.join(' '));
    if (count > 0) { $('#filterCount').text(count).removeClass('d-none'); } else { $('#filterCount').addClass('d-none'); }
}

function applyFilters() { _page = 1; updateFilterChips(); loadData(); }

/* ══════════════════════════════════════════════════════
   LOAD DATA
══════════════════════════════════════════════════════ */
function loadData(){
    $('#tableBody').html('<tr><td colspan="8" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading…')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/vehicle-makes/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="8" class="text-center py-4 text-danger">'+T('general.failed_to_load','Failed to load.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="8" class="text-center py-5 text-muted"><i class="bi bi-building d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('msg.no_vehicle_makes','No vehicle makes found')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var status=deleted?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>Deleted</span>':(parseInt(r.status)?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
            var isGlobal=!!r.is_global;
            var globalBadge=isGlobal?' <span class="badge bg-azure-lt" style="font-size:9px;">Global</span>':'';
            var editable=r.is_editable!==false&&!deleted;
            var deletable=r.is_deletable!==false&&!deleted;

            // Image
            var imgSrc=r.display_image_url||'/images/no-image.svg';
            var imgTag='<img src="'+H.esc(imgSrc)+'" class="rounded border" style="width:36px;height:36px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';this.style.opacity=\'.5\';"/>';

            // Type badge
            var typeBadge=r.vehicle_type_name?'<span class="badge bg-blue-lt">'+H.esc(r.vehicle_type_name)+'</span>':'<span class="text-muted small">—</span>';

            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown" data-bs-auto-close="true" title="Actions"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end shadow-sm">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewRec(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>View Details</a></li>';
            if(deleted){acts+='<li><a class="dropdown-item" href="#" onclick="recoverRec(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>Recover</a></li>';}
            else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/vehicle-makes/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>Edit</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="toggleRec(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(parseInt(r.status)?'off':'on')+' me-2 text-'+(parseInt(r.status)?'warning':'success')+'"></i>'+(parseInt(r.status)?'Deactivate':'Activate')+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-diagram-3 me-2 text-info"></i>Usage</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="delRec(\''+r.uuid+'\',\''+H.esc(r.name||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>Delete</a></li>';}
            }
            acts+='</ul></div>';
            var rowClass=deleted?' class="table-secondary"':(isGlobal?' class="table-light"':'');
            rows+='<tr'+rowClass+'><td style="padding-left:1rem;"><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>'+
                '<td class="text-muted small">'+(start+i+1)+'</td>'+
                '<td>'+imgTag+'</td>'+
                '<td><span class="fw-medium">'+H.esc(r.name||'')+'</span>'+globalBadge+'</td>'+
                '<td>'+typeBadge+'</td>'+
                '<td>'+status+'</td>'+
                '<td class="d-none d-md-table-cell text-muted small">'+smsFormatDateTime(r.created_at)+'</td>'+
                '<td class="text-end">'+acts+'</td></tr>';
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text('Showing '+(pg.from||1)+'–'+(pg.to||data.length)+' of '+(pg.total||0));
        $('#tablePagination').html(buildPagination(pg,function(p){_page=p;loadData();}));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="8" class="text-center py-4 text-danger">Network error.</td></tr>');});
}

/* ══════════════════════════════════════════════════════
   VIEW / TOGGLE / DELETE / RECOVER / BULK
══════════════════════════════════════════════════════ */
function viewRec(uuid){var $b=$('#viewBody');$b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL+'/vehicle-makes/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">' + T('general.not_found','Not found.') + '</div>');return;}
        var rec=res.data.record||res.data||{},trans=rec.translations||[];
        var h='<div class="p-4"><div class="text-center mb-3">';
        if(rec.display_image_url)h+='<img src="'+H.esc(rec.display_image_url)+'" class="rounded border mb-2" style="max-height:120px;object-fit:contain;" onerror="this.style.display=\'none\'"/><br/>';
        h+='<h4 class="mb-1">'+H.esc(rec.name||'')+'</h4>';
        if(rec.vehicle_type_name)h+='<div class="mb-1"><span class="badge bg-blue-lt">'+H.esc(rec.vehicle_type_name)+'</span></div>';
        h+='<div>'+(parseInt(rec.status)?'<span class="badge bg-success-lt">Active</span>':'<span class="badge bg-danger-lt">Inactive</span>');
        h+='</div>';
        h+='</div>';
        if(trans.length){h+='<div class="border-top pt-3 mb-3"><div class="fw-medium mb-2"><i class="bi bi-translate me-1 text-primary"></i>Translations</div><div class="row g-2">';trans.forEach(function(tr){h+='<div class="col-6"><div class="border rounded p-2 small">'+(tr.flag?'<span class="me-1">'+tr.flag+'</span>':'')+tr.language_name+': <strong>'+H.esc(tr.name)+'</strong></div></div>';});h+='</div></div>';}
        h+='<div class="border-top pt-3"><div class="mb-1"><span class="text-muted small">Created:</span> '+smsFormatDateTime(rec.created_at)+'</div><div><span class="text-muted small">Updated:</span> '+smsFormatDateTime(rec.updated_at)+'</div></div></div>';
        $b.html(h);
    });
}

function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text(T('usage.title', 'Usage') + ': ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/vehicle-makes/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">' + T('general.failed_load', 'Failed.') + '</div>'); return; }
        smsRenderUsageBody(res.data, 'vehicle-makes', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">' + T('general.network_error', 'Network error.') + '</div>'); });
}

function toggleRec(uuid){smsConfirm({title:T('general.confirm','Confirm'),text:T('msg.toggle_status','Toggle status?'),onConfirm:function(){$.post(BASE_URL+'/vehicle-makes/'+uuid+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function delRec(uuid,name){smsConfirm({title:T('btn.delete','Delete'),text:T('btn.delete','Delete')+' <strong>'+name+'</strong>?',btnClass:'btn-danger',onConfirm:function(){$.post(BASE_URL+'/vehicle-makes/'+uuid+'/delete',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}
function recoverRec(uuid,name){smsConfirm({title:T('bulk.recover','Recover'),text:T('bulk.recover','Recover')+' <strong>'+name+'</strong>?',btnClass:'btn-success',onConfirm:function(){$.post(BASE_URL+'/vehicle-makes/'+uuid+'/recover',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

function updateBulk(){var c=$('.row-chk:checked').length;_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(c);if(c>0)$('#bulkBar').removeClass('d-none');else $('#bulkBar').addClass('d-none');}
function bulkAction(action){if(!_sel.length)return;smsConfirm({title:action,text:action+' '+_sel.length+' items?',onConfirm:function(){$.post(BASE_URL+'/vehicle-makes/bulk-action',{action:action,uuids:_sel},function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}});}

/* ══════════════════════════════════════════════════════
   EXPORT — CSV, Excel, PDF direct download; Print via window
══════════════════════════════════════════════════════ */
function doExport(fmt){
    var p=_filters();delete p.page;delete p.per_page;p.format=fmt;
    if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/vehicle-makes/export?'+$.param(p);return;}
    // Print
    $.post(BASE_URL+'/vehicle-makes/export',p,function(res){
        if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);
        var html='<html><head><title>Vehicle Makes</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Vehicle Makes ('+rows.length+')</h2><table><thead><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';
        rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    });
}

/* ══════════════════════════════════════════════════════
   IMPORT — with make name + vehicle type columns
══════════════════════════════════════════════════════ */
/* ── Import ── */
var _pollTimer = null;
function openImport(){if(_pollTimer){clearInterval(_pollTimer);_pollTimer=null;}$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').addClass('d-none');$('#frmImport')[0].reset();bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).show();}
function showImportProgress(jobId,total){$('#importProcessing').addClass('d-none');$('#importStep1').addClass('d-none');$('#importStep2').addClass('d-none');$('#importStep3').removeClass('d-none');$('#impTotal').text(total.toLocaleString());$('#impProcessed').text('0');$('#impSuccess').text('0');$('#impErrors').text('0');$('#impPercent').text('0%');$('#impProgressBar').css('width','0%').removeClass('bg-success bg-danger');_pollTimer=setInterval(function(){pollImportStatus(jobId);},2000);}
function pollImportStatus(jobId){$.get(BASE_URL+'/notifications/job/'+jobId,function(res){if(!res||res.status!==200){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('msg.failed_check_status','Failed to check status.'));return;}var d=res.data;$('#impProcessed').text((d.processed_rows||0).toLocaleString());$('#impSuccess').text((d.success_count||0).toLocaleString());$('#impErrors').text((d.error_count||0).toLocaleString());$('#impPercent').text((d.progress||0)+'%');$('#impProgressBar').css('width',(d.progress||0)+'%');if(d.status==='completed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass(d.error_count>0?'bg-warning':'bg-success');if(typeof fetchUnreadCount==='function')fetchUnreadCount();if(d.error_count>0&&d.results&&d.results.length){toastr.warning(T('import.done','Import done:')+' '+d.success_count+' imported, '+d.error_count+' errors.');setTimeout(function(){$('#importStep3').addClass('d-none');$('#importStep2').removeClass('d-none');renderImportResults(d.results);},800);}else{toastr.success('All '+d.success_count+' rows imported!');$('#impProgressBar').addClass('bg-success').css('width','100%').text('100%');$('#importStep3').find('.d-flex').first().after('<div class="text-center py-3 mt-2"><div style="font-size:42px;">✅</div><h5 class="text-success mt-2">All '+d.success_count+' rows imported!</h5><p class="text-muted small">Check your notifications for details.</p></div>');loadData();setTimeout(function(){try{bootstrap.Modal.getOrCreateInstance($('#modalImport')[0]).hide();}catch(e){}},3000);}}else if(d.status==='failed'){clearInterval(_pollTimer);_pollTimer=null;$('#impProgressBar').addClass('bg-danger');toastr.error(T('import.failed','Import failed:')+' '+(d.error_message||'Unknown error'));if(typeof fetchUnreadCount==='function')fetchUnreadCount();}}).fail(function(){clearInterval(_pollTimer);_pollTimer=null;toastr.error(T('general.connection_lost','Connection lost.'));});}

function renderImportResults(results) {
    _importResults = results;
    var ok = results.filter(function(r){return r.status==='success';}).length;
    var err = results.filter(function(r){return r.status==='error';}).length;

    $('#importSummary').html(
        '<div class="d-flex gap-2 flex-wrap">' +
        '<span class="badge bg-success-lt px-3 py-2"><i class="bi bi-check-circle me-1"></i>' + ok + ' imported</span>' +
        '<span class="badge bg-danger-lt px-3 py-2"><i class="bi bi-x-circle me-1"></i>' + err + ' errors</span>' +
        '</div>'
    );

    var h = '<table class="table table-sm table-bordered mb-0"><thead class="table-light"><tr><th style="width:28px;">#</th><th>Make Name</th><th>Vehicle Type</th><th>Type Info</th><th style="width:50px;">Status</th><th>Message</th><th style="width:60px;">Action</th></tr></thead><tbody>';
    results.forEach(function(r, i) {
        if (r.status === 'success') {
            var tb = '';
            if (r.type_action === 'created') tb = '<span class="badge bg-warning-lt" title="New type auto-created"><i class="bi bi-plus-circle me-1"></i>New</span>';
            else if (r.type_action === 'found_company') tb = '<span class="badge bg-success-lt" title="Matched company type"><i class="bi bi-building me-1"></i>Company</span>';
            else if (r.type_action === 'found_global') tb = '<span class="badge bg-azure-lt" title="Matched global type"><i class="bi bi-globe me-1"></i>Global</span>';
            h += '<tr class="table-success" id="impRow' + i + '"><td>' + r.row + '</td><td>' + H.esc(r.name || '') + '</td><td>' + H.esc(r.vehicle_type || '') + '</td><td>' + tb + '</td><td><span class="badge bg-success-lt"><i class="bi bi-check"></i></span></td><td class="small">' + H.esc(r.message || '') + '</td><td>\u2014</td></tr>';
        } else {
            var dn = r.name || (r.data && (r.data.name || r.data['make name'] || r.data.make)) || '';
            var dt = (r.data && (r.data.vehicle_type || r.data['vehicle type'] || r.data.type)) || (r.vehicle_type || '');
            h += '<tr class="table-danger" id="impRow' + i + '" data-idx="' + i + '">' +
                '<td>' + r.row + '</td>' +
                '<td><input type="text" class="form-control form-control-sm imp-name" value="' + H.esc(dn) + '"/></td>' +
                '<td><input type="text" class="form-control form-control-sm imp-type" value="' + H.esc(dt) + '"/></td>' +
                '<td>\u2014</td>' +
                '<td><span class="badge bg-danger-lt"><i class="bi bi-x"></i></span></td>' +
                '<td class="small text-danger">' + H.esc(r.message || 'Error') + '</td>' +
                '<td><button class="btn btn-sm btn-outline-warning" onclick="retryImportRow(' + i + ')"><i class="bi bi-arrow-repeat"></i></button></td></tr>';
        }
    });
    h += '</tbody></table>';
    $('#importResultTable').html(h);
    if (err > 0) $('#importErrorActions').removeClass('d-none'); else $('#importErrorActions').addClass('d-none');
    loadData();
}

function retryImportRow(idx) {
    var r = _importResults[idx]; if (!r || r.status === 'success') return;
    var $tr = $('#impRow' + idx);
    var nm = $tr.find('.imp-name').val().trim();
    var vt = $tr.find('.imp-type').val().trim();
    if (!nm) { toastr.error(T('msg.name_required','Make name is required.')); return; }
    if (!vt) { toastr.error(T('msg.vehicle_type_required','Vehicle type is required.')); return; }
    var $b = $tr.find('button'); btnLoading($b);
    $.post(BASE_URL + '/vehicle-makes/import/single', { name: nm, vehicle_type: vt }, function(res) {
        btnReset($b);
        if (res.status === 200 || res.status === 201) {
            $tr.removeClass('table-danger').addClass('table-success');
            $tr.find('input').prop('disabled', true).addClass('bg-light');
            $tr.find('td:eq(3)').html('<span class="badge bg-info-lt">Done</span>');
            $tr.find('td:eq(4)').html('<span class="badge bg-success-lt"><i class="bi bi-check"></i></span>');
            $tr.find('td:eq(5)').text(res.message || 'Imported.');
            $tr.find('td:last').html('\u2014');
            r.status = 'success'; loadData();
        } else { toastr.error(res.message || 'Failed.'); }
    }).fail(function() { btnReset($b); toastr.error(T('general.error','Error.')); });
}

function retryAllErrors() { _importResults.forEach(function(r, i) { if (r.status === 'error') retryImportRow(i); }); }

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
$(function(){
    smsInitPerPage('#perPageSel');
    _pp = parseInt($('#perPageSel').val()) || 15;

    /* ── Vehicle Type Multi-Select (inside offcanvas) ── */
    $('#filterVehicleType').select2({
        placeholder: 'Select vehicle types...',
        allowClear: true,
        multiple: true,
        width: '100%',
        dropdownParent: $('#filterSidebar'),
        ajax: {
            url: BASE_URL + '/vehicle-types/autocomplete',
            dataType: 'json',
            delay: 300,
            data: function(params) {
                var d = { search: params.term || '', limit: 50 };
                var co = $('#filterCompany').val();
                if (co && co !== 'all') d.company_id = co;
                return d;
            },
            processResults: function(res) {
                return { results: (res.data || []).map(function(r) { return { id: r.id, text: r.name }; }) };
            },
            cache: true
        },
        minimumInputLength: 0
    });

    /* ── Company → Type cascade (super admin only) ── */
    $('#filterCompany').on('change', function() {
        // Clear vehicle type selection when company changes
        $('#filterVehicleType').val(null).trigger('change');
    });

    /* ── Apply / Clear buttons ── */
    $('#btnApplyFilters').on('click', function() {
        bootstrap.Offcanvas.getOrCreateInstance($('#filterSidebar')[0]).hide();
        applyFilters();
    });
    $('#btnClearFilters').on('click', function() {
        if ($('#filterCompany').length) $('#filterCompany').val('all');
        $('#filterVehicleType').val(null).trigger('change');
        $('#filterStatus').val('');
        $('#filterDeleted').val('');
        applyFilters();
    });

    /* ── Search ── */
    var _searchTimer;
    $('#searchInput').on('keyup', function() {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(function() { _page = 1; loadData(); }, 400);
    });

    /* ── Per page ── */
    $('#perPageSel').on('change', function() {
        _pp = ($(this).val() === 'all') ? 99999 : (parseInt($(this).val()) || 15);
        _page = 1; loadData();
    });

    /* ── Sort ── */
    $(document).on('click', 'th.sortable', function() {
        var f = $(this).data('field');
        if (_sort.field === f) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc';
        else { _sort.field = f; _sort.dir = 'asc'; }
        $('th.sortable i').attr('class', 'bi bi-arrow-down-up text-muted small');
        $(this).find('i').attr('class', 'bi bi-sort-' + (_sort.dir === 'asc' ? 'up' : 'down') + ' text-primary small');
        _page = 1; loadData();
    });

    /* ── Pagination ── */
    $(document).on('click', '.sms-pg', function(e) { e.preventDefault(); var p = parseInt($(this).data('p')); if (p > 0 && p !== _page) { _page = p; loadData(); } });

    /* ── Checkbox ── */
    $(document).on('change', '#selectAll', function() { $('.row-chk').prop('checked', $(this).is(':checked')); updateBulk(); });
    $(document).on('change', '.row-chk', updateBulk);
    $('#btnClearBulk').on('click', function() { $('#selectAll,.row-chk').prop('checked', false); updateBulk(); });

    /* ── Import form ── */
    $('#frmImport').on('submit', function(e) {
        e.preventDefault(); var fd = new FormData(this), $b = $('#btnImport'); btnLoading($b);
        $.ajax({ url: BASE_URL + '/vehicle-makes/import', type: 'POST', data: fd, processData: false, contentType: false,
            success: function(r) {
                btnReset($b);
                if (r.status === 200 && r.data) {
                    if (r.data.mode === 'background') { $('#importStep1').addClass('d-none'); showImportProgress(r.data.jobId, r.data.total); }
                    else if (r.data.results) { $('#importStep1').addClass('d-none'); $('#importStep2').removeClass('d-none'); renderImportResults(r.data.results); }
                    else { toastr.error(r.message || 'Failed.'); }
                } else { toastr.error(r.message || 'Failed.'); }
            },
            error: function() { btnReset($b); toastr.error(T('general.network_error','Network error.')); }
        });
    });
    $('#btnRetryAllErrors').on('click', function() { retryAllErrors(); });

    /* ── Load ── */
    updateFilterChips();
    loadData();
});