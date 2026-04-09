/* part-catalogs-form.js */
'use strict';

$(function() {
    var FD = window._FORM_DATA || {};
    var T  = function(k,f){ return typeof SMS_T==='function'?SMS_T(k,f):(f||k); };
    var _aiConfig = null;

    /* ══════════════════════════════════════════════════════
       SELECT2 AJAX AUTOCOMPLETE — Dropdown fields
    ══════════════════════════════════════════════════════ */
    function initSelect2(selector, url, placeholder, existing) {
        $(selector).select2({
            placeholder: placeholder,
            allowClear: true,
            width: '100%',
            ajax: {
                url: BASE_URL + url,
                dataType: 'json',
                delay: 300,
                data: function(params) {
                    return { search: params.term || '', limit: '' };
                },
                processResults: function(res) {
                    return {
                        results: (res.data || []).map(function(r) {
                            return { id: r.id, text: r.name || r.part_name || '' };
                        })
                    };
                },
                cache: true
            },
            minimumInputLength: 0
        });

        // Pre-populate on edit
        if (existing && existing.id) {
            if (!$(selector).find('option[value="' + existing.id + '"]').length) {
                var opt = new Option(existing.text, existing.id, true, true);
                $(selector).append(opt);
            }
            $(selector).trigger('change');
        }
    }

    initSelect2('#selPartType', '/part-types/autocomplete', T('part_catalogs.select_part_type', 'Search part type...'), FD.partType);
    initSelect2('#selPartLocation', '/part-locations/autocomplete', T('part_catalogs.select_part_location', 'Search part location...'), FD.partLocation);
    initSelect2('#selPartGroup', '/part-groups/autocomplete', T('part_catalogs.select_part_group', 'Search part group...'), FD.partGroup);
    initSelect2('#selPartSide', '/part-sides/autocomplete', T('part_catalogs.select_part_side', 'Search part side...'), FD.partSide);
    initSelect2('#selVehicleType', '/vehicle-types/autocomplete', T('part_catalogs.select_vehicle_type', 'Search vehicle type...'), FD.vehicleType);

    /* ══════════════════════════════════════════════════════
       ASSIGNED PARTS — Sticky note cards with search dropdown
    ══════════════════════════════════════════════════════ */
    var _assignedParts = {}; // {id: {name, uuid}}
    var _assignPage = 1;
    var _assignPerPage = 10;

    // Initialize from existing assigned parts
    if (FD.assignedParts && FD.assignedParts.length) {
        FD.assignedParts.forEach(function(v) {
            _assignedParts[v.id] = { name: v.text, uuid: v.uuid || '' };
        });
    }

    function _updateAssignedHidden() {
        var ids = Object.keys(_assignedParts).map(function(k) { return parseInt(k); });
        $('#hiddenAssignedIds').val(JSON.stringify(ids));
        $('#assignedCount').text(ids.length);
        if (ids.length === 0) {
            if (!$('#noAssignedMsg').length) {
                $('#assignedItems').append('<div class="text-muted small text-center w-100 py-3" id="noAssignedMsg">No sub-parts assigned yet. Use the search above to find and add parts.</div>');
            }
        } else {
            $('#noAssignedMsg').remove();
        }
    }

    function _buildChip(id, name, uuid) {
        return '<span class="assigned-chip badge bg-azure-lt d-inline-flex align-items-center gap-1 px-2 py-2" data-id="' + id + '" data-uuid="' + H.esc(uuid || '') + '" style="font-size:12.5px;cursor:pointer;" title="Click to view details">' +
            '<span class="btn-view-part" data-uuid="' + H.esc(uuid || '') + '">' + H.esc(name) + '</span>' +
            '<button type="button" class="btn-close btn-close-sm ms-1 btn-remove-assigned" data-id="' + id + '" style="font-size:9px;" title="Remove"></button>' +
            '</span>';
    }

    function _addAssignedPart(id, name, uuid) {
        if (_assignedParts[id]) return;
        _assignedParts[id] = { name: name, uuid: uuid || '' };
        $('#noAssignedMsg').remove();
        $('#assignedItems').append(_buildChip(id, name, uuid));
        _updateAssignedHidden();
        _refreshDropdown();
    }

    function _removeAssignedPart(id) {
        delete _assignedParts[id];
        $('#assignedItems .assigned-chip[data-id="' + id + '"]').fadeOut(200, function() { $(this).remove(); _updateAssignedHidden(); });
        _refreshDropdown();
    }

    $(document).on('click', '.btn-remove-assigned', function(e) {
        e.preventDefault();
        _removeAssignedPart($(this).data('id'));
    });

    // View part details in modal — full details like list page view
    $(document).on('click', '.btn-view-part', function(e) {
        e.preventDefault();
        var uuid = $(this).data('uuid');
        if (!uuid) return;
        var $b = $('#viewPartBody');
        if (!$b.length) return;
        $b.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');
        bootstrap.Modal.getOrCreateInstance($('#modalViewPart')[0]).show();
        $.get(BASE_URL + '/part-catalogs/' + uuid + '/view-data', function(res) {
            if (!res || res.status !== 200) { $b.html('<div class="alert alert-danger m-3">'+T('general.not_found','Not found.')+'</div>'); return; }
            var pc = res.data.part_catalog || res.data || {};
            var langs = res.data.languages || [];
            var trans = pc.translations || [];
            var images = res.data.images || pc.images || [];
            var ext = pc.image_full_url || '';
            var assignedParts = res.data.assigned_parts || pc.assigned_parts || [];

            var h = '<div class="p-4">';
            // Header
            h += '<div class="text-center mb-4"><h4 class="mb-1">' + H.esc(pc.name || '') + '</h4>';
            h += '<div>' + ((pc.status===true||pc.status===1||pc.status==='1'||parseInt(pc.status)===1) ? '<span class="badge bg-success-lt">' + T('general.active','Active') + '</span>' : '<span class="badge bg-danger-lt">' + T('general.inactive','Inactive') + '</span>');
            if (parseInt(pc.is_master_part)) h += ' <span class="badge bg-info-lt">' + T('part_catalogs.is_master_part','Master Part') + '</span>';
            h += '</div></div>';

            // Gallery images
            if (images.length) {
                h += '<div class="mb-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-images me-1 text-primary"></i>' + T('part_catalogs.images','Images') + ' (' + images.length + ')</h6><div class="row g-2">';
                images.forEach(function(img) {
                    var imgUrl = img.display_url || img.url || img.image_url || '';
                    h += '<div class="col-3"><div class="border rounded p-1 text-center"><a href="' + H.esc(imgUrl) + '" target="_blank"><img src="' + H.esc(imgUrl) + '" class="rounded" style="width:100%;height:70px;object-fit:cover;" onerror="this.src=\'/images/no-image.svg\';"/></a></div></div>';
                });
                h += '</div></div>';
            } else if (!ext) {
                h += '<div class="text-center mb-3"><img src="/images/no-image.svg" style="width:80px;opacity:.4;"/></div>';
            }
            if (ext) {
                h += '<div class="' + (images.length ? 'border-top pt-3 ' : '') + 'mb-3"><div class="text-muted small mb-1"><i class="bi bi-link-45deg me-1 text-info"></i>' + T('general.external_url','External URL') + '</div>' +
                    '<div class="text-center"><img src="' + H.esc(ext) + '" class="rounded" style="max-height:120px;max-width:100%;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/></div></div>';
            }

            // Details
            h += '<div class="border-top pt-3 mb-3">';
            var details = [
                { label: T('part_catalogs.part_type','Part Type'), val: pc.part_type_name || '' },
                { label: T('part_catalogs.part_location','Part Location'), val: pc.part_location_name || '' },
                { label: T('part_catalogs.part_group','Part Group'), val: pc.part_group_name || '' },
                { label: T('part_catalogs.part_side','Part Side'), val: pc.part_side_name || '' },
                { label: T('part_catalogs.vehicle_type','Vehicle Type'), val: pc.vehicle_type_name || '' },
                { label: T('part_catalogs.num_car_doors','Car Doors'), val: pc.number_of_car_doors || '' },
                { label: T('part_catalogs.height','Height'), val: pc.height || '' },
                { label: T('part_catalogs.weight','Weight'), val: pc.weight || '' },
                { label: T('part_catalogs.length','Length'), val: pc.length || '' },
                { label: T('part_catalogs.width','Width'), val: pc.width || '' },
                { label: T('part_catalogs.depends_body_car','Depends Body Car'), val: parseInt(pc.depends_body_car) ? 'Yes' : 'No' },
                { label: T('part_catalogs.individual','Individual'), val: parseInt(pc.is_individual) ? 'Yes' : 'No' }
            ];
            h += '<div class="row g-2">';
            details.forEach(function(d) {
                if (d.val) h += '<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">' + H.esc(d.label) + '</div><div class="fw-medium" style="font-size:13px;">' + H.esc(String(d.val)) + '</div></div></div>';
            });
            h += '</div></div>';

            // Assigned parts
            if (assignedParts.length) {
                h += '<div class="border-top pt-3 mb-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-diagram-2 me-1 text-primary"></i>' + T('part_catalogs.assigned_parts','Assigned Parts') + ' (' + assignedParts.length + ')</h6><div class="d-flex flex-wrap gap-1">';
                assignedParts.forEach(function(p) { h += '<span class="badge bg-primary-lt">' + H.esc(p.name || '') + '</span>'; });
                h += '</div></div>';
            }

            // Timestamps
            h += '<div class="border-top pt-3 mb-3">';
            h += '<div class="mb-2"><span class="text-muted small">' + T('general.created_at','Created') + ':</span> ' + smsFormatDateTime(pc.created_at) + '</div>';
            h += '<div class="mb-2"><span class="text-muted small">' + T('general.updated','Updated') + ':</span> ' + smsFormatDateTime(pc.updated_at) + '</div>';
            h += '</div>';

            // Translations
            if (langs.length > 0) {
                var tM = {}; trans.forEach(function(t) { tM[t.language_id] = t.name; });
                h += '<div class="border-top pt-3"><h6 class="fw-semibold mb-2" style="font-size:13px;"><i class="bi bi-translate me-1 text-primary"></i>' + T('part_catalogs.translations','Translations') + '</h6><div class="row g-2">';
                langs.forEach(function(l) {
                    var v = tM[l.id] ? H.esc(tM[l.id]) : '<span class="text-muted fst-italic">—</span>';
                    h += '<div class="col-sm-6"><div class="border rounded p-2"><div class="text-muted" style="font-size:11px;">' + (l.flag ? l.flag + ' ' : '') + H.esc(l.name) + '</div><div class="fw-medium" style="font-size:13px;">' + v + '</div></div></div>';
                });
                h += '</div></div>';
            }

            h += '</div>';
            $b.html(h);
        });
    });

    function _refreshDropdown() {
        $('#assignPartDropdown .btn-add-part').each(function() {
            var pid = $(this).data('id');
            if (_assignedParts[pid]) {
                $(this).prop('disabled', true).removeClass('btn-outline-success').addClass('btn-success').html('<i class="bi bi-check-lg"></i>');
            } else {
                $(this).prop('disabled', false).removeClass('btn-success').addClass('btn-outline-success').html('<i class="bi bi-plus-lg"></i>');
            }
        });
    }

    function _loadAssignableParts(page) {
        _assignPage = page || 1;
        var search = $('#assignPartSearch').val().trim();
        if (!search && _assignPage === 1) { $('#assignPartDropdown').hide(); $('#assignPartPagination').hide(); return; }
        $('#assignPartDropdown').html('<div class="text-center py-2"><div class="spinner-border spinner-border-sm text-primary"></div></div>').show();
        $.post(BASE_URL + '/part-catalogs/assignable-parts', {
            search: search,
            page: _assignPage,
            per_page: _assignPerPage,
            exclude_master_uuid: FD.uuid || ''
        }, function(res) {
            if (!res || res.status !== 200) { $('#assignPartDropdown').html('<div class="text-muted small text-center py-2">'+T('general.failed_load','Failed.')+'</div>'); return; }
            var data = (res.data && res.data.data) || [];
            var pg = (res.data && res.data.pagination) || {};
            if (!data.length) { $('#assignPartDropdown').html('<div class="text-muted small text-center py-2">No parts found.</div>'); $('#assignPartPagination').hide(); return; }

            var html = '';
            data.forEach(function(r) {
                var isAdded = !!_assignedParts[r.id];
                html += '<div class="d-flex align-items-center justify-content-between py-2 px-3 border-bottom assign-row' + (isAdded ? ' bg-light' : '') + '" style="font-size:13px;cursor:pointer;" data-id="' + r.id + '" data-name="' + H.esc(r.name || '') + '" data-uuid="' + H.esc(r.uuid || '') + '">' +
                    '<span class="text-truncate me-2">' + H.esc(r.name || '') + '</span>' +
                    '<button type="button" class="btn btn-sm p-0 btn-add-part flex-shrink-0 ' + (isAdded ? 'btn-success' : 'btn-outline-success') + '" data-id="' + r.id + '" data-name="' + H.esc(r.name || '') + '" data-uuid="' + H.esc(r.uuid || '') + '" style="width:28px;height:28px;border-radius:50%;" ' + (isAdded ? 'disabled' : '') + '>' +
                    (isAdded ? '<i class="bi bi-check-lg"></i>' : '<i class="bi bi-plus-lg"></i>') +
                    '</button></div>';
            });
            $('#assignPartDropdown').html(html).show();

            // Pagination
            if (pg.last_page > 1) {
                var pgHtml = '<span class="text-muted small">' + (pg.from || 1) + '-' + (pg.to || data.length) + ' / ' + (pg.total || 0) + '</span>';
                pgHtml += '<div class="btn-group btn-group-sm">';
                pgHtml += '<button class="btn btn-sm btn-outline-secondary assign-pg" data-p="' + (pg.current_page - 1) + '" ' + (pg.current_page <= 1 ? 'disabled' : '') + '><i class="bi bi-chevron-left"></i></button>';
                pgHtml += '<button class="btn btn-sm btn-outline-secondary assign-pg" data-p="' + (pg.current_page + 1) + '" ' + (pg.current_page >= pg.last_page ? 'disabled' : '') + '><i class="bi bi-chevron-right"></i></button>';
                pgHtml += '</div>';
                $('#assignPartPagination').html(pgHtml).show();
            } else {
                $('#assignPartPagination').hide();
            }
        });
    }

    $(document).on('click', '.btn-add-part', function(e) {
        e.stopPropagation();
        _addAssignedPart($(this).data('id'), $(this).data('name'), $(this).data('uuid'));
    });
    $(document).on('click', '.assign-row', function() {
        var id = $(this).data('id');
        if (_assignedParts[id]) return;
        _addAssignedPart(id, $(this).data('name'), $(this).data('uuid'));
    });

    $(document).on('click', '.assign-pg', function() {
        var p = parseInt($(this).data('p'));
        if (p > 0) _loadAssignableParts(p);
    });

    var _assignSearchTimer;
    $('#assignPartSearch').on('input', function() {
        clearTimeout(_assignSearchTimer);
        _assignSearchTimer = setTimeout(function() { _loadAssignableParts(1); }, 350);
    });

    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#assignPartSearch, #assignPartDropdown, #assignPartPagination').length) {
            $('#assignPartDropdown').hide();
            $('#assignPartPagination').hide();
        }
    });
    // Re-open on focus
    $('#assignPartSearch').on('focus', function() {
        if ($(this).val().trim()) _loadAssignableParts(_assignPage);
    });

    /* ══════════════════════════════════════════════════════
       IS MASTER PART — Toggle assigned parts card
    ══════════════════════════════════════════════════════ */
    $('#fIsMasterPart').on('change', function() {
        if ($(this).is(':checked')) {
            $('#masterPartCard').slideDown(200);
        } else {
            $('#masterPartCard').slideUp(200);
        }
    });

    /* ══════════════════════════════════════════════════════
       AI CONFIG
    ══════════════════════════════════════════════════════ */
    function checkAIConfig() {
        $.get(BASE_URL + '/part-catalogs/ai-config', function(res) {
            if (!res || res.status !== 200 || !res.data) return;
            _aiConfig = res.data;
            if (_aiConfig.enabled && (_aiConfig.openai || _aiConfig.gemini || _aiConfig.provider)) {
                $('.ai-translate-btn').removeClass('d-none');
            }
        });
    }

    /* ══════════════════════════════════════════════════════
       TRANSLATE ALL
    ══════════════════════════════════════════════════════ */
    $('#btnTranslateAll').on('click', function() {
        var text = $('#fPartName').val().trim();
        if (!text) { toastr.error('Enter part name first.'); $('#fPartName').focus(); return; }

        var langs = FD.langs || [];
        if (!langs.length) return;

        var $btn = $(this);
        var origHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating...');

        var provider = (_aiConfig && _aiConfig.provider) ? _aiConfig.provider : (_aiConfig && _aiConfig.gemini ? 'gemini' : 'openai');

        $.ajax({
            url: BASE_URL + '/part-catalogs/translate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ text: text, languages: langs, provider: provider }),
            success: function(res) {
                $btn.prop('disabled', false).html(origHtml);
                if (res.status === 200 && res.data && res.data.translations) {
                    var tr = res.data.translations;
                    var filled = 0;
                    for (var langId in tr) {
                        var $inp = $('input[name="trans_' + langId + '"]');
                        if ($inp.length && tr[langId]) {
                            $inp.val(tr[langId]);
                            $inp.css('background', '#d4edda');
                            (function($el){ setTimeout(function(){ $el.css('background', ''); }, 1500); })($inp);
                            filled++;
                        }
                    }
                    toastr.success(filled + ' translations filled' + (res.data.provider ? ' via ' + res.data.provider : ''));
                } else {
                    toastr.error(res.message || 'Translation failed.');
                }
            },
            error: function() {
                $btn.prop('disabled', false).html(origHtml);
                toastr.error(T('general.network_error', 'Network error.'));
            }
        });
    });

    /* ══════════════════════════════════════════════════════
       TRANSLATE SINGLE
    ══════════════════════════════════════════════════════ */
    $(document).on('click', '.ai-single-btn', function() {
        var text = $('#fPartName').val().trim();
        if (!text) { toastr.error('Enter part name first.'); $('#fPartName').focus(); return; }

        var $btn = $(this);
        var langId   = $btn.data('lang-id');
        var langName = $btn.data('lang-name');
        var langCode = $btn.data('lang-code');

        var origHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

        var provider = (_aiConfig && _aiConfig.provider) ? _aiConfig.provider : (_aiConfig && _aiConfig.gemini ? 'gemini' : 'openai');

        $.ajax({
            url: BASE_URL + '/part-catalogs/translate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                text: text,
                languages: [{ id: langId, name: langName, code: langCode }],
                provider: provider
            }),
            success: function(res) {
                $btn.prop('disabled', false).html(origHtml);
                if (res.status === 200 && res.data && res.data.translations) {
                    var val = res.data.translations[langId];
                    if (val) {
                        var $inp = $('input[name="trans_' + langId + '"]');
                        $inp.val(val);
                        $inp.css('background', '#d4edda');
                        setTimeout(function(){ $inp.css('background', ''); }, 1500);
                        toastr.success(langName + ': ' + val);
                    } else {
                        toastr.warning('No translation returned for ' + langName);
                    }
                } else {
                    toastr.error(res.message || T('msg.failed','Failed.'));
                }
            },
            error: function() {
                $btn.prop('disabled', false).html(origHtml);
                toastr.error(T('general.network_error', 'Network error.'));
            }
        });
    });

    /* ══════════════════════════════════════════════════════
       MULTI-IMAGE PREVIEW on file select
    ══════════════════════════════════════════════════════ */
    $('#fImages').on('change', function() {
        var files = this.files;
        $('#multiImagePreview').html('');
        if (!files || !files.length) { if (FD.isEdit) $('#btnUploadGallery').addClass('d-none'); return; }
        for (var i = 0; i < files.length; i++) {
            if (files[i].size > 5 * 1024 * 1024) { toastr.error('File "' + files[i].name + '" exceeds 5 MB limit.'); $(this).val(''); $('#multiImagePreview').html(''); if (FD.isEdit) $('#btnUploadGallery').addClass('d-none'); return; }
            (function(file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    $('#multiImagePreview').append(
                        '<div class="col-4"><div class="border rounded p-1 text-center">' +
                        '<img src="' + e.target.result + '" class="rounded" style="width:100%;height:70px;object-fit:cover;"/>' +
                        '</div></div>'
                    );
                };
                reader.readAsDataURL(file);
            })(files[i]);
        }
        $('#imgPlaceholder').hide();
        if (FD.isEdit) $('#btnUploadGallery').removeClass('d-none');
    });

    $('#fRemoveImg').on('change', function() {
        if ($(this).is(':checked')) { /* just flags removal of primary image on update */ }
    });

    /* ── Image popup ── */
    $(document).on('click', '.sms-img-preview', function() {
        var $img     = $(this);
        var title    = $img.data('title') || T('part_catalogs.image_preview','Image Preview');
        var uploaded = $img.data('uploaded') || '';
        var external = $img.data('external') || '';
        if (!uploaded && !external) return;

        $('#imgPopupTitle').text(title);
        var html = '<div class="row g-3">';
        if (uploaded) {
            html += '<div class="' + (external ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
            html += '<div class="text-muted small mb-2"><i class="bi bi-cloud-upload me-1 text-success"></i><strong>' + T('part_catalogs.image_uploaded','Uploaded') + '</strong></div>';
            html += '<img src="' + H.esc(uploaded) + '" class="rounded" style="max-width:100%;max-height:240px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/>';
            html += '<div class="mt-2"><a href="' + H.esc(uploaded) + '" target="_blank" class="btn btn-sm btn-outline-primary" download><i class="bi bi-download me-1"></i>' + T('general.download','Download') + '</a></div>';
            html += '</div></div>';
        }
        if (external) {
            html += '<div class="' + (uploaded ? 'col-6' : 'col-12') + '"><div class="border rounded p-2 text-center">';
            html += '<div class="text-muted small mb-2"><i class="bi bi-link-45deg me-1 text-info"></i><strong>' + T('general.external_url','External URL') + '</strong></div>';
            html += '<img src="' + H.esc(external) + '" class="rounded" style="max-width:100%;max-height:240px;object-fit:contain;" onerror="this.outerHTML=\'<div class=text-muted>No image</div>\'"/>';
            html += '<div class="mt-2"><a href="' + H.esc(external) + '" target="_blank" class="btn btn-sm btn-outline-info"><i class="bi bi-box-arrow-up-right me-1"></i>' + T('general.open_file','Open') + '</a></div>';
            html += '</div></div>';
        }
        html += '</div>';
        $('#imgPopupBody').html(html);
        bootstrap.Modal.getOrCreateInstance($('#modalImageForm')[0]).show();
    });

    /* (Multi-image preview is now handled by #fImages change handler above) */

    /* ══════════════════════════════════════════════════════
       FORM SUBMIT
    ══════════════════════════════════════════════════════ */
    $('#frmPartCatalog').on('submit', function(e) {
        e.preventDefault();
        var partName = $('#fPartName').val().trim();
        if (!partName) { toastr.error('Part name is required.'); $('#fPartName').focus(); return; }
        if (!$('#selPartType').val()) { toastr.error('Part Type is required.'); $('#selPartType').select2('open'); return; }
        if (!$('#selPartLocation').val()) { toastr.error('Part Location is required.'); $('#selPartLocation').select2('open'); return; }
        if (!$('#selPartGroup').val()) { toastr.error('Part Group is required.'); $('#selPartGroup').select2('open'); return; }
        if (!$('#selPartSide').val()) { toastr.error('Part Side is required.'); $('#selPartSide').select2('open'); return; }

        var $btn = $('#btnSubmit');
        var fd   = new FormData(this);

        // Translations
        var translations = {};
        (FD.langIds || []).forEach(function(lid) {
            var val = $('input[name="trans_' + lid + '"]').val();
            if (val && val.trim()) translations[lid] = val.trim();
            fd.delete('trans_' + lid);
        });
        fd.append('translations', JSON.stringify(translations));

        // Select2 fields — ensure values are sent
        var partTypeId = $('#selPartType').val();
        var partLocId  = $('#selPartLocation').val();
        var partGrpId  = $('#selPartGroup').val();
        var partSideId = $('#selPartSide').val();
        var vehTypeId  = $('#selVehicleType').val();

        fd.set('part_type_id', partTypeId || '');
        fd.set('part_location_id', partLocId || '');
        fd.set('part_group_id', partGrpId || '');
        fd.set('part_side_id', partSideId || '');
        fd.set('vehicle_type_id', vehTypeId || '');

        // Checkboxes — always explicitly set value
        fd.set('is_master_part', $('#fIsMasterPart').is(':checked') ? '1' : '0');
        fd.set('depends_body_car', $('#fDependsBodyCar').is(':checked') ? '1' : '0');
        fd.set('is_individual', $('#fIndividual').is(':checked') ? '1' : '0');

        // Attributes — send new ones for creation
        var newAttrs = _attributes.filter(function(a) { return !a.id; });
        if (newAttrs.length) {
            fd.set('attributes', JSON.stringify(newAttrs.map(function(a) {
                return { label_name: a.label_name, data_type_id: a.data_type_id, is_required: a.is_required, is_multiple: a.is_multiple, options: a.options };
            })));
        }

        // Update edited existing attributes — must complete before main save
        var editedAttrs = _attributes.filter(function(a) { return a.id && a._edited; });
        var attrUpdatePromises = editedAttrs.map(function(a) {
            return $.ajax({ url: BASE_URL + '/part-catalogs/attributes/' + a.id, type: 'PUT', contentType: 'application/json',
                data: JSON.stringify({ label_name: a.label_name, data_type_id: a.data_type_id, is_required: a.is_required, is_multiple: a.is_multiple, options: JSON.stringify(a.options) })
            });
        });

        // Assigned parts (only if master part)
        if ($('#fIsMasterPart').is(':checked')) {
            var assignedIds = $('#hiddenAssignedIds').val() || '[]';
            fd.set('assigned_part_ids', assignedIds);
        } else {
            fd.set('assigned_part_ids', '[]');
        }

        btnLoading($btn);
        var formUrl = $(this).attr('action');

        // Wait for attribute updates to complete, then submit main form
        $.when.apply($, attrUpdatePromises).always(function() {
            $.ajax({
                url: formUrl, type: 'POST', data: fd, processData: false, contentType: false,
                success: function(r) {
                    btnReset($btn);
                    if (r.status === 200 || r.status === 201) {
                        toastr.success(r.message || T('msg.settings_saved','Saved.'));
                        setTimeout(function() { window.location = '/part-catalogs'; }, 800);
                    } else toastr.error(r.message || T('general.error','Error.'));
                },
                error: function() { btnReset($btn); toastr.error(T('general.network_error','Network error.')); }
            });
        });
    });

    /* ══════════════════════════════════════════════════════
       INLINE ATTRIBUTES BUILDER
    ══════════════════════════════════════════════════════ */
    // data_type_id: 1=Text, 2=Number, 3=Dropdown, 4=Checkbox, 5=Radio, 6=Upload
    var DT = {1:'Text',2:'Number',3:'Dropdown',4:'Checkbox',5:'Radio',6:'Upload'};
    var DT_ICON = {1:'bi-fonts',2:'bi-123',3:'bi-list',4:'bi-check-square',5:'bi-record-circle',6:'bi-paperclip'};
    var _attributes = [];
    var _attrIdx = 0;
    var _tempOptions = [];
    var _companyRoles = null;

    // Load existing attributes on edit
    if (FD.attributes && FD.attributes.length) {
        FD.attributes.forEach(function(a) {
            _attributes.push({
                idx: _attrIdx++, id: a.id || null,
                data_type_id: parseInt(a.data_type_id), label_name: a.label_name,
                is_required: !!a.is_required, is_multiple: !!a.is_multiple,
                options: a.options || [], permissions: a.permissions || []
            });
        });
        _renderAttributes();
    }

    // Show/hide options & multiple based on data_type
    $('#attrDataType').on('change', function() {
        var t = parseInt($(this).val());
        $('#attrOptionsWrap').toggle([3,4,5].indexOf(t) !== -1);
        $('#attrMultipleWrap').toggle([3,4,6].indexOf(t) !== -1);
        if (t === 5) $('#attrMultiple').prop('checked', false);
    });

    // Add option via input box
    $('#btnAddOption').on('click', function() { _addOpt(); });
    $('#attrOptionInput').on('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); _addOpt(); } });
    function _addOpt() {
        var v = $('#attrOptionInput').val().trim();
        if (!v) return;
        if (_tempOptions.indexOf(v) !== -1) { toastr.warning('Option already exists.'); return; }
        _tempOptions.push(v);
        $('#attrOptionInput').val('').focus();
        _renderTempOpts();
    }
    function _renderTempOpts() {
        var h = '';
        _tempOptions.forEach(function(o, i) {
            h += '<span class="badge bg-primary-lt d-inline-flex align-items-center gap-1 px-2 py-2" style="font-size:12px;">' +
                H.esc(o) +
                ' <i class="bi bi-x-circle-fill ms-1 tmp-opt-del" data-i="' + i + '" style="cursor:pointer;font-size:14px;opacity:.7;"></i>' +
                '</span>';
        });
        if (!_tempOptions.length) h = '<span class="text-muted small">No options added yet</span>';
        $('#attrOptionsList').html(h);
    }
    $(document).on('click', '.tmp-opt-del', function(e) {
        e.stopPropagation();
        _tempOptions.splice(parseInt($(this).data('i')), 1);
        _renderTempOpts();
    });

    // Duplicate check (client-side)
    function _isDuplicateLabel(label, excludeIdx) {
        return _attributes.some(function(a) { return a.label_name.toLowerCase() === label.toLowerCase() && a.idx !== excludeIdx; });
    }

    // Open add modal
    $('#btnAddAttribute').on('click', function() {
        $('#attrDataType').val('').trigger('change');
        $('#attrLabel').val('');
        $('#attrRequired,#attrMultiple').prop('checked', false);
        _tempOptions = []; _renderTempOpts();
        $('#btnSaveAttribute').data('edit-idx', '');
        bootstrap.Modal.getOrCreateInstance($('#modalAddAttribute')[0]).show();
    });

    // Save / update attribute
    $('#btnSaveAttribute').on('click', function() {
        var dtId = parseInt($('#attrDataType').val());
        var label = $('#attrLabel').val().trim();
        if (!dtId) { toastr.error('Select a data type.'); return; }
        if (!label) { toastr.error('Label name is required.'); return; }
        if ([3,4,5].indexOf(dtId) !== -1 && !_tempOptions.length) { toastr.error('Add at least one option.'); return; }

        var editIdx = $(this).data('edit-idx');
        if (editIdx !== '' && editIdx !== undefined) {
            editIdx = parseInt(editIdx);
            if (_isDuplicateLabel(label, editIdx)) { toastr.error('Attribute "' + label + '" already exists.'); return; }
            // Update existing
            var ea = _attributes.find(function(a) { return a.idx === editIdx; });
            if (ea) {
                ea.label_name = label; ea.data_type_id = dtId;
                ea.is_required = $('#attrRequired').is(':checked');
                ea.is_multiple = $('#attrMultiple').is(':checked');
                ea.options = _tempOptions.slice();
                ea._edited = true;
            }
        } else {
            if (_isDuplicateLabel(label, -1)) { toastr.error('Attribute "' + label + '" already exists.'); return; }
            _attributes.push({
                idx: _attrIdx++, id: null, data_type_id: dtId, label_name: label,
                is_required: $('#attrRequired').is(':checked'), is_multiple: $('#attrMultiple').is(':checked'),
                options: _tempOptions.slice(), permissions: []
            });
        }
        _renderAttributes();
        bootstrap.Modal.getOrCreateInstance($('#modalAddAttribute')[0]).hide();
    });

    // Edit attribute
    $(document).on('click', '.btn-edit-attr', function() {
        var idx = parseInt($(this).data('idx'));
        var a = _attributes.find(function(x) { return x.idx === idx; });
        if (!a) return;
        $('#attrDataType').val(a.data_type_id).trigger('change');
        $('#attrLabel').val(a.label_name);
        $('#attrRequired').prop('checked', a.is_required);
        $('#attrMultiple').prop('checked', a.is_multiple);
        _tempOptions = (a.options || []).slice();
        _renderTempOpts();
        $('#btnSaveAttribute').data('edit-idx', idx);
        bootstrap.Modal.getOrCreateInstance($('#modalAddAttribute')[0]).show();
    });

    // Delete attribute (unsaved = remove from array, saved = API call)
    $(document).on('click', '.btn-del-attr', function() {
        var idx = parseInt($(this).data('idx'));
        var a = _attributes.find(function(x) { return x.idx === idx; });
        if (!a) return;
        if (a.id) {
            smsConfirm({ icon: '🗑️', title: 'Delete Attribute', msg: 'Delete <strong>' + H.esc(a.label_name) + '</strong>?', btnClass: 'btn-danger', btnText: 'Delete',
                onConfirm: function() {
                    $.post(BASE_URL + '/part-catalogs/attributes/' + a.id + '/delete', function(r) {
                        if (r.status === 200) { toastr.success('Deleted.'); _attributes = _attributes.filter(function(x) { return x.idx !== idx; }); _renderAttributes(); }
                        else toastr.error(r.message || 'Failed.');
                    });
                }
            });
        } else {
            _attributes = _attributes.filter(function(x) { return x.idx !== idx; });
            _renderAttributes();
        }
    });

    // Assign role permissions popup
    $(document).on('click', '.btn-perm-attr', function() {
        var idx = parseInt($(this).data('idx'));
        var a = _attributes.find(function(x) { return x.idx === idx; });
        if (!a || !a.id) { toastr.info('Save the part catalog first, then assign permissions.'); return; }
        _openPermPopup(a);
    });

    function _loadRoles(cb) {
        if (_companyRoles) return cb(_companyRoles);
        $.get(BASE_URL + '/part-catalogs/roles/list', function(res) {
            if (res.status === 200) { _companyRoles = res.data || []; cb(_companyRoles); }
        });
    }

    var _permAttrId = null, _permAttrIdx = null;

    function _openPermPopup(attr) {
        _permAttrId = attr.id;
        _permAttrIdx = attr.idx;
        _loadRoles(function(roles) {
            var existPerms = {};
            (attr.permissions || []).forEach(function(p) { existPerms[p.role_id] = p; });

            var h = '<div class="px-3 pt-3 pb-2">' +
                '<div class="d-flex align-items-center gap-2 mb-3">' +
                '<i class="bi bi-sliders text-primary" style="font-size:18px;"></i>' +
                '<div><div class="fw-semibold">' + H.esc(attr.label_name) + '</div>' +
                '<div class="text-muted small">' + (DT[attr.data_type_id]||'') + (attr.is_required ? ' · Required' : '') + '</div></div>' +
                '</div>' +
                '</div>';

            h += '<div class="table-responsive"><table class="table table-sm table-hover mb-0" style="font-size:13px;">' +
                '<thead class="table-light"><tr>' +
                '<th style="min-width:140px;">Role</th>' +
                '<th class="text-center" style="width:60px;"><div>View</div><input type="checkbox" class="form-check-input perm-col-all" data-col="can_view" title="Select All View"/></th>' +
                '<th class="text-center" style="width:60px;"><div>Add</div><input type="checkbox" class="form-check-input perm-col-all" data-col="can_add" title="Select All Add"/></th>' +
                '<th class="text-center" style="width:60px;"><div>Edit</div><input type="checkbox" class="form-check-input perm-col-all" data-col="can_edit" title="Select All Edit"/></th>' +
                '<th class="text-center" style="width:60px;"><div>Delete</div><input type="checkbox" class="form-check-input perm-col-all" data-col="can_delete" title="Select All Delete"/></th>' +
                '<th class="text-center" style="width:50px;"><div>All</div><input type="checkbox" class="form-check-input" id="permSelectAllAll" title="Select Everything"/></th>' +
                '</tr></thead><tbody>';

            roles.forEach(function(r) {
                var ep = existPerms[r.id] || {};
                var allChecked = ep.can_view && ep.can_add && ep.can_edit && ep.can_delete;
                h += '<tr>' +
                    '<td class="fw-medium">' + H.esc(r.name) + '</td>';
                ['can_view','can_add','can_edit','can_delete'].forEach(function(k) {
                    h += '<td class="text-center"><input type="checkbox" class="form-check-input perm-chk" data-role="' + r.id + '" data-perm="' + k + '" ' + (ep[k] ? 'checked' : '') + '/></td>';
                });
                h += '<td class="text-center"><input type="checkbox" class="form-check-input perm-row-all" data-role="' + r.id + '" ' + (allChecked ? 'checked' : '') + ' title="All for ' + H.esc(r.name) + '"/></td>';
                h += '</tr>';
            });
            h += '</tbody></table></div>';

            $('#attrPermBody').html(h);
            bootstrap.Modal.getOrCreateInstance($('#modalAttrPerms')[0]).show();
        });
    }

    // Row "All" checkbox — toggle all 4 perms for that role
    $(document).on('change', '.perm-row-all', function() {
        var rid = $(this).data('role');
        var checked = $(this).is(':checked');
        $('.perm-chk[data-role="' + rid + '"]').prop('checked', checked);
        _syncColAllChecks();
    });

    // Column "All" checkbox — toggle that perm for all roles
    $(document).on('change', '.perm-col-all', function() {
        var col = $(this).data('col');
        var checked = $(this).is(':checked');
        $('.perm-chk[data-perm="' + col + '"]').prop('checked', checked);
        _syncRowAllChecks();
    });

    // "Select Everything" checkbox
    $(document).on('change', '#permSelectAllAll', function() {
        var checked = $(this).is(':checked');
        $('.perm-chk, .perm-row-all, .perm-col-all').prop('checked', checked);
    });

    // When individual checkbox changes, sync row/col all states
    $(document).on('change', '.perm-chk', function() {
        _syncRowAllChecks();
        _syncColAllChecks();
    });

    function _syncRowAllChecks() {
        $('.perm-row-all').each(function() {
            var rid = $(this).data('role');
            var total = $('.perm-chk[data-role="' + rid + '"]').length;
            var checked = $('.perm-chk[data-role="' + rid + '"]:checked').length;
            $(this).prop('checked', total === checked);
        });
    }
    function _syncColAllChecks() {
        $('.perm-col-all').each(function() {
            var col = $(this).data('col');
            var total = $('.perm-chk[data-perm="' + col + '"]').length;
            var checked = $('.perm-chk[data-perm="' + col + '"]:checked').length;
            $(this).prop('checked', total === checked);
        });
    }

    // Save permissions
    $(document).on('click', '#btnSavePermAttr', function() {
        var perms = [];
        var rolesSeen = {};
        $('.perm-chk').each(function() {
            var rid = $(this).data('role');
            if (!rolesSeen[rid]) rolesSeen[rid] = { role_id: rid, can_view: false, can_add: false, can_edit: false, can_delete: false };
            if ($(this).is(':checked')) rolesSeen[rid][$(this).data('perm')] = true;
        });
        for (var k in rolesSeen) { if (rolesSeen[k].can_view || rolesSeen[k].can_add || rolesSeen[k].can_edit || rolesSeen[k].can_delete) perms.push(rolesSeen[k]); }

        var $btn = $(this); btnLoading($btn);
        $.ajax({ url: BASE_URL + '/part-catalogs/attributes/' + _permAttrId + '/permissions', type: 'POST', contentType: 'application/json', data: JSON.stringify({ permissions: perms }),
            success: function(r) {
                btnReset($btn);
                if (r.status === 200) {
                    toastr.success('Permissions saved.');
                    // Update role names in local data
                    _loadRoles(function(roles) {
                        var rm = {}; roles.forEach(function(rl) { rm[rl.id] = rl.name; });
                        perms.forEach(function(p) { p.role_name = rm[p.role_id] || ''; });
                        var a = _attributes.find(function(x) { return x.idx === _permAttrIdx; });
                        if (a) a.permissions = perms;
                        _renderAttributes();
                    });
                    bootstrap.Modal.getOrCreateInstance($('#modalAttrPerms')[0]).hide();
                } else toastr.error(r.message || 'Failed.');
            },
            error: function() { btnReset($btn); toastr.error(T('general.failed','Failed.')); }
        });
    });

    function _renderAttributes() {
        if (!_attributes.length) {
            $('#noAttributesMsg').show(); $('#attributesList').html(''); $('#attrCount').text('0'); return;
        }
        $('#noAttributesMsg').hide();
        $('#attrCount').text(_attributes.length);
        var html = '';
        _attributes.forEach(function(a) {
            var permCount = (a.permissions || []).length;
            var isEdited = a._edited ? ' border-warning' : '';
            html += '<div class="border rounded mb-2 attr-item' + isEdited + '" data-idx="' + a.idx + '">' +
                // Header row
                '<div class="d-flex align-items-center gap-2 flex-wrap p-2">' +
                '<i class="bi ' + (DT_ICON[a.data_type_id]||'bi-sliders') + ' text-primary" style="font-size:16px;"></i>' +
                '<span class="fw-semibold" style="font-size:13px;">' + H.esc(a.label_name) + '</span>' +
                '<span class="badge bg-secondary-lt" style="font-size:10px;">' + (DT[a.data_type_id]||'') + '</span>' +
                (a.is_required ? '<span class="badge bg-danger-lt" style="font-size:10px;">Required</span>' : '') +
                (a.is_multiple ? '<span class="badge bg-info-lt" style="font-size:10px;">Multiple</span>' : '') +
                (a._edited ? '<span class="badge bg-warning-lt" style="font-size:10px;">Edited</span>' : '') +
                '</div>';

            // Options row
            if (a.options.length) {
                html += '<div class="d-flex flex-wrap gap-1 px-2 pb-2">';
                a.options.forEach(function(o) { html += '<span class="badge bg-azure-lt" style="font-size:10px;">' + H.esc(o) + '</span>'; });
                html += '</div>';
            }

            // Permissions row
            if (permCount) {
                html += '<div class="px-2 pb-2"><div class="d-flex flex-wrap gap-1">';
                (a.permissions || []).forEach(function(p) {
                    var perms = [];
                    if (p.can_view) perms.push('View');
                    if (p.can_add) perms.push('Add');
                    if (p.can_edit) perms.push('Edit');
                    if (p.can_delete) perms.push('Delete');
                    html += '<span class="badge bg-purple-lt" style="font-size:10px;"><i class="bi bi-person me-1"></i>' + H.esc(p.role_name || 'Role #' + p.role_id) + ': ' + perms.join(', ') + '</span>';
                });
                html += '</div></div>';
            }

            // Action buttons row
            html += '<div class="border-top px-2 py-1 d-flex gap-1 justify-content-end" style="background:var(--tblr-bg-surface-secondary);border-radius:0 0 4px 4px;">' +
                '<button type="button" class="btn btn-sm btn-ghost-secondary btn-edit-attr" data-idx="' + a.idx + '" title="Edit"><i class="bi bi-pencil me-1"></i><span class="d-none d-sm-inline">Edit</span></button>' +
                (a.id ? '<button type="button" class="btn btn-sm btn-ghost-purple btn-perm-attr" data-idx="' + a.idx + '" title="Assign Roles"><i class="bi bi-shield-lock me-1"></i><span class="d-none d-sm-inline">Assign Roles</span></button>' : '<span class="text-muted small align-self-center" style="font-size:11px;">Save first to assign roles</span>') +
                '<button type="button" class="btn btn-sm btn-ghost-danger btn-del-attr" data-idx="' + a.idx + '" title="Delete"><i class="bi bi-trash3 me-1"></i><span class="d-none d-sm-inline">Delete</span></button>' +
                '</div>' +
                '</div>';
        });
        $('#attributesList').html(html);
    }

    /* ── Init ── */
    checkAIConfig();
});

