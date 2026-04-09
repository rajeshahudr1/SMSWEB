/* ══════════════════════════════════════════════════════
   settings.js — SMS Web — Full live preview
   ══════════════════════════════════════════════════════ */
var T=function(k,f){return SMS_T(k,f);};
$(function () {
    'use strict';

    /* ── Auto collapsible cards on settings page ── */
    $('.col-xl-8 .card, .col-lg-7 .card').each(function(i) {
        var $card = $(this);
        var $header = $card.find('.card-header').first();
        var $body = $card.find('.card-body').first();
        if (!$header.length || !$body.length) return;
        // Skip if already has collapse
        if ($header.attr('data-bs-toggle') === 'collapse') return;
        var colId = 'settingsCol_' + i;
        $body.wrap('<div class="collapse show" id="' + colId + '"></div>');
        $header.attr({ 'data-bs-toggle': 'collapse', 'data-bs-target': '#' + colId, 'aria-expanded': 'true' }).css('cursor', 'pointer');
        $header.find('.card-title').append(' <i class="bi bi-chevron-down ms-2" style="font-size:12px;opacity:.5;transition:transform .2s;"></i>');
    });
    // Rotate chevron on collapse toggle
    $(document).on('shown.bs.collapse hidden.bs.collapse', '[id^="settingsCol_"]', function(e) {
        var $hdr = $('[data-bs-target="#' + this.id + '"]');
        $hdr.find('.bi-chevron-down').css('transform', e.type === 'shown' ? '' : 'rotate(-90deg)');
    });

    var _radiusMap = { none:'0', sm:'4px', md:'8px', lg:'12px', xl:'16px' };

    /* ── Collect all current settings ── */
    function collectSettings() {
        return {
            theme_color:    $('#fThemeColor').val()    || '#0054a6',
            text_color:     $('#fTextColor').val()     || '#1a2332',
            icon_color:     $('#fIconColor').val()     || 'theme',
            dark_mode:      $('#fDarkMode').val()      || '0',
            direction:      $('#fDirection').val()     || 'ltr',
            sidebar_style:  $('#fSidebarStyle').val()  || 'dark',
            border_radius:  $('#fBorderRadius').val()  || 'md',
            font_size:      $('#fFontSize').val()      || '14px',
            language:       $('#fLanguage').val()      || 'en',
            module_language:$('#selModuleLanguage').val() || 'en',
            date_format:    $('#fDateFormat').val()    || 'DD/MM/YYYY',
            time_format:    $('#fTimeFormat').val()    || '12h',
            timezone:       $('#fTimezone').val()      || 'Asia/Kolkata',
            items_per_page: $('#fItemsPerPage').val()  || '15',
        };
    }

    /* ── Format a sample datetime based on current format settings ── */
    function getSampleDatetime(dateFormat, timeFormat) {
        var now = new Date();
        var dd  = String(now.getDate()).padStart(2,'0');
        var mm  = String(now.getMonth()+1).padStart(2,'0');
        var yyyy= now.getFullYear();
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var monthsFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        var h24 = now.getHours();
        var h12 = h24 % 12 || 12;
        var min = String(now.getMinutes()).padStart(2,'0');
        var ampm= h24 >= 12 ? 'PM' : 'AM';
        var h12s= String(h12).padStart(2,'0');
        var h24s= String(h24).padStart(2,'0');

        var datePart;
        switch(dateFormat) {
            case 'MM/DD/YYYY':   datePart = mm+'/'+dd+'/'+yyyy; break;
            case 'YYYY-MM-DD':   datePart = yyyy+'-'+mm+'-'+dd; break;
            case 'DD MMM YYYY':  datePart = dd+' '+months[now.getMonth()]+' '+yyyy; break;
            case 'DD MMMM YYYY': datePart = dd+' '+monthsFull[now.getMonth()]+' '+yyyy; break;
            default:             datePart = dd+'/'+mm+'/'+yyyy;
        }
        var timePart = timeFormat === '24h'
            ? h24s + ':' + min
            : h12s + ':' + min + ' ' + ampm;

        return datePart + '  ' + timePart;
    }

    /* ── Live preview update ── */
    function updatePreview() {
        var s   = collectSettings();
        var rad = _radiusMap[s.border_radius] || '8px';
        var px  = parseInt(s.font_size) || 14;
        var color = s.theme_color;
        var isDark = s.dark_mode === '1';
        var isLightSb = s.sidebar_style === 'light';

        /* ─ Update real page CSS vars ─ */
        var r = document.documentElement;
        r.style.setProperty('--tblr-primary', color);
        r.style.setProperty('--sms-text', s.text_color);
        r.style.setProperty('--tblr-body-color', s.text_color);
        var iconC = s.icon_color === 'theme' ? s.theme_color : s.icon_color;
        r.style.setProperty('--sms-icon-color', iconC);
        r.style.setProperty('--tblr-font-size', s.font_size);
        r.style.setProperty('--tblr-border-radius', rad);
        r.style.setProperty('--tblr-border-radius-sm', 'calc('+rad+'*.6)');
        r.style.setProperty('--tblr-border-radius-lg', 'calc('+rad+'*1.5)');
        isDark ? $('body').addClass('theme-dark') : $('body').removeClass('theme-dark');

        /* ─ Preview sidebar ─ */
        var $pvSb = $('#pvSidebar');
        isLightSb ? $pvSb.addClass('light') : $pvSb.removeClass('light');
        $pvSb.find('.sms-pv-brand-icon').css('background', color);
        $pvSb.find('.sms-pv-nav-item.active').css('background', 'rgba('+hexToRgb(color)+',.2)');

        /* ─ Preview main area ─ */
        var $pvMain = $('#previewViewport .sms-pv-main');
        isDark ? $pvMain.addClass('dark') : $pvMain.removeClass('dark');

        /* ─ Preview avatar/header ─ */
        $('#pvAvatar').css('background', color);

        /* ─ Preview card ─ */
        var pxRad = rad;
        $('#pvCard').css({ 'border-left-color': color, 'border-radius': pxRad });
        $('#pvVal').css('color', color);
        $('#pvBadge').css({ background: color+'22', color: color });
        $('#pvBar').css('background', color);
        $('#pvBtnPrimary').css({ background: color, 'border-radius': pxRad });
        $('#pvHeader').css('border-radius', '0');

        /* ─ Font sample ─ */
        var previewPx = Math.max(8, Math.round(px * 0.7)); /* scale down for preview */
        $('#pvFontText').css('font-size', previewPx + 'px');
        $('#pvFontSample').css('border-radius', pxRad);

        /* ─ Icon color preview ─ */
        $pvSb.find('.sms-pv-nav-item i').css('color', iconC);

        /* ─ Datetime sample ─ */
        $('#pvDatetime').text('📅 ' + getSampleDatetime(s.date_format, s.time_format));

        /* ─ Show "Changed" badge ─ */
        $('#previewChangedBadge').show();
    }

    /* ── hex → "r,g,b" helper ── */
    function hexToRgb(hex) {
        var r = parseInt(hex.slice(1,3),16);
        var g = parseInt(hex.slice(3,5),16);
        var b = parseInt(hex.slice(5,7),16);
        return r+','+g+','+b;
    }

    /* ══════════════════════════════
       EVENT HANDLERS
    ══════════════════════════════ */

    /* Color swatches */
    $(document).on('click', '.sms-cp-swatch[data-color]', function () {
        $('.sms-cp-swatch').removeClass('active');
        $('.sms-cp-picker-wrap').removeClass('active');
        $(this).addClass('active');
        var c = $(this).data('color');
        $('#fThemeColor').val(c);
        $('#fColorPicker').val(c);
        updatePreview();
    });

    /* Native color picker */
    $('#fColorPicker').on('input change', function () {
        var c = $(this).val();
        $('.sms-cp-swatch').removeClass('active');
        $('.sms-cp-picker-wrap').addClass('active');
        $('.sms-cp-picker-label').text(c).show();
        $('#fThemeColor').val(c);
        updatePreview();
    });

    /* Text colour swatches */
    $(document).on('click', '.sms-tc-swatch[data-text-color]', function () {
        $('.sms-tc-swatch').removeClass('active');
        $(this).addClass('active');
        var c = $(this).data('text-color');
        $('#fTextColor').val(c);
        $('#fTextColorPicker').val(c);
        updatePreview();
    });
    $('#fTextColorPicker').on('input change', function () {
        var c = $(this).val();
        $('.sms-tc-swatch').removeClass('active');
        $('#fTextColor').val(c);
        updatePreview();
    });

    /* Icon colour swatches */
    $(document).on('click', '.sms-ic-swatch[data-icon-color]', function () {
        $('.sms-ic-swatch').removeClass('active');
        $(this).addClass('active');
        var c = $(this).data('icon-color');
        $('#fIconColor').val(c);
        updatePreview();
    });
    $('#fIconColorPicker').on('input change', function () {
        var c = $(this).val();
        $('.sms-ic-swatch').removeClass('active');
        $('#fIconColor').val(c);
        updatePreview();
    });

    /* Border radius visual buttons */
    $(document).on('click', '.sms-radius-option', function () {
        $('.sms-radius-option').removeClass('active');
        $(this).addClass('active');
        $('#fBorderRadius').val($(this).data('radius'));
        updatePreview();
    });

    /* Font size range slider */
    $('#fFontSizeRange').on('input change', function () {
        var px = $(this).val() + 'px';
        $('#fFontSize').val(px);
        $('#fFontSizeLabel').text(px);
        updatePreview();
    });

    /* All dropdowns */
    $(document).on('change',
        '#fDarkMode, #fDirection, #fSidebarStyle, #fDateFormat, #fTimeFormat',
        function () { updatePreview(); }
    );

    /* ══════════════════════════════
       SAVE
    ══════════════════════════════ */
    $('#btnSettingsSave').on('click', function () {
        var $btn = $(this);
        var orig = $btn.html();
        var s    = collectSettings();

        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-1"></span>'+T('msg.saving','Saving...'));

        $.post(BASE_URL + '/settings/user', s, function (res) {
            $btn.prop('disabled', false).html(orig);
            if (res.status === 200) {
                toastr.success(T('msg.settings_saved','Settings saved.'));
                $('#previewChangedBadge').hide();
                var needReload = s.direction     !== (SMS_SETTINGS.direction     || 'ltr')
                    || s.dark_mode     !== (SMS_SETTINGS.dark_mode     || '0')
                    || s.sidebar_style !== (SMS_SETTINGS.sidebar_style || 'dark')
                    || s.language      !== (SMS_SETTINGS.language      || 'en')
                    || s.module_language !== (SMS_SETTINGS.module_language || 'en');
                if (needReload) {
                    setTimeout(function () { location.reload(); }, 600);
                } else {
                    Object.assign(SMS_SETTINGS, s);
                }
            } else {
                toastr.error(res.message || T('msg.error_saving_settings','Error saving settings.'));
            }
        }).fail(function () {
            $btn.prop('disabled', false).html(orig);
            toastr.error(T('general.could_not_connect','Could not connect.'));
        });
    });

    /* ══════════════════════════════
       RESET
    ══════════════════════════════ */
    $('#btnSettingsReset').on('click', function () {
        var defaults = {
            theme_color:'#0054a6', dark_mode:'0', direction:'ltr',
            sidebar_style:'dark', border_radius:'md', font_size:'14px',
            language:'en', module_language:'en', date_format:'DD/MM/YYYY', time_format:'12h',
            timezone:'Asia/Kolkata', items_per_page:'15',
        };
        $.post(BASE_URL + '/settings/user', defaults, function (res) {
            if (res.status === 200) {
                toastr.success(T('msg.settings_reset','Settings reset to defaults.'));
                setTimeout(function () { location.reload(); }, 600);
            } else {
                toastr.error(T('msg.error_resetting_settings','Error resetting settings.'));
            }
        });
    });

    /* Initial render */
    updatePreview();
    $('#previewChangedBadge').hide();
});

