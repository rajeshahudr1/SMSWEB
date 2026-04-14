/* part-inventories.js — index page */
'use strict';
var _page=1,_pp=15,_sel=[],_sort={field:'created_at',dir:'desc'};
var T=function(k,f){return SMS_T(k,f);};

/* Enum maps */
var INV_STATUS={1:'In Stock',2:'Out of Stock',3:'Reserved',4:'Sold'};
var INV_STATUS_COLOR={1:'success',2:'warning',3:'info',4:'purple'};
var CONDITION={1:'OEM',2:'Aftermarket'};
var CONDITION_COLOR={1:'primary',2:'secondary'};
var PART_STATE={1:'New',2:'Used',3:'Remanufactured',4:'Not Working'};
var PART_STATE_COLOR={1:'success',2:'azure',3:'warning',4:'danger'};

/* Dynamic column config */
var _allCols={},_activeCols=[];
function _loadColumnConfig(cb){
    $.get(BASE_URL+'/part-inventories/enums',function(res){
        if(!res||res.status!==200)return cb();
        _allCols=res.data.list_columns||{};
        var configured=res.data.configured_columns;
        if(configured&&configured.length){
            // Drop any stale keys (e.g. legacy _image) that no longer exist in the enum
            _activeCols=configured.filter(function(k){return _allCols[k];});
        }
        else{_activeCols=[];for(var k in _allCols){if(_allCols[k].default)_activeCols.push(k);}}
        _buildDynamicHeader();
        if(cb)cb();
    });
}
function _buildDynamicHeader(){
    var h='<tr><th style="width:42px;"><input type="checkbox" class="form-check-input" id="selectAll"/></th><th style="width:36px;" class="text-muted">#</th>';
    _activeCols.forEach(function(key){
        var col=_allCols[key]||{};
        if(key==='_image'){h+='<th style="width:60px;">'+T('pi._image',col.label||'Image')+'</th>';return;}
        h+='<th class="sortable" data-field="'+key+'">'+T('pi.'+key,col.label||key)+' <i class="bi bi-arrow-down-up text-muted small"></i></th>';
    });
    h+='<th class="text-end" style="width:80px;">Actions</th></tr>';
    $('#piTableHead').html(h);
}
/* Count-column → clickable badge that opens a popup with the related details */
var COUNT_COLS = {
    references_count: { kind: 'references', icon: 'bi-link-45deg',         color: 'azure'  },
    damages_count:    { kind: 'damages',    icon: 'bi-exclamation-triangle',color: 'warning' },
    attributes_count: { kind: 'attributes', icon: 'bi-sliders',            color: 'cyan'   },
    images_count:     { kind: 'images',     icon: 'bi-images',             color: 'primary'},
    videos_count:     { kind: 'videos',     icon: 'bi-camera-video',       color: 'purple' },
    locations_count:  { kind: 'locations',  icon: 'bi-geo-alt',            color: 'green'  }
};
function _countBadge(r, key) {
    var cfg = COUNT_COLS[key]; if (!cfg) return '—';
    // Special: locations show "total-assigned" e.g. "50-5"
    var label;
    if (key === 'locations_count') {
        var total = parseInt(r.locations_total != null ? r.locations_total : r.quantity) || 0;
        var asg   = parseInt(r.locations_assigned) || 0;
        if (total === 0) return '<span class="text-muted small">0</span>';
        label = total + '-' + asg;
    } else {
        var n = parseInt(r[key]) || 0;
        if (n === 0) return '<span class="text-muted small">0</span>';
        label = n;
    }
    return '<a href="#" class="sms-count-pill sms-count-pop sms-count-' + cfg.color + '" data-uuid="' + H.esc(r.uuid||'') + '" data-kind="' + cfg.kind + '" data-name="' + H.esc(r.part_code||'') + '" title="Click to view" onclick="return false;"><i class="bi ' + cfg.icon + ' me-1"></i>' + label + '</a>';
}

// Yes/No badge for boolean columns
var BOOL_KEYS = ['is_master_part','print_label','vat_included','custom_size'];
function _yesNo(v) {
    var t = (v===true||v===1||v==='1'||v==='t'||v==='true');
    return t ? '<span class="badge bg-success-lt">Yes</span>' : '<span class="badge bg-secondary-lt">No</span>';
}
function _customSizeBadge(r) {
    var cs = (r.custom_size===true||r.custom_size===1||r.custom_size==='1'||r.custom_size==='t');
    if (!cs) return '<span class="badge bg-secondary-lt">No</span>';
    var w=r.weight_kg,wd=r.width_cm,h=r.height_cm,l=r.length_cm;
    var has=[w,wd,h,l].some(function(x){return x!=null&&x!=='';});
    if (!has) return '<span class="badge bg-success-lt">Yes</span>';
    var content = '<div class=\'small\'>'
      +(w!=null?'<div><strong>Weight:</strong> '+w+' kg</div>':'')
      +(wd!=null?'<div><strong>Width:</strong> '+wd+' cm</div>':'')
      +(h!=null?'<div><strong>Height:</strong> '+h+' cm</div>':'')
      +(l!=null?'<div><strong>Length:</strong> '+l+' cm</div>':'')
      +'</div>';
    return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-csz-pop" data-bs-toggle="popover" data-bs-trigger="focus" data-bs-html="true" data-bs-placement="left" data-bs-title="Custom Size" data-bs-content="'+content.replace(/"/g,'&quot;')+'"><span class="badge bg-success-lt">Yes <i class="bi bi-info-circle ms-1"></i></span></button>';
}

function _getCellValue(r,key){
    // Special columns
    if(key==='_image')return piImg(r);
    if(key==='_status'){var isA=(r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1);return r.deleted_at?'<span class="badge bg-dark-lt"><i class="bi bi-trash3 me-1"></i>'+T('general.deleted','Deleted')+'</span>':(isA?'<span class="badge bg-success-lt"><span class="status-dot status-dot-animated bg-success me-1"></span>'+T('general.active','Active')+'</span>':'<span class="badge bg-danger-lt">'+T('general.inactive','Inactive')+'</span>');}
    if(key==='_created_at'||key==='created_at')return r.created_at?'<span class="text-muted small">'+smsFormatDateTime(r.created_at)+'</span>':'—';
    if(key==='updated_at')return r.updated_at?'<span class="text-muted small">'+smsFormatDateTime(r.updated_at)+'</span>':'—';
    if(key==='deleted_at')return r.deleted_at?'<span class="text-danger small">'+smsFormatDateTime(r.deleted_at)+'</span>':'—';
    if(COUNT_COLS[key])return _countBadge(r,key);
    // Boolean columns
    if(key==='custom_size')return _customSizeBadge(r);
    if(key==='is_master_part'){
        var im=(r.is_master_part===true||r.is_master_part===1||r.is_master_part==='1'||r.is_master_part==='t');
        if(im){
            return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-master-pop" data-uuid="'+H.esc(r.uuid||'')+'" data-name="'+H.esc(r.part_code||'')+'" title="Click to view sub-parts"><span class="badge bg-primary-lt"><i class="bi bi-diagram-3 me-1"></i>Master</span></button>';
        }
        // Sub-part: show its master
        if(r.master_part_inventory_id && r.master_part_uuid){
            var lbl=r.master_part_code||('#'+r.master_part_internal_id)||r.master_part_catalog_name||'master';
            return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-sub-pop" data-uuid="'+H.esc(r.master_part_uuid)+'" data-name="'+H.esc(lbl)+'" title="Sub of '+H.esc(lbl)+' — click to view master"><span class="badge bg-info-lt"><i class="bi bi-arrow-up-left me-1"></i>Sub · '+H.esc(lbl)+'</span></button>';
        }
        return '<span class="badge bg-secondary-lt">No</span>';
    }
    if(BOOL_KEYS.indexOf(key)!==-1)return _yesNo(r[key]);
    // Composite columns
    if(key==='part_internal_id')return r.part_internal_id?'<strong>#'+H.esc(r.part_internal_id)+'</strong>':'—';
    if(key==='part_name')return H.esc(r.part_catalog_name||'—');
    if(key==='part_brand')return H.esc(r.part_brand_name||'—');
    if(key==='part_type_name')return H.esc(r.part_type_name||'—');
    if(key==='vehicle_internal_id')return H.esc(r.vehicle_inventory_code||r.vehicle_internal_id||'—');
    if(key==='vehicle_info'){
        var parts=[r.vehicle_make_name,r.vehicle_model_name,r.vehicle_variant_name,r.vehicle_year_name].filter(Boolean);
        return parts.length?H.esc(parts.join(' · ')):'—';
    }
    if(key==='warehouse_location')return H.esc(r.warehouse_name||'—');
    if(key==='part_cost_price')return r.cost_price?H.currency(r.cost_price):'—';
    // Notes columns — truncate long text
    if(key==='notes'||key==='extra_notes'||key==='internal_notes'){
        var t=r[key]||'';if(!t)return '—';
        var sh=t.length>40?t.substring(0,40)+'…':t;
        return '<span title="'+H.esc(t)+'">'+H.esc(sh)+'</span>';
    }
    if(key==='rating'){
        if(r.rating==null||r.rating==='')return '—';
        return '<span class="text-warning"><i class="bi bi-star-fill me-1"></i>'+r.rating+'</span>';
    }
    // Enum fields
    if(key==='inventory_status')return '<span class="badge bg-'+(INV_STATUS_COLOR[r.inventory_status]||'secondary')+'-lt">'+(INV_STATUS[r.inventory_status]||'—')+'</span>';
    if(key==='condition')return '<span class="badge bg-'+(CONDITION_COLOR[r.condition]||'secondary')+'-lt">'+(CONDITION[r.condition]||'—')+'</span>';
    if(key==='part_state')return '<span class="badge bg-'+(PART_STATE_COLOR[r.part_state]||'secondary')+'-lt">'+(PART_STATE[r.part_state]||'—')+'</span>';
    // Date fields
    if(key.indexOf('date')!==-1&&r[key])return smsFormatDate(r[key]);
    // Numeric
    if((key==='price_1'||key==='price_2'||key==='cost_price')&&r[key])return H.currency(r[key]);
    if(key==='quantity'&&r[key])return parseInt(r[key]).toLocaleString();
    // Default: text
    return H.esc(String(r[key]||'—'));
}