/* ══════════════════════════════════════════════════════
   GALLERY FUNCTIONS (global scope for onclick handlers)
══════════════════════════════════════════════════════ */
function uploadGalleryImages() {
    var T = function(k,f){ return typeof SMS_T==='function'?SMS_T(k,f):(f||k); };
    var FD = window._FORM_DATA || {};
    var files = $('#fImages')[0].files;
    if (!files || !files.length) { toastr.error('No files selected.'); return; }

    var fd = new FormData();
    for (var i = 0; i < files.length; i++) {
        fd.append('images', files[i]);
    }

    var $btn = $('#btnUploadGallery');
    btnLoading($btn);

    $.ajax({
        url: BASE_URL + '/part-catalogs/' + FD.uuid + '/images',
        type: 'POST',
        data: fd,
        processData: false,
        contentType: false,
        success: function(r) {
            btnReset($btn);
            if (r.status === 200 || r.status === 201) {
                toastr.success(r.message || T('msg.images_uploaded', 'Images uploaded.'));
                // Reload page to show new gallery
                setTimeout(function() { window.location.reload(); }, 800);
            } else {
                toastr.error(r.message || T('general.error', 'Error.'));
            }
        },
        error: function() {
            btnReset($btn);
            toastr.error(T('general.network_error', 'Network error.'));
        }
    });
}

function deleteGalleryImage(imageId) {
    var T = function(k,f){ return typeof SMS_T==='function'?SMS_T(k,f):(f||k); };
    var FD = window._FORM_DATA || {};

    smsConfirm({
        icon: 'trash',
        title: T('part_catalogs.delete_image', 'Delete Image'),
        msg: T('general.are_you_sure', 'Are you sure?'),
        btnClass: 'btn-danger',
        btnText: T('btn.delete', 'Delete'),
        onConfirm: function() {
            showLoading();
            $.post(BASE_URL + '/part-catalogs/' + FD.uuid + '/images/delete', {
                image_id: imageId
            }, function(r) {
                hideLoading();
                if (r.status === 200) {
                    toastr.success(r.message || T('msg.image_deleted', 'Image deleted.'));
                    $('#galImg' + imageId).fadeOut(300, function() { $(this).remove(); });
                    var cnt = parseInt($('#galleryCount').text()) - 1;
                    $('#galleryCount').text(cnt >= 0 ? cnt : 0);
                } else {
                    toastr.error(r.message || T('general.error', 'Error.'));
                }
            }).fail(function() {
                hideLoading();
                toastr.error(T('general.network_error', 'Error.'));
            });
        }
    });
}