/* ══════════════════════════════════════════════════════
   AI Configuration — Settings Page
   ══════════════════════════════════════════════════════ */

/* Toggle AI settings panel visibility */
$(document).on('change', '#fAiEnabled', function () {
    var enabled = $(this).is(':checked');
    if (enabled) {
        $('#aiSettingsPanel').slideDown(200);
        $('#aiDisabledNotice').slideUp(200);
    } else {
        $('#aiSettingsPanel').slideUp(200);
        $('#aiDisabledNotice').slideDown(200);
    }
});

/* Toggle password visibility for API key fields */
window.toggleKeyVis = function (btn) {
    var $inp = $(btn).closest('.input-group').find('input');
    var isPass = $inp.attr('type') === 'password';
    $inp.attr('type', isPass ? 'text' : 'password');
    $(btn).find('i').toggleClass('bi-eye bi-eye-slash');
};

/* Validate an AI API key */
window.validateAiKey = function (provider) {
    var key, model, $btn, $status;

    if (provider === 'openai') {
        key    = $('#fAiOpenaiKey').val().trim();
        model  = $('#fAiOpenaiModel').val().trim();
        $btn   = $('#btnValidateOpenai');
        $status = $('#openaiStatus');
    } else {
        key    = $('#fAiGeminiKey').val().trim();
        model  = $('#fAiGeminiModel').val().trim();
        $btn   = $('#btnValidateGemini');
        $status = $('#geminiStatus');
    }

    if (!key) {
        toastr.error(T('msg.enter_api_key','Please enter an API key first.'));
        return;
    }

    var origHtml = $btn.html();
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>'+T('msg.validating','Validating...'));
    $status.html('').removeClass('text-success text-danger');

    $.ajax({
        url: BASE_URL + '/settings/ai-validate',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ provider: provider, api_key: key, model: model }),
        success: function (res) {
            $btn.prop('disabled', false).html(origHtml);
            if (res.status === 200) {
                $status.html('<i class="bi bi-check-circle-fill text-success me-1"></i>'+T('msg.valid','Valid!')).addClass('text-success');
                toastr.success(res.message || T('msg.api_key_valid','API key is valid!'));
            } else {
                $status.html('<i class="bi bi-x-circle-fill text-danger me-1"></i>'+T('msg.invalid','Invalid')).addClass('text-danger');
                toastr.error(res.message || T('msg.validation_failed','Validation failed.'));
            }
        },
        error: function () {
            $btn.prop('disabled', false).html(origHtml);
            $status.html('<i class="bi bi-x-circle-fill text-danger me-1"></i>'+T('general.error','Error')).addClass('text-danger');
            toastr.error(T('general.network_error_validating','Network error while validating.'));
        }
    });
};

