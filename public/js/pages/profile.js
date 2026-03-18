/* ══════════════════════════════════════════════════════
   profile.js — SMS Web — Complete profile management
   Depends on: /js/common/location.js, /js/common/phone.js
   ══════════════════════════════════════════════════════ */
$(function () {
    'use strict';

    /* ── Helpers ─────────────────────────────────── */
    function btnLoad($btn, text) {
        $btn.prop('disabled', true).data('orig', $btn.html())
            .html('<span class="spinner-border spinner-border-sm me-1"></span>' + (text||'Saving…'));
    }
    function btnReset($btn) {
        $btn.prop('disabled', false).html($btn.data('orig') || $btn.html());
    }
    function clearErrs() {
        $('[id^="err-"]').removeClass('d-block').text('');
        $('.is-invalid').removeClass('is-invalid');
    }
    function showErr(id, msg) {
        $('#err-' + id).addClass('d-block').text(msg);
        $('#' + id + ', [name="' + id + '"]').first().addClass('is-invalid');
    }

    /* ── Avatar — click zone ──────────────────────── */
    $('#avatarClickZone').on('click', function (e) {
        /* Don't re-trigger if the click came FROM the file input itself */
        if ($(e.target).is('#avatarFile')) return;
        $('#avatarFile').trigger('click');
    });

    /* Stop the file input click from bubbling up to avatarClickZone */
    $('#avatarFile').on('click', function (e) {
        e.stopPropagation();
    });

    $('#avatarFile').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toastr.error('Image must be under 2MB.'); return; }

        var fd = new FormData();
        fd.append('profile_image', file);

        // Preview immediately
        var reader = new FileReader();
        reader.onload = function (e) {
            if ($('#avatarImg').length) {
                $('#avatarImg').attr('src', e.target.result);
            } else {
                $('#avatarInitials').replaceWith(
                    '<img src="' + e.target.result + '" class="sms-avatar-img" id="avatarImg"/>'
                );
            }
        };
        reader.readAsDataURL(file);

        // Upload
        $('#avatarUploadProgress').show();
        $.ajax({
            url: BASE_URL + '/profile/upload-image',
            type: 'POST', data: fd, processData: false, contentType: false,
            success: function (res) {
                $('#avatarUploadProgress').hide();
                if (res.status === 200) {
                    toastr.success('Profile photo updated.');
                } else {
                    toastr.error(res.message || 'Upload failed.');
                }
            },
            error: function () {
                $('#avatarUploadProgress').hide();
                toastr.error('Upload failed. Please try again.');
            },
        });
    });

    /* ── Phone widget ─────────────────────────────── */
    SMS_Phone.init({
        wrapEl:     '#pPhoneWrap',
        hiddenEl:   '#pPhone',
        initialVal: $('#pPhone').val() || '',
    });

    if ($('#orgPhoneWrap').length) {
        SMS_Phone.init({
            wrapEl:     '#orgPhoneWrap',
            hiddenEl:   '#orgPhone',
            initialVal: $('#orgPhone').val() || '',
        });
    }

    /* ── Location cascade ─────────────────────────── */
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

    /* ── Aadhar mask: auto-space XXXX XXXX XXXX ──── */
    $('#pAadhar').on('input', function () {
        var v = $(this).val().replace(/\D/g, '').slice(0, 12);
        var masked = v.replace(/(.{4})/g, '$1 ').trim();
        $(this).val(masked);
    });

    /* ── Profile form reset ───────────────────────── */
    $('#btnProfileReset').on('click', function () {
        location.reload();
    });

    /* ── Password strength ────────────────────────── */
    $('#newPwd').on('input', function () {
        var pw = $(this).val();
        if (!pw) { $('#pwdStrengthBar').hide(); return; }
        $('#pwdStrengthBar').show();

        var score = 0;
        var hasLen   = pw.length >= 8;
        var hasUpper = /[A-Z]/.test(pw);
        var hasNum   = /[0-9]/.test(pw);
        var hasSpec  = /[^A-Za-z0-9]/.test(pw);
        if (hasLen)   score++;
        if (hasUpper) score++;
        if (hasNum)   score++;
        if (hasSpec)  score++;
        if (pw.length >= 12) score++;

        var levels = [
            { w:'20%', cls:'bg-danger',  label:'Very weak' },
            { w:'40%', cls:'bg-danger',  label:'Weak'      },
            { w:'60%', cls:'bg-warning', label:'Fair'      },
            { w:'80%', cls:'bg-info',    label:'Good'      },
            { w:'100%',cls:'bg-success', label:'Strong'    },
        ];
        var lvl = levels[Math.max(0, score - 1)] || levels[0];
        $('#pwdStrengthFill').css('width', lvl.w).attr('class', 'progress-bar ' + lvl.cls);
        $('#pwdStrengthLabel').text(lvl.label);

        // Rule indicators
        function setRule(id, ok) {
            $('#rule-' + id).find('i').attr('class', ok ? 'bi bi-check-circle-fill text-success' : 'bi bi-circle text-muted');
            $('#rule-' + id).toggleClass('text-success', ok).toggleClass('text-muted', !ok);
        }
        setRule('len',   hasLen);
        setRule('upper', hasUpper);
        setRule('num',   hasNum);
    });

    /* ══════════════════════════════════════
       PROFILE FORM — PUT /profile
    ══════════════════════════════════════ */
    $('#frmProfile').on('submit', function (e) {
        e.preventDefault();
        clearErrs();

        var name     = $('#pName').val().trim();
        var zip      = $('#pZip').val().trim();
        var address  = $('#pAddress').val().trim();
        var loc      = SMS_Location.getValues('#pCountry', '#pState', '#pCity');
        var phoneRes = SMS_Phone.validate('#pPhoneWrap');
        var ok = true;

        if (!name)              { showErr('pName',    'Full name is required.');              ok=false; }
        if (!phoneRes.valid)    { showErr('pPhone',   phoneRes.error || 'Invalid phone.');    ok=false; }
        if (!loc.country_id)    { showErr('pCountry', 'Country is required.');                ok=false; }
        if (!loc.state_id)      { showErr('pState',   'State is required.');                  ok=false; }
        if (!loc.city_id)       { showErr('pCity',    'City is required.');                   ok=false; }
        if (!zip)               { showErr('pZip',     'ZIP / Postal Code is required.');      ok=false; }
        if (!address)           { showErr('pAddress', 'Address is required.');                ok=false; }
        if (!ok) {
            /* Scroll to first error */
            var $first = $('.is-invalid').first();
            if ($first.length) $('html,body').animate({ scrollTop: $first.offset().top - 120 }, 200);
            return;
        }

        var data = {};
        $(this).serializeArray().forEach(function (f) { if (f.name !== 'phone') data[f.name] = f.value; });
        data.phone      = phoneRes.value;
        data.country_id = loc.country_id;
        data.state_id   = loc.state_id;
        data.city_id    = loc.city_id;
        /* Clean aadhar: remove spaces before sending */
        if (data.aadhar_no) data.aadhar_no = data.aadhar_no.replace(/\s/g, '');

        var $btn = $('#btnProfile');
        btnLoad($btn, 'Saving…');

        $.ajax({
            url: BASE_URL + '/profile', type: 'PUT',
            contentType: 'application/json', data: JSON.stringify(data),
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) {
                    toastr.success(res.message || 'Profile updated successfully.');
                    /* Update sidebar name if changed */
                    if (data.name) {
                        $('.sms-u-name').text(data.name);
                        $('.sms-header__username').text(data.name);
                    }
                } else {
                    var msg = res.errors ? res.errors.map(function(e){ return e.message||e; }).join(', ') : res.message;
                    toastr.error(msg || 'Could not save profile.');
                }
            },
            error: function () { btnReset($btn); toastr.error('Network error. Please try again.'); },
        });
    });

    /* ══════════════════════════════════════
       COMPANY FORM — PUT /profile (with file upload for address proof)
    ══════════════════════════════════════ */
    $('#frmCompany').on('submit', function (e) {
        e.preventDefault();
        clearErrs();

        var company = $('#cName').val().trim();
        if (!company) { showErr('cName', 'Company name is required.'); return; }

        var $btn = $('#btnCompany');
        btnLoad($btn, 'Saving…');

        var proofFile = document.getElementById('orgProofFile');
        var hasFile   = proofFile && proofFile.files.length > 0;

        if (hasFile) {
            /* Use FormData for file upload */
            var fd = new FormData(document.getElementById('frmCompany'));
            /* Also include org_phone from widget */
            if ($('#orgPhoneWrap').length) {
                var orgPh = SMS_Phone.validate('#orgPhoneWrap');
                fd.set('org_phone', orgPh.valid ? orgPh.value : '');
            }

            $.ajax({
                url: BASE_URL + '/profile', type: 'PUT',
                data: fd, processData: false, contentType: false,
                success: function (res) {
                    btnReset($btn);
                    if (res.status === 200) toastr.success(res.message || 'Company details updated.');
                    else toastr.error(res.message || 'Could not update company details.');
                },
                error: function () { btnReset($btn); toastr.error('Network error.'); },
            });
        } else {
            /* JSON for no-file update */
            var data = {};
            $(this).serializeArray().forEach(function (f) { data[f.name] = f.value; });
            if ($('#orgPhoneWrap').length) {
                var orgPh2 = SMS_Phone.validate('#orgPhoneWrap');
                data.org_phone = orgPh2.valid ? orgPh2.value : '';
            }

            $.ajax({
                url: BASE_URL + '/profile', type: 'PUT',
                contentType: 'application/json', data: JSON.stringify(data),
                success: function (res) {
                    btnReset($btn);
                    if (res.status === 200) toastr.success(res.message || 'Company details updated.');
                    else toastr.error(res.message || 'Could not update company details.');
                },
                error: function () { btnReset($btn); toastr.error('Network error.'); },
            });
        }
    });

    /* ══════════════════════════════════════
       PASSWORD FORM
    ══════════════════════════════════════ */
    $('#frmPassword').on('submit', function (e) {
        e.preventDefault();
        clearErrs();

        var isGoogle = !$('#curPwd').length;
        var cur  = $('#curPwd').val();
        var npw  = $('#newPwd').val();
        var cpw  = $('#confPwd').val();
        var ok   = true;

        if (!isGoogle && !cur)     { showErr('curPwd', 'Current password is required.'); ok=false; }
        if (!npw)                  { showErr('newPwd', 'New password is required.'); ok=false; }
        else if (npw.length < 8)   { showErr('newPwd', 'Password must be at least 8 characters.'); ok=false; }
        else if (!isGoogle && npw===cur) { showErr('newPwd', 'New password must differ from current.'); ok=false; }
        if (!cpw)                  { showErr('confPwd', 'Please confirm your new password.'); ok=false; }
        else if (npw !== cpw)      { showErr('confPwd', 'Passwords do not match.'); ok=false; }
        if (!ok) return;

        var $btn = $('#btnPassword');
        btnLoad($btn, 'Saving…');

        var url  = isGoogle ? BASE_URL + '/profile/set-password' : BASE_URL + '/profile/change-password';
        var data = isGoogle
            ? { new_password: npw, confirm_password: cpw }
            : { current_password: cur, new_password: npw, confirm_password: cpw };

        $.ajax({
            url: url, type: 'POST', data: data,
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) {
                    toastr.success(res.message || 'Password updated successfully.');
                    $('#frmPassword')[0].reset();
                    $('#pwdStrengthBar').hide();
                    /* Reset rule icons */
                    $('.sms-pwd-rule i').attr('class', 'bi bi-circle');
                    $('.sms-pwd-rule').removeClass('text-success').addClass('text-muted');
                    if (isGoogle) setTimeout(function(){ location.reload(); }, 1500);
                } else {
                    toastr.error(res.message || 'Could not update password.');
                }
            },
            error: function () { btnReset($btn); toastr.error('Network error.'); },
        });
    });

    /* ── Password visibility toggle ─────────────── */
    $(document).on('click', '.sms-pwd-toggle', function () {
        var $inp = $(this).closest('.input-group').find('input');
        var show = $inp.attr('type') === 'password';
        $inp.attr('type', show ? 'text' : 'password');
        $(this).find('i').toggleClass('bi-eye', !show).toggleClass('bi-eye-slash', show);
    });
});