function piImg(r){var s=r.first_image||r.first_gallery_image||r.display_image_url||'',ok=s&&s.indexOf('no-image')===-1;return '<button type="button" class="btn btn-sm p-0 border-0 bg-transparent sms-pi-img" data-uuid="'+H.esc(r.uuid||'')+'" data-name="'+H.esc(r.part_code||r.part_catalog_name||'')+'"><img src="'+H.esc(ok?s:'/images/no-image.svg')+'" class="rounded border" style="width:40px;height:40px;object-fit:cover;'+(ok?'cursor:pointer;':'opacity:.5;')+'" onerror="this.src=\'/images/no-image.svg\';this.style.opacity=\'.5\';"/></button>';}

function showAllImages($el){
    var uuid=$el.data('uuid')||'',n=$el.data('name')||'';
    if(!uuid)return;
    $('#imgModalTitle').html('<i class="bi bi-images me-2 text-primary"></i>'+H.esc(n||T('part_inventories.image_title','Images')));
    $('#imgModalBody').html('<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalImage')[0]).show();
    $.get(BASE_URL+'/part-inventories/'+uuid+'/view-data',function(res){
        if(!res||res.status!==200){$('#imgModalBody').html('<div class="text-muted text-center py-3">'+T('general.failed_load','Failed.')+'</div>');return;}
        var pi=res.data.part_inventory||res.data||{};
        var images=res.data.images||pi.images||[];
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

function _filters(){
    var v=function(id){var x=$(id).val();return (x!=null&&x!=='')?x:'';};
    var f={page:_page,per_page:_pp,search:$('#searchInput').val().trim(),status:$('#filterStatus').val(),show_deleted:$('#filterDeleted').val(),sort_field:_sort.field,sort_dir:_sort.dir};
    if ($('#deepSearch').is(':checked')) f.deep_search = '1';
    // Vehicle tab
    if(v('#filterVehicleType'))    f.vehicle_type_id    = v('#filterVehicleType');
    if(v('#filterVehicleMake'))    f.vehicle_make_id    = v('#filterVehicleMake');
    if(v('#filterVehicleModel'))   f.vehicle_model_id   = v('#filterVehicleModel');
    if(v('#filterVehicleVariant')) f.vehicle_variant_id = v('#filterVehicleVariant');
    if(v('#filterVehicleYear'))    f.vehicle_year_id    = v('#filterVehicleYear');
    if(v('#filterVehicleFuel'))    f.vehicle_fuel_id    = v('#filterVehicleFuel');
    if(v('#filterVehicleEngine'))  f.vehicle_engine_id  = v('#filterVehicleEngine');
    if(v('#filterMotorization'))   f.motorization       = v('#filterMotorization');
    if(v('#filterCC'))             f.cc                 = v('#filterCC');
    if(v('#filterCV'))             f.cv                 = v('#filterCV');
    if(v('#filterKW'))             f.kw                 = v('#filterKW');
    if(v('#filterVehicleInternalId')) f.vehicle_internal_id_text = v('#filterVehicleInternalId');
    // Part tab
    if(v('#filterPartCode'))       f.part_code          = v('#filterPartCode');
    if(v('#filterPartInternalId')) f.part_internal_id   = v('#filterPartInternalId');
    if(v('#filterPartBrand'))      f.part_brand_id      = v('#filterPartBrand');
    if(v('#filterPartCatalog'))    f.part_catalog_id    = v('#filterPartCatalog');
    if(v('#filterRegNumber'))      f.reg_number_dismantler = v('#filterRegNumber');
    if(v('#filterQtyMin'))         f.qty_min            = v('#filterQtyMin');
    if(v('#filterQtyMax'))         f.qty_max            = v('#filterQtyMax');
    if(v('#filterPriceMin'))       f.price_min          = v('#filterPriceMin');
    if(v('#filterPriceMax'))       f.price_max          = v('#filterPriceMax');
    if(v('#filterCostMin'))        f.cost_min           = v('#filterCostMin');
    if(v('#filterCostMax'))        f.cost_max           = v('#filterCostMax');
    if(v('#filterRatingMin'))      f.rating_min         = v('#filterRatingMin');
    if(v('#filterRatingMax'))      f.rating_max         = v('#filterRatingMax');
    if(v('#filterIsMaster'))       f.is_master_part     = v('#filterIsMaster');
    if(v('#filterPrintLabel'))     f.print_label        = v('#filterPrintLabel');
    if(v('#filterVatIncluded'))    f.vat_included       = v('#filterVatIncluded');
    if(v('#filterCustomSize'))     f.custom_size        = v('#filterCustomSize');
    // Dates & Text tab
    if(v('#filterCreatedFrom'))    f.created_from       = v('#filterCreatedFrom');
    if(v('#filterCreatedTo'))      f.created_to         = v('#filterCreatedTo');
    if(v('#filterUpdatedFrom'))    f.updated_from       = v('#filterUpdatedFrom');
    if(v('#filterUpdatedTo'))      f.updated_to         = v('#filterUpdatedTo');
    if(v('#filterNotes'))          f.notes_search       = v('#filterNotes');
    // Status tab
    if(v('#filterInventoryStatus'))f.inventory_status   = v('#filterInventoryStatus');
    if(v('#filterCondition'))      f.condition          = v('#filterCondition');
    if(v('#filterPartState'))      f.part_state         = v('#filterPartState');
    // Location tab
    if(v('#filterWarehouse'))      f.warehouse_id       = v('#filterWarehouse');
    if(v('#filterZone'))           f.warehouse_zone_id  = v('#filterZone');
    if(v('#filterShelf'))          f.warehouse_shelf_id = v('#filterShelf');
    if(v('#filterRack'))           f.warehouse_rack_id  = v('#filterRack');
    if(v('#filterBin'))            f.warehouse_bin_id   = v('#filterBin');
    return f;
}

function loadData(){
    var colSpan=_activeCols.length+6;
    $('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>'+T('general.loading','Loading...')+'</td></tr>');
    var isDeleted=$('#filterDeleted').val()==='only';
    if(isDeleted)$('#btnBulkRecover').removeClass('d-none');else $('#btnBulkRecover').addClass('d-none');

    $.post(BASE_URL+'/part-inventories/paginate',_filters(),function(res){
        if(!res||res.status!==200){$('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-4 text-danger">'+T('general.failed_load','Failed.')+'</td></tr>');return;}
        var data=(res.data&&res.data.data)||[],pg=(res.data&&res.data.pagination)||{};
        $('#badgeTotal').text((pg.total||0).toLocaleString());
        if(!data.length){$('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-5 text-muted"><i class="bi bi-box-seam d-block mb-2" style="font-size:36px;opacity:.3;"></i>'+T('part_inventories.no_data','No part inventories found')+'</td></tr>');$('#tableInfo').text('');$('#tablePagination').html('');return;}

        var start=((_page-1)*_pp),rows='';
        data.forEach(function(r,i){
            var deleted=!!r.deleted_at;
            var isActive=(r.status===true||r.status===1||r.status==='1'||parseInt(r.status)===1);
            var editable=!deleted && r.is_editable !== false;
            var deletable=!deleted && r.is_deletable !== false;

            // ── Action column: Shortcut button + main dropdown side-by-side ──
            var acts='<div class="d-inline-flex gap-1">';

            // Shortcut dropdown (separate button — yellow lightning icon)
            if(editable){
                var ed=BASE_URL+'/part-inventories/'+r.uuid+'/edit';
                acts+='<div class="dropdown">';
                acts+='<button class="btn btn-sm btn-ghost-warning" data-bs-toggle="dropdown" title="Shortcut"><i class="bi bi-lightning-charge-fill"></i></button>';
                acts+='<ul class="dropdown-menu dropdown-menu-end">';
                acts+='<li><h6 class="dropdown-header text-warning"><i class="bi bi-lightning-charge me-1"></i>Shortcuts</h6></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bSel"><i class="bi bi-box-seam me-2 text-primary"></i>Update Part</a></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bDetails"><i class="bi bi-sliders me-2 text-secondary"></i>Update Details</a></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bRefs"><i class="bi bi-link-45deg me-2 text-azure"></i>Update References</a></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bDamages"><i class="bi bi-exclamation-triangle me-2 text-warning"></i>Update Damages</a></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bAttrs"><i class="bi bi-sliders me-2 text-cyan"></i>Update Attributes</a></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bImages"><i class="bi bi-images me-2 text-primary"></i>Update Images</a></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bVideos"><i class="bi bi-camera-video me-2 text-purple"></i>Update Videos</a></li>';
                acts+='<li><a class="dropdown-item" href="'+ed+'#tab-bLocations"><i class="bi bi-geo-alt me-2 text-green"></i>Update Locations</a></li>';
                acts+='</ul></div>';
            }

            // Main action dropdown
            acts+='<div class="dropdown">';
            acts+='<button class="btn btn-sm btn-ghost-secondary" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>';
            acts+='<ul class="dropdown-menu dropdown-menu-end">';
            acts+='<li><a class="dropdown-item" href="#" onclick="viewPT(\''+r.uuid+'\');return false;"><i class="bi bi-eye me-2 text-primary"></i>'+T('general.preview','Preview')+'</a></li>';
            if (r.vehicle_inventory_id) {
                acts+='<li><a class="dropdown-item" href="#" onclick="viewVehiclePopup(\''+r.vehicle_inventory_uuid+'\',\''+H.esc(r.vehicle_inventory_code||'')+'\');return false;"><i class="bi bi-truck me-2 text-info"></i>Vehicle Details</a></li>';
            }
            acts+='<li><a class="dropdown-item" href="#" onclick="downloadPdfPI(\''+r.uuid+'\');return false;"><i class="bi bi-file-earmark-pdf me-2 text-danger"></i>Download PDF</a></li>';
            if(deleted){
                acts+='<li><a class="dropdown-item" href="#" onclick="recoverPT(\''+r.uuid+'\',\''+H.esc(r.part_code||'')+'\');return false;"><i class="bi bi-arrow-counterclockwise me-2 text-success"></i>'+T('bulk.recover','Recover')+'</a></li>';
            }else{
                if(editable)acts+='<li><a class="dropdown-item" href="'+BASE_URL+'/part-inventories/'+r.uuid+'/edit"><i class="bi bi-pencil me-2 text-secondary"></i>'+T('btn.edit','Edit')+'</a></li>';
                if(editable)acts+='<li><a class="dropdown-item" href="#" onclick="togglePT(\''+r.uuid+'\');return false;"><i class="bi bi-toggle-'+(isActive?'on':'off')+' me-2 text-'+(isActive?'warning':'success')+'"></i>'+(isActive?T('general.deactivate','Deactivate'):T('general.activate','Activate'))+'</a></li>';
                acts+='<li><a class="dropdown-item" href="#" onclick="showUsage(\''+r.uuid+'\',\''+H.esc(r.part_code||'')+'\');return false;"><i class="bi bi-clock-history me-2 text-info"></i>'+T('general.usage','Usage')+'</a></li>';
                if(deletable){acts+='<li><hr class="dropdown-divider"/></li>';acts+='<li><a class="dropdown-item text-danger" href="#" onclick="delPT(\''+r.uuid+'\',\''+H.esc(r.part_code||'')+'\');return false;"><i class="bi bi-trash3 me-2"></i>'+T('btn.delete','Delete')+'</a></li>';}
            }
            acts+='</ul></div></div>'; // close main dropdown + outer wrapper

            // Build row
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
        // Init custom-size popovers (one per visible row that has a custom size)
        if(typeof bootstrap!=='undefined'&&bootstrap.Popover){
            $('#tableBody .sms-csz-pop').each(function(){new bootstrap.Popover(this,{html:true,sanitize:false,container:'body'});});
        }
    }).fail(function(){$('#tableBody').html('<tr><td colspan="'+colSpan+'" class="text-center py-4 text-danger">'+T('general.network_error','Network error.')+'</td></tr>');});
}

function smsPg(pg){if(!pg||pg.last_page<=1)return '';var cp=pg.current_page,lp=pg.last_page;var h='<nav><ul class="pagination pagination-sm mb-0 flex-wrap gap-1">';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="1"><i class="bi bi-chevron-double-left"></i></a></li>';h+='<li class="page-item '+(cp<=1?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp-1)+'"><i class="bi bi-chevron-left"></i></a></li>';var pgs=[],prev=0;for(var i=1;i<=lp;i++){if(i===1||i===lp||Math.abs(i-cp)<=1){if(prev&&i-prev>1)pgs.push('...');pgs.push(i);prev=i;}}pgs.forEach(function(p){if(p==='...')h+='<li class="page-item disabled"><span class="page-link">...</span></li>';else h+='<li class="page-item '+(p===cp?'active':'')+'"><a class="page-link sms-pg" href="#" data-p="'+p+'">'+p+'</a></li>';});h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+(cp+1)+'"><i class="bi bi-chevron-right"></i></a></li>';h+='<li class="page-item '+(cp>=lp?'disabled':'')+'"><a class="page-link sms-pg" href="#" data-p="'+lp+'"><i class="bi bi-chevron-double-right"></i></a></li></ul></nav>';return h;}

/* View modal */
function viewPT(uuid){
    var $b=$('#viewBody');
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.when(
        $.get(BASE_URL+'/part-inventories/'+uuid+'/view-data'),
        $.get(BASE_URL+'/part-inventories/'+uuid+'/attributes'),
        $.get(BASE_URL+'/part-inventories/'+uuid+'/sub-parts')
    ).done(function(viewRes, attrRes, subRes){
        var res = viewRes && viewRes[0];
        var attrR = attrRes && attrRes[0];
        var subR = subRes && subRes[0];
        if(!res||res.status!==200){$b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>');return;}
        var pi=res.data||{};
        var images=pi.images||[];
        if (attrR && attrR.status === 200) {
            pi.attributes = (attrR.data && attrR.data.attributes) || (Array.isArray(attrR.data) ? attrR.data : []);
        }
        if (subR && subR.status === 200 && Array.isArray(subR.data)) {
            pi.sub_parts = subR.data;
        }

        function _r(label,val){var v;if(val==null||val===''){v='—';}else{v=String(val);if(/^\d{4}-\d{2}-\d{2}/.test(v))v=smsFormatDate(v);}return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value '+(val==null||val===''?'text-muted':'')+'">'+H.esc(v)+'</span></div></div>';}
        function _rb(label,html){if(!html||html==='—'){html='<span class="text-muted">—</span>';}return '<div class="col-sm-6"><div class="sms-detail-row"><span class="sms-detail-label">'+H.esc(label)+'</span><span class="sms-detail-value">'+html+'</span></div></div>';}
        function _section(title,icon,content){return '<div class="mb-3"><div class="fw-semibold small mb-1" style="color:var(--tblr-primary);"><i class="bi '+icon+' me-1"></i>'+title+'</div><div class="border rounded p-2"><div class="row g-0">'+content+'</div></div></div>';}

        var h='<div class="p-3">';
        // Header badges
        h+='<div class="d-flex flex-wrap gap-2 mb-3 align-items-center">';
        if(pi.part_internal_id)h+='<span class="badge bg-secondary-lt" style="font-size:12px;">#'+H.esc(pi.part_internal_id)+'</span>';
        if(pi.part_code)h+='<span class="badge bg-primary-lt" style="font-size:12px;">'+H.esc(pi.part_code)+'</span>';
        if(pi.part_catalog_name)h+='<span class="badge bg-azure-lt" style="font-size:12px;">'+H.esc(pi.part_catalog_name)+'</span>';
        h+=_rb('',INV_STATUS[pi.inventory_status]?'<span class="badge bg-'+(INV_STATUS_COLOR[pi.inventory_status]||'secondary')+'-lt">'+INV_STATUS[pi.inventory_status]+'</span>':'');
        if(pi.is_master_part===true||pi.is_master_part===1)h+='<span class="badge bg-primary"><i class="bi bi-diagram-3 me-1"></i>Master Part</span>';
        if(pi.master_part_inventory_id)h+='<span class="badge bg-info"><i class="bi bi-arrow-up-left me-1"></i>Sub of '+H.esc(pi.master_part_code||('#'+pi.master_part_internal_id)||'master')+'</span>';
        h+='</div>';

        var refs=pi.references||[],dmgs=pi.damages||[],locs=pi.locations||[],vids=pi.videos||[],attrs=pi.attributes||[],subs=pi.sub_parts||[];
        var isMaster=(pi.is_master_part===true||pi.is_master_part===1);
        // Tabs
        h+='<ul class="nav nav-tabs mb-3" style="font-size:12px;"><li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#pvTab1">'+T('part_inventories.tab_part_info','Part Info')+'</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab2">'+T('part_inventories.tab_vehicle_info','Vehicle')+'</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab4">Extra</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab7">References ('+refs.length+')</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab8">Damages ('+dmgs.length+')</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab9">Attributes ('+attrs.length+')</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab5">Images ('+images.length+')</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab6">Videos ('+vids.length+')</a></li>';
        h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab3">Locations ('+locs.length+')</a></li>';
        if(isMaster)h+='<li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#pvTab10">Sub Parts ('+subs.length+')</a></li>';
        h+='</ul>';

        h+='<div class="tab-content">';

        // Tab 1: Part Info
        h+='<div class="tab-pane fade show active" id="pvTab1">';
        h+=_section(T('part_inventories.part_catalog_selection','Part Catalog'),'bi-book',
            _r(T('part_inventories.part_catalog','Catalog'),pi.part_catalog_name)+_r(T('part_inventories.part_code','Code'),pi.part_code)+_r(T('part_inventories.quantity','Qty'),pi.quantity));
        h+=_section(T('part_inventories.pricing','Pricing'),'bi-currency-euro',
            _r(T('part_inventories.price_1','Price 1'),H.currency(pi.price_1))+_r(T('part_inventories.price_2','Price 2'),H.currency(pi.price_2))+_r(T('part_inventories.cost_price','Cost'),H.currency(pi.cost_price)));
        h+=_section(T('part_inventories.part_classification','Classification'),'bi-tags',
            _r(T('part_inventories.part_brand','Brand'),pi.part_brand_name)+
            _rb(T('part_inventories.inventory_status','Inventory'),INV_STATUS[pi.inventory_status]?'<span class="badge bg-'+(INV_STATUS_COLOR[pi.inventory_status]||'secondary')+'-lt">'+INV_STATUS[pi.inventory_status]+'</span>':'')+
            _rb(T('part_inventories.condition','Condition'),CONDITION[pi.condition]?'<span class="badge bg-'+(CONDITION_COLOR[pi.condition]||'secondary')+'-lt">'+CONDITION[pi.condition]+'</span>':'')+
            _rb(T('part_inventories.part_state','State'),PART_STATE[pi.part_state]?'<span class="badge bg-'+(PART_STATE_COLOR[pi.part_state]||'secondary')+'-lt">'+PART_STATE[pi.part_state]+'</span>':''));
        h+='</div>';

        // Tab 2: Vehicle Info
        h+='<div class="tab-pane fade" id="pvTab2">';
        h+=_section(T('part_inventories.vehicle_selection','Vehicle'),'bi-truck',
            _r(T('part_inventories.vehicle_type','Type'),pi.vehicle_type_name)+_r(T('part_inventories.vehicle_year','Year'),pi.vehicle_year_name)+
            _r(T('part_inventories.vehicle_make','Make'),pi.vehicle_make_name)+_r(T('part_inventories.vehicle_model','Model'),pi.vehicle_model_name)+
            _r(T('part_inventories.vehicle_variant','Variant'),pi.vehicle_variant_name)+_r(T('part_inventories.vehicle_engine','Engine'),pi.vehicle_engine_name)+
            _r(T('part_inventories.vehicle_fuel','Fuel'),pi.vehicle_fuel_name));
        h+=_section(T('part_inventories.engine_performance','Engine & Performance'),'bi-speedometer',
            _r(T('part_inventories.motorization','Motorization'),pi.motorization)+_r(T('part_inventories.cc','CC'),pi.cc)+
            _r(T('part_inventories.cv','CV'),pi.cv)+_r(T('part_inventories.kw','KW'),pi.kw));
        h+='</div>';

        // Tab 3: Locations (per-unit table)
        h+='<div class="tab-pane fade" id="pvTab3">';
        if(locs.length){
            h+='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead><tr><th>Unit</th><th>Warehouse</th><th>Zone</th><th>Shelf</th><th>Rack</th><th>Bin</th><th>Code</th><th>Notes</th></tr></thead><tbody>';
            locs.forEach(function(l){h+='<tr><td>'+(l.unit_number||'—')+'</td><td>'+H.esc(l.warehouse_name||'—')+'</td><td>'+H.esc(l.warehouse_zone_name||'—')+'</td><td>'+H.esc(l.warehouse_shelf_name||'—')+'</td><td>'+H.esc(l.warehouse_rack_name||'—')+'</td><td>'+H.esc(l.warehouse_bin_name||'—')+'</td><td>'+H.esc(l.location_code||'—')+'</td><td>'+H.esc(l.notes||'—')+'</td></tr>';});
            h+='</tbody></table></div>';
        } else h+='<div class="text-muted text-center py-3">No locations.</div>';
        h+=_r(T('part_inventories.reg_number_dismantler','Reg No Dismantler'),pi.reg_number_dismantler);
        h+='</div>';

        // Tab 4: Extra
        h+='<div class="tab-pane fade" id="pvTab4">';
        h+=_section(T('part_inventories.dimensions','Dimensions'),'bi-rulers',
            _rb(T('part_inventories.custom_size','Custom Size'),(pi.custom_size===true||pi.custom_size===1)?'<span class="badge bg-success-lt">Yes</span>':'<span class="badge bg-secondary-lt">No</span>')+
            _r(T('part_inventories.weight','Weight'),pi.weight)+_r(T('part_inventories.width','Width'),pi.width)+
            _r(T('part_inventories.height','Height'),pi.height)+_r(T('part_inventories.length','Length'),pi.length));
        h+=_section(T('part_inventories.options','Options'),'bi-toggles',
            _rb(T('part_inventories.print_label','Print Label'),(pi.print_label===true||pi.print_label===1)?'<span class="badge bg-success-lt">Yes</span>':'<span class="badge bg-secondary-lt">No</span>')+
            _rb(T('part_inventories.vat_included','VAT Included'),(pi.vat_included===true||pi.vat_included===1)?'<span class="badge bg-success-lt">Yes</span>':'<span class="badge bg-secondary-lt">No</span>')+
            _r(T('part_inventories.rating','Rating'),pi.rating));
        h+=_section(T('part_inventories.notes','Notes'),'bi-journal-text',
            _r(T('part_inventories.notes_field','Notes'),pi.notes)+_r(T('part_inventories.extra_notes','Extra Notes'),pi.extra_notes)+
            _r(T('part_inventories.internal_notes','Internal Notes'),pi.internal_notes));
        h+='</div>';

        // Damage lookups by media id
        function _dmgsForMedia(id, kind){
            var key = (kind === 'image') ? 'image_ids' : 'video_ids';
            return dmgs.filter(function(d) {
                var ids = (d[key] || []).map(String);
                return ids.indexOf(String(id)) !== -1;
            });
        }
        function _dmgBadges(items) {
            if (!items.length) return '';
            return '<div class="mt-1 d-flex flex-wrap gap-1">' + items.map(function(d, i) {
                var lbl = (d.damage_description || d.description || 'Damage') + ' #' + (dmgs.indexOf(d)+1);
                return '<span class="badge bg-warning-lt" style="font-size:10px;" title="'+H.esc(lbl)+'"><i class="bi bi-exclamation-triangle me-1"></i>'+H.esc(lbl)+'</span>';
            }).join('') + '</div>';
        }

        // Tab 5: Images
        h+='<div class="tab-pane fade" id="pvTab5">';
        if(images.length){
            h+='<div class="row g-2">';
            images.forEach(function(img){
                var u=img.display_url||img.image_url||'';
                var iid = img.id || img.image_id || '';
                var linked = _dmgsForMedia(iid, 'image');
                h+='<div class="col-4 col-sm-3">'
                  +  '<div class="border rounded p-1">'
                  +    '<a href="'+H.esc(u)+'" target="_blank"><img src="'+H.esc(u)+'" class="rounded" style="width:100%;height:80px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/></a>'
                  +    _dmgBadges(linked)
                  +  '</div>'
                  +'</div>';
            });
            h+='</div>';
        } else h+='<div class="text-muted text-center py-3">'+T('part_inventories.no_images','No images')+'</div>';
        h+='</div>';

        // Tab 6: Videos
        h+='<div class="tab-pane fade" id="pvTab6">';
        if(vids.length){
            h+='<div class="row g-2">';
            vids.forEach(function(v){
                var u=v.display_url||v.video_url||'';
                var vid = v.id || v.video_id || '';
                var linked = _dmgsForMedia(vid, 'video');
                h+='<div class="col-6 col-sm-4">'
                  +  '<div class="border rounded p-1">'
                  +    '<video src="'+H.esc(u)+'#t=1" controls preload="metadata" style="width:100%;height:120px;object-fit:cover;border-radius:4px;"></video>'
                  +    _dmgBadges(linked)
                  +  '</div>'
                  +'</div>';
            });
            h+='</div>';
        } else h+='<div class="text-muted text-center py-3">No videos</div>';
        h+='</div>';

        // Tab 7: References
        h+='<div class="tab-pane fade" id="pvTab7">';
        if(refs.length){
            h+='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead><tr><th>Code</th><th>Condition</th><th>Type</th><th>Brand</th><th>Manufacturer</th></tr></thead><tbody>';
            refs.forEach(function(rf){h+='<tr><td>'+H.esc(rf.reference_code||'—')+'</td><td>'+(CONDITION[rf.condition]||'—')+'</td><td>'+({1:'Compatible',2:'Written on Label'}[rf.reference_type]||'—')+'</td><td>'+H.esc(rf.brand||'—')+'</td><td>'+H.esc(rf.manufacturer||'—')+'</td></tr>';});
            h+='</tbody></table></div>';
        } else h+='<div class="text-muted text-center py-3">No references</div>';
        h+='</div>';

        // Tab 8: Damages
        h+='<div class="tab-pane fade" id="pvTab8">';
        if(dmgs.length){
            h+='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead><tr><th>Description</th><th>Type</th><th>Location</th><th>Rating</th></tr></thead><tbody>';
            dmgs.forEach(function(d){h+='<tr><td>'+H.esc(d.damage_description||d.description||'—')+'</td><td>'+({1:'Does Not Affect Function',2:'Affects Function'}[d.damage_type]||'—')+'</td><td>'+({1:'Internal',2:'External'}[d.damage_location]||'—')+'</td><td>'+(d.damage_rating!=null?d.damage_rating:'—')+'</td></tr>';});
            h+='</tbody></table></div>';
        } else h+='<div class="text-muted text-center py-3">No damages</div>';
        h+='</div>';

        // Tab 9: Attributes
        h+='<div class="tab-pane fade" id="pvTab9">';
        if(attrs.length){
            h+='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead><tr><th>Attribute</th><th>Value</th></tr></thead><tbody>';
            attrs.forEach(function(a){var v=a.value;if(Array.isArray(v))v=v.join(', ');h+='<tr><td>'+H.esc(a.label_name||a.name||'—')+'</td><td>'+H.esc(v!=null?String(v):'—')+'</td></tr>';});
            h+='</tbody></table></div>';
        } else h+='<div class="text-muted text-center py-3">No attributes configured</div>';
        h+='</div>';

        // Tab 10: Sub Parts (only if master)
        if(isMaster){
            h+='<div class="tab-pane fade" id="pvTab10">';
            if(subs.length){
                h+='<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;"><thead><tr><th>#</th><th>Internal ID</th><th>Part Code</th><th>Catalog</th><th>Brand</th><th>Qty</th><th>Status</th></tr></thead><tbody>';
                subs.forEach(function(p,i){h+='<tr><td>'+(i+1)+'</td><td>#'+H.esc(p.part_internal_id||'—')+'</td><td>'+H.esc(p.part_code||'—')+'</td><td>'+H.esc(p.part_catalog_name||'—')+'</td><td>'+H.esc(p.part_brand_name||'—')+'</td><td>'+(p.quantity||'—')+'</td><td>'+(INV_STATUS[p.inventory_status]||'—')+'</td></tr>';});
                h+='</tbody></table></div>';
            } else h+='<div class="text-muted text-center py-3">No sub parts</div>';
            h+='</div>';
        }

        h+='</div>'; // end tab-content

        // Timestamps
        h+='<div class="border-top mt-3 pt-2 d-flex flex-wrap gap-3" style="font-size:11px;">';
        h+='<span class="text-muted">'+T('general.created','Created')+': '+smsFormatDateTime(pi.created_at)+'</span>';
        h+='<span class="text-muted">'+T('general.updated','Updated')+': '+smsFormatDateTime(pi.updated_at)+'</span>';
        h+='</div>';

        h+='</div>';
        $b.html(h);
    }).fail(function(){$b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Error.')+'</div>');});
}


/* Actions */
function togglePT(u){$.post(BASE_URL+'/part-inventories/'+u+'/toggle-status',function(r){if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);});}
function delPT(u,n){smsConfirm({icon:'\uD83D\uDDD1\uFE0F',title:T('part_inventories.delete','Delete'),msg:T('general.are_you_sure','Sure?')+' <strong>'+H.esc(n)+'</strong>',btnClass:'btn-danger',btnText:T('btn.delete','Delete'),onConfirm:function(){showLoading();$.post(BASE_URL+'/part-inventories/'+u+'/delete',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}
function recoverPT(u,n){smsConfirm({icon:'\u267B\uFE0F',title:T('bulk.recover','Recover'),msg:T('bulk.recover','Recover')+' <strong>'+H.esc(n)+'</strong>?',btnClass:'btn-success',btnText:T('bulk.recover','Recover'),onConfirm:function(){showLoading();$.post(BASE_URL+'/part-inventories/'+u+'/recover',function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* Cross-page: open the vehicle preview from this page */
function viewVehiclePopup(uuid, name) {
    if (!uuid) { toastr.warning('No vehicle linked.'); return; }
    var $b = $('#viewBody');
    $('#viewModalTitle').html('<i class="bi bi-truck me-2 text-info"></i>Vehicle: ' + H.esc(name||''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
    $.get(BASE_URL + '/vehicle-inventories/' + uuid + '/view-data', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">Failed to load.</div>'); return; }
        var vi = res.data || {};
        var INV={1:'In Stock',2:'Out of Stock',3:'Sent to Wastage'};
        function _r(l,v){if(v==null||v==='')v='—';return '<div class="col-sm-6 mb-1"><span class="text-muted small">'+H.esc(l)+':</span> <strong>'+H.esc(String(v))+'</strong></div>';}
        var h = '<div class="p-3">';
        h += '<div class="d-flex flex-wrap gap-2 mb-3">';
        if (vi.vehicle_internal_id) h += '<span class="badge bg-primary-lt">#'+H.esc(vi.vehicle_internal_id)+'</span>';
        if (vi.registration_plate_no) h += '<span class="badge bg-azure-lt">'+H.esc(vi.registration_plate_no)+'</span>';
        if (INV[vi.inventory_status]) h += '<span class="badge bg-success-lt">'+INV[vi.inventory_status]+'</span>';
        h += '</div>';
        h += '<div class="border rounded p-2 mb-2"><div class="fw-semibold small text-primary mb-2"><i class="bi bi-car-front me-1"></i>Vehicle Selection</div><div class="row g-0">';
        h += _r('Type',vi.vehicle_type_name)+_r('Year',vi.vehicle_year_name)+_r('Make',vi.vehicle_make_name)+_r('Model',vi.vehicle_model_name)+_r('Variant',vi.vehicle_variant_name)+_r('Engine',vi.vehicle_engine_name)+_r('Fuel',vi.vehicle_fuel_name)+_r('Category',vi.vehicle_category_name);
        h += '</div></div>';
        h += '<div class="border rounded p-2 mb-2"><div class="fw-semibold small text-primary mb-2"><i class="bi bi-card-heading me-1"></i>Registration & ID</div><div class="row g-0">';
        h += _r('Plate No',vi.registration_plate_no)+_r('Reg No',vi.registration_no)+_r('VIN',vi.vehicle_vin)+_r('Internal ID',vi.vehicle_internal_id);
        h += '</div></div>';
        h += '<div class="border rounded p-2 mb-2"><div class="fw-semibold small text-primary mb-2"><i class="bi bi-info-circle me-1"></i>Vehicle Details</div><div class="row g-0">';
        h += _r('Brand',vi.brand)+_r('Color',vi.vehicle_color)+_r('KMS',vi.vehicle_kms)+_r('Doors',vi.vehicle_doors)+_r('Provenance',vi.vehicle_provenance)+_r('Gross Weight',vi.vehicle_total_gross_weight);
        h += '</div></div>';
        h += '<div class="border rounded p-2 mb-2"><div class="fw-semibold small text-primary mb-2"><i class="bi bi-speedometer me-1"></i>Engine & Performance</div><div class="row g-0">';
        h += _r('Motorization',vi.motorization)+_r('Ccm3',vi.ccm3)+_r('Power KW',vi.power_kw)+_r('HP',vi.hp);
        h += '</div></div>';
        h += '<div class="text-end mt-3"><a href="'+BASE_URL+'/vehicle-inventories/'+H.esc(vi.uuid||'')+'/edit" class="btn btn-sm btn-primary"><i class="bi bi-pencil me-1"></i>Open Full Edit</a></div>';
        h += '</div>';
        $b.html(h);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">Network error.</div>'); });
}

/* Usage modal */
function showUsage(uuid, name) {
    var $b = $('#usageBody');
    $('#usageModalName').text('Usage: ' + (name || ''));
    $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
    bootstrap.Modal.getOrCreateInstance($('#modalUsage')[0]).show();
    $.get(BASE_URL + '/part-inventories/' + uuid + '/usage', function(res) {
        if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">'+T('msg.failed','Failed.')+'</div>'); return; }
        smsRenderUsageBody(res.data, 'part-inventories', uuid, name);
    }).fail(function() { $b.html('<div class="alert alert-danger m-3">'+T('general.network_error','Network error.')+'</div>'); });
}

function updateBulk(){_sel=[];$('.row-chk:checked').each(function(){_sel.push($(this).data('uuid'));});$('#bulkCount').text(_sel.length);_sel.length>0?$('#bulkBar').removeClass('d-none'):$('#bulkBar').addClass('d-none');}
function bulkAction(a){if(!_sel.length)return;var icons={delete:'\uD83D\uDDD1\uFE0F',activate:'\u2705',deactivate:'\u26D4',recover:'\u267B\uFE0F'};smsConfirm({icon:icons[a]||'\u26A0\uFE0F',title:a.charAt(0).toUpperCase()+a.slice(1),msg:_sel.length+' '+T('part_inventories.bulk_affected','items.'),btnClass:a==='delete'?'btn-danger':'btn-primary',btnText:a.charAt(0).toUpperCase()+a.slice(1),onConfirm:function(){showLoading();$.post(BASE_URL+'/part-inventories/bulk-action',{action:a,uuids:JSON.stringify(_sel)},function(r){hideLoading();if(r.status===200){toastr.success(r.message);loadData();}else toastr.error(r.message);}).fail(function(){hideLoading();toastr.error(T('general.network_error','Error.'));});}});}

/* PDF Download — direct download, no new tab */
function downloadPdfPI(uuid) {
    toastr.info('Generating PDF...');
    var a = document.createElement('a');
    a.href = BASE_URL + '/part-inventories/' + uuid + '/pdf';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/* Export */
function doExport(fmt){
    var p=_filters();delete p.page;delete p.per_page;p.format=fmt;
    if(fmt==='csv'||fmt==='excel'||fmt==='pdf'){
        showLoading();
        var checkP=$.extend({},p,{check:'1'});
        $.post(BASE_URL+'/part-inventories/export',checkP,function(res){
            hideLoading();
            if(!res||res.status!==200){toastr.error(res?res.message:'Failed.');return;}
            if(res.data&&res.data.mode==='background'){
                toastr.info(T('export.processing','Export is processing in background. You will receive a notification and email when ready.'));
                if(typeof smsTrackJob==='function') smsTrackJob(res.data.jobId,{onComplete:function(job){if(typeof fetchUnreadCount==='function')fetchUnreadCount();if(job.status==='completed')toastr.success(T('export.ready','Export ready! Check notifications to download.'));else toastr.error(T('export.failed','Export failed.'));}});
                return;
            }
            // Inline path: stay on page, fetch as blob, trigger download
            showLoading();
            toastr.info(T('export.generating','Generating export...'));
            fetch(BASE_URL+'/part-inventories/export?'+$.param(p),{credentials:'same-origin'})
                .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.blob();})
                .then(function(blob){
                    hideLoading();
                    var url=URL.createObjectURL(blob);
                    var a=document.createElement('a');a.href=url;
                    a.download='part-inventory-'+Date.now()+'.'+(fmt==='excel'?'xlsx':(fmt==='pdf'?'pdf':'csv'));
                    document.body.appendChild(a);a.click();document.body.removeChild(a);
                    setTimeout(function(){URL.revokeObjectURL(url);},1000);
                    toastr.success(T('export.ready','Export ready.'));
                })
                .catch(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});
        }).fail(function(){hideLoading();toastr.error(T('general.network_error','Network error.'));});
        return;
    }
    showLoading();
    $.post(BASE_URL+'/part-inventories/export',p,function(res){
        hideLoading();
        if(!res||res.status!==200){toastr.error(res?res.message:'Failed.');return;}
        if(res.data&&res.data.mode==='background'){toastr.info(T('export.processing','Export is processing in background. You will receive a notification and email when ready.'));return;}
        if(!res.data||!res.data.rows||!res.data.rows.length){toastr.error(T('general.no_data','No data.'));return;}
        var rows=res.data.rows,cols=Object.keys(rows[0]);
        var html='<html><head><title>Part Inventories</title><style>body{font-family:Arial;font-size:12px;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f0f4f8;font-weight:600;}tr:nth-child(even){background:#fafafa;}</style></head><body><h2>Part Inventories ('+rows.length+')</h2><table><thead><tr>';
        cols.forEach(function(c){html+='<th>'+H.esc(c)+'</th>';});html+='</tr></thead><tbody>';
        rows.forEach(function(r){html+='<tr>';cols.forEach(function(c){html+='<td>'+H.esc(String(r[c]||''))+'</td>';});html+='</tr>';});
        html+='</tbody></table></body></html>';
        var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},400);
    }).fail(function(){hideLoading();toastr.error(T('msg.failed','Failed.'));});
}

/* Advanced filters — Select2 init */
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
    // Vehicle tab — cascade
    _initSelect2Filter('#filterVehicleType','/vehicle-types/autocomplete','All Types');
    _initSelect2Filter('#filterVehicleMake','/vehicle-makes/autocomplete','All Makes',function(){
        var tid=$('#filterVehicleType').val(); return tid?{vehicle_type_id:tid}:{};
    });
    _initSelect2Filter('#filterVehicleModel','/vehicle-models/autocomplete','All Models',function(){
        var mid=$('#filterVehicleMake').val(); return mid?{vehicle_make_id:mid}:{};
    });
    _initSelect2Filter('#filterVehicleVariant','/vehicle-variants/autocomplete','All Variants',function(){
        var mid=$('#filterVehicleModel').val(); return mid?{vehicle_model_id:mid}:{};
    });
    _initSelect2Filter('#filterVehicleYear','/vehicle-years/autocomplete','All Years');
    _initSelect2Filter('#filterVehicleFuel','/vehicle-fuels/autocomplete','All Fuels');
    _initSelect2Filter('#filterVehicleEngine','/vehicle-engines/autocomplete','All Engines');

    // Vehicle cascade clear
    $(document).on('change','#filterVehicleType',function(){
        $('#filterVehicleMake').val(null).trigger('change.select2');
        $('#filterVehicleModel').val(null).trigger('change.select2');
        $('#filterVehicleVariant').val(null).trigger('change.select2');
    });
    $(document).on('change','#filterVehicleMake',function(){
        $('#filterVehicleModel').val(null).trigger('change.select2');
        $('#filterVehicleVariant').val(null).trigger('change.select2');
    });
    $(document).on('change','#filterVehicleModel',function(){
        $('#filterVehicleVariant').val(null).trigger('change.select2');
    });

    // Part tab
    _initSelect2Filter('#filterPartBrand','/part-brands/autocomplete','All Part Brands');
    _initSelect2Filter('#filterPartCatalog','/part-catalogs/autocomplete','All Part Catalogs');

    // Location tab — cascade
    _initSelect2Filter('#filterWarehouse','/warehouses/autocomplete','All Warehouses');
    _initSelect2Filter('#filterZone','/zones/autocomplete','All Zones',function(){
        var wid=$('#filterWarehouse').val(); return wid?{warehouse_id:wid}:{};
    });
    _initSelect2Filter('#filterShelf','/shelves/autocomplete','All Shelves',function(){
        var zid=$('#filterZone').val(); return zid?{zone_id:zid}:{};
    });
    _initSelect2Filter('#filterRack','/racks/autocomplete','All Racks',function(){
        var sid=$('#filterShelf').val(); return sid?{shelf_id:sid}:{};
    });
    _initSelect2Filter('#filterBin','/bins/autocomplete','All Bins',function(){
        var rid=$('#filterRack').val(); return rid?{rack_id:rid}:{};
    });

    // Location cascade clear
    $(document).on('change','#filterWarehouse',function(){
        $('#filterZone').val(null).trigger('change.select2');
        $('#filterShelf').val(null).trigger('change.select2');
        $('#filterRack').val(null).trigger('change.select2');
        $('#filterBin').val(null).trigger('change.select2');
    });
    $(document).on('change','#filterZone',function(){
        $('#filterShelf').val(null).trigger('change.select2');
        $('#filterRack').val(null).trigger('change.select2');
        $('#filterBin').val(null).trigger('change.select2');
    });
    $(document).on('change','#filterShelf',function(){
        $('#filterRack').val(null).trigger('change.select2');
        $('#filterBin').val(null).trigger('change.select2');
    });
    $(document).on('change','#filterRack',function(){
        $('#filterBin').val(null).trigger('change.select2');
    });
}

function _updateFilterCount(){
    var c=0,bump=function(id){if($(id).val())c++;};
    // Vehicle tab
    ['#filterVehicleType','#filterVehicleMake','#filterVehicleModel','#filterVehicleVariant',
     '#filterVehicleYear','#filterVehicleFuel','#filterVehicleEngine',
     '#filterMotorization','#filterCC','#filterCV','#filterKW','#filterVehicleInternalId'].forEach(bump);
    // Part tab
    ['#filterPartCode','#filterPartInternalId','#filterPartType','#filterPartBrand','#filterPartCatalog','#filterRegNumber',
     '#filterQtyMin','#filterQtyMax','#filterPriceMin','#filterPriceMax','#filterCostMin','#filterCostMax',
     '#filterRatingMin','#filterRatingMax','#filterIsMaster','#filterPrintLabel','#filterVatIncluded','#filterCustomSize'].forEach(bump);
    // Status tab
    ['#filterInventoryStatus','#filterCondition','#filterPartState'].forEach(bump);
    // Dates & Text tab
    ['#filterCreatedFrom','#filterCreatedTo','#filterUpdatedFrom','#filterUpdatedTo','#filterNotes'].forEach(bump);
    // Location tab
    ['#filterWarehouse','#filterZone','#filterShelf','#filterRack','#filterBin'].forEach(bump);
    if(c>0)$('#filterCount').text(c).removeClass('d-none');else $('#filterCount').addClass('d-none');
}

/* Init */
$(function(){
    _pp=smsInitPerPage('#perPageSel');_loadAdvFilters();
    // Load column config first, then data
    _loadColumnConfig(function(){ loadData(); });
    $(document).on('click','.sms-pi-img',function(e){e.stopPropagation();showAllImages($(this));});
    var st;$('#searchInput').on('input',function(){clearTimeout(st);st=setTimeout(function(){_page=1;loadData();},380);});
    $(document).on('change','#filterStatus,#filterDeleted,#deepSearch',function(){_page=1;loadData();});
    // Init Bootstrap popover for the deep-search info icon
    if (typeof bootstrap !== 'undefined' && bootstrap.Popover) {
        new bootstrap.Popover(document.getElementById('deepSearchInfo'), { html: true, sanitize: false, container: 'body' });
    }
    /* Sidebar filter changes — reload on offcanvas hide AND on individual change/input */
    $('#filterSidebar').on('hidden.bs.offcanvas',function(){_page=1;_updateFilterCount();loadData();});
    // Auto-apply on change (selects + dates) and debounced input (text/number)
    var _filtDebounce;
    $('#filterSidebar').on('change', 'select, input[type=date]', function() {
        clearTimeout(_filtDebounce);
        _filtDebounce = setTimeout(function() { _page = 1; _updateFilterCount(); loadData(); }, 200);
    });
    $('#filterSidebar').on('input', 'input[type=text], input[type=number]', function() {
        clearTimeout(_filtDebounce);
        _filtDebounce = setTimeout(function() { _page = 1; _updateFilterCount(); loadData(); }, 400);
    });
    $('#perPageSel').on('change',function(){var v=$(this).val();_pp=(v==='all')?99999:(parseInt(v)||15);_page=1;loadData();});
    /* Clear inline filters */
    $('#btnClearFilters').on('click',function(){$('#searchInput').val('');$('#filterStatus,#filterDeleted').val('');_clearAdvFilters();_page=1;loadData();});
    /* Clear advanced filters */
    $('#btnClearAdvFilters').on('click',function(){_clearAdvFilters();});

    function _clearAdvFilters(){
        // Status + text/range inputs
        $('#filterInventoryStatus,#filterCondition,#filterPartState,#filterIsMaster,#filterPrintLabel,#filterVatIncluded,#filterCustomSize').val('');
        $('#filterMotorization,#filterCC,#filterCV,#filterKW,#filterVehicleInternalId,#filterPartCode,#filterPartInternalId,#filterRegNumber,#filterQtyMin,#filterQtyMax,#filterPriceMin,#filterPriceMax,#filterCostMin,#filterCostMax,#filterRatingMin,#filterRatingMax,#filterCreatedFrom,#filterCreatedTo,#filterUpdatedFrom,#filterUpdatedTo,#filterNotes').val('');
        // Select2 dropdowns
        ['#filterVehicleType','#filterVehicleMake','#filterVehicleModel','#filterVehicleVariant',
         '#filterVehicleYear','#filterVehicleFuel','#filterVehicleEngine',
         '#filterPartType','#filterPartBrand','#filterPartCatalog',
         '#filterWarehouse','#filterZone','#filterShelf','#filterRack','#filterBin'].forEach(function(s){try{$(s).val(null).trigger('change.select2');}catch(e){$(s).val('');}});
        _updateFilterCount();
    }
    $(document).on('click','th.sortable',function(){var f=$(this).data('field');if(_sort.field===f)_sort.dir=_sort.dir==='asc'?'desc':'asc';else{_sort.field=f;_sort.dir='asc';}$('th.sortable i').attr('class','bi bi-arrow-down-up text-muted small');$(this).find('i').attr('class','bi bi-sort-'+(_sort.dir==='asc'?'up':'down')+' text-primary small');_page=1;loadData();});
    $(document).on('click','.sms-pg',function(e){e.preventDefault();var p=parseInt($(this).data('p'));if(p>0&&p!==_page){_page=p;loadData();}});
    $(document).on('change','#selectAll',function(){$('.row-chk').prop('checked',$(this).is(':checked'));updateBulk();});
    $(document).on('change','.row-chk',updateBulk);
    $('#btnClearBulk').on('click',function(){$('#selectAll,.row-chk').prop('checked',false);updateBulk();});

    /* Side submenu (Shortcut) click toggle — prevents parent dropdown from closing */
    $(document).on('click', '.sms-submenu > .dropdown-item', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $li = $(this).parent('.sms-submenu');
        // Close any other open submenus in the same dropdown
        $li.siblings('.sms-submenu.show').removeClass('show');
        $li.toggleClass('show');
    });
    // Stop submenu item clicks from bubbling up to the toggle handler above
    $(document).on('click', '.sms-submenu-list .dropdown-item', function(e) {
        e.stopPropagation();
    });

    /* Sub badge → open master part preview */
    $(document).on('click', '.sms-sub-pop', function() {
        var uuid = $(this).data('uuid');
        if (uuid) viewPT(uuid);
    });

    /* Master part badge → open sub-parts popup */
    $(document).on('click', '.sms-master-pop', function() {
        var uuid = $(this).data('uuid'), name = $(this).data('name');
        $('#viewModalTitle').html('<i class="bi bi-diagram-3 me-2 text-primary"></i>Sub-Parts of ' + H.esc(name));
        $('#viewBody').html('<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>');
        bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
        $.get(BASE_URL + '/part-inventories/' + uuid + '/sub-parts', function(res) {
            if (!res || res.status !== 200) { $('#viewBody').html('<div class="text-danger text-center py-3">Failed to load.</div>'); return; }
            var subs = Array.isArray(res.data) ? res.data : [];
            if (!subs.length) { $('#viewBody').html('<div class="text-muted text-center py-3">No sub-parts found.</div>'); return; }
            var h = '<table class="table table-sm table-bordered mb-0"><thead><tr><th>#</th><th>Part Code</th><th>Internal ID</th><th>Catalog</th><th>Brand</th><th>Qty</th><th>Status</th></tr></thead><tbody>';
            subs.forEach(function(p, i) {
                h += '<tr><td>' + (i+1) + '</td><td>' + H.esc(p.part_code||'—') + '</td><td>#' + H.esc(p.part_internal_id||'—') + '</td><td>' + H.esc(p.part_catalog_name||'—') + '</td><td>' + H.esc(p.part_brand_name||'—') + '</td><td>' + (p.quantity||'—') + '</td><td>' + (INV_STATUS[p.inventory_status]||'—') + '</td></tr>';
            });
            $('#viewBody').html(h + '</tbody></table>');
        }).fail(function() { $('#viewBody').html('<div class="text-danger text-center py-3">Failed to load.</div>'); });
    });

    /* Count badge click → open details popup */
    $(document).on('click', '.sms-count-pop', function() {
        var $b = $(this);
        var uuid = $b.data('uuid'), kind = $b.data('kind'), name = $b.data('name');
        if (!uuid) return;
        $('#viewModalTitle').html('<i class="bi bi-info-circle me-2 text-primary"></i>' + (kind.charAt(0).toUpperCase() + kind.slice(1)) + ' — ' + H.esc(name||''));
        $('#viewBody').html('<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>');
        bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
        // Images / Videos / Locations come embedded in /view-data
        var useView = (kind === 'images' || kind === 'videos' || kind === 'locations');
        var url = useView
            ? (BASE_URL + '/part-inventories/' + uuid + '/view-data')
            : (BASE_URL + '/part-inventories/' + uuid + '/' + kind);
        $.get(url, function(res) {
            if (!res || res.status !== 200) { $('#viewBody').html('<div class="text-danger text-center py-3">Failed to load.</div>'); return; }
            var data;
            var pi = (res.data && res.data.part_inventory) || res.data || {};
            if (kind === 'images')        data = pi.images    || [];
            else if (kind === 'videos')   data = pi.videos    || [];
            else if (kind === 'locations'){
                // Build a slot table: 1..quantity, fill from saved rows by unit_number
                var qty = parseInt(pi.quantity) || 0;
                var saved = pi.locations || [];
                var byUnit = {};
                saved.forEach(function(l) { byUnit[parseInt(l.unit_number) || 0] = l; });
                data = [];
                for (var i = 1; i <= qty; i++) data.push(byUnit[i] || { unit_number: i, _empty: true });
            }
            else if (Array.isArray(res.data)) data = res.data;
            else if (res.data && Array.isArray(res.data.attributes)) data = res.data.attributes;
            else data = [];
            $('#viewBody').html(_renderCountDetails(kind, data));
        }).fail(function() { $('#viewBody').html('<div class="text-danger text-center py-3">Failed to load.</div>'); });
    });

    function _renderCountDetails(kind, items) {
        if (!items || !items.length) return '<div class="text-muted text-center py-3">No ' + kind + ' found.</div>';
        if (kind === 'references') {
            var h = '<table class="table table-sm table-bordered mb-0"><thead><tr><th>Code</th><th>Condition</th><th>Type</th><th>Brand</th><th>Manufacturer</th></tr></thead><tbody>';
            items.forEach(function(r) {
                h += '<tr><td>' + H.esc(r.reference_code||'') + '</td><td>' + (CONDITION[r.condition]||'—') + '</td><td>' + ({1:'Compatible',2:'Written on Label'}[r.reference_type]||'—') + '</td><td>' + H.esc(r.brand||'—') + '</td><td>' + H.esc(r.manufacturer||'—') + '</td></tr>';
            });
            return h + '</tbody></table>';
        }
        if (kind === 'damages') {
            var h = '<table class="table table-sm table-bordered mb-0"><thead><tr><th>Description</th><th>Type</th><th>Location</th><th>Rating</th></tr></thead><tbody>';
            items.forEach(function(r) {
                h += '<tr><td>' + H.esc(r.damage_description||r.description||'') + '</td><td>' + ({1:'Does Not Affect Function',2:'Affects Function'}[r.damage_type]||'—') + '</td><td>' + ({1:'Internal',2:'External'}[r.damage_location]||'—') + '</td><td>' + (r.damage_rating != null ? r.damage_rating : '—') + '</td></tr>';
            });
            return h + '</tbody></table>';
        }
        if (kind === 'attributes') {
            var h = '<table class="table table-sm table-bordered mb-0"><thead><tr><th>Attribute</th><th>Value</th></tr></thead><tbody>';
            items.forEach(function(a) {
                var v = a.value;
                if (Array.isArray(v)) v = v.join(', ');
                h += '<tr><td>' + H.esc(a.label_name||a.name||'') + '</td><td>' + H.esc(v != null ? String(v) : '—') + '</td></tr>';
            });
            return h + '</tbody></table>';
        }
        if (kind === 'images' || kind === 'videos') {
            var h = '<div class="row g-2">';
            items.forEach(function(m) {
                var u = m.display_url || m.image_url || m.video_url || m.url || '';
                h += '<div class="col-6 col-md-3"><div class="border rounded p-1">';
                h += (kind === 'images')
                    ? '<a href="' + H.esc(u) + '" target="_blank"><img src="' + H.esc(u) + '" style="width:100%;height:100px;object-fit:cover;border-radius:3px;" onerror="this.src=\'/images/no-image.svg\';"/></a>'
                    : '<video src="' + H.esc(u) + '#t=1" controls preload="metadata" style="width:100%;height:100px;object-fit:cover;border-radius:3px;"></video>';
                h += '</div></div>';
            });
            return h + '</div>';
        }
        if (kind === 'locations') {
            var assigned = items.filter(function(l) { return !l._empty && (l.warehouse_id || l.warehouse_zone_id || l.warehouse_shelf_id || l.warehouse_rack_id || l.warehouse_bin_id); }).length;
            var h = '<div class="px-2 pt-2"><span class="badge bg-success-lt me-1">' + assigned + ' assigned</span><span class="badge bg-secondary-lt">' + (items.length - assigned) + ' empty</span></div>';
            h += '<table class="table table-sm table-bordered mb-0 mt-2"><thead><tr><th>Unit</th><th>Warehouse</th><th>Zone</th><th>Shelf</th><th>Rack</th><th>Bin</th><th>Code</th><th>Status</th></tr></thead><tbody>';
            items.forEach(function(l) {
                var isEmpty = !!l._empty || !(l.warehouse_id || l.warehouse_zone_id || l.warehouse_shelf_id || l.warehouse_rack_id || l.warehouse_bin_id);
                var rowCls = isEmpty ? ' class="text-muted"' : '';
                h += '<tr' + rowCls + '><td>' + (l.unit_number||'—') + '</td><td>' + H.esc(l.warehouse_name||'—') + '</td><td>' + H.esc(l.warehouse_zone_name||'—') + '</td><td>' + H.esc(l.warehouse_shelf_name||'—') + '</td><td>' + H.esc(l.warehouse_rack_name||'—') + '</td><td>' + H.esc(l.warehouse_bin_name||'—') + '</td><td>' + H.esc(l.location_code||'—') + '</td><td>' + (isEmpty ? '<span class="badge bg-secondary-lt">Empty</span>' : '<span class="badge bg-success-lt">Assigned</span>') + '</td></tr>';
            });
            return h + '</tbody></table>';
        }
        return '<pre class="small">' + H.esc(JSON.stringify(items, null, 2)) + '</pre>';
    }
});