/* Save AI Configuration */
window.saveAiConfig = function () {
    var $btn = $('#btnSaveAiConfig');
    var origHtml = $btn.html();

    var data = {
        ai_translation_enabled: $('#fAiEnabled').is(':checked') ? '1' : '0',
        ai_provider:            $('#fAiProvider').val(),
        ai_openai_key:          $('#fAiOpenaiKey').val().trim(),
        ai_openai_model:        $('#fAiOpenaiModel').val().trim() || 'gpt-4o-mini',
        ai_gemini_key:          $('#fAiGeminiKey').val().trim(),
        ai_gemini_model:        $('#fAiGeminiModel').val().trim() || 'gemini-2.5-flash',
    };

    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>'+T('msg.saving','Saving...'));

    $.ajax({
        url: BASE_URL + '/settings/ai-config',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (res) {
            $btn.prop('disabled', false).html(origHtml);
            if (res.status === 200) {
                toastr.success(res.message || T('msg.ai_config_saved','AI configuration saved.'));
                $('#openaiStatus, #geminiStatus').html('');
            } else {
                toastr.error(res.message || T('msg.failed_save_ai_config','Failed to save AI config.'));
            }
        },
        error: function () {
            $btn.prop('disabled', false).html(origHtml);
            toastr.error(T('general.network_error_saving','Network error while saving.'));
        }
    });
};

