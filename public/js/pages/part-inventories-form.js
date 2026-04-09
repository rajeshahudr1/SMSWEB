/* part-inventories-form.js — 8-tab form (Vehicle Info, Part Info, References, Damages, Attributes, Images, Videos, Locations) */
'use strict';
var T=function(k,f){return (typeof SMS_T==='function')?SMS_T(k,f):(f||k);};

$(function() {
    var FD = window._FORM_DATA || {};
    // Add (batch) mode is handled by part-inventories-batch.js
    if (!FD.isEdit) return;
    var T  = function(k, f) { return typeof SMS_T === 'function' ? SMS_T(k, f) : (f || k); };

    /* ══════════════════════════════════════════════════════
       AUTO COLLAPSIBLE SECTIONS — convert all .section-card to collapse
    ══════════════════════════════════════════════════════ */
    $('.section-card').each(function(i) {
        var $card = $(this);
        var $header = $card.find('.card-header').first();
        var $body = $card.find('.card-body').first();
        var colId = 'secCollapse_' + i;
        $body.wrap('<div class="collapse show" id="' + colId + '"></div>');
        $header.attr({ 'data-bs-toggle': 'collapse', 'data-bs-target': '#' + colId, 'aria-expanded': 'true' });
        $header.find('.card-title').append(' <i class="bi bi-chevron-down collapse-arrow ms-auto"></i>');
    });

    /* Expand All / Collapse All buttons */
    $('.tab-pane').each(function() {
        var $pane = $(this);
        var cards = $pane.find('.section-card');
        if (cards.length < 2) return;
        var $btns = $('<div class="d-flex gap-2 mb-2"><button class="btn btn-sm btn-outline-primary sms-expand-all"><i class="bi bi-arrows-expand me-1"></i>' + T('general.expand_all','Expand All') + '</button><button class="btn btn-sm btn-outline-primary sms-collapse-all"><i class="bi bi-arrows-collapse me-1"></i>' + T('general.collapse_all','Collapse All') + '</button></div>');
        $pane.prepend($btns);
    });
    $(document).on('click', '.sms-expand-all', function() {
        $(this).closest('.tab-pane').find('.collapse').collapse('show');
        $(this).closest('.tab-pane').find('.card-header').removeClass('collapsed');
    });
    $(document).on('click', '.sms-collapse-all', function() {
        $(this).closest('.tab-pane').find('.collapse').collapse('hide');
        $(this).closest('.tab-pane').find('.card-header').addClass('collapsed');
    });

    /* Tab navigation (Next/Prev) */
    $(document).on('click', '.sms-tab-next', function() {
        var target = $(this).data('target');
        if (target) { $(target).tab('show'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    $(document).on('click', '.sms-tab-prev', function() {
        var target = $(this).data('target');
        if (target) { $(target).tab('show'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });

    /* Tab locking: prevent clicks on disabled tabs */
    $('.nav-link.disabled').on('click', function(e) { e.preventDefault(); e.stopPropagation(); });

    /* Enum maps */
    var INV_STATUS  = {1:'Available', 2:'Reserved', 3:'Sold', 4:'Returned', 5:'Scrapped'};
    var CONDITION   = {1:'OEM', 2:'Aftermarket'};
    var PART_STATE  = {1:'New', 2:'Used', 3:'Remanufactured', 4:'Not Working'};
    var UNIT_STATUS = {1:'Available', 2:'Reserved', 3:'Sold'};

    /* ══════════════════════════════════════════════════════
       SELECT2 AJAX AUTOCOMPLETE — with dependent cascading
    ══════════════════════════════════════════════════════ */
    var _autoFilling = false;

    function _s2(sel, url, ph, existing, extraDataFn, processResultsFn) {
        $(sel).select2({
            placeholder: ph, allowClear: true, width: '100%',
            ajax: { url: BASE_URL + url, dataType: 'json', delay: 300,
                data: function(p) { var d = { q: p.term || '', limit: 50 }; if (extraDataFn) $.extend(d, extraDataFn()); return d; },
                processResults: processResultsFn || function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name || r.year || r.manufacturer_engine || '' }; }) }; },
                cache: false
            }, minimumInputLength: 0
        });
        if (existing && existing.id) {
            if (!$(sel).find('option[value="' + existing.id + '"]').length) $(sel).append(new Option(existing.text, existing.id, true, true));
            $(sel).trigger('change');
        }
    }

    function _setS2(sel, id, text) {
        if (!id || !text) return;
        if ($(sel).find('option[value="' + id + '"]').length === 0) $(sel).append(new Option(text, id, true, true));
        else $(sel).val(id);
        $(sel).trigger('change');
    }

    /* ══════════════════════════════════════════════════════
       TAB 1: VEHICLE INFO — Vehicle Inventory Select + Cascade
    ══════════════════════════════════════════════════════ */

    /* Vehicle Inventory Select2 (for add-from-vehicle mode) */
    _s2('#selVehicleInventory', '/vehicle-inventories/autocomplete', T('part_inventories.search_vehicle_inventory','Search Vehicle Inventory...'), FD.vehicleInventory, null, function(res) {
        return { results: (res.data||[]).map(function(r) {
            return { id: r.id || r.uuid, text: (r.vehicle_internal_id ? '#' + r.vehicle_internal_id + ' ' : '') + (r.registration_plate_no || r.name || r.vehicle_model_name || '') };
        }) };
    });

    // When Vehicle Inventory selected, fetch its data and fill all vehicle fields
    $('#selVehicleInventory').on('select2:select', function(e) {
        var d = e.params.data; if (!d) return;
        var viId = d.id;
        $.get(BASE_URL + '/vehicle-inventories/' + viId + '/view-data', function(res) {
            if (!res || res.status !== 200) return;
            var vi = res.data || {};
            _autoFilling = true;

            if (vi.vehicle_type_id && vi.vehicle_type_name) _setS2('#selVehicleType', vi.vehicle_type_id, vi.vehicle_type_name);
            setTimeout(function() {
                if (vi.vehicle_make_id && vi.vehicle_make_name) _setS2('#selVehicleMake', vi.vehicle_make_id, vi.vehicle_make_name);
                setTimeout(function() {
                    if (vi.vehicle_model_id && vi.vehicle_model_name) _setS2('#selVehicleModel', vi.vehicle_model_id, vi.vehicle_model_name);
                    setTimeout(function() {
                        if (vi.vehicle_variant_id && vi.vehicle_variant_name) _setS2('#selVehicleVariant', vi.vehicle_variant_id, vi.vehicle_variant_name);
                        setTimeout(function() {
                            if (vi.vehicle_engine_id && vi.vehicle_engine_name) _setS2('#selVehicleEngine', vi.vehicle_engine_id, vi.vehicle_engine_name);
                            if (vi.vehicle_year_id && vi.vehicle_year_name) _setS2('#selVehicleYear', vi.vehicle_year_id, vi.vehicle_year_name);
                            if (vi.vehicle_fuel_id && vi.vehicle_fuel_name) _setS2('#selVehicleFuel', vi.vehicle_fuel_id, vi.vehicle_fuel_name);

                            // Pre-fill engine/performance text fields
                            if (vi.motorization) $('#fMotorization').val(vi.motorization);
                            if (vi.ccm3) $('#fCC').val(vi.ccm3);
                            if (vi.hp) $('#fCV').val(vi.hp);
                            if (vi.power_kw) $('#fKW').val(vi.power_kw);

                            _autoFilling = false;
                            toastr.info(T('part_inventories.vehicle_prefilled', 'Vehicle info auto-filled from vehicle inventory.'));
                        }, 50);
                    }, 50);
                }, 50);
            }, 50);
        });
    });

    /* Show vehicle inventory selector if adding from vehicle (URL has vehicle_id) */
    if (FD.vehicleId && !FD.isEdit) {
        $('#sectionVehicleInventorySelect').show();
        $.get(BASE_URL + '/vehicle-inventories/' + FD.vehicleId + '/view-data', function(res) {
            if (!res || res.status !== 200) return;
            var vi = res.data || {};
            var label = (vi.vehicle_internal_id ? '#' + vi.vehicle_internal_id + ' ' : '') + (vi.registration_plate_no || vi.vehicle_model_name || '');
            _setS2('#selVehicleInventory', vi.uuid || vi.id || FD.vehicleId, label);
            $('#selVehicleInventory').trigger({ type: 'select2:select', params: { data: { id: vi.uuid || vi.id || FD.vehicleId } } });
        });
    }

    /* EDIT mode B: part was originally added from a vehicle. Show selector,
       run duplicate check on vehicle/catalog change. */
    var IS_EDIT_FROM_VEHICLE = FD.isEdit && FD.vehicleInventory && FD.vehicleInventory.id;
    if (IS_EDIT_FROM_VEHICLE) {
        $('#sectionVehicleInventorySelect').show();
    }

    function _checkPartDuplicate(cb) {
        var viId = $('#selVehicleInventory').val();
        var pcId = $('#selPartCatalog').val();
        if (!viId || !pcId) { cb(false); return; }
        $.get(BASE_URL + '/part-inventories/check-duplicate', {
            vehicle_inventory_id: viId, part_catalog_id: pcId, exclude_uuid: FD.uuid || ''
        }, function(res) {
            cb(res && res.status === 200 && res.data && res.data.exists, res && res.data && res.data.part);
        }).fail(function() { cb(false); });
    }

    /* Live duplicate check on vehicle change in edit-from-vehicle mode */
    if (IS_EDIT_FROM_VEHICLE) {
        $('#selVehicleInventory').on('change', function() {
            _checkPartDuplicate(function(dupe, part) {
                if (dupe) {
                    toastr.error('This vehicle already has a part with this catalog' + (part && part.part_code ? ' (#' + part.part_code + ')' : '') + '. Reverting.');
                    // Revert to original
                    var orig = FD.vehicleInventory;
                    if (orig && orig.id) _setS2('#selVehicleInventory', orig.id, orig.text || '');
                }
            });
        });
        $('#selPartCatalog').on('change', function() {
            _checkPartDuplicate(function(dupe, part) {
                if (dupe) {
                    toastr.error('This catalog is already linked to this vehicle' + (part && part.part_code ? ' (#' + part.part_code + ')' : '') + '. Pick a different one.');
                    var orig = FD.partCatalog;
                    if (orig && orig.id) _setS2('#selPartCatalog', orig.id, orig.text || '');
                }
            });
        });
    }

    /* Vehicle cascade: Independent dropdowns */
    _s2('#selVehicleType', '/vehicle-types/autocomplete', T('part_inventories.search_type','Search Type...'), FD.vehicleType);
    _s2('#selVehicleYear', '/vehicle-years/autocomplete', T('part_inventories.search_year','Search Year...'), FD.vehicleYear);
    _s2('#selVehicleFuel', '/vehicle-fuels/autocomplete', T('part_inventories.search_fuel','Search Fuel...'), FD.vehicleFuel);

    // Dependent: Make filtered by Type
    _s2('#selVehicleMake', '/vehicle-makes/autocomplete', T('part_inventories.search_make','Search Make...'), FD.vehicleMake, function() {
        var tid = $('#selVehicleType').val(); return tid ? { vehicle_type_id: tid } : {};
    }, function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name, vehicle_type_id: r.vehicle_type_id, vehicle_type_name: r.vehicle_type_name }; }) }; });

    // Dependent: Model filtered by Make (+ Type)
    _s2('#selVehicleModel', '/vehicle-models/autocomplete', T('part_inventories.search_model','Search Model...'), FD.vehicleModel, function() {
        var d = {};
        var tid = $('#selVehicleType').val(); if (tid) d.vehicle_type_id = tid;
        var mid = $('#selVehicleMake').val(); if (mid) d.vehicle_make_id = mid;
        return d;
    }, function(res) { return { results: (res.data||[]).map(function(r) {
        return { id: r.id, text: r.name + (r.vehicle_make_name ? ' — ' + r.vehicle_make_name : ''),
            vehicle_type_id: r.vehicle_type_id, vehicle_type_name: r.vehicle_type_name,
            vehicle_make_id: r.vehicle_make_id, vehicle_make_name: r.vehicle_make_name,
            vehicle_year_id: r.vehicle_year_id, vehicle_year_name: r.vehicle_year_name };
    }) }; });

    // Dependent: Variant filtered by Model
    _s2('#selVehicleVariant', '/vehicle-variants/autocomplete', T('part_inventories.search_variant','Search Variant...'), FD.vehicleVariant, function() {
        var d = {};
        var mid = $('#selVehicleModel').val(); if (mid) d.vehicle_model_id = mid;
        return d;
    }, function(res) { return { results: (res.data||[]).map(function(r) {
        return { id: r.id, text: r.name,
            vehicle_model_id: r.vehicle_model_id, vehicle_model_name: r.vehicle_model_name,
            vehicle_make_id: r.vehicle_make_id, vehicle_make_name: r.vehicle_make_name,
            vehicle_type_id: r.vehicle_type_id, vehicle_type_name: r.vehicle_type_name,
            vehicle_year_id: r.vehicle_year_id, vehicle_year_name: r.vehicle_year_name };
    }) }; });

    // Dependent: Engine filtered by Variant
    _s2('#selVehicleEngine', '/vehicle-engines/autocomplete', T('part_inventories.search_engine','Search Engine...'), FD.vehicleEngine, function() {
        var d = {};
        var vid = $('#selVehicleVariant').val(); if (vid) d.vehicle_variant_id = vid;
        return d;
    });

    /* Forward cascade: clear children when parent changes */
    $('#selVehicleType').on('change', function() { if (!_autoFilling) { $('#selVehicleMake').val(null).trigger('change.select2'); $('#selVehicleModel').val(null).trigger('change.select2'); $('#selVehicleVariant').val(null).trigger('change.select2'); $('#selVehicleEngine').val(null).trigger('change.select2'); } });
    $('#selVehicleMake').on('change', function() { if (!_autoFilling) { $('#selVehicleModel').val(null).trigger('change.select2'); $('#selVehicleVariant').val(null).trigger('change.select2'); $('#selVehicleEngine').val(null).trigger('change.select2'); } });
    $('#selVehicleModel').on('change', function() { if (!_autoFilling) { $('#selVehicleVariant').val(null).trigger('change.select2'); $('#selVehicleEngine').val(null).trigger('change.select2'); } });
    $('#selVehicleVariant').on('change', function() { if (!_autoFilling) { $('#selVehicleEngine').val(null).trigger('change.select2'); } });

    /* Reverse auto-fill: selecting child fills parent */
    $('#selVehicleMake').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        if (d.vehicle_type_id && d.vehicle_type_name) { _autoFilling = true; _setS2('#selVehicleType', d.vehicle_type_id, d.vehicle_type_name); setTimeout(function() { _autoFilling = false; }, 100); }
    });

    $('#selVehicleModel').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        _autoFilling = true;
        if (d.vehicle_type_id && d.vehicle_type_name) _setS2('#selVehicleType', d.vehicle_type_id, d.vehicle_type_name);
        setTimeout(function() {
            if (d.vehicle_make_id && d.vehicle_make_name) _setS2('#selVehicleMake', d.vehicle_make_id, d.vehicle_make_name);
            setTimeout(function() {
                if (d.vehicle_year_id && d.vehicle_year_name) _setS2('#selVehicleYear', d.vehicle_year_id, d.vehicle_year_name);
                _autoFilling = false;
                toastr.info(T('part_inventories.auto_filled', 'Type, Make & Year auto-filled from Model'));
            }, 50);
        }, 50);
    });

    $('#selVehicleVariant').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        _autoFilling = true;
        if (d.vehicle_type_id && d.vehicle_type_name) _setS2('#selVehicleType', d.vehicle_type_id, d.vehicle_type_name);
        setTimeout(function() {
            if (d.vehicle_make_id && d.vehicle_make_name) _setS2('#selVehicleMake', d.vehicle_make_id, d.vehicle_make_name);
            setTimeout(function() {
                if (d.vehicle_model_id && d.vehicle_model_name) _setS2('#selVehicleModel', d.vehicle_model_id, d.vehicle_model_name);
                setTimeout(function() {
                    if (d.vehicle_year_id && d.vehicle_year_name) _setS2('#selVehicleYear', d.vehicle_year_id, d.vehicle_year_name);
                    _autoFilling = false;
                    toastr.info(T('part_inventories.auto_filled_variant', 'Type, Make, Model & Year auto-filled from Variant'));
                }, 50);
            }, 50);
        }, 50);
    });

    /* ══════════════════════════════════════════════════════
       TAB 2: PART INFO — Catalog, Brand, Type, toggles
    ══════════════════════════════════════════════════════ */

    /* Part Catalog (autocomplete with auto-fill) */
    _s2('#selPartCatalog', '/part-catalogs/autocomplete', T('part_inventories.search_catalog','Search Part Catalog...'), FD.partCatalog, null, function(res) {
        return { results: (res.data||[]).map(function(r) {
            return { id: r.id, text: r.part_name || r.name || '',
                part_type_id: r.part_type_id, part_type_name: r.part_type_name,
                part_brand_id: r.part_brand_id, part_brand_name: r.part_brand_name };
        }) };
    });

    // When Part Catalog selected, auto-fill part_brand
    $('#selPartCatalog').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        _autoFilling = true;
        if (d.part_brand_id && d.part_brand_name) _setS2('#selPartBrand', d.part_brand_id, d.part_brand_name);
        setTimeout(function() {
            _autoFilling = false;
            toastr.info(T('part_inventories.auto_filled_catalog', 'Brand auto-filled from Catalog'));
        }, 100);
    });

    /* Part Brand */
    _s2('#selPartBrand', '/part-brands/autocomplete', T('part_inventories.search_brand','Search Part Brand...'), FD.partBrand);

    /* Star Rating widget */
    (function() {
        var $w = $('#fRatingStars'); if (!$w.length) return;
        function paint(v) {
            $w.find('.sms-star').each(function() {
                var sv = parseInt($(this).data('v'));
                $(this).toggleClass('active bi-star-fill', sv <= v).toggleClass('bi-star', sv > v);
            });
        }
        var initV = parseInt($w.data('value')) || 0;
        $('#fRating').val(initV ? initV : '');
        paint(initV);
        $w.on('mouseenter', '.sms-star', function() { paint(parseInt($(this).data('v'))); });
        $w.on('mouseleave', function() { paint(parseInt($('#fRating').val()) || 0); });
        $w.on('click', '.sms-star', function() {
            var v = parseInt($(this).data('v'));
            $('#fRating').val(v); $w.data('value', v); paint(v);
        });
        $w.on('click', '.sms-star-clear', function() {
            $('#fRating').val(''); $w.data('value', 0); paint(0);
        });
    })();

    /* Custom Size toggle */
    $('#fCustomSize').on('change', function() {
        if ($(this).is(':checked')) {
            $('#customSizeFields').slideDown(200);
        } else {
            $('#customSizeFields').slideUp(200);
        }
    });

    /* ══════════════════════════════════════════════════════
       FORM SUBMIT — per-tab save via AJAX (JSON)
    ══════════════════════════════════════════════════════ */
    function _saveTab(btnSelector, collectFn, successMsg) {
        var $btn = $(btnSelector);
        var data = collectFn();
        if (data === false) return; // validation failed

        // Block save if we're in edit-from-vehicle mode and (vehicle, catalog) is a duplicate
        if (FD.isEdit && FD.vehicleInventory && FD.vehicleInventory.id && $('#selVehicleInventory').val() && $('#selPartCatalog').val()) {
            // Synchronous-style guard via async toast — collect already returned data, run a quick check
            // and abort save if the API says duplicate. Done in callback to keep things simple.
            var viId = $('#selVehicleInventory').val();
            var pcId = $('#selPartCatalog').val();
            $.ajax({ url: BASE_URL + '/part-inventories/check-duplicate', data: { vehicle_inventory_id: viId, part_catalog_id: pcId, exclude_uuid: FD.uuid || '' }, async: false, success: function(res) {
                if (res && res.status === 200 && res.data && res.data.exists) {
                    toastr.error('This vehicle already has a part with this catalog. Cannot save.');
                    data = false;
                }
            }});
            if (data === false) return;
        }

        // Add status on edit
        if (FD.isEdit) data.status = $('select[name="status"]').val() || '1';

        // Add company for super admin (mandatory)
        if ($('#selCompany').length) {
            var cid = $('#selCompany').val();
            if (!cid) {
                toastr.error(T('part_inventories.company_required', 'Company is required.'));
                $('#selCompany').focus();
                return;
            }
            data.company_id = cid;
        }

        var formAction = $('#frmPartInventory').attr('action');
        btnLoading($btn);
        $.ajax({
            url: BASE_URL + formAction, type: 'POST', contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(r) {
                btnReset($btn);
                if (r.status === 200 || r.status === 201) {
                    toastr.success(r.message || successMsg || T('msg.saved','Saved.'));
                    if (!FD.isEdit && r.data && r.data.uuid) {
                        // First save - redirect to edit page (unlocks all tabs)
                        setTimeout(function() { window.location = BASE_URL + '/part-inventories/' + r.data.uuid + '/edit'; }, 600);
                    }
                } else toastr.error(r.message || T('general.error','Error.'));
            },
            error: function(xhr) { btnReset($btn); toastr.error(xhr.responseJSON ? xhr.responseJSON.message : T('general.network_error','Network error.')); }
        });
    }

    /* Tab 1: Vehicle Info — collect + validate */
    function _collectTab1() {
        var reqMap = [
            ['#selVehicleYear', 'Vehicle Year'],
            ['#selVehicleVariant', 'Vehicle Variant'],
            ['#selVehicleModel', 'Vehicle Model'],
            ['#selVehicleMake', 'Vehicle Make'],
            ['#selVehicleType', 'Vehicle Type']
        ];
        for (var i = 0; i < reqMap.length; i++) {
            if (!$(reqMap[i][0]).val()) {
                toastr.error(reqMap[i][1] + ' is required.');
                $(reqMap[i][0]).select2('open');
                return false;
            }
        }
        return {
            vehicle_inventory_id: $('#selVehicleInventory').val()||'',
            vehicle_type_id: $('#selVehicleType').val()||'',
            vehicle_year_id: $('#selVehicleYear').val()||'',
            vehicle_make_id: $('#selVehicleMake').val()||'',
            vehicle_model_id: $('#selVehicleModel').val()||'',
            vehicle_variant_id: $('#selVehicleVariant').val()||'',
            vehicle_engine_id: $('#selVehicleEngine').val()||'',
            vehicle_fuel_id: $('#selVehicleFuel').val()||'',
            motorization: $('#fMotorization').val()||'',
            cc: $('#fCC').val()||'',
            cv: $('#fCV').val()||'',
            kw: $('#fKW').val()||''
        };
    }

    /* Tab 2: Part Info — collect + validate */
    function _collectTab2() {
        if (!$('#selPartCatalog').val()) { toastr.error(T('part_inventories.part_catalog_required', 'Part Catalog is required.')); $('#selPartCatalog').select2('open'); return false; }
        var qty = parseInt($('#fQuantity').val());
        if (!qty || qty < 1) { toastr.error(T('part_inventories.quantity_required', 'Quantity must be at least 1.')); $('#fQuantity').focus(); return false; }
        var rating = parseInt($('#fRating').val());
        if ($('#fRating').val() !== '' && (rating < 0 || rating > 5)) { toastr.error(T('part_inventories.rating_range', 'Rating must be between 0 and 5.')); return false; }
        return {
            part_catalog_id: $('#selPartCatalog').val()||'',
            quantity: qty,
            part_brand_id: $('#selPartBrand').val()||'',
            inventory_status: $('#selInventoryStatus').val()||'',
            price_1: $('#fPrice1').val()||'',
            price_2: $('#fPrice2').val()||'',
            cost_price: $('#fCostPrice').val()||'',
            condition: $('input[name="condition"]:checked').val()||'',
            part_state: $('input[name="part_state"]:checked').val()||'',
            print_label: $('#fPrintLabel').is(':checked') ? 1 : 0,
            vat_included: $('#fVatIncluded').is(':checked') ? 1 : 0,
            custom_size: $('#fCustomSize').is(':checked') ? 1 : 0,
            weight: $('#fWeight').val()||'',
            width: $('#fWidth').val()||'',
            height: $('#fHeight').val()||'',
            length: $('#fLength').val()||'',
            reg_number_dismantler: $('#fRegNumberDismantler').val()||'',
            rating: $('#fRating').val()||'',
            notes: $('#fNotes').val()||'',
            extra_notes: $('#fExtraNotes').val()||'',
            internal_notes: $('#fInternalNotes').val()||''
        };
    }

    /* Button handlers */
    // Prevent form submit (each tab saves independently)
    $('#frmPartInventory').on('submit', function(e) { e.preventDefault(); });

    // Tab 1 save
    $(document).on('click', '#btnSubmitTab1', function(e) { e.preventDefault(); _saveTab('#btnSubmitTab1', _collectTab1, T('part_inventories.vehicle_info_saved','Vehicle info saved.')); });
    // Tab 2 save
    $(document).on('click', '#btnSubmitTab2', function(e) { e.preventDefault(); _saveTab('#btnSubmitTab2', _collectTab2, T('part_inventories.part_info_saved','Part info saved.')); });

    /* ══════════════════════════════════════════════════════
       LOAD SETTINGS (max sizes/counts from company settings)
    ══════════════════════════════════════════════════════ */
    var _maxImgSize = 5, _maxVidSize = 50, _maxImgCount = 20, _maxVidCount = 10;
    if (FD.isEdit) {
        $.get(BASE_URL + '/part-inventories/settings', function(res) {
            if (res && res.status === 200 && res.data) {
                _maxImgSize = res.data.max_image_size || 5;
                _maxVidSize = res.data.max_video_size || 50;
                _maxImgCount = res.data.max_image_count || 20;
                _maxVidCount = res.data.max_video_count || 10;
            }
        });
    }

    /* ══════════════════════════════════════════════════════
       TAB 3: REFERENCES — Dynamic table with bulk save (Edit only)
    ══════════════════════════════════════════════════════ */
    if (FD.isEdit) {
        var _references = FD.references || [];
        renderReferences();

        function renderReferences() {
            var $body = $('#referenceTableBody');
            if (!$body.length) return;
            $('#referenceCount').text(_references.length);

            if (!_references.length) {
                $body.html('<tr><td colspan="6" class="text-muted text-center py-3">' + T('part_inventories.no_references', 'No references added yet. Click "Add Reference" to begin.') + '</td></tr>');
                return;
            }

            var html = '';
            _references.forEach(function(ref, idx) {
                var refId = ref.id || ref.reference_id || '';
                var refCode = ref.reference_code || '';
                var refCondition = parseInt(ref.condition) || '';
                var refType = parseInt(ref.reference_type) || '';
                var refBrand = ref.brand || '';
                var refManufacturer = ref.manufacturer || '';
                html += '<tr class="ref-row" data-idx="' + idx + '" data-id="' + refId + '">' +
                    '<td><input type="text" class="form-control form-control-sm ref-code" value="' + H.esc(refCode) + '" placeholder="' + T('part_inventories.reference_code','Reference Code') + '"/></td>' +
                    '<td><select class="form-select form-select-sm ref-condition">' +
                    '<option value="">-- ' + T('general.select','Select') + ' --</option>' +
                    '<option value="1"' + (refCondition === 1 ? ' selected' : '') + '>' + T('part_inventories.oem','OEM') + '</option>' +
                    '<option value="2"' + (refCondition === 2 ? ' selected' : '') + '>' + T('part_inventories.aftermarket','Aftermarket') + '</option>' +
                    '</select></td>' +
                    '<td><select class="form-select form-select-sm ref-type">' +
                    '<option value="">-- ' + T('general.select','Select') + ' --</option>' +
                    '<option value="1"' + (refType === 1 ? ' selected' : '') + '>' + T('part_inventories.compatible','Compatible') + '</option>' +
                    '<option value="2"' + (refType === 2 ? ' selected' : '') + '>' + T('part_inventories.written_on_label','Written on Label') + '</option>' +
                    '</select></td>' +
                    '<td><input type="text" class="form-control form-control-sm ref-brand" value="' + H.esc(refBrand) + '" placeholder="' + T('part_inventories.ref_brand','Brand') + '"/></td>' +
                    '<td><input type="text" class="form-control form-control-sm ref-manufacturer" value="' + H.esc(refManufacturer) + '" placeholder="' + T('part_inventories.ref_manufacturer','Manufacturer') + '"/></td>' +
                    '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger btn-delete-ref" data-idx="' + idx + '" style="width:28px;height:28px;padding:0;"><i class="bi bi-trash3"></i></button></td>' +
                    '</tr>';
            });
            $body.html(html);
        }

        /* Add Reference row */
        $(document).on('click', '#btnAddReference', function() {
            _references.push({ reference_code: '', condition: '', reference_type: '', brand: '', manufacturer: '' });
            renderReferences();
            // Focus the new row code input
            $('#referenceTableBody tr:last .ref-code').focus();
        });

        /* Delete Reference row */
        $(document).on('click', '.btn-delete-ref', function() {
            var idx = parseInt($(this).data('idx'));
            _references.splice(idx, 1);
            renderReferences();
        });

        /* Collect reference data from DOM before saving */
        function _collectReferencesFromDom() {
            var rows = [];
            $('#referenceTableBody tr.ref-row').each(function() {
                var $row = $(this);
                rows.push({
                    id: $row.data('id') || '',
                    reference_code: $row.find('.ref-code').val() || '',
                    condition: $row.find('.ref-condition').val() || '',
                    reference_type: $row.find('.ref-type').val() || '',
                    brand: $row.find('.ref-brand').val() || '',
                    manufacturer: $row.find('.ref-manufacturer').val() || ''
                });
            });
            return rows;
        }

        /* Save References — bulk */
        $(document).on('click', '#btnSaveReferences', function(e) {
            e.preventDefault();
            var rows = _collectReferencesFromDom();
            // Validate: at least code for each row
            for (var i = 0; i < rows.length; i++) {
                if (!rows[i].reference_code.trim()) {
                    toastr.error(T('part_inventories.ref_code_required', 'Reference code is required for row ') + (i + 1));
                    return;
                }
            }

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/part-inventories/' + FD.uuid + '/references/bulk',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ references: rows }),
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('part_inventories.references_saved', 'References saved.'));
                        if (Array.isArray(r.data)) { _references = r.data; }
                        renderReferences();
                    } else {
                        toastr.error(r.message || T('general.error', 'Error.'));
                    }
                },
                error: function(xhr) {
                    btnReset($btn);
                    toastr.error(xhr.responseJSON ? xhr.responseJSON.message : T('general.network_error', 'Network error.'));
                }
            });
        });

        /* ══════════════════════════════════════════════════════
           TAB 4: DAMAGES — Dynamic cards with bulk save (Edit only)
        ══════════════════════════════════════════════════════ */
        var _damages = FD.damages || [];
        var _images = FD.images || [];
        var _videos = FD.videos || [];
        renderDamages();

        function renderDamages() {
            var $list = $('#damagesList');
            if (!$list.length) return;
            $('#damageCount').text(_damages.length);

            if (!_damages.length) {
                $list.html('<div class="text-muted small text-center py-3">' + T('part_inventories.no_damages', 'No damages added yet. Click "Add Damage" to begin.') + '</div>');
                return;
            }

            var html = '';
            _damages.forEach(function(dmg, idx) {
                var dmgId = dmg.id || dmg.damage_id || '';
                var description = dmg.description || dmg.damage_description || '';
                var dmgType = parseInt(dmg.damage_type) || '';
                var dmgLocation = parseInt(dmg.damage_location) || '';
                var dmgRating = dmg.damage_rating != null ? dmg.damage_rating : '';
                var linkedImages = dmg.linked_images || dmg.image_ids || [];
                var linkedVideos = dmg.linked_videos || dmg.video_ids || [];
                if (typeof linkedImages === 'string') { try { linkedImages = JSON.parse(linkedImages); } catch(e) { linkedImages = []; } }
                if (typeof linkedVideos === 'string') { try { linkedVideos = JSON.parse(linkedVideos); } catch(e) { linkedVideos = []; } }

                html += '<div class="damage-card" data-idx="' + idx + '" data-id="' + dmgId + '">';
                html += '<div class="damage-header"><span class="fw-semibold text-muted" style="font-size:12px;">' + T('part_inventories.damage','Damage') + ' #' + (idx + 1) + '</span>';
                html += '<button type="button" class="btn btn-sm btn-outline-danger btn-delete-damage" data-idx="' + idx + '"><i class="bi bi-trash3 me-1"></i>' + T('general.delete','Delete') + '</button></div>';

                html += '<div class="row g-3">';
                // Description
                html += '<div class="col-md-6"><label class="form-label fw-medium" style="font-size:12px;">' + T('part_inventories.damage_description','Damage Description') + '</label>';
                html += '<input type="text" class="form-control form-control-sm dmg-description" value="' + H.esc(description) + '" placeholder="' + T('part_inventories.damage_description','Description') + '"/></div>';

                // Damage Type
                html += '<div class="col-md-3"><label class="form-label fw-medium" style="font-size:12px;">' + T('part_inventories.damage_type','Damage Type') + '</label>';
                html += '<select class="form-select form-select-sm dmg-type">';
                html += '<option value="">-- ' + T('general.select','Select') + ' --</option>';
                html += '<option value="1"' + (dmgType === 1 ? ' selected' : '') + '>' + T('part_inventories.does_not_affect_function','Does Not Affect Function') + '</option>';
                html += '<option value="2"' + (dmgType === 2 ? ' selected' : '') + '>' + T('part_inventories.affects_function','Affects Function') + '</option>';
                html += '</select></div>';

                // Damage Location
                html += '<div class="col-md-3"><label class="form-label fw-medium" style="font-size:12px;">' + T('part_inventories.damage_location','Damage Location') + '</label>';
                html += '<select class="form-select form-select-sm dmg-location">';
                html += '<option value="">-- ' + T('general.select','Select') + ' --</option>';
                html += '<option value="1"' + (dmgLocation === 1 ? ' selected' : '') + '>' + T('part_inventories.internal','Internal') + '</option>';
                html += '<option value="2"' + (dmgLocation === 2 ? ' selected' : '') + '>' + T('part_inventories.external','External') + '</option>';
                html += '</select></div>';

                // Damage Rating
                html += '<div class="col-md-3"><label class="form-label fw-medium" style="font-size:12px;">' + T('part_inventories.damage_rating','Damage Rating') + '</label>';
                html += '<input type="number" class="form-control form-control-sm dmg-rating" min="0" max="5" step="0.1" value="' + (dmgRating !== '' ? dmgRating : '') + '" placeholder="0-5"/></div>';

                // Linked Images checkboxes
                html += '<div class="col-md-4"><label class="form-label fw-medium" style="font-size:12px;">' + T('part_inventories.linked_images','Linked Images') + '</label>';
                html += '<div class="d-flex flex-wrap gap-1" style="max-height:120px;overflow-y:auto;">';
                if (_images.length) {
                    _images.forEach(function(img) {
                        var imgId = String(img.id || img.image_id || '');
                        var imgUrl = img.display_url || img.image_url || img.url || '';
                        var isLinked = linkedImages.indexOf(imgId) !== -1 || linkedImages.indexOf(parseInt(imgId)) !== -1;
                        html += '<label class="d-inline-flex align-items-center border rounded p-1" style="cursor:pointer;font-size:10px;">';
                        html += '<input type="checkbox" class="form-check-input me-1 dmg-linked-img" value="' + imgId + '"' + (isLinked ? ' checked' : '') + ' style="width:14px;height:14px;"/>';
                        html += '<img src="' + H.esc(imgUrl) + '" style="width:32px;height:32px;object-fit:cover;border-radius:3px;" onerror="this.src=\'/images/no-image.svg\';"/>';
                        html += '</label>';
                    });
                } else {
                    html += '<span class="text-muted" style="font-size:11px;">' + T('part_inventories.no_images_available','No images') + '</span>';
                }
                html += '</div></div>';

                // Linked Videos checkboxes
                html += '<div class="col-md-5"><label class="form-label fw-medium" style="font-size:12px;">' + T('part_inventories.linked_videos','Linked Videos') + '</label>';
                html += '<div class="d-flex flex-wrap gap-1" style="max-height:120px;overflow-y:auto;">';
                if (_videos.length) {
                    _videos.forEach(function(vid) {
                        var vidId = String(vid.id || vid.video_id || '');
                        var vidUrl = vid.display_url || vid.video_url || vid.url || '';
                        var isLinked = linkedVideos.indexOf(vidId) !== -1 || linkedVideos.indexOf(parseInt(vidId)) !== -1;
                        html += '<label class="d-inline-flex align-items-center border rounded p-1" style="cursor:pointer;font-size:10px;">';
                        html += '<input type="checkbox" class="form-check-input me-1 dmg-linked-vid" value="' + vidId + '"' + (isLinked ? ' checked' : '') + ' style="width:14px;height:14px;"/>';
                        html += '<video src="' + H.esc(vidUrl) + '#t=1" preload="metadata" muted style="width:40px;height:32px;object-fit:cover;border-radius:3px;pointer-events:none;"></video>';
                        html += '</label>';
                    });
                } else {
                    html += '<span class="text-muted" style="font-size:11px;">' + T('part_inventories.no_videos_available','No videos') + '</span>';
                }
                html += '</div></div>';

                html += '</div>'; // row
                html += '</div>'; // damage-card
            });
            $list.html(html);
        }

        /* Add Damage card */
        $(document).on('click', '#btnAddDamage', function() {
            _damages.push({ description: '', damage_type: '', damage_location: '', damage_rating: '', linked_images: [], linked_videos: [] });
            renderDamages();
            // Scroll to new damage
            var $lastCard = $('#damagesList .damage-card:last');
            if ($lastCard.length) $lastCard[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        /* Delete Damage card */
        $(document).on('click', '.btn-delete-damage', function() {
            var idx = parseInt($(this).data('idx'));
            _damages.splice(idx, 1);
            renderDamages();
        });

        /* Collect damage data from DOM */
        function _collectDamagesFromDom() {
            var cards = [];
            $('#damagesList .damage-card').each(function() {
                var $card = $(this);
                var linkedImgs = [];
                $card.find('.dmg-linked-img:checked').each(function() { linkedImgs.push($(this).val()); });
                var linkedVids = [];
                $card.find('.dmg-linked-vid:checked').each(function() { linkedVids.push($(this).val()); });
                cards.push({
                    id: $card.data('id') || '',
                    description: $card.find('.dmg-description').val() || '',
                    damage_type: $card.find('.dmg-type').val() || '',
                    damage_location: $card.find('.dmg-location').val() || '',
                    damage_rating: $card.find('.dmg-rating').val() || '',
                    linked_images: linkedImgs,
                    linked_videos: linkedVids
                });
            });
            return cards;
        }

        /* Save Damages — bulk */
        $(document).on('click', '#btnSaveDamages', function(e) {
            e.preventDefault();
            var cards = _collectDamagesFromDom();

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/part-inventories/' + FD.uuid + '/damages/bulk',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ damages: cards }),
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('part_inventories.damages_saved', 'Damages saved.'));
                        if (Array.isArray(r.data)) { _damages = r.data; }
                        renderDamages();
                    } else {
                        toastr.error(r.message || T('general.error', 'Error.'));
                    }
                },
                error: function(xhr) {
                    btnReset($btn);
                    toastr.error(xhr.responseJSON ? xhr.responseJSON.message : T('general.network_error', 'Network error.'));
                }
            });
        });

        /* ══════════════════════════════════════════════════════
           TAB 5: ATTRIBUTES — Dynamic fields from API (Edit only)
        ══════════════════════════════════════════════════════ */
        var _attributes = [];
        loadAttributes();

        function loadAttributes() {
            var $container = $('#attributesContainer');
            if (!$container.length) return;

            $.get(BASE_URL + '/part-inventories/' + FD.uuid + '/attributes', function(res) {
                var list = [];
                if (res && res.status === 200) {
                    if (Array.isArray(res.data)) list = res.data;
                    else if (res.data && Array.isArray(res.data.attributes)) list = res.data.attributes;
                }
                if (list.length) {
                    _attributes = list;
                    renderAttributes();
                } else {
                    $container.html('<div class="text-muted small text-center py-3">' + T('part_inventories.no_attributes', 'No attributes configured for this part.') + '</div>');
                }
            }).fail(function() {
                $container.html('<div class="text-danger small text-center py-3">' + T('general.load_error', 'Failed to load attributes.') + '</div>');
            });
        }

        function renderAttributes() {
            var $container = $('#attributesContainer');
            if (!$container.length) return;
            $('#attributeCount').text(_attributes.length);

            if (!_attributes.length) {
                $container.html('<div class="text-muted small text-center py-3">' + T('part_inventories.no_attributes', 'No attributes configured for this part.') + '</div>');
                return;
            }

            var html = '<div class="row g-3">';
            _attributes.forEach(function(attr, idx) {
                var perms = attr.permissions || {};
                var canView = (perms.can_view !== false) && (attr.can_view !== false);
                if (!canView) return;
                var attrId = attr.id || attr.attribute_id || '';
                var labelName = attr.label_name || attr.name || '';
                var isRequired = attr.is_required;
                var canEdit = (perms.can_edit !== false) && (attr.can_edit !== false);
                var dataType = parseInt(attr.data_type_id) || 1;
                var currentVal = attr.value != null ? attr.value : '';
                var options = attr.options || [];
                var readonlyAttr = !canEdit ? ' readonly disabled' : '';
                var requiredMark = isRequired ? ' <span class="text-danger">*</span>' : '';

                html += '<div class="col-md-4 col-sm-6 attr-group">';
                html += '<label class="form-label fw-medium" style="font-size:12px;">' + H.esc(labelName) + requiredMark + '</label>';

                // Save-side enum: 1=Text, 2=Number, 3=Dropdown, 4=Checkbox, 5=Radio, 6=Upload
                var isMulti = !!attr.is_multiple;
                var selVals = [];
                if (Array.isArray(currentVal)) selVals = currentVal.map(String);
                else if (currentVal != null && currentVal !== '') selVals = [String(currentVal)];

                switch (dataType) {
                    case 1: // Text
                        html += '<input type="text" class="form-control form-control-sm attr-field" data-attr-id="' + attrId + '" data-type="1" value="' + H.esc(String(currentVal||'')) + '"' + readonlyAttr + '/>';
                        break;
                    case 2: // Number
                        html += '<input type="number" step="any" class="form-control form-control-sm attr-field" data-attr-id="' + attrId + '" data-type="2" value="' + H.esc(String(currentVal||'')) + '"' + readonlyAttr + '/>';
                        break;
                    case 3: // Dropdown (single or multi)
                        if (isMulti) {
                            html += '<select class="form-select form-select-sm attr-field attr-multi-sel" multiple data-attr-id="' + attrId + '" data-type="3"' + readonlyAttr + '>';
                        } else {
                            html += '<select class="form-select form-select-sm attr-field" data-attr-id="' + attrId + '" data-type="3"' + readonlyAttr + '>';
                            html += '<option value="">-- ' + T('general.select','Select') + ' --</option>';
                        }
                        options.forEach(function(opt) {
                            var v = opt.value != null ? opt.value : (opt.id || '');
                            var l = opt.label || opt.option_value || opt.name || ('#' + v);
                            html += '<option value="' + H.esc(String(v)) + '"' + (selVals.indexOf(String(v))!==-1?' selected':'') + '>' + H.esc(l) + '</option>';
                        });
                        html += '</select>';
                        break;
                    case 4: // Checkbox list
                        html += '<div class="d-flex flex-wrap gap-2 attr-field-multi" data-attr-id="' + attrId + '" data-type="4">';
                        options.forEach(function(opt) {
                            var v = opt.value != null ? opt.value : (opt.id || '');
                            var l = opt.label || opt.option_value || opt.name || ('#' + v);
                            html += '<label class="form-check" style="font-size:12px;"><input type="checkbox" class="form-check-input attr-multi-chk" value="' + H.esc(String(v)) + '"' + (selVals.indexOf(String(v))!==-1?' checked':'') + readonlyAttr + '/><span class="form-check-label">' + H.esc(l) + '</span></label>';
                        });
                        html += '</div>';
                        break;
                    case 5: // Radio
                        html += '<div class="d-flex flex-wrap gap-2">';
                        options.forEach(function(opt) {
                            var v = opt.value != null ? opt.value : (opt.id || '');
                            var l = opt.label || opt.option_value || opt.name || ('#' + v);
                            html += '<label class="form-check" style="font-size:12px;"><input type="radio" class="form-check-input attr-field" name="attr-radio-' + attrId + '" data-attr-id="' + attrId + '" data-type="5" value="' + H.esc(String(v)) + '"' + (selVals.indexOf(String(v))!==-1?' checked':'') + readonlyAttr + '/><span class="form-check-label">' + H.esc(l) + '</span></label>';
                        });
                        html += '</div>';
                        break;
                    case 6: // Upload
                        html += '<input type="file" class="form-control form-control-sm attr-field" data-attr-id="' + attrId + '" data-type="6"' + readonlyAttr + '/>';
                        if (currentVal) html += '<div class="small text-muted mt-1">Current: <a href="' + H.esc(String(currentVal)) + '" target="_blank">view</a></div>';
                        break;
                    default:
                        html += '<input type="text" class="form-control form-control-sm attr-field" data-attr-id="' + attrId + '" data-type="1" value="' + H.esc(String(currentVal||'')) + '"' + readonlyAttr + '/>';
                }
                html += '</div>';
            });
            html += '</div>';
            $container.html(html);
        }

        /* Collect attribute values from DOM */
        function _collectAttributes() {
            var values = [];
            var seen = {};
            // Single-value, multi-select dropdown, radio
            $('.attr-field').each(function() {
                var $f = $(this);
                var attrId = $f.data('attr-id');
                if (!attrId || seen[attrId]) return;
                if ($f.is('[type=radio]') && !$f.is(':checked')) return;
                var val;
                if ($f.is('.attr-multi-sel')) val = $f.val() || [];
                else val = $f.val() || '';
                values.push({ attribute_id: attrId, value: val });
                seen[attrId] = true;
            });
            // Checkbox-list (data_type 4)
            $('.attr-field-multi').each(function() {
                var $wrap = $(this);
                var attrId = $wrap.data('attr-id');
                if (seen[attrId]) return;
                var selected = [];
                $wrap.find('.attr-multi-chk:checked').each(function() { selected.push($(this).val()); });
                values.push({ attribute_id: attrId, value: selected });
                seen[attrId] = true;
            });
            return values;
        }

        /* Save Attributes */
        $(document).on('click', '#btnSaveAttributes', function(e) {
            e.preventDefault();
            var values = _collectAttributes();

            // Validate required
            for (var i = 0; i < _attributes.length; i++) {
                var attr = _attributes[i];
                var pp = attr.permissions || {};
                var cv = (pp.can_view !== false) && (attr.can_view !== false);
                if (!cv || !attr.is_required) continue;
                var found = values.filter(function(v) { return String(v.attribute_id) === String(attr.id || attr.attribute_id); })[0];
                if (found) {
                    var isEmpty = false;
                    if (Array.isArray(found.value)) { isEmpty = found.value.length === 0; }
                    else { isEmpty = !found.value && found.value !== 0; }
                    if (isEmpty) {
                        toastr.error((attr.label_name || attr.name || 'Attribute') + ' ' + T('general.is_required', 'is required.'));
                        return;
                    }
                }
            }

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/part-inventories/' + FD.uuid + '/attributes',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ attributes: values }),
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('part_inventories.attributes_saved', 'Attributes saved.'));
                        if (Array.isArray(r.data)) {
                            _attributes = r.data;
                            renderAttributes();
                        }
                    } else {
                        toastr.error(r.message || T('general.error', 'Error.'));
                    }
                },
                error: function(xhr) {
                    btnReset($btn);
                    toastr.error(xhr.responseJSON ? xhr.responseJSON.message : T('general.network_error', 'Network error.'));
                }
            });
        });

        /* ══════════════════════════════════════════════════════
           TAB 6: IMAGES — Gallery, Upload, Delete, Reorder, Preview (Edit only)
        ══════════════════════════════════════════════════════ */
        var _imgOrderChanged = false;
        renderImageGallery();

        // Save image order button
        $(document).on('click', '#btnSaveImageOrder', function() {
            var orderedIds = _images.map(function(img) { return img.id || img.image_id; });
            var $btn = $(this); btnLoading($btn);
            $.ajax({ url: BASE_URL + '/part-inventories/' + FD.uuid + '/images/reorder', type: 'POST',
                contentType: 'application/json', data: JSON.stringify({ order: orderedIds }),
                success: function(r) { btnReset($btn); if (r.status === 200) { toastr.success(T('part_inventories.order_saved','Order saved.')); _imgOrderChanged = false; $('#btnSaveImageOrder').addClass('d-none'); } else toastr.error(r.message); },
                error: function() { btnReset($btn); toastr.error(T('general.error','Error.')); }
            });
        });

        function _getDamagesForImage(imgId) {
            var badges = [];
            _damages.forEach(function(dmg, idx) {
                var linked = dmg.linked_images || dmg.image_ids || [];
                if (typeof linked === 'string') { try { linked = JSON.parse(linked); } catch(e) { linked = []; } }
                var found = linked.indexOf(String(imgId)) !== -1 || linked.indexOf(parseInt(imgId)) !== -1;
                if (found) {
                    badges.push({ idx: idx, label: (dmg.description || dmg.damage_description || T('part_inventories.damage','Damage')) + ' #' + (idx + 1) });
                }
            });
            return badges;
        }

        function _getDamagesForVideo(vidId) {
            var badges = [];
            _damages.forEach(function(dmg, idx) {
                var linked = dmg.linked_videos || dmg.video_ids || [];
                if (typeof linked === 'string') { try { linked = JSON.parse(linked); } catch(e) { linked = []; } }
                var found = linked.indexOf(String(vidId)) !== -1 || linked.indexOf(parseInt(vidId)) !== -1;
                if (found) {
                    badges.push({ idx: idx, label: (dmg.description || dmg.damage_description || T('part_inventories.damage','Damage')) + ' #' + (idx + 1) });
                }
            });
            return badges;
        }

        function renderImageGallery() {
            var $grid = $('#imageGalleryGrid');
            if (!$grid.length) return;
            $('#imageGalleryCount').text(_images.length);

            if (!_images.length) {
                $grid.html('<div class="text-muted small text-center py-3 w-100">' + T('part_inventories.no_images', 'No images uploaded yet.') + '</div>');
                return;
            }

            var html = '';
            _images.forEach(function(img, idx) {
                var imgUrl = img.display_url || img.image_url || img.url || '';
                var imgId  = img.id || img.image_id || '';
                var dmgBadges = _getDamagesForImage(imgId);
                html += '<div class="col-6 col-sm-4 col-md-3 pi-image-card" draggable="true" data-id="' + imgId + '" data-idx="' + idx + '">' +
                    '<div class="border rounded p-1 text-center position-relative" style="cursor:grab;">' +
                    '<img src="' + H.esc(imgUrl) + '" class="rounded pi-preview-img" data-idx="' + idx + '" style="width:100%;height:100px;object-fit:cover;cursor:pointer;" onerror="this.src=\'/images/no-image.svg\';" title="' + T('general.click_preview','Click to preview') + '"/>' +
                    '<button type="button" class="btn btn-sm btn-info position-absolute top-0 start-0 m-1 btn-edit-pi-image" data-id="' + imgId + '" data-url="' + H.esc(imgUrl) + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;" title="' + T('part_inventories.edit_image','Edit Image') + '"><i class="bi bi-pencil"></i></button>' +
                    '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 btn-delete-pi-image" data-id="' + imgId + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;"><i class="bi bi-trash3"></i></button>' +
                    '<div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-grip-vertical"></i> ' + T('general.drag_to_reorder', 'Drag') + '</div>';
                // Linked damage badges
                if (dmgBadges.length) {
                    html += '<div class="mt-1">';
                    dmgBadges.forEach(function(b) {
                        html += '<span class="damage-media-badge bg-info-lt sms-go-damage" data-damage-idx="' + b.idx + '" title="' + H.esc(b.label) + '">' + H.esc(b.label) + '</span>';
                    });
                    html += '</div>';
                }
                html += '</div></div>';
            });
            if (_imgOrderChanged) html += '<div class="col-12 mt-2"><button type="button" class="btn btn-sm btn-warning" id="btnSaveImageOrder"><i class="bi bi-arrows-move me-1"></i>' + T('part_inventories.save_order','Save Order') + '</button></div>';
            $grid.html(html);
            initImageDragDrop();
        }

        /* Navigate to damage tab when clicking a damage badge */
        $(document).on('click', '.sms-go-damage', function() {
            $('#tab-damages').tab('show');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        /* Image preview modal */
        $(document).on('click', '.pi-preview-img', function(e) {
            e.preventDefault();
            var idx = parseInt($(this).data('idx'));
            _showPreview('image', idx);
        });
        function _showPreview(type, idx) {
            var arr = type === 'image' ? _images : _videos;
            if (!arr[idx]) return;
            var url = arr[idx].display_url || arr[idx].image_url || arr[idx].video_url || arr[idx].url || '';
            var h = '<div class="text-center">';
            if (type === 'image') {
                h += '<img src="' + H.esc(url) + '" class="rounded" style="max-width:100%;max-height:70vh;object-fit:contain;"/>';
            } else {
                h += '<video src="' + H.esc(url) + '" controls style="max-width:100%;max-height:70vh;" autoplay></video>';
            }
            h += '</div>';
            h += '<div class="d-flex justify-content-between mt-3">';
            h += '<button class="btn btn-sm btn-outline-secondary pi-media-nav" data-type="' + type + '" data-idx="' + (idx-1) + '" ' + (idx <= 0 ? 'disabled' : '') + '><i class="bi bi-chevron-left me-1"></i>' + T('general.previous','Previous') + '</button>';
            h += '<span class="text-muted small align-self-center">' + (idx+1) + ' / ' + arr.length + '</span>';
            h += '<button class="btn btn-sm btn-outline-secondary pi-media-nav" data-type="' + type + '" data-idx="' + (idx+1) + '" ' + (idx >= arr.length - 1 ? 'disabled' : '') + '>' + T('general.next','Next') + '<i class="bi bi-chevron-right ms-1"></i></button>';
            h += '</div>';
            $('#viewBody').html(h);
            bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
        }
        $(document).on('click', '.pi-media-nav', function() {
            var type = $(this).data('type');
            var idx = parseInt($(this).data('idx'));
            _showPreview(type, idx);
        });

        /* Delete image */
        $(document).on('click', '.btn-delete-pi-image', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var imageId = $(this).data('id');
            if (!imageId) return;
            smsConfirm({
                icon: '\uD83D\uDDD1\uFE0F',
                title: T('general.delete', 'Delete'),
                msg: T('part_inventories.delete_image_confirm', 'Are you sure you want to delete this image?'),
                btnClass: 'btn-danger',
                btnText: T('btn.delete', 'Delete'),
                onConfirm: function() {
                    showLoading();
                    $.post(BASE_URL + '/part-inventories/' + FD.uuid + '/images/delete', { image_id: imageId }, function(r) {
                        hideLoading();
                        if (r.status === 200) {
                            toastr.success(r.message || T('msg.deleted', 'Deleted.'));
                            _images = _images.filter(function(img) { return String(img.id || img.image_id) !== String(imageId); });
                            renderImageGallery();
                        } else {
                            toastr.error(r.message || T('general.error', 'Error.'));
                        }
                    }).fail(function() {
                        hideLoading();
                        toastr.error(T('general.network_error', 'Network error.'));
                    });
                }
            });
        });

        /* Edit image — open SMS_ImageEditor */
        $(document).on('click', '.btn-edit-pi-image', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var imageId = $(this).data('id');
            var imageUrl = $(this).data('url');
            if (!imageId || !imageUrl) return;
            if (typeof SMS_ImageEditor === 'undefined') {
                toastr.error(T('part_inventories.editor_not_loaded','Image editor not loaded.'));
                return;
            }
            SMS_ImageEditor.open({
                imageUrl: imageUrl,
                onSave: function(blob, dataUrl, mode, editActions) {
                    var $msg = $('#ieSaveMsg');
                    var actionsStr = (editActions && editActions.length) ? editActions.join(', ') : '';

                    if (blob.size > _maxImgSize * 1024 * 1024) {
                        $msg.html('<span style="color:#ef4444;"><i class="bi bi-exclamation-triangle me-1"></i>Image size (' + (blob.size / 1048576).toFixed(1) + ' MB) exceeds limit of ' + _maxImgSize + ' MB</span>');
                        toastr.error(T('part_inventories.image_too_large','Image too large! Max: ') + _maxImgSize + ' MB');
                        return false;
                    }

                    if (mode === 'new') {
                        if (_images.length >= _maxImgCount) {
                            $msg.html('<span style="color:#ef4444;"><i class="bi bi-exclamation-triangle me-1"></i>' + T('part_inventories.max_images','Maximum ') + _maxImgCount + ' images reached.</span>');
                            toastr.error(T('part_inventories.max_images','Maximum ') + _maxImgCount + ' images allowed.');
                            return false;
                        }
                        var fd = new FormData();
                        fd.append('images', blob, 'edited-image.png');
                        if (actionsStr) fd.append('edit_actions', actionsStr);
                        $msg.html('<span style="color:#3b82f6;"><span class="spinner-border spinner-border-sm me-1"></span>Uploading as new...</span>');
                        $.ajax({
                            url: BASE_URL + '/part-inventories/' + FD.uuid + '/images',
                            type: 'POST', data: fd, processData: false, contentType: false,
                            success: function(r) {
                                if (r.status === 200 || r.status === 201) {
                                    toastr.success(T('part_inventories.image_saved_new','Image saved as new.'));
                                    if (Array.isArray(r.data)) { _images = r.data; }
                                    renderImageGallery();
                                } else { $msg.html('<span style="color:#ef4444;">' + (r.message || 'Error') + '</span>'); }
                            },
                            error: function() { $msg.html('<span style="color:#ef4444;">Upload failed</span>'); }
                        });
                    } else {
                        var fd2 = new FormData();
                        fd2.append('image', blob, 'edited-image.png');
                        if (actionsStr) fd2.append('edit_actions', actionsStr);
                        $msg.html('<span style="color:#3b82f6;"><span class="spinner-border spinner-border-sm me-1"></span>Replacing...</span>');
                        $.ajax({
                            url: BASE_URL + '/part-inventories/' + FD.uuid + '/images/' + imageId + '/replace',
                            type: 'POST', data: fd2, processData: false, contentType: false,
                            success: function(r) {
                                if (r.status === 200) {
                                    toastr.success(T('part_inventories.image_replaced','Image replaced.'));
                                    _images = r.data;
                                    renderImageGallery();
                                } else { $msg.html('<span style="color:#ef4444;">' + (r.message || 'Error') + '</span>'); }
                            },
                            error: function() { $msg.html('<span style="color:#ef4444;">Upload failed</span>'); }
                        });
                    }
                }
            });
        });

        /* Upload images — accumulate files across multiple selections */
        var _allowedImgExts = ['.jpg','.jpeg','.png','.gif','.webp'];
        var _allowedVidExts = ['.mp4','.mov','.avi','.mkv','.webm','.wmv','.flv','.m4v'];
        var _pendingImgFiles = [];

        function _renderImgPreview() {
            var $preview = $('#imageUploadPreview');
            $preview.html('');
            if (!_pendingImgFiles.length) return;
            _pendingImgFiles.forEach(function(file, idx) {
                var url = URL.createObjectURL(file);
                $preview.append(
                    '<div class="col-4 col-sm-3" data-pending-idx="' + idx + '"><div class="border rounded p-1 text-center position-relative">' +
                    '<img src="' + url + '" class="rounded" style="width:100%;height:70px;object-fit:cover;"/>' +
                    '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 btn-remove-pending-img" data-idx="' + idx + '" style="width:20px;height:20px;padding:0;line-height:20px;font-size:10px;border-radius:50%;"><i class="bi bi-x"></i></button>' +
                    '</div></div>'
                );
            });
            $preview.append(
                '<div class="col-12 mt-1"><span class="text-muted small me-2">' + _pendingImgFiles.length + ' ' + T('part_inventories.files_selected','file(s) selected') + '</span>' +
                '<button type="button" class="btn btn-sm btn-outline-danger sms-clear-all-pending-img"><i class="bi bi-x-lg me-1"></i>' + T('general.clear_all','Clear All') + '</button></div>'
            );
        }

        $('#fImages').on('change', function() {
            var files = this.files;
            if (!files || !files.length) return;
            if (_images.length + _pendingImgFiles.length + files.length > _maxImgCount) {
                toastr.error(T('part_inventories.max_images_reached', 'Maximum ') + _maxImgCount + T('part_inventories.images_allowed',' images allowed. Currently: ') + _images.length + ' + ' + _pendingImgFiles.length + ' pending');
                $(this).val(''); return;
            }
            for (var i = 0; i < files.length; i++) {
                var ext = '.' + files[i].name.split('.').pop().toLowerCase();
                if (_allowedImgExts.indexOf(ext) === -1) {
                    toastr.error('"' + files[i].name + '" — ' + T('part_inventories.invalid_image_format','Only JPG, PNG, GIF, WebP images are allowed.'));
                    continue;
                }
                if (files[i].size > _maxImgSize * 1024 * 1024) {
                    toastr.error('"' + files[i].name + '" ' + T('part_inventories.exceeds_limit','exceeds ') + _maxImgSize + ' MB');
                    continue;
                }
                _pendingImgFiles.push(files[i]);
            }
            $(this).val('');
            _renderImgPreview();
        });

        // Remove single pending image
        $(document).on('click', '.btn-remove-pending-img', function(e) {
            e.preventDefault();
            var idx = parseInt($(this).data('idx'));
            _pendingImgFiles.splice(idx, 1);
            _renderImgPreview();
        });

        // Clear all pending images
        $(document).on('click', '.sms-clear-all-pending-img', function(e) {
            e.preventDefault();
            _pendingImgFiles = [];
            _renderImgPreview();
        });

        $('#btnUploadImages').on('click', function() {
            if (!_pendingImgFiles.length) { toastr.error(T('part_inventories.select_files', 'Please select files to upload.')); return; }

            var fd = new FormData();
            for (var i = 0; i < _pendingImgFiles.length; i++) {
                fd.append('images', _pendingImgFiles[i]);
            }

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/part-inventories/' + FD.uuid + '/images',
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('msg.uploaded', 'Uploaded.'));
                        if (Array.isArray(r.data)) { _images = r.data; }
                        renderImageGallery();
                        _pendingImgFiles = [];
                        _renderImgPreview();
                    } else {
                        toastr.error(r.message || T('general.error', 'Error.'));
                    }
                },
                error: function(xhr) {
                    btnReset($btn);
                    var msg = T('general.network_error', 'Network error.');
                    if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                    toastr.error(msg);
                }
            });
        });

        /* Drag & drop reorder images */
        function initImageDragDrop() {
            var $cards = $('.pi-image-card');
            var dragSrcEl = null;

            $cards.off('dragstart dragover dragenter dragleave drop dragend');

            $cards.on('dragstart', function(e) {
                dragSrcEl = this;
                $(this).css('opacity', '0.4');
                e.originalEvent.dataTransfer.effectAllowed = 'move';
                e.originalEvent.dataTransfer.setData('text/plain', $(this).data('idx'));
            });

            $cards.on('dragover', function(e) {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
            });

            $cards.on('dragenter', function(e) {
                e.preventDefault();
                $(this).find('.border').addClass('border-primary border-2');
            });

            $cards.on('dragleave', function() {
                $(this).find('.border').removeClass('border-primary border-2');
            });

            $cards.on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).find('.border').removeClass('border-primary border-2');

                if (dragSrcEl === this) return;

                var fromIdx = parseInt($(dragSrcEl).data('idx'));
                var toIdx   = parseInt($(this).data('idx'));

                var moved = _images.splice(fromIdx, 1)[0];
                _images.splice(toIdx, 0, moved);
                _imgOrderChanged = true;
                renderImageGallery();
            });

            $cards.on('dragend', function() {
                $(this).css('opacity', '1');
                $('.pi-image-card .border').removeClass('border-primary border-2');
            });
        }

        /* ══════════════════════════════════════════════════════
           TAB 7: VIDEOS — Gallery, Upload, Delete, Reorder (Edit only)
        ══════════════════════════════════════════════════════ */
        var _vidOrderChanged = false;
        renderVideoGallery();

        // Save video order button
        $(document).on('click', '#btnSaveVideoOrder', function() {
            var orderedIds = _videos.map(function(v) { return v.id || v.video_id; });
            var $btn = $(this); btnLoading($btn);
            $.ajax({ url: BASE_URL + '/part-inventories/' + FD.uuid + '/videos/reorder', type: 'POST',
                contentType: 'application/json', data: JSON.stringify({ order: orderedIds }),
                success: function(r) { btnReset($btn); if (r.status === 200) { toastr.success(T('part_inventories.order_saved','Order saved.')); _vidOrderChanged = false; $('#btnSaveVideoOrder').addClass('d-none'); } else toastr.error(r.message); },
                error: function() { btnReset($btn); toastr.error(T('general.error','Error.')); }
            });
        });

        function renderVideoGallery() {
            var $grid = $('#videoGalleryGrid');
            if (!$grid.length) return;
            $('#videoGalleryCount').text(_videos.length);

            if (!_videos.length) {
                $grid.html('<div class="text-muted small text-center py-3 w-100">' + T('part_inventories.no_videos', 'No videos uploaded yet.') + '</div>');
                return;
            }

            var html = '';
            _videos.forEach(function(vid, idx) {
                var vidUrl = vid.display_url || vid.video_url || vid.url || '';
                var vidId  = vid.id || vid.video_id || '';
                var dmgBadges = _getDamagesForVideo(vidId);
                html += '<div class="col-6 col-sm-4 col-md-3 pi-video-card" draggable="true" data-id="' + vidId + '" data-idx="' + idx + '">' +
                    '<div class="border rounded p-1 text-center position-relative" style="cursor:grab;background:#000;">' +
                    '<div class="pi-vid-thumb-wrap" data-idx="' + idx + '" data-url="' + H.esc(vidUrl) + '" style="position:relative;width:100%;height:100px;cursor:pointer;overflow:hidden;border-radius:4px;" title="' + T('general.click_preview','Click to play') + '">' +
                    '<video src="' + H.esc(vidUrl) + '#t=1" preload="metadata" muted playsinline ' +
                    'style="width:100%;height:100px;object-fit:cover;pointer-events:none;"></video>' +
                    '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.2);">' +
                    '<i class="bi bi-play-circle-fill" style="font-size:32px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);"></i></div>' +
                    '</div>' +
                    '<button type="button" class="btn btn-sm btn-info position-absolute top-0 start-0 m-1 btn-edit-pi-video" data-idx="' + idx + '" data-url="' + H.esc(vidUrl) + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;" title="' + T('part_inventories.video_tools','Video Tools') + '"><i class="bi bi-scissors"></i></button>' +
                    '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 btn-delete-pi-video" data-id="' + vidId + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;"><i class="bi bi-trash3"></i></button>' +
                    '<div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-grip-vertical"></i> ' + T('general.drag_to_reorder', 'Drag') + '</div>';
                // Linked damage badges
                if (dmgBadges.length) {
                    html += '<div class="mt-1">';
                    dmgBadges.forEach(function(b) {
                        html += '<span class="damage-media-badge bg-info-lt sms-go-damage" data-damage-idx="' + b.idx + '" title="' + H.esc(b.label) + '">' + H.esc(b.label) + '</span>';
                    });
                    html += '</div>';
                }
                html += '</div></div>';
            });
            if (_vidOrderChanged) html += '<div class="col-12 mt-2"><button type="button" class="btn btn-sm btn-warning" id="btnSaveVideoOrder"><i class="bi bi-arrows-move me-1"></i>' + T('part_inventories.save_order','Save Order') + '</button></div>';
            $grid.html(html);
            initVideoDragDrop();
        }

        /* Video play — click thumbnail to open player modal */
        $(document).on('click', '.pi-vid-thumb-wrap', function(e) {
            e.preventDefault();
            var idx = parseInt($(this).data('idx'));
            _showVideoPlayer(idx);
        });

        function _showVideoPlayer(idx) {
            if (!_videos[idx]) return;
            var url = _videos[idx].display_url || _videos[idx].video_url || _videos[idx].url || '';
            var h = '<div class="text-center" style="background:#000;border-radius:8px;overflow:hidden;">' +
                '<video id="piVideoPlayer" src="' + H.esc(url) + '" controls autoplay playsinline style="max-width:100%;max-height:70vh;display:block;margin:0 auto;"></video>' +
                '</div>' +
                '<div class="d-flex justify-content-between align-items-center mt-3">' +
                '<button class="btn btn-sm btn-outline-secondary pi-vid-nav" data-idx="' + (idx - 1) + '" ' + (idx <= 0 ? 'disabled' : '') + '><i class="bi bi-chevron-left me-1"></i>' + T('general.previous','Previous') + '</button>' +
                '<span class="text-muted small">' + (idx + 1) + ' / ' + _videos.length + '</span>' +
                '<button class="btn btn-sm btn-outline-secondary pi-vid-nav" data-idx="' + (idx + 1) + '" ' + (idx >= _videos.length - 1 ? 'disabled' : '') + '>' + T('general.next','Next') + '<i class="bi bi-chevron-right ms-1"></i></button>' +
                '</div>';
            $('#viewBody').html(h);
            bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
        }

        $(document).on('click', '.pi-vid-nav', function(e) {
            e.preventDefault();
            _showVideoPlayer(parseInt($(this).data('idx')));
        });

        /* Video tools — opens video editor (SMS_VideoEditor) */
        $(document).on('click', '.btn-edit-pi-video', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var idx = parseInt($(this).data('idx'));
            var url = $(this).data('url');
            if (!url) return;

            if (typeof SMS_VideoEditor !== 'undefined') {
                var vid = _videos[idx];
                var vidId = vid ? (vid.id || vid.video_id) : '';
                SMS_VideoEditor.open({
                    videoUrl: url,
                    fileName: 'video_' + vidId + '.mp4',
                    onSave: function(blob, filename, mode, editActions) {
                        var vidActionsStr = (editActions && editActions.length) ? editActions.join(', ') : '';
                        if (blob.size > _maxVidSize * 1024 * 1024) {
                            toastr.error('Video size (' + (blob.size / 1048576).toFixed(1) + ' MB) exceeds limit of ' + _maxVidSize + ' MB. Try compressing first.');
                            $('#veStatus').html('<span class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Video too large! Max: ' + _maxVidSize + ' MB.</span>');
                            return false;
                        }
                        if (mode === 'new' && _videos.length >= _maxVidCount) {
                            toastr.error('Maximum ' + _maxVidCount + ' videos allowed. Delete one first.');
                            return false;
                        }

                        var fd = new FormData();
                        if (mode === 'replace' && vidId) {
                            fd.append('videos', blob, filename);
                            if (vidActionsStr) fd.append('edit_actions', vidActionsStr);
                            showLoading();
                            $.post(BASE_URL + '/part-inventories/' + FD.uuid + '/videos/delete', { video_id: vidId }, function() {
                                $.ajax({
                                    url: BASE_URL + '/part-inventories/' + FD.uuid + '/videos',
                                    type: 'POST', data: fd, processData: false, contentType: false,
                                    success: function(r) {
                                        hideLoading();
                                        if (r.status === 200 || r.status === 201) {
                                            toastr.success('Video replaced successfully.');
                                            if (Array.isArray(r.data)) { _videos = r.data; }
                                            renderVideoGallery();
                                        } else { toastr.error(r.message || 'Error.'); }
                                    },
                                    error: function() { hideLoading(); toastr.error('Upload failed.'); }
                                });
                            }).fail(function() { hideLoading(); toastr.error('Delete failed.'); });
                        } else {
                            fd.append('videos', blob, filename);
                            if (vidActionsStr) fd.append('edit_actions', vidActionsStr);
                            showLoading();
                            $.ajax({
                                url: BASE_URL + '/part-inventories/' + FD.uuid + '/videos',
                                type: 'POST', data: fd, processData: false, contentType: false,
                                success: function(r) {
                                    hideLoading();
                                    if (r.status === 200 || r.status === 201) {
                                        toastr.success('Video saved as new.');
                                        if (Array.isArray(r.data)) { _videos = r.data; }
                                        renderVideoGallery();
                                    } else { toastr.error(r.message || 'Error.'); }
                                },
                                error: function() { hideLoading(); toastr.error('Upload failed.'); }
                            });
                        }
                    }
                });
            } else {
                // Fallback: simple player
                _showVideoPlayer(idx);
            }
        });

        /* Delete video */
        $(document).on('click', '.btn-delete-pi-video', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var videoId = $(this).data('id');
            if (!videoId) return;

            smsConfirm({
                icon: '\uD83D\uDDD1\uFE0F',
                title: T('general.delete', 'Delete'),
                msg: T('part_inventories.delete_video_confirm', 'Are you sure you want to delete this video?'),
                btnClass: 'btn-danger',
                btnText: T('btn.delete', 'Delete'),
                onConfirm: function() {
                    showLoading();
                    $.post(BASE_URL + '/part-inventories/' + FD.uuid + '/videos/delete', { video_id: videoId }, function(r) {
                        hideLoading();
                        if (r.status === 200) {
                            toastr.success(r.message || T('msg.deleted', 'Deleted.'));
                            _videos = _videos.filter(function(v) { return String(v.id || v.video_id) !== String(videoId); });
                            renderVideoGallery();
                        } else {
                            toastr.error(r.message || T('general.error', 'Error.'));
                        }
                    }).fail(function() {
                        hideLoading();
                        toastr.error(T('general.network_error', 'Network error.'));
                    });
                }
            });
        });

        /* Upload videos — accumulate files */
        var _pendingVidFiles = [];

        /* Generate thumbnail from video file */
        function _generateVideoThumb(file, callback) {
            var url = URL.createObjectURL(file);
            var video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;
            video.onloadeddata = function() {
                video.currentTime = Math.min(1, video.duration / 4);
            };
            video.onseeked = function() {
                var c = document.createElement('canvas');
                c.width = 160; c.height = 100;
                var ctx = c.getContext('2d');
                ctx.drawImage(video, 0, 0, c.width, c.height);
                callback(c.toDataURL('image/jpeg', 0.7));
                URL.revokeObjectURL(url);
            };
            video.onerror = function() {
                callback(null);
                URL.revokeObjectURL(url);
            };
            video.src = url;
        }

        function _renderVidPreview() {
            var $preview = $('#videoUploadPreview');
            $preview.html('');
            if (!_pendingVidFiles.length) return;
            _pendingVidFiles.forEach(function(file, idx) {
                var cardId = 'pendVid_' + idx;
                $preview.append(
                    '<div class="col-4 col-sm-3" data-pending-vidx="' + idx + '" id="' + cardId + '"><div class="border rounded p-1 text-center position-relative" style="background:#000;">' +
                    '<div class="d-flex align-items-center justify-content-center" style="width:100%;height:80px;">' +
                    '<span class="spinner-border spinner-border-sm text-light"></span></div>' +
                    '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 btn-remove-pending-vid" data-idx="' + idx + '" style="width:20px;height:20px;padding:0;line-height:20px;font-size:10px;border-radius:50%;"><i class="bi bi-x"></i></button>' +
                    '<div class="text-light text-truncate px-1" style="font-size:9px;background:rgba(0,0,0,.6);">' + H.esc(file.name) + '</div>' +
                    '</div></div>'
                );
                (function(f, cid) {
                    _generateVideoThumb(f, function(thumbUrl) {
                        var $card = $('#' + cid + ' .d-flex');
                        if (thumbUrl) {
                            $card.replaceWith(
                                '<div style="position:relative;width:100%;height:80px;cursor:pointer;" class="pi-pending-vid-play" data-idx="' + idx + '">' +
                                '<img src="' + thumbUrl + '" style="width:100%;height:80px;object-fit:cover;border-radius:4px;"/>' +
                                '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:28px;text-shadow:0 2px 8px rgba(0,0,0,.6);"><i class="bi bi-play-circle-fill"></i></div>' +
                                '</div>'
                            );
                        } else {
                            $card.html('<i class="bi bi-camera-video text-light" style="font-size:28px;opacity:.5;"></i>');
                        }
                    });
                })(file, cardId);
            });
            $preview.append(
                '<div class="col-12 mt-1"><span class="text-muted small me-2">' + _pendingVidFiles.length + ' ' + T('part_inventories.files_selected','file(s) selected') + '</span>' +
                '<button type="button" class="btn btn-sm btn-outline-danger sms-clear-all-pending-vid"><i class="bi bi-x-lg me-1"></i>' + T('general.clear_all','Clear All') + '</button></div>'
            );
        }

        /* Play pending video in modal */
        $(document).on('click', '.pi-pending-vid-play', function(e) {
            e.preventDefault();
            var idx = parseInt($(this).data('idx'));
            if (!_pendingVidFiles[idx]) return;
            var url = URL.createObjectURL(_pendingVidFiles[idx]);
            var h = '<div class="text-center">' +
                '<video src="' + url + '" controls autoplay playsinline style="max-width:100%;max-height:70vh;border-radius:8px;"></video>' +
                '</div>' +
                '<div class="text-muted small text-center mt-2">' + H.esc(_pendingVidFiles[idx].name) + '</div>';
            $('#viewBody').html(h);
            bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
            $('#modalView').off('hidden.bs.modal.vidclean').on('hidden.bs.modal.vidclean', function() {
                URL.revokeObjectURL(url);
            });
        });

        $('#fVideos').on('change', function() {
            var files = this.files;
            if (!files || !files.length) return;
            if (_videos.length + _pendingVidFiles.length + files.length > _maxVidCount) {
                toastr.error(T('part_inventories.max_videos_reached', 'Maximum ') + _maxVidCount + T('part_inventories.videos_allowed',' videos allowed. Currently: ') + _videos.length + ' + ' + _pendingVidFiles.length + ' pending');
                $(this).val(''); return;
            }
            for (var i = 0; i < files.length; i++) {
                var ext = '.' + files[i].name.split('.').pop().toLowerCase();
                if (_allowedVidExts.indexOf(ext) === -1) {
                    toastr.error('"' + files[i].name + '" — ' + T('part_inventories.invalid_video_format','Only MP4, MOV, AVI, MKV, WebM video formats are allowed.'));
                    continue;
                }
                if (files[i].size > _maxVidSize * 1024 * 1024) {
                    toastr.error('"' + files[i].name + '" ' + T('part_inventories.exceeds_limit','exceeds ') + _maxVidSize + ' MB');
                    continue;
                }
                _pendingVidFiles.push(files[i]);
            }
            $(this).val('');
            _renderVidPreview();
        });

        $(document).on('click', '.btn-remove-pending-vid', function(e) {
            e.preventDefault();
            _pendingVidFiles.splice(parseInt($(this).data('idx')), 1);
            _renderVidPreview();
        });
        $(document).on('click', '.sms-clear-all-pending-vid', function(e) {
            e.preventDefault();
            _pendingVidFiles = [];
            _renderVidPreview();
        });

        $('#btnUploadVideos').on('click', function() {
            if (!_pendingVidFiles.length) { toastr.error(T('part_inventories.select_files', 'Please select files to upload.')); return; }

            var fd = new FormData();
            for (var i = 0; i < _pendingVidFiles.length; i++) {
                fd.append('videos', _pendingVidFiles[i]);
            }

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/part-inventories/' + FD.uuid + '/videos',
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('msg.uploaded', 'Uploaded.'));
                        if (Array.isArray(r.data)) { _videos = r.data; }
                        renderVideoGallery();
                        _pendingVidFiles = [];
                        _renderVidPreview();
                    } else {
                        toastr.error(r.message || T('general.error', 'Error.'));
                    }
                },
                error: function(xhr) {
                    btnReset($btn);
                    var msg = T('general.network_error', 'Network error.');
                    if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                    toastr.error(msg);
                }
            });
        });

        /* Drag & drop reorder videos */
        function initVideoDragDrop() {
            var $cards = $('.pi-video-card');
            var dragSrcEl = null;

            $cards.off('dragstart dragover dragenter dragleave drop dragend');

            $cards.on('dragstart', function(e) {
                dragSrcEl = this;
                $(this).css('opacity', '0.4');
                e.originalEvent.dataTransfer.effectAllowed = 'move';
                e.originalEvent.dataTransfer.setData('text/plain', $(this).data('idx'));
            });

            $cards.on('dragover', function(e) {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
            });

            $cards.on('dragenter', function(e) {
                e.preventDefault();
                $(this).find('.border').addClass('border-primary border-2');
            });

            $cards.on('dragleave', function() {
                $(this).find('.border').removeClass('border-primary border-2');
            });

            $cards.on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).find('.border').removeClass('border-primary border-2');

                if (dragSrcEl === this) return;

                var fromIdx = parseInt($(dragSrcEl).data('idx'));
                var toIdx   = parseInt($(this).data('idx'));

                var moved = _videos.splice(fromIdx, 1)[0];
                _videos.splice(toIdx, 0, moved);
                _vidOrderChanged = true;
                renderVideoGallery();
            });

            $cards.on('dragend', function() {
                $(this).css('opacity', '1');
                $('.pi-video-card .border').removeClass('border-primary border-2');
            });
        }

        /* ══════════════════════════════════════════════════════
           TAB 8: LOCATIONS — Grid with cascade per row (Edit only)
        ══════════════════════════════════════════════════════ */
        var _locations = FD.locations || [];
        var _currentQty = FD.quantity || 1;

        renderLocationGrid();

        /* Listen for quantity change on Tab 2 to re-render location grid */
        $('#fQuantity').on('change', function() {
            var newQty = parseInt($(this).val()) || 1;
            if (newQty < 1) newQty = 1;
            if (newQty !== _currentQty) {
                _currentQty = newQty;
                renderLocationGrid();
            }
        });

        function renderLocationGrid() {
            var $body = $('#locationGridBody');
            if (!$body.length) return;
            $('#locationCount').text(_currentQty);

            var html = '';
            for (var i = 0; i < _currentQty; i++) {
                var loc = _locations[i] || {};
                var unitNum = i + 1;
                var locCode = loc.location_code || '';
                var unitStatus = parseInt(loc.unit_status) || 1;
                var unitNotes = loc.notes || '';
                html += '<tr class="loc-row" data-row="' + i + '">' +
                    '<td class="text-center fw-semibold">' + unitNum + '</td>' +
                    '<td><select class="form-select form-select-sm loc-warehouse" data-row="' + i + '" style="width:100%;"></select></td>' +
                    '<td><select class="form-select form-select-sm loc-zone" data-row="' + i + '" style="width:100%;"></select></td>' +
                    '<td><select class="form-select form-select-sm loc-shelf" data-row="' + i + '" style="width:100%;"></select></td>' +
                    '<td><select class="form-select form-select-sm loc-rack" data-row="' + i + '" style="width:100%;"></select></td>' +
                    '<td><select class="form-select form-select-sm loc-bin" data-row="' + i + '" style="width:100%;"></select></td>' +
                    '<td><input type="text" class="form-control form-control-sm loc-code" data-row="' + i + '" value="' + H.esc(locCode) + '" readonly style="background:#f8f9fa;"/></td>' +
                    '<td><select class="form-select form-select-sm loc-status" data-row="' + i + '">' +
                    '<option value="1"' + (unitStatus === 1 ? ' selected' : '') + '>' + T('part_inventories.available','Available') + '</option>' +
                    '<option value="2"' + (unitStatus === 2 ? ' selected' : '') + '>' + T('part_inventories.reserved','Reserved') + '</option>' +
                    '<option value="3"' + (unitStatus === 3 ? ' selected' : '') + '>' + T('part_inventories.sold','Sold') + '</option>' +
                    '</select></td>' +
                    '<td><input type="text" class="form-control form-control-sm loc-notes" data-row="' + i + '" value="' + H.esc(unitNotes) + '" placeholder="' + T('part_inventories.notes_field','Notes') + '"/></td>' +
                    '</tr>';
            }
            $body.html(html);

            // Initialize Select2 for each row
            for (var j = 0; j < _currentQty; j++) {
                _initLocRow(j, _locations[j] || {});
            }
        }

        function _initLocRow(rowIdx, locData) {
            var rSel = '[data-row="' + rowIdx + '"]';

            // Warehouse
            var $wh = $('.loc-warehouse' + rSel);
            $wh.select2({
                placeholder: T('part_inventories.warehouse','Warehouse'), allowClear: true, width: '100%',
                ajax: { url: BASE_URL + '/warehouses/autocomplete', dataType: 'json', delay: 300,
                    data: function(p) { return { q: p.term || '', limit: 50 }; },
                    processResults: function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name || '' }; }) }; },
                    cache: false
                }, minimumInputLength: 0
            });
            if (locData.warehouse_id && locData.warehouse_name) {
                $wh.append(new Option(locData.warehouse_name, locData.warehouse_id, true, true)).trigger('change');
            }

            // Zone
            var $zn = $('.loc-zone' + rSel);
            $zn.select2({
                placeholder: T('part_inventories.zone','Zone'), allowClear: true, width: '100%',
                ajax: { url: BASE_URL + '/warehouse-zones/autocomplete', dataType: 'json', delay: 300,
                    data: function(p) { var d = { q: p.term || '', limit: 50 }; var wid = $('.loc-warehouse[data-row="' + rowIdx + '"]').val(); if (wid) d.warehouse_id = wid; return d; },
                    processResults: function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name || '' }; }) }; },
                    cache: false
                }, minimumInputLength: 0
            });
            if (locData.zone_id && locData.zone_name) {
                $zn.append(new Option(locData.zone_name, locData.zone_id, true, true)).trigger('change');
            }

            // Shelf
            var $sh = $('.loc-shelf' + rSel);
            $sh.select2({
                placeholder: T('part_inventories.shelf','Shelf'), allowClear: true, width: '100%',
                ajax: { url: BASE_URL + '/warehouse-shelves/autocomplete', dataType: 'json', delay: 300,
                    data: function(p) { var d = { q: p.term || '', limit: 50 }; var zid = $('.loc-zone[data-row="' + rowIdx + '"]').val(); if (zid) d.zone_id = zid; return d; },
                    processResults: function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name || '' }; }) }; },
                    cache: false
                }, minimumInputLength: 0
            });
            if (locData.shelf_id && locData.shelf_name) {
                $sh.append(new Option(locData.shelf_name, locData.shelf_id, true, true)).trigger('change');
            }

            // Rack
            var $rk = $('.loc-rack' + rSel);
            $rk.select2({
                placeholder: T('part_inventories.rack','Rack'), allowClear: true, width: '100%',
                ajax: { url: BASE_URL + '/warehouse-racks/autocomplete', dataType: 'json', delay: 300,
                    data: function(p) { var d = { q: p.term || '', limit: 50 }; var sid = $('.loc-shelf[data-row="' + rowIdx + '"]').val(); if (sid) d.shelf_id = sid; return d; },
                    processResults: function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name || '' }; }) }; },
                    cache: false
                }, minimumInputLength: 0
            });
            if (locData.rack_id && locData.rack_name) {
                $rk.append(new Option(locData.rack_name, locData.rack_id, true, true)).trigger('change');
            }

            // Bin
            var $bn = $('.loc-bin' + rSel);
            $bn.select2({
                placeholder: T('part_inventories.bin','Bin'), allowClear: true, width: '100%',
                ajax: { url: BASE_URL + '/warehouse-bins/autocomplete', dataType: 'json', delay: 300,
                    data: function(p) { var d = { q: p.term || '', limit: 50 }; var rid = $('.loc-rack[data-row="' + rowIdx + '"]').val(); if (rid) d.rack_id = rid; return d; },
                    processResults: function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name || '' }; }) }; },
                    cache: false
                }, minimumInputLength: 0
            });
            if (locData.bin_id && locData.bin_name) {
                $bn.append(new Option(locData.bin_name, locData.bin_id, true, true)).trigger('change');
            }

            // Cascade: warehouse change clears zone/shelf/rack/bin in this row
            $wh.on('change', function() {
                $zn.val(null).trigger('change.select2');
                $sh.val(null).trigger('change.select2');
                $rk.val(null).trigger('change.select2');
                $bn.val(null).trigger('change.select2');
                _updateLocCode(rowIdx);
            });
            $zn.on('change', function() {
                $sh.val(null).trigger('change.select2');
                $rk.val(null).trigger('change.select2');
                $bn.val(null).trigger('change.select2');
                _updateLocCode(rowIdx);
            });
            $sh.on('change', function() {
                $rk.val(null).trigger('change.select2');
                $bn.val(null).trigger('change.select2');
                _updateLocCode(rowIdx);
            });
            $rk.on('change', function() {
                $bn.val(null).trigger('change.select2');
                _updateLocCode(rowIdx);
            });
            $bn.on('change', function() {
                _updateLocCode(rowIdx);
            });
        }

        /* Auto-compute location code from selected names */
        function _updateLocCode(rowIdx) {
            var rSel = '[data-row="' + rowIdx + '"]';
            var parts = [];
            var whText = $('.loc-warehouse' + rSel).find(':selected').text();
            var znText = $('.loc-zone' + rSel).find(':selected').text();
            var shText = $('.loc-shelf' + rSel).find(':selected').text();
            var rkText = $('.loc-rack' + rSel).find(':selected').text();
            var bnText = $('.loc-bin' + rSel).find(':selected').text();
            if (whText && whText.indexOf('Warehouse') === -1 && whText.indexOf('--') === -1) parts.push(whText);
            if (znText && znText.indexOf('Zone') === -1 && znText.indexOf('--') === -1) parts.push(znText);
            if (shText && shText.indexOf('Shelf') === -1 && shText.indexOf('--') === -1) parts.push(shText);
            if (rkText && rkText.indexOf('Rack') === -1 && rkText.indexOf('--') === -1) parts.push(rkText);
            if (bnText && bnText.indexOf('Bin') === -1 && bnText.indexOf('--') === -1) parts.push(bnText);
            $('.loc-code' + rSel).val(parts.join('-'));
        }

        /* Save Locations — bulk save all rows */
        $(document).on('click', '#btnSaveLocations', function(e) {
            e.preventDefault();
            var rows = [];
            for (var i = 0; i < _currentQty; i++) {
                var rSel = '[data-row="' + i + '"]';
                var whVal = $('.loc-warehouse' + rSel).val();
                rows.push({
                    unit_number: i + 1,
                    warehouse_id: whVal || null,
                    zone_id: $('.loc-zone' + rSel).val() || null,
                    shelf_id: $('.loc-shelf' + rSel).val() || null,
                    rack_id: $('.loc-rack' + rSel).val() || null,
                    bin_id: $('.loc-bin' + rSel).val() || null,
                    location_code: $('.loc-code' + rSel).val() || null,
                    unit_status: parseInt($('.loc-status' + rSel).val()) || 1,
                    notes: $('.loc-notes' + rSel).val() || null
                });
            }

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/part-inventories/' + FD.uuid + '/locations/bulk',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ locations: rows }),
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('part_inventories.locations_saved','Locations saved.'));
                        if (Array.isArray(r.data)) {
                            _locations = r.data;
                        }
                    } else {
                        toastr.error(r.message || T('general.error','Error.'));
                    }
                },
                error: function(xhr) {
                    btnReset($btn);
                    toastr.error(xhr.responseJSON ? xhr.responseJSON.message : T('general.network_error','Network error.'));
                }
            });
        });

        /* Load existing locations from server if not in FD */
        if (!_locations.length && FD.uuid) {
            $.get(BASE_URL + '/part-inventories/' + FD.uuid + '/locations', function(res) {
                if (res && res.status === 200 && Array.isArray(res.data)) {
                    _locations = res.data;
                    renderLocationGrid();
                }
            });
        }

    } /* end if (FD.isEdit) */

    /* ══════════════════════════════════════════════════════
       PRE-FILL FROM VEHICLE — if URL has ?vehicle_id=UUID (direct mode)
    ══════════════════════════════════════════════════════ */
    if (FD.vehicleId && !FD.isEdit) {
        // Show the vehicle inventory select section
        $('#sectionVehicleInventorySelect').show();
    }

});
