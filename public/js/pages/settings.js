/* settings.js */

$(function () {

    // ── Save settings form ───────────────────────────
    $('#frmSettings').on('submit', function (e) {
        e.preventDefault();

        var $btn = $('#btnSave');
        btnLoading($btn);

        // Collect checkbox values properly
        // (unchecked checkboxes are not serialized by jQuery serialize)
        var formData = $(this).serializeArray();

        // Ensure dark_mode and sidebar_collapsed send '0' when unchecked
        var hasDarkMode        = formData.some(function (f) { return f.name === 'dark_mode'; });
        var hasSidebarCollapsed = formData.some(function (f) { return f.name === 'sidebar_collapsed'; });
        if (!hasDarkMode)         formData.push({ name: 'dark_mode',        value: '0' });
        if (!hasSidebarCollapsed) formData.push({ name: 'sidebar_collapsed', value: '0' });

        $.ajax({
            url:        BASE_URL + '/settings/user',
            type:       'POST',
            data:       formData,
            success: function (res) {
                if (res.status === 200) {
                    toastr.success(res.message || 'Settings saved.');
                    // Reload so theme_color CSS var and dark_mode body class apply
                    setTimeout(function () { location.reload(); }, 600);
                } else {
                    toastr.error(res.message || 'Could not save settings.');
                    btnReset($btn);
                }
            },
            error: function () {
                btnReset($btn);
                toastr.error('Could not connect. Please try again.');
            },
        });
    });

    // ── Reset to defaults ────────────────────────────
    $('#btnReset').on('click', function () {
        $.post(BASE_URL + '/settings/user', {
            theme_color:       '#0054a6',
            font_size:         '14px',
            dark_mode:         '0',
            date_format:       'DD/MM/YYYY',
            timezone:          'Asia/Kolkata',
            items_per_page:    '15',
            sidebar_collapsed: '0',
            language:          'en',
        }, function (res) {
            if (res.status === 200) {
                toastr.success('Settings reset to default.');
                setTimeout(function () { location.reload(); }, 600);
            } else {
                toastr.error('Could not reset settings.');
            }
        });
    });

    // ── Live colour preview ───────────────────────────
    $('input[name="theme_color"]').on('change', function () {
        var colour = $(this).val();
        document.documentElement.style.setProperty('--tblr-primary', colour);
    });

    // ── Live font size preview ────────────────────────
    $('select[name="font_size"]').on('change', function () {
        document.documentElement.style.setProperty('--tblr-font-size', $(this).val());
    });

});