/* ══════════════════════════════════════════════════════
   VEHICLE INVENTORY SETTINGS
   ══════════════════════════════════════════════════════ */
(function(){
    // Load current values
    $.get(BASE_URL + '/vehicle-inventories/settings', function(res) {
        if (res && res.status === 200 && res.data) {
            $('#fViMaxImageSize').val(res.data.max_image_size || 5);
            $('#fViMaxVideoSize').val(res.data.max_video_size || 50);
            $('#fViMaxImageCount').val(res.data.max_image_count || 20);
            $('#fViMaxVideoCount').val(res.data.max_video_count || 10);
        }
    });
})();

// Load column config
var _viAllCols = {}, _viConfiguredCols = null;
(function(){
    $.get(BASE_URL + '/vehicle-inventories/enums', function(res) {
        if (!res || res.status !== 200 || !res.data) return;
        _viAllCols = res.data.list_columns || {};
        _viConfiguredCols = res.data.configured_columns || null;
        _renderViColumns();
    });
})();

function _renderViColumns() {
    var $box = $('#viColumnCheckboxes');
    if (!Object.keys(_viAllCols).length) { $box.html('<div class="text-muted small">No columns available.</div>'); return; }
    // Determine which are checked: configured > defaults
    var checked = {};
    if (_viConfiguredCols && _viConfiguredCols.length) {
        _viConfiguredCols.forEach(function(c) { checked[c] = true; });
    } else {
        for (var k in _viAllCols) { if (_viAllCols[k].default) checked[k] = true; }
    }
    var h = '';
    for (var key in _viAllCols) {
        var col = _viAllCols[key];
        h += '<div class="col-md-4 col-sm-6 col-6"><label class="form-check mb-0" style="font-size:12px;">' +
            '<input type="checkbox" class="form-check-input vi-col-chk" data-col="' + key + '" ' + (checked[key] ? 'checked' : '') + '/>' +
            '<span class="form-check-label">' + (col.label || key) + '</span></label></div>';
    }
    $box.html(h);
}

