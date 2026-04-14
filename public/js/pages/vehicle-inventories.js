/* vehicle-inventories.js — index page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};

/* Enum maps */
var INV_STATUS={1:'In Stock',2:'Out of Stock',3:'Sent to Wastage'};
var INV_STATUS_COLOR={1:'success',2:'warning',3:'danger'};
var DEP_STATUS={1:'Pending',2:'In Depollution',3:'Depolluted'};
var DIS_STATUS={1:'Pending',2:'In Dismantling',3:'Dismantled'};
var PARK_STATUS={1:'With Declaration',2:'With Certificate',3:'Pending to Accept'};
var STEER_SIDE={1:'Left',2:'Right',3:'Not Applicable'};
var BRAKE_OPT={1:'With Brake',2:'Without Brake'};

/* Dynamic column config */
var _allCols={},_activeCols=[];
function _loadColumnConfig(cb){
    $.get(BASE_URL+'/vehicle-inventories/enums',function(res){
        if(!res||res.status!==200)return cb();
        _allCols=res.data.list_columns||{};
        var configured=res.data.configured_columns;
        if(configured&&configured.length){_activeCols=configured;}
        else{_activeCols=[];for(var k in _allCols){if(_allCols[k].default)_activeCols.push(k);}}
        _buildDynamicHeader();
        if(cb)cb();
    });
}
function _buildDynamicHeader(){
    var h='<tr><th style="width:42px;"><input type="checkbox" class="form-check-input" id="selectAll"/></th><th style="width:36px;" class="text-muted">#</th>';
    _activeCols.forEach(function(key){
        var col=_allCols[key]||{};
        if(key==='_image'){h+='<th style="width:60px;">'+T('vi._image',col.label||'Image')+'</th>';return;}
        h+='<th class="sortable" data-field="'+key+'">'+T('vi.'+key,col.label||key)+' <i class="bi bi-arrow-down-up text-muted small"></i></th>';
    });
    h+='<th class="text-end" style="width:80px;">Actions</th></tr>';
    $('#viTableHead').html(h);
}
function _getCellValue(r,key){
    // Special columns
    if(key==='_image')return viImg(r);
    if(key==='_status'){var isA=(r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1);return r.deleted_at?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>'+T('general.deleted','Deleted')+'</span>':(isA?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');}
    if(key==='_created_at')return '<span class="text-muted small">'+smsFormatDateTime(r.created_at)+'</span>';
    // Enum fields
    if(key==='inventory_status')return '<span class="badge bg-'+(INV_STATUS_COLOR[r.inventory_status]||'secondary')+'-lt">'+(INV_STATUS[r.inventory_status]||'—')+'</span>';
    if(key==='depolution_status')return '<span class="badge bg-info-lt">'+(DEP_STATUS[r.depolution_status]||'—')+'</span>';
    if(key==='dismantle_status')return '<span class="badge bg-purple-lt">'+(DIS_STATUS[r.dismantle_status]||'—')+'</span>';
    if(key==='state_parking')return '<span class="badge bg-azure-lt">'+(PARK_STATUS[r.state_parking]||'—')+'</span>';
    if(key==='steering_wheel_side')return STEER_SIDE[r.steering_wheel_side]||'—';
    // Date fields — use smsFormatDate (not DateTime) for date-only columns
    if(key.indexOf('date')!==-1&&r[key])return smsFormatDate(r[key]);
    // Numeric
    if(key==='vehicle_kms'&&r[key])return parseFloat(r[key]).toLocaleString();
    // Default: text
    return H.esc(String(r[key]||'—'));
}

function _filters(){
    var f={page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),sort_field:_sort.field,sort_dir:_sort.dir};
    // Vehicle tab
    if($('#filterVehicleType').val())f.vehicle_type_id=$('#filterVehicleType').val();
    if($('#filterVehicleMake').val())f.vehicle_make_id=$('#filterVehicleMake').val();
    if($('#filterVehicleModel').val())f.vehicle_model_id=$('#filterVehicleModel').val();
    if($('#filterVehicleVariant').val())f.vehicle_variant_id=$('#filterVehicleVariant').val();
    if($('#filterVehicleYear').val())f.vehicle_year_id=$('#filterVehicleYear').val();
    if($('#filterVehicleFuel').val())f.vehicle_fuel_id=$('#filterVehicleFuel').val();
    if($('#filterVehicleCategory').val())f.vehicle_category_id=$('#filterVehicleCategory').val();
    // Status tab
    if($('#filterInventoryStatus').val())f.inventory_status=$('#filterInventoryStatus').val();
    if($('#filterDepolutionStatus').val())f.depolution_status=$('#filterDepolutionStatus').val();
    if($('#filterDismantleStatus').val())f.dismantle_status=$('#filterDismantleStatus').val();
    if($('#filterStateParking').val())f.state_parking=$('#filterStateParking').val();
    if($('#filterSteeringSide').val())f.steering_wheel_side=$('#filterSteeringSide').val();
    // Date tab
    if($('#filterArrivalFrom').val())f.arrival_date_from=$('#filterArrivalFrom').val();
    if($('#filterArrivalTo').val())f.arrival_date_to=$('#filterArrivalTo').val();
    if($('#filterProcessStartFrom').val())f.process_start_from=$('#filterProcessStartFrom').val();
    if($('#filterProcessStartTo').val())f.process_start_to=$('#filterProcessStartTo').val();
    if($('#filterCreatedFrom').val())f.created_from=$('#filterCreatedFrom').val();
    if($('#filterCreatedTo').val())f.created_to=$('#filterCreatedTo').val();
    // Other tab
    if($('#filterVin').val())f.vehicle_vin=$('#filterVin').val().trim();
    if($('#filterColor').val())f.vehicle_color=$('#filterColor').val().trim();
    if($('#filterBrand').val())f.brand=$('#filterBrand').val().trim();
    if($('#filterOwner').val())f.owner_name=$('#filterOwner').val().trim();
    if($('#filterPlate').val())f.registration_plate_no=$('#filterPlate').val().trim();
    if($('#filterInventoryStatus').val())f.inventory_status=$('#filterInventoryStatus').val();
    if($('#filterDepolutionStatus').val())f.depolution_status=$('#filterDepolutionStatus').val();
    if($('#filterDismantleStatus').val())f.dismantle_status=$('#filterDismantleStatus').val();
    if($('#filterStateParking').val())f.state_parking=$('#filterStateParking').val();
    return f;
}

function viImg(r){var s=r.first_image||r.first_gallery_image||r.display_image_url||'',ok=s&&s.indexOf('no-image')===-1;return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-vi-img" data-uuid="'+H.esc(r.uuid||'')+'" data-name="'+H.esc(r.internal_id||r.registration_plate||'')+'"><img src="'+H.esc(ok?s:'/images/no-image.svg')+'" class="rounded border" style="width:40px;height:40px;object-fit:cover;'+(ok?'cursor:pointer;':'opacity:.5;')+'" onerror="this.src=\'/images/no-image.svg\';this.style.opacity=\'.5\';"/></button>';}

