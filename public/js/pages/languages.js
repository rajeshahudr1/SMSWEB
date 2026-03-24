/**
 * languages.js — Language Manager page
 * Loaded via block('scripts') → runs AFTER jQuery, Select2, toastr
 */
$(function(){

    var curLang='', enD={}, trD={}, flt='all', lName='', aiProvider='openai', _aiEnabled=false;
    var _usageCounts = {}; // { key: count } — loaded after render

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
            h += '  <th class="text-muted small text-uppercase" style="min-width:140px;">Key</th>';
            h += '  <th class="text-muted small text-uppercase d-none d-md-table-cell sms-col-en">English</th>';
            h += '  <th class="text-muted small text-uppercase">Translation</th>';
            h += '  <th class="text-muted small text-uppercase text-center" style="width:40px;"></th>';
            h += '</tr></thead>';
            h += '<tbody>';

            keys.forEach(function(k){
                var ev = enD[k]||'', tv = trD[k]||'', em = !tv.trim();
                var sk = k.includes('.') ? k.split('.').slice(1).join('.') : k;
                h += '<tr class="sms-trow'+(em?' sms-row-miss':'')+'" data-k="'+k+'" data-d="'+(em?0:1)+'">';
                h += '  <td>';
                h += '    <code class="sms-key-link text-primary" style="cursor:pointer;text-decoration:underline dotted;" onclick="window.smsLangKeyUsage(\''+k+'\')" title="Click to see usage">'+esc(sk)+'</code>';
                h += '    <span class="sms-usage-badge" data-usage-key="'+k+'"></span>';
                h += '  </td>';
                h += '  <td class="text-muted d-none d-md-table-cell">'+esc(ev)+'</td>';
                h += '  <td>';
                h += '    <div class="d-flex gap-1 align-items-center">';
                h += '      <input type="text" class="sms-tinput flex-fill" data-k="'+k+'" value="'+escA(tv)+'"';
                h += '        placeholder="'+escA(ev)+'" oninput="window.smsLangDrt(this)">';
                if(_aiEnabled){
                    h += '      <button type="button" class="btn btn-sm btn-outline-secondary sms-ai-one-btn p-0" onclick="window.smsLangTrOne(this,\''+k+'\')" title="AI Translate">';
                    h += '        <i class="bi bi-robot"></i>';
                    h += '      </button>';
                }
                h += '    </div>';
                h += '  </td>';
                h += '  <td class="text-center">';
                h += '    <button type="button" class="btn btn-sm btn-ghost-danger sms-del-key-btn p-0" data-del-key="'+k+'" onclick="window.smsLangDeleteKey(\''+k+'\')" title="Delete key">';
                h += '      <i class="bi bi-trash3" style="font-size:13px;"></i>';
                h += '    </button>';
                h += '  </td>';
                h += '</tr>';
            });

            h += '</tbody></table></div></div></div>';
        });
        $ed.innerHTML = h;

        /* Load usage counts after render */
        loadUsageCounts();
    }

    /* ── Usage count loader — runs after render ── */
    function loadUsageCounts(){
        var allKeys = Object.keys(enD);
        if(!allKeys.length) return;
        _usageCounts = {};

        var BATCH = 200;
        for(var i=0; i<allKeys.length; i+=BATCH){
            var batch = allKeys.slice(i, i+BATCH);
            (function(batchKeys){
                $.get('/languages/key-usage-all?keys='+encodeURIComponent(batchKeys.join(',')), function(r){
                    if(r.status===200 && r.data){
                        var counts = r.data;
                        Object.assign(_usageCounts, counts);
                        for(var key in counts){
                            var $badge = $('[data-usage-key="'+key+'"]');
                            if(!$badge.length) continue;
                            var c = counts[key];
                            if(c > 0){
                                $badge.html('<span class="badge bg-success-lt" style="font-size:9px;font-weight:500;vertical-align:middle;cursor:help;" title="Used in '+c+' place'+(c>1?'s':'')+'">'+c+'</span>');
                            } else {
                                $badge.html('<span class="badge bg-danger-lt" style="font-size:9px;font-weight:500;vertical-align:middle;cursor:help;" title="Not used anywhere — safe to delete">0</span>');
                            }
                        }
                    }
                });
            })(batch);
        }
    }

    /* ── Global handlers ── */
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

    /* ══════════════ DELETE KEY ══════════════ */
    window.smsLangDeleteKey = async function(key){
        if(!key) return;

        /* Check usage count — if already loaded use cache, otherwise fetch */
        var count = _usageCounts[key];
        if(count === undefined){
            /* Fetch fresh count */
            try {
                var cr = await(await fetch('/languages/key-usage-all?keys='+encodeURIComponent(key))).json();
                if(cr.status===200 && cr.data) count = cr.data[key] || 0;
                else count = -1;
            } catch(e){ count = -1; }
        }

        if(count > 0){
            toastr.error('Cannot delete "'+key+'" — it is used in '+count+' place'+(count>1?'s':'')+'. Remove from code first.');
            return;
        }

        if(!confirm('Delete key "'+key+'" from ALL language files?\nThis cannot be undone.')) return;

        try {
            var j = await(await fetch('/languages/remove-key',{
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ key: key })
            })).json();
            if(j.status===200){
                toastr.success(j.message || 'Key deleted.');
                /* Remove row from UI */
                var $row = $('[data-k="'+key+'"]');
                var $grp = $row.closest('.sms-lang-grp');
                $row.fadeOut(200, function(){
                    $(this).remove();
                    /* If group is now empty, remove group card */
                    if($grp.find('.sms-trow').length === 0) $grp.fadeOut(200, function(){ $(this).remove(); });
                });
                delete enD[key];
                delete trD[key];
                delete _usageCounts[key];
            } else {
                toastr.error(j.message || 'Delete failed.');
            }
        } catch(e){ console.error(e); toastr.error('Delete failed: network error.'); }
    };

    /* ══════════════ AI TRANSLATION ══════════════ */

    /* Load AI config from Settings — no provider picker needed */
    $.get('/languages/ai-config', function(r){
        if(r.status===200){
            var d = r.data;
            if(!d.enabled || (!d.openai && !d.gemini)){
                _aiEnabled = false;
                $('#aiButtonsWrap').hide();
                return;
            }
            _aiEnabled = true;
            aiProvider = d.provider || 'openai';
            $('#aiButtonsWrap').css('display','flex');
            $('#aiProviderBadge').html('<i class="bi bi-robot me-1"></i>' + (aiProvider === 'gemini' ? 'Gemini' : 'ChatGPT'));
            if(curLang && Object.keys(enD).length > 0) render();
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

        var $btn = $('#btnTrAll');
        var orig = $btn.html();
        $btn.prop('disabled',true).html('<span class="spinner-border spinner-border-sm me-1"></span>Translating all...');
        try {
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

    /* ══════════════ KEY USAGE FINDER ══════════════ */
    var _usageModal;
    window.smsLangKeyUsage = async function(key){
        if(!key) return;

        if(!_usageModal) _usageModal = new bootstrap.Modal(document.getElementById('keyUsageModal'));
        document.getElementById('usageKeyName').textContent = key;
        document.getElementById('usageCountInfo').textContent = '';
        document.getElementById('usageModalBody').innerHTML =
            '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Scanning files...</div>';
        _usageModal.show();

        try {
            var r = await(await fetch('/languages/key-usage?key='+encodeURIComponent(key))).json();
            if(r.status === 200 && r.data){
                var d = r.data;
                var count = d.count || 0;

                document.getElementById('usageCountInfo').innerHTML =
                    '<i class="bi bi-files me-1"></i>Found in <strong>'+count+'</strong> location'+(count!==1?'s':'');

                if(count === 0){
                    document.getElementById('usageModalBody').innerHTML =
                        '<div class="text-center py-4 text-muted">'
                        +'<i class="bi bi-emoji-neutral d-block mb-2" style="font-size:32px;"></i>'
                        +'<div>This key is <strong>not used</strong> anywhere in the codebase.</div>'
                        +'<div class="small mt-1 text-warning"><i class="bi bi-exclamation-triangle me-1"></i>You can safely remove it.</div>'
                        +'</div>';
                    return;
                }

                var byFile = {};
                d.locations.forEach(function(loc){
                    if(!byFile[loc.file]) byFile[loc.file] = [];
                    byFile[loc.file].push(loc);
                });

                var h = '<div class="list-group list-group-flush">';
                var fileIdx = 0;
                for(var file in byFile){
                    var locs = byFile[file];
                    var icon = file.endsWith('.ejs') ? 'bi-filetype-html text-success' :
                        file.endsWith('.js')  ? 'bi-filetype-js text-warning' : 'bi-file-code text-muted';
                    var badge = file.endsWith('.ejs') ? 'bg-success-lt' : 'bg-warning-lt';
                    var typeLabel = file.endsWith('.ejs') ? 'View' : 'Script';

                    h += '<div class="list-group-item px-3 py-2'+(fileIdx>0?' border-top':'')+'">';
                    h += '  <div class="d-flex align-items-center gap-2 mb-1">';
                    h += '    <i class="bi '+icon+'" style="font-size:16px;"></i>';
                    h += '    <strong class="small" style="word-break:break-all;">'+esc(file)+'</strong>';
                    h += '    <span class="badge '+badge+' ms-auto" style="font-size:10px;">'+typeLabel+'</span>';
                    h += '    <span class="badge bg-primary-lt" style="font-size:10px;">'+locs.length+'</span>';
                    h += '  </div>';

                    locs.forEach(function(loc){
                        var ctx = esc(loc.context);
                        var keyEsc = esc(key);
                        ctx = ctx.replace(new RegExp(keyEsc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),
                            '<mark class="bg-warning px-0">'+keyEsc+'</mark>');

                        h += '  <div class="d-flex align-items-start gap-2 ms-4 mt-1">';
                        h += '    <span class="badge bg-secondary-lt text-nowrap" style="font-size:10px;min-width:50px;">Line '+loc.line+'</span>';
                        h += '    <code class="small text-muted" style="word-break:break-all;font-size:11px;line-height:1.4;">'+ctx+'</code>';
                        h += '  </div>';
                    });

                    h += '</div>';
                    fileIdx++;
                }
                h += '</div>';
                document.getElementById('usageModalBody').innerHTML = h;

            } else {
                document.getElementById('usageModalBody').innerHTML =
                    '<div class="text-center py-4 text-danger"><i class="bi bi-exclamation-circle me-1"></i>'+(r.message||'Failed to scan')+'</div>';
            }
        } catch(e){
            console.error(e);
            document.getElementById('usageModalBody').innerHTML =
                '<div class="text-center py-4 text-danger"><i class="bi bi-exclamation-circle me-1"></i>Error scanning files.</div>';
        }
    };

    /* ── Helpers ── */
    function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function escA(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

});