$('#btnViColSelectAll').on('click', function() { $('.vi-col-chk').prop('checked', true); });
$('#btnViColReset').on('click', function() {
    $('.vi-col-chk').each(function() {
        var key = $(this).data('col');
        $(this).prop('checked', _viAllCols[key] && _viAllCols[key].default);
    });
});

window.saveViColumns = function() {
    var cols = [];
    $('.vi-col-chk:checked').each(function() { cols.push($(this).data('col')); });
    var $btn = $('#btnSaveViColumns'); btnLoading($btn);
    $.ajax({
        url: BASE_URL + '/vehicle-inventories/list-columns', type: 'POST',
        contentType: 'application/json', data: JSON.stringify({ columns: cols }),
        success: function(r) { btnReset($btn); if (r.status === 200) toastr.success('Column config saved.'); else toastr.error(r.message || 'Failed.'); },
        error: function() { btnReset($btn); toastr.error(T('general.error','Error.')); }
    });
};

window.saveViSettings = function() {
    var $btn = $('#btnSaveViSettings'); btnLoading($btn);
    $.ajax({
        url: BASE_URL + '/vehicle-inventories/settings', type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            max_image_size: parseInt($('#fViMaxImageSize').val()) || 5,
            max_video_size: parseInt($('#fViMaxVideoSize').val()) || 50,
            max_image_count: parseInt($('#fViMaxImageCount').val()) || 20,
            max_video_count: parseInt($('#fViMaxVideoCount').val()) || 10,
        }),
        success: function(r) { btnReset($btn); if (r.status === 200) toastr.success('Vehicle inventory settings saved.'); else toastr.error(r.message || 'Failed.'); },
        error: function() { btnReset($btn); toastr.error(T('general.error','Error.')); }
    });
};

