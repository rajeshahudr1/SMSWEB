/* ══════════════════════════════════════════════════════
   profile.js — SMS Web — Complete profile management
   Depends on: /js/common/location.js, /js/common/phone.js
   ══════════════════════════════════════════════════════ */
var T=function(k,f){return SMS_T(k,f);};
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

    /* ── Custom tab switching (avoids tabler.min.js conflict) ── */
    $(document).on('click', '.sms-profile-tab[data-sms-tab]', function (e) {
        e.preventDefault();
        var target = $(this).data('sms-tab');
        $('.sms-profile-tab').removeClass('active');
        $('.tab-pane').removeClass('active show');
        $(this).addClass('active');
        $('#' + target).addClass('active show');
    });

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
        if (file.size > 2 * 1024 * 1024) { toastr.error(T('msg.image_under_2mb','Image must be under 2MB.')); return; }

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
                    toastr.success(T('msg.profile_photo_updated','Profile photo updated.'));
                } else {
                    toastr.error(res.message || T('msg.upload_failed','Upload failed.'));
                }
            },
            error: function () {
                $('#avatarUploadProgress').hide();
                toastr.error(T('msg.upload_failed_retry','Upload failed. Please try again.'));
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
            { w:'20%', cls:'bg-danger',  label:T('auth.pw_very_weak','Very weak') },
            { w:'40%', cls:'bg-danger',  label:T('auth.pw_weak','Weak')           },
            { w:'60%', cls:'bg-warning', label:T('auth.pw_fair','Fair')           },
            { w:'80%', cls:'bg-info',    label:T('auth.pw_good','Good')           },
            { w:'100%',cls:'bg-success', label:T('auth.pw_strong','Strong')       },
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

        if (!name)              { showErr('pName',    T('form.name_required','Full name is required.'));              ok=false; }
        if (!phoneRes.valid)    { showErr('pPhone',   phoneRes.error || T('form.invalid_phone','Invalid phone.'));    ok=false; }
        if (!loc.country_id)    { showErr('pCountry', T('form.country_required','Country is required.'));                ok=false; }
        if (!loc.state_id)      { showErr('pState',   T('form.state_required','State is required.'));                  ok=false; }
        if (!loc.city_id)       { showErr('pCity',    T('form.city_required','City is required.'));                   ok=false; }
        if (!zip)               { showErr('pZip',     T('form.zip_required','ZIP / Postal Code is required.'));      ok=false; }
        if (!address)           { showErr('pAddress', T('form.address_required','Address is required.'));                ok=false; }
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
                    toastr.success(res.message || T('msg.profile_updated','Profile updated successfully.'));
                    /* Keep SMS_PROFILE in sync so company tab always has fresh values */
                    if (window.SMS_PROFILE) {
                        window.SMS_PROFILE.name       = data.name       || window.SMS_PROFILE.name;
                        window.SMS_PROFILE.phone      = data.phone      || window.SMS_PROFILE.phone;
                        window.SMS_PROFILE.country_id = data.country_id || window.SMS_PROFILE.country_id;
                        window.SMS_PROFILE.state_id   = data.state_id   || window.SMS_PROFILE.state_id;
                        window.SMS_PROFILE.city_id    = data.city_id    || window.SMS_PROFILE.city_id;
                        window.SMS_PROFILE.zip_code   = data.zip_code   || window.SMS_PROFILE.zip_code;
                        window.SMS_PROFILE.address    = data.address    || window.SMS_PROFILE.address;
                    }
                    /* Update sidebar name if changed */
                    if (data.name) {
                        $('.sms-u-name').text(data.name);
                        $('.sms-header__username').text(data.name);
                    }
                } else {
                    var msg = res.errors ? res.errors.map(function(e){ return e.message||e; }).join(', ') : res.message;
                    toastr.error(msg || T('msg.could_not_save_profile','Could not save profile.'));
                }
            },
            error: function () { btnReset($btn); toastr.error(T('general.network_error_retry','Network error. Please try again.')); },
        });
    });

    /* ══════════════════════════════════════
       COMPANY FORM — PUT /profile
       API requires personal fields too, so we merge them in.
    ══════════════════════════════════════ */
    $('#frmCompany').on('submit', function (e) {
        e.preventDefault();
        clearErrs();

        var company = $('#cName').val().trim();
        if (!company) { showErr('cName', T('form.company_required','Company name is required.')); return; }

        var $btn = $('#btnCompany');
        btnLoad($btn, 'Saving…');

        /* Build company-only fields */
        var companyData = {};
        $(this).serializeArray().forEach(function (f) { companyData[f.name] = f.value; });
        if ($('#orgPhoneWrap').length) {
            var orgPh = SMS_Phone.validate('#orgPhoneWrap');
            companyData.org_phone = orgPh.valid ? orgPh.value : '';
        }

        /* Merge personal required fields from Profile tab / SMS_PROFILE */
        var sp = window.SMS_PROFILE || {};
        var personalData = {
            name:       ($('#pName').val()    || '').trim()  || sp.name       || '',
            phone:      ($('#pPhone').val()   || '').trim()  || sp.phone      || '',
            country_id: $('#pCountry').val()                 || sp.country_id || '',
            state_id:   $('#pState').val()                   || sp.state_id   || '',
            city_id:    $('#pCity').val()                    || sp.city_id    || '',
            zip_code:   ($('#pZip').val()     || '').trim()  || sp.zip_code   || '',
            address:    ($('#pAddress').val() || '').trim()  || sp.address    || '',
        };

        var data = Object.assign({}, personalData, companyData);

        $.ajax({
            url: BASE_URL + '/profile', type: 'PUT',
            contentType: 'application/json', data: JSON.stringify(data),
            success: function (res) {
                btnReset($btn);
                if (res.status === 200) {
                    toastr.success(res.message || T('msg.company_updated','Company details updated.'));
                } else {
                    var msg = res.errors ? res.errors.map(function(e){ return e.message||e; }).join('\n') : res.message;
                    toastr.error(msg || T('msg.could_not_update_company','Could not update company details.'));
                }
            },
            error: function () { btnReset($btn); toastr.error(T('general.network_error','Network error.')); },
        });
    });

    /* ── Address proof — upload immediately on file select ── */
    $('#orgProofFile').on('change', function () {
        var file = this.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toastr.error(T('msg.file_under_10mb','File must be under 10MB.')); this.value = ''; return; }

        var fd = new FormData();
        fd.append('address_proof', file);

        /* Show uploading state */
        var $wrap = $(this).closest('.col-12');
        var $hint = $wrap.find('.form-hint');
        $hint.html('<span class="spinner-border spinner-border-sm me-1"></span>Uploading...');

        $.ajax({
            url: BASE_URL + '/profile/upload-address-proof',
            type: 'POST', data: fd, processData: false, contentType: false,
            success: function (res) {
                if (res.status === 200) {
                    toastr.success(res.message || T('msg.address_proof_uploaded','Address proof uploaded.'));
                    var url = res.data && res.data.address_proof_url;
                    /* Update the current proof display */
                    if (url) {
                        var proofHtml = '<div class="d-flex align-items-center gap-2 p-2 border rounded-2 mb-2">'
                            + '<i class="bi bi-file-earmark-check-fill text-success fs-5"></i>'
                            + '<div class="flex-fill"><div class="small fw-medium">Address proof uploaded</div>'
                            + '<div class="text-muted" style="font-size:11px;">Just now</div></div>'
                            + '<a href="' + url + '" target="_blank" class="btn btn-sm btn-outline-success">'
                            + '<i class="bi bi-eye me-1"></i>View</a></div>';
                        $wrap.find('.sms-proof-current').remove();
                        $wrap.prepend('<div class="sms-proof-current">' + proofHtml + '</div>');
                    }
                    $hint.html('Accepted: JPG, PNG, PDF, DOC. Max 10MB.');
                } else {
                    toastr.error(res.message || T('msg.upload_failed','Upload failed.'));
                    $hint.html('Accepted: JPG, PNG, PDF, DOC. Max 10MB.');
                }
            },
            error: function () {
                toastr.error(T('msg.upload_failed_network','Upload failed. Network error.'));
                $hint.html('Accepted: JPG, PNG, PDF, DOC. Max 10MB.');
            },
        });
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

        if (!isGoogle && !cur)     { showErr('curPwd', T('auth.current_pw_required','Current password is required.')); ok=false; }
        if (!npw)                  { showErr('newPwd', T('auth.new_pw_required','New password is required.')); ok=false; }
        else if (npw.length < 8)   { showErr('newPwd', T('auth.pw_min_8','Password must be at least 8 characters.')); ok=false; }
        else if (!isGoogle && npw===cur) { showErr('newPwd', T('auth.pw_must_differ','New password must differ from current.')); ok=false; }
        if (!cpw)                  { showErr('confPwd', T('auth.confirm_pw','Please confirm your new password.')); ok=false; }
        else if (npw !== cpw)      { showErr('confPwd', T('auth.pw_mismatch','Passwords do not match.')); ok=false; }
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
                    toastr.success(res.message || T('msg.password_updated','Password updated successfully.'));
                    $('#frmPassword')[0].reset();
                    $('#pwdStrengthBar').hide();
                    /* Reset rule icons */
                    $('.sms-pwd-rule i').attr('class', 'bi bi-circle');
                    $('.sms-pwd-rule').removeClass('text-success').addClass('text-muted');
                    if (isGoogle) setTimeout(function(){ location.reload(); }, 1500);
                } else {
                    toastr.error(res.message || T('msg.could_not_update_password','Could not update password.'));
                }
            },
            error: function () { btnReset($btn); toastr.error(T('general.network_error','Network error.')); },
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