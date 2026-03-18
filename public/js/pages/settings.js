/* ══════════════════════════════════════════════════════
   settings.js — SMS Web — Full live preview
   ══════════════════════════════════════════════════════ */
$(function () {
    'use strict';

    var _radiusMap = { none:'0', sm:'4px', md:'8px', lg:'12px', xl:'16px' };

    /* ── Collect all current settings ── */
    function collectSettings() {
        return {
            theme_color:    $('#fThemeColor').val()    || '#0054a6',
            dark_mode:      $('#fDarkMode').val()      || '0',
            direction:      $('#fDirection').val()     || 'ltr',
            sidebar_style:  $('#fSidebarStyle').val()  || 'dark',
            border_radius:  $('#fBorderRadius').val()  || 'md',
            font_size:      $('#fFontSize').val()      || '14px',
            language:       $('#fLanguage').val()      || 'en',
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
            .html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');

        $.post(BASE_URL + '/settings/user', s, function (res) {
            $btn.prop('disabled', false).html(orig);
            if (res.status === 200) {
                toastr.success('Settings saved.');
                $('#previewChangedBadge').hide();
                var needReload = s.direction     !== (SMS_SETTINGS.direction     || 'ltr')
                    || s.dark_mode     !== (SMS_SETTINGS.dark_mode     || '0')
                    || s.sidebar_style !== (SMS_SETTINGS.sidebar_style || 'dark')
                    || s.language      !== (SMS_SETTINGS.language      || 'en');
                if (needReload) {
                    setTimeout(function () { location.reload(); }, 600);
                } else {
                    Object.assign(SMS_SETTINGS, s);
                }
            } else {
                toastr.error(res.message || 'Error saving settings.');
            }
        }).fail(function () {
            $btn.prop('disabled', false).html(orig);
            toastr.error('Could not connect.');
        });
    });

    /* ══════════════════════════════
       RESET
    ══════════════════════════════ */
    $('#btnSettingsReset').on('click', function () {
        var defaults = {
            theme_color:'#0054a6', dark_mode:'0', direction:'ltr',
            sidebar_style:'dark', border_radius:'md', font_size:'14px',
            language:'en', date_format:'DD/MM/YYYY', time_format:'12h',
            timezone:'Asia/Kolkata', items_per_page:'15',
        };
        $.post(BASE_URL + '/settings/user', defaults, function (res) {
            if (res.status === 200) {
                toastr.success('Settings reset to defaults.');
                setTimeout(function () { location.reload(); }, 600);
            } else {
                toastr.error('Error resetting settings.');
            }
        });
    });

    /* Initial render */
    updatePreview();
    $('#previewChangedBadge').hide();
});