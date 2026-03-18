/* ── profile.js ── SMS Web ── Full profile management ── */
/* Depends on: /js/common/location.js, /js/common/phone.js */

$(function () {

    /* ══════════════════════════════════════
       HELPERS
    ══════════════════════════════════════ */
    function btnLoading($btn) {
        $btn.prop('disabled', true).data('orig', $btn.html())
            .html('<span class="spinner-border spinner-border-sm me-1"></span>Saving…');
    }
    function btnReset($btn) { $btn.prop('disabled', false).html($btn.data('orig')); }

    function showFieldErr(inputId, msg) {
        var $div = $('#err-' + inputId);
        if ($div.length) $div.addClass('d-block').text(msg);
        var $inp = $('#' + inputId + ', [name="' + inputId + '"]').first();
        if ($inp.length) $inp.addClass('is-invalid');
    }
    function clearFieldErrs() {
        $('[id^="err-"]').removeClass('d-block').text('');
        $('.is-invalid').removeClass('is-invalid');
    }

    /* ══════════════════════════════════════
       PHONE WIDGETS — via SMS_Phone
    ══════════════════════════════════════ */
    var profilePhoneInit = $('#pPhone').val() || '';
    SMS_Phone.init({ wrapEl: '#pPhoneWrap', hiddenEl: '#pPhone', initialVal: profilePhoneInit });

    // Org phone (company tab — only exists for org admins)
    if ($('#orgPhoneWrap').length) {
        SMS_Phone.init({ wrapEl: '#orgPhoneWrap', hiddenEl: '#orgPhone',
                         initialVal: $('#orgPhone').val() || '' });
    }

    /* ══════════════════════════════════════
       LOCATION CASCADE — via SMS_Location
    ══════════════════════════════════════ */
    SMS_Location.init({
        countryEl: '#pCountry',
        stateEl:   '#pState',
        cityEl:    '#pCity',
        prefill: {
            country_id: parseInt($('#prefillCountryId').val()) || null,
            state_id:   parseInt($('#prefillStateId').val())   || null,
            city_id:    parseInt($('#prefillCityId').val())    || null,
        },
    });

    /* ══════════════════════════════════════
       PROFILE FORM — PUT /profile
    ══════════════════════════════════════ */
    $('#frmProfile').on('submit', function (e) {
        e.preventDefault();
        clearFieldErrs();

        var name       = $('#pName').val().trim();
        var locVals    = SMS_Location.getValues('#pCountry', '#pState', '#pCity');
        var zip_code   = $('#pZip').val().trim();
        var address    = $('#pAddress').val().trim();
        var phoneRes   = SMS_Phone.validate('#pPhoneWrap');
        var ok         = true;

        if (!name)             { showFieldErr('pName',    'Full name is required.');           ok = false; }
        if (!phoneRes.valid)   { showFieldErr('pPhone',   phoneRes.error || 'Invalid phone.'); $('#pPhoneWrap .sms-phone-group').addClass('is-invalid'); ok = false; }
        if (!locVals.country_id){ showFieldErr('pCountry','Country is required.');             ok = false; }
        if (!locVals.state_id)  { showFieldErr('pState',  'State is required.');               ok = false; }
        if (!locVals.city_id)   { showFieldErr('pCity',   'City is required.');                ok = false; }
        if (!zip_code)          { showFieldErr('pZip',    'ZIP / Postal code is required.');   ok = false; }
        if (!address)           { showFieldErr('pAddress','Address is required.');             ok = false; }
        if (!ok) return;

        // Build data object from form + override phone/location
        var data = {};
        $(this).serializeArray().forEach(function (f) { data[f.name] = f.value; });
        data.phone      = phoneRes.value;
        data.country_id = locVals.country_id;
        data.state_id   = locVals.state_id;
        data.city_id    = locVals.city_id;

        var $btn = $('#btnProfile');
        btnLoading($btn);

        $.ajax({
            url: BASE_URL + '/profile', type: 'PUT',
            contentType: 'application/json', data: JSON.stringify(data), dataType: 'json',
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) {
                    toastr.success(res.message || 'Profile updated successfully.');
                } else {
                    var msg = (res.errors && res.errors[0]) ? res.errors[0].message : res.message;
                    toastr.error(msg || 'Could not save profile.');
                }
            },
            error: function () { btnReset($btn); toastr.error('Network error. Please try again.'); },
        });
    });

    /* ══════════════════════════════════════
       COMPANY FORM — PUT /profile
    ══════════════════════════════════════ */
    $('#frmCompany').on('submit', function (e) {
        e.preventDefault();
        clearFieldErrs();

        var company = $('#cName').val().trim();
        if (!company) { showFieldErr('cName', 'Company name is required.'); return; }

        var data = {};
        $(this).serializeArray().forEach(function (f) { data[f.name] = f.value; });

        // Override org_phone with phone widget value if present
        if ($('#orgPhoneWrap').length) {
            var orgPhoneRes = SMS_Phone.validate('#orgPhoneWrap');
            if (!orgPhoneRes.valid && orgPhoneRes.error) {
                toastr.warning('Company phone: ' + orgPhoneRes.error);
                return;
            }
            data.org_phone = orgPhoneRes.value;
        }

        var $btn = $('#btnCompany');
        btnLoading($btn);

        $.ajax({
            url: BASE_URL + '/profile', type: 'PUT',
            contentType: 'application/json', data: JSON.stringify(data), dataType: 'json',
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) toastr.success(res.message || 'Company details updated.');
                else toastr.error(res.message || 'Could not update company details.');
            },
            error: function () { btnReset($btn); toastr.error('Network error.'); },
        });
    });

    /* ══════════════════════════════════════
       AVATAR UPLOAD
    ══════════════════════════════════════ */
    $('#frmAvatar').on('submit', function (e) {
        e.preventDefault();
        var fileEl = document.getElementById('avatarFile');
        if (!fileEl || !fileEl.files.length) { toastr.warning('Please select an image file.'); return; }
        var file = fileEl.files[0];
        if (file.size > 2 * 1024 * 1024) { toastr.error('Image must be under 2MB.'); return; }

        var fd = new FormData();
        fd.append('profile_image', file);

        var $btn = $(this).find('button[type="submit"]')
            .prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Uploading…');

        $.ajax({
            url: BASE_URL + '/profile/upload-image', type: 'POST',
            data: fd, processData: false, contentType: false, dataType: 'json',
            success: function (res) {
                $btn.prop('disabled', false).html('<i class="bi bi-upload me-1"></i>Upload Photo');
                if (res.status === 200) { toastr.success('Profile photo updated.'); setTimeout(function () { location.reload(); }, 800); }
                else toastr.error(res.message || 'Upload failed.');
            },
            error: function () { $btn.prop('disabled', false).html('<i class="bi bi-upload me-1"></i>Upload Photo'); toastr.error('Upload failed.'); },
        });
    });

    /* ══════════════════════════════════════
       CHANGE PASSWORD
    ══════════════════════════════════════ */
    $('#frmPassword').on('submit', function (e) {
        e.preventDefault();
        clearFieldErrs();

        var cur = $('#curPwd').val();
        var npw = $('#newPwd').val();
        var cpw = $('#confPwd').val();
        var ok  = true;

        if (!cur)               { showFieldErr('curPwd',  'Current password is required.');                  ok = false; }
        if (!npw)               { showFieldErr('newPwd',  'New password is required.');                      ok = false; }
        else if (npw.length<8)  { showFieldErr('newPwd',  'New password must be at least 8 characters.');   ok = false; }
        else if (npw===cur)     { showFieldErr('newPwd',  'New password must differ from current password.'); ok = false; }
        if (!cpw)               { showFieldErr('confPwd', 'Please confirm your new password.');              ok = false; }
        else if (npw!==cpw)     { showFieldErr('confPwd', 'Passwords do not match.');                        ok = false; }
        if (!ok) return;

        var $btn = $('#btnPassword');
        btnLoading($btn);

        $.ajax({
            url: BASE_URL + '/profile/change-password', type: 'POST',
            data: { current_password: cur, new_password: npw, confirm_password: cpw }, dataType: 'json',
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) { toastr.success(res.message || 'Password changed.'); $('#frmPassword')[0].reset(); }
                else toastr.error(res.message || 'Could not change password.');
            },
            error: function () { btnReset($btn); toastr.error('Network error.'); },
        });
    });

    /* ══════════════════════════════════════
       SET PASSWORD (Google users)
    ══════════════════════════════════════ */
    $('#frmSetPassword').on('submit', function (e) {
        e.preventDefault();
        clearFieldErrs();

        var npw = $('#setPwd').val();
        var cpw = $('#setConfPwd').val();
        var ok  = true;

        if (!npw)              { showFieldErr('setPwd',     'Password is required.');                      ok = false; }
        else if (npw.length<8) { showFieldErr('setPwd',     'Password must be at least 8 characters.');   ok = false; }
        if (!cpw)              { showFieldErr('setConfPwd', 'Please confirm your password.');              ok = false; }
        else if (npw!==cpw)    { showFieldErr('setConfPwd', 'Passwords do not match.');                   ok = false; }
        if (!ok) return;

        var $btn = $('#btnSetPassword');
        btnLoading($btn);

        $.ajax({
            url: BASE_URL + '/profile/set-password', type: 'POST',
            data: { new_password: npw, confirm_password: cpw }, dataType: 'json',
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) { toastr.success(res.message || 'Password set.'); setTimeout(function(){ location.reload(); }, 1500); }
                else toastr.error(res.message || 'Could not set password.');
            },
            error: function () { btnReset($btn); toastr.error('Network error.'); },
        });
    });

    /* ── Generic password toggle ── */
    $(document).on('click', '.btn-pwd-toggle', function () {
        var $inp = $(this).closest('.input-group').find('input[type="password"],input[type="text"]');
        var isP  = $inp.attr('type') === 'password';
        $inp.attr('type', isP ? 'text' : 'password');
        $(this).find('i').toggleClass('bi-eye', !isP).toggleClass('bi-eye-slash', isP);
    });
});
