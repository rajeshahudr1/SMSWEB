/* ═══════════════════════════════════════════════════════════
   [WEB]  public/js/pages/menus.js   — Menu Manager v6
   Fixes vs v5:
   1. Top buttons: simplified header, always visible
   2. Form "Failed to load": jQuery 4 won't run inline <script>.
      smsMenuFormInit() runs after .html() to bind all form events.
   3. Icon picker: bound in smsMenuFormInit, strips "ti " prefix
   4. Parent menu: level badge updates via smsMenuFormInit
   5. Sort order: controller now passes nextSortOrder, shown in form
   6. Add/Edit save: $.post with serializeArray works correctly
   7. Move dropdown: _flat loaded before opening, select populated
   8. Sort modal: _flat loaded before opening, children listed
   9. Collapse toggle: uses correct bi- class names not ti-
═══════════════════════════════════════════════════════════ */
'use strict';

/* ── globals ────────────────────────────────────────────── */
var _panel       = 'b2b';
var _flat        = [];
var _flatReady   = false;
var _moveUuid    = null;
var _delUuid     = null;
var _sortDragSrc = null;
var _dSrc        = null;
var _dPid        = null;

/* ── html escape ─────────────────────────────────────────── */
function x(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── JSON POST (body-parser reads application/json) ────────── */
function jPost(url, payload, done, fail){
    $.ajax({ url:url, type:'POST', contentType:'application/json',
        data:JSON.stringify(payload) })
        .done(done)
        .fail(fail || function(){ toastr.error('Network error.'); });
}

/* ── level badge class ──────────────────────────────────── */
function _lbadge(lvl){
    return 'sms-lbadge sms-lbadge-' + Math.min(lvl,5);
}

/* ════════════════════════════════════════════════════════════
   FLAT LIST  — reload after every mutation
════════════════════════════════════════════════════════════ */
function loadFlat(cb){
    $.get(BASE_URL + '/menus/flat', function(res){
        _flat      = (res && res.status === 200) ? (res.data || []) : [];
        _flatReady = true;
        if (cb) cb();
    });
}

/* Returns _flat filtered to current panel (b2b or b2c).
   Items with panel_type='both' appear in both panels. */
function _panelFlat(){
    return _flat.filter(function(m){
        return m.panel_type === _panel || m.panel_type === 'both';
    });
}

/* ════════════════════════════════════════════════════════════
   LOAD TREE
════════════════════════════════════════════════════════════ */
function loadTree(){
    $('#treeLoading').show();
    $('#treeRoot').empty();
    _flatReady = false;

    $.get(BASE_URL + '/menus/data?panel_type=' + _panel + '&tree=1', function(res){
        $('#treeLoading').hide();

        if (!res || res.status !== 200){
            $('#treeRoot').html('<div class="alert alert-danger m-2">Failed to load menus.</div>');
            return;
        }

        var tree = res.data || [];

        if (!tree.length){
            $('#treeRoot').html(
                '<div class="text-center py-5">'
                +'<i class="bi bi-diagram-3" style="font-size:52px;opacity:.12;display:block;margin:0 auto 14px;color:var(--tblr-primary);"></i>'
                +'<p class="fw-semibold mb-1" style="font-size:14px;">No menus yet</p>'
                +'<p class="text-muted mb-3" style="font-size:13px;">Click <strong>Add Menu</strong> above to create your first main menu.</p>'
                +'</div>'
            );
        } else {
            $('#treeRoot').html(renderUL(tree));
            attachDrag($('#treeRoot')[0]);
        }

        /* Stats badges */
        var tot=0, vis=0, hid=0;
        (function w(a){
            a.forEach(function(m){
                tot++;
                if (parseInt(m.is_visible)) vis++; else hid++;
                if (m.children && m.children.length) w(m.children);
            });
        })(tree);
        $('#sBadgeTotal').text(tot+' total');
        $('#sBadgeVisible').text(vis+' visible');
        $('#sBadgeHidden').text(hid+' hidden').toggle(hid > 0);
        $('#statsBar').show();
        $('#statsVr').removeClass('d-none');

        loadFlat(); // refresh flat list in background

    }).fail(function(){
        $('#treeLoading').hide();
        $('#treeRoot').html('<div class="alert alert-danger m-2">Network error loading menus.</div>');
    });
}

/* ════════════════════════════════════════════════════════════
   RENDER TREE  — recursive
════════════════════════════════════════════════════════════ */
function renderUL(items){
    var h = '<ul class="sms-ul">';
    items.forEach(function(m){ h += renderLI(m); });
    return h + '</ul>';
}

function renderLI(m){
    var kids  = Array.isArray(m.children) && m.children.length > 0;
    var lvl   = m.level || 1;
    var isVis = parseInt(m.is_visible) ? true : false;

    var li = '<li class="sms-li sms-l' + Math.min(lvl,5) + '"'
        + ' data-id="'   + m.id              + '"'
        + ' data-uuid="' + x(m.uuid)         + '"'
        + ' data-pid="'  + (m.parent_id||'') + '"'
        + ' data-lvl="'  + lvl               + '"'
        + ' draggable="true">';

    li += '<div class="sms-row' + (isVis ? '' : ' is-hidden') + '">';

    /* drag grip */
    li += '<span class="sms-grip" title="Drag to reorder within same level">'
        + '<i class="bi bi-grip-vertical"></i></span>';

    /* collapse toggle — NO data-bs-toggle (Bootstrap would intercept the click) */
    if (kids){
        li += '<button type="button" class="sms-tog" title="Expand or collapse children">'
            + '<i class="bi bi-chevron-down"></i></button>';
    } else {
        li += '<span class="sms-sp"></span>';
    }

    /* level badge */
    li += '<span class="' + _lbadge(lvl) + '">L' + lvl + '</span>';

    /* menu icon stored as bootstrap icon name e.g. "house-door" */
    var iconCls = (m.icon || 'circle').replace(/^bi\s+/,'').replace(/^ti\s+/,'');
    li += '<i class="bi bi-' + x(iconCls) + ' sms-ico"></i>';

    /* title */
    li += '<span class="sms-ttl" title="' + x(m.title) + '">' + x(m.title) + '</span>';

    /* route chip */
    if (m.route_path){
        li += '<code class="sms-path" title="Route: ' + x(m.route_path) + '">'
            + x(m.route_path) + '</code>';
    }

    /* permission chip */
    if (m.permission_key){
        li += '<span class="sms-perm" title="Requires permission: ' + x(m.permission_key) + '">'
            + '<i class="bi bi-lock" style="font-size:10px;"></i> '
            + x(m.permission_key) + '</span>';
    }

    /* hidden badge */
    if (!isVis){
        li += '<span class="sms-hid" title="Hidden from sidebar">hidden</span>';
    }

    /* ── action buttons ── */
    li += '<div class="sms-acts">';

    li += '<button type="button" class="btn btn-sm btn-ghost-success"'
        + ' onclick="openAdd(' + m.id + ')"'
        + ' title="Add child menu inside \'' + x(m.title) + '\' (becomes L' + (lvl+1) + ')">'
        + '<i class="bi bi-plus-lg"></i></button>';

    li += '<button type="button" class="btn btn-sm btn-ghost-primary"'
        + ' onclick="openMove(\'' + x(m.uuid) + '\',\'' + x(m.title) + '\',' + m.id + ',' + (m.parent_id||0) + ')"'
        + ' title="Move \'' + x(m.title) + '\' to a different parent">'
        + '<i class="bi bi-arrows-move"></i></button>';

    li += '<button type="button" class="btn btn-sm btn-ghost-secondary"'
        + ' onclick="openSort(' + m.id + ',\'' + x(m.title) + '\')"'
        + ' title="Sort / reorder children of \'' + x(m.title) + '\'">'
        + '<i class="bi bi-sort-down-alt"></i></button>';

    li += '<button type="button" class="btn btn-sm btn-ghost-warning"'
        + ' onclick="openEdit(\'' + x(m.uuid) + '\')"'
        + ' title="Edit \'' + x(m.title) + '\'">'
        + '<i class="bi bi-pencil"></i></button>';

    var vTitle = isVis ? 'Hide from sidebar' : 'Show in sidebar';
    var vIcon  = isVis ? 'bi-eye-slash' : 'bi-eye';
    li += '<button type="button" class="btn btn-sm btn-ghost-secondary"'
        + ' onclick="doToggleVis(\'' + x(m.uuid) + '\',this)"'
        + ' title="' + vTitle + '">'
        + '<i class="bi ' + vIcon + '"></i></button>';

    li += '<button type="button" class="btn btn-sm btn-ghost-danger"'
        + ' onclick="openDelete(\'' + x(m.uuid) + '\',\'' + x(m.title) + '\',' + (kids?1:0) + ')"'
        + ' title="Delete \'' + x(m.title) + '\'' + (kids?' (and all sub-menus)':'') + '">'
        + '<i class="bi bi-trash3"></i></button>';

    li += '</div>'; /* /sms-acts */
    li += '</div>'; /* /sms-row  */

    if (kids){
        li += '<div class="sms-kids">' + renderUL(m.children) + '</div>';
    }

    li += '</li>';
    return li;
}

/* ════════════════════════════════════════════════════════════
   EXPAND / COLLAPSE
   FIX: uses bi- class names (not ti-) to match rendered icon
════════════════════════════════════════════════════════════ */
$(document).on('click', '.sms-tog', function(e){
    e.stopPropagation();
    var $li   = $(this).closest('.sms-li');
    var $kids = $li.children('.sms-kids');
    var $ic   = $(this).find('i');
    var open  = !$kids.hasClass('collapsed');
    $kids.toggleClass('collapsed', open);
    /* FIX: bi- prefix, not ti- */
    $ic.toggleClass('bi-chevron-down',  !open)
        .toggleClass('bi-chevron-right',  open);
});

function expandAll(){
    $('.sms-kids').removeClass('collapsed');
    $('.sms-tog i').removeClass('bi-chevron-right').addClass('bi-chevron-down');
}
function collapseAll(){
    $('.sms-kids').addClass('collapsed');
    $('.sms-tog i').removeClass('bi-chevron-down').addClass('bi-chevron-right');
}

/* ════════════════════════════════════════════════════════════
   DRAG AND DROP  — reorder within same parent
════════════════════════════════════════════════════════════ */
function attachDrag(container){
    if (!container) return;
    container.querySelectorAll('.sms-li').forEach(function(li){
        li.addEventListener('dragstart', _onDS, false);
        li.addEventListener('dragend',   _onDE, false);
        li.addEventListener('dragover',  _onDO, false);
        li.addEventListener('dragleave', _onDL, false);
        li.addEventListener('drop',      _onDD, false);
    });
}

function _onDS(e){
    _dSrc = this;
    _dPid = this.dataset.pid || '';
    var r = this.querySelector(':scope > .sms-row');
    if (r) r.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    e.stopPropagation();
}
function _onDE(){
    document.querySelectorAll('.is-dragging,.drag-over').forEach(function(el){
        el.classList.remove('is-dragging','drag-over');
    });
    _dSrc = null; _dPid = null;
}
function _onDO(e){
    e.preventDefault(); e.stopPropagation();
    if (!_dSrc || _dSrc === this) return;
    if ((this.dataset.pid||'') === _dPid){
        var r = this.querySelector(':scope > .sms-row');
        if (r) r.classList.add('drag-over');
    }
    e.dataTransfer.dropEffect = 'move';
}
function _onDL(e){
    e.stopPropagation();
    var r = this.querySelector(':scope > .sms-row');
    if (r) r.classList.remove('drag-over');
}
function _onDD(e){
    e.preventDefault(); e.stopPropagation();
    if (!_dSrc || _dSrc === this) return;
    var r = this.querySelector(':scope > .sms-row');
    if (r) r.classList.remove('drag-over');
    if ((this.dataset.pid||'') !== _dPid) return;

    var ul = this.parentNode;
    var siblings = Array.from(ul.children).filter(function(n){
        return n.classList.contains('sms-li');
    });
    var si = siblings.indexOf(_dSrc);
    var di = siblings.indexOf(this);
    if (si === -1 || di === -1 || si === di) return;

    if (si < di) ul.insertBefore(_dSrc, this.nextSibling);
    else         ul.insertBefore(_dSrc, this);

    var payload = Array.from(ul.children)
        .filter(function(n){ return n.classList.contains('sms-li'); })
        .map(function(li,idx){ return { id:parseInt(li.dataset.id,10), sort_order:(idx+1)*10 }; });

    jPost(BASE_URL + '/menus/reorder', { items:payload },
        function(res){
            if (res.status === 200) toastr.success('Order saved.');
            else { toastr.error(res.message||'Reorder failed.'); loadTree(); }
        },
        function(){ toastr.error('Network error.'); loadTree(); }
    );
}

/* ════════════════════════════════════════════════════════════
   OFFCANVAS FORM  — Add / Edit
   FIX: jQuery 4 does not execute <script> tags in .html().
   smsMenuFormInit() is called AFTER .html() to bind all events.
════════════════════════════════════════════════════════════ */
/* ── TOP BUTTON: Add Main Menu ────────────────────────────────────
   Always called with null from top bar → creates L1 main menu.
   Called with parentId from row + button → creates child at Ln+1.
   Does NOT require _flat to be loaded when parentId is null.
─────────────────────────────────────────────────────────────── */
function openAdd(parentId){
    /* Pass current panel so form pre-selects B2B or B2C */
    var params = '?panel=' + _panel;
    if (parentId) params += '&parent_id=' + parentId;
    var url = BASE_URL + '/menus/create' + params;

    if (!parentId){
        $('#ocTitle').text('Add ' + _panel.toUpperCase() + ' Main Menu');
        $('#ocSub').text('Creating a new top-level L1 menu for ' + _panel.toUpperCase());
        _showOC(url);
    } else {
        var doOpen = function(){
            var par = _flat.find(function(m){ return String(m.id) === String(parentId); });
            $('#ocTitle').text('Add Sub-Menu');
            $('#ocSub').text(par
                ? 'Creating L' + ((par.level||1)+1) + ' child inside "' + par.title + '"'
                : 'Creating child menu');
            _showOC(url);
        };
        if (_flatReady) doOpen();
        else            loadFlat(doOpen);
    }
}

function openEdit(uuid){
    var item = _flat.find(function(m){ return m.uuid === uuid; });
    $('#ocTitle').text('Edit Menu');
    $('#ocSub').text(item ? '"'+item.title+'" — L'+(item.level||1) : '');
    /* Pass current panel so form knows the context */
    _showOC(BASE_URL + '/menus/'+uuid+'/edit?panel='+_panel);
}

function _showOC(url){
    $('#ocBody').html(
        '<div class="text-center py-5">'
        +'<div class="spinner-border text-primary"></div>'
        +'</div>'
    );
    bootstrap.Offcanvas.getOrCreateInstance(
        document.getElementById('ocMenu')
    ).show();

    $.get(url, function(html){
        $('#ocBody').html(html);
        /* FIX: manually init form because jQuery 4 won't run inline scripts */
        smsMenuFormInit();
        $('#ocBody').off('submit','#frmMenu').on('submit','#frmMenu', function(e){
            e.preventDefault();
            _submitOC($(this));
        });
    }).fail(function(xhr){
        $('#ocBody').html(
            '<div class="alert alert-danger m-3">'
            +'<strong>Failed to load form.</strong><br>'
            +'<small class="text-muted">Status: '+xhr.status+' '+xhr.statusText+'</small>'
            +'</div>'
        );
    });
}

/* ────────────────────────────────────────────────────────────
   smsMenuFormInit()
   Binds all form JS that was previously in the inline <script>
   of form.ejs. Called after .html() because jQuery 4 won't
   execute scripts inserted via .html().
──────────────────────────────────────────────────────────── */
function smsMenuFormInit(){
    var LCOLORS = ['_bl1','_bl2','_bl3','_bl4','_bl5'];
    var LNAMES  = ['Main menu','Sub-menu','Child menu','L4 menu','L5 menu'];

    /* 1. Parent dropdown → update level badge */
    var parentSel = document.getElementById('parentSel');
    if (parentSel){
        parentSel.addEventListener('change', function(){
            var opt = this.options[this.selectedIndex];
            var pl  = opt.value ? parseInt(opt.dataset.level || 1) : 0;
            var nl  = pl + 1;
            var lvlNum  = document.getElementById('lvlNum');
            var lvlName = document.getElementById('lvlName');
            var lvlBadge= document.getElementById('lvlBadge');
            if (lvlNum)   lvlNum.textContent  = nl;
            if (lvlName)  lvlName.textContent = LNAMES[Math.min(nl,5)-1] || ('Level '+nl);
            if (lvlBadge){
                lvlBadge.className = 'badge '+(LCOLORS[Math.min(nl,5)-1]||'_bl5')+' rounded px-3 py-1';
                lvlBadge.style.fontSize = '13px';
            }
        });
    }

    /* 2. Icon grid toggle button */
    var btnGrid = document.getElementById('btnIconGrid');
    var iconGrid= document.getElementById('iconGrid');
    if (btnGrid && iconGrid){
        btnGrid.addEventListener('click', function(){
            iconGrid.style.display = iconGrid.style.display === 'none' ? '' : 'none';
        });
    }

    /* 3. Icon grid — pick an icon */
    document.querySelectorAll('#iconGridInner .icon-pick').forEach(function(btn){
        btn.addEventListener('click', function(){
            var ic = this.dataset.icon; /* e.g. "ti-home" */
            var inp  = document.getElementById('iconInp');
            var prev = document.getElementById('iconPrev');
            if (inp)  inp.value = ic;
            if (prev){
                prev.className = 'bi bi-' + ic;
                prev.style.fontSize = '22px';
                prev.style.color    = 'var(--tblr-primary)';
            }
            if (iconGrid) iconGrid.style.display = 'none';
        });
    });

    /* 4. Live icon preview while typing */
    var iconInp = document.getElementById('iconInp');
    var iconPrev= document.getElementById('iconPrev');
    if (iconInp && iconPrev){
        iconInp.addEventListener('input', function(){
            var val = this.value.trim().replace(/^bi\s+/,'').replace(/^ti\s+/,'');
            iconPrev.className = 'bi bi-' + (val || 'circle');
        });
    }
}

/* ────────────────────────────────────────────────────────────
   _submitOC  — submits the add/edit form
──────────────────────────────────────────────────────────── */
function _submitOC($f){
    var uuid = $f.data('uuid');
    var url  = uuid ? BASE_URL+'/menus/'+uuid : BASE_URL+'/menus';

    /* Client-side: warn if sort_order conflicts at same level */
    var $sortInp = $f.find('#sortOrderInp');
    var sortVal  = parseInt($sortInp.val()) || 0;
    var taken    = [];
    try { taken = JSON.parse($sortInp.data('taken') || '[]'); } catch(e){}
    var $sortErr = $f.find('#sortOrderError');
    if (sortVal > 0 && taken.indexOf(sortVal) !== -1){
        $sortInp.addClass('is-invalid');
        $sortErr.text('Sort order ' + sortVal + ' is already used at this level. Choose a different number.');
        $sortInp.focus();
        return;
    }
    $sortInp.removeClass('is-invalid');
    $sortErr.text('');

    var $btn = $f.find('#frmSave').prop('disabled',true);
    var orig = $btn.html();
    $btn.html('<span class="spinner-border spinner-border-sm me-1"></span>Saving…');

    var fd = $f.serializeArray();
    if (!$f.find('[name=is_visible]').is(':checked'))
        fd.push({ name:'is_visible',     value:'0' });
    if (!$f.find('[name=open_in_new_tab]').is(':checked'))
        fd.push({ name:'open_in_new_tab', value:'0' });

    $.post(url, fd, function(res){
        $btn.prop('disabled',false).html(orig);
        if (res.status === 200 || res.status === 201){
            toastr.success(res.message || 'Saved.');
            bootstrap.Offcanvas.getInstance(document.getElementById('ocMenu'))?.hide();
            loadTree();
        } else {
            toastr.error(res.message || 'Error saving.');
        }
    }, 'json').fail(function(){
        $btn.prop('disabled',false).html(orig);
        toastr.error('Network error.');
    });
}

/* ════════════════════════════════════════════════════════════
   VISIBILITY TOGGLE
════════════════════════════════════════════════════════════ */
function doToggleVis(uuid, btn){
    $(btn).prop('disabled',true);
    $.ajax({ url:BASE_URL+'/menus/'+uuid+'/toggle-visibility', type:'POST' })
        .done(function(res){
            $(btn).prop('disabled',false);
            if (res.status === 200){ toastr.success(res.message); loadTree(); }
            else toastr.error(res.message||'Failed.');
        }).fail(function(){
        $(btn).prop('disabled',false);
        toastr.error('Network error.');
    });
}

/* ════════════════════════════════════════════════════════════
   DELETE  — confirm modal, cascade on API side
════════════════════════════════════════════════════════════ */
function openDelete(uuid, title, hasKids){
    _delUuid = uuid;
    $('#delItemName').text('"'+title+'"');
    $('#delHasKidsWarning').toggle(hasKids === 1);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDelete')).show();
}

$('#btnDeleteConfirm').on('click', function(){
    if (!_delUuid) return;
    var $btn = $(this).prop('disabled',true);
    $.post(BASE_URL+'/menus/'+_delUuid+'/delete', function(res){
        $btn.prop('disabled',false);
        if (res.status === 200){
            toastr.success(res.message);
            bootstrap.Modal.getInstance(document.getElementById('modalDelete'))?.hide();
            loadTree();
        } else {
            toastr.error(res.message||'Delete failed.');
        }
    }, 'json').fail(function(){
        $btn.prop('disabled',false);
        toastr.error('Network error.');
    });
});

/* ════════════════════════════════════════════════════════════
   MOVE MODAL
   FIX: currentParentId passed as integer 0 when no parent,
        normalised to null here. Dropdown populated from _flat.
        Excludes self + all descendants.
════════════════════════════════════════════════════════════ */
function _allDescendants(id){
    var out = [];
    _flat.forEach(function(m){
        if (String(m.parent_id) === String(id)){
            out.push(m.id);
            _allDescendants(m.id).forEach(function(d){ out.push(d); });
        }
    });
    return out;
}

function openMove(uuid, title, selfId, currentParentId){
    /* normalise 0 → null */
    currentParentId = (currentParentId && currentParentId !== 0) ? currentParentId : null;
    _moveUuid = uuid;

    /* current parent label */
    var curLabel = 'Top Level (L1)';
    if (currentParentId){
        var cp = _flat.find(function(m){ return String(m.id) === String(currentParentId); });
        if (cp) curLabel = cp.title + ' (L'+cp.level+')';
    }
    $('#moveItemName').text(title);
    $('#moveItemCurrent').text(curLabel);

    var doOpen = function(){
        var excluded = [String(selfId)];
        _allDescendants(selfId).forEach(function(d){ excluded.push(String(d)); });

        var $sel = $('#moveTarget').empty();
        $sel.append('<option value="">— Top Level (becomes Main Menu, L1) —</option>');

        /* Only show menus from the same panel in the dropdown */
        _panelFlat().forEach(function(m){
            if (excluded.indexOf(String(m.id)) !== -1) return;
            var pad = '\u00a0\u00a0\u00a0'.repeat((m.level||1)-1);
            var sel = String(m.id) === String(currentParentId) ? ' selected' : '';
            $sel.append(
                '<option value="'+m.id+'"'+sel+'>'
                +pad+x(m.title)+'  · L'+m.level
                +'</option>'
            );
        });

        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalMove')).show();
    };

    if (_flatReady) doOpen();
    else            loadFlat(doOpen);
}

$('#btnMoveConfirm').on('click', function(){
    if (!_moveUuid) return;
    var $btn = $(this).prop('disabled',true);
    var tid  = $('#moveTarget').val();
    jPost(
        BASE_URL+'/menus/'+_moveUuid+'/move',
        { target_parent_id: tid ? parseInt(tid,10) : null },
        function(res){
            $btn.prop('disabled',false);
            if (res.status === 200){
                toastr.success(res.message||'Moved.');
                bootstrap.Modal.getInstance(document.getElementById('modalMove'))?.hide();
                loadTree();
            } else {
                toastr.error(res.message||'Move failed.');
            }
        },
        function(){ $btn.prop('disabled',false); toastr.error('Network error.'); }
    );
});

/* ════════════════════════════════════════════════════════════
   SORT MODAL
   openSort(null, 'Main Menus') → sort L1 menus
   openSort(id,   'Title')      → sort direct children of id
════════════════════════════════════════════════════════════ */
/* ── TOP BUTTON: Sort Main Menus ──────────────────────────────────
   Called with null from top bar → sorts all L1 main menus.
   Called with parentId from row Sort button → sorts that item's children.
─────────────────────────────────────────────────────────────── */
function openSort(parentId, parentTitle){
    /* Show modal immediately with spinner — no blank modal even if _flat not ready */
    $('#sortParentName').text(parentTitle || 'Top Level');
    $('#sortList').html(
        '<div class="text-center py-4 text-muted">'
        + '<div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading…'
        + '</div>'
    );
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalSort')).show();

    var doFill = function(){
        var pid = (parentId && parentId !== 0) ? parentId : null;

        /* Filter by active panel (b2b or b2c) then by level/parent */
        var items = _panelFlat().filter(function(m){
            if (pid === null) return !m.parent_id;
            return String(m.parent_id) === String(pid);
        }).sort(function(a,b){ return (a.sort_order||0) - (b.sort_order||0); });

        var $list = $('#sortList').empty();

        if (!items.length){
            $list.html('<p class="text-muted text-center py-3 mb-0" style="font-size:13px;">'
                + 'No items at this level to sort.</p>');
            return;
        }

        items.forEach(function(m, idx){
            var iconCls = (m.icon||'circle').replace(/^bi\s+/,'').replace(/^ti\s+/,'');
            var $row = $(
                '<div class="sort-item" draggable="true">'
                + '<span style="cursor:grab;color:var(--tblr-text-muted);flex-shrink:0;font-size:16px;">'
                +   '<i class="bi bi-grip-vertical"></i></span>'
                + '<i class="bi bi-' + x(iconCls) + '"'
                +   ' style="font-size:15px;color:var(--tblr-primary);flex-shrink:0;width:20px;text-align:center;"></i>'
                + '<span style="flex-grow:1;font-size:13px;font-weight:500;">' + x(m.title) + '</span>'
                + '<span class="' + _lbadge(m.level||1) + '" style="margin-right:6px;">L' + (m.level||1) + '</span>'
                + '<input type="number" class="sort-num" data-id="' + m.id + '"'
                +   ' value="' + (m.sort_order || (idx+1)) + '" min="1" step="1" title="Sort order"/>'
                + '</div>'
            );
            var el = $row[0];
            el.addEventListener('dragstart', function(){ _sortDragSrc=this; this.style.opacity='.3'; });
            el.addEventListener('dragend',   function(){ this.style.opacity='1'; _sortDragSrc=null; });
            el.addEventListener('dragover',  function(e){ e.preventDefault(); this.classList.add('si-over'); });
            el.addEventListener('dragleave', function(){ this.classList.remove('si-over'); });
            el.addEventListener('drop', function(e){
                e.preventDefault(); this.classList.remove('si-over');
                if (!_sortDragSrc || _sortDragSrc === this) return;
                var $l  = $('#sortList');
                var all = $l.children().toArray();
                var si_ = all.indexOf(_sortDragSrc);
                var di_ = all.indexOf(this);
                if (si_ < di_) $l[0].insertBefore(_sortDragSrc, this.nextSibling);
                else            $l[0].insertBefore(_sortDragSrc, this);
                /* Renumber 1,2,3... after each drag */
                $l.children().each(function(i){ $(this).find('.sort-num').val(i + 1); });
            });
            $list.append($row);
        });
    };

    if (_flatReady) doFill();
    else            loadFlat(doFill);
}

$('#btnSortSave').on('click', function(){
    var $btn = $(this).prop('disabled',true);
    var payload = [];
    $('#sortList .sort-item').each(function(){
        var id = parseInt($(this).find('.sort-num').data('id'),10);
        var so = parseInt($(this).find('.sort-num').val(),10) || 0;
        if (id) payload.push({ id:id, sort_order:so });
    });
    if (!payload.length){ $btn.prop('disabled',false); return; }
    jPost(BASE_URL+'/menus/reorder', { items:payload },
        function(res){
            $btn.prop('disabled',false);
            if (res.status === 200){
                toastr.success('Sort order saved.');
                bootstrap.Modal.getInstance(document.getElementById('modalSort'))?.hide();
                loadTree();
            } else {
                toastr.error(res.message||'Save failed.');
            }
        },
        function(){ $btn.prop('disabled',false); toastr.error('Network error.'); }
    );
});

/* ════════════════════════════════════════════════════════════
   PANEL TABS
════════════════════════════════════════════════════════════ */
$('#panelGroup').on('click', '[data-panel]', function(){
    $('#panelGroup .btn').removeClass('btn-primary active').addClass('btn-outline-primary');
    $(this).removeClass('btn-outline-primary').addClass('btn-primary active');
    _panel = $(this).data('panel');
    loadTree();
    /* Update Add button label to reflect current panel */
    $('#btnAddMain').html(
        '<i class="bi bi-plus-lg me-1"></i>Add ' + _panel.toUpperCase() + ' Menu'
    );
});

/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
$(function(){
    loadTree();

    $('#btnAddMain').on('click',  function(){ openAdd(null); });
    $('#btnSortMain').on('click', function(){ openSort(null, 'Main Menus (Top Level)'); });
    $('#btnExpand').on('click',   expandAll);
    $('#btnCollapse').on('click', collapseAll);
});