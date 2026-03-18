/* ══════════════════════════════════════════════════════
   settings.js — SMS Web
   Works with <select> dropdowns — no button toggles.
   ══════════════════════════════════════════════════════ */

$(function () {
    'use strict';

    var _radiusMap = { none:'0', sm:'4px', md:'8px', lg:'12px', xl:'16px' };

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
            timezone:       $('#fTimezone').val()      || 'Asia/Kolkata',
            items_per_page: $('select[name="items_per_page"]').val() || '15',
        };
    }

    function updatePreview() {
        var s   = collectSettings();
        var r   = document.documentElement;
        var rad = _radiusMap[s.border_radius] || '8px';

        r.style.setProperty('--tblr-primary',         s.theme_color);
        r.style.setProperty('--tblr-font-size',        s.font_size);
        r.style.setProperty('--tblr-border-radius',    rad);
        r.style.setProperty('--tblr-border-radius-sm', 'calc(' + rad + ' * 0.6)');
        r.style.setProperty('--tblr-border-radius-lg', 'calc(' + rad + ' * 1.5)');

        $('#previewNav').css('border-color', s.theme_color);
        $('#previewNav .sms-preview-nav__item.active').css('background', s.theme_color);
        $('#previewBtnPrimary').css({ background: s.theme_color, 'border-color': s.theme_color });
        $('#previewCard').css('border-left-color', s.theme_color);
        $('#previewValue').css('color', s.theme_color);
        $('.sms-preview-badge').css({ background: s.theme_color + '20', color: s.theme_color });

        var $previewEls = $('#previewNav, #previewCard, .sms-preview-btn');
        $previewEls.css('border-radius', rad);

        s.dark_mode === '1' ? $('body').addClass('theme-dark') : $('body').removeClass('theme-dark');
    }

    // ── Colour swatches ──
    $(document).on('click', '#colourSwatches .sms-color-swatch[data-color]', function () {
        $('#colourSwatches .sms-color-swatch').removeClass('active').find('i').hide();
        $(this).addClass('active').find('i').show();
        $('#fThemeColor').val($(this).data('color'));
        updatePreview();
    });
    $('#customColorPicker').on('input change', function () {
        $('#colourSwatches .sms-color-swatch[data-color]').removeClass('active').find('i').hide();
        $('.sms-color-custom').css('background', $(this).val());
        $('#fThemeColor').val($(this).val());
        updatePreview();
    });

    // ── All <select> changes trigger live preview ──
    $(document).on('change', '#fDarkMode, #fBorderRadius, #fFontSize', function () {
        updatePreview();
    });

    // ── Save all to DB ──
    $('#btnSettingsSave').on('click', function () {
        var $btn     = $(this);
        var origHtml = $btn.html();
        var s        = collectSettings();

        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-1"></span>' + SMS_T('btn.saving', 'Saving...'));

        $.post(BASE_URL + '/settings/user', s, function (res) {
            $btn.prop('disabled', false).html(origHtml);
            if (res.status === 200) {
                toastr.success(SMS_T('settings.saved', 'Settings saved.'));
                var needReload = s.direction     !== (SMS_SETTINGS.direction     || 'ltr')  ||
                                 s.dark_mode     !== (SMS_SETTINGS.dark_mode     || '0')    ||
                                 s.sidebar_style !== (SMS_SETTINGS.sidebar_style || 'dark') ||
                                 s.language      !== (SMS_SETTINGS.language      || 'en');
                if (needReload) {
                    setTimeout(function () { location.reload(); }, 500);
                } else {
                    Object.assign(SMS_SETTINGS, s);
                }
            } else {
                toastr.error(res.message || SMS_T('general.error', 'Error saving settings.'));
            }
        }).fail(function () {
            $btn.prop('disabled', false).html(origHtml);
            toastr.error(SMS_T('general.error', 'Could not connect.'));
        });
    });

    // ── Reset to defaults ──
    $('#btnSettingsReset').on('click', function () {
        var defaults = {
            theme_color:'#0054a6', dark_mode:'0', direction:'ltr',
            sidebar_style:'dark', border_radius:'md', font_size:'14px',
            language:'en', date_format:'DD/MM/YYYY',
            timezone:'Asia/Kolkata', items_per_page:'15',
        };
        $.post(BASE_URL + '/settings/user', defaults, function (res) {
            if (res.status === 200) {
                toastr.success(SMS_T('settings.reset_done', 'Settings reset.'));
                setTimeout(function () { location.reload(); }, 500);
            } else {
                toastr.error(SMS_T('general.error'));
            }
        });
    });

    // Initial live preview
    updatePreview();
});
