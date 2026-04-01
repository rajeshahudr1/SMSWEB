/* vehicle-inventories-form.js — 6-tab form */
'use strict';

$(function() {
    var FD = window._FORM_DATA || {};
    var T  = function(k, f) { return typeof SMS_T === 'function' ? SMS_T(k, f) : (f || k); };

    /* ══════════════════════════════════════════════════════
       AUTO COLLAPSIBLE SECTIONS — convert all .section-card to collapse
    ══════════════════════════════════════════════════════ */
    $('.section-card').each(function(i) {
        var $card = $(this);
        var $header = $card.find('.card-header').first();
        var $body = $card.find('.card-body').first();
        var colId = 'secCollapse_' + i;
        // Wrap body in collapse div
        $body.wrap('<div class="collapse show" id="' + colId + '"></div>');
        // Make header toggle
        $header.attr({ 'data-bs-toggle': 'collapse', 'data-bs-target': '#' + colId, 'aria-expanded': 'true' });
        // Add arrow icon
        $header.find('.card-title').append(' <i class="bi bi-chevron-down collapse-arrow ms-auto"></i>');
    });

    /* Expand All / Collapse All buttons — add to each tab */
    $('.tab-pane').each(function() {
        var $pane = $(this);
        var cards = $pane.find('.section-card');
        if (cards.length < 2) return; // no need for single card
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

    /* Enum maps */
    var INV_STATUS  = {1:'In Stock', 2:'Out of Stock', 3:'Sent to Wastage'};
    var DEP_STATUS  = {1:'Pending', 2:'In Depollution', 3:'Depolluted'};
    var DIS_STATUS  = {1:'Pending', 2:'In Dismantling', 3:'Dismantled'};
    var PARK_STATUS = {1:'With Declaration', 2:'With Certificate', 3:'Pending to Accept'};
    var DOC_TYPES   = {1:'Citizen Card', 2:'Certificate', 3:'Single Car', 4:'Model IMTT', 5:'Chassis Number', 6:'Tax Authority File', 7:'Other File'};
    var DOC_COLORS  = {1:'info', 2:'success', 3:'warning', 4:'purple', 5:'primary', 6:'secondary', 7:'dark'};

    /* ══════════════════════════════════════════════════════
       SELECT2 AJAX AUTOCOMPLETE — with dependent cascading
    ══════════════════════════════════════════════════════ */
    var _autoFilling = false;

    function _s2(sel, url, ph, existing, extraDataFn, processResultsFn) {
        $(sel).select2({
            placeholder: ph, allowClear: true, width: '100%',
            ajax: { url: BASE_URL + url, dataType: 'json', delay: 300,
                data: function(p) { var d = { search: p.term || '', limit: 50 }; if (extraDataFn) $.extend(d, extraDataFn()); return d; },
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

    // Independent dropdowns
    _s2('#selVehicleType', '/vehicle-types/autocomplete', 'Search Type...', FD.vehicleType);
    _s2('#selVehicleYear', '/vehicle-years/autocomplete', 'Search Year...', FD.vehicleYear);
    _s2('#selVehicleFuel', '/vehicle-fuels/autocomplete', 'Search Fuel...', FD.vehicleFuel);
    _s2('#selVehicleCategory', '/vehicle-categories/autocomplete', 'Search Category...', FD.vehicleCategory);

    // Dependent: Make filtered by Type
    _s2('#selVehicleMake', '/vehicle-makes/autocomplete', 'Search Make...', FD.vehicleMake, function() {
        var tid = $('#selVehicleType').val(); return tid ? { vehicle_type_id: tid } : {};
    }, function(res) { return { results: (res.data||[]).map(function(r) { return { id: r.id, text: r.name, vehicle_type_id: r.vehicle_type_id, vehicle_type_name: r.vehicle_type_name }; }) }; });

    // Dependent: Model filtered by Make (+ Type)
    _s2('#selVehicleModel', '/vehicle-models/autocomplete', 'Search Model...', FD.vehicleModel, function() {
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
    _s2('#selVehicleVariant', '/vehicle-variants/autocomplete', 'Search Variant...', FD.vehicleVariant, function() {
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
    _s2('#selVehicleEngine', '/vehicle-engines/autocomplete', 'Search Engine...', FD.vehicleEngine, function() {
        var d = {};
        var vid = $('#selVehicleVariant').val(); if (vid) d.vehicle_variant_id = vid;
        return d;
    });

    /* ── Forward cascade: clear children when parent changes ── */
    $('#selVehicleType').on('change', function() { if (!_autoFilling) { $('#selVehicleMake').val(null).trigger('change.select2'); $('#selVehicleModel').val(null).trigger('change.select2'); $('#selVehicleVariant').val(null).trigger('change.select2'); $('#selVehicleEngine').val(null).trigger('change.select2'); } });
    $('#selVehicleMake').on('change', function() { if (!_autoFilling) { $('#selVehicleModel').val(null).trigger('change.select2'); $('#selVehicleVariant').val(null).trigger('change.select2'); $('#selVehicleEngine').val(null).trigger('change.select2'); } });
    $('#selVehicleModel').on('change', function() { if (!_autoFilling) { $('#selVehicleVariant').val(null).trigger('change.select2'); $('#selVehicleEngine').val(null).trigger('change.select2'); } });
    $('#selVehicleVariant').on('change', function() { if (!_autoFilling) { $('#selVehicleEngine').val(null).trigger('change.select2'); } });

    /* ── Reverse auto-fill: selecting child fills parent ── */
    // Make selected → auto-fill Type
    $('#selVehicleMake').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        if (d.vehicle_type_id && d.vehicle_type_name) { _autoFilling = true; _setS2('#selVehicleType', d.vehicle_type_id, d.vehicle_type_name); setTimeout(function() { _autoFilling = false; }, 100); }
    });

    // Model selected → auto-fill Make, Type, Year
    $('#selVehicleModel').on('select2:select', function(e) {
        var d = e.params.data; if (!d || _autoFilling) return;
        _autoFilling = true;
        if (d.vehicle_type_id && d.vehicle_type_name) _setS2('#selVehicleType', d.vehicle_type_id, d.vehicle_type_name);
        setTimeout(function() {
            if (d.vehicle_make_id && d.vehicle_make_name) _setS2('#selVehicleMake', d.vehicle_make_id, d.vehicle_make_name);
            setTimeout(function() {
                if (d.vehicle_year_id && d.vehicle_year_name) _setS2('#selVehicleYear', d.vehicle_year_id, d.vehicle_year_name);
                _autoFilling = false;
                toastr.info(T('vehicle_inventories.auto_filled', 'Type, Make & Year auto-filled from Model'));
            }, 50);
        }, 50);
    });

    // Variant selected → auto-fill Model, Make, Type, Year
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
                    toastr.info(T('vehicle_inventories.auto_filled_variant', 'Type, Make, Model & Year auto-filled from Variant'));
                }, 50);
            }, 50);
        }, 50);
    });

    /* ══════════════════════════════════════════════════════
       OWNER COUNTRY — Load all countries (not autocomplete)
    ══════════════════════════════════════════════════════ */
    (function loadCountries() {
        var $sel = $('#selOwnerCountry');
        if (!$sel.length) return;
        $sel.html('<option value="">-- ' + T('general.select', 'Select') + ' --</option>');
        $.get(BASE_URL + '/locations/countries', function(res) {
            var list = res.data || res || [];
            if (Array.isArray(list)) {
                list.forEach(function(c) {
                    var id   = c.id || c.country_id || '';
                    var name = c.name || c.country_name || '';
                    var selected = (FD.ownerCountry && String(FD.ownerCountry.id) === String(id)) ? ' selected' : '';
                    $sel.append('<option value="' + id + '"' + selected + '>' + H.esc(name) + '</option>');
                });
            }
        });
    })();

    /* ══════════════════════════════════════════════════════
       DATE VALIDATIONS
    ══════════════════════════════════════════════════════ */
    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    $('#fProcessStartDate').on('change', function() {
        var val = $(this).val();
        if (!FD.isEdit && val && val < todayStr()) {
            toastr.error(T('vehicle_inventories.start_date_past', 'Process Start Date cannot be before today.'));
            $(this).val('');
        }
        // If end date is set and is before start date, clear it
        var endVal = $('#fProcessEndDate').val();
        if (val && endVal && endVal < val) {
            $('#fProcessEndDate').val('');
        }
    });

    $('#fProcessEndDate').on('change', function() {
        var val = $(this).val();
        var startVal = $('#fProcessStartDate').val();
        if (val && startVal && val < startVal) {
            toastr.error(T('vehicle_inventories.end_date_before_start', 'Process End Date must be on or after Process Start Date.'));
            $(this).val('');
        }
    });

    /* ══════════════════════════════════════════════════════
       FORM SUBMIT — Collect all 6 tabs into JSON, POST via AJAX
    ══════════════════════════════════════════════════════ */
    /* ══════════════════════════════════════════════════════
       HELPER: Save data for a specific tab
    ══════════════════════════════════════════════════════ */
    function _saveTab(btnSelector, collectFn, successMsg) {
        var $btn = $(btnSelector);
        var data = collectFn();
        if (data === false) return; // validation failed

        // Add status on edit
        if (FD.isEdit) data.status = $('select[name="status"]').val() || '1';

        var formAction = $('#frmVehicleInventory').attr('action');
        btnLoading($btn);
        $.ajax({
            url: BASE_URL + formAction, type: 'POST', contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(r) {
                btnReset($btn);
                if (r.status === 200 || r.status === 201) {
                    toastr.success(r.message || successMsg || 'Saved.');
                    if (!FD.isEdit && r.data && r.data.uuid) {
                        // First save → redirect to edit page (unlocks all tabs)
                        setTimeout(function() { window.location = BASE_URL + '/vehicle-inventories/' + r.data.uuid + '/edit'; }, 600);
                    }
                } else toastr.error(r.message || 'Error.');
            },
            error: function(xhr) { btnReset($btn); toastr.error(xhr.responseJSON ? xhr.responseJSON.message : 'Network error.'); }
        });
    }

    /* ── Tab 1: Vehicle Info — collect + validate ── */
    function _collectTab1() {
        if (!$('#selVehicleType').val()) { toastr.error(T('vehicle_inventories.vehicle_type_required', 'Vehicle Type is required.')); $('#selVehicleType').select2('open'); return false; }
        if (!$('#selVehicleYear').val()) { toastr.error(T('vehicle_inventories.vehicle_year_required', 'Vehicle Year is required.')); $('#selVehicleYear').select2('open'); return false; }
        if (!$('#selVehicleMake').val()) { toastr.error(T('vehicle_inventories.vehicle_make_required', 'Vehicle Make is required.')); $('#selVehicleMake').select2('open'); return false; }
        if (!$('#selVehicleModel').val()) { toastr.error(T('vehicle_inventories.vehicle_model_required', 'Vehicle Model is required.')); $('#selVehicleModel').select2('open'); return false; }
        if (!$('#selVehicleVariant').val()) { toastr.error(T('vehicle_inventories.vehicle_variant_required', 'Vehicle Variant is required.')); $('#selVehicleVariant').select2('open'); return false; }
        var sd = $('#fProcessStartDate').val(), ed = $('#fProcessEndDate').val();
        if (!FD.isEdit && sd && sd < todayStr()) { toastr.error(T('vehicle_inventories.start_date_past', 'Start Date cannot be before today.')); return false; }
        if (sd && ed && ed < sd) { toastr.error(T('vehicle_inventories.end_date_before_start', 'End Date must be after Start Date.')); return false; }
        return {
            vehicle_type_id: $('#selVehicleType').val()||'', vehicle_year_id: $('#selVehicleYear').val()||'',
            vehicle_make_id: $('#selVehicleMake').val()||'', vehicle_model_id: $('#selVehicleModel').val()||'',
            vehicle_variant_id: $('#selVehicleVariant').val()||'', vehicle_engine_id: $('#selVehicleEngine').val()||'',
            vehicle_fuel_id: $('#selVehicleFuel').val()||'', vehicle_category_id: $('#selVehicleCategory').val()||'',
            registration_plate_no: $('#fRegistrationPlateNo').val()||'', registration_no: $('#fRegistrationNo').val()||'',
            process_start_date: sd||'', process_end_date: ed||'',
            vehicle_vin: $('#fVehicleVin').val()||'', certificate_number: $('#fCertificateNumber').val()||'',
            brand: $('#fBrand').val()||'', booklet_model: $('#fBookletModel').val()||'',
            vehicle_model_text: $('#fVehicleModelText').val()||'', vehicle_tare: $('#fVehicleTare').val()||'',
            vehicle_year_text: $('#fVehicleYearText').val()||'', vehicle_kms: $('#fVehicleKms').val()||'',
            vehicle_doors: $('#selVehicleDoors').val()||'', vehicle_approval: $('#fVehicleApproval').val()||'',
            vehicle_total_gross_weight: $('#fVehicleTotalGrossWeight').val()||'',
            vehicle_parts: $('#fVehicleParts').val()||'', vehicle_color: $('#fVehicleColor').val()||'',
            vehicle_eei: $('#fVehicleEei').val()||'',
            vehicle_internal_reference: $('#fVehicleInternalReference').val()||'',
            vehicle_external_reference: $('#fVehicleExternalReference').val()||'',
            vehicle_experience_value: $('#fVehicleExperienceValue').val()||'',
            vehicle_provenance: $('#fVehicleProvenance').val()||'',
            motorization: $('#fMotorization').val()||'', ccm3: $('#fCcm3').val()||'',
            power_kw: $('#fPowerKw').val()||'', hp: $('#fHp').val()||'',
            vehicle_cylinder: $('#fVehicleCylinder').val()||'',
            inventory_status: $('#selInventoryStatus').val()||'', depolution_status: $('#selDepolutionStatus').val()||'',
            dismantle_status: $('#selDismantleStatus').val()||'', state_parking: $('#selStateParking').val()||'',
            steering_wheel_side: $('input[name="steering_wheel_side"]:checked').val()||'',
            decontamination_date: $('#fDecontaminationDate').val()||'', vehicle_arrival_date: $('#fVehicleArrivalDate').val()||'',
            sent_to_waste_date: $('#fSentToWasteDate').val()||'', neutralization_date: $('#fNeutralizationDate').val()||'',
        };
    }

    /* ── Tab 2: Extra Info — collect ── */
    function _collectTab2() {
        return {
            tires_front: $('#fTiresFront').val()||'', tires_rear: $('#fTiresRear').val()||'',
            max_weight_front: $('#fMaxWeightFront').val()||'', max_weight_rear: $('#fMaxWeightRear').val()||'',
            power_lifting: $('#fPowerLifting').val()||'', box_type: $('#fBoxType').val()||'',
            comp_max_box: $('#fCompMaxBox').val()||'', box_width: $('#fBoxWidth').val()||'',
            axel_distance: $('#fAxelDistance').val()||'', co2_gkm: $('#fCo2Gkm').val()||'',
            particles_gkm: $('#fParticlesGkm').val()||'',
            no_of_right_doors: $('#fNoOfRightDoors').val()||'', no_of_left_doors: $('#fNoOfLeftDoors').val()||'',
            no_of_rear_doors: $('#fNoOfRearDoors').val()||'', capacity: $('#fCapacity').val()||'',
            previous_registration: $('#fPreviousRegistration').val()||'',
            registration_date: $('#fRegistrationDate').val()||'',
            origin_country: $('#fOriginCountry').val()||'', origin_state: $('#fOriginState').val()||'',
            comments: $('#fComments').val()||'', special_notes: $('#fSpecialNotes').val()||'',
            brake_option: $('input[name="brake_option"]:checked').val()||'',
            is_towable: $('#fIsTowable').is(':checked') ? 1 : 0,
        };
    }

    /* ── Tab 5: Owner — collect ── */
    function _collectTab5() {
        var email = $('#fOwnerEmail').val()||'';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toastr.error('Invalid email.'); return false; }
        return {
            owner_name: $('#fOwnerName').val()||'', owner_certificate_number: $('#fOwnerCertificateNumber').val()||'',
            owner_postal_code: $('#fOwnerPostalCode').val()||'', owner_country_id: $('#selOwnerCountry').val()||'',
            owner_nif: $('#fOwnerNif').val()||'', owner_bicc: $('#fOwnerBicc').val()||'',
            owner_telephone: $('#fOwnerTelephone').val()||'', owner_cellphone: $('#fOwnerCellphone').val()||'',
            owner_email: email, owner_company_certificate_code: $('#fOwnerCompanyCertificateCode').val()||'',
            owner_validity: $('#fOwnerValidity').val()||'', owner_address: $('#fOwnerAddress').val()||'',
        };
    }

    /* ── Button handlers ── */
    // Prevent form submit (each tab saves independently)
    $('#frmVehicleInventory').on('submit', function(e) { e.preventDefault(); });

    // Tab 1 save (Create on add, Save on edit)
    $(document).on('click', '#btnSubmitTab1', function(e) { e.preventDefault(); _saveTab('#btnSubmitTab1', _collectTab1, T('vehicle_inventories.vehicle_info_saved','Vehicle info saved.')); });
    // Tab 2 save
    $(document).on('click', '#btnSubmitTab2', function(e) { e.preventDefault(); _saveTab('#btnSubmitTab2', _collectTab2, T('vehicle_inventories.extra_info_saved','Extra info saved.')); });
    // Tab 5 save
    $(document).on('click', '#btnSubmitTab5', function(e) { e.preventDefault(); _saveTab('#btnSubmitTab5', _collectTab5, T('vehicle_inventories.owner_saved','Owner info saved.')); });

    /* ══════════════════════════════════════════════════════
       LOAD SETTINGS (max sizes/counts from company settings)
    ══════════════════════════════════════════════════════ */
    var _maxImgSize = 5, _maxVidSize = 50, _maxImgCount = 20, _maxVidCount = 10;
    if (FD.isEdit) {
        $.get(BASE_URL + '/vehicle-inventories/settings', function(res) {
            if (res && res.status === 200 && res.data) {
                _maxImgSize = res.data.max_image_size || 5;
                _maxVidSize = res.data.max_video_size || 50;
                _maxImgCount = res.data.max_image_count || 20;
                _maxVidCount = res.data.max_video_count || 10;
            }
        });
    }

    /* ══════════════════════════════════════════════════════
       TAB 3: IMAGES — Gallery, Upload, Delete, Reorder, Preview (Edit only)
    ══════════════════════════════════════════════════════ */
    if (FD.isEdit) {
        var _images = FD.images || [];
        var _imgOrderChanged = false;
        renderImageGallery();

        // Save image order button
        $(document).on('click', '#btnSaveImageOrder', function() {
            var orderedIds = _images.map(function(img) { return img.id || img.image_id; });
            var $btn = $(this); btnLoading($btn);
            $.ajax({ url: BASE_URL + '/vehicle-inventories/' + FD.uuid + '/images/reorder', type: 'POST',
                contentType: 'application/json', data: JSON.stringify({ order: orderedIds }),
                success: function(r) { btnReset($btn); if (r.status === 200) { toastr.success(T('vehicle_inventories.order_saved','Order saved.')); _imgOrderChanged = false; $('#btnSaveImageOrder').addClass('d-none'); } else toastr.error(r.message); },
                error: function() { btnReset($btn); toastr.error('Error.'); }
            });
        });

        function renderImageGallery() {
            var $grid = $('#imageGalleryGrid');
            if (!$grid.length) return;
            $('#imageGalleryCount').text(_images.length);

            if (!_images.length) {
                $grid.html('<div class="text-muted small text-center py-3 w-100">' + T('vehicle_inventories.no_images', 'No images uploaded yet.') + '</div>');
                return;
            }

            var html = '';
            _images.forEach(function(img, idx) {
                var imgUrl = img.display_url || img.image_url || img.url || '';
                var imgId  = img.id || img.image_id || '';
                html += '<div class="col-6 col-sm-4 col-md-3 vi-image-card" draggable="true" data-id="' + imgId + '" data-idx="' + idx + '">' +
                    '<div class="border rounded p-1 text-center position-relative" style="cursor:grab;">' +
                    '<img src="' + H.esc(imgUrl) + '" class="rounded vi-preview-img" data-idx="' + idx + '" style="width:100%;height:100px;object-fit:cover;cursor:pointer;" onerror="this.src=\'/images/no-image.svg\';" title="' + T('general.click_preview','Click to preview') + '"/>' +
                    '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 btn-delete-vi-image" data-id="' + imgId + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;"><i class="bi bi-trash3"></i></button>' +
                    '<div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-grip-vertical"></i> ' + T('general.drag_to_reorder', 'Drag') + '</div>' +
                    '</div></div>';
            });
            // Show Save Order button if order changed
            if (_imgOrderChanged) html += '<div class="col-12 mt-2"><button type="button" class="btn btn-sm btn-warning" id="btnSaveImageOrder"><i class="bi bi-arrows-move me-1"></i>' + T('vehicle_inventories.save_order','Save Order') + '</button></div>';
            $grid.html(html);
            initImageDragDrop();
        }

        /* Image preview modal */
        $(document).on('click', '.vi-preview-img', function(e) {
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
            h += '<button class="btn btn-sm btn-outline-secondary" id="btnPrevMedia" data-type="' + type + '" data-idx="' + (idx-1) + '" ' + (idx <= 0 ? 'disabled' : '') + '><i class="bi bi-chevron-left me-1"></i>' + T('general.previous','Previous') + '</button>';
            h += '<span class="text-muted small align-self-center">' + (idx+1) + ' / ' + arr.length + '</span>';
            h += '<button class="btn btn-sm btn-outline-secondary" id="btnNextMedia" data-type="' + type + '" data-idx="' + (idx+1) + '" ' + (idx >= arr.length - 1 ? 'disabled' : '') + '>' + T('general.next','Next') + '<i class="bi bi-chevron-right ms-1"></i></button>';
            h += '</div>';
            $('#viewBody').html(h);
            bootstrap.Modal.getOrCreateInstance($('#modalView')[0]).show();
        }
        $(document).on('click', '#btnPrevMedia, #btnNextMedia', function() {
            var type = $(this).data('type');
            var idx = parseInt($(this).data('idx'));
            _showPreview(type, idx);
        });

        /* Delete image */
        $(document).on('click', '.btn-delete-vi-image', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var imageId = $(this).data('id');
            if (!imageId) return;
            deleteViImage(imageId);
        });

        function deleteViImage(imageId) {
            smsConfirm({
                icon: '\uD83D\uDDD1\uFE0F',
                title: T('general.delete', 'Delete'),
                msg: T('vehicle_inventories.delete_image_confirm', 'Are you sure you want to delete this image?'),
                btnClass: 'btn-danger',
                btnText: T('btn.delete', 'Delete'),
                onConfirm: function() {
                    showLoading();
                    $.post(BASE_URL + '/vehicle-inventories/' + FD.uuid + '/images/delete', { image_id: imageId }, function(r) {
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
        }

        /* Upload images */
        var _allowedImgExts = ['.jpg','.jpeg','.png','.gif','.webp'];
        var _allowedVidExts = ['.mp4','.mov','.avi','.mkv','.webm','.wmv','.flv','.m4v'];

        $('#fImages').on('change', function() {
            var files = this.files;
            var $preview = $('#imageUploadPreview');
            $preview.html('');
            if (!files || !files.length) return;
            // Validate count
            if (_images.length + files.length > _maxImgCount) {
                toastr.error(T('vehicle_inventories.max_images_reached', 'Maximum ') + _maxImgCount + T('vehicle_inventories.images_allowed',' images allowed. Currently: ') + _images.length);
                $(this).val(''); return;
            }
            for (var i = 0; i < files.length; i++) {
                // Validate format
                var ext = '.' + files[i].name.split('.').pop().toLowerCase();
                if (_allowedImgExts.indexOf(ext) === -1) {
                    toastr.error('"' + files[i].name + '" — ' + T('vehicle_inventories.invalid_image_format','Only JPG, PNG, GIF, WebP images are allowed.'));
                    $(this).val(''); $preview.html(''); return;
                }
                // Validate size from settings
                if (files[i].size > _maxImgSize * 1024 * 1024) {
                    toastr.error('"' + files[i].name + '" ' + T('vehicle_inventories.exceeds_limit','exceeds ') + _maxImgSize + ' MB');
                    $(this).val(''); $preview.html(''); return;
                }
                (function(file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        $preview.append(
                            '<div class="col-4 col-sm-3"><div class="border rounded p-1 text-center position-relative">' +
                            '<img src="' + e.target.result + '" class="rounded" style="width:100%;height:70px;object-fit:cover;"/>' +
                            '</div></div>'
                        );
                    };
                    reader.readAsDataURL(file);
                })(files[i]);
            }
            // Add clear button
            $preview.append('<div class="col-12 mt-1"><button type="button" class="btn btn-sm btn-outline-danger sms-clear-file-preview" data-input="#fImages" data-preview="#imageUploadPreview"><i class="bi bi-x-lg me-1"></i>' + T('general.clear_all','Clear All') + '</button></div>');
        });

        $('#btnUploadImages').on('click', function() {
            var files = $('#fImages')[0].files;
            if (!files || !files.length) { toastr.error(T('vehicle_inventories.select_files', 'Please select files to upload.')); return; }

            var fd = new FormData();
            for (var i = 0; i < files.length; i++) {
                fd.append('images', files[i]);
            }

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/vehicle-inventories/' + FD.uuid + '/images',
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('msg.uploaded', 'Uploaded.'));
                        // API returns full image list — replace, don't concat
                        if (Array.isArray(r.data)) { _images = r.data; }
                        renderImageGallery();
                        $('#fImages').val('');
                        $('#imageUploadPreview').html('');
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
            var $cards = $('.vi-image-card');
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

                // Reorder in local array only (save via button)
                var moved = _images.splice(fromIdx, 1)[0];
                _images.splice(toIdx, 0, moved);
                _imgOrderChanged = true;
                renderImageGallery();
            });

            $cards.on('dragend', function() {
                $(this).css('opacity', '1');
                $('.vi-image-card .border').removeClass('border-primary border-2');
            });
        }

        /* ══════════════════════════════════════════════════════
           TAB 4: VIDEOS — Gallery, Upload, Delete, Reorder (Edit only)
        ══════════════════════════════════════════════════════ */
        var _videos = FD.videos || [];
        var _vidOrderChanged = false;
        renderVideoGallery();

        // Save video order button
        $(document).on('click', '#btnSaveVideoOrder', function() {
            var orderedIds = _videos.map(function(v) { return v.id || v.video_id; });
            var $btn = $(this); btnLoading($btn);
            $.ajax({ url: BASE_URL + '/vehicle-inventories/' + FD.uuid + '/videos/reorder', type: 'POST',
                contentType: 'application/json', data: JSON.stringify({ order: orderedIds }),
                success: function(r) { btnReset($btn); if (r.status === 200) { toastr.success(T('vehicle_inventories.order_saved','Order saved.')); _vidOrderChanged = false; $('#btnSaveVideoOrder').addClass('d-none'); } else toastr.error(r.message); },
                error: function() { btnReset($btn); toastr.error('Error.'); }
            });
        });

        function renderVideoGallery() {
            var $grid = $('#videoGalleryGrid');
            if (!$grid.length) return;
            $('#videoGalleryCount').text(_videos.length);

            if (!_videos.length) {
                $grid.html('<div class="text-muted small text-center py-3 w-100">' + T('vehicle_inventories.no_videos', 'No videos uploaded yet.') + '</div>');
                return;
            }

            var html = '';
            _videos.forEach(function(vid, idx) {
                var vidUrl = vid.display_url || vid.video_url || vid.url || '';
                var vidId  = vid.id || vid.video_id || '';
                var thumb  = vid.thumbnail_url || '';
                html += '<div class="col-6 col-sm-4 col-md-3 vi-video-card" draggable="true" data-id="' + vidId + '" data-idx="' + idx + '">' +
                    '<div class="border rounded p-1 text-center position-relative" style="cursor:grab;">';
                if (thumb) {
                    html += '<img src="' + H.esc(thumb) + '" class="rounded vi-preview-vid" data-idx="' + idx + '" style="width:100%;height:100px;object-fit:cover;cursor:pointer;" onerror="this.src=\'/images/no-image.svg\';" title="' + T('general.click_preview','Click to preview') + '"/>';
                } else {
                    html += '<div class="d-flex align-items-center justify-content-center rounded bg-light vi-preview-vid" data-idx="' + idx + '" style="width:100%;height:100px;cursor:pointer;" title="' + T('general.click_preview','Click to preview') + '">' +
                        '<i class="bi bi-play-circle" style="font-size:32px;opacity:.5;"></i></div>';
                }
                html += '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 btn-delete-vi-video" data-id="' + vidId + '" style="width:24px;height:24px;padding:0;line-height:24px;font-size:11px;border-radius:50%;"><i class="bi bi-trash3"></i></button>' +
                    '<div class="text-muted mt-1" style="font-size:10px;"><i class="bi bi-grip-vertical"></i> ' + T('general.drag_to_reorder', 'Drag to reorder') + '</div>' +
                    '</div></div>';
            });
            if (_vidOrderChanged) html += '<div class="col-12 mt-2"><button type="button" class="btn btn-sm btn-warning" id="btnSaveVideoOrder"><i class="bi bi-arrows-move me-1"></i>' + T('vehicle_inventories.save_order','Save Order') + '</button></div>';
            $grid.html(html);
            initVideoDragDrop();
        }

        /* Video preview */
        $(document).on('click', '.vi-preview-vid', function(e) {
            e.preventDefault();
            _showPreview('video', parseInt($(this).data('idx')));
        });

        /* Delete video */
        $(document).on('click', '.btn-delete-vi-video', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var videoId = $(this).data('id');
            if (!videoId) return;

            smsConfirm({
                icon: '\uD83D\uDDD1\uFE0F',
                title: T('general.delete', 'Delete'),
                msg: T('vehicle_inventories.delete_video_confirm', 'Are you sure you want to delete this video?'),
                btnClass: 'btn-danger',
                btnText: T('btn.delete', 'Delete'),
                onConfirm: function() {
                    showLoading();
                    $.post(BASE_URL + '/vehicle-inventories/' + FD.uuid + '/videos/delete', { video_id: videoId }, function(r) {
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

        /* Upload videos */
        $('#fVideos').on('change', function() {
            var files = this.files;
            var $preview = $('#videoUploadPreview');
            $preview.html('');
            if (!files || !files.length) return;
            // Validate count
            if (_videos.length + files.length > _maxVidCount) {
                toastr.error(T('vehicle_inventories.max_videos_reached', 'Maximum ') + _maxVidCount + T('vehicle_inventories.videos_allowed',' videos allowed. Currently: ') + _videos.length);
                $(this).val(''); return;
            }
            for (var i = 0; i < files.length; i++) {
                // Validate format
                var ext = '.' + files[i].name.split('.').pop().toLowerCase();
                if (_allowedVidExts.indexOf(ext) === -1) {
                    toastr.error('"' + files[i].name + '" — ' + T('vehicle_inventories.invalid_video_format','Only MP4, MOV, AVI, MKV, WebM video formats are allowed.'));
                    $(this).val(''); $preview.html(''); return;
                }
                // Validate size from settings
                if (files[i].size > _maxVidSize * 1024 * 1024) {
                    toastr.error('"' + files[i].name + '" ' + T('vehicle_inventories.exceeds_limit','exceeds ') + _maxVidSize + ' MB');
                    $(this).val(''); $preview.html(''); return;
                }
                $preview.append(
                    '<div class="col-4 col-sm-3"><div class="border rounded p-2 text-center">' +
                    '<i class="bi bi-camera-video d-block" style="font-size:24px;opacity:.5;"></i>' +
                    '<div class="text-muted text-truncate" style="font-size:10px;">' + H.esc(files[i].name) + '</div>' +
                    '</div></div>'
                );
            }
            // Add clear button
            $preview.append('<div class="col-12 mt-1"><button type="button" class="btn btn-sm btn-outline-danger sms-clear-file-preview" data-input="#fVideos" data-preview="#videoUploadPreview"><i class="bi bi-x-lg me-1"></i>' + T('general.clear_all','Clear All') + '</button></div>');
        });

        $('#btnUploadVideos').on('click', function() {
            var files = $('#fVideos')[0].files;
            if (!files || !files.length) { toastr.error(T('vehicle_inventories.select_files', 'Please select files to upload.')); return; }

            var fd = new FormData();
            for (var i = 0; i < files.length; i++) {
                fd.append('videos', files[i]);
            }

            var $btn = $(this);
            btnLoading($btn);
            $.ajax({
                url: BASE_URL + '/vehicle-inventories/' + FD.uuid + '/videos',
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('msg.uploaded', 'Uploaded.'));
                        // API returns full video list — replace, don't concat
                        if (Array.isArray(r.data)) { _videos = r.data; }
                        renderVideoGallery();
                        $('#fVideos').val('');
                        $('#videoUploadPreview').html('');
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
            var $cards = $('.vi-video-card');
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
                $('.vi-video-card .border').removeClass('border-primary border-2');
            });
        }

        /* ══════════════════════════════════════════════════════
           TAB 6: DOCUMENTS — Upload, List, Delete (Edit only)
        ══════════════════════════════════════════════════════ */
        var _documents = FD.documents || [];
        renderDocumentList();

        var _docQueue = []; // pending docs to upload

        function renderDocumentList() {
            var $list = $('#documentList');
            if (!$list.length) return;
            $('#documentCount').text(_documents.length);
            if (!_documents.length) {
                $list.html('<div class="text-muted small text-center py-3">' + T('vehicle_inventories.no_documents', 'No documents uploaded yet.') + '</div>');
                return;
            }
            var html = '<table class="table table-sm table-hover mb-0" style="font-size:12px;"><thead><tr><th>Type</th><th>Filename</th><th>Comment</th><th class="text-end">Actions</th></tr></thead><tbody>';
            _documents.forEach(function(doc) {
                var docId = doc.id || ''; var dt = parseInt(doc.document_type) || 0;
                var tn = DOC_TYPES[dt] || 'Unknown'; var tc = DOC_COLORS[dt] || 'secondary';
                var fn = doc.original_name || doc.file_name || ''; var cm = doc.comment || '';
                var vu = doc.display_url || doc.file_url || '';
                html += '<tr><td><span class="badge bg-' + tc + '-lt">' + H.esc(tn) + '</span></td>' +
                    '<td>' + H.esc(fn) + '</td><td class="text-muted">' + H.esc(cm) + '</td>' +
                    '<td class="text-end">' +
                    (vu ? '<a href="' + H.esc(vu) + '" target="_blank" class="btn btn-sm btn-ghost-primary"><i class="bi bi-eye"></i></a>' : '') +
                    '<button type="button" class="btn btn-sm btn-ghost-danger btn-delete-vi-document" data-id="' + docId + '"><i class="bi bi-trash3"></i></button></td></tr>';
            });
            html += '</tbody></table>';
            $list.html(html);
        }

        function renderDocQueue() {
            var $q = $('#docQueue');
            if (!_docQueue.length) { $q.html(''); return; }
            var html = '<div class="small fw-semibold mb-1"><i class="bi bi-hourglass me-1"></i>Pending upload (' + _docQueue.length + '):</div>';
            _docQueue.forEach(function(d, i) {
                var tn = DOC_TYPES[parseInt(d.type)] || 'Unknown';
                html += '<div class="d-flex align-items-center gap-2 border rounded px-2 py-1 mb-1" style="font-size:12px;">' +
                    '<span class="badge bg-secondary-lt">' + H.esc(tn) + '</span>' +
                    '<span class="text-truncate flex-grow-1">' + H.esc(d.file.name) + '</span>' +
                    '<span class="text-muted">' + H.esc(d.comment || '') + '</span>' +
                    '<button type="button" class="btn btn-sm btn-ghost-danger p-0 doc-q-remove" data-i="' + i + '" style="width:22px;height:22px;"><i class="bi bi-x-lg" style="font-size:10px;"></i></button></div>';
            });
            $q.html(html);
        }

        // Remove from queue
        $(document).on('click', '.doc-q-remove', function() {
            _docQueue.splice(parseInt($(this).data('i')), 1);
            renderDocQueue();
        });

        // Add to queue
        $('#btnAddDocToQueue').on('click', function() {
            var docType = $('#selDocumentType').val();
            var file = $('#fDocumentFile')[0].files[0];
            var comment = $('#txtDocumentComment').val() || '';
            if (!docType) { toastr.error(T('vehicle_inventories.select_document_type', 'Select a document type.')); return; }
            if (!file) { toastr.error(T('vehicle_inventories.select_document_file', 'Select a file.')); return; }
            // Validate: types 1-6 only one allowed (check existing docs + queue)
            var dt = parseInt(docType);
            if (dt !== 7) {
                var existsInDocs = _documents.some(function(d) { return parseInt(d.document_type) === dt; });
                var existsInQueue = _docQueue.some(function(d) { return parseInt(d.type) === dt; });
                if (existsInDocs) { toastr.error(DOC_TYPES[dt] + ' ' + T('vehicle_inventories.already_uploaded', 'already exists. Delete the existing one first.')); return; }
                if (existsInQueue) { toastr.error(DOC_TYPES[dt] + ' ' + T('vehicle_inventories.already_in_queue', 'is already in the queue.')); return; }
            }
            _docQueue.push({ type: docType, file: file, comment: comment });
            renderDocQueue();
            // Reset inputs
            $('#selDocumentType').val('');
            $('#fDocumentFile').val('');
            $('#txtDocumentComment').val('');
            toastr.info(DOC_TYPES[dt] + ' ' + T('vehicle_inventories.added_to_queue', 'added. Click Save to upload all.'));
        });

        // Save all queued documents
        $('#btnUploadDocument').on('click', function() {
            if (!_docQueue.length) { toastr.warning(T('vehicle_inventories.no_docs_to_save', 'Add documents first using the Add button above.')); return; }
            var $btn = $(this);
            btnLoading($btn);
            var pending = _docQueue.slice();
            var done = 0, errors = 0;

            function uploadNext() {
                if (!pending.length) {
                    btnReset($btn);
                    _docQueue = [];
                    renderDocQueue();
                    if (errors) toastr.warning(done + ' uploaded, ' + errors + ' failed.');
                    else toastr.success(done + ' ' + T('vehicle_inventories.documents_saved', 'documents saved.'));
                    // Reload document list from server
                    $.get(BASE_URL + '/vehicle-inventories/' + FD.uuid + '/view-data', function(res) {
                        if (res && res.status === 200 && res.data) {
                            _documents = res.data.documents || [];
                            renderDocumentList();
                        }
                    });
                    return;
                }
                var d = pending.shift();
                var fd = new FormData();
                fd.append('document_type', d.type);
                fd.append('comment', d.comment);
                fd.append('file', d.file);
                $.ajax({
                    url: BASE_URL + '/vehicle-inventories/' + FD.uuid + '/documents',
                    type: 'POST', data: fd, processData: false, contentType: false,
                    success: function(r) { if (r.status === 200 || r.status === 201) done++; else errors++; uploadNext(); },
                    error: function() { errors++; uploadNext(); }
                });
            }
            uploadNext();
        });

        /* Delete document */
        $(document).on('click', '.btn-delete-vi-document', function(e) {
            e.preventDefault();
            var docId = $(this).data('id');
            if (!docId) return;

            smsConfirm({
                icon: '\uD83D\uDDD1\uFE0F',
                title: T('general.delete', 'Delete'),
                msg: T('vehicle_inventories.delete_document_confirm', 'Are you sure you want to delete this document?'),
                btnClass: 'btn-danger',
                btnText: T('btn.delete', 'Delete'),
                onConfirm: function() {
                    showLoading();
                    $.post(BASE_URL + '/vehicle-inventories/' + FD.uuid + '/documents/delete', { document_id: docId }, function(r) {
                        hideLoading();
                        if (r.status === 200) {
                            toastr.success(r.message || T('msg.deleted', 'Deleted.'));
                            _documents = _documents.filter(function(d) { return String(d.id || d.document_id) !== String(docId); });
                            renderDocumentList();
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

        /* Clear file preview (image/video) */
        $(document).on('click', '.sms-clear-file-preview', function() {
            var inputSel = $(this).data('input');
            var previewSel = $(this).data('preview');
            $(inputSel).val('');
            $(previewSel).html('');
        });

        /* ══════════════════════════════════════════════════════
           NEXT / PREVIOUS TAB NAVIGATION
        ══════════════════════════════════════════════════════ */
        $(document).on('click', '.sms-tab-next', function() {
            var target = $(this).data('target');
            if (target) { $(target).tab('show'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        });
        $(document).on('click', '.sms-tab-prev', function() {
            var target = $(this).data('target');
            if (target) { $(target).tab('show'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        });

    } /* end if (FD.isEdit) */
});
