/**
 * SMS Web — common/phone.js
 * Country-code picker + phone number validation.
 *
 * Renders a "dial code" dropdown + number input side by side.
 * Validates digit count based on the selected country's phone_code rules.
 *
 * Usage:
 *   // Attach to a container div that holds a hidden input for the full phone
 *   SMS_Phone.init({
 *     wrapEl:     '#phoneWrap',      // container div
 *     hiddenEl:   '#phone',          // hidden input that gets the final "+91XXXXXXXXXX" value
 *     initialVal: '+919876543210',   // optional: pre-fill
 *   });
 *
 *   // Validate and get value
 *   var result = SMS_Phone.validate('#phoneWrap');
 *   // result = { valid: true, value: '+919876543210', error: '' }
 *   // or      { valid: false, value: '', error: 'Phone number must be 10 digits for +91' }
 */

window.SMS_Phone = (function ($) {
    'use strict';

    /* ── Digit length rules by dial code ──────────────────────
       Most countries: 10 digits after the code.
       Known exceptions listed below.
       If code not found → accept 7–15 digits (ITU standard).
    ─────────────────────────────────────────────────────────── */
    var DIGIT_RULES = {
        '+1':    10,   // USA, Canada
        '+7':    10,   // Russia
        '+20':   10,   // Egypt
        '+27':   9,    // South Africa
        '+30':   10,   // Greece
        '+31':   9,    // Netherlands
        '+32':   9,    // Belgium
        '+33':   9,    // France
        '+34':   9,    // Spain
        '+36':   9,    // Hungary
        '+39':   10,   // Italy
        '+40':   9,    // Romania
        '+41':   9,    // Switzerland
        '+43':   10,   // Austria
        '+44':   10,   // UK
        '+45':   8,    // Denmark
        '+46':   9,    // Sweden
        '+47':   8,    // Norway
        '+48':   9,    // Poland
        '+49':   10,   // Germany
        '+51':   9,    // Peru
        '+52':   10,   // Mexico
        '+54':   10,   // Argentina
        '+55':   11,   // Brazil
        '+56':   9,    // Chile
        '+57':   10,   // Colombia
        '+58':   10,   // Venezuela
        '+60':   9,    // Malaysia
        '+61':   9,    // Australia
        '+62':   10,   // Indonesia
        '+63':   10,   // Philippines
        '+64':   9,    // New Zealand
        '+65':   8,    // Singapore
        '+66':   9,    // Thailand
        '+81':   10,   // Japan
        '+82':   10,   // South Korea
        '+84':   9,    // Vietnam
        '+86':   11,   // China
        '+90':   10,   // Turkey
        '+91':   10,   // India
        '+92':   10,   // Pakistan
        '+93':   9,    // Afghanistan
        '+94':   9,    // Sri Lanka
        '+95':   9,    // Myanmar
        '+98':   10,   // Iran
        '+212':  9,    // Morocco
        '+213':  9,    // Algeria
        '+216':  8,    // Tunisia
        '+218':  9,    // Libya
        '+220':  7,    // Gambia
        '+221':  9,    // Senegal
        '+234':  10,   // Nigeria
        '+254':  9,    // Kenya
        '+255':  9,    // Tanzania
        '+256':  9,    // Uganda
        '+260':  9,    // Zambia
        '+263':  9,    // Zimbabwe
        '+351':  9,    // Portugal
        '+352':  9,    // Luxembourg
        '+353':  9,    // Ireland
        '+354':  7,    // Iceland
        '+358':  9,    // Finland
        '+359':  9,    // Bulgaria
        '+370':  8,    // Lithuania
        '+371':  8,    // Latvia
        '+372':  8,    // Estonia
        '+380':  9,    // Ukraine
        '+381':  9,    // Serbia
        '+385':  9,    // Croatia
        '+386':  8,    // Slovenia
        '+420':  9,    // Czech Republic
        '+421':  9,    // Slovakia
        '+880':  10,   // Bangladesh
        '+966':  9,    // Saudi Arabia
        '+971':  9,    // UAE
        '+972':  9,    // Israel
        '+973':  8,    // Bahrain
        '+974':  8,    // Qatar
        '+975':  8,    // Bhutan
        '+976':  8,    // Mongolia
        '+977':  10,   // Nepal
        '+992':  9,    // Tajikistan
        '+993':  8,    // Turkmenistan
        '+994':  9,    // Azerbaijan
        '+995':  9,    // Georgia
        '+996':  9,    // Kyrgyzstan
        '+998':  9,    // Uzbekistan
    };

    var _countriesCache = null;  // stores countries after first load

    /* ── Build dial code selector HTML ── */
    function _buildHTML(wrapperId) {
        return [
            '<div class="sms-phone-group" id="', wrapperId, '">',
            '  <div class="sms-phone-code-wrap">',
            '    <select class="sms-phone-code-sel" aria-label="Country code">',
            '      <option value="">+--</option>',
            '    </select>',
            '  </div>',
            '  <input type="text" class="sms-phone-number-inp" ',
            '         placeholder="Mobile number" inputmode="numeric" ',
            '         maxlength="15" autocomplete="tel-national"/>',
            '</div>',
        ].join('');
    }

    /* ── Populate dial code <select> ── */
    function _populateCodes($sel, countries, selectedCode) {
        $sel.find('option:not(:first)').remove();
        $.each(countries || [], function (_, c) {
            var code = c.phone_code ? (c.phone_code.startsWith('+') ? c.phone_code : '+' + c.phone_code) : '';
            if (!code) return;
            var opt = $('<option>', {
                value: code,
                text:  c.sort_name + '  ' + code,
            });
            if (code === selectedCode) opt.prop('selected', true);
            $sel.append(opt);
        });

        // Init Select2 on dial code dropdown — show ONLY "+91" in button, full text in dropdown
        try {
            if ($sel.data('select2')) $sel.select2('destroy');
            $sel.select2({
                theme:             'bootstrap-5',
                width:             '100%',
                allowClear:        false,
                dropdownParent:    $('body'),
                dropdownCssClass:  'sms-phone-code-drop',
                /* Selection box: just the code "+91" */
                templateSelection: function (d) {
                    if (!d.id) return d.text;
                    var m = String(d.text).match(/\+\d+/);
                    var code = m ? m[0] : d.text;
                    return $('<span style="font-weight:700;font-family:monospace;letter-spacing:.5px;">' + code + '</span>');
                },
                /* Dropdown list: "IN  +91" for easy search */
                templateResult: function (d) {
                    if (!d.id) return d.text;
                    return $('<span style="font-family:monospace;font-size:12.5px;">' + d.text + '</span>');
                },
            });
        } catch (e) {}
    }

    /**
     * init(opts)
     * @param {object} opts
     *   wrapEl     {string}  CSS selector for the container div
     *   hiddenEl   {string}  CSS selector for the hidden phone input
     *   initialVal {string}  e.g. '+919876543210' or '9876543210'
     */
    function init(opts) {
        var $wrap   = $(opts.wrapEl);
        var $hidden = $(opts.hiddenEl);
        var initVal = opts.initialVal || '';

        // Insert phone group HTML into the wrapper
        var uid = 'smsPhoneGroup_' + Math.random().toString(36).slice(2,7);
        $wrap.html(_buildHTML(uid));

        var $sel = $wrap.find('.sms-phone-code-sel');
        var $inp = $wrap.find('.sms-phone-number-inp');

        // Parse initial value
        var initCode   = '+91';  // default India
        var initNumber = '';
        if (initVal && initVal.startsWith('+')) {
            // Try to match longest known code first
            var allCodes = Object.keys(DIGIT_RULES).sort(function(a,b){ return b.length - a.length; });
            for (var i = 0; i < allCodes.length; i++) {
                if (initVal.startsWith(allCodes[i])) {
                    initCode   = allCodes[i];
                    initNumber = initVal.slice(allCodes[i].length);
                    break;
                }
            }
            if (!initNumber) initNumber = initVal.slice(1); // strip leading +
        } else if (initVal) {
            initNumber = initVal.replace(/\D/g, '');
        }

        $inp.val(initNumber);
        /* Set initial maxlength based on parsed code */
        $inp.attr('maxlength', DIGIT_RULES[initCode] || 15);

        /* Load countries (with cache) */
        function setup(countries) {
            _populateCodes($sel, countries, initCode);
            _updateHidden();
        }

        if (_countriesCache) {
            setup(_countriesCache);
        } else {
            $.get(BASE_URL + '/locations/countries')
                .done(function (res) {
                    if (res.status === 200) {
                        _countriesCache = res.data;
                        setup(res.data);
                    }
                })
                .fail(function () {
                    console.warn('[SMS_Phone] Failed to load countries for dial codes');
                });
        }

        /* Update hidden input whenever code or number changes */
        function _updateHidden() {
            var code = $sel.val() || '';
            var num  = $inp.val().replace(/\D/g, '');
            $hidden.val(num ? (code + num) : '').trigger('change');
        }

        $sel.on('select2:select select2:unselect change', function () {
            /* Update maxlength based on selected country */
            var code   = $sel.val() || '';
            var maxLen = DIGIT_RULES[code] || 15;
            $inp.attr('maxlength', maxLen);
            /* Trim if current value exceeds new limit */
            var cur = $inp.val().replace(/\D/g, '');
            if (cur.length > maxLen) $inp.val(cur.slice(0, maxLen));
            _updateHidden();
        });
        $inp.on('input', function () {
            // Allow digits only, enforce maxlength
            var code   = $sel.val() || '';
            var maxLen = DIGIT_RULES[code] || 15;
            var v = $(this).val().replace(/\D/g, '').slice(0, maxLen);
            $(this).val(v);
            _updateHidden();
        });
    }

    /**
     * validate(wrapEl)
     * Validates the phone group inside wrapEl.
     * Returns { valid, value, error }
     */
    function validate(wrapEl) {
        var $wrap  = $(wrapEl);
        var $sel   = $wrap.find('.sms-phone-code-sel');
        var $inp   = $wrap.find('.sms-phone-number-inp');
        var code   = $sel.val()  || '';
        var number = ($inp.val() || '').replace(/\D/g, '');

        // Phone is optional if completely empty
        if (!code && !number) {
            return { valid: true, value: '', error: '' };
        }

        if (!code) {
            return { valid: false, value: '', error: 'Please select a country code.' };
        }
        if (!number) {
            return { valid: false, value: '', error: 'Please enter your phone number.' };
        }

        var expected = DIGIT_RULES[code];
        if (expected) {
            if (number.length !== expected) {
                return {
                    valid: false,
                    value: '',
                    error: 'Phone number must be exactly ' + expected + ' digits for ' + code + '.',
                };
            }
        } else {
            // Unknown code — accept 7–15 digits (ITU E.164)
            if (number.length < 7 || number.length > 15) {
                return {
                    valid: false,
                    value: '',
                    error: 'Phone number must be between 7 and 15 digits.',
                };
            }
        }

        return { valid: true, value: code + number, error: '' };
    }

    /**
     * getValue(wrapEl)
     * Returns the combined phone string e.g. '+919876543210', or '' if empty.
     */
    function getValue(wrapEl) {
        var $wrap  = $(wrapEl);
        var code   = $wrap.find('.sms-phone-code-sel').val() || '';
        var number = ($wrap.find('.sms-phone-number-inp').val() || '').replace(/\D/g, '');
        return (code && number) ? (code + number) : '';
    }

    return { init: init, validate: validate, getValue: getValue };

}(jQuery));