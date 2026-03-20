/* users-form.js */
'use strict';

$(function(){
    var FD = window._FORM_DATA || {};

    /* ── Select2 on role + location DDLs ── */
    try {
        $('#selRole').select2({ theme:'bootstrap-5', width:'100%', placeholder:'— No Role —', allowClear:true });
        $('#sCountry').select2({ theme:'bootstrap-5', width:'100%', placeholder:'— Select Country —', allowClear:true });
        $('#sState').select2({ theme:'bootstrap-5', width:'100%', placeholder:'— Select State —', allowClear:true });
        $('#sCity').select2({ theme:'bootstrap-5', width:'100%', placeholder:'— Select City —', allowClear:true });
    } catch(e){}

    /* ── Phone with country code ── */
    if (typeof SMS_Phone !== 'undefined') {
        SMS_Phone.init({
            wrapEl:    '#phoneWrap',
            hiddenEl:  '#phoneHidden',
            initialVal: $('#phoneHidden').val() || '',
        });
    }

    /* ── Location cascade (country → state → city) ── */
    $('#sCountry').on('change', function(){
        var cid = $(this).val();
        var $st = $('#sState'), $ci = $('#sCity');
        $st.html('<option value="">Loading...</option>');
        $ci.html('<option value="">— Select City —</option>');
        try { $st.trigger('change.select2'); } catch(e){}
        try { $ci.trigger('change.select2'); } catch(e){}
        if (!cid) {
            $st.html('<option value="">— Select State —</option>');
            try { $st.trigger('change.select2'); } catch(e){}
            return;
        }
        $.get(BASE_URL + '/locations/countries/' + cid + '/states', function(r){
            var h = '<option value="">— Select State —</option>';
            if (r.status===200) (r.data||[]).forEach(function(s){ h+='<option value="'+s.id+'">'+s.name+'</option>'; });
            $st.html(h);
            try { $st.trigger('change.select2'); } catch(e){}
        });
    });

    $('#sState').on('change', function(){
        var sid = $(this).val();
        var $ci = $('#sCity');
        $ci.html('<option value="">Loading...</option>');
        try { $ci.trigger('change.select2'); } catch(e){}
        if (!sid) {
            $ci.html('<option value="">— Select City —</option>');
            try { $ci.trigger('change.select2'); } catch(e){}
            return;
        }
        $.get(BASE_URL + '/locations/states/' + sid + '/cities', function(r){
            var h = '<option value="">— Select City —</option>';
            var cities = r.data && r.data.data ? r.data.data : (r.data || []);
            cities.forEach(function(c){ h+='<option value="'+c.id+'">'+c.name+'</option>'; });
            $ci.html(h);
            try { $ci.trigger('change.select2'); } catch(e){}
        });
    });

    /* ── Pre-fill state + city on edit ── */
    if (FD.country_id) {
        $.get(BASE_URL + '/locations/countries/' + FD.country_id + '/states', function(r){
            var h = '<option value="">— Select State —</option>';
            if (r.status===200) (r.data||[]).forEach(function(s){
                h += '<option value="'+s.id+'"' + (String(s.id) === String(FD.state_id) ? ' selected' : '') + '>'+s.name+'</option>';
            });
            $('#sState').html(h);
            try { $('#sState').trigger('change.select2'); } catch(e){}

            if (FD.state_id) {
                $.get(BASE_URL + '/locations/states/' + FD.state_id + '/cities', function(r2){
                    var h2 = '<option value="">— Select City —</option>';
                    var cities = r2.data && r2.data.data ? r2.data.data : (r2.data || []);
                    cities.forEach(function(c){
                        h2 += '<option value="'+c.id+'"' + (String(c.id) === String(FD.city_id) ? ' selected' : '') + '>'+c.name+'</option>';
                    });
                    $('#sCity').html(h2);
                    try { $('#sCity').trigger('change.select2'); } catch(e){}
                });
            }
        });
    }

    /* ── Form submit — no double btnLoading ── */
    $('#frmUser').on('submit', function(e){
        e.preventDefault();
        var $btn = $('#btnSubmit');
        smsAjax({
            url:  $(this).attr('action'),
            data: $(this).serialize(),
            btn:  $btn,
            success: function(r){
                if (r.status===200||r.status===201){
                    toastr.success(r.message||'Saved.');
                    setTimeout(function(){ window.location='/users'; }, 800);
                } else {
                    toastr.error(r.message||'Error saving.');
                }
            }
        });
    });
});