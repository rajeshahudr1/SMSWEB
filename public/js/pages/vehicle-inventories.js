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
        if(!res||res.status!==200){$('#imgModalBody').html('<div class="text-muted text-center py-3">Failed to load.</div>');return;}
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
            var editable=!deleted;
            var deletable=!deleted;

            // Build action dropdown
            var acts='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewVI(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>'+T('general.preview','View')+'</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverVI(\''+r.uuid+'\',\''+H.esc(r.vehicle_internal_id||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>'+T('bulk.recover','Recover')+'</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/vehicle-inventories/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>'+T('btn.edit','Edit')+'</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="toggleVI(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(isActive?'on':'off')+' me-2 text-'+(isActive?'warning':'success')+'"></i>'+(isActive?T('general.deactivate','Deactivate'):T('general.activate','Activate'))+'</a></li>';
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
    $.get(BASE_URL+'/vehicle-inventories/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var vi=res.data||{};

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
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#vvTab6">Docs ('+docs.length+')</a></li></ul>';

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

        // Tab 4: Videos
        h+='<div class="tab-pane fade" id="vvTab4">';
        if(videos.length){h+='<div class="row g-2">';videos.forEach(function(v){var u=v.display_url||v.video_url||'';h+='<div class="col-6 col-sm-4"><a href="'+H.esc(u)+'" target="_blank" class="d-flex align-items-center justify-content-center border rounded bg-light" style="height:80px;"><i class="bi bi-play-circle" style="font-size:28px;"></i></a></div>';});h+='</div>';}
        else h+='<div class="text-muted text-center py-3">No videos</div>';
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

        h+='</div>'; // end tab-content

        // Timestamps
        h+='<div class="border-top mt-3 pt-2 d-flex flex-wrap gap-3" style="font-size:11px;">';
        h+='<span class="text-muted">Created: '+smsFormatDateTime(vi.created_at)+'</span>';
        h+='<span class="text-muted">Updated: '+smsFormatDateTime(vi.updated_at)+'</span>';
        h+='</div>';

        h+='</div>';
        $b.html(h);
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Error.')+'</div>');});
}

/* Actions */
function toggleVI(u){$.post(BASE_URL+'/vehicle-inventories/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delVI(u,n){smsConfirm({icon:'\uD83D\uDDD1\uFE0F',title:T('vehicle_inventories.delete','Delete'),msg:T('general.are_you_sure','Sure?')+' <strong>'+H.esc(n)+'</strong>',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-inventories/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function recoverVI(u,n){smsConfirm({icon:'\u267B\uFE0F',title:T('bulk.recover','Recover'),msg:T('bulk.recover','Recover')+' <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:T('bulk.recover','Recover'),onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-inventories/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;var icons={delete:'\uD83D\uDDD1\uFE0F',activate:'\u2705',deactivate:'\u26D4',recover:'\u267B\uFE0F'};smsConfirm({icon:icons[a]||'\u26A0\uFE0F',title:a.charAt(0).toUpperCase()+a.slice(1),msg:_sel.length+' '+T('vehicle_inventories.bulk_affected','items.'),btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a.charAt(0).toUpperCase()+a.slice(1),onConfirm:function(){showLoading();$.post(BASE_URL+'/vehicle-inventories/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* Export */
function doExport(fmt){var p=_filters();p.format=fmt;delete p.page;delete p.per_page;if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){window.location.href=BASE_URL+'/vehicle-inventories/export?'+$.param(p);return;}showLoading();$.post(BASE_URL+'/vehicle-inventories/export',p,function(res){hideLoading();if(!res||res.status!==200||!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}var rows=res.data.rows,cols=Object.keys(rows[0]);var html='<html><head><title>Vehicle Inventories</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Vehicle Inventories ('+rows.length+')</h2><table><thead><tr>';cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});html+='</tbody></table></body></html>';var w=window.open('','_blank');w.document.write(html);w.document.close();if(fmt==='print')setTimeout(function(){w.print();},400);}).fail(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});}

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
