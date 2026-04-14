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

    /* ── Subscription Tab ──────────────────────── */
    var _subLoaded = false;
    $(document).on('click', '.sms-profile-tab[data-sms-tab="tab-subscription"]', function () {
        if (_subLoaded) return;
        _subLoaded = true;
        loadSubscriptionTab();
    });

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'subscription') {
        setTimeout(function () { $('.sms-profile-tab[data-sms-tab="tab-subscription"]').trigger('click'); }, 300);
    }

    var _stMap = { active: { cls: 'bg-success-lt', label: 'Active', icon: 'bi-check-circle-fill' }, trialing: { cls: 'bg-info-lt', label: 'Trialing', icon: 'bi-clock-fill' }, expired: { cls: 'bg-danger-lt', label: 'Expired', icon: 'bi-x-circle-fill' }, cancelled: { cls: 'bg-secondary-lt', label: 'Cancelled', icon: 'bi-slash-circle' }, pending: { cls: 'bg-warning-lt', label: 'Pending', icon: 'bi-hourglass-split' }, past_due: { cls: 'bg-orange-lt', label: 'Past Due', icon: 'bi-exclamation-triangle-fill' }, suspended: { cls: 'bg-dark-lt', label: 'Suspended', icon: 'bi-pause-circle-fill' } };

    function loadSubscriptionTab() {
        var $c = $('#subTabContent');
        $c.html('<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>');
        $.get(BASE_URL + '/subscriptions/current', function (res) {
            if (!res || res.status !== 200) { $c.html('<div class="text-muted text-center py-4">Failed to load.</div>'); return; }
            var sub = res.data;
            var h = '';
            if (!sub) {
                h += '<div class="text-center py-4"><i class="bi bi-box-seam d-block mb-2" style="font-size:36px;opacity:.3;"></i><p class="text-muted">No active subscription.</p>';
                h += '<a href="/choose-plan" class="btn btn-primary btn-sm"><i class="bi bi-credit-card me-1"></i>Choose a Plan</a></div>';
                $c.html(h); return;
            }

            // ── Inner tabs ──
            h += '<ul class="nav nav-tabs nav-tabs-sm mb-3" id="subInnerTabs">';
            h += '<li class="nav-item"><a class="nav-link active" href="#" data-sub-tab="details"><i class="bi bi-info-circle me-1"></i>Details</a></li>';
            h += '<li class="nav-item"><a class="nav-link" href="#" data-sub-tab="payments"><i class="bi bi-wallet2 me-1"></i>Payments <span class="badge bg-secondary-lt ms-1">' + (sub.payments ? sub.payments.length : 0) + '</span></a></li>';
            h += '<li class="nav-item"><a class="nav-link" href="#" data-sub-tab="history"><i class="bi bi-clock-history me-1"></i>History <span class="badge bg-secondary-lt ms-1">' + (sub.events ? sub.events.length : 0) + '</span></a></li>';
            h += '</ul>';
            h += '<div class="sub-inner-pane" id="subDetailsPane">' + buildDetailsPane(sub) + '</div>';
            h += '<div class="sub-inner-pane" id="subPaymentsPane" style="display:none;">' + buildPaymentsPane(sub) + '</div>';
            h += '<div class="sub-inner-pane" id="subHistoryPane" style="display:none;">' + buildHistoryPane(sub) + '</div>';
            $c.html(h);
        }).fail(function () { $c.html('<div class="text-muted text-center py-4">Failed to load.</div>'); });
    }

    // Inner tab switching
    $(document).on('click', '#subInnerTabs .nav-link', function (e) {
        e.preventDefault();
        var tab = $(this).data('sub-tab');
        $('#subInnerTabs .nav-link').removeClass('active');
        $(this).addClass('active');
        $('.sub-inner-pane').hide();
        if (tab === 'details') $('#subDetailsPane').show();
        else if (tab === 'payments') $('#subPaymentsPane').show();
        else $('#subHistoryPane').show();
    });

    var _evIcons = { created: 'bi-plus-circle text-primary', activated: 'bi-check-circle text-success', renewed: 'bi-arrow-repeat text-success', upgraded: 'bi-arrow-up-circle text-info', downgraded: 'bi-arrow-down-circle text-warning', cancelled: 'bi-x-circle text-danger', expired: 'bi-clock text-danger', payment_failed: 'bi-exclamation-triangle text-danger', trial_started: 'bi-gift text-info', trial_ended: 'bi-clock text-warning', manually_extended: 'bi-calendar-plus text-primary', suspended: 'bi-pause-circle text-dark', past_due: 'bi-exclamation-triangle text-warning' };

    function buildDetailsPane(sub) {
        var st = _stMap[sub.status] || { cls: 'bg-secondary-lt', label: sub.status, icon: 'bi-circle' };
        var isCancelled = !!sub.cancelled_at;
        var isActive = (sub.status === 'active' || sub.status === 'trialing');
        // Use the actual package price for display, not the subscription's prorated/trial amount
        var displayPrice = parseFloat(sub.display_price || sub.package_price || sub.total_amount || 0);
        var h = '';

        // Plan card
        h += '<div class="border rounded p-3 mb-3" style="background:var(--tblr-bg-surface-secondary);">';
        h += '<div class="d-flex align-items-center gap-3 mb-2">';
        h += '<div><h5 class="mb-0 fw-bold">' + H.esc(sub.package_name || '-') + '</h5>';
        if (isCancelled && isActive) {
            h += '<span class="badge bg-warning-lt mt-1"><i class="bi bi-exclamation-triangle me-1"></i>Cancels on ' + smsFormatDateTime(sub.end_date) + '</span>';
        } else {
            h += '<span class="badge ' + st.cls + ' mt-1"><i class="bi ' + st.icon + ' me-1"></i>' + st.label + '</span>';
        }
        h += '</div>';
        h += '<div class="ms-auto text-end"><div class="fw-bold" style="font-size:20px;">' + H.esc(sub.currency || '') + displayPrice.toFixed(2) + '</div><div class="text-muted small">/' + (sub.billing_cycle === 'yearly' ? 'year' : 'month') + '</div></div>';
        h += '</div>';
        h += '<div class="row g-2 mt-2">';
        h += '<div class="col-6 col-sm-3"><div class="text-muted small">Start Date</div><div class="fw-medium">' + smsFormatDateTime(sub.start_date) + '</div></div>';
        h += '<div class="col-6 col-sm-3"><div class="text-muted small">End Date</div><div class="fw-medium">' + smsFormatDateTime(sub.end_date) + '</div></div>';
        h += '<div class="col-6 col-sm-3"><div class="text-muted small">Billing Cycle</div><div class="fw-medium" style="text-transform:capitalize;">' + H.esc(sub.billing_cycle || '-') + '</div></div>';
        h += '<div class="col-6 col-sm-3"><div class="text-muted small">Auto-Renew</div>';
        if (!isCancelled && isActive) {
            h += '<div class="form-check form-switch mt-1"><input class="form-check-input" type="checkbox" id="subAutoRenew"' + (sub.auto_renew ? ' checked' : '') + '/></div>';
            h += '<div class="text-muted" style="font-size:10px;">' + (sub.auto_renew ? 'Renews on ' + smsFormatDate(sub.end_date) : 'Expires on ' + smsFormatDate(sub.end_date)) + '</div>';
        } else { h += '<div class="text-muted small">-</div>'; }
        h += '</div>';
        if (sub.is_trial) h += '<div class="col-12 mt-2"><span class="badge bg-info-lt"><i class="bi bi-gift me-1"></i>Trial Period</span></div>';
        h += '</div></div>';

        // Actions
        h += '<div class="d-flex gap-2 mb-3 flex-wrap">';
        if (isActive && !isCancelled) {
            h += '<button class="btn btn-sm btn-primary" id="btnRenewSub" data-pkg="' + H.esc(sub.package_id || '') + '" data-cycle="' + H.esc(sub.billing_cycle || 'monthly') + '"><i class="bi bi-arrow-repeat me-1"></i>Renew</button>';
            h += '<a href="/choose-plan?current_pkg=' + (sub.package_id || '') + '&current_price=' + displayPrice + '" class="btn btn-sm btn-outline-primary"><i class="bi bi-arrow-up-circle me-1"></i>Upgrade Plan</a>';
            h += '<button class="btn btn-sm btn-outline-danger" id="btnCancelSub"><i class="bi bi-x-circle me-1"></i>Cancel</button>';
        }
        if (isCancelled && isActive) {
            h += '<button class="btn btn-sm btn-success" id="btnReactivateSub"><i class="bi bi-arrow-counterclockwise me-1"></i>Undo Cancel</button>';
            h += '<button class="btn btn-sm btn-primary" id="btnRenewSub" data-pkg="' + H.esc(sub.package_id || '') + '" data-cycle="' + H.esc(sub.billing_cycle || 'monthly') + '"><i class="bi bi-arrow-repeat me-1"></i>Renew Now</button>';
            h += '<a href="/choose-plan?current_pkg=' + (sub.package_id || '') + '&current_price=' + displayPrice + '" class="btn btn-sm btn-outline-primary"><i class="bi bi-arrow-up-circle me-1"></i>Change Plan</a>';
        }
        if (sub.status === 'expired') {
            h += '<a href="/choose-plan" class="btn btn-sm btn-success"><i class="bi bi-credit-card me-1"></i>Choose New Plan</a>';
        }
        h += '</div>';

        // All subscriptions list
        var allSubs = sub.all_subscriptions || [];
        if (allSubs.length > 1) {
            h += '<h6 class="fw-semibold mb-2"><i class="bi bi-box-seam me-1 text-primary"></i>Subscription History</h6>';
            h += '<div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead><tr><th>Plan</th><th>Cycle</th><th>Status</th><th>Period</th><th class="text-end">Paid</th></tr></thead><tbody>';
            allSubs.forEach(function (ss) {
                var sst = _stMap[ss.status] || { cls: 'bg-secondary-lt', label: ss.status };
                var isCur = (String(ss.id) === String(sub.id));
                h += '<tr' + (isCur ? ' class="table-primary"' : '') + '>';
                h += '<td class="fw-medium">' + H.esc(ss.package_name || '-') + (isCur ? ' <span class="badge bg-primary-lt" style="font-size:9px;">Current</span>' : '') + '</td>';
                h += '<td style="text-transform:capitalize;">' + H.esc(ss.billing_cycle || '-') + '</td>';
                h += '<td><span class="badge ' + sst.cls + '">' + sst.label + '</span></td>';
                h += '<td class="small">' + smsFormatDate(ss.start_date) + ' - ' + smsFormatDate(ss.end_date) + '</td>';
                h += '<td class="text-end">' + H.esc(ss.currency || '') + parseFloat(ss.total_amount || 0).toFixed(2) + '</td></tr>';
            });
            h += '</tbody></table></div>';
        }
        return h;
    }

    function buildPaymentsPane(sub) {
        var payments = sub.payments || [];
        if (!payments.length) return '<div class="text-center py-4 text-muted"><i class="bi bi-wallet2 d-block mb-2" style="font-size:32px;opacity:.3;"></i>No payments yet.</div>';
        var h = '<div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead><tr><th>Date & Time</th><th>Package</th><th>Gateway</th><th>Method</th><th>Status</th><th class="text-end">Amount</th></tr></thead><tbody>';
        payments.forEach(function (p) {
            var pst = p.status === 'completed' ? 'bg-success-lt' : p.status === 'failed' ? 'bg-danger-lt' : 'bg-warning-lt';
            h += '<tr><td class="small">' + smsFormatDateTime(p.paid_at || p.created_at) + '</td>';
            h += '<td>' + H.esc(p.package_name || '-') + '</td>';
            h += '<td style="text-transform:capitalize;">' + H.esc(p.gateway || '-') + '</td>';
            h += '<td style="text-transform:capitalize;">' + H.esc(p.payment_method || '-') + '</td>';
            h += '<td><span class="badge ' + pst + '">' + H.esc(p.status) + '</span></td>';
            h += '<td class="text-end fw-medium">' + H.esc(p.currency || '') + parseFloat(p.total_amount || 0).toFixed(2) + '</td></tr>';
        });
        h += '</tbody></table></div>';
        return h;
    }

    function buildHistoryPane(sub) {
        var events = sub.events || [];
        var h = '';
        if (!events.length) {
            h += '<div class="text-center py-4 text-muted"><i class="bi bi-clock-history d-block mb-2" style="font-size:32px;opacity:.3;"></i>No activity history.</div>';
            return h;
        }
        h += '<div class="timeline-list">';
        events.forEach(function (e, i) {
            var icon = _evIcons[e.event_type] || 'bi-circle text-muted';
            var isLast = (i === events.length - 1);
            h += '<div class="d-flex gap-3 position-relative" style="padding-bottom:' + (isLast ? '0' : '16') + 'px;">';
            // Vertical line
            if (!isLast) h += '<div style="position:absolute;left:15px;top:24px;bottom:0;width:2px;background:#e2e8f0;"></div>';
            // Icon circle
            h += '<div class="flex-shrink-0" style="width:32px;height:32px;border-radius:50%;background:var(--tblr-bg-surface-secondary);display:flex;align-items:center;justify-content:center;z-index:1;border:2px solid #e2e8f0;">';
            h += '<i class="bi ' + icon + '" style="font-size:13px;"></i></div>';
            // Content
            h += '<div class="flex-fill pt-1">';
            h += '<div class="d-flex align-items-center gap-2">';
            h += '<span class="fw-semibold" style="font-size:13px;">' + H.esc(e.description || e.event_type) + '</span>';
            h += '<span class="badge bg-light text-muted" style="font-size:10px;text-transform:capitalize;">' + H.esc(e.event_type.replace(/_/g, ' ')) + '</span>';
            h += '</div>';
            h += '<div class="text-muted" style="font-size:11px;margin-top:2px;"><i class="bi bi-calendar3 me-1"></i>' + smsFormatDateTime(e.created_at) + '</div>';
            h += '</div></div>';
        });
        h += '</div>';
        return h;
    }

    // Reactivate (undo cancel)
    $(document).on('click', '#btnReactivateSub', function () {
        var $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>...');
        $.ajax({ url: BASE_URL + '/subscriptions/reactivate', type: 'POST', success: function (r) {
            $btn.prop('disabled', false).html('<i class="bi bi-arrow-counterclockwise me-1"></i>Undo Cancel');
            if (r.status === 200) { toastr.success(r.message); _subLoaded = false; loadSubscriptionTab(); }
            else toastr.error(r.message || 'Failed.');
        }, error: function () { $btn.prop('disabled', false).html('<i class="bi bi-arrow-counterclockwise me-1"></i>Undo Cancel'); toastr.error('Failed.'); } });
    });

    // Renew current plan → go to payment page
    $(document).on('click', '#btnRenewSub', function () {
        var $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Processing...');
        $.ajax({ url: BASE_URL + '/subscriptions/renew', type: 'POST', contentType: 'application/json', data: '{}', success: function (r) {
            $btn.prop('disabled', false).html('<i class="bi bi-arrow-repeat me-1"></i>Renew');
            if (r.status === 200 && r.data && r.data.subscription_uuid) {
                window.location.href = '/subscriptions/payment/' + r.data.subscription_uuid;
            } else { toastr.error(r.message || 'Failed.'); }
        }, error: function () { $btn.prop('disabled', false).html('<i class="bi bi-arrow-repeat me-1"></i>Renew'); toastr.error('Failed.'); } });
    });

    // Toggle auto-renew
    $(document).on('change', '#subAutoRenew', function () {
        var isOn = $(this).is(':checked');
        $.ajax({ url: BASE_URL + '/subscriptions/toggle-auto-renew', type: 'PATCH', success: function (r) {
            if (r.status === 200) { toastr.success(r.message); _subLoaded = false; loadSubscriptionTab(); }
            else toastr.error(r.message || 'Failed.');
        } });
    });

    // Cancel subscription
    $(document).on('click', '#btnCancelSub', function () {
        smsConfirm({ title: 'Cancel Subscription', msg: 'Are you sure? Your subscription will remain active until the end of the current billing period. After that, access will be revoked.', btnClass: 'btn-danger', btnText: 'Cancel Subscription', onConfirm: function () {
            $.ajax({ url: BASE_URL + '/subscriptions/cancel', type: 'POST', contentType: 'application/json', data: JSON.stringify({ reason: 'Cancelled by user from profile' }), success: function (r) {
                if (r.status === 200) { toastr.success(r.message); _subLoaded = false; loadSubscriptionTab(); } else toastr.error(r.message || 'Failed.');
            } });
        } });
    });
});