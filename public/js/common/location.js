/**
 * SMS Web — common/location.js
 * Shared location cascade: Countries → States → Cities using Select2.
 *
 * Usage (any page):
 *   SMS_Location.init({
 *     countryEl:  '#my_country',   // select element id
 *     stateEl:    '#my_state',
 *     cityEl:     '#my_city',
 *     prefill: {
 *       country_id: 101,
 *       state_id:   12,
 *       city_id:    555,
 *     },
 *     onChange: function(type, id, text) {}   // optional callback
 *   });
 *
 *   // Get current selection
 *   var vals = SMS_Location.getValues('#my_country', '#my_state', '#my_city');
 *   // vals = { country_id, state_id, city_id }
 *
 *   // Destroy Select2 before re-init (if needed)
 *   SMS_Location.destroy('#my_country', '#my_state', '#my_city');
 */

window.SMS_Location = (function ($) {
    'use strict';

    var SELECT2_OPTS = {
        theme: 'bootstrap-5',
        width: '100%',
        allowClear: true,
        dropdownParent: $('body'),
    };

    /* ── Internal: init Select2 on an element ── */
    function _s2(el, placeholder) {
        try {
            if ($(el).data('select2')) $(el).select2('destroy');
            $(el).select2($.extend({}, SELECT2_OPTS, { placeholder: placeholder }));
        } catch (e) {}
    }

    /* ── Internal: populate a select, then init/refresh Select2 ── */
    function _fill(el, items, placeholder, disabled) {
        var $el = $(el);
        $el.find('option:not(:first)').remove();
        if (disabled) {
            $el.prop('disabled', true);
        } else {
            $.each(items || [], function (_, item) {
                $el.append('<option value="' + item.id + '">' + item.name + '</option>');
            });
            $el.prop('disabled', false);
        }
        // Refresh Select2 so it picks up new options
        try { $el.trigger('change.select2'); } catch (e) {}
    }

    /* ── Load countries ── */
    function loadCountries(countryEl, callback) {
        _s2(countryEl, '— Select Country —');
        $.get(BASE_URL + '/locations/countries')
            .done(function (res) {
                if (res.status === 200) {
                    _fill(countryEl, res.data, '— Select Country —', false);
                    if (callback) callback(res.data);
                }
            })
            .fail(function () {
                console.warn('[SMS_Location] Failed to load countries');
            });
    }

    /* ── Load states for a country ── */
    function loadStates(countryId, stateEl, cityEl, callback) {
        _fill(stateEl, [], '— Select State —', true);
        _fill(cityEl,  [], '— Select City —',  true);
        _s2(stateEl, '— Select State —');
        _s2(cityEl,  '— Select City —');
        if (!countryId) return;

        $.get(BASE_URL + '/locations/countries/' + countryId + '/states')
            .done(function (res) {
                if (res.status === 200) {
                    _fill(stateEl, res.data, '— Select State —', false);
                    if (callback) callback(res.data);
                }
            })
            .fail(function () {
                console.warn('[SMS_Location] Failed to load states');
            });
    }

    /* ── Load cities for a state ── */
    function loadCities(stateId, cityEl, callback) {
        _fill(cityEl, [], '— Select City —', true);
        _s2(cityEl, '— Select City —');
        if (!stateId) return;

        $.get(BASE_URL + '/locations/states/' + stateId + '/cities')
            .done(function (res) {
                if (res.status === 200) {
                    _fill(cityEl, res.data, '— Select City —', false);
                    if (callback) callback(res.data);
                }
            })
            .fail(function () {
                console.warn('[SMS_Location] Failed to load cities');
            });
    }

    /**
     * init(options)
     * Wires up the full cascade with optional pre-fill.
     */
    function init(opts) {
        var cEl  = opts.countryEl;
        var sEl  = opts.stateEl;
        var ctEl = opts.cityEl;
        var pre  = opts.prefill || {};
        var cb   = opts.onChange || null;

        // Init Select2 on state/city immediately (disabled state)
        _s2(sEl,  '— Select State —');
        _s2(ctEl, '— Select City —');

        // Load countries, then pre-fill cascade if needed
        loadCountries(cEl, function () {
            if (pre.country_id) {
                $(cEl).val(pre.country_id).trigger('change.select2');

                loadStates(pre.country_id, sEl, ctEl, function () {
                    if (pre.state_id) {
                        $(sEl).val(pre.state_id).trigger('change.select2');

                        loadCities(pre.state_id, ctEl, function () {
                            if (pre.city_id) {
                                $(ctEl).val(pre.city_id).trigger('change.select2');
                            }
                        });
                    }
                });
            }
        });

        // Wire up change events
        $(document).off('change.smsloc', cEl).on('change.smsloc', cEl, function () {
            var id = $(this).val();
            loadStates(id, sEl, ctEl);
            if (cb) cb('country', id, $(this).find('option:selected').text());
        });

        $(document).off('change.smsloc', sEl).on('change.smsloc', sEl, function () {
            var id = $(this).val();
            loadCities(id, ctEl);
            if (cb) cb('state', id, $(this).find('option:selected').text());
        });

        $(document).off('change.smsloc', ctEl).on('change.smsloc', ctEl, function () {
            if (cb) cb('city', $(this).val(), $(this).find('option:selected').text());
        });
    }

    /**
     * getValues(countryEl, stateEl, cityEl)
     * Returns { country_id, state_id, city_id } as integers or null.
     */
    function getValues(cEl, sEl, ctEl) {
        return {
            country_id: $(cEl).val()  ? parseInt($(cEl).val())  : null,
            state_id:   $(sEl).val()  ? parseInt($(sEl).val())  : null,
            city_id:    $(ctEl).val() ? parseInt($(ctEl).val()) : null,
        };
    }

    /**
     * destroy(countryEl, stateEl, cityEl)
     * Destroys Select2 instances.
     */
    function destroy(cEl, sEl, ctEl) {
        try { $(cEl).select2('destroy');  } catch(e) {}
        try { $(sEl).select2('destroy');  } catch(e) {}
        try { $(ctEl).select2('destroy'); } catch(e) {}
    }

    return { init: init, getValues: getValues, destroy: destroy };

}(jQuery));
