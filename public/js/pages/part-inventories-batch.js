/* part-inventories-batch.js — handles BOTH add (batch) and edit (single) modes */
'use strict';
$(function() {
    var FD = window._FORM_DATA || {};
    var IS_EDIT = !!FD.isEdit;
    var T = function(k, f) { return typeof SMS_T === 'function' ? SMS_T(k, f) : (f || k); };

    /* ─── State ─── */
    var _rows = []; // each row: { id, year, type, make, model, variant, catalog, details:{...} }
    var _seq  = 0;
    var _autoFilling = false;

    /* ── Edit-mode pre-seeding from FD.record ── */
    function _buildEditRow() {
        var r = FD.record || {};
        var pick = function(id, name) { return id ? { id: id, text: name || '' } : { id: '', text: '' }; };
        // Inverse map: damage idx → linked image/video ids (so multi-select pre-selects on render)
        var damageImageLinks = {};
        var damageVideoLinks = {};
        (FD.damages || []).forEach(function(d, idx) {
            damageImageLinks[idx] = (d.image_ids || []).map(String);
            damageVideoLinks[idx] = (d.video_ids || []).map(String);
        });
        return {
            id: ++_seq,
            savedUuid: FD.uuid || r.uuid,
            year:    pick(r.vehicle_year_id,    r.vehicle_year_name),
            type:    pick(r.vehicle_type_id,    r.vehicle_type_name),
            make:    pick(r.vehicle_make_id,    r.vehicle_make_name),
            model:   pick(r.vehicle_model_id,   r.vehicle_model_name),
            variant: pick(r.vehicle_variant_id, r.vehicle_variant_name),
            catalog: pick(r.part_catalog_id,    r.part_catalog_name),
            vehicleId:    r.vehicle_inventory_id || '',
            vehicleLabel: r.vehicle_inventory_name || r.vehicle_inventory_code || '',
            details: {
                quantity: r.quantity || 1,
                inventory_status: String(r.inventory_status || '1'),
                price_1: r.price_1 != null ? String(r.price_1) : '0',
                price_2: r.price_2 != null ? String(r.price_2) : '0',
                cost_price: (r.cost_price != null ? String(r.cost_price) : (r.part_cost_price != null ? String(r.part_cost_price) : '0')),
                vehicle_fuel_id: r.vehicle_fuel_id || '', vehicle_fuel_name: r.vehicle_fuel_name || '',
                part_brand_id: r.part_brand_id || '', part_brand_name: r.part_brand_name || '',
                condition: r.condition != null ? String(r.condition) : '1',
                part_state: r.part_state != null ? String(r.part_state) : '1',
                vehicle_engine_id: r.vehicle_engine_id || '', vehicle_engine_name: r.vehicle_engine_name || '',
                motorization: r.motorization || '',
                reg_number_dismantler: r.reg_number_dismantler || '',
                cc: r.cc || '', cv: r.cv || '', kw: r.kw || '',
                print_label: r.print_label ? 1 : 0,
                vat_included: r.vat_included ? 1 : 0,
                custom_size: r.custom_size ? 1 : 0,
                weight: r.weight_kg != null ? String(r.weight_kg) : '',
                width:  r.width_cm  != null ? String(r.width_cm)  : '',
                height: r.height_cm != null ? String(r.height_cm) : '',
                length: r.length_cm != null ? String(r.length_cm) : '',
                rating: r.rating != null ? r.rating : 0,
                notes: r.notes || '',
                extra_notes: r.extra_notes || '',
                internal_notes: r.internal_notes || ''
            },
            references: FD.references || [],
            damages:    FD.damages    || [],
            images:     FD.images     || [],
            videos:     FD.videos     || [],
            locations:  FD.locations  || [],
            damageImageLinks: damageImageLinks,
            damageVideoLinks: damageVideoLinks
        };
    }

    if (IS_EDIT && FD.record) {
        _rows.push(_buildEditRow());
    }

    /* ─── Select2 helper (uses logged-in company from session, no client filter) ─── */
    function _s2(sel, url, ph, extraDataFn, processFn) {
        if (!$(sel).length) return;
        $(sel).select2({
            theme: 'bootstrap-5',
            placeholder: ph, allowClear: true, width: '100%',
            ajax: { url: BASE_URL + url, dataType: 'json', delay: 250,
                data: function(p) {
                    var d = { q: p.term || '', search: p.term || '', limit: 50 };
                    if (extraDataFn) $.extend(d, extraDataFn());
                    return d;
                },
                processResults: processFn || function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name || r.year || r.title || ('#' + r.id) }; }) }; }
            }
        });
    }

    var SEL_TAB_DROPDOWNS = ['#bYear','#bType','#bMake','#bModel','#bVariant','#bCatalog','#bVehicle'];
    function _setS2(sel, id, text) {
        if (!id || !text) return;
        var $s = $(sel);
        if ($s.find('option[value="' + id + '"]').length === 0) $s.append(new Option(text, id, true, true));
        else $s.val(id);
        $s.trigger('change');
    }

    var IS_FROM_VEHICLE = !!FD.fromVehicle;

    /* Initialize all selection-tab select2s once at startup */
    function _initSelectionDropdowns() {
        // Catalog (used in both modes) — also returns is_master_part for the master+sub picker
        _s2('#bCatalog', '/part-catalogs/autocomplete', T('part_inventories.search_catalog','Search Catalog...'), null,
            function(res) { return { results: ((res&&res.data)||[]).map(function(r){ return { id:r.id, text: r.part_name||r.name||'', is_master_part: !!r.is_master_part, part_brand_id:r.part_brand_id, part_brand_name:r.part_brand_name }; }) }; });

        if (IS_FROM_VEHICLE) {
            _s2('#bVehicle', '/vehicle-inventories/autocomplete', T('part_inventories.search_vehicle','Search Vehicle...'), null,
                function(res) { return { results: ((res&&res.data)||[]).map(function(r) {
                    var parts = [];
                    if (r.vehicle_make_name) parts.push(r.vehicle_make_name);
                    if (r.vehicle_model_name) parts.push(r.vehicle_model_name);
                    var label = parts.join(' | ');
                    if (r.vehicle_internal_id) label = '#' + r.vehicle_internal_id + (label ? ' — ' + label : '');
                    if (!label) label = r.registration_plate_no || ('#' + r.id);
                    return { id: r.uuid || r.id, text: label, uuid: r.uuid };
                }) }; });
            return;
        }

        _s2('#bYear', '/vehicle-years/autocomplete', T('part_inventories.search_year','Search Year...'), null,
            function(res) { return { results: ((res&&res.data)||[]).map(function(r) { return { id: r.id, text: String(r.year || r.name || r.id) }; }) }; });
        _s2('#bType', '/vehicle-types/autocomplete', T('part_inventories.search_type','Search Type...'));
        _s2('#bMake', '/vehicle-makes/autocomplete', T('part_inventories.search_make','Search Make...'),
            function() { var v = $('#bType').val(); return v ? { vehicle_type_id: v } : {}; },
            function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name, vehicle_type_id: r.vehicle_type_id, vehicle_type_name: r.vehicle_type_name }; }) }; });
        _s2('#bModel', '/vehicle-models/autocomplete', T('part_inventories.search_model','Search Model...'),
            function() { var d={}; var t=$('#bType').val(); if(t)d.vehicle_type_id=t; var m=$('#bMake').val(); if(m)d.vehicle_make_id=m; return d; },
            function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name + (r.vehicle_make_name ? ' — ' + r.vehicle_make_name : ''),
                vehicle_type_id:r.vehicle_type_id, vehicle_type_name:r.vehicle_type_name,
                vehicle_make_id:r.vehicle_make_id, vehicle_make_name:r.vehicle_make_name,
                vehicle_year_id:r.vehicle_year_id, vehicle_year_name:r.vehicle_year_name }; }) }; });
        _s2('#bVariant', '/vehicle-variants/autocomplete', T('part_inventories.search_variant','Search Variant...'),
            function() { var d={}; var m=$('#bModel').val(); if(m)d.vehicle_model_id=m; return d; },
            function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name,
                vehicle_model_id:r.vehicle_model_id, vehicle_model_name:r.vehicle_model_name,
                vehicle_make_id:r.vehicle_make_id, vehicle_make_name:r.vehicle_make_name,
                vehicle_type_id:r.vehicle_type_id, vehicle_type_name:r.vehicle_type_name,
                vehicle_year_id:r.vehicle_year_id, vehicle_year_name:r.vehicle_year_name }; }) }; });
    }

    /* Initial selection-tab dropdown init */
    _initSelectionDropdowns();

    /* If add-from-vehicle URL provided a vehicle id, preselect after init */
    if (IS_FROM_VEHICLE && FD.vehicleId) {
        $.get(BASE_URL + '/vehicle-inventories/' + FD.vehicleId + '/view-data', function(res) {
            if (!res || res.status !== 200) return;
            var vi = res.data || {};
            var label = (vi.vehicle_internal_id ? '#' + vi.vehicle_internal_id + ' ' : '') + (vi.registration_plate_no || vi.vehicle_model_name || '');
            var $s = $('#bVehicle');
            $s.append(new Option(label, vi.uuid || vi.id || FD.vehicleId, true, true)).trigger('change');
        });
    }

    /* Forward cascade reset */
    $('#bType').on('change', function() { if (!_autoFilling) $('#bMake,#bModel,#bVariant').val(null).trigger('change.select2'); });
    $('#bMake').on('change', function() { if (!_autoFilling) $('#bModel,#bVariant').val(null).trigger('change.select2'); });
    $('#bModel').on('change', function() { if (!_autoFilling) $('#bVariant').val(null).trigger('change.select2'); });

    /* Reverse autofill: selecting a child fills its parents */
    $('#bMake').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        if (d.vehicle_type_id && d.vehicle_type_name) { _autoFilling = true; _setS2('#bType', d.vehicle_type_id, d.vehicle_type_name); setTimeout(function(){ _autoFilling=false; }, 80); }
    });
    $('#bModel').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        _autoFilling = true;
        if (d.vehicle_type_id && d.vehicle_type_name) _setS2('#bType', d.vehicle_type_id, d.vehicle_type_name);
        if (d.vehicle_make_id && d.vehicle_make_name) _setS2('#bMake', d.vehicle_make_id, d.vehicle_make_name);
        if (d.vehicle_year_id && d.vehicle_year_name) _setS2('#bYear', d.vehicle_year_id, d.vehicle_year_name);
        setTimeout(function(){ _autoFilling=false; }, 80);
    });
    $('#bVariant').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        _autoFilling = true;
        if (d.vehicle_type_id && d.vehicle_type_name) _setS2('#bType', d.vehicle_type_id, d.vehicle_type_name);
        if (d.vehicle_make_id && d.vehicle_make_name) _setS2('#bMake', d.vehicle_make_id, d.vehicle_make_name);
        if (d.vehicle_model_id && d.vehicle_model_name) _setS2('#bModel', d.vehicle_model_id, d.vehicle_model_name);
        if (d.vehicle_year_id && d.vehicle_year_name) _setS2('#bYear', d.vehicle_year_id, d.vehicle_year_name);
        setTimeout(function(){ _autoFilling=false; toastr.info(T('part_inventories.auto_filled_variant','Type, Make, Model & Year auto-filled from Variant')); }, 80);
    });

    function _picked(sel) {
        var $s = $(sel); var val = $s.val(); if (!val) return null;
        var $opt = $s.find('option:selected');
        // Read is_master_part flag if select2 stored it on the option (HTML5 data attribute set by template result)
        var $s2data = $s.data('select2');
        var sel2 = $s2data && $s2data.selection && $s2data.selection.$selection ? $s2data.selection.$selection.find('.select2-selection__rendered').data('select2-data') : null;
        return { id: val, text: $opt.text() };
    }

    // Fetch + show master-part sub picker modal. Calls onPicked(arrayOfSubCatIdsObjs) on confirm.
    function _showSubPartPicker(masterCatalog, onPicked) {
        $.get(BASE_URL + '/part-catalogs/' + masterCatalog.id + '/sub-catalogs', function(res) {
            var subs = (res && res.status === 200 && Array.isArray(res.data)) ? res.data : [];
            if (!subs.length) {
                toastr.info('Master part has no sub-parts configured. Adding only the master.');
                onPicked([]);
                return;
            }
            // Build a one-shot modal
            var html = '<div class="modal fade" id="bSubPickModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">'
                + '<div class="modal-header"><h5 class="modal-title"><i class="bi bi-diagram-3 me-2 text-primary"></i>Select Sub-Parts of <strong>'+H.esc(masterCatalog.text)+'</strong></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>'
                + '<div class="modal-body">'
                + '<p class="text-muted small mb-2">Pick which sub-parts to add along with the master part. The master will be created first, then each selected sub-part will be linked to it.</p>'
                + '<div class="d-flex gap-2 mb-2"><button type="button" class="btn btn-sm btn-outline-primary" id="bSubAll">Select All</button><button type="button" class="btn btn-sm btn-outline-secondary" id="bSubNone">Clear</button></div>'
                + '<div class="list-group">';
            subs.forEach(function(s) {
                html += '<label class="list-group-item d-flex align-items-center" style="cursor:pointer;"><input type="checkbox" class="form-check-input me-2 b-sub-chk" value="'+s.id+'" data-name="'+H.esc(s.name||'')+'" checked/> '+H.esc(s.name||('#'+s.id))+'</label>';
            });
            html += '</div></div>'
                + '<div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn btn-primary" id="bSubConfirm"><i class="bi bi-check2 me-1"></i>Add</button></div>'
                + '</div></div></div>';
            $('#bSubPickModal').remove();
            $('body').append(html);
            var modal = new bootstrap.Modal($('#bSubPickModal')[0]);
            modal.show();
            $('#bSubAll').on('click', function() { $('.b-sub-chk').prop('checked', true); });
            $('#bSubNone').on('click', function() { $('.b-sub-chk').prop('checked', false); });
            $('#bSubConfirm').on('click', function() {
                var picked = [];
                $('.b-sub-chk:checked').each(function() {
                    picked.push({ id: parseInt($(this).val()), name: $(this).data('name') });
                });
                modal.hide();
                $('#bSubPickModal').remove();
                onPicked(picked);
            });
        }).fail(function() {
            toastr.error('Failed to load sub-parts.');
            onPicked([]);
        });
    }

    /* ─── Add row ─── */
    function _newDetails() {
        return {
                quantity:1, inventory_status:'1',
                price_1:'0', price_2:'0', cost_price:'0',
                vehicle_fuel_id:'', vehicle_fuel_name:'',
                part_brand_id:'', part_brand_name:'',
                condition:'1', part_state:'1',
                vehicle_engine_id:'', vehicle_engine_name:'',
                motorization:'', reg_number_dismantler:'',
                cc:'', cv:'', kw:'',
                print_label:0, vat_included:0,
                custom_size:0, weight:'', width:'', height:'', length:'',
                rating:0,
                notes:'', extra_notes:'', internal_notes:''
        };
    }

    function _addRow(rowData) {
        rowData.id = ++_seq;
        rowData.details = _newDetails();
        _rows.push(rowData);
        _renderRows();
        _renderDetails();
    }

    // Capture is_master_part flag onto the select element when a catalog is picked
    $(document).on('select2:select', '#bCatalog', function(e) {
        var d = e.params && e.params.data;
        $(this).data('is_master_part', !!(d && d.is_master_part));
    });
    $(document).on('select2:clear change', '#bCatalog', function(e) {
        if (e.type === 'select2:clear') $(this).removeData('is_master_part');
    });

    $('#btnBatchAdd').on('click', function() {
        var catalog = _picked('#bCatalog');
        if (!catalog) { toastr.error('Catalog required.'); return; }
        catalog.is_master_part = !!$('#bCatalog').data('is_master_part');

        // Helper: do the actual add given a (possibly empty) sub-cat array.
        // For master-with-subs, we push N+1 rows: master first, then one row per sub.
        // Each sub inherits the same vehicle FKs and is linked by a temp group id.
        function _doAdd(subCats) {
            var groupId = ++_seq; // shared group id for master + its subs

            function _addOne(rowBase, catObj, isMaster, isSub) {
                var row = Object.assign({}, rowBase, { catalog: catObj });
                if (isMaster) { row.isMasterPart = true; row._groupId = groupId; row._isMaster = true; }
                if (isSub)    { row._groupId = groupId; row._isSubOf = groupId; row._subCatalogName = catObj.text; }
                _addRow(row);
            }

            if (IS_FROM_VEHICLE) {
                var vehSel = _picked('#bVehicle');
                if (!vehSel) { toastr.error('Vehicle required.'); return; }
                var dupe = _rows.some(function(r) { return r.vehicleId && String(r.vehicleId) === String(vehSel.id) && String(r.catalog.id) === String(catalog.id); });
                if (dupe) { toastr.warning('This part is already added for the selected vehicle.'); return; }
                $.get(BASE_URL + '/vehicle-inventories/' + vehSel.id + '/view-data', function(res) {
                    if (!res || res.status !== 200) { toastr.error('Failed to load vehicle data.'); return; }
                    var vi = res.data || {};
                    if (!vi.vehicle_year_id || !vi.vehicle_type_id || !vi.vehicle_make_id || !vi.vehicle_model_id || !vi.vehicle_variant_id) {
                        toastr.error('Selected vehicle is missing some master data.');
                        return;
                    }
                    var base = {
                        vehicleId: vehSel.id,
                        vehicleLabel: vehSel.text,
                        year:    { id: vi.vehicle_year_id,    text: vi.vehicle_year_name    || '' },
                        type:    { id: vi.vehicle_type_id,    text: vi.vehicle_type_name    || '' },
                        make:    { id: vi.vehicle_make_id,    text: vi.vehicle_make_name    || '' },
                        model:   { id: vi.vehicle_model_id,   text: vi.vehicle_model_name   || '' },
                        variant: { id: vi.vehicle_variant_id, text: vi.vehicle_variant_name || '' },
                    };
                    _addOne(base, catalog, catalog.is_master_part, false);
                    if (catalog.is_master_part) subCats.forEach(function(s) {
                        _addOne(base, { id: s.id, text: s.name }, false, true);
                    });
                    $('#bVehicle').val(null).trigger('change.select2');
                    $('#bCatalog').val(null).trigger('change.select2').removeData('is_master_part');
                });
                return;
            }
            /* Normal mode */
            var year=_picked('#bYear'), type=_picked('#bType'), make=_picked('#bMake'),
                model=_picked('#bModel'), variant=_picked('#bVariant');
            var miss = [];
            if (!year) miss.push('Year'); if (!type) miss.push('Type'); if (!make) miss.push('Make');
            if (!model) miss.push('Model'); if (!variant) miss.push('Variant');
            if (miss.length) { toastr.error(miss.join(', ') + ' required.'); return; }
            var base = { year:year, type:type, make:make, model:model, variant:variant };
            _addOne(base, catalog, catalog.is_master_part, false);
            if (catalog.is_master_part) subCats.forEach(function(s) {
                _addOne(base, { id: s.id, text: s.name }, false, true);
            });
            $('#bCatalog').val(null).trigger('change.select2').removeData('is_master_part');
        }

        // If catalog is a master part, open the sub-picker first
        if (catalog.is_master_part) {
            _showSubPartPicker(catalog, function(subs) { _doAdd(subs); });
        } else {
            _doAdd([]);
        }
    });

    /* ─── Tab 1 list render ─── */
    function _renderRows() {
        $('#bCount').text(_rows.length);
        if (!_rows.length) {
            $('#bRows').html('<tr><td colspan="7" class="text-center text-muted py-3">' + T('part_inventories.no_parts_added','No parts added yet.') + '</td></tr>');
            $('#btnBatchSaveAll').prop('disabled', true);
            return;
        }
        var html = '';
        _rows.forEach(function(r, i) {
            html += '<tr data-id="' + r.id + '">'
                + '<td>' + (i+1) + '</td>'
                + '<td>' + H.esc(r.year.text) + '</td>'
                + '<td>' + H.esc(r.make.text) + '</td>'
                + '<td>' + H.esc(r.model.text) + '</td>'
                + '<td>' + H.esc(r.variant.text) + '</td>'
                + '<td>' + (r._isSubOf ? '<span class="text-muted me-1">↳</span>' : '') + H.esc(r.catalog.text)
                  + (r._isMaster ? ' <span class="badge bg-primary-lt ms-1"><i class="bi bi-diagram-3 me-1"></i>Master</span>' : '')
                  + (r._isSubOf  ? ' <span class="badge bg-info-lt ms-1">Sub</span>' : '')
                  + '</td>'
                + '<td class="text-end"><button type="button" class="btn btn-icon btn-sm btn-ghost-danger b-rm" title="Delete"><i class="bi bi-trash3"></i></button></td>'
                + '</tr>';
        });
        $('#bRows').html(html);
        $('#btnBatchSaveAll').prop('disabled', false);
    }

    $('#bRows').on('click', '.b-rm', function() {
        var id = parseInt($(this).closest('tr').data('id'));
        var row = _rows.find(function(r) { return r.id === id; });
        var name = row ? row.catalog.text : '';
        smsConfirm({
            icon: '🗑️', title: T('btn.delete','Delete'),
            msg: T('general.are_you_sure','Are you sure?') + ' <strong>' + H.esc(name) + '</strong>',
            btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
            onConfirm: function() {
                _rows = _rows.filter(function(r) { return r.id !== id; });
                _renderRows(); _renderDetails();
            }
        });
    });

    /* ─── Tab 2: per-row detail cards ─── */
    function _renderDetails() {
        var $body = $('#bDetailsBody');
        if (!_rows.length) {
            $body.html('<div class="text-muted text-center py-5"><i class="bi bi-arrow-up-circle d-block mb-2" style="font-size:32px;opacity:.4;"></i>' + T('part_inventories.add_first','Please add at least one part in step 1 first.') + '</div>');
            return;
        }
        var html = '';
        _rows.forEach(function(r, i) {
            var d = r.details;
            var rid = r.id;
            html += '<div class="card shadow-sm mb-3 b-detail-card" data-id="' + rid + '">'
                + '<div class="card-header py-2 d-flex justify-content-between align-items-center">'
                +   '<div class="card-title mb-0" style="font-size:13px;">'
                +     '<i class="bi bi-box-seam me-1 text-primary"></i><strong>#' + (i+1) + ' — ' + H.esc(r.catalog.text) + '</strong>'
                +     ' <span class="text-muted ms-2" style="font-weight:400;font-size:11px;">' + H.esc(r.year.text+' · '+r.make.text+' · '+r.model.text+' · '+r.variant.text) + '</span>'
                +   '</div>'
                +   '<button type="button" class="btn btn-icon btn-sm btn-ghost-danger b-detail-rm" title="Delete this part"><i class="bi bi-trash3"></i></button>'
                + '</div>'
                + '<div class="card-body">'

                /* Row 1: Qty / Inventory Status / Price1 / Price2 / Cost */
                + '<div class="row g-2">'
                +   '<div class="col-md-2"><label class="form-label small mb-1">Quantity <span class="text-danger">*</span></label><input type="number" min="1" step="1" class="form-control form-control-sm b-fld" data-k="quantity" value="' + (d.quantity||1) + '"/></div>'
                +   '<div class="col-md-3"><label class="form-label small mb-1">Inventory Status <span class="text-danger">*</span></label>'
                +     '<select class="form-select form-select-sm b-fld" data-k="inventory_status">'
                +       _opts([['1','In Stock'],['2','Out of Stock'],['4','Returned'],['5','Scrapped']], d.inventory_status||'1')
                +     '</select></div>'
                +   _fld('Price 1', 'number', 'price_1', d.price_1!==''?d.price_1:'0', 'col-md-2', 'min="0" step="0.01"')
                +   _fld('Price 2', 'number', 'price_2', d.price_2!==''?d.price_2:'0', 'col-md-2', 'min="0" step="0.01"')
                +   _fld('Cost Price', 'number', 'cost_price', d.cost_price!==''?d.cost_price:'0', 'col-md-3', 'min="0" step="0.01"')
                + '</div>'

                /* Row 2: Fuel / Brand / Condition / State */
                + '<div class="row g-2 mt-1">'
                +   '<div class="col-md-3"><label class="form-label small mb-1">Fuel Type</label><select class="form-select form-select-sm b-fuel" style="width:100%;"></select></div>'
                +   '<div class="col-md-3"><label class="form-label small mb-1">Part Brand</label><select class="form-select form-select-sm b-brand" style="width:100%;"></select></div>'
                +   _fldSelect('Condition', 'condition', d.condition, 'col-md-3', [['1','OEM'],['2','Aftermarket']])
                +   _fldSelect('State', 'part_state', d.part_state, 'col-md-3', [['1','New'],['2','Used'],['3','Remanufactured'],['4','Not Working']])
                + '</div>'

                /* Row 3: Engine / Motorization / Reg */
                + '<div class="row g-2 mt-1">'
                +   '<div class="col-md-3"><label class="form-label small mb-1">Engine Type</label><select class="form-select form-select-sm b-engine" style="width:100%;"></select></div>'
                +   '<div class="col-md-3"><label class="form-label small mb-1">Motorization</label><input type="text" class="form-control form-control-sm b-fld" data-k="motorization" value="' + H.esc(d.motorization||'') + '"/></div>'
                +   '<div class="col-md-6"><label class="form-label small mb-1">Reg Number Dismantler</label><input type="text" class="form-control form-control-sm b-fld" data-k="reg_number_dismantler" value="' + H.esc(d.reg_number_dismantler||'') + '"/></div>'
                + '</div>'

                /* Row 4: CC / CV / KW / Rating */
                + '<div class="row g-2 mt-1">'
                +   _fld('CC', 'text', 'cc', d.cc, 'col-md-2')
                +   _fld('CV', 'text', 'cv', d.cv, 'col-md-2')
                +   _fld('KW', 'text', 'kw', d.kw, 'col-md-2')
                +   '<div class="col-md-6"><label class="form-label small mb-1 d-block">Rating</label>' + _starsHtml(d.rating) + '</div>'
                + '</div>'

                /* Row 5: Toggles */
                + '<div class="row g-2 mt-2">'
                +   '<div class="col-md-3"><label class="form-check form-switch"><input type="checkbox" class="form-check-input b-fld" data-k="print_label" value="1"' + (d.print_label?' checked':'') + '/><span class="form-check-label small">Print Label</span></label></div>'
                +   '<div class="col-md-3"><label class="form-check form-switch"><input type="checkbox" class="form-check-input b-fld" data-k="vat_included" value="1"' + (d.vat_included?' checked':'') + '/><span class="form-check-label small">VAT Included</span></label></div>'
                +   '<div class="col-md-3"><label class="form-check form-switch"><input type="checkbox" class="form-check-input b-csz" data-k="custom_size" value="1"' + (d.custom_size?' checked':'') + '/><span class="form-check-label small">Custom Size</span></label></div>'
                + '</div>'

                /* Custom size fields */
                + '<div class="row g-2 mt-1 b-csz-fields" style="' + (d.custom_size?'':'display:none;') + '">'
                +   _fld('Weight (kg)', 'number', 'weight', d.weight, 'col-md-3', 'min="0" step="0.01"')
                +   _fld('Width (cm)', 'number', 'width', d.width, 'col-md-3', 'min="0" step="0.01"')
                +   _fld('Height (cm)', 'number', 'height', d.height, 'col-md-3', 'min="0" step="0.01"')
                +   _fld('Length (cm)', 'number', 'length', d.length, 'col-md-3', 'min="0" step="0.01"')
                + '</div>'

                /* Notes */
                + '<div class="row g-2 mt-2">'
                +   '<div class="col-md-4"><label class="form-label small mb-1">Notes</label><textarea class="form-control form-control-sm b-fld" data-k="notes" rows="2">' + H.esc(d.notes||'') + '</textarea></div>'
                +   '<div class="col-md-4"><label class="form-label small mb-1">Extra Notes</label><textarea class="form-control form-control-sm b-fld" data-k="extra_notes" rows="2">' + H.esc(d.extra_notes||'') + '</textarea></div>'
                +   '<div class="col-md-4"><label class="form-label small mb-1">Internal Notes</label><textarea class="form-control form-control-sm b-fld" data-k="internal_notes" rows="2">' + H.esc(d.internal_notes||'') + '</textarea></div>'
                + '</div>'

                + '</div></div>';
        });
        $body.html(html);

        /* Init per-card select2 (brand & fuel) and star rating */
        _rows.forEach(function(r) {
            var $card = $('.b-detail-card[data-id="' + r.id + '"]');
            var d = r.details;
            var $brand = $card.find('.b-brand');
            $brand.select2({ placeholder:'Search Brand...', allowClear:true, width:'100%', dropdownParent: $('body'),
                ajax:{ url:BASE_URL+'/part-brands/autocomplete', dataType:'json', delay:250,
                    data:function(p){return{q:p.term||'',search:p.term||'',limit:50};},
                    processResults:function(res){return{results:((res&&res.data)||[]).map(function(x){return{id:x.id,text:x.name||('#'+x.id)};})};}, cache:false },
                minimumInputLength:0 });
            if (d.part_brand_id && d.part_brand_name) {
                $brand.append(new Option(d.part_brand_name, d.part_brand_id, true, true)).trigger('change');
            }
            $brand.on('select2:select', function(e) { d.part_brand_id = e.params.data.id; d.part_brand_name = e.params.data.text; });
            $brand.on('select2:clear', function() { d.part_brand_id=''; d.part_brand_name=''; });

            var $fuel = $card.find('.b-fuel');
            $fuel.select2({ placeholder:'Search Fuel...', allowClear:true, width:'100%', dropdownParent: $('body'),
                ajax:{ url:BASE_URL+'/vehicle-fuels/autocomplete', dataType:'json', delay:250,
                    data:function(p){return{q:p.term||'',search:p.term||'',limit:50};},
                    processResults:function(res){return{results:((res&&res.data)||[]).map(function(x){return{id:x.id,text:x.name||('#'+x.id)};})};}, cache:false },
                minimumInputLength:0 });
            if (d.vehicle_fuel_id && d.vehicle_fuel_name) {
                $fuel.append(new Option(d.vehicle_fuel_name, d.vehicle_fuel_id, true, true)).trigger('change');
            }
            $fuel.on('select2:select', function(e) { d.vehicle_fuel_id = e.params.data.id; d.vehicle_fuel_name = e.params.data.text; });
            $fuel.on('select2:clear', function() { d.vehicle_fuel_id=''; d.vehicle_fuel_name=''; });

            var $eng = $card.find('.b-engine');
            $eng.select2({ placeholder:'Search Engine...', allowClear:true, width:'100%', dropdownParent: $('body'),
                ajax:{ url:BASE_URL+'/vehicle-engines/autocomplete', dataType:'json', delay:250,
                    data:function(p){return{q:p.term||'',search:p.term||'',limit:50};},
                    processResults:function(res){return{results:((res&&res.data)||[]).map(function(x){
                        var nm = x.name || x.manufacturer_engine || '';
                        var cd = x.motor_code || '';
                        return { id:x.id, text: cd ? (cd + ' — ' + nm) : (nm || ('#'+x.id)) };
                    })};}, cache:false },
                minimumInputLength:0 });
            if (d.vehicle_engine_id && d.vehicle_engine_name) {
                $eng.append(new Option(d.vehicle_engine_name, d.vehicle_engine_id, true, true)).trigger('change');
            }
            $eng.on('select2:select', function(e) { d.vehicle_engine_id = e.params.data.id; d.vehicle_engine_name = e.params.data.text; });
            $eng.on('select2:clear', function() { d.vehicle_engine_id=''; d.vehicle_engine_name=''; });

            /* Half-star rating */
            (function() {
                var $w = $card.find('.b-stars');
                _paintStars($w, d.rating);
                $w.on('mouseenter', '.star-l', function() {
                    var v = parseInt($(this).parent().data('v'));
                    _paintStars($w, v - 0.5);
                });
                $w.on('mouseenter', '.star-r', function() {
                    var v = parseInt($(this).parent().data('v'));
                    _paintStars($w, v);
                });
                $w.on('mouseleave', function() { _paintStars($w, d.rating); });
                $w.on('click', '.star-l', function() {
                    var v = parseInt($(this).parent().data('v'));
                    d.rating = v - 0.5; _paintStars($w, d.rating);
                });
                $w.on('click', '.star-r', function() {
                    var v = parseInt($(this).parent().data('v'));
                    d.rating = v; _paintStars($w, d.rating);
                });
                $w.on('click', '.sms-star-clear', function() { d.rating = 0; _paintStars($w, 0); });
            })();
        });
    }

    /* Half-star rating widget HTML & paint */
    function _starsHtml(val) {
        var h = '<div class="sms-star-rating b-stars" data-value="' + (val||0) + '" style="font-size:22px;line-height:1;display:inline-flex;align-items:center;gap:4px;">';
        for (var i = 1; i <= 5; i++) {
            h += '<span class="sms-star-wrap" data-v="' + i + '">'
              +    '<i class="bi bi-star-fill full"></i>'
              +    '<i class="bi bi-star-fill half"></i>'
              +    '<span class="star-l"></span><span class="star-r"></span>'
              +  '</span>';
        }
        h += '<span class="sms-star-clear ms-2 text-muted small" style="cursor:pointer;font-size:14px;" title="Clear">&times;</span>';
        h += '<span class="ms-2 small text-muted b-stars-val">' + (val ? val : '') + '</span>';
        h += '</div>';
        return h;
    }
    function _paintStars($w, val) {
        val = parseFloat(val) || 0;
        $w.find('.sms-star-wrap').each(function() {
            var v = parseInt($(this).data('v'));
            $(this).removeClass('on half-on');
            if (val >= v) $(this).addClass('on');
            else if (val >= v - 0.5) $(this).addClass('half-on');
        });
        $w.find('.b-stars-val').text(val ? val : '');
    }

    function _fld(label, type, key, val, col, attrs) {
        return '<div class="' + col + '"><label class="form-label small mb-1">' + label + '</label>'
            + '<input type="' + type + '" class="form-control form-control-sm b-fld" data-k="' + key + '" value="' + (val!=null && val!==''?H.esc(String(val)):'') + '" ' + (attrs||'') + '/></div>';
    }
    function _opts(opts, val) {
        return opts.map(function(p) { return '<option value="' + p[0] + '"' + (String(p[0])===String(val||'')?' selected':'') + '>' + p[1] + '</option>'; }).join('');
    }
    function _fldSelect(label, key, val, col, opts) {
        return '<div class="' + col + '"><label class="form-label small mb-1">' + label + '</label>'
            + '<select class="form-select form-select-sm b-fld" data-k="' + key + '">' + _opts(opts, val) + '</select></div>';
    }

    /* Capture detail edits back into _rows */
    $('#bDetailsBody').on('change input', '.b-fld', function() {
        var id = parseInt($(this).closest('.b-detail-card').data('id'));
        var k = $(this).data('k');
        var row = _rows.find(function(r) { return r.id === id; });
        if (!row) return;
        if ($(this).is(':checkbox')) row.details[k] = this.checked ? 1 : 0;
        else row.details[k] = $(this).val();
    });

    /* Force quantity ≥ 1 (snap back to 1 if user tries 0/empty/negative) */
    $('#bDetailsBody').on('blur', '.b-fld[data-k="quantity"]', function() {
        var v = parseInt($(this).val());
        if (!v || v < 1) { $(this).val(1).trigger('change'); toastr.warning('Quantity must be at least 1.'); }
    });

    /* Custom size toggle */
    $('#bDetailsBody').on('change', '.b-csz', function() {
        var $card = $(this).closest('.b-detail-card');
        var id = parseInt($card.data('id'));
        var row = _rows.find(function(r) { return r.id === id; });
        if (row) row.details.custom_size = this.checked ? 1 : 0;
        $card.find('.b-csz-fields').toggle(this.checked);
    });

    $('#bDetailsBody').on('click', '.b-detail-rm', function() {
        var id = parseInt($(this).closest('.b-detail-card').data('id'));
        var row = _rows.find(function(r) { return r.id === id; });
        var name = row ? row.catalog.text : '';
        smsConfirm({
            icon: '🗑️', title: T('btn.delete','Delete'),
            msg: T('general.are_you_sure','Are you sure?') + ' <strong>' + H.esc(name) + '</strong>',
            btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
            onConfirm: function() {
                _rows = _rows.filter(function(r) { return r.id !== id; });
                _renderRows(); _renderDetails();
            }
        });
    });

    /* Tab navigation */
    $('#btnBatchNext').on('click', function() {
        if (!_rows.length) { toastr.error('Add at least one part first.'); return; }
        $('#tab-bDetails').tab('show');
    });
    $('#btnBatchPrev').on('click', function() { $('#tab-bSel').tab('show'); });
    $(document).on('click', '.b-tab-next, .b-tab-prev', function() {
        var t = $(this).data('target'); if (t && !$(t).hasClass('disabled')) $(t).tab('show');
    });
    $(document).on('click', '.b-locked-tab', function(e) { e.preventDefault(); e.stopPropagation(); });

    /* Unlock tabs 3-8 after parts saved (batch mode also locks tabs 1-2; edit mode keeps everything open) */
    function _unlockSavedTabs() {
        $('.b-locked-tab').removeClass('disabled').removeAttr('tabindex aria-disabled title')
            .attr('data-bs-toggle', 'tab');
        $('.b-lock-icon').remove();
        if (!IS_EDIT) {
            // Batch mode: lock Tabs 1 & 2 (no further changes after Save All)
            $('#tab-bSel, #tab-bDetails').addClass('disabled').removeAttr('data-bs-toggle')
                .attr({ tabindex: -1, 'aria-disabled': 'true', title: 'Parts already saved' });
        }
    }

    /* ─── Edit-mode helpers: build payload for a single row & PUT to /:uuid ─── */
    function _buildPartPayload(r) {
        var d = r.details;
        return {
            vehicle_year_id: r.year.id,
            vehicle_type_id: r.type.id,
            vehicle_make_id: r.make.id,
            vehicle_model_id: r.model.id,
            vehicle_variant_id: r.variant.id,
            vehicle_fuel_id: d.vehicle_fuel_id || '',
            vehicle_engine_id: d.vehicle_engine_id || '',
            vehicle_inventory_id: r.vehicleId || '',
            part_catalog_id: r.catalog.id,
            part_brand_id: d.part_brand_id || '',
            quantity: parseInt(d.quantity) || 1,
            condition: d.condition || '',
            part_state: d.part_state || '',
            inventory_status: d.inventory_status || '1',
            price_1: d.price_1 || '0',
            price_2: d.price_2 || '0',
            part_cost_price: d.cost_price || '0',
            rating: d.rating || '',
            motorization: d.motorization || '',
            reg_number_dismantler: d.reg_number_dismantler || '',
            cc: d.cc || '', cv: d.cv || '', kw: d.kw || '',
            print_label: d.print_label ? 1 : 0,
            vat_included: d.vat_included ? 1 : 0,
            custom_size: d.custom_size ? 1 : 0,
            weight_kg: d.weight || '', width_cm: d.width || '', height_cm: d.height || '', length_cm: d.length || '',
            notes: d.notes || '',
            extra_notes: d.extra_notes || '',
            internal_notes: d.internal_notes || ''
        };
    }

    /* Edit-mode Tab 1 — Save Selection (vehicle/catalog change) */
    $(document).on('click', '#btnEditSaveSelection', function() {
        if (!_rows.length) return;
        var r = _rows[0];
        // Sync top selectors back to row state
        if (IS_FROM_VEHICLE) {
            var v = _picked('#bVehicle'); if (v) { r.vehicleId = v.id; r.vehicleLabel = v.text; }
        } else {
            var y = _picked('#bYear');    if (y) r.year    = y;
            var t = _picked('#bType');    if (t) r.type    = t;
            var m = _picked('#bMake');    if (m) r.make    = m;
            var mo= _picked('#bModel');   if (mo) r.model  = mo;
            var va= _picked('#bVariant'); if (va) r.variant= va;
        }
        var c = _picked('#bCatalog'); if (c) r.catalog = c;

        var $btn = $(this); btnLoading($btn);
        $.ajax({
            url: BASE_URL + '/part-inventories/' + r.savedUuid, type: 'POST', contentType: 'application/json',
            data: JSON.stringify(_buildPartPayload(r)),
            success: function(resp) {
                btnReset($btn);
                if (resp && (resp.status === 200 || resp.status === 201)) toastr.success('Selection updated.');
                else toastr.error(resp && resp.message ? resp.message : 'Failed.');
            },
            error: function(xhr) { btnReset($btn); toastr.error(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Network error.'); }
        });
    });

    /* ─── Save All ─── */
    $('#btnBatchSaveAll').on('click', function() {
        if (!_rows.length) { toastr.error('No parts to save.'); return; }

        for (var i = 0; i < _rows.length; i++) {
            var q = parseInt(_rows[i].details.quantity);
            if (!q || q < 1) { toastr.error('Row ' + (i+1) + ': Quantity must be at least 1.'); return; }
        }

        var $btn = $('#btnBatchSaveAll');
        btnLoading($btn);

        // ── EDIT MODE: single PUT to /:uuid ──
        if (IS_EDIT && _rows[0] && _rows[0].savedUuid) {
            var r = _rows[0];
            $.ajax({
                url: BASE_URL + '/part-inventories/' + r.savedUuid, type: 'POST', contentType: 'application/json',
                data: JSON.stringify(_buildPartPayload(r)),
                success: function(resp) {
                    btnReset($btn);
                    if (resp && (resp.status === 200 || resp.status === 201)) toastr.success('Part updated.');
                    else toastr.error(resp && resp.message ? resp.message : 'Failed.');
                },
                error: function(xhr) { btnReset($btn); toastr.error(xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Network error.'); }
            });
            return;
        }

        var ok = 0, fail = 0, errors = [];
        // Sort: masters and standalone first, then sub rows last (so master save returns id before subs)
        var queue = _rows.slice().sort(function(a, b) {
            return (a._isSubOf ? 1 : 0) - (b._isSubOf ? 1 : 0);
        });

        function _buildPayloadForRow(r) {
            var d = r.details;
            var payload = {
                vehicle_year_id: r.year.id,
                vehicle_type_id: r.type.id,
                vehicle_make_id: r.make.id,
                vehicle_model_id: r.model.id,
                vehicle_variant_id: r.variant.id,
                vehicle_fuel_id: d.vehicle_fuel_id || '',
                vehicle_engine_id: d.vehicle_engine_id || '',
                part_catalog_id: r.catalog.id,
                part_brand_id: d.part_brand_id || '',
                quantity: parseInt(d.quantity) || 1,
                condition: d.condition || '',
                part_state: d.part_state || '',
                inventory_status: d.inventory_status || '1',
                price_1: d.price_1 || '0',
                price_2: d.price_2 || '0',
                part_cost_price: d.cost_price || '0',
                rating: d.rating || '',
                motorization: d.motorization || '',
                reg_number_dismantler: d.reg_number_dismantler || '',
                cc: d.cc || '', cv: d.cv || '', kw: d.kw || '',
                print_label: d.print_label ? 1 : 0,
                vat_included: d.vat_included ? 1 : 0,
                custom_size: d.custom_size ? 1 : 0,
                weight_kg: d.weight || '', width_cm: d.width || '', height_cm: d.height || '', length_cm: d.length || '',
                notes: d.notes || '',
                extra_notes: d.extra_notes || '',
                internal_notes: d.internal_notes || '',
                is_master_part: r._isMaster ? 1 : 0
            };
            // If this is a sub row, look up its master row's saved info
            if (r._isSubOf) {
                var master = _rows.find(function(m) { return m._isMaster && m._groupId === r._isSubOf; });
                if (master && master.savedDbId) {
                    payload.master_part_id = master.catalog.id;
                    payload.master_part_inventory_id = master.savedDbId;
                }
            }
            return payload;
        }

        function next() {
            if (!queue.length) {
                btnReset($btn);
                if (fail === 0) {
                    toastr.success(ok + ' part(s) created successfully.');
                    _unlockSavedTabs();
                    _renderRefs();
                    _renderDamages();
                    _renderAttrs();
                    _renderImages();
                    _renderVideos();
                    _renderLocations();
                    $('#tab-bRefs').tab('show');
                } else {
                    toastr.warning(ok + ' saved, ' + fail + ' failed. ' + errors.slice(0,3).join(' | '));
                }
                return;
            }
            var r = queue.shift();
            var payload = _buildPayloadForRow(r);
            $.ajax({
                url: BASE_URL + '/part-inventories', type: 'POST', contentType: 'application/json',
                data: JSON.stringify(payload),
                success: function(resp) {
                    if (resp && (resp.status === 200 || resp.status === 201)) {
                        ok++;
                        if (resp.data) {
                            r.savedUuid = resp.data.uuid || resp.data.id;
                            r.savedDbId = resp.data.id;
                        }
                        if (!r.references) r.references = [];
                    }
                    else { fail++; errors.push('#' + (ok+fail) + ': ' + (resp && resp.message ? resp.message : 'Failed')); }
                    next();
                },
                error: function(xhr) {
                    fail++;
                    errors.push('#' + (ok+fail) + ': ' + (xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Network error'));
                    next();
                }
            });
        }
        next();
    });

    /* ══════════════════════════════════════════════════════
       TAB 3: REFERENCES — per-part sections
    ══════════════════════════════════════════════════════ */
    var REF_COND = [['','-- Select --'],['1','OEM'],['2','Aftermarket']];
    var REF_TYPE = [['','-- Select --'],['1','Compatible'],['2','Written on Label']];

    function _renderRefs() {
        var $body = $('#bRefsBody');
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        if (!saved.length) { $body.html('<div class="text-muted text-center py-5">No saved parts.</div>'); return; }
        var html = '';
        saved.forEach(function(r, i) {
            if (!r.references) r.references = [];
            html += '<div class="card shadow-sm mb-3 b-ref-card" data-id="' + r.id + '">'
                + '<div class="card-header py-2 d-flex justify-content-between align-items-center">'
                +   '<div class="card-title mb-0" style="font-size:13px;">'
                +     '<i class="bi bi-link-45deg me-1"></i><strong>#' + (i+1) + ' — ' + H.esc(r.catalog.text) + '</strong>'
                +     ' <span class="ms-2" style="font-weight:400;font-size:11px;">' + H.esc(r.year.text+' · '+r.make.text+' · '+r.model.text+' · '+r.variant.text) + '</span>'
                +   '</div>'
                +   '<button type="button" class="btn btn-sm btn-primary b-ref-add"><i class="bi bi-plus-lg me-1"></i>Add Reference</button>'
                + '</div>'
                + '<div class="card-body p-2">'
                +   '<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;">'
                +     '<thead><tr><th>Reference Code</th><th style="width:140px;">Condition</th><th style="width:170px;">Reference Type</th><th style="width:140px;">Brand</th><th style="width:140px;">Manufacturer</th><th style="width:50px;"></th></tr></thead>'
                +     '<tbody class="b-ref-body">' + _renderRefRows(r.references) + '</tbody>'
                +   '</table></div>'
                + '</div>'
                + '</div>';
        });
        $body.html(html);
    }

    function _renderRefRows(refs) {
        if (!refs.length) return '<tr class="b-ref-empty"><td colspan="6" class="text-center text-muted py-2">No references. Click "Add Reference".</td></tr>';
        return refs.map(function(ref, idx) {
            return '<tr class="b-ref-row" data-idx="' + idx + '">'
                + '<td><input type="text" class="form-control form-control-sm r-code" value="' + H.esc(ref.reference_code||'') + '" placeholder="Reference Code"/></td>'
                + '<td><select class="form-select form-select-sm r-cond">' + _opts(REF_COND, ref.condition) + '</select></td>'
                + '<td><select class="form-select form-select-sm r-type">' + _opts(REF_TYPE, ref.reference_type) + '</select></td>'
                + '<td><input type="text" class="form-control form-control-sm r-brand" value="' + H.esc(ref.brand||'') + '" placeholder="Brand"/></td>'
                + '<td><input type="text" class="form-control form-control-sm r-mfg" value="' + H.esc(ref.manufacturer||'') + '" placeholder="Manufacturer"/></td>'
                + '<td class="text-center"><button type="button" class="btn btn-icon btn-sm btn-ghost-danger b-ref-rm" title="Delete"><i class="bi bi-trash3"></i></button></td>'
                + '</tr>';
        }).join('');
    }

    function _refCardRow($card) {
        var id = parseInt($card.data('id'));
        return _rows.find(function(r) { return r.id === id; });
    }

    /* Add row — sync DOM → state first so existing in-progress edits aren't lost */
    $('#bRefsBody').on('click', '.b-ref-add', function() {
        var $card = $(this).closest('.b-ref-card');
        var row = _refCardRow($card); if (!row) return;
        if (!row.references) row.references = [];
        row.references = _collectRefs($card);
        row.references.push({ reference_code:'', condition:'', reference_type:'', brand:'', manufacturer:'' });
        $card.find('.b-ref-body').html(_renderRefRows(row.references));
        $card.find('.b-ref-row:last .r-code').focus();
    });

    /* Delete row */
    $('#bRefsBody').on('click', '.b-ref-rm', function() {
        var $card = $(this).closest('.b-ref-card');
        var $row = $(this).closest('.b-ref-row');
        var idx = parseInt($row.data('idx'));
        var row = _refCardRow($card); if (!row) return;
        smsConfirm({
            icon: '🗑️', title: T('btn.delete','Delete'),
            msg: T('general.are_you_sure','Are you sure?'),
            btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
            onConfirm: function() {
                row.references = _collectRefs($card);
                row.references.splice(idx, 1);
                $card.find('.b-ref-body').html(_renderRefRows(row.references));
            }
        });
    });

    /* Capture edits to reference rows back into state */
    function _collectRefs($card) {
        var rows = [];
        $card.find('.b-ref-row').each(function() {
            var $r = $(this);
            rows.push({
                reference_code: $r.find('.r-code').val() || '',
                condition: $r.find('.r-cond').val() || '',
                reference_type: $r.find('.r-type').val() || '',
                brand: $r.find('.r-brand').val() || '',
                manufacturer: $r.find('.r-mfg').val() || ''
            });
        });
        return rows;
    }

    /* ══════════════════════════════════════════════════════
       TAB 4: DAMAGES — per-part sections
    ══════════════════════════════════════════════════════ */
    var DMG_TYPE = [['','-- Select --'],['1','Does Not Affect Function'],['2','Affects Function']];
    var DMG_LOC  = [['','-- Select --'],['1','Internal'],['2','External']];

    function _renderDamages() {
        var $body = $('#bDamagesBody');
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        if (!saved.length) { $body.html('<div class="text-muted text-center py-5">No saved parts.</div>'); return; }
        var html = '';
        saved.forEach(function(r, i) {
            if (!r.damages) r.damages = [];
            html += '<div class="card shadow-sm mb-3 b-dmg-card" data-id="' + r.id + '">'
                + '<div class="card-header py-2 d-flex justify-content-between align-items-center">'
                +   '<div class="card-title mb-0" style="font-size:13px;">'
                +     '<i class="bi bi-exclamation-triangle me-1"></i><strong>#' + (i+1) + ' — ' + H.esc(r.catalog.text) + '</strong>'
                +     ' <span class="ms-2" style="font-weight:400;font-size:11px;">' + H.esc(r.year.text+' · '+r.make.text+' · '+r.model.text+' · '+r.variant.text) + '</span>'
                +   '</div>'
                +   '<button type="button" class="btn btn-sm btn-primary b-dmg-add"><i class="bi bi-plus-lg me-1"></i>Add Damage</button>'
                + '</div>'
                + '<div class="card-body p-2"><div class="b-dmg-list">' + _renderDmgRows(r.damages) + '</div></div>'
                + '</div>';
        });
        $body.html(html);
        $body.find('.b-dmg-card').each(function() { _initDmgStars($(this)); });
    }

    function _renderDmgRows(damages) {
        if (!damages.length) return '<div class="text-muted small text-center py-2 b-dmg-empty">No damages. Click "Add Damage".</div>';
        return damages.map(function(d, idx) {
            return '<div class="border rounded p-2 mb-2 b-dmg-row" data-idx="' + idx + '" style="background:#fafbfc;">'
                + '<div class="d-flex justify-content-between align-items-center mb-2">'
                +   '<span class="fw-semibold text-muted small">Damage #' + (idx+1) + '</span>'
                +   '<button type="button" class="btn btn-icon btn-sm btn-ghost-danger b-dmg-rm" title="Delete"><i class="bi bi-trash3"></i></button>'
                + '</div>'
                + '<div class="row g-2">'
                +   '<div class="col-md-5"><label class="form-label small mb-1">Description <span class="text-danger">*</span></label><input type="text" class="form-control form-control-sm d-desc" value="' + H.esc(d.description||d.damage_description||'') + '" placeholder="Damage description"/></div>'
                +   '<div class="col-md-2"><label class="form-label small mb-1">Type <span class="text-danger">*</span></label><select class="form-select form-select-sm d-type">' + _opts(DMG_TYPE, d.damage_type) + '</select></div>'
                +   '<div class="col-md-2"><label class="form-label small mb-1">Location <span class="text-danger">*</span></label><select class="form-select form-select-sm d-loc">' + _opts(DMG_LOC, d.damage_location) + '</select></div>'
                +   '<div class="col-md-3"><label class="form-label small mb-1 d-block">Rating</label>' + _starsHtml(d.damage_rating) + '</div>'
                + '</div>'
                + '</div>';
        }).join('');
    }

    /* Init half-star rating widgets inside a damage card */
    function _initDmgStars($card) {
        var row = _dmgCardRow($card); if (!row) return;
        $card.find('.b-dmg-row').each(function() {
            var $r = $(this);
            var idx = parseInt($r.data('idx'));
            var d = row.damages[idx]; if (!d) return;
            var $w = $r.find('.b-stars');
            _paintStars($w, d.damage_rating);
            $w.off('mouseenter mouseleave click', '.star-l, .star-r, .sms-star-clear');
            $w.on('mouseenter', '.star-l', function() { _paintStars($w, parseInt($(this).parent().data('v')) - 0.5); });
            $w.on('mouseenter', '.star-r', function() { _paintStars($w, parseInt($(this).parent().data('v'))); });
            $w.on('mouseleave', function() { _paintStars($w, d.damage_rating || 0); });
            $w.on('click', '.star-l', function() { d.damage_rating = parseInt($(this).parent().data('v')) - 0.5; _paintStars($w, d.damage_rating); });
            $w.on('click', '.star-r', function() { d.damage_rating = parseInt($(this).parent().data('v')); _paintStars($w, d.damage_rating); });
            $w.on('click', '.sms-star-clear', function() { d.damage_rating = 0; _paintStars($w, 0); });
        });
    }

    function _dmgCardRow($card) {
        var id = parseInt($card.data('id'));
        return _rows.find(function(r) { return r.id === id; });
    }

    /* Add damage — sync DOM → state first so existing in-progress edits aren't lost */
    $('#bDamagesBody').on('click', '.b-dmg-add', function() {
        var $card = $(this).closest('.b-dmg-card');
        var row = _dmgCardRow($card); if (!row) return;
        if (!row.damages) row.damages = [];
        // Persist current DOM values into state (collect fns merge ratings from state)
        row.damages = _collectDmgs($card);
        row.damages.push({ description:'', damage_type:'', damage_location:'', damage_rating:0 });
        $card.find('.b-dmg-list').html(_renderDmgRows(row.damages));
        _initDmgStars($card);
        $card.find('.b-dmg-row:last .d-desc').focus();
    });

    /* Delete damage */
    $('#bDamagesBody').on('click', '.b-dmg-rm', function() {
        var $card = $(this).closest('.b-dmg-card');
        var $row = $(this).closest('.b-dmg-row');
        var idx = parseInt($row.data('idx'));
        var row = _dmgCardRow($card); if (!row) return;
        // Block delete if this damage is linked to any image or video
        var imgLinks = (row.damageImageLinks && row.damageImageLinks[idx]) || [];
        var vidLinks = (row.damageVideoLinks && row.damageVideoLinks[idx]) || [];
        if (imgLinks.length || vidLinks.length) {
            var parts = [];
            if (imgLinks.length) parts.push(imgLinks.length + ' image' + (imgLinks.length>1?'s':''));
            if (vidLinks.length) parts.push(vidLinks.length + ' video' + (vidLinks.length>1?'s':''));
            toastr.warning('Cannot delete damage — linked to ' + parts.join(' and ') + '. Unlink first.');
            return;
        }
        smsConfirm({
            icon: '🗑️', title: T('btn.delete','Delete'),
            msg: T('general.are_you_sure','Are you sure?'),
            btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
            onConfirm: function() {
                row.damages = _collectDmgs($card);
                row.damages.splice(idx, 1);
                // Also drop the link maps for this index and shift higher indexes down
                if (row.damageImageLinks) {
                    var newImg = {}; Object.keys(row.damageImageLinks).forEach(function(k) {
                        var ki = parseInt(k); if (ki < idx) newImg[ki] = row.damageImageLinks[k];
                        else if (ki > idx) newImg[ki - 1] = row.damageImageLinks[k];
                    });
                    row.damageImageLinks = newImg;
                }
                if (row.damageVideoLinks) {
                    var newVid = {}; Object.keys(row.damageVideoLinks).forEach(function(k) {
                        var ki = parseInt(k); if (ki < idx) newVid[ki] = row.damageVideoLinks[k];
                        else if (ki > idx) newVid[ki - 1] = row.damageVideoLinks[k];
                    });
                    row.damageVideoLinks = newVid;
                }
                $card.find('.b-dmg-list').html(_renderDmgRows(row.damages));
                _initDmgStars($card);
            }
        });
    });

    function _collectDmgs($card) {
        var row = _dmgCardRow($card);
        var rows = [];
        $card.find('.b-dmg-row').each(function() {
            var $r = $(this);
            var idx = parseInt($r.data('idx'));
            var existing = row && row.damages[idx] ? row.damages[idx] : {};
            rows.push({
                description:    $r.find('.d-desc').val() || '',
                damage_type:    $r.find('.d-type').val() || '',
                damage_location:$r.find('.d-loc').val() || '',
                damage_rating:  existing.damage_rating || 0
            });
        });
        return rows;
    }

    /* Save All Damages */
    $('#btnSaveAllDamages').on('click', function() {
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        for (var i = 0; i < saved.length; i++) {
            var $card = $('.b-dmg-card[data-id="' + saved[i].id + '"]');
            saved[i].damages = _collectDmgs($card);
        }
        for (var i2 = 0; i2 < saved.length; i2++) {
            var dmgs = saved[i2].damages;
            var seenDesc = {};
            for (var j = 0; j < dmgs.length; j++) {
                var dm = dmgs[j];
                var desc = (dm.description || '').trim();
                if (!desc) { toastr.error('Part #' + (i2+1) + ' damage ' + (j+1) + ': Description required.'); return; }
                if (!dm.damage_type)     { toastr.error('Part #' + (i2+1) + ' damage ' + (j+1) + ': Type required.'); return; }
                if (!dm.damage_location) { toastr.error('Part #' + (i2+1) + ' damage ' + (j+1) + ': Location required.'); return; }
                if (dm.damage_rating !== '' && dm.damage_rating !== null && dm.damage_rating !== undefined) {
                    var rv = parseFloat(dm.damage_rating);
                    if (isNaN(rv) || rv < 0 || rv > 5) {
                        toastr.error('Part #' + (i2+1) + ' damage ' + (j+1) + ': Rating must be 0–5.'); return;
                    }
                }
                var dKey = desc.toLowerCase();
                if (seenDesc[dKey]) { toastr.error('Part #' + (i2+1) + ': Duplicate damage description "' + desc + '". Damages must be unique within a part.'); return; }
                seenDesc[dKey] = true;
            }
        }
        var queue = saved.filter(function(r) { return r.damages && r.damages.length > 0; });
        if (!queue.length) { toastr.warning('Please add at least one damage to any part before saving.'); return; }

        var $btn = $(this); btnLoading($btn);
        var ok = 0, fail = 0;
        function next() {
            if (!queue.length) {
                btnReset($btn);
                if (fail === 0) toastr.success('Damages saved for ' + ok + ' part(s).');
                else toastr.warning(ok + ' saved, ' + fail + ' failed.');
                return;
            }
            var r = queue.shift();
            var payload = r.damages.map(function(d) {
                var o = {
                    damage_description: d.description || '',
                    description: d.description || '',
                    damage_type: d.damage_type,
                    damage_location: d.damage_location
                };
                if (d.damage_rating !== '') o.damage_rating = d.damage_rating;
                return o;
            });
            $.ajax({
                url: BASE_URL + '/part-inventories/' + r.savedUuid + '/damages/bulk',
                type: 'POST', contentType: 'application/json',
                data: JSON.stringify({ damages: payload }),
                success: function(resp) {
                    if (resp && (resp.status === 200 || resp.status === 201)) ok++; else fail++;
                    next();
                },
                error: function() { fail++; next(); }
            });
        }
        next();
    });

    /* ══════════════════════════════════════════════════════
       TAB 5: ATTRIBUTES — per-part dynamic from catalog config
    ══════════════════════════════════════════════════════ */
    function _renderAttrs() {
        var $body = $('#bAttrsBody');
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        if (!saved.length) { $body.html('<div class="text-muted text-center py-5">No saved parts.</div>'); return; }
        $body.html('<div class="text-center py-3"><span class="spinner-border spinner-border-sm text-primary"></span> Loading attributes…</div>');

        var pending = saved.length;
        saved.forEach(function(r) {
            $.get(BASE_URL + '/part-inventories/' + r.savedUuid + '/attributes', function(res) {
                var list = [];
                if (res && res.status === 200) {
                    if (Array.isArray(res.data)) list = res.data;
                    else if (res.data && Array.isArray(res.data.attributes)) list = res.data.attributes;
                }
                r.attributes = list;
            }).always(function() {
                pending--;
                if (pending === 0) _drawAttrsCards();
            });
        });
    }

    function _initAttrMultiSelects($scope) {
        $scope.find('.a-multi-sel').each(function() {
            var $s = $(this);
            if ($s.hasClass('select2-hidden-accessible')) return;
            $s.select2({ theme: 'bootstrap-5', placeholder: 'Select options...', width: '100%', closeOnSelect: false, allowClear: true });
        });
    }

    function _drawAttrsCards() {
        var $body = $('#bAttrsBody');
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        var html = '';
        saved.forEach(function(r, i) {
            html += '<div class="card shadow-sm mb-3 b-attr-card" data-id="' + r.id + '">'
                + '<div class="card-header py-2">'
                +   '<div class="card-title mb-0" style="font-size:13px;">'
                +     '<i class="bi bi-sliders me-1"></i><strong>#' + (i+1) + ' — ' + H.esc(r.catalog.text) + '</strong>'
                +     ' <span class="ms-2" style="font-weight:400;font-size:11px;">' + H.esc(r.year.text+' · '+r.make.text+' · '+r.model.text+' · '+r.variant.text) + '</span>'
                +     ' <span class="badge bg-primary-lt ms-2">' + (r.attributes ? r.attributes.length : 0) + '</span>'
                +   '</div>'
                + '</div>'
                + '<div class="card-body">'
                +   _renderAttrFields(r.attributes || [])
                + '</div>'
                + '</div>';
        });
        $body.html(html);
        _initAttrMultiSelects($body);
    }

    function _renderAttrFields(attrs) {
        if (!attrs.length) return '<div class="text-muted small text-center py-2">No attributes configured for this part\'s catalog.</div>';
        var html = '<div class="row g-3">';
        attrs.forEach(function(attr) {
            var perms = attr.permissions || {};
            var canView = perms.can_view !== false && attr.can_view !== false;
            if (!canView) return;
            var attrId = attr.id || attr.attribute_id || '';
            var label = attr.label_name || attr.name || '';
            var req = attr.is_required;
            var canEdit = (perms.can_edit !== false) && (attr.can_edit !== false);
            var dt = parseInt(attr.data_type_id) || 1;
            var cur = attr.value != null ? attr.value : '';
            var opts = attr.options || [];
            var ro = !canEdit ? ' readonly disabled' : '';
            var mark = req ? ' <span class="text-danger">*</span>' : '';

            html += '<div class="col-md-4 col-sm-6">';
            html += '<label class="form-label small fw-medium mb-1">' + H.esc(label) + mark + '</label>';

            // data_type_id enum (matches PartCatalogController save side):
            //   1=Text, 2=Number, 3=Dropdown, 4=Checkbox, 5=Radio, 6=Upload
            var isMulti = !!attr.is_multiple;
            var selVals = [];
            if (Array.isArray(cur)) selVals = cur.map(String);
            else if (cur != null && cur !== '') selVals = [String(cur)];

            switch (dt) {
                case 1:
                    html += '<input type="text" class="form-control form-control-sm a-fld" data-attr-id="' + attrId + '" data-type="1" value="' + H.esc(String(cur||'')) + '"' + ro + '/>';
                    break;
                case 2:
                    html += '<input type="number" step="any" class="form-control form-control-sm a-fld" data-attr-id="' + attrId + '" data-type="2" value="' + H.esc(String(cur||'')) + '"' + ro + '/>';
                    break;
                case 3: // Dropdown — single or multi
                    if (isMulti) {
                        html += '<select class="form-select form-select-sm a-fld a-multi-sel" multiple data-attr-id="' + attrId + '" data-type="3"' + ro + '>';
                    } else {
                        html += '<select class="form-select form-select-sm a-fld" data-attr-id="' + attrId + '" data-type="3"' + ro + '>';
                        html += '<option value="">-- Select --</option>';
                    }
                    opts.forEach(function(o) {
                        var v = o.value != null ? o.value : (o.id || '');
                        var l = o.label || o.option_value || o.name || ('#' + v);
                        html += '<option value="' + H.esc(String(v)) + '"' + (selVals.indexOf(String(v))!==-1?' selected':'') + '>' + H.esc(l) + '</option>';
                    });
                    html += '</select>';
                    break;
                case 4: // Checkbox list (multi by nature)
                    html += '<div class="d-flex flex-wrap gap-2 a-multi" data-attr-id="' + attrId + '" data-type="4">';
                    opts.forEach(function(o) {
                        var v = o.value != null ? o.value : (o.id || '');
                        var l = o.label || o.option_value || o.name || ('#' + v);
                        html += '<label class="form-check"><input type="checkbox" class="form-check-input a-multi-chk" value="' + H.esc(String(v)) + '"' + (selVals.indexOf(String(v))!==-1?' checked':'') + ro + '/><span class="form-check-label small">' + H.esc(l) + '</span></label>';
                    });
                    html += '</div>';
                    break;
                case 5: // Radio (single)
                    html += '<div class="d-flex flex-wrap gap-2">';
                    opts.forEach(function(o, i) {
                        var v = o.value != null ? o.value : (o.id || '');
                        var l = o.label || o.option_value || o.name || ('#' + v);
                        html += '<label class="form-check"><input type="radio" class="form-check-input a-fld" name="a-radio-' + attrId + '" data-attr-id="' + attrId + '" data-type="5" value="' + H.esc(String(v)) + '"' + (selVals.indexOf(String(v))!==-1?' checked':'') + ro + '/><span class="form-check-label small">' + H.esc(l) + '</span></label>';
                    });
                    html += '</div>';
                    break;
                case 6: // Upload
                    html += '<input type="file" class="form-control form-control-sm a-fld" data-attr-id="' + attrId + '" data-type="6"' + ro + '/>';
                    if (cur) html += '<div class="small text-muted mt-1">Current: <a href="' + H.esc(String(cur)) + '" target="_blank">view</a></div>';
                    break;
                default:
                    html += '<input type="text" class="form-control form-control-sm a-fld" data-attr-id="' + attrId + '" data-type="1" value="' + H.esc(String(cur||'')) + '"' + ro + '/>';
            }
            html += '</div>';
        });
        html += '</div>';
        return html;
    }

    function _collectAttrValues($card) {
        var values = {};
        // Single-value fields (text, number, single select, radio, upload)
        $card.find('.a-fld').each(function() {
            var $f = $(this);
            var id = $f.data('attr-id'); if (!id) return;
            // Skip radios that are not checked (we'll capture only the checked one)
            if ($f.is('[type=radio]') && !$f.is(':checked')) return;
            // Multi select dropdown
            if ($f.is('.a-multi-sel')) { values[id] = $f.val() || []; return; }
            values[id] = $f.val() || '';
        });
        // Checkbox-list fields (data_type 4)
        $card.find('.a-multi').each(function() {
            var $w = $(this);
            var id = $w.data('attr-id');
            var sel = [];
            $w.find('.a-multi-chk:checked').each(function() { sel.push($(this).val()); });
            values[id] = sel;
        });
        return values;
    }

    /* Save All Attributes */
    $('#btnSaveAllAttrs').on('click', function() {
        var saved = _rows.filter(function(r) { return r.savedUuid; });

        // Client-side required validation per part
        for (var i = 0; i < saved.length; i++) {
            var $card = $('.b-attr-card[data-id="' + saved[i].id + '"]');
            var attrs = saved[i].attributes || [];
            var vals = _collectAttrValues($card);
            for (var j = 0; j < attrs.length; j++) {
                var a = attrs[j];
                var pp = a.permissions || {};
                if (pp.can_view === false || a.can_view === false) continue;
                if (!a.is_required) continue;
                var v = vals[a.id];
                var empty = (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0));
                if (empty) { toastr.error('Part #' + (i+1) + ': "' + (a.label_name||a.name) + '" is required.'); return; }
            }
            saved[i]._attrValues = vals;
        }

        // Only save parts that have at least one attribute configured
        var queue = saved.filter(function(r) { return r.attributes && r.attributes.length > 0; });
        if (!queue.length) { toastr.warning('No attributes configured for any part.'); return; }

        var $btn = $(this); btnLoading($btn);
        var ok = 0, fail = 0;
        function next() {
            if (!queue.length) {
                btnReset($btn);
                if (fail === 0) toastr.success('Attributes saved for ' + ok + ' part(s).');
                else toastr.warning(ok + ' saved, ' + fail + ' failed.');
                return;
            }
            var r = queue.shift();
            $.ajax({
                url: BASE_URL + '/part-inventories/' + r.savedUuid + '/attributes',
                type: 'POST', contentType: 'application/json',
                data: JSON.stringify({ values: r._attrValues || {} }),
                success: function(resp) {
                    if (resp && (resp.status === 200 || resp.status === 201)) ok++; else fail++;
                    next();
                },
                error: function() { fail++; next(); }
            });
        }
        next();
    });

    /* ══════════════════════════════════════════════════════
       TAB 6 / 7: IMAGES & VIDEOS — per-part upload + damage links
    ══════════════════════════════════════════════════════ */
    function _mediaCardRow($card) {
        var id = parseInt($card.data('id'));
        return _rows.find(function(r) { return r.id === id; });
    }

    /* Build the multi-select damage dropdown for a single image/video */
    function _damageOptionsHtml(row, mediaId, kind) {
        var dmgs = row.damages || [];
        if (!dmgs.length) return '<div class="text-muted small">No damages on this part.</div>';
        var linkMap = (kind === 'image') ? (row.damageImageLinks || {}) : (row.damageVideoLinks || {});
        var html = '<select class="form-select form-select-sm b-media-dmg-sel" multiple data-kind="' + kind + '" data-media-id="' + mediaId + '" style="width:100%;">';
        dmgs.forEach(function(d, idx) {
            var linked = (linkMap[idx] || []).map(String).indexOf(String(mediaId)) !== -1;
            var label = (d.description || d.damage_description || 'Damage') + ' #' + (idx+1);
            html += '<option value="' + idx + '"' + (linked ? ' selected' : '') + '>' + H.esc(label) + '</option>';
        });
        html += '</select>';
        return html;
    }

    /* Init select2 multi-select on every newly rendered media tile */
    function _initMediaDmgSelects($scope) {
        $scope.find('.b-media-dmg-sel').each(function() {
            var $s = $(this);
            if ($s.hasClass('select2-hidden-accessible')) return;
            $s.select2({ theme: 'bootstrap-5', placeholder: 'Link damages...', width: '100%', closeOnSelect: false });
        });
    }

    function _renderMediaTab(kind) {
        var $body = (kind === 'image') ? $('#bImagesBody') : $('#bVideosBody');
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        if (!saved.length) { $body.html('<div class="text-muted text-center py-5">No saved parts.</div>'); return; }
        var html = '';
        saved.forEach(function(r, i) {
            if (kind === 'image' && !r.images) r.images = [];
            if (kind === 'video' && !r.videos) r.videos = [];
            var media = (kind === 'image') ? r.images : r.videos;
            var iconCls = (kind === 'image') ? 'bi-images' : 'bi-camera-video';
            var accept  = (kind === 'image') ? '.jpg,.jpeg,.png,.gif,.webp' : '.mp4,.mov,.avi,.mkv,.webm';
            html += '<div class="card shadow-sm mb-3 b-media-card" data-id="' + r.id + '" data-kind="' + kind + '">'
                + '<div class="card-header py-2 d-flex justify-content-between align-items-center">'
                +   '<div class="card-title mb-0" style="font-size:13px;">'
                +     '<i class="bi ' + iconCls + ' me-1"></i><strong>#' + (i+1) + ' — ' + H.esc(r.catalog.text) + '</strong>'
                +     ' <span class="ms-2" style="font-weight:400;font-size:11px;">' + H.esc(r.year.text+' · '+r.make.text+' · '+r.model.text+' · '+r.variant.text) + '</span>'
                +     ' <span class="badge bg-primary-lt ms-2 b-media-count">' + media.length + '</span>'
                +   '</div>'
                + '</div>'
                + '<div class="card-body p-2">'
                +   '<div class="d-flex gap-2 align-items-center mb-2">'
                +     '<input type="file" class="form-control form-control-sm b-media-input" accept="' + accept + '" multiple/>'
                +     '<button type="button" class="btn btn-sm btn-primary b-media-upload"><i class="bi bi-cloud-upload me-1"></i>Upload</button>'
                +   '</div>'
                +   '<div class="b-media-grid row g-2">' + _renderMediaTiles(r, kind) + '</div>'
                + '</div>'
                + '</div>';
        });
        $body.html(html);
        _initMediaDmgSelects($body);
    }

    function _renderMediaTiles(row, kind) {
        var media = (kind === 'image') ? (row.images || []) : (row.videos || []);
        if (!media.length) return '<div class="col-12 text-muted small text-center py-2">No ' + (kind==='image'?'images':'videos') + ' uploaded yet.</div>';
        return media.map(function(m) {
            var id = m.id || m.image_id || m.video_id;
            var url = m.display_url || m.image_url || m.video_url || m.url || '';
            var thumb = (kind === 'image')
                ? '<img src="' + H.esc(url) + '" class="rounded" style="width:100%;height:100px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/>'
                : '<video src="' + H.esc(url) + '#t=1" preload="metadata" muted style="width:100%;height:100px;object-fit:cover;border-radius:4px;"></video>';
            var editBtn = '<button type="button" class="btn-media-action btn-edit position-absolute top-0 start-0 m-1 b-media-edit" data-url="' + H.esc(url) + '" title="Edit"><i class="bi bi-pencil"></i></button>';
            return '<div class="col-6 col-md-4 col-lg-3 b-media-tile" data-id="' + id + '">'
                + '<div class="border rounded p-1 position-relative">'
                +   thumb
                +   editBtn
                +   '<button type="button" class="btn-media-action btn-del position-absolute top-0 end-0 m-1 b-media-rm" title="Delete"><i class="bi bi-trash3"></i></button>'
                +   '<div class="mt-1">' + _damageOptionsHtml(row, id, kind) + '</div>'
                + '</div>'
                + '</div>';
        }).join('');
    }

    function _renderImages() { _renderMediaTab('image'); }
    function _renderVideos() { _renderMediaTab('video'); }

    /* Upload handler (delegated) */
    $(document).on('click', '.b-media-upload', function() {
        var $card = $(this).closest('.b-media-card');
        var row = _mediaCardRow($card); if (!row) return;
        var kind = $card.data('kind');
        var $input = $card.find('.b-media-input');
        var files = $input[0].files;
        if (!files || !files.length) { toastr.error('Select files first.'); return; }
        var fd = new FormData();
        var fieldName = (kind === 'image') ? 'images' : 'videos';
        for (var i = 0; i < files.length; i++) fd.append(fieldName, files[i]);

        var $btn = $(this); btnLoading($btn);
        $.ajax({
            url: BASE_URL + '/part-inventories/' + row.savedUuid + '/' + fieldName,
            type: 'POST', data: fd, processData: false, contentType: false,
            success: function(resp) {
                btnReset($btn);
                if (resp && (resp.status === 200 || resp.status === 201)) {
                    if (Array.isArray(resp.data)) {
                        if (kind === 'image') row.images = resp.data;
                        else row.videos = resp.data;
                    }
                    $card.find('.b-media-grid').html(_renderMediaTiles(row, kind));
                    _initMediaDmgSelects($card);
                    $card.find('.b-media-count').text((kind === 'image' ? row.images : row.videos).length);
                    $input.val('');
                    toastr.success('Uploaded.');
                } else toastr.error(resp && resp.message ? resp.message : 'Upload failed.');
            },
            error: function() { btnReset($btn); toastr.error('Network error.'); }
        });
    });

    /* Delete media tile */
    $(document).on('click', '.b-media-rm', function() {
        var $card = $(this).closest('.b-media-card');
        var $tile = $(this).closest('.b-media-tile');
        var row = _mediaCardRow($card); if (!row) return;
        var kind = $card.data('kind');
        var mediaId = $tile.data('id');
        smsConfirm({
            icon: '🗑️', title: T('btn.delete','Delete'),
            msg: 'Delete this ' + kind + '?',
            btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
            onConfirm: function() {
                var endpoint = (kind === 'image') ? 'images/delete' : 'videos/delete';
                var bodyKey  = (kind === 'image') ? 'image_id' : 'video_id';
                var body = {}; body[bodyKey] = mediaId;
                $.post(BASE_URL + '/part-inventories/' + row.savedUuid + '/' + endpoint, body, function(resp) {
                    if (resp && resp.status === 200) {
                        if (kind === 'image') row.images = (row.images||[]).filter(function(m) { return String(m.id||m.image_id) !== String(mediaId); });
                        else row.videos = (row.videos||[]).filter(function(m) { return String(m.id||m.video_id) !== String(mediaId); });
                        // Strip from any damage link maps
                        var linkMap = (kind === 'image') ? row.damageImageLinks : row.damageVideoLinks;
                        if (linkMap) Object.keys(linkMap).forEach(function(k) { linkMap[k] = (linkMap[k]||[]).filter(function(x) { return String(x) !== String(mediaId); }); });
                        $card.find('.b-media-grid').html(_renderMediaTiles(row, kind));
                        $card.find('.b-media-count').text((kind === 'image' ? row.images : row.videos).length);
                        toastr.success(resp.message || 'Deleted.');
                    } else toastr.error(resp && resp.message ? resp.message : 'Delete failed.');
                });
            }
        });
    });

    /* Edit media tile → open SMS_ImageEditor or SMS_VideoEditor */
    $(document).on('click', '.b-media-edit', function() {
        var $card = $(this).closest('.b-media-card');
        var $tile = $(this).closest('.b-media-tile');
        var row = _mediaCardRow($card); if (!row) return;
        var kind = $card.data('kind');
        var mediaId = $tile.data('id');
        var mediaUrl = $(this).data('url');

        if (kind === 'video') {
            if (typeof SMS_VideoEditor === 'undefined') { toastr.error('Video editor not loaded.'); return; }
            SMS_VideoEditor.open({
                videoUrl: mediaUrl,
                onSave: function(blob) {
                    var fd = new FormData();
                    fd.append('videos', blob, 'edited-video.mp4');
                    $.ajax({
                        url: BASE_URL + '/part-inventories/' + row.savedUuid + '/videos',
                        type: 'POST', data: fd, processData: false, contentType: false,
                        success: function(r) {
                            if (r.status === 200 || r.status === 201) {
                                if (Array.isArray(r.data)) row.videos = r.data;
                                $card.find('.b-media-grid').html(_renderMediaTiles(row, 'video'));
                                _initMediaDmgSelects($card);
                                $card.find('.b-media-count').text(row.videos.length);
                                toastr.success('Video saved.');
                            } else toastr.error(r.message || 'Failed.');
                        },
                        error: function() { toastr.error('Upload failed.'); }
                    });
                }
            });
            return;
        }

        // Image edit
        var imageId = mediaId;
        var imageUrl = mediaUrl;
        if (typeof SMS_ImageEditor === 'undefined') { toastr.error('Image editor not loaded.'); return; }
        SMS_ImageEditor.open({
            imageUrl: imageUrl,
            onSave: function(blob, dataUrl, mode, editActions) {
                var actionsStr = (editActions && editActions.length) ? editActions.join(', ') : '';
                if (mode === 'new') {
                    var fd = new FormData();
                    fd.append('images', blob, 'edited-image.png');
                    if (actionsStr) fd.append('edit_actions', actionsStr);
                    $.ajax({
                        url: BASE_URL + '/part-inventories/' + row.savedUuid + '/images',
                        type: 'POST', data: fd, processData: false, contentType: false,
                        success: function(r) {
                            if (r.status === 200 || r.status === 201) {
                                if (Array.isArray(r.data)) row.images = r.data;
                                $card.find('.b-media-grid').html(_renderMediaTiles(row, 'image'));
                                _initMediaDmgSelects($card);
                                $card.find('.b-media-count').text(row.images.length);
                                toastr.success('Saved as new image.');
                            } else toastr.error(r.message || 'Failed.');
                        },
                        error: function() { toastr.error('Upload failed.'); }
                    });
                } else {
                    var fd2 = new FormData();
                    fd2.append('image', blob, 'edited-image.png');
                    if (actionsStr) fd2.append('edit_actions', actionsStr);
                    $.ajax({
                        url: BASE_URL + '/part-inventories/' + row.savedUuid + '/images/' + imageId + '/replace',
                        type: 'POST', data: fd2, processData: false, contentType: false,
                        success: function(r) {
                            if (r.status === 200) {
                                if (Array.isArray(r.data)) row.images = r.data;
                                $card.find('.b-media-grid').html(_renderMediaTiles(row, 'image'));
                                _initMediaDmgSelects($card);
                                toastr.success('Image replaced.');
                            } else toastr.error(r.message || 'Failed.');
                        },
                        error: function() { toastr.error('Replace failed.'); }
                    });
                }
            }
        });
    });

    /* Damage multi-select change on a media tile */
    $(document).on('change', '.b-media-dmg-sel', function() {
        var $card = $(this).closest('.b-media-card');
        var row = _mediaCardRow($card); if (!row) return;
        var kind = $(this).data('kind');
        var mediaId = String($(this).data('media-id'));
        var key = (kind === 'image') ? 'damageImageLinks' : 'damageVideoLinks';
        if (!row[key]) row[key] = {};
        var selectedIdxs = ($(this).val() || []).map(function(v) { return parseInt(v); });
        // Rewrite all damage idx → mediaId mappings: ensure only selectedIdxs include this mediaId
        (row.damages || []).forEach(function(_, idx) {
            if (!row[key][idx]) row[key][idx] = [];
            var arr = row[key][idx].map(String);
            var pos = arr.indexOf(mediaId);
            var shouldHave = selectedIdxs.indexOf(idx) !== -1;
            if (shouldHave && pos === -1) arr.push(mediaId);
            else if (!shouldHave && pos !== -1) arr.splice(pos, 1);
            row[key][idx] = arr;
        });
    });

    /* Save Image–Damage Links: re-bulk-save damages with image_ids embedded */
    function _saveMediaLinks(kind) {
        var saved = _rows.filter(function(r) { return r.savedUuid && r.damages && r.damages.length; });
        var queue = saved.slice();
        if (!queue.length) { toastr.warning('No damages to link to. Add damages first.'); return; }

        var $btn = (kind === 'image') ? $('#btnSaveImageLinks') : $('#btnSaveVideoLinks');
        btnLoading($btn);
        var ok = 0, fail = 0;

        function next() {
            if (!queue.length) {
                btnReset($btn);
                if (fail === 0) toastr.success((kind === 'image' ? 'Image' : 'Video') + ' links saved for ' + ok + ' part(s).');
                else toastr.warning(ok + ' saved, ' + fail + ' failed.');
                return;
            }
            var r = queue.shift();
            var imgLinks = r.damageImageLinks || {};
            var vidLinks = r.damageVideoLinks || {};
            // Rebuild full damages payload for this part (preserves both image & video links)
            var payload = r.damages.map(function(d, idx) {
                var o = {
                    damage_description: d.description || d.damage_description || '',
                    description: d.description || d.damage_description || '',
                    damage_type: d.damage_type,
                    damage_location: d.damage_location,
                    image_ids: (imgLinks[idx] || []).map(function(x) { return parseInt(x); }),
                    video_ids: (vidLinks[idx] || []).map(function(x) { return parseInt(x); })
                };
                if (d.damage_rating !== '' && d.damage_rating !== null && d.damage_rating !== undefined) o.damage_rating = d.damage_rating;
                return o;
            });
            $.ajax({
                url: BASE_URL + '/part-inventories/' + r.savedUuid + '/damages/bulk',
                type: 'POST', contentType: 'application/json',
                data: JSON.stringify({ damages: payload }),
                success: function(resp) {
                    if (resp && (resp.status === 200 || resp.status === 201)) ok++; else fail++;
                    next();
                },
                error: function() { fail++; next(); }
            });
        }
        next();
    }
    $('#btnSaveImageLinks').on('click', function() { _saveMediaLinks('image'); });
    $('#btnSaveVideoLinks').on('click', function() { _saveMediaLinks('video'); });

    /* ══════════════════════════════════════════════════════
       TAB 8: LOCATIONS — per-part rows = quantity
    ══════════════════════════════════════════════════════ */
    function _renderLocations() {
        var $body = $('#bLocationsBody');
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        if (!saved.length) { $body.html('<div class="text-muted text-center py-5">No saved parts.</div>'); return; }
        var html = '';
        saved.forEach(function(r, i) {
            if (!r.locations) r.locations = [];
            var qty = parseInt(r.details.quantity) || 1;
            html += '<div class="card shadow-sm mb-3 b-loc-card" data-id="' + r.id + '" data-pid="' + r.id + '">'
                + '<div class="card-header py-2">'
                +   '<div class="card-title mb-0" style="font-size:13px;">'
                +     '<i class="bi bi-geo-alt me-1"></i><strong>#' + (i+1) + ' — ' + H.esc(r.catalog.text) + '</strong>'
                +     ' <span class="ms-2" style="font-weight:400;font-size:11px;">' + H.esc(r.year.text+' · '+r.make.text+' · '+r.model.text+' · '+r.variant.text) + '</span>'
                +     ' <span class="badge bg-primary-lt ms-2">Qty: ' + qty + '</span>'
                +   '</div>'
                + '</div>'
                + '<div class="card-body p-2">'
                +   '<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:12px;">'
                +     '<thead><tr>'
                +       '<th style="width:48px;">Unit</th><th>Warehouse</th><th>Zone</th><th>Shelf</th><th>Rack</th><th>Bin</th>'
                +       '<th style="width:130px;">Code</th><th style="width:120px;">Status</th><th style="width:140px;">Notes</th><th style="width:40px;"></th>'
                +     '</tr></thead>'
                +     '<tbody>' + _renderLocRows(r, qty) + '</tbody>'
                +   '</table></div>'
                + '</div>'
                + '</div>';
        });
        $body.html(html);
        // Init select2 for every row
        saved.forEach(function(r) {
            var qty = parseInt(r.details.quantity) || 1;
            for (var k = 0; k < qty; k++) _initLocRow(r, k);
        });
    }

    function _renderLocRows(r, qty) {
        var html = '';
        for (var i = 0; i < qty; i++) {
            var loc = r.locations[i] || {};
            var unitStatus = parseInt(loc.unit_status) || 1;
            html += '<tr class="b-loc-row" data-pid="' + r.id + '" data-row="' + i + '">'
                + '<td class="text-center fw-semibold">' + (i + 1) + '</td>'
                + '<td><select class="form-select form-select-sm bl-wh" style="width:100%;"></select></td>'
                + '<td><select class="form-select form-select-sm bl-zn" style="width:100%;"></select></td>'
                + '<td><select class="form-select form-select-sm bl-sh" style="width:100%;"></select></td>'
                + '<td><select class="form-select form-select-sm bl-rk" style="width:100%;"></select></td>'
                + '<td><select class="form-select form-select-sm bl-bn" style="width:100%;"></select></td>'
                + '<td><input type="text" class="form-control form-control-sm bl-code" value="' + H.esc(loc.location_code||'') + '" readonly style="background:#f8f9fa;"/></td>'
                + '<td><select class="form-select form-select-sm bl-status" disabled>'
                +   '<option value="1"' + (unitStatus===1?' selected':'') + '>Available</option>'
                +   '<option value="2"' + (unitStatus===2?' selected':'') + '>Reserved</option>'
                +   '<option value="3"' + (unitStatus===3?' selected':'') + '>Sold</option>'
                + '</select></td>'
                + '<td><input type="text" class="form-control form-control-sm bl-notes" value="' + H.esc(loc.notes||'') + '" placeholder="Notes"/></td>'
                + '<td class="text-center"><button type="button" class="btn btn-icon btn-sm btn-ghost-danger b-loc-rm" title="Delete"><i class="bi bi-trash3"></i></button></td>'
                + '</tr>';
        }
        return html;
    }

    /* Delete location row → decrement part qty (min 1), update part on server */
    $('#bLocationsBody').on('click', '.b-loc-rm', function() {
        var $row = $(this).closest('.b-loc-row');
        var $card = $(this).closest('.b-loc-card');
        var row = _rows.find(function(r) { return r.id === parseInt($card.data('id')); });
        if (!row) return;
        // Only Available units can be deleted
        var rowStatus = parseInt($row.find('.bl-status').val()) || 1;
        if (rowStatus !== 1) {
            toastr.warning('Only Available units can be deleted (this one is ' + (rowStatus === 2 ? 'Reserved' : 'Sold') + ').');
            return;
        }
        var curQty = parseInt(row.details.quantity) || 1;
        if (curQty <= 1) { toastr.warning('At least 1 quantity must remain.'); return; }

        smsConfirm({
            icon: '🗑️', title: T('btn.delete','Delete'),
            msg: 'Delete this location row? Part quantity will decrease by 1.',
            btnClass: 'btn-danger', btnText: T('btn.delete','Delete'),
            onConfirm: function() {
                // Persist current DOM into r.locations first so other rows survive
                row.locations = _collectLocsForPart(row);
                var idx = parseInt($row.data('row'));
                row.locations.splice(idx, 1);
                row.details.quantity = curQty - 1;

                // Update part qty on server
                $.ajax({
                    url: BASE_URL + '/part-inventories/' + row.savedUuid,
                    type: 'POST', contentType: 'application/json',
                    data: JSON.stringify({ quantity: row.details.quantity }),
                    success: function(resp) {
                        if (resp && (resp.status === 200 || resp.status === 201)) {
                            toastr.success('Quantity updated to ' + row.details.quantity);
                        } else toastr.error(resp && resp.message ? resp.message : 'Failed to update quantity.');
                    },
                    error: function() { toastr.error('Network error updating quantity.'); }
                });

                // Re-render this card's location grid
                $card.find('tbody').html(_renderLocRows(row, row.details.quantity));
                for (var k = 0; k < row.details.quantity; k++) _initLocRow(row, k);
                $card.find('.badge').text('Qty: ' + row.details.quantity);
            }
        });
    });

    function _initLocRow(r, rowIdx) {
        var $row = $('.b-loc-row[data-pid="' + r.id + '"][data-row="' + rowIdx + '"]');
        var loc = r.locations[rowIdx] || {};

        function s2(sel, url, ph, depFn) {
            var $s = $row.find(sel);
            $s.select2({
                placeholder: ph, allowClear: true, width: '100%', dropdownParent: $('body'),
                ajax: { url: BASE_URL + url, dataType: 'json', delay: 250,
                    data: function(p) { var d = { q: p.term||'', search: p.term||'', limit: 50 }; if (depFn) $.extend(d, depFn()); return d; },
                    processResults: function(res) { return { results: ((res&&res.data)||[]).map(function(x) { return { id: x.id, text: x.name||('#'+x.id) }; }) }; },
                    cache: false
                }, minimumInputLength: 0
            });
            return $s;
        }

        var $wh = s2('.bl-wh', '/warehouses/autocomplete', 'Warehouse');
        var $zn = s2('.bl-zn', '/warehouse-zones/autocomplete', 'Zone', function() { var v = $wh.val(); return v ? { warehouse_id: v } : {}; });
        var $sh = s2('.bl-sh', '/warehouse-shelves/autocomplete', 'Shelf', function() { var v = $zn.val(); return v ? { zone_id: v } : {}; });
        var $rk = s2('.bl-rk', '/warehouse-racks/autocomplete', 'Rack', function() { var v = $sh.val(); return v ? { shelf_id: v } : {}; });
        var $bn = s2('.bl-bn', '/warehouse-bins/autocomplete', 'Bin', function() { var v = $rk.val(); return v ? { rack_id: v } : {}; });

        function preset($s, id, name) {
            if (id && name) { $s.append(new Option(name, id, true, true)).trigger('change.select2'); }
        }
        preset($wh, loc.warehouse_id,                                loc.warehouse_name);
        preset($zn, loc.warehouse_zone_id  || loc.zone_id,           loc.warehouse_zone_name  || loc.zone_name);
        preset($sh, loc.warehouse_shelf_id || loc.shelf_id,          loc.warehouse_shelf_name || loc.shelf_name);
        preset($rk, loc.warehouse_rack_id  || loc.rack_id,           loc.warehouse_rack_name  || loc.rack_name);
        preset($bn, loc.warehouse_bin_id   || loc.bin_id,            loc.warehouse_bin_name   || loc.bin_name);

        function updCode() {
            var parts = [];
            [$wh, $zn, $sh, $rk, $bn].forEach(function($s) {
                var t = ($s.find(':selected').text() || '').trim();
                if (t && t.indexOf('--') === -1) parts.push(t);
            });
            $row.find('.bl-code').val(parts.join('-'));
        }

        $wh.on('change', function() { $zn.val(null).trigger('change.select2'); $sh.val(null).trigger('change.select2'); $rk.val(null).trigger('change.select2'); $bn.val(null).trigger('change.select2'); updCode(); });
        $zn.on('change', function() { $sh.val(null).trigger('change.select2'); $rk.val(null).trigger('change.select2'); $bn.val(null).trigger('change.select2'); updCode(); });
        $sh.on('change', function() { $rk.val(null).trigger('change.select2'); $bn.val(null).trigger('change.select2'); updCode(); });
        $rk.on('change', function() { $bn.val(null).trigger('change.select2'); updCode(); });
        $bn.on('change', updCode);
    }

    function _collectLocsForPart(r) {
        var rows = [];
        $('.b-loc-row[data-pid="' + r.id + '"]').each(function() {
            var $row = $(this);
            var i = parseInt($row.data('row'));
            rows.push({
                unit_number:        i + 1,
                warehouse_id:       $row.find('.bl-wh').val() || null,
                warehouse_zone_id:  $row.find('.bl-zn').val() || null,
                warehouse_shelf_id: $row.find('.bl-sh').val() || null,
                warehouse_rack_id:  $row.find('.bl-rk').val() || null,
                warehouse_bin_id:   $row.find('.bl-bn').val() || null,
                location_code:      $row.find('.bl-code').val() || null,
                unit_status:        parseInt($row.find('.bl-status').val()) || 1,
                notes:              $row.find('.bl-notes').val() || null
            });
        });
        return rows;
    }

    /* Save All Locations */
    $('#btnSaveAllLocs').on('click', function() {
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        // Collect & filter parts that have at least one row with a warehouse picked
        var queue = [];
        saved.forEach(function(r) {
            var locs = _collectLocsForPart(r);
            // Skip if no warehouse picked anywhere
            if (locs.some(function(l) { return l.warehouse_id; })) {
                r._locsToSave = locs;
                queue.push(r);
            }
        });
        if (!queue.length) { toastr.warning('Please assign at least one warehouse before saving.'); return; }

        var $btn = $(this); btnLoading($btn);
        var ok = 0, fail = 0;
        function next() {
            if (!queue.length) {
                btnReset($btn);
                if (fail === 0) toastr.success('Locations saved for ' + ok + ' part(s).');
                else toastr.warning(ok + ' saved, ' + fail + ' failed.');
                return;
            }
            var r = queue.shift();
            $.ajax({
                url: BASE_URL + '/part-inventories/' + r.savedUuid + '/locations/bulk',
                type: 'POST', contentType: 'application/json',
                data: JSON.stringify({ locations: r._locsToSave }),
                success: function(resp) {
                    if (resp && (resp.status === 200 || resp.status === 201)) ok++; else fail++;
                    next();
                },
                error: function() { fail++; next(); }
            });
        }
        next();
    });

    /* Save All References — loop bulk per part */
    $('#btnSaveAllRefs').on('click', function() {
        // Sync DOM → state
        var saved = _rows.filter(function(r) { return r.savedUuid; });
        for (var i = 0; i < saved.length; i++) {
            var $card = $('.b-ref-card[data-id="' + saved[i].id + '"]');
            saved[i].references = _collectRefs($card);
        }

        // Per-row validation: if a row exists, code+condition+reference_type all required; codes unique within part
        for (var i2 = 0; i2 < saved.length; i2++) {
            var refs = saved[i2].references;
            var seenCodes = {};
            for (var j = 0; j < refs.length; j++) {
                var rf = refs[j];
                var code = (rf.reference_code || '').trim();
                if (!code) { toastr.error('Part #' + (i2+1) + ' row ' + (j+1) + ': Reference code required.'); return; }
                if (!rf.condition) { toastr.error('Part #' + (i2+1) + ' row ' + (j+1) + ': Condition required.'); return; }
                if (!rf.reference_type) { toastr.error('Part #' + (i2+1) + ' row ' + (j+1) + ': Reference type required.'); return; }
                var key = code.toLowerCase();
                if (seenCodes[key]) { toastr.error('Part #' + (i2+1) + ': Duplicate reference code "' + code + '". Codes must be unique within a part.'); return; }
                seenCodes[key] = true;
            }
        }

        // Only save parts that actually have references
        var queue = saved.filter(function(r) { return r.references && r.references.length > 0; });
        if (!queue.length) { toastr.warning('Please add at least one reference to any part before saving.'); return; }

        var $btn = $(this); btnLoading($btn);
        var ok = 0, fail = 0;

        function next() {
            if (!queue.length) {
                btnReset($btn);
                if (fail === 0) toastr.success('References saved for ' + ok + ' part(s).');
                else toastr.warning(ok + ' saved, ' + fail + ' failed.');
                return;
            }
            var r = queue.shift();
            $.ajax({
                url: BASE_URL + '/part-inventories/' + r.savedUuid + '/references/bulk',
                type: 'POST', contentType: 'application/json',
                data: JSON.stringify({ references: r.references }),
                success: function(resp) {
                    if (resp && (resp.status === 200 || resp.status === 201)) ok++; else fail++;
                    next();
                },
                error: function() { fail++; next(); }
            });
        }
        next();
    });

    /* ══════════════════════════════════════════════════════
       EDIT MODE BOOTSTRAP — runs LAST so all helpers/vars are defined
    ══════════════════════════════════════════════════════ */
    if (IS_EDIT && _rows.length) {
        var er = _rows[0];
        function _pre($id, picked) {
            var $s = $($id); if (!$s.length || !picked || !picked.id) return;
            $s.append(new Option(picked.text || '', picked.id, true, true)).trigger('change');
        }
        if (IS_FROM_VEHICLE) {
            _pre('#bVehicle', { id: er.vehicleId, text: er.vehicleLabel });
            _pre('#bCatalog', er.catalog);
        } else {
            _pre('#bYear',    er.year);
            _pre('#bType',    er.type);
            _pre('#bMake',    er.make);
            _pre('#bModel',   er.model);
            _pre('#bVariant', er.variant);
            _pre('#bCatalog', er.catalog);
        }
        $('#btnBatchAdd').hide();
        $('#bRows').closest('.card').hide();
        $('#btnBatchNext').replaceWith('<button type="button" class="btn btn-primary" id="btnEditSaveSelection"><i class="bi bi-floppy me-1"></i>Save Selection</button> <button type="button" class="btn btn-outline-primary ms-2 b-tab-next" data-target="#tab-bDetails">Next <i class="bi bi-chevron-right ms-1"></i></button>');
        $('#btnBatchSaveAll').html('<i class="bi bi-floppy me-1"></i>Update Part').prop('disabled', false);
        _unlockSavedTabs();
        _renderDetails();
        _renderRefs();
        _renderDamages();
        _renderAttrs();
        _renderImages();
        _renderVideos();
        _renderLocations();

        // Deep-link: open the tab from URL hash (#tab-bDetails / #tab-bRefs / etc.)
        if (window.location.hash) {
            var $hashTab = $(window.location.hash);
            if ($hashTab.length && $hashTab.is('button.nav-link')) {
                setTimeout(function() { $hashTab.tab('show'); window.scrollTo({ top: 0 }); }, 100);
            }
        }
    }
});