function showAllImages($el){
    var uuid=$el.data('uuid')||'',n=$el.data('name')||'';
    if(!uuid)return;
    $('#imgModalTitle').html('<i class="bi bi-images me-2 text-primary"></i>'+H.esc(n||T('vehicle_inventories.image_title','Images')));
    $('#imgModalBody').html('<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalImage')[0]).show();
    $.get(BASE_URL+'/vehicle-inventories/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$('#imgModalBody').html('<div class="text-muted text-center py-3">'+T('general.failed_load','Failed.')+'</div>');return;}
        var vi=res.data.vehicle_inventory||res.data||{};
        var images=res.data.images||vi.images||[];
        if(!images.length){$('#imgModalBody').html('<div class="text-muted text-center py-3">'+T('general.no_image','No images')+'</div>');return;}
        var h='<div class="row g-2">';
        images.forEach(function(img){
            var imgUrl=img.display_url||img.image_url||img.url||'';
            h+='<div class="col-4 col-sm-3"><div class="border rounded p-1 text-center">'+
                '<a href="'+H.esc(imgUrl)+'" target="_blank"><img src="'+H.esc(imgUrl)+'" class="rounded" style="width:100%;height:80px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/></a>'+
                '</div></div>';
        });
        h+='</div>';
        $('#imgModalBody').html(h);
    });
}

