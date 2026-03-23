/**
 * languages.js — Language Manager page
 * Loaded via block('scripts') → runs AFTER jQuery, Select2, toastr
 */
$(function(){

    var curLang='', enD={}, trD={}, flt='all', lName='', aiProvider='openai';

    var $sTop  = document.getElementById('btnSaveTop');
    var $sBot  = document.getElementById('btnSaveBottom');
    var $hBtns = document.getElementById('headerBtns');
    var $tb    = document.getElementById('toolbarRow');
    var $ld    = document.getElementById('editorLoading');
    var $mt    = document.getElementById('editorEmpty');
    var $ed    = document.getElementById('editorContainer');
    var $bb    = document.getElementById('bottomBar');

    function show(){ for(var i=0;i<arguments.length;i++) arguments[i].classList.remove('d-none'); }
    function hide(){ for(var i=0;i<arguments.length;i++) arguments[i].classList.add('d-none'); }

    /* ── Select2 init ── */
    $('#langSelect').select2({
        theme: 'bootstrap-5',
        placeholder: '-- Select Language --',
        allowClear: true,
        width: '100%'
    });

    /* ── Language change ── */
    $('#langSelect').on('change', function(){
        var val = $(this).val();
        if(!val){ hide($hBtns,$tb,$ed,$bb); show($mt); return; }
        lName = $(this).find('option:selected').text();
        load(val);
    });

    /* ── Load language data ── */
    async function load(c){
        curLang=c; hide($mt,$ed,$bb); show($ld);
        try {
            var r = await(await fetch('/languages/'+c)).json();
            if(r.status!==200){ toastr.error(r.message||'Error loading'); return; }
            enD = r.data.en||{}; trD = r.data.translations||{};
            upStats(r.data.totalKeys, r.data.translated);
            render();
            hide($ld); show($ed,$hBtns,$tb,$bb);
        } catch(e){ console.error(e); hide($ld); show($mt); toastr.error('Failed to load language'); }
    }

    function upStats(t,d){
        document.getElementById('statTotal').textContent     = t;
        document.getElementById('statTranslated').textContent = d;
        document.getElementById('statMissing').textContent    = t-d;
        document.getElementById('bottomInfo').textContent     = lName+' — '+d+'/'+t+' translated';
    }

    /* ── Render groups ── */
    var LBL = {
        nav:'Navigation', btn:'Buttons', dash:'Dashboard', users:'Users', roles:'Roles',
        settings:'Settings', theme:'Theme', auth:'Authentication', general:'General',
        lang:'Language', permissions:'Permissions', menus:'Menus', form:'Form Fields',
        pages:'Pages', profile:'Profile'
    };

    function render(){
        var grp = {};
        Object.keys(enD).forEach(function(k){ var g=k.split('.')[0]; (grp[g]=grp[g]||[]).push(k); });

        var h = '';
        Object.keys(grp).sort().forEach(function(g){
            var keys = grp[g];
            var lbl  = LBL[g] || g.charAt(0).toUpperCase()+g.slice(1);
            var miss = keys.filter(function(k){ return !(trD[k]||'').trim(); }).length;

            h += '<div class="card shadow-sm mb-2 sms-lang-grp" data-g="'+g+'">';
            h += '<div class="card-header d-flex align-items-center gap-2 cursor-pointer" onclick="window.smsLangTog(this)">';
            h += '  <i class="bi bi-chevron-down sms-chv"></i>';
            h += '  <span class="fw-semibold small">'+lbl+'</span>';
            h += '  <span class="badge bg-secondary-lt">'+keys.length+'</span>';
            h += miss
                ? '  <span class="badge bg-warning-lt">'+miss+' missing</span>'
                : '  <span class="badge bg-success-lt"><i class="bi bi-check2"></i></span>';
            h += '  <code class="text-muted ms-auto d-none d-sm-inline small">'+g+'.*</code>';
            h += '</div>';
            h += '<div class="sms-grp-body">';
            h += '<div class="table-responsive">';
            h += '<table class="table table-hover table-vcenter mb-0">';
            h += '<thead><tr>';
            h += '  <th class="w-25 text-muted small text-uppercase">Key</th>';
            h += '  <th class="text-muted small text-uppercase d-none d-md-table-cell sms-col-en">English</th>';
            h += '  <th class="text-muted small text-uppercase">Translation</th>';
            h += '</tr></thead>';
            h += '<tbody>';

            keys.forEach(function(k){
                var ev = enD[k]||'', tv = trD[k]||'', em = !tv.trim();
                var sk = k.includes('.') ? k.split('.').slice(1).join('.') : k;
                h += '<tr class="sms-trow'+(em?' sms-row-miss':'')+'" data-k="'+k+'" data-d="'+(em?0:1)+'">';
                h += '  <td><code class="text-muted">'+esc(sk)+'</code></td>';
                h += '  <td class="text-muted d-none d-md-table-cell">'+esc(ev)+'</td>';
                h += '  <td>';
                h += '    <div class="d-flex gap-1 align-items-center">';
                h += '      <input type="text" class="sms-tinput flex-fill" data-k="'+k+'" value="'+escA(tv)+'"';
                h += '        placeholder="'+escA(ev)+'" oninput="window.smsLangDrt(this)">';
                h += '      <button type="button" class="btn btn-sm btn-outline-secondary sms-ai-one-btn p-0" onclick="window.smsLangTrOne(this,\''+k+'\')" title="AI Translate">';
                h += '        <i class="bi bi-robot"></i>';
                h += '      </button>';
                h += '    </div>';
                h += '  </td>';
                h += '</tr>';
            });

            h += '</tbody></table></div></div></div>';
        });
        $ed.innerHTML = h;
    }

    /* ── Global handlers (called from onclick in dynamic HTML) ── */
    window.smsLangDrt = function(inp){
        inp.classList.add('is-dirty');
        var r = inp.closest('.sms-trow');
        if(inp.value.trim()){ r.classList.remove('sms-row-miss'); r.dataset.d='1'; }
        else { r.classList.add('sms-row-miss'); r.dataset.d='0'; }
    };

    window.smsLangTog = function(hd){
        hd.nextElementSibling.classList.toggle('d-none');
        hd.querySelector('.sms-chv').classList.toggle('shut');
    };

    /* ── Filter / Search ── */
    window.smsLangFilter = function(){
        var q = document.getElementById('searchInput').value.toLowerCase();
        document.querySelectorAll('.sms-trow').forEach(function(r){
            var k = r.dataset.k.toLowerCase();
            var v = (r.querySelector('.sms-tinput')||{}).value || '';
            var e = (enD[r.dataset.k]||'').toLowerCase();
            var mq = !q || k.includes(q) || v.toLowerCase().includes(q) || e.includes(q);
            var mf = flt==='all' || (flt==='translated'&&r.dataset.d==='1') || (flt==='missing'&&r.dataset.d==='0');
            r.style.display = (mq && mf) ? '' : 'none';
        });
        document.querySelectorAll('.sms-lang-grp').forEach(function(c){
            c.style.display = c.querySelectorAll('.sms-trow:not([style*="display: none"])').length ? '' : 'none';
        });
    };

    window.smsLangSetFilter = function(f, b){
        flt = f;
        document.querySelectorAll('[data-filter]').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        smsLangFilter();
    };

    /* ══════════════ SAVE ══════════════ */
    window.smsLangSave = async function(){
        var inps = document.querySelectorAll('.sms-tinput'), tr={};
        inps.forEach(function(i){ tr[i.dataset.k] = i.value; });
        var SV = $sTop.innerHTML;
        [$sTop,$sBot].forEach(function(b){ b.disabled=true; b.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Saving...'; });
        try{
            var j = await(await fetch('/languages/'+curLang,{
                method:'PUT', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({translations:tr})
            })).json();
            if(j.status===200){
                if(j.data) upStats(j.data.totalKeys, j.data.translated);
                inps.forEach(function(i){ i.classList.remove('is-dirty'); });
                toastr.success(j.message || 'Translations saved successfully.');
            } else {
                toastr.error(j.message || 'Save failed.');
            }
        } catch(e){ console.error(e); toastr.error('Save failed: network error.'); }
        [$sTop,$sBot].forEach(function(b){ b.disabled=false; b.innerHTML=SV; });
    };

    /* ══════════════ AI TRANSLATION ══════════════ */

    /* Provider picker */
    $(document).on('click', '.sms-ai-provider', function(e){
        e.preventDefault();
        if($(this).hasClass('disabled')) return;
        aiProvider = $(this).data('provider');
        $('.sms-ai-provider').removeClass('active');
        $(this).addClass('active');
        toastr.info('AI Provider: ' + (aiProvider==='gemini' ? 'Gemini (Google)' : 'ChatGPT (OpenAI)'));
    });

    /* Load AI config */
    $.get('/languages/ai-config', function(r){
        if(r.status===200){
            var d = r.data;
            if(!d.openai && !d.gemini){
                $('.sms-ai-btn').addClass('disabled').attr('title','Add OPENAI_API_KEY or GEMINI_API_KEY to .env');
            } else if(!d.openai && d.gemini){
                aiProvider = 'gemini';
                $('.sms-ai-provider').removeClass('active');
                $('.sms-ai-provider[data-provider="gemini"]').addClass('active');
            }
            if(!d.openai) $('.sms-ai-provider[data-provider="openai"]').addClass('disabled');
            if(!d.gemini) $('.sms-ai-provider[data-provider="gemini"]').addClass('disabled');
        }
    });

    /* Translate MISSING keys only */
    window.smsLangTrMissing = async function(){
        if(!curLang){ toastr.error('Select a language first'); return; }
        var $btn = $('#btnTrMissing');
        var orig = $btn.html();
        $btn.prop('disabled',true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating...');
        try {
            var j = await(await fetch('/languages/translate-all',{
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ code:curLang, provider:aiProvider })
            })).json();
            if(j.status===200 && j.data){
                fillInputs(j.data.translations);
                toastr.success(j.message || 'Missing keys translated!');
            } else { toastr.error(j.message || 'Translation failed.'); }
        } catch(e){ console.error(e); toastr.error('Translation failed.'); }
        $btn.prop('disabled',false).html(orig);
    };

    /* Translate ALL keys (overwrite existing) */
    window.smsLangTrAll = async function(){
        if(!curLang){ toastr.error('Select a language first'); return; }
        if(!confirm('This will overwrite all existing translations. Continue?')) return;

        /* Temporarily clear all values so API translates everything */
        var allEmpty = {};
        Object.keys(enD).forEach(function(k){ allEmpty[k] = enD[k]; });

        var $btn = $('#btnTrAll');
        var orig = $btn.html();
        $btn.prop('disabled',true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating all...');
        try {
            /* Send with all keys as "to translate" */
            var SUPPORTED = null;
            var langInfo = await(await fetch('/languages/'+curLang)).json();
            var langName = langInfo.data ? langInfo.data.language.name : curLang;
            var nativeName = langInfo.data ? langInfo.data.language.nativeName : curLang;

            var j = await(await fetch('/languages/translate-all',{
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ code:curLang, provider:aiProvider, force_all:true })
            })).json();
            if(j.status===200 && j.data){
                fillInputs(j.data.translations);
                toastr.success(j.message || 'All keys translated!');
            } else { toastr.error(j.message || 'Translation failed.'); }
        } catch(e){ console.error(e); toastr.error('Translation failed.'); }
        $btn.prop('disabled',false).html(orig);
    };

    /* Fill textboxes from translation data */
    function fillInputs(translations){
        if(!translations) return;
        document.querySelectorAll('.sms-tinput').forEach(function(inp){
            var k = inp.dataset.k;
            if(translations[k] && String(translations[k]).trim()){
                inp.value = translations[k];
                smsLangDrt(inp);
            }
        });
    }

    /* Translate SINGLE key */
    window.smsLangTrOne = async function(btn, key){
        var inp = btn.closest('td').querySelector('.sms-tinput');
        if(!inp) return;
        var enVal = enD[key] || '';
        if(!enVal){ toastr.error('No English value for this key'); return; }

        var origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        try {
            var j = await(await fetch('/languages/translate-single',{
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ code:curLang, key:key, value:enVal, provider:aiProvider })
            })).json();
            if(j.status===200 && j.data && j.data.translated){
                inp.value = j.data.translated;
                smsLangDrt(inp);
                toastr.success('Translated: ' + key);
            } else { toastr.error(j.message || 'Failed'); }
        } catch(e){ console.error(e); toastr.error('Translation failed'); }
        btn.disabled = false;
        btn.innerHTML = origHtml;
    };

    /* ══════════════ ADD KEY MODAL ══════════════ */
    var addM;
    window.smsLangAddKey = function(){
        var gs = [], seen = {};
        Object.keys(enD).forEach(function(k){ var g=k.split('.')[0]; if(!seen[g]){seen[g]=1;gs.push(g);} });
        gs.sort();
        var s = document.getElementById('newKeyGroup');
        s.innerHTML = '<option value="">Select group…</option>' + gs.map(function(g){ return '<option value="'+g+'">'+g+'</option>'; }).join('');
        document.getElementById('newKeyName').value = '';
        document.getElementById('newKeyValue').value = '';
        upPrev();
        if(!addM) addM = new bootstrap.Modal(document.getElementById('addKeyModal'));
        addM.show();
    };

    document.getElementById('newKeyGroup').addEventListener('change', upPrev);
    document.getElementById('newKeyName').addEventListener('input', upPrev);

    function upPrev(){
        var g = document.getElementById('newKeyGroup').value || 'group';
        var n = document.getElementById('newKeyName').value.trim().toLowerCase().replace(/\s+/g,'_') || 'key_name';
        document.getElementById('newKeyPrefix').textContent = g + '.';
        document.getElementById('newKeyPreview').textContent = g + '.' + n;
    }

    window.smsLangSubmitKey = async function(){
        var g = document.getElementById('newKeyGroup').value;
        var n = document.getElementById('newKeyName').value.trim().toLowerCase().replace(/\s+/g,'_');
        var v = document.getElementById('newKeyValue').value.trim();
        if(!g){ toastr.error('Select a group'); return; }
        if(!n){ toastr.error('Enter a key name'); return; }
        try {
            var j = await(await fetch('/languages/add-key',{
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ key:g+'.'+n, value:v })
            })).json();
            if(j.status===200){ toastr.success(j.message); if(addM)addM.hide(); load(curLang); }
            else toastr.error(j.message || 'Error');
        } catch(e){ console.error(e); toastr.error('Failed to add key'); }
    };

    /* ── Helpers ── */
    function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function escA(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

});