/* ══════════════════════════════════════════════════════
   PART INVENTORY SETTINGS — file upload limits + list columns
   ══════════════════════════════════════════════════════ */
(function(){
    $.get(BASE_URL + '/part-inventories/settings', function(res) {
        if (res && res.status === 200 && res.data) {
            $('#fPiMaxImageSize').val(res.data.max_image_size || 5);
            $('#fPiMaxVideoSize').val(res.data.max_video_size || 50);
            $('#fPiMaxImageCount').val(res.data.max_image_count || 20);
            $('#fPiMaxVideoCount').val(res.data.max_video_count || 10);
        }
    });
})();

var _piAllCols = {}, _piConfiguredCols = null;
(function(){
    $.get(BASE_URL + '/part-inventories/enums', function(res) {
        if (!res || res.status !== 200 || !res.data) return;
        _piAllCols = res.data.list_columns || {};
        _piConfiguredCols = res.data.configured_columns || null;
        _renderPiColumns();
    });
})();

function _renderPiColumns() {
    var $box = $('#piColumnCheckboxes');
    if (!Object.keys(_piAllCols).length) { $box.html('<div class="text-muted small">No columns available.</div>'); return; }
    var checked = {};
    if (_piConfiguredCols && _piConfiguredCols.length) {
        _piConfiguredCols.forEach(function(c) { checked[c] = true; });
    } else {
        for (var k in _piAllCols) { if (_piAllCols[k].default) checked[k] = true; }
    }
    var h = '';
    for (var key in _piAllCols) {
        var col = _piAllCols[key];
        h += '<div class="col-md-4 col-sm-6 col-6"><label class="form-check mb-0" style="font-size:12px;">' +
            '<input type="checkbox" class="form-check-input pi-col-chk" data-col="' + key + '" ' + (checked[key] ? 'checked' : '') + '/>' +
            '<span class="form-check-label">' + (col.label || key) + '</span></label></div>';
    }
    $box.html(h);
}

$(document).on('click', '#btnPiColSelectAll', function() { $('.pi-col-chk').prop('checked', true); });
$(document).on('click', '#btnPiColReset', function() {
    $('.pi-col-chk').each(function() {
        var key = $(this).data('col');
        $(this).prop('checked', _piAllCols[key] && _piAllCols[key].default);
    });
});

window.savePiColumns = function() {
    var cols = [];
    $('.pi-col-chk:checked').each(function() { cols.push($(this).data('col')); });
    var $btn = $('#btnSavePiColumns'); btnLoading($btn);
    $.ajax({
        url: BASE_URL + '/part-inventories/list-columns', type: 'POST',
        contentType: 'application/json', data: JSON.stringify({ columns: cols }),
        success: function(r) { btnReset($btn); if (r.status === 200) toastr.success('Part inventory column config saved.'); else toastr.error(r.message || 'Failed.'); },
        error: function() { btnReset($btn); toastr.error(T('general.error','Error.')); }
    });
};

window.savePiSettings = function() {
    var $btn = $('#btnSavePiSettings'); btnLoading($btn);
    $.ajax({
        url: BASE_URL + '/part-inventories/settings', type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            max_image_size: parseInt($('#fPiMaxImageSize').val()) || 5,
            max_video_size: parseInt($('#fPiMaxVideoSize').val()) || 50,
            max_image_count: parseInt($('#fPiMaxImageCount').val()) || 20,
            max_video_count: parseInt($('#fPiMaxVideoCount').val()) || 10,
        }),
        success: function(r) { btnReset($btn); if (r.status === 200) toastr.success('Part inventory settings saved.'); else toastr.error(r.message || 'Failed.'); },
        error: function() { btnReset($btn); toastr.error(T('general.error','Error.')); }
    });
};

/* ══════════════════════════════════════════════════════
   TAX CONFIGURATION
   ══════════════════════════════════════════════════════ */
var _taxTemplates = {};
var _taxCountryCode = null;