function loadData(){
    var colSpan=_activeCols.length+6; // checkbox + # + image + dynamic cols + status + created + actions
    $('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/vehicle-inventories/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-4 text-danger">'+T('general.failed_load','Failed.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-5 text-muted"><i class="bi bi-truck d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('vehicle_inventories.no_data','No vehicle inventories found')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var isActive=(r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1);
            var editable=!deleted && r.is_editable !== false;
            var deletable=!deleted && r.is_deletable !== false;

            // Build action dropdown
            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewVI(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>'+T('general.preview','Preview')+'</a></li>';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewPartsForVehicle(\''+r.uuid+'\',\''+H.esc(r.vehicle_internal_id||'')+'\');return false;"><i class="bi bi-boxes me-2 text-info"></i>Part Details</a></li>';
            acts+='<li><a class="dropdown-item" href="#" onclick="downloadPdfVI(\''+r.uuid+'\');return false;"><i class="bi bi-file-pdf me-2 text-danger"></i>'+T('general.download_pdf','Download PDF')+'</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverVI(\''+r.uuid+'\',\''+H.esc(r.vehicle_internal_id||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>'+T('bulk.recover','Recover')+'</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/vehicle-inventories/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>'+T('btn.edit','Edit')+'</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="toggleVI(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(isActive?'on':'off')+' me-2 text-'+(isActive?'warning':'success')+'"></i>'+(isActive?T('general.deactivate','Deactivate'):T('general.activate','Activate'))+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsageVI(\''+r.uuid+'\',\''+H.esc(r.vehicle_internal_id||r.registration_plate_no||'')+'\');return false;"><i class="bi bi-clock-history me-2 text-info"></i>'+T('general.usage','Usage')+'</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"/></li>';acts+='<li><a class="dropdown-item text-danger" href="#" onclick="delVI(\''+r.uuid+'\',\''+H.esc(r.vehicle_internal_id||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>'+T('btn.delete','Delete')+'</a></li>';}
            }
            acts+='</ul></div>';

            // Build row — all columns are dynamic (except checkbox, #, actions)
            var rowClass=deleted?' class="table-secondary"':'';
            var row='<tr'+rowClass+'><td><input type="checkbox" class="form-check-input row-chk" data-uuid="'+r.uuid+'"/></td>';
            row+='<td class="text-muted small">'+(start+i+1)+'</td>';
            _activeCols.forEach(function(key){ row+='<td class="small">'+_getCellValue(r,key)+'</td>'; });
            row+='<td class="text-end">'+acts+'</td></tr>';
            rows+=row;
        });
        $('#tableBody').html(rows);
        $('#tableInfo').text(T('general.showing','Showing')+' '+(pg.from||1)+'–'+(pg.to||data.length)+' '+T('general.of','of')+' '+(pg.total||0));
        $('#tablePagination').html(smsPg(pg));updateBulk();
    }).fail(function(){$('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewVI(uuid){
    var $b=$('#viewBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    // Fetch view-data and linked parts in parallel
    $.get(BASE_URL+'/vehicle-inventories/'+uuid+'/view-data', function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var vi=res.data||{};
        // Now fetch linked parts using the resolved numeric id
        $.post(BASE_URL+'/part-inventories/paginate', { page: 1, per_page: 500, vehicle_inventory_id: vi.id }, function(pRes){
            var linkedParts = (pRes && pRes.status === 200 && pRes.data && Array.isArray(pRes.data.data)) ? pRes.data.data : [];
            vi._linkedParts = linkedParts;
            _renderVehiclePreview(vi, $b);
        }).fail(function(){
            vi._linkedParts = [];
            _renderVehiclePreview(vi, $b);
        });
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Error.')+'</div>');});
}

function _renderVehiclePreview(vi, $b){

        var images=vi.images||[]; var videos=vi.videos||[]; var docs=vi.documents||[];

        function _r(label,val){if(!val&&val!==0)return '';var v=String(val);if(/^\d{4}-\d{2}-\d{2}/.test(v))v=smsFormatDate(v);return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value">'+H.esc(v)+'</span></div></div>';}
        function _rb(label,html){if(!html||html==='—')return '';return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value">'+html+'</span></div></div>';}
        function _section(title,icon,content){return '<div class="mb-3"><div class="fw-semibold small mb-1" style="color:var(--tblr-primary);"><i class="bi '+icon+' me-1"></i>'+title+'</div><div class="border rounded p-2"><div class="row g-0">'+content+'</div></div></div>';}

        var h='<div class="p-3">';
        // Header badges
        h+='<div class="d-flex flex-wrap gap-2 mb-3 align-items-center">';
        if(vi.vehicle_internal_id)h+='<span class="badge bg-primary-lt" style="font-size:12px;">#'+H.esc(vi.vehicle_internal_id)+'</span>';
        if(vi.registration_plate_no)h+='<span class="badge bg-azure-lt" style="font-size:12px;">'+H.esc(vi.registration_plate_no)+'</span>';
        h+=_rb('',INV_STATUS[vi.inventory_status]?'<span class="badge bg-'+(INV_STATUS_COLOR[vi.inventory_status]||'secondary')+'-lt">'+INV_STATUS[vi.inventory_status]+'</span>':'');
        h+='</div>';

        // Tabs
        h+='<ul class="nav nav-tabs mb-3" style="font-size:12px;"><li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#vvTab1">Vehicle</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vvTab2">Extra</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vvTab3">Images ('+images.length+')</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vvTab4">Videos ('+videos.length+')</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vvTab5">Owner</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vvTab6">Docs ('+docs.length+')</a></li>';
        var lps = vi._linkedParts || [];
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vvTab7"><i class="bi bi-boxes me-1"></i>Parts ('+lps.length+')</a></li></ul>';

        h+='<div class="tab-content">';

        // Tab 1: Vehicle Info — organized in sections
        h+='<div class="tab-pane fade show active" id="vvTab1">';
        h+=_section('Vehicle Selection','bi-car-front',
            _r('Type',vi.vehicle_type_name)+_r('Year',vi.vehicle_year_name)+_r('Make',vi.vehicle_make_name)+
            _r('Model',vi.vehicle_model_name)+_r('Variant',vi.vehicle_variant_name)+_r('Engine',vi.vehicle_engine_name)+
            _r('Fuel',vi.vehicle_fuel_name)+_r('Category',vi.vehicle_category_name));
        h+=_section('Registration & ID','bi-card-heading',
            _r('Plate No',vi.registration_plate_no)+_r('Reg No',vi.registration_no)+_r('VIN',vi.vehicle_vin)+
            _r('Certificate',vi.certificate_number)+_r('Internal ID',vi.vehicle_internal_id));
        h+=_section('Process Dates','bi-calendar-range',
            _r('Start Date',vi.process_start_date)+_r('End Date',vi.process_end_date));
        h+=_section('Vehicle Details','bi-info-circle',
            _r('Brand',vi.brand)+_r('Booklet Model',vi.booklet_model)+_r('Model Text',vi.vehicle_model_text)+
            _r('Tare',vi.vehicle_tare)+_r('Year',vi.vehicle_year_text)+_r('KMS',vi.vehicle_kms)+
            _r('Doors',vi.vehicle_doors)+_r('Approval',vi.vehicle_approval)+_r('Color',vi.vehicle_color));
        h+=_section('Dimensions & Weight','bi-rulers',
            _r('Gross Weight',vi.vehicle_total_gross_weight)+_r('Parts',vi.vehicle_parts)+_r('EEI',vi.vehicle_eei)+
            _r('Experience Value',vi.vehicle_experience_value)+_r('Cylinder',vi.vehicle_cylinder));
        h+=_section('Engine & Performance','bi-speedometer',
            _r('Motorization',vi.motorization)+_r('Ccm3',vi.ccm3)+_r('Power KW',vi.power_kw)+
            _r('HP',vi.hp)+_r('Provenance',vi.vehicle_provenance));
        h+=_section('References','bi-link-45deg',
            _r('Internal Ref',vi.vehicle_internal_reference)+_r('External Ref',vi.vehicle_external_reference));
        h+=_section('Status','bi-flag',
            _rb('Inventory',INV_STATUS[vi.inventory_status]?'<span class="badge bg-'+(INV_STATUS_COLOR[vi.inventory_status]||'secondary')+'-lt">'+INV_STATUS[vi.inventory_status]+'</span>':'')+
            _rb('Depolution',DEP_STATUS[vi.depolution_status]?'<span class="badge bg-info-lt">'+DEP_STATUS[vi.depolution_status]+'</span>':'')+
            _rb('Dismantle',DIS_STATUS[vi.dismantle_status]?'<span class="badge bg-purple-lt">'+DIS_STATUS[vi.dismantle_status]+'</span>':'')+
            _rb('Parking',PARK_STATUS[vi.state_parking]?'<span class="badge bg-azure-lt">'+PARK_STATUS[vi.state_parking]+'</span>':'')+
            _r('Steering',STEER_SIDE[vi.steering_wheel_side]||''));
        h+=_section('Important Dates','bi-calendar-event',
            _r('Decontamination',vi.decontamination_date)+_r('Arrival',vi.vehicle_arrival_date)+
            _r('Waste',vi.sent_to_waste_date)+_r('Neutralization',vi.neutralization_date));
        h+='</div>';

        // Tab 2: Extra Info — organized in sections
        h+='<div class="tab-pane fade" id="vvTab2">';
        h+=_section('Tires & Weight','bi-circle',
            _r('Tires Front',vi.tires_front)+_r('Tires Rear',vi.tires_rear)+_r('Max Weight Front',vi.max_weight_front)+_r('Max Weight Rear',vi.max_weight_rear));
        h+=_section('Box & Dimensions','bi-box',
            _r('Power Lifting',vi.power_lifting)+_r('Box Type',vi.box_type)+_r('Comp Max Box',vi.comp_max_box)+_r('Box Width',vi.box_width)+_r('Axel Distance',vi.axel_distance));
        h+=_section('Emissions','bi-cloud-haze',
            _r('CO2 g/km',vi.co2_gkm)+_r('Particles g/km',vi.particles_gkm));
        h+=_section('Doors & Capacity','bi-door-open',
            _r('Right Doors',vi.no_of_right_doors)+_r('Left Doors',vi.no_of_left_doors)+_r('Rear Doors',vi.no_of_rear_doors)+_r('Capacity',vi.capacity));
        h+=_section('Registration & Origin','bi-geo-alt',
            _r('Prev Registration',vi.previous_registration)+_r('Reg Date',vi.registration_date)+_r('Origin Country',vi.origin_country)+_r('Origin State',vi.origin_state));
        h+=_section('Notes','bi-chat-text',
            _r('Comments',vi.comments)+_r('Special Notes',vi.special_notes));
        h+=_section('Options','bi-sliders',
            _r('Brake',BRAKE_OPT[vi.brake_option]||'')+_rb('Towable',(vi.is_towable===true||vi.is_towable===1)?'<span class="badge bg-success-lt">Yes</span>':'<span class="badge bg-secondary-lt">No</span>'));
        h+='</div>';

        // Tab 3: Images
        h+='<div class="tab-pane fade" id="vvTab3">';
        if(images.length){h+='<div class="row g-2">';images.forEach(function(img){var u=img.display_url||img.image_url||'';h+='<div class="col-4 col-sm-3"><a href="'+H.esc(u)+'" target="_blank"><img src="'+H.esc(u)+'" class="rounded border" style="width:100%;height:80px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/></a></div>';});h+='</div>';}
        else h+='<div class="text-muted text-center py-3">No images</div>';
        h+='</div>';

        // Tab 4: Videos (thumbnails + click to play in modal)
        h+='<div class="tab-pane fade" id="vvTab4">';
        if(videos.length){
            h+='<div class="row g-2">';
            videos.forEach(function(v,vi){
                var u=v.display_url||v.video_url||'';
                h+='<div class="col-6 col-sm-4 col-md-3">' +
                    '<div class="border rounded position-relative vv-play-btn" data-url="'+H.esc(u)+'" style="background:#000;overflow:hidden;cursor:pointer;">' +
                    '<video src="'+H.esc(u)+'#t=1" preload="metadata" muted playsinline style="width:100%;height:80px;object-fit:cover;pointer-events:none;display:block;"></video>' +
                    '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25);">' +
                    '<i class="bi bi-play-circle-fill" style="font-size:28px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.5);"></i></div>' +
                    '</div></div>';
            });
            h+='</div>';
        } else h+='<div class="text-muted text-center py-3">No videos</div>';
        h+='</div>';

        // Tab 5: Owner
        h+='<div class="tab-pane fade" id="vvTab5">';
        h+=_section('Owner Information','bi-person',
            _r('Name',vi.owner_name)+_r('Certificate No',vi.owner_certificate_number)+_r('Postal Code',vi.owner_postal_code)+
            _r('Country',vi.owner_country_name)+_r('NIF',vi.owner_nif)+_r('BICC',vi.owner_bicc));
        h+=_section('Contact','bi-telephone',
            _r('Telephone',vi.owner_telephone)+_r('CellPhone',vi.owner_cellphone)+_r('Email',vi.owner_email));
        h+=_section('Company & Address','bi-building',
            _r('Company Code',vi.owner_company_certificate_code)+_r('Validity',vi.owner_validity)+_r('Address',vi.owner_address));
        h+='</div>';

        // Tab 6: Documents
        h+='<div class="tab-pane fade" id="vvTab6">';
        if(docs.length){h+='<table class="table table-sm mb-0" style="font-size:12px;"><thead><tr><th>Type</th><th>File</th><th>Comment</th><th></th></tr></thead><tbody>';
        docs.forEach(function(d){var tn=d.type_name||DOC_TYPES[d.document_type]||'';var u=d.display_url||d.file_url||'';
        h+='<tr><td><span class="badge bg-secondary-lt">'+H.esc(tn)+'</span></td><td class="small">'+H.esc(d.original_name||'')+'</td><td class="small text-muted">'+H.esc(d.comment||'')+'</td><td>'+(u?'<a href="'+H.esc(u)+'" target="_blank" class="btn btn-sm btn-ghost-primary"><i class="bi bi-eye"></i></a>':'')+'</td></tr>';});
        h+='</tbody></table>';}
        else h+='<div class="text-muted text-center py-3">No documents</div>';
        h+='</div>';

        // Tab 7: Linked Part Inventories
        h+='<div class="tab-pane fade" id="vvTab7">';
        var PI_INV = {1:'In Stock',2:'Out of Stock',4:'Returned',5:'Scrapped'};
        if (lps.length) {
            h += '<div class="d-flex justify-content-end mb-2"><a href="'+BASE_URL+'/part-inventories/create?from_vehicle=1&vehicle_id='+H.esc(vi.uuid||'')+'" class="btn btn-sm btn-primary"><i class="bi bi-plus-lg me-1"></i>Add Part</a></div>';
            h += '<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead><tr><th>#</th><th>Internal ID</th><th>Part Code</th><th>Catalog</th><th>Brand</th><th>Qty</th><th>Status</th><th class="text-end">Actions</th></tr></thead><tbody>';
            lps.forEach(function(p, i) {
                h += '<tr>'
                  + '<td>'+(i+1)+'</td>'
                  + '<td>#'+H.esc(p.part_internal_id||'—')+'</td>'
                  + '<td>'+H.esc(p.part_code||'—')+'</td>'
                  + '<td>'+H.esc(p.part_catalog_name||'—')+'</td>'
                  + '<td>'+H.esc(p.part_brand_name||'—')+'</td>'
                  + '<td>'+(p.quantity||'—')+'</td>'
                  + '<td>'+(PI_INV[p.inventory_status]||'—')+'</td>'
                  + '<td class="text-end text-nowrap">'
                  +   '<a href="'+BASE_URL+'/part-inventories/'+H.esc(p.uuid)+'/edit" class="btn btn-sm btn-ghost-primary" title="Edit"><i class="bi bi-pencil"></i></a> '
                  +   '<button type="button" class="btn btn-sm btn-ghost-danger sms-vp-delete" data-uuid="'+H.esc(p.uuid)+'" data-name="'+H.esc(p.part_code||'')+'" title="Delete"><i class="bi bi-trash3"></i></button>'
                  + '</td>'
                  + '</tr>';
            });
            h += '</tbody></table></div>';
        } else {
            h += '<div class="text-muted text-center py-3">No parts linked to this vehicle yet.</div>';
            h += '<div class="text-center"><a href="'+BASE_URL+'/part-inventories/create?from_vehicle=1&vehicle_id='+H.esc(vi.uuid||'')+'" class="btn btn-sm btn-primary"><i class="bi bi-plus-lg me-1"></i>Add Part</a></div>';
        }
        h+='</div>';

        h+='</div>'; // end tab-content

        // Timestamps
        h+='<div class="border-top mt-3 pt-2 d-flex flex-wrap gap-3" style="font-size:11px;">';
        h+='<span class="text-muted">Created: '+smsFormatDateTime(vi.created_at)+'</span>';
        h+='<span class="text-muted">Updated: '+smsFormatDateTime(vi.updated_at)+'</span>';
        h+='</div>';

        h+='</div>';
        $b.html(h);
}

/* Play video from detail view — open in a simple popup */
$(document).on('click', '.vv-play-btn', function(e) {
    e.preventDefault();
    var url = $(this).data('url');
    if (!url) return;
    var w = window.open('', '_blank', 'width=800,height=500');
    w.document.write('<!DOCTYPE html><html><head><title>Video</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;}video{max-width:100%;max-height:100%;}</style></head><body><video src="' + url + '" controls autoplay playsinline></video></body></html>');
    w.document.close();
});

/* Actions */
function toggleVI(u){$.post(BASE_URL+'/vehicle-inventories/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function showUsageVI(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text('Usage: ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/vehicle-inventories/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">'+T('msg.failed','Failed.')+'</div>'); return; }
        // Use the shared renderer (app.js) so each row gets Edit/Delete actions
        smsRenderUsageBody(res.data, 'vehicle-inventories', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Network error.')+'</div>'); });
}
function delVI(u,n){smsConfirm({icon:'\uD83D\uDDD1\uFE0F',title:T('vehicle_inventories.delete','Delete'),msg:T('general.are_you_sure','Sure?')+' <strong>'+H.esc(n)+'</strong>',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-inventories/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function recoverVI(u,n){smsConfirm({icon:'\u267B\uFE0F',title:T('bulk.recover','Recover'),msg:T('bulk.recover','Recover')+' <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:T('bulk.recover','Recover'),onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-inventories/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* Open a popup with all parts of a vehicle — full details (bulk-loaded) */
function viewPartsForVehicle(vehicleUuid, vehicleLabel) {
    var $b = $('#viewBody');
    $('#viewModalTitle').html('<i class="bi bi-boxes me-2 text-info"></i>Parts of ' + H.esc(vehicleLabel||''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL + '/vehicle-inventories/' + vehicleUuid + '/parts-full', function(res) {
        var parts = (res && res.status === 200 && Array.isArray(res.data)) ? res.data : [];
        if (!parts.length) { $b.html('<div class="text-muted text-center py-4">No parts linked to this vehicle.</div>'); return; }

        var INV={1:'In Stock',2:'Out of Stock',4:'Returned',5:'Scrapped'};
        var COND={1:'OEM',2:'Aftermarket'};
        var STATE={1:'New',2:'Used',3:'Remanufactured',4:'Not Working'};
        var DTYPE={1:'Does Not Affect Function',2:'Affects Function'};
        var DLOC ={1:'Internal',2:'External'};
        var RTYPE={1:'Compatible',2:'Written on Label'};

        function _r(l,v){if(v==null||v==='')v='—';return '<div class="col-sm-6 col-md-4 mb-1"><span class="text-muted small">'+l+':</span> <strong>'+H.esc(String(v))+'</strong></div>';}
        function _table(headers, rows) {
            var h = '<div class="table-responsive"><table class="table table-sm table-bordered mb-2" style="font-size:11px;"><thead><tr>';
            headers.forEach(function(c){ h += '<th>'+c+'</th>'; });
            h += '</tr></thead><tbody>';
            rows.forEach(function(row){ h += '<tr>'; row.forEach(function(c){ h += '<td>'+c+'</td>'; }); h += '</tr>'; });
            return h + '</tbody></table></div>';
        }
        function _dmgsForMedia(p, id, kind) {
            var key = (kind==='image')?'image_ids':'video_ids';
            return (p.damages||[]).filter(function(d){
                var ids = (d[key]||[]).map(String);
                return ids.indexOf(String(id)) !== -1;
            });
        }
        function _dmgBadges(p, items) {
            if (!items.length) return '';
            return '<div class="mt-1 d-flex flex-wrap gap-1">' + items.map(function(d){
                var label = (d.damage_description||'Damage')+' #'+((p.damages||[]).indexOf(d)+1);
                return '<span class="badge bg-warning-lt" style="font-size:9px;" title="'+H.esc(label)+'"><i class="bi bi-exclamation-triangle me-1"></i>'+H.esc(label)+'</span>';
            }).join('') + '</div>';
        }

        var h = '<div class="p-3"><div class="text-muted small mb-3">' + parts.length + ' part(s) linked to this vehicle.</div>';
        h += '<div class="accordion" id="vpAcc">';
        parts.forEach(function(p, i) {
            var aid = 'vpItem'+i;
            h += '<div class="accordion-item">';
            h += '<h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#'+aid+'">';
            h += '<strong>#'+H.esc(p.part_internal_id||'—')+'</strong> · '+H.esc(p.part_code||'')+' · '+H.esc(p.part_catalog_name||'—');
            h += ' <span class="badge bg-azure-lt ms-2">'+(INV[p.inventory_status]||'—')+'</span>';
            if (p.is_master_part) h += ' <span class="badge bg-primary-lt ms-1"><i class="bi bi-diagram-3 me-1"></i>Master</span>';
            h += '</button></h2>';
            h += '<div id="'+aid+'" class="accordion-collapse collapse" data-bs-parent="#vpAcc"><div class="accordion-body">';

            // Part Info
            h += '<h6 class="text-primary fw-semibold mb-2"><i class="bi bi-info-circle me-1"></i>Part Information</h6>';
            h += '<div class="row g-0 mb-3">';
            h += _r('Catalog',p.part_catalog_name)+_r('Brand',p.part_brand_name)+_r('Quantity',p.quantity);
            h += _r('Price 1',H.currency(p.price_1))+_r('Price 2',H.currency(p.price_2))+_r('Cost',H.currency(p.part_cost_price));
            h += _r('Condition',COND[p.condition])+_r('State',STATE[p.part_state])+_r('Status',INV[p.inventory_status]);
            h += _r('Motorization',p.motorization)+_r('CC',p.cc)+_r('CV',p.cv)+_r('KW',p.kw);
            h += _r('Reg # Dismantler',p.reg_number_dismantler)+_r('Rating',p.rating);
            h += '</div>';

            // References
            if (p.references && p.references.length) {
                h += '<h6 class="text-primary fw-semibold mb-2 mt-2"><i class="bi bi-link-45deg me-1"></i>References ('+p.references.length+')</h6>';
                h += _table(['Code','Condition','Type','Brand','Manufacturer'],
                    p.references.map(function(rf){return [H.esc(rf.reference_code||'—'), COND[rf.condition]||'—', RTYPE[rf.reference_type]||'—', H.esc(rf.brand||'—'), H.esc(rf.manufacturer||'—')];}));
            }

            // Damages
            if (p.damages && p.damages.length) {
                h += '<h6 class="text-primary fw-semibold mb-2 mt-2"><i class="bi bi-exclamation-triangle me-1"></i>Damages ('+p.damages.length+')</h6>';
                h += _table(['#','Description','Type','Location','Rating'],
                    p.damages.map(function(d,j){return [j+1, H.esc(d.damage_description||'—'), DTYPE[d.damage_type]||'—', DLOC[d.damage_location]||'—', d.damage_rating!=null?d.damage_rating:'—'];}));
            }

            // Attributes
            if (p.attributes && p.attributes.length) {
                h += '<h6 class="text-primary fw-semibold mb-2 mt-2"><i class="bi bi-sliders me-1"></i>Attributes ('+p.attributes.length+')</h6>';
                h += _table(['Attribute','Value'], p.attributes.map(function(a){
                    var v=a.value; if (Array.isArray(v)) v=v.join(', ');
                    return [H.esc(a.label_name||'—'), H.esc(v!=null?String(v):'—')];
                }));
            }

            // Locations
            if (p.locations && p.locations.length) {
                h += '<h6 class="text-primary fw-semibold mb-2 mt-2"><i class="bi bi-geo-alt me-1"></i>Locations ('+p.locations.length+')</h6>';
                h += _table(['Unit','Warehouse','Zone','Shelf','Rack','Bin','Code'],
                    p.locations.map(function(l){return [l.unit_number||'—', H.esc(l.warehouse_name||'—'), H.esc(l.warehouse_zone_name||'—'), H.esc(l.warehouse_shelf_name||'—'), H.esc(l.warehouse_rack_name||'—'), H.esc(l.warehouse_bin_name||'—'), H.esc(l.location_code||'—')];}));
            }

            // Images (with linked damage badges)
            if (p.images && p.images.length) {
                h += '<h6 class="text-primary fw-semibold mb-2 mt-2"><i class="bi bi-images me-1"></i>Images ('+p.images.length+')</h6><div class="row g-2 mb-2">';
                p.images.forEach(function(img){
                    var u=img.display_url||img.image_url||'';
                    var iid=img.id||img.image_id||'';
                    h+='<div class="col-4 col-sm-3"><div class="border rounded p-1"><a href="'+H.esc(u)+'" target="_blank"><img src="'+H.esc(u)+'" class="rounded" style="width:100%;height:70px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/></a>'+_dmgBadges(p, _dmgsForMedia(p,iid,'image'))+'</div></div>';
                });
                h += '</div>';
            }

            // Videos (with linked damage badges)
            if (p.videos && p.videos.length) {
                h += '<h6 class="text-primary fw-semibold mb-2 mt-2"><i class="bi bi-camera-video me-1"></i>Videos ('+p.videos.length+')</h6><div class="row g-2 mb-2">';
                p.videos.forEach(function(v){
                    var u=v.display_url||v.video_url||'';
                    var vid=v.id||v.video_id||'';
                    h+='<div class="col-6 col-sm-4"><div class="border rounded p-1"><video src="'+H.esc(u)+'#t=1" controls preload="metadata" style="width:100%;height:90px;object-fit:cover;border-radius:3px;"></video>'+_dmgBadges(p, _dmgsForMedia(p,vid,'video'))+'</div></div>';
                });
                h += '</div>';
            }

            // Notes
            if (p.notes || p.extra_notes || p.internal_notes) {
                h += '<h6 class="text-primary fw-semibold mb-2 mt-2"><i class="bi bi-journal-text me-1"></i>Notes</h6>';
                if (p.notes)          h += '<div class="small mb-1"><strong>Notes:</strong> '+H.esc(p.notes)+'</div>';
                if (p.extra_notes)    h += '<div class="small mb-1"><strong>Extra:</strong> '+H.esc(p.extra_notes)+'</div>';
                if (p.internal_notes) h += '<div class="small mb-1"><strong>Internal:</strong> '+H.esc(p.internal_notes)+'</div>';
            }

            h += '<div class="d-flex gap-2 mt-3 border-top pt-2">';
            h += '<a href="'+BASE_URL+'/part-inventories/'+H.esc(p.uuid)+'/edit" class="btn btn-sm btn-primary"><i class="bi bi-pencil me-1"></i>Edit</a>';
            h += '<a href="'+BASE_URL+'/part-inventories/'+H.esc(p.uuid)+'/pdf" target="_blank" class="btn btn-sm btn-outline-danger"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</a>';
            h += '</div></div></div></div>';
        });
        h += '</div></div>';
        $b.html(h);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">Failed to load parts.</div>'); });
}

/* Vehicle preview → linked parts → delete with confirm + dependency check */
$(document).on('click', '.sms-vp-delete', function() {
    var uuid = $(this).data('uuid');
    var name = $(this).data('name');
    var $row  = $(this).closest('tr');
    smsConfirm({
        icon: '🗑️', title: T('btn.delete','Delete'),
        msg: T('general.are_you_sure','Are you sure?') + ' <strong>' + H.esc(name) + '</strong>',
        btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL+'/part-inventories/'+uuid+'/delete', function(r) {
                hideLoading();
                if (r.status === 200) {
                    toastr.success(r.message || 'Deleted.');
                    $row.remove();
                } else toastr.error(r.message || 'Failed.');
            }).fail(function(xhr) {
                hideLoading();
                toastr.error(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Network error.');
            });
        }
    });
});
/* PDF Download — direct download from server */
function downloadPdfVI(uuid) {
    toastr.info('Generating PDF...');
    // Direct download via hidden link (no popup blocker issues)
    var a = document.createElement('a');
    a.href = BASE_URL + '/vehicle-inventories/' + uuid + '/pdf';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function _x_unused_pdf(uuid) {
    showLoading();
    $.get(BASE_URL + '/vehicle-inventories/' + uuid + '/view-data', function(res) {
        hideLoading();
        if (!res || res.status !== 200) { toastr.error('Not found'); return; }
        var vi = res.data || {};
        var images = vi.images || [], videos = vi.videos || [], docs = vi.documents || [];

        function _e(v) { return v ? String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
        function _d(v) { return v ? smsFormatDate(v) : ''; }
        function _row(l, v) { if (!v && v !== 0) return ''; return '<tr><td style="font-weight:600;color:#374151;width:180px;padding:4px 8px;font-size:11px;">' + _e(l) + '</td><td style="padding:4px 8px;font-size:11px;">' + _e(String(v)) + '</td></tr>'; }
        function _rowH(l, html) { if (!html) return ''; return '<tr><td style="font-weight:600;color:#374151;width:180px;padding:4px 8px;font-size:11px;">' + _e(l) + '</td><td style="padding:4px 8px;font-size:11px;">' + html + '</td></tr>'; }
        function _sec(title) { return '<tr><td colspan="2" style="background:#f0f4f8;font-weight:700;font-size:12px;padding:6px 8px;color:#1e40af;border-top:2px solid #3b82f6;">' + _e(title) + '</td></tr>'; }

        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vehicle - ' + _e(vi.vehicle_internal_id || vi.registration_plate_no || uuid) + '</title>';
        html += '<style>';
        html += 'body{font-family:Inter,Arial,sans-serif;font-size:12px;color:#1f2937;margin:0;padding:20px;}';
        html += '.header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #3b82f6;padding-bottom:10px;margin-bottom:16px;}';
        html += '.header h1{font-size:18px;color:#1e40af;margin:0;}';
        html += '.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;margin-right:4px;}';
        html += '.badge-blue{background:#dbeafe;color:#1e40af;} .badge-green{background:#d1fae5;color:#065f46;} .badge-red{background:#fee2e2;color:#991b1b;} .badge-gray{background:#f3f4f6;color:#374151;}';
        html += 'table{width:100%;border-collapse:collapse;margin-bottom:16px;}';
        html += 'table td{border:1px solid #e5e7eb;vertical-align:top;}';
        html += '.tab-title{font-size:14px;font-weight:700;color:#1e40af;margin:16px 0 8px;padding:6px 0;border-bottom:2px solid #3b82f6;}';
        html += '.img-grid{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;}';
        html += '.img-grid img{width:120px;height:80px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb;}';
        html += '.vid-item{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#f0f4f8;border-radius:6px;font-size:11px;margin:4px;text-decoration:none;color:#1e40af;}';
        html += '@media print{body{padding:10px;}.no-print{display:none;}}';
        html += '</style></head><body>';

        // Header
        html += '<div class="header"><div>';
        html += '<h1>Vehicle Inventory Details</h1>';
        html += '<div style="margin-top:4px;">';
        if (vi.vehicle_internal_id) html += '<span class="badge badge-blue">#' + _e(vi.vehicle_internal_id) + '</span>';
        if (vi.registration_plate_no) html += '<span class="badge badge-blue">' + _e(vi.registration_plate_no) + '</span>';
        if (INV_STATUS[vi.inventory_status]) html += '<span class="badge badge-green">' + _e(INV_STATUS[vi.inventory_status]) + '</span>';
        html += '</div></div>';
        html += '<div style="text-align:right;font-size:10px;color:#6b7280;">Generated: ' + new Date().toLocaleString() + '</div></div>';

        // TAB 1: Vehicle Info
        html += '<div class="tab-title">1. Vehicle Information</div>';
        html += '<table>';
        html += _sec('Basic Details');
        html += _row('Internal ID', vi.vehicle_internal_id);
        html += _row('Registration Plate', vi.registration_plate_no);
        html += _row('Registration No', vi.registration_number);
        html += _row('VIN', vi.vin_number);
        html += _row('Type', vi.vehicle_type_name);
        html += _row('Make', vi.vehicle_make_name);
        html += _row('Model', vi.vehicle_model_name);
        html += _row('Variant', vi.vehicle_variant_name);
        html += _row('Year', vi.vehicle_year_name);
        html += _row('Fuel', vi.vehicle_fuel_name);
        html += _row('Category', vi.vehicle_category_name);
        html += _row('Engine', vi.vehicle_engine_name);
        html += _row('Color', vi.color);
        html += _row('Kms', vi.kms);
        html += _sec('Registration & Dates');
        html += _row('First Reg. Date', _d(vi.first_registration_date));
        html += _row('Cancellation Date', _d(vi.cancellation_date));
        html += _row('Entry Date', _d(vi.entry_date));
        html += _row('Sales Date', _d(vi.sales_date));
        html += _sec('Status');
        html += _row('Inventory Status', INV_STATUS[vi.inventory_status] || '');
        html += _row('Location', vi.location);
        html += _row('Purchase Price', vi.purchase_price);
        html += _row('Selling Price', vi.selling_price);
        html += '</table>';

        // TAB 2: Extra Info
        html += '<div class="tab-title">2. Extra Information</div>';
        html += '<table>';
        html += _sec('Vehicle Details');
        html += _row('Seats', vi.seats);
        html += _row('Doors', vi.doors);
        html += _row('Steering Side', vi.steering_side === 1 ? 'Left' : vi.steering_side === 2 ? 'Right' : '');
        html += _row('Brake', BRAKE_OPT[vi.brake_option] || '');
        html += _row('Towable', (vi.is_towable === true || vi.is_towable === 1) ? 'Yes' : 'No');
        html += _row('Engine No', vi.engine_no);
        html += _row('Cylinder', vi.cylinder);
        html += _row('Power (HP)', vi.power_hp);
        html += _row('Power (KW)', vi.power_kw);
        html += _row('Weight', vi.weight);
        html += _row('Gross Weight', vi.gross_weight);
        html += _sec('Process Status');
        html += _row('Depollution Status', vi.depolution_status);
        html += _row('Dismantle Status', vi.dismantle_status);
        html += _row('State Parking', vi.state_parking);
        html += _sec('Notes');
        html += _row('Comment', vi.comment);
        html += _row('Internal Notes', vi.internal_notes);
        html += '</table>';

        // TAB 3: Images
        html += '<div class="tab-title">3. Images (' + images.length + ')</div>';
        if (images.length) {
            html += '<div class="img-grid">';
            images.forEach(function(img) {
                var u = img.display_url || img.image_url || '';
                html += '<img src="' + _e(u) + '" onerror="this.style.display=\'none\'"/>';
            });
            html += '</div>';
        } else { html += '<p style="color:#9ca3af;">No images</p>'; }

        // TAB 4: Videos
        html += '<div class="tab-title">4. Videos (' + videos.length + ')</div>';
        if (videos.length) {
            videos.forEach(function(v, i) {
                var u = v.display_url || v.video_url || '';
                html += '<a class="vid-item" href="' + _e(u) + '" target="_blank"><span style="font-size:16px;">&#9654;</span> Video ' + (i + 1) + ' — ' + _e(u.split('/').pop()) + '</a>';
            });
        } else { html += '<p style="color:#9ca3af;">No videos</p>'; }

        // TAB 5: Owner
        html += '<div class="tab-title">5. Owner Details</div>';
        html += '<table>';
        html += _sec('Owner Information');
        html += _row('Name', vi.owner_name);
        html += _row('Certificate No', vi.owner_certificate_number);
        html += _row('Postal Code', vi.owner_postal_code);
        html += _row('Country', vi.owner_country_name);
        html += _row('NIF', vi.owner_nif);
        html += _row('BICC', vi.owner_bicc);
        html += _sec('Contact');
        html += _row('Telephone', vi.owner_telephone);
        html += _row('CellPhone', vi.owner_cellphone);
        html += _row('Email', vi.owner_email);
        html += _sec('Company & Address');
        html += _row('Company Code', vi.owner_company_certificate_code);
        html += _row('Validity', vi.owner_validity);
        html += _row('Address', vi.owner_address);
        html += '</table>';

        // TAB 6: Documents
        html += '<div class="tab-title">6. Documents (' + docs.length + ')</div>';
        if (docs.length) {
            html += '<table><tr style="background:#f0f4f8;"><td style="font-weight:700;padding:4px 8px;font-size:11px;">Type</td><td style="font-weight:700;padding:4px 8px;font-size:11px;">File</td><td style="font-weight:700;padding:4px 8px;font-size:11px;">Comment</td></tr>';
            docs.forEach(function(d) {
                var tn = d.type_name || DOC_TYPES[d.document_type] || '';
                var u = d.display_url || d.file_url || '';
                html += '<tr><td style="padding:4px 8px;font-size:11px;"><span class="badge badge-gray">' + _e(tn) + '</span></td>';
                html += '<td style="padding:4px 8px;font-size:11px;">' + (u ? '<a href="' + _e(u) + '" target="_blank">' + _e(d.original_name || 'Download') + '</a>' : _e(d.original_name || '')) + '</td>';
                html += '<td style="padding:4px 8px;font-size:11px;color:#6b7280;">' + _e(d.comment || '') + '</td></tr>';
            });
            html += '</table>';
        } else { html += '<p style="color:#9ca3af;">No documents</p>'; }

        // Footer
        html += '<div style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:8px;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;">';
        html += '<span>Created: ' + smsFormatDateTime(vi.created_at) + ' | Updated: ' + smsFormatDateTime(vi.updated_at) + '</span>';
        html += '</div>';

        html += '</body></html>';

        // Render HTML into hidden div, then convert to PDF via html2canvas + jsPDF
        var $container = $('<div id="pdfRender" style="position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:20px;z-index:-1;"></div>');
        $('body').append($container);
        $container.html(html.replace(/<!DOCTYPE.*?<body>/, '').replace(/<\/body>.*/, ''));

        showLoading();
        // Wait for images to load
        var imgs = $container.find('img');
        var loaded = 0;
        var total = imgs.length || 1;
        function _tryGenerate() {
            if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
                // Fallback: open in new window for print
                $container.remove();
                hideLoading();
                var w = window.open('', '_blank');
                w.document.write(html); w.document.close();
                setTimeout(function() { w.print(); }, 500);
                return;
            }
            html2canvas($container[0], { scale: 2, useCORS: true, allowTaint: true, logging: false }).then(function(canvas) {
                var imgData = canvas.toDataURL('image/jpeg', 0.92);
                var pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                var pageW = pdf.internal.pageSize.getWidth();
                var pageH = pdf.internal.pageSize.getHeight();
                var imgW = pageW - 10;
                var imgH = (canvas.height * imgW) / canvas.width;
                var y = 5;
                // Multi-page support
                while (y < imgH + 5) {
                    if (y > 5) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 5, 5 - y + 5, imgW, imgH);
                    y += pageH - 10;
                }
                var fileName = 'Vehicle_' + (vi.vehicle_internal_id || vi.registration_plate_no || uuid) + '.pdf';
                pdf.save(fileName);
                $container.remove();
                hideLoading();
                toastr.success('PDF downloaded: ' + fileName);
            }).catch(function(e) {
                $container.remove();
                hideLoading();
                toastr.error('PDF generation failed');
                console.error(e);
            });
        }
        if (imgs.length === 0) {
            setTimeout(_tryGenerate, 200);
        } else {
            imgs.each(function() {
                var img = this;
                if (img.complete) { loaded++; if (loaded >= total) setTimeout(_tryGenerate, 200); }
                else {
                    $(img).on('load error', function() { loaded++; if (loaded >= total) setTimeout(_tryGenerate, 200); });
                }
            });
            // Safety timeout
            setTimeout(function() { if (loaded < total) _tryGenerate(); }, 3000);
        }
    }).fail(function() {
        hideLoading();
        toastr.error(T('general.network_error', 'Error.'));
    });
}

function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;var icons={delete:'\uD83D\uDDD1\uFE0F',activate:'\u2705',deactivate:'\u26D4',recover:'\u267B\uFE0F'};smsConfirm({icon:icons[a]||'\u26A0\uFE0F',title:a.charAt(0).toUpperCase()+a.slice(1),msg:_sel.length+' '+T('vehicle_inventories.bulk_affected','items.'),btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a.charAt(0).toUpperCase()+a.slice(1),onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-inventories/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* Export */
function doExport(fmt){
    var p=_filters();delete p.page;delete p.per_page;p.format=fmt;
    if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){
        showLoading();
        var checkP=$.extend({},p,{check:'1'});
        $.post(BASE_URL+'/vehicle-inventories/export',checkP,function(res){
            hideLoading();
            if(!res||res.status!==200){toastr.error(res?res.message:'Failed.');return;}
            if(res.data&&res.data.mode==='background'){
                toastr.info(T('export.processing','Export is processing in background. You will receive a notification and email when ready.'));
                if(typeof smsTrackJob==='function') smsTrackJob(res.data.jobId,{onComplete:function(job){if(typeof fetchUnreadCount==='function')fetchUnreadCount();if(job.status==='completed')toastr.success(T('export.ready','Export ready! Check notifications to download.'));else toastr.error(T('export.failed','Export failed.'));}});
                return;
            }
            showLoading();
            toastr.info(T('export.generating','Generating export...'));
            fetch(BASE_URL+'/vehicle-inventories/export?'+$.param(p),{credentials:'same-origin'})
                .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.blob();})
                .then(function(blob){
                    hideLoading();
                    var url=URL.createObjectURL(blob);
                    var a=document.createElement('a');a.href=url;
                    a.download='vehicle-inventory-'+Date.now()+'.'+(fmt==='excel'?'xlsx':(fmt==='pdf'?'pdf':'csv'));
                    document.body.appendChild(a);a.click();document.body.removeChild(a);
                    setTimeout(function(){URL.revokeObjectURL(url);},1000);
                    toastr.success(T('export.ready','Export ready.'));
                })
                .catch(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});
        }).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});
        return;
    }
    showLoading();
    $.post(BASE_URL+'/vehicle-inventories/export',p,function(res){
        hideLoading();
        if(!res||res.status!==200){toastr.error(res?res.message:'Failed.');return;}
        if(res.data&&res.data.mode==='background'){toastr.info(T('export.processing','Export is processing in background. You will receive a notification and email when ready.'));return;}
        if(!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);
        var html='<html><head><title>Vehicle Inventories</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Vehicle Inventories ('+rows.length+')</h2><table><thead><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';
        rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</tbody></table></body></html>';
        var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    }).fail(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});
}

/* Advanced filters */
function _initSelect2Filter(sel, url, ph, extraData) {
    var $parent=$('#filterSidebar');
    $(sel).select2({placeholder:ph,allowClear:true,width:'100%',theme:'bootstrap-5',
        dropdownParent:$parent,
        ajax:{url:BASE_URL+url,dataType:'json',delay:300,
            data:function(p){var d={search:p.term||'',limit:50};if(extraData)$.extend(d,extraData());return d;},
            processResults:function(r){return{results:(r.data||[]).map(function(v){return{id:v.id,text:v.name||v.year||v.manufacturer_engine||''};})};},
            cache:false},minimumInputLength:0
    });
}

function _loadAdvFilters(){
    // Independent filters
    _initSelect2Filter('#filterVehicleType','/vehicle-types/autocomplete','All Types');
    _initSelect2Filter('#filterVehicleYear','/vehicle-years/autocomplete','All Years');
    _initSelect2Filter('#filterVehicleFuel','/vehicle-fuels/autocomplete','All Fuels');
    _initSelect2Filter('#filterVehicleCategory','/vehicle-categories/autocomplete','All Categories');

    // Dependent: Make depends on Type
    _initSelect2Filter('#filterVehicleMake','/vehicle-makes/autocomplete','All Makes',function(){
        var tid=$('#filterVehicleType').val(); return tid?{vehicle_type_id:tid}:{};
    });
    // Dependent: Model depends on Make
    _initSelect2Filter('#filterVehicleModel','/vehicle-models/autocomplete','All Models',function(){
        var mid=$('#filterVehicleMake').val(); return mid?{vehicle_make_id:mid}:{};
    });
    // Dependent: Variant depends on Model
    _initSelect2Filter('#filterVehicleVariant','/vehicle-variants/autocomplete','All Variants',function(){
        var mid=$('#filterVehicleModel').val(); return mid?{vehicle_model_id:mid}:{};
    });

    // Cascade: Type changes → clear Make, Model, Variant
    $(document).on('change','#filterVehicleType',function(){
        $('#filterVehicleMake').val(null).trigger('change.select2');
        $('#filterVehicleModel').val(null).trigger('change.select2');
        $('#filterVehicleVariant').val(null).trigger('change.select2');
    });
    // Make changes → clear Model, Variant
    $(document).on('change','#filterVehicleMake',function(){
        $('#filterVehicleModel').val(null).trigger('change.select2');
        $('#filterVehicleVariant').val(null).trigger('change.select2');
    });
    // Model changes → clear Variant
    $(document).on('change','#filterVehicleModel',function(){
        $('#filterVehicleVariant').val(null).trigger('change.select2');
    });
}

function _updateFilterCount(){
    var c=0;
    // Vehicle tab
    if($('#filterVehicleType').val())c++;
    if($('#filterVehicleMake').val())c++;
    if($('#filterVehicleModel').val())c++;
    if($('#filterVehicleVariant').val())c++;
    if($('#filterVehicleYear').val())c++;
    if($('#filterVehicleFuel').val())c++;
    if($('#filterVehicleCategory').val())c++;
    // Status tab
    if($('#filterInventoryStatus').val())c++;
    if($('#filterDepolutionStatus').val())c++;
    if($('#filterDismantleStatus').val())c++;
    if($('#filterStateParking').val())c++;
    if($('#filterSteeringSide').val())c++;
    // Date tab
    if($('#filterArrivalFrom').val())c++;
    if($('#filterArrivalTo').val())c++;
    if($('#filterProcessStartFrom').val())c++;
    if($('#filterProcessStartTo').val())c++;
    if($('#filterCreatedFrom').val())c++;
    if($('#filterCreatedTo').val())c++;
    // Other tab
    if($('#filterVin').val())c++;
    if($('#filterColor').val())c++;
    if($('#filterBrand').val())c++;
    if($('#filterOwner').val())c++;
    if($('#filterPlate').val())c++;
    if(c>0)$('#filterCount').text(c).removeClass('d-none');else $('#filterCount').addClass('d-none');
}

/* Init */
$(function(){
    _pp=smsInitPerPage('#perPageSel');_loadAdvFilters();
    // Load column config first, then data
    _loadColumnConfig(function(){ loadData(); });
    $(document).on('click','.sms-vi-img',function(e){e.stopPropagation();showAllImages($(this));});
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterStatus,#filterDeleted',function(){_page=1;loadData();});
    /* Sidebar filter changes — reload on offcanvas hide */
    $('#filterSidebar').on('hidden.bs.offcanvas',function(){_page=1;_updateFilterCount();loadData();});
    $(document).on('change','#filterInventoryStatus,#filterDepolutionStatus,#filterDismantleStatus,#filterStateParking',function(){/* updated on sidebar close */});
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    /* Clear inline filters */
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');_clearAdvFilters();_page=1;loadData();});
    /* Clear advanced filters */
    $('#btnClearAdvFilters').on('click',function(){_clearAdvFilters();});

    function _clearAdvFilters(){
        // Status
        $('#filterInventoryStatus,#filterDepolutionStatus,#filterDismantleStatus,#filterStateParking,#filterSteeringSide').val('');
        // Select2 dropdowns
        ['#filterVehicleType','#filterVehicleMake','#filterVehicleModel','#filterVehicleVariant','#filterVehicleYear','#filterVehicleFuel','#filterVehicleCategory'].forEach(function(s){try{$(s).val(null).trigger('change.select2');}catch(e){$(s).val('');}});
        // Dates
        $('#filterArrivalFrom,#filterArrivalTo,#filterProcessStartFrom,#filterProcessStartTo,#filterCreatedFrom,#filterCreatedTo').val('');
        // Text
        $('#filterVin,#filterColor,#filterBrand,#filterOwner,#filterPlate').val('');
        _updateFilterCount();
    }
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});
    /* Import */
    $('#frmImport').on('submit',function(e){e.preventDefault();var fd=new FormData(this);$('#importStep1').addClass('d-none');$('#importProcessing').removeClass('d-none');$.ajax({url:BASE_URL+'/vehicle-inventories/import',type:'POST',data:fd,processData:false,contentType:false,success:function(r){$('#importProcessing').addClass('d-none');if(r.status===200&&r.data){if(r.data.mode==='background'){showImportProgress(r.data.jobId,r.data.total);}else if(r.data.results){$('#importStep2').removeClass('d-none');renderImportResults(r.data.results);}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}}else{$('#importStep1').removeClass('d-none');toastr.error(r.message||'Failed.');}},error:function(){$('#importProcessing').addClass('d-none');$('#importStep1').removeClass('d-none');toastr.error(T('general.network_error','Error.'));}});});
});