function taxRowHtml(t) {
    var name = (t && t.tax_name) || '';
    var pct  = (t && t.percentage !== undefined) ? t.percentage : 0;
    var on   = (t && t.is_enabled !== false) ? true : false;
    return '<div class="row g-2 align-items-center mb-2 tax-row">' +
        '<div class="col-auto"><label class="form-check mb-0"><input type="checkbox" class="form-check-input tax-enabled" ' + (on ? 'checked' : '') + '/></label></div>' +
        '<div class="col"><input type="text" class="form-control form-control-sm tax-name" value="' + H.esc(name) + '" placeholder="Tax name (e.g. GST, VAT)"/></div>' +
        '<div class="col-3"><div class="input-group input-group-sm"><input type="number" class="form-control tax-pct" value="' + pct + '" min="0" max="100" step="0.01" placeholder="0.00"/><span class="input-group-text">%</span></div></div>' +
        '<div class="col-auto"><button type="button" class="btn btn-sm btn-ghost-danger" onclick="$(this).closest(\'.tax-row\').remove();" title="Remove"><i class="bi bi-trash3"></i></button></div>' +
        '</div>';
}

function loadTaxConfig() {
    if (!$('#taxConfigCard').length) return;
    $.get(BASE_URL + '/settings/tax-config', function(res) {
        if (!res || res.status !== 200) { $('#taxRows').html('<div class="text-danger small">'+T('general.failed_load','Failed.')+'</div>'); return; }
        var d = res.data || {};
        _taxTemplates = d.templates || {};
        _taxCountryCode = d.country_code || null;
        var taxes = d.taxes || [];
        if (!taxes.length) {
            $('#taxRows').html('<div class="text-muted small text-center py-2">No tax types configured. Click "Add Tax" or "Load Country Template".</div>');
            return;
        }
        var h = '';
        taxes.forEach(function(t) { h += taxRowHtml(t); });
        $('#taxRows').html(h);
    });
}

function saveTaxConfig() {
    var taxes = [];
    $('.tax-row').each(function() {
        var name = $(this).find('.tax-name').val().trim();
        if (!name) return;
        var pct = parseFloat($(this).find('.tax-pct').val());
        if (isNaN(pct) || pct < 0 || pct > 100) { toastr.error(name + ': percentage must be 0-100'); taxes = null; return false; }
        taxes.push({ tax_name: name, percentage: pct, is_enabled: $(this).find('.tax-enabled').is(':checked') });
    });
    if (!taxes) return;
    var $btn = $('#btnSaveTax');
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');
    $.ajax({ url: BASE_URL + '/settings/tax-config', type: 'POST', contentType: 'application/json', data: JSON.stringify({ taxes: taxes }), success: function(r) {
        $btn.prop('disabled', false).html('<i class="bi bi-floppy me-1"></i>Save Tax Configuration');
        if (r.status === 200) toastr.success(r.message);
        else toastr.error(r.message);
    }, error: function() { $btn.prop('disabled', false).html('<i class="bi bi-floppy me-1"></i>Save Tax Configuration'); toastr.error(T('general.network_error','Network error.')); } });
}

$(function() {
    loadTaxConfig();
    $('#btnAddTax').on('click', function() {
        var $rows = $('#taxRows');
        if ($rows.find('.text-muted, .text-danger').length) $rows.html('');
        $rows.append(taxRowHtml({}));
    });
    $('#btnLoadTemplate').on('click', function() {
        var code = _taxCountryCode || 'IN';
        var tmpl = _taxTemplates[code] || _taxTemplates['_DEFAULT'] || [];
        if (!tmpl.length) { toastr.info('No template for country: ' + code); return; }
        var h = '';
        tmpl.forEach(function(t) { h += taxRowHtml({ tax_name: t.tax_name, percentage: t.percentage, is_enabled: true }); });
        $('#taxRows').html(h);
        toastr.info('Loaded ' + code + ' template with ' + tmpl.length + ' tax types. Review and save.');
    });
});
