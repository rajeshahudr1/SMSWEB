/* ================================================================
   POS.js — Pospay Modern Style. All onclick inline. iPad safe.
   ================================================================ */
'use strict';
var _tab='parts',_page=1,_pp=20,_search='',_wh='',_cart=[],_lastUuid='';
var _vMode=false,_vUuid='',_vName='',_vParts=[];
var _selPart=null;
var _taxes=[];//org tax configs loaded on init
var _isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&'ontouchend' in document);

function F(v){return parseFloat(v||0).toFixed(2);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
function isMob(){return window.innerWidth<=768;}
// Helpers for SPA-loaded pages
if(!window.H)window.H={esc:function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');},currency:function(v){return parseFloat(v||0).toFixed(2);}};
if(!window.smsInitPerPage)window.smsInitPerPage=function(sel){var v=15;if(sel)$(sel).val(v);return v;};
if(!window.smsFormatDateTime)window.smsFormatDateTime=function(d){if(!d)return '\u2014';var dt=new Date(d);return dt.toLocaleDateString()+' '+dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});};
if(!window.smsFormatDate)window.smsFormatDate=function(d){if(!d)return '\u2014';return new Date(d).toLocaleDateString();};
if(!window.smsConfirm)window.smsConfirm=function(o){posConfirm(o.msg||'Are you sure?',o.onConfirm);};
function posConfirm(msg,onYes){
    var $ov=$('#posConfirmOv');
    if(!$ov.length){$('body').append('<div id="posConfirmOv" class="co-overlay" style="z-index:99998;" onclick="if(event.target===this)$(this).hide();"><div class="co-box" style="max-width:360px;text-align:center;padding:28px 24px;"><div style="font-size:40px;color:var(--yellow);margin-bottom:10px;"><i class="bi bi-exclamation-triangle-fill"></i></div><p id="posConfirmMsg" style="font-size:14px;font-weight:600;margin-bottom:18px;"></p><div style="display:flex;gap:8px;justify-content:center;"><button class="pm-btn cancel" id="posConfirmNo" style="flex:0;padding:10px 24px;">Cancel</button><button class="pm-btn" id="posConfirmYes" style="flex:0;padding:10px 24px;background:var(--red);color:#fff;border:none;font-weight:700;">Delete</button></div></div></div>');$ov=$('#posConfirmOv');}
    $('#posConfirmMsg').text(msg);
    $ov.css('display','flex');
    $('#posConfirmNo').off('click').on('click',function(){$ov.hide();});
    $('#posConfirmYes').off('click').on('click',function(){$ov.hide();if(onYes)onYes();});
}
if(!window.showLoading)window.showLoading=function(){};
if(!window.hideLoading)window.hideLoading=function(){};
// Enums
var DMG_TYPE={'1':'Does Not Affect Function','2':'Affects Function'};
var DMG_LOC={'1':'Internal','2':'External'};
var REF_TYPE={'1':'Compatible','2':'Written on Label'};
var REF_COND={'1':'OEM','2':'Aftermarket'};
function stars(r){var v=parseFloat(r)||0,h='';for(var i=1;i<=5;i++){var c=i<=v?'color:#eab308':'color:#d1d5db';h+='<i class="bi bi-star'+(i<=v?'-fill':'')+'" style="'+c+';font-size:13px;"></i>';}return h;}

/* ── Panel ── */
function openPanel(){if(isMob())$('#posRight').addClass('open');}
function closePanel(){if(isMob())$('#posRight').removeClass('open');}
function showCart(){$('#detailView').removeClass('active');$('#cartView').removeClass('hidden');_selPart=null;$('.pc').removeClass('selected');}
function showDetailPanel(){$('#cartView').addClass('hidden');$('#detailView').addClass('active');openPanel();}

/* ── Tab switch ── */
function switchTab(el){$('.pcat').removeClass('active');$(el).addClass('active');_tab=$(el).data('tab');_page=1;_advBuilt={parts:false,vehicles:false};_advFilters={};$('#advCount').hide();showCart();closePanel();if(_vMode)closeVehicleParts();else loadProducts();}

/* ── Smart tooltip — auto positions to best visible side ── */
var $pcTip=null;
function showPcTip(el){
    if(window.innerWidth<=1024)return;
    var d;try{d=JSON.parse($(el).attr('data-tipdata').replace(/&#39;/g,"'"));}catch(e){return;}
    if(!$pcTip){$pcTip=$('<div class="pc-tip"><div class="pc-tip-arrow"></div><div class="pc-tip-inner"></div></div>');$('body').append($pcTip);}
    // Build content
    var h='<div class="pc-tip-name">'+esc(d.n)+'</div>';
    if(d.type==='vehicle'){
        h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Vehicle ID</span><span class="pc-tip-val">'+esc(d.id)+'</span></div>';
        if(d.plate)h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Reg. Plate</span><span class="pc-tip-val">'+esc(d.plate)+'</span></div>';
        if(d.color)h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Color</span><span class="pc-tip-val">'+esc(d.color)+'</span></div>';
        h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Parts</span><span class="pc-tip-val" style="color:#60a5fa;">'+esc(String(d.parts||0))+' in stock</span></div>';
    } else {
        h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Internal ID</span><span class="pc-tip-val">'+esc(d.id)+'</span></div>';
        if(d.pc)h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Part Code</span><span class="pc-tip-val">'+esc(d.pc)+'</span></div>';
        if(d.wh)h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Warehouse</span><span class="pc-tip-val">'+esc(d.wh)+'</span></div>';
        if(d.cond)h+='<div class="pc-tip-row"><span class="pc-tip-lbl">Condition</span><span class="pc-tip-val">'+esc(d.cond)+'</span></div>';
        h+='<div class="pc-tip-price">'+esc(d.price)+'</div>';
        h+='<div class="pc-tip-stock '+esc(d.sc)+'">'+d.qty+' in stock</div>';
    }
    $pcTip.find('.pc-tip-inner').html(h);
    $pcTip.removeClass('show');
    // Position: check space above, below, right, left
    var rect=el.getBoundingClientRect();
    var tw=260,th=$pcTip[0].offsetHeight||200;
    var vw=window.innerWidth,vh=window.innerHeight;
    var $arrow=$pcTip.find('.pc-tip-arrow');
    var top,left;
    // Try above
    if(rect.top>th+16){
        top=rect.top-th-10;left=rect.left+(rect.width/2)-(tw/2);
        $arrow.css({top:'auto',bottom:'-6px',left:'50%',right:'auto',transform:'translateX(-50%) rotate(45deg)'});
    }
    // Try below
    else if(vh-rect.bottom>th+16){
        top=rect.bottom+10;left=rect.left+(rect.width/2)-(tw/2);
        $arrow.css({bottom:'auto',top:'-6px',left:'50%',right:'auto',transform:'translateX(-50%) rotate(45deg)'});
    }
    // Try right
    else if(vw-rect.right>tw+16){
        top=rect.top+(rect.height/2)-(th/2);left=rect.right+10;
        $arrow.css({top:'50%',bottom:'auto',left:'-6px',right:'auto',transform:'translateY(-50%) rotate(45deg)'});
    }
    // Try left
    else{
        top=rect.top+(rect.height/2)-(th/2);left=rect.left-tw-10;
        $arrow.css({top:'50%',bottom:'auto',right:'-6px',left:'auto',transform:'translateY(-50%) rotate(45deg)'});
    }
    // Clamp to viewport
    if(left<8)left=8;if(left+tw>vw-8)left=vw-tw-8;
    if(top<8)top=8;if(top+th>vh-8)top=vh-th-8;
    $pcTip.css({top:top+'px',left:left+'px',width:tw+'px'});
    requestAnimationFrame(function(){$pcTip.addClass('show');});
}
function hidePcTip(){if($pcTip)$pcTip.removeClass('show');}

/* ══════════════════════════════════════════
   SPA NAVIGATION — no page refresh, fullscreen stays
   ══════════════════════════════════════════ */
var _spaPage='pos';
var _spaUrls={orders:'/sales/orders',customers:'/sales/customers',returns:'/sales/returns',settings:'/sales/settings'};

function spaNav(page){
    // Update sidebar active state
    $('.ps-nav .ps-btn').removeClass('active');
    $('.ps-nav .ps-btn').eq({pos:0,orders:1,customers:2,returns:3,settings:4}[page]||0).addClass('active');
    _spaPage=page;

    if(page==='pos'){
        // Show POS view, hide SPA content
        $('#posHeader,.pos-cats,#vBackBar,#prodGrid').show();
        $('#spaContent').hide().html('');
        $('#posRight').css('display','');
        history.pushState(null,'','/sales');
        return;
    }

    // Hide POS views, show SPA content
    $('#posHeader,.pos-cats,#vBackBar,#prodGrid').hide();
    $('#posRight').css('display','none');
    closePanel();
    var $spa=$('#spaContent');
    $spa.show().html('<div style="text-align:center;padding:60px;"><div class="spinner-border" style="color:var(--primary);"></div></div>');
    history.pushState(null,'',_spaUrls[page]);

    // Fetch page content via AJAX (X-SPA header = no layout)
    $.ajax({url:_spaUrls[page],headers:{'X-SPA':'1','X-Requested-With':'XMLHttpRequest'},success:function(html){
        var h='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">';
        h+='<button onclick="spaNav(\'pos\')" style="width:34px;height:34px;border-radius:var(--rs);border:1.5px solid var(--border);background:none;cursor:pointer;font-size:15px;color:var(--text2);display:flex;align-items:center;justify-content:center;" data-tip="Back to POS"><i class="bi bi-arrow-left"></i></button>';
        h+='<h2 style="font-size:20px;font-weight:800;margin:0;">'+({orders:'Sales Orders',customers:'Customers',returns:'Returns',settings:'POS Settings'}[page]||page)+'</h2>';
        h+='</div><div id="spaInner"></div>';
        $spa.html(h);
        // Use jQuery .html() on #spaInner — it automatically executes <script> tags
        $('#spaInner').html(html);
    },error:function(){
        $spa.html('<div style="text-align:center;padding:40px;color:var(--red);"><i class="bi bi-exclamation-triangle" style="font-size:32px;display:block;margin-bottom:8px;"></i>Failed to load</div>');
    }});
}

// Handle browser back/forward
window.addEventListener('popstate',function(){
    var path=location.pathname;
    if(path==='/sales'||path==='/sales/')spaNav('pos');
    else if(path.includes('/orders'))spaNav('orders');
    else if(path.includes('/customers'))spaNav('customers');
    else if(path.includes('/returns'))spaNav('returns');
    else if(path.includes('/settings'))spaNav('settings');
});

/* ══════════════════════════════════════════
   ADVANCED SEARCH — same filters as part-inventories & vehicle-inventories
   ══════════════════════════════════════════ */
var _advFilters={};
var _advBuilt={parts:false,vehicles:false};

function openAdvSearch(){
    // Always show part filters when inside vehicle parts view
    var mode=_vMode?'parts':_tab;
    buildAdvTabs(mode);
    $('#advSearchPage').addClass('open');
}

function buildAdvTabs(mode){
    if(_advBuilt[mode])return; // already built
    var $tabs=$('#advTabs'),$body=$('#advBody');
    $tabs.html('');$body.html('');

    if(mode==='parts'){
        // Part inventory filters: Vehicle, Part, Status, Dates, Location
        $tabs.html(
            '<button class="pcat active" onclick="advTab(this,\'avVeh\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-truck-front"></i> Vehicle</button>'+
            '<button class="pcat" onclick="advTab(this,\'avPart\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-gear"></i> Part</button>'+
            '<button class="pcat" onclick="advTab(this,\'avStat\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-flag"></i> Status</button>'+
            '<button class="pcat" onclick="advTab(this,\'avDate\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-calendar"></i> Dates</button>'+
            '<button class="pcat" onclick="advTab(this,\'avLoc\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-geo-alt"></i> Location</button>'
        );
        var g='display:grid;grid-template-columns:1fr 1fr;gap:10px;';
        var h='';
        // Vehicle tab
        h+='<div class="adv-pane active" id="avVeh"><div style="'+g+'">';
        h+=_afSel('afVehType','Vehicle Type');
        h+=_afSel('afVehYear','Vehicle Year');
        h+=_afSel('afVehMake','Vehicle Make');
        h+=_afSel('afVehModel','Vehicle Model');
        h+=_afSel('afVehVariant','Vehicle Variant');
        h+=_afSel('afVehEngine','Vehicle Engine');
        h+=_afSel('afVehFuel','Vehicle Fuel');
        h+=_afInp('afMotorization','Motorization','text');
        h+=_afInp('afCC','CC','text');
        h+=_afInp('afCV','CV','text');
        h+=_afInp('afKW','KW','text');
        h+=_afInp('afVehIntId','Vehicle Internal ID','text');
        h+='</div></div>';
        // Part tab
        h+='<div class="adv-pane" id="avPart" style="display:none;"><div style="'+g+'">';
        h+=_afInp('afPartCode','Part Code','text');
        h+=_afInp('afPartIntId','Part Internal ID','text');
        h+=_afSel('afPartBrand','Part Brand');
        h+=_afSel('afPartCatalog','Part Catalog');
        h+=_afInp('afRegNum','Reg No Dismantler','text');
        h+=_afInp('afQtyMin','Qty Min','number');
        h+=_afInp('afQtyMax','Qty Max','number');
        h+=_afInp('afPriceMin','Price Min','number');
        h+=_afInp('afPriceMax','Price Max','number');
        h+=_afInp('afCostMin','Cost Min','number');
        h+=_afInp('afCostMax','Cost Max','number');
        h+=_afInp('afRatingMin','Rating Min','number');
        h+=_afInp('afRatingMax','Rating Max','number');
        h+=_afOpt('afIsMaster','Is Master Part',['','Any'],['1','Yes'],['0','No']);
        h+=_afOpt('afPrintLabel','Print Label',['','Any'],['1','Yes'],['0','No']);
        h+=_afOpt('afVatIncluded','Tax Included',['','Any'],['1','Yes'],['0','No']);
        h+=_afOpt('afCustomSize','Custom Size',['','Any'],['1','Yes'],['0','No']);
        h+='</div></div>';
        // Status tab
        h+='<div class="adv-pane" id="avStat" style="display:none;"><div style="'+g+'">';
        h+=_afOpt('afInvStatus','Inventory Status',['','All'],['1','In Stock'],['2','Out of Stock'],['3','Reserved'],['4','Sold']);
        h+=_afOpt('afCondition','Condition',['','All'],['1','OEM'],['2','Aftermarket']);
        h+=_afOpt('afPartState','Part State',['','All'],['1','New'],['2','Used'],['3','Remanufactured'],['4','Not Working']);
        h+='</div></div>';
        // Dates tab
        h+='<div class="adv-pane" id="avDate" style="display:none;"><div style="'+g+'">';
        h+=_afInp('afCreatedFrom','Created From','date');
        h+=_afInp('afCreatedTo','Created To','date');
        h+=_afInp('afUpdatedFrom','Updated From','date');
        h+=_afInp('afUpdatedTo','Updated To','date');
        h+='<div style="grid-column:1/-1;">'+_afInp('afNotes','Notes Search','text')+'</div>';
        h+='</div></div>';
        // Location tab
        h+='<div class="adv-pane" id="avLoc" style="display:none;"><div style="'+g+'">';
        h+=_afSel('afWarehouse','Warehouse');
        h+=_afSel('afZone','Zone');
        h+=_afSel('afShelf','Shelf');
        h+=_afSel('afRack','Rack');
        h+=_afSel('afBin','Bin');
        h+='</div></div>';
        $body.html(h);
        _loadPartDropdowns();
    } else {
        // Vehicle inventory filters: Vehicle, Status, Dates, Other
        $tabs.html(
            '<button class="pcat active" onclick="advTab(this,\'avVeh\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-truck-front"></i> Vehicle</button>'+
            '<button class="pcat" onclick="advTab(this,\'avStat\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-flag"></i> Status</button>'+
            '<button class="pcat" onclick="advTab(this,\'avDate\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-calendar"></i> Dates</button>'+
            '<button class="pcat" onclick="advTab(this,\'avOther\')" style="padding:6px 14px;font-size:11px;"><i class="bi bi-three-dots"></i> Other</button>'
        );
        var g='display:grid;grid-template-columns:1fr 1fr;gap:10px;';
        var h='';
        // Vehicle tab
        h+='<div class="adv-pane active" id="avVeh"><div style="'+g+'">';
        h+=_afSel('afVehType','Vehicle Type');
        h+=_afSel('afVehYear','Vehicle Year');
        h+=_afSel('afVehMake','Vehicle Make');
        h+=_afSel('afVehModel','Vehicle Model');
        h+=_afSel('afVehVariant','Vehicle Variant');
        h+=_afSel('afVehFuel','Vehicle Fuel');
        h+=_afSel('afVehCategory','Vehicle Category');
        h+='</div></div>';
        // Status tab
        h+='<div class="adv-pane" id="avStat" style="display:none;"><div style="'+g+'">';
        h+=_afOpt('afInvStatus','Inventory Status',['','All'],['1','In Stock'],['2','Out of Stock'],['3','Sent to Wastage']);
        h+=_afOpt('afDepStatus','Depollution Status',['','All'],['1','Pending'],['2','In Depollution'],['3','Depolluted']);
        h+=_afOpt('afDisStatus','Dismantle Status',['','All'],['1','Pending'],['2','In Dismantling'],['3','Dismantled']);
        h+=_afOpt('afStateParking','State Parking',['','All'],['1','With Declaration'],['2','With Certificate'],['3','Pending to Accept']);
        h+=_afOpt('afSteering','Steering Side',['','All'],['1','Left'],['2','Right'],['3','Not Applicable']);
        h+='</div></div>';
        // Dates tab
        h+='<div class="adv-pane" id="avDate" style="display:none;"><div style="'+g+'">';
        h+=_afInp('afArrivalFrom','Arrival From','date');
        h+=_afInp('afArrivalTo','Arrival To','date');
        h+=_afInp('afProcessFrom','Process Start From','date');
        h+=_afInp('afProcessTo','Process Start To','date');
        h+=_afInp('afCreatedFrom','Created From','date');
        h+=_afInp('afCreatedTo','Created To','date');
        h+='</div></div>';
        // Other tab
        h+='<div class="adv-pane" id="avOther" style="display:none;"><div style="'+g+'">';
        h+=_afInp('afVin','VIN','text');
        h+=_afInp('afColor','Color','text');
        h+=_afInp('afBrand','Brand','text');
        h+=_afInp('afOwner','Owner Name','text');
        h+=_afInp('afPlate','Registration Plate','text');
        h+='</div></div>';
        $body.html(h);
        _loadVehDropdowns();
    }
    _advBuilt[mode]=true;
}

// HTML helpers
function _afSel(id,lbl){return '<div><label class="co-label">'+lbl+'</label><select class="pos-input pos-s2" id="'+id+'"><option value=""></option></select></div>';}
function _afInp(id,lbl,type){return '<div><label class="co-label">'+lbl+'</label><input class="pos-input" type="'+type+'" id="'+id+'" placeholder="'+lbl+'"/></div>';}
function _afOpt(id,lbl){var opts=Array.prototype.slice.call(arguments,2);var h='<div><label class="co-label">'+lbl+'</label><select class="pos-input" id="'+id+'">';opts.forEach(function(o){h+='<option value="'+o[0]+'">'+o[1]+'</option>';});return h+'</select></div>';}

function advTab(el,id){$('#advTabs .pcat').removeClass('active');$(el).addClass('active');$('.adv-pane').removeClass('active').hide();$('#'+id).addClass('active').show();}

// Select2 AJAX autocomplete — same as part-inventories page
function _s2(sel,url,ph,extraData){
    var $p=$('#advSearchPage');
    $(sel).select2({
        placeholder:ph||'All',allowClear:true,width:'100%',
        dropdownParent:$p,
        ajax:{url:BASE_URL+url,dataType:'json',delay:300,
            data:function(p){var d={search:p.term||'',limit:50};if(extraData)$.extend(d,extraData());return d;},
            processResults:function(r){return{results:(r.data||[]).map(function(v){return{id:v.id,text:v.name||String(v.year||'')||v.manufacturer_engine||''};})};},
            cache:false
        },
        minimumInputLength:0
    });
}
function _s2Clear(ids){ids.forEach(function(id){$(id).val(null).trigger('change.select2');});}

// Part dropdowns — Select2 AJAX with cascades (same as part-inventories page)
function _loadPartDropdowns(){
    _s2('#afVehType','/vehicle-types/autocomplete','All Types');
    _s2('#afVehMake','/vehicle-makes/autocomplete','All Makes',function(){var t=$('#afVehType').val();return t?{vehicle_type_id:t}:{};});
    _s2('#afVehModel','/vehicle-models/autocomplete','All Models',function(){var m=$('#afVehMake').val();return m?{vehicle_make_id:m}:{};});
    _s2('#afVehVariant','/vehicle-variants/autocomplete','All Variants',function(){var m=$('#afVehModel').val();return m?{vehicle_model_id:m}:{};});
    _s2('#afVehYear','/vehicle-years/autocomplete','All Years');
    _s2('#afVehFuel','/vehicle-fuels/autocomplete','All Fuels');
    _s2('#afVehEngine','/vehicle-engines/autocomplete','All Engines');
    _s2('#afPartBrand','/part-brands/autocomplete','All Brands');
    _s2('#afPartCatalog','/part-catalogs/autocomplete','All Catalogs');
    _s2('#afWarehouse','/warehouses/autocomplete','All Warehouses');
    _s2('#afZone','/warehouse-zones/autocomplete','All Zones',function(){var w=$('#afWarehouse').val();return w?{warehouse_id:w}:{};});
    _s2('#afShelf','/warehouse-shelves/autocomplete','All Shelves',function(){var z=$('#afZone').val();return z?{warehouse_zone_id:z}:{};});
    _s2('#afRack','/warehouse-racks/autocomplete','All Racks',function(){var s=$('#afShelf').val();return s?{warehouse_shelf_id:s}:{};});
    _s2('#afBin','/warehouse-bins/autocomplete','All Bins',function(){var r=$('#afRack').val();return r?{warehouse_rack_id:r}:{};});
    // Vehicle cascade clear
    $(document).off('change.afc').on('change.afc','#afVehType',function(){_s2Clear(['#afVehMake','#afVehModel','#afVehVariant']);})
    .on('change.afc','#afVehMake',function(){_s2Clear(['#afVehModel','#afVehVariant']);})
    .on('change.afc','#afVehModel',function(){_s2Clear(['#afVehVariant']);});
    // Location cascade clear
    $(document).on('change.afc','#afWarehouse',function(){_s2Clear(['#afZone','#afShelf','#afRack','#afBin']);})
    .on('change.afc','#afZone',function(){_s2Clear(['#afShelf','#afRack','#afBin']);})
    .on('change.afc','#afShelf',function(){_s2Clear(['#afRack','#afBin']);})
    .on('change.afc','#afRack',function(){_s2Clear(['#afBin']);});
}

// Vehicle dropdowns — Select2 AJAX with cascades (same as vehicle-inventories page)
function _loadVehDropdowns(){
    _s2('#afVehType','/vehicle-types/autocomplete','All Types');
    _s2('#afVehMake','/vehicle-makes/autocomplete','All Makes',function(){var t=$('#afVehType').val();return t?{vehicle_type_id:t}:{};});
    _s2('#afVehModel','/vehicle-models/autocomplete','All Models',function(){var m=$('#afVehMake').val();return m?{vehicle_make_id:m}:{};});
    _s2('#afVehVariant','/vehicle-variants/autocomplete','All Variants',function(){var m=$('#afVehModel').val();return m?{vehicle_model_id:m}:{};});
    _s2('#afVehYear','/vehicle-years/autocomplete','All Years');
    _s2('#afVehFuel','/vehicle-fuels/autocomplete','All Fuels');
    _s2('#afVehCategory','/vehicle-categories/autocomplete','All Categories');
    // Cascade clear
    $(document).off('change.avc').on('change.avc','#afVehType',function(){_s2Clear(['#afVehMake','#afVehModel','#afVehVariant']);})
    .on('change.avc','#afVehMake',function(){_s2Clear(['#afVehModel','#afVehVariant']);})
    .on('change.avc','#afVehModel',function(){_s2Clear(['#afVehVariant']);});
}

function applyAdvSearch(){
    _advFilters={};
    // Collect all filters from the page
    var map={
        // Vehicle
        afVehType:'vehicle_type_id',afVehYear:'vehicle_year_id',afVehMake:'vehicle_make_id',
        afVehModel:'vehicle_model_id',afVehVariant:'vehicle_variant_id',afVehEngine:'vehicle_engine_id',
        afVehFuel:'vehicle_fuel_id',afVehCategory:'vehicle_category_id',
        afMotorization:'motorization',afCC:'cc',afCV:'cv',afKW:'kw',afVehIntId:'vehicle_internal_id_text',
        // Part
        afPartCode:'part_code',afPartIntId:'part_internal_id',afPartBrand:'part_brand_id',
        afPartCatalog:'part_catalog_id',afRegNum:'reg_number_dismantler',
        afQtyMin:'qty_min',afQtyMax:'qty_max',afPriceMin:'price_min',afPriceMax:'price_max',
        afCostMin:'cost_min',afCostMax:'cost_max',afRatingMin:'rating_min',afRatingMax:'rating_max',
        afIsMaster:'is_master_part',afPrintLabel:'print_label',afVatIncluded:'vat_included',afCustomSize:'custom_size',
        // Status
        afInvStatus:'inventory_status',afCondition:'condition',afPartState:'part_state',
        afDepStatus:'depolution_status',afDisStatus:'dismantle_status',afStateParking:'state_parking',afSteering:'steering_wheel_side',
        // Dates
        afCreatedFrom:'created_from',afCreatedTo:'created_to',afUpdatedFrom:'updated_from',afUpdatedTo:'updated_to',
        afArrivalFrom:'arrival_date_from',afArrivalTo:'arrival_date_to',afProcessFrom:'process_start_from',afProcessTo:'process_start_to',
        afNotes:'notes_search',
        // Location
        afWarehouse:'adv_warehouse_id',afZone:'warehouse_zone_id',afShelf:'warehouse_shelf_id',afRack:'warehouse_rack_id',afBin:'warehouse_bin_id',
        // Other (vehicle)
        afVin:'vehicle_vin',afColor:'vehicle_color',afBrand:'brand',afOwner:'owner_name',afPlate:'registration_plate_no',
    };
    var cnt=0;
    Object.keys(map).forEach(function(id){
        var $el=$('#'+id);if(!$el.length)return;
        var v=$el.val();
        if(v&&String(v).trim()){_advFilters[map[id]]=String(v).trim();cnt++;}
    });
    // Deep search
    if($('#afDeepSearch').is(':checked')){_advFilters.deep_search='1';cnt++;}
    // Update badge
    if(cnt>0)$('#advCount').text(cnt).css('display','inline-flex');else $('#advCount').hide();
    $('#advSearchPage').removeClass('open');
    if(_vMode){
        // Filter vehicle parts with advanced filters
        loadVehiclePartsFiltered();
    } else {
        _page=1;loadProducts();
    }
}

function clearAdvSearch(){
    $('#advSearchPage .pos-s2').val(null).trigger('change.select2');
    $('#advSearchPage select:not(.pos-s2)').val('');
    $('#advSearchPage input[type=text],#advSearchPage input[type=number],#advSearchPage input[type=date]').val('');
    $('#afDeepSearch').prop('checked',false);
    _advFilters={};$('#advCount').hide();
    _advBuilt={parts:false,vehicles:false};
}

/* ── Sidebar toggle ── */
function toggleSidebar(){
    var $s=$('.pos-sidebar');$s.toggleClass('collapsed');
    var hidden=$s.hasClass('collapsed');
    $('.ps-toggle').toggleClass('show',hidden);
    localStorage.setItem('pos_sidebar',hidden?'0':'1');
}

/* ── Fullscreen — persists across POS pages ── */
function toggleFS(){
    if(_isIOS){toastr.info('iPad: Use Share \u2192 Add to Home Screen for fullscreen');return;}
    try{
        var d=document,el=d.documentElement;
        if(d.fullscreenElement||d.webkitFullscreenElement){
            if(d.exitFullscreen)d.exitFullscreen();else if(d.webkitExitFullscreen)d.webkitExitFullscreen();
            localStorage.setItem('pos_fs','0');
        }else{
            if(el.requestFullscreen)el.requestFullscreen();else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
            localStorage.setItem('pos_fs','1');
        }
    }catch(e){}
}
// Auto-restore fullscreen — only via explicit button click, not auto
// (browsers block requestFullscreen without direct user gesture on the button itself)

/* ══════════════════════════════════════════
   PRODUCTS
   ══════════════════════════════════════════ */
function loadProducts(){
    var $g=$('#prodGrid');
    $g.html('<div style="grid-column:1/-1;text-align:center;padding:48px 0;color:var(--muted);"><div class="spinner-border spinner-border-sm" style="color:var(--primary);"></div></div>');
    var params=$.extend({type:_tab==='parts'?'part':'vehicle',search:_search,warehouse_id:_wh,per_page:_pp,page:_page},_advFilters||{});
    $.get(BASE_URL+'/sales/products',params,function(r){
        if(!r||r.status!==200){$g.html('<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--red);">Failed to load</div>');return;}
        var d=r.data,items=[],total=0;
        if(_tab==='parts'){items=d.parts||[];total=d.parts_total||items.length;$g.attr('class','pos-grid g-parts');}
        else{items=d.vehicles||[];total=d.vehicles_total||items.length;$g.attr('class','pos-grid g-vehicles');}
        if(!items.length){$g.html('<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted);font-size:13px;">No '+_tab+' found</div>');updatePg(0);return;}
        var h='';items.forEach(function(it){h+=_tab==='parts'?partCard(it):vehicleCard(it);});
        $g.html(h);updatePg(total);
    });
}
function partCard(p){
    var img=p.image_url?'<img src="'+esc(p.image_url)+'" alt=""/>':'<i class="bi bi-gear no-img"></i>';
    var sq=parseInt(p.quantity)||0,sc=sq>5?'':'low';if(sq<=0)sc='out';
    var name=p.catalog_name||p.part_code||'Part';
    var code=p.part_internal_id||p.part_code||'';
    var tipData=esc(JSON.stringify({n:name,id:code,pc:p.part_code||'',wh:p.warehouse_name||'',cond:p.condition||'',price:F(p.display_price),qty:sq,sc:sc||'ok'}).replace(/'/g,'&#39;'));
    return '<div class="pc" onclick="pcClick(this)" onmouseenter="showPcTip(this)" onmouseleave="hidePcTip()" data-act="part" data-uuid="'+esc(p.uuid)+'" data-id="'+p.id+'" data-name="'+esc(name)+'" data-price="'+p.display_price+'" data-qty="'+sq+'" data-code="'+esc(p.part_code||'')+'" data-wh="'+(p.warehouse_id||0)+'" data-img="'+esc(p.image_url||'')+'" data-tipdata=\''+tipData+'\'>'
        +'<div class="pc-img">'+img+'</div>'
        +'<div class="pc-body"><div class="pc-name">'+esc(name)+'</div><div class="pc-code">'+esc(code)+'</div>'
        +'<div class="pc-foot"><span class="pc-price">'+F(p.display_price)+'</span><span class="pc-stock '+sc+'">'+sq+'</span></div></div></div>';
}
function vehicleCard(v){
    var img=v.image_url?'<img src="'+esc(v.image_url)+'" alt=""/>':'<i class="bi bi-truck no-img"></i>';
    var name=v.display_name||v.vehicle_internal_id||'Vehicle';
    var code=v.vehicle_internal_id||'';
    var pc=parseInt(v.parts_count)||0;
    var tipData=esc(JSON.stringify({n:name,id:code,plate:v.registration_plate_no||'',color:v.vehicle_color||'',parts:pc,type:'vehicle'}).replace(/'/g,'&#39;'));
    return '<div class="pc" onclick="pcClick(this)" onmouseenter="showPcTip(this)" onmouseleave="hidePcTip()" data-act="vehicle" data-uuid="'+esc(v.uuid)+'" data-name="'+esc(name)+'" data-img="'+esc(v.image_url||'')+'" data-tipdata=\''+tipData+'\'>'
        +'<div class="pc-img">'+img+'</div>'
        +'<div class="pc-body"><div class="pc-name">'+esc(name)+'</div><div class="pc-code">'+esc(code)+'</div>'
        +'<div class="pc-foot"><span class="pc-stock" style="background:var(--pv2-brand-light,#e3f1ed);color:var(--primary);"><i class="bi bi-gear-wide-connected"></i> '+pc+' parts</span><i class="bi bi-chevron-right" style="color:var(--primary);font-size:12px;"></i></div></div></div>';
}
function pcClick(el){var $el=$(el),act=$el.data('act');if(act==='part')openPartDetail($el);else if(act==='vehicle')openVehicleParts($el.data('uuid'),$el.data('name'));}

/* ══════════════════════════════════════════
   PART DETAIL
   ══════════════════════════════════════════ */
function openPartDetail($el){
    var uuid=$el.data('uuid'),id=$el.data('id'),name=$el.data('name'),price=$el.data('price'),qty=$el.data('qty'),code=$el.data('code'),wh=$el.data('wh'),img=$el.data('img');
    _selPart={uuid:uuid,id:id,name:name,price:price,qty:qty,code:code,wh:wh};
    $('.pc').removeClass('selected');$el.addClass('selected');
    $('#dvTitle').text(name);$('#dvBadge').css({background:'var(--pv2-brand-light,#e3f1ed)',color:'var(--primary)'}).text('Part');
    $('#dvName').text(name);$('#dvCode').text(code);$('#dvPrice').text(F(price));
    var sq=parseInt(qty)||0,stC=sq>5?'var(--green)':sq>0?'var(--yellow)':'var(--red)';
    $('#dvStock').css('color',stC).html('<i class="bi bi-'+(sq>0?'check-circle':'x-circle')+'"></i> '+sq+' qty');
    $('#dvImg').html(img?'<img src="'+esc(img)+'" alt=""/>':'<i class="bi bi-gear no-img"></i>');
    $('#dvBody').html('<div style="text-align:center;padding:24px;"><div class="spinner-border spinner-border-sm" style="color:var(--primary);"></div></div>');
    showDetailPanel();
    $.get(BASE_URL+'/sales/part-detail/'+uuid,function(res){
        if(!res||res.status!==200||!res.data){$('#dvBody').html('<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">Details not available</div>');return;}
        _selPart._full=res.data;
        var locs=res.data.locations||[];
        if(!locs.length){$('#dvBody').html('<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">No units — <a href="#" onclick="showFullInfo();return false;" style="color:var(--primary);font-weight:600;">View info</a></div>');return;}
        $('#dvBody').html(buildUnits(locs,id));
    }).fail(function(){$('#dvBody').html('<div style="text-align:center;padding:20px;color:var(--red);font-size:12px;">Failed</div>');});
}
function buildUnits(locs,pid){
    var h='<div style="padding:10px 18px 6px;font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.5px;">Select Units to Sell</div>';
    locs.forEach(function(l){
        var inC=_cart.some(function(c){return c.item_type==='part'&&String(c.id)===String(pid)&&c.unit_number===l.unit_number;});
        var loc=[l.warehouse_name,l.warehouse_zone_name,l.warehouse_shelf_name,l.warehouse_rack_name,l.warehouse_bin_name].filter(Boolean);
        h+='<div class="dv-unit'+(inC?' in-cart':'')+'" onclick="unitRowClick(this,event)">';
        h+='<input type="checkbox" class="unit-chk" data-unit="'+l.unit_number+'" data-wh="'+(l.warehouse_id||0)+'" '+(inC?'disabled checked':'')+'>';
        h+='<div class="dv-unit-info"><div class="dv-unit-top"><span class="dv-unit-num">#'+l.unit_number+'</span>';
        if(l.location_code)h+='<span class="dv-unit-code">'+esc(l.location_code)+'</span>';
        h+='</div><div class="dv-unit-loc">'+esc(loc.join(' \u203A ')||'No location')+'</div></div>';
        if(inC)h+='<span class="dv-unit-badge"><i class="bi bi-check-circle"></i> Added</span>';
        h+='</div>';
    });
    return h;
}
function unitRowClick(el,e){if($(e.target).is('input'))return;var $c=$(el).find('.unit-chk');if($c.prop('disabled'))return;$c.prop('checked',!$c.prop('checked'));}
function dvAddClick(){
    var $ch=$('#dvBody .unit-chk:checked:not(:disabled)');
    if(!$ch.length){toastr.warning('Select units first.');return;}
    $ch.each(function(){
        var $u=$(this).closest('.dv-unit'),un=parseInt($(this).data('unit')),wh=parseInt($(this).data('wh'))||0;
        var vatInc=_selPart._full&&_selPart._full.vat_included;
        addToCart('part',_selPart.id,_selPart.name,_selPart.price,1,_selPart.code,wh,un,vatInc);
        $(this).prop('disabled',true);$u.addClass('in-cart');$u.find('.dv-unit-badge').remove();
        $u.append('<span class="dv-unit-badge"><i class="bi bi-check-circle"></i> Added</span>');
    });
}

/* ══════════════════════════════════════════
   FULL INFO
   ══════════════════════════════════════════ */
function showFullInfo(){
    if(!_selPart){toastr.warning('Select a part first.');return;}
    if(!_selPart._full){toastr.info('Loading...');$.get(BASE_URL+'/sales/part-detail/'+_selPart.uuid,function(r){if(r&&r.status===200&&r.data){_selPart._full=r.data;showFullInfo();}else toastr.error('Failed.');});return;}
    var pi=_selPart._full,refs=pi.references||[],dmgs=pi.damages||[],attrs=pi.attribute_values||[],imgs=pi.images||[],vids=pi.videos||[],subs=pi.sub_parts||[],locs=pi.locations||[];
    function _S(t,ic,items){return '<div class="is"><div class="is-hdr"><i class="bi '+ic+'"></i>'+t+'</div><div class="is-body">'+items+'</div></div>';}
    function _r(l,v){var val=(v==null||v==='')?'\u2014':String(v);return '<div class="is-item"><span class="is-lbl">'+esc(l)+'</span><span class="is-val" style="'+(val==='\u2014'?'color:var(--muted);font-weight:400;font-size:12px;':'')+'">'+esc(val)+'</span></div>';}

    // Header + Hero
    $('#infoTitle').text(pi.part_catalog_name||pi.part_code||'Part Details');
    $('#infoBadge').text('Part');
    var heroImg=imgs.length?(imgs[0].display_url||imgs[0].image_url):'';
    var heroH='<div class="ip-img">'+(heroImg?'<img src="'+esc(heroImg)+'" alt=""/>':'<i class="bi bi-gear no-img"></i>')+'</div>';
    heroH+='<div class="ip-meta"><div class="ip-meta-name">'+esc(pi.part_catalog_name||pi.part_code||'')+'</div>';
    heroH+='<div class="ip-meta-code">'+esc(pi.part_code||'')+(pi.part_internal_id?' \u00B7 '+esc(pi.part_internal_id):'')+'</div>';
    heroH+='<div class="ip-meta-row"><span class="ip-meta-price">'+F(pi.price_1||pi.price_2||0)+'</span>';
    var sq=parseInt(pi.quantity)||0,stC=sq>5?'var(--green)':sq>0?'var(--yellow)':'var(--red)';
    heroH+='<span class="ip-meta-stock" style="color:'+stC+';"><i class="bi bi-'+(sq>0?'check-circle':'x-circle')+'"></i> '+sq+' qty</span></div></div>';
    $('#infoHero').html(heroH);

    // Build tabs
    var mediaCnt=imgs.length+vids.length;
    var tabs=[
        {id:'ipInfo',label:'Details',icon:'bi-box-seam'},
        {id:'ipRefs',label:'References',icon:'bi-link-45deg',cnt:refs.length},
        {id:'ipDmgs',label:'Damages',icon:'bi-exclamation-triangle',cnt:dmgs.length},
        {id:'ipAttrs',label:'Attributes',icon:'bi-list-check',cnt:attrs.length},
        {id:'ipLocs',label:'Locations',icon:'bi-geo-alt',cnt:locs.length},
        {id:'ipMedia',label:'Media',icon:'bi-images',cnt:mediaCnt},
    ];
    if(subs.length) tabs.push({id:'ipSubs',label:'Sub Parts',icon:'bi-diagram-3',cnt:subs.length});
    var tabH='';
    tabs.forEach(function(t,i){
        tabH+='<button class="ip-tab'+(i===0?' active':'')+'" onclick="ipTabClick(this)" data-t="'+t.id+'"><i class="bi '+t.icon+'"></i> '+t.label+(t.cnt?' <span class="ip-cnt">'+t.cnt+'</span>':'')+'</button>';
    });
    $('#infoTabs').html(tabH);

    // Build panes
    var h='';

    // Details (Part + Vehicle + Extra combined)
    h+='<div class="ip-pane active" id="ipInfo">';
    h+=_S('Catalog & Pricing','bi-book',_r('Catalog',pi.part_catalog_name)+_r('Code',pi.part_code)+_r('Internal ID',pi.part_internal_id)+_r('Quantity',pi.quantity)+_r('Price 1',pi.price_1?F(pi.price_1):null)+_r('Price 2',pi.price_2?F(pi.price_2):null)+_r('Cost Price',pi.part_cost_price?F(pi.part_cost_price):null)+_r('Brand',pi.part_brand_name)+_r('Condition',pi.condition_name||pi.condition)+_r('State',pi.part_state_name||pi.part_state)+_r('Tax',pi.vat_included?'Yes':'No'));
    h+=_S('Vehicle','bi-truck',_r('Type',pi.vehicle_type_name)+_r('Year',pi.vehicle_year_name)+_r('Make',pi.vehicle_make_name)+_r('Model',pi.vehicle_model_name)+_r('Variant',pi.vehicle_variant_name)+_r('Engine',pi.vehicle_engine_name)+_r('Fuel',pi.vehicle_fuel_name)+_r('Motorization',pi.motorization)+_r('CC',pi.cc)+_r('CV',pi.cv)+_r('KW',pi.kw));
    var dimItems=_r('Weight',pi.weight_kg?pi.weight_kg+' kg':null)+_r('Width',pi.width_cm?pi.width_cm+' cm':null)+_r('Height',pi.height_cm?pi.height_cm+' cm':null)+_r('Length',pi.length_cm?pi.length_cm+' cm':null)+_r('Custom Size',pi.custom_size?'Yes':'No')+_r('Print Label',pi.print_label?'Yes':'No');
    if(pi.rating) dimItems+='<div class="is-item"><span class="is-lbl">Rating</span><span class="is-val">'+stars(pi.rating)+' <span style="font-size:11px;color:var(--muted);margin-left:4px;">'+pi.rating+'/5</span></span></div>';
    h+=_S('Dimensions & Options','bi-rulers',dimItems);
    if(pi.notes||pi.extra_notes||pi.internal_notes){
        var noteH='';
        if(pi.notes)noteH+='<div class="is-item" style="grid-column:1/-1;"><span class="is-lbl">Notes</span><span class="is-val" style="text-align:left;font-size:13px;font-weight:500;line-height:1.5;">'+esc(pi.notes)+'</span></div>';
        if(pi.extra_notes)noteH+='<div class="is-item" style="grid-column:1/-1;"><span class="is-lbl">Extra Notes</span><span class="is-val" style="text-align:left;font-size:13px;font-weight:500;line-height:1.5;">'+esc(pi.extra_notes)+'</span></div>';
        if(pi.internal_notes)noteH+='<div class="is-item" style="grid-column:1/-1;"><span class="is-lbl">Internal Notes</span><span class="is-val" style="text-align:left;font-size:13px;font-weight:500;line-height:1.5;">'+esc(pi.internal_notes)+'</span></div>';
        h+=_S('Notes','bi-journal-text',noteH);
    }
    h+='</div>';

    // References
    h+='<div class="ip-pane" id="ipRefs">';
    if(refs.length){h+='<div class="is"><div class="is-hdr"><i class="bi bi-link-45deg"></i>References</div><div style="overflow-x:auto;"><table class="is-tbl"><thead><tr><th>#</th><th>Code</th><th>Type</th><th>Brand</th><th>Manufacturer</th><th>Condition</th></tr></thead><tbody>';refs.forEach(function(r,i){h+='<tr><td>'+(i+1)+'</td><td style="font-weight:600;">'+esc(r.reference_code||'\u2014')+'</td><td>'+esc(REF_TYPE[r.reference_type]||r.reference_type||'\u2014')+'</td><td>'+esc(r.brand||'\u2014')+'</td><td>'+esc(r.manufacturer||'\u2014')+'</td><td>'+esc(REF_COND[r.condition]||r.condition||'\u2014')+'</td></tr>';});h+='</tbody></table></div></div>';}
    else h+='<div style="text-align:center;padding:32px;color:var(--muted);"><i class="bi bi-link-45deg" style="font-size:28px;opacity:.2;display:block;margin-bottom:6px;"></i>No references</div>';
    h+='</div>';

    // Damages
    h+='<div class="ip-pane" id="ipDmgs">';
    if(dmgs.length){h+='<div class="is"><div class="is-hdr"><i class="bi bi-exclamation-triangle"></i>Damages</div><div style="overflow-x:auto;"><table class="is-tbl"><thead><tr><th>#</th><th>Description</th><th>Type</th><th>Location</th><th>Rating</th></tr></thead><tbody>';dmgs.forEach(function(d,i){h+='<tr><td>'+(i+1)+'</td><td>'+esc(d.damage_description||'\u2014')+'</td><td>'+esc(DMG_TYPE[d.damage_type]||'\u2014')+'</td><td>'+esc(DMG_LOC[d.damage_location]||'\u2014')+'</td><td>'+(d.damage_rating?stars(d.damage_rating):'\u2014')+'</td></tr>';});h+='</tbody></table></div></div>';}
    else h+='<div style="text-align:center;padding:32px;color:var(--muted);"><i class="bi bi-exclamation-triangle" style="font-size:28px;opacity:.2;display:block;margin-bottom:6px;"></i>No damages</div>';
    h+='</div>';

    // Attributes
    h+='<div class="ip-pane" id="ipAttrs">';
    if(attrs.length) h+=_S('Attributes','bi-list-check',attrs.map(function(a){return _r(a.label_name||('Attr #'+a.attribute_id),a.value);}).join(''));
    else h+='<div style="text-align:center;padding:32px;color:var(--muted);"><i class="bi bi-list-check" style="font-size:28px;opacity:.2;display:block;margin-bottom:6px;"></i>No attributes</div>';
    h+='</div>';

    // Locations
    h+='<div class="ip-pane" id="ipLocs">';
    if(locs.length){h+='<div class="is"><div class="is-hdr"><i class="bi bi-geo-alt"></i>Locations</div><div style="overflow-x:auto;"><table class="is-tbl"><thead><tr><th>Unit</th><th>Warehouse</th><th>Zone</th><th>Shelf</th><th>Rack</th><th>Bin</th><th>Code</th><th>Notes</th></tr></thead><tbody>';locs.forEach(function(l){h+='<tr><td style="font-weight:700;">#'+l.unit_number+'</td><td>'+esc(l.warehouse_name||'\u2014')+'</td><td>'+esc(l.warehouse_zone_name||'\u2014')+'</td><td>'+esc(l.warehouse_shelf_name||'\u2014')+'</td><td>'+esc(l.warehouse_rack_name||'\u2014')+'</td><td>'+esc(l.warehouse_bin_name||'\u2014')+'</td><td>'+esc(l.location_code||'\u2014')+'</td><td>'+esc(l.notes||'\u2014')+'</td></tr>';});h+='</tbody></table></div></div>';}
    else h+='<div style="text-align:center;padding:32px;color:var(--muted);"><i class="bi bi-geo-alt" style="font-size:28px;opacity:.2;display:block;margin-bottom:6px;"></i>No locations</div>';
    h+='</div>';

    // Media (Images + Videos combined)
    h+='<div class="ip-pane" id="ipMedia">';
    if(imgs.length){h+='<div class="is"><div class="is-hdr"><i class="bi bi-images"></i>Images <span class="ip-cnt" style="margin-left:auto;">'+imgs.length+'</span></div><div class="is-media">';imgs.forEach(function(img){var u=img.display_url||img.image_url||'';h+='<div class="is-media-item" onclick="posLightbox(\'image\',\''+esc(u)+'\')"><img src="'+esc(u)+'" alt=""/></div>';});h+='</div></div>';}
    if(vids.length){h+='<div class="is"><div class="is-hdr"><i class="bi bi-camera-video"></i>Videos <span class="ip-cnt" style="margin-left:auto;">'+vids.length+'</span></div><div class="is-media" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));">';vids.forEach(function(v){var u=v.display_url||v.video_url||'';h+='<div class="is-media-item" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:#111;" onclick="posLightbox(\'video\',\''+esc(u)+'\')"><i class="bi bi-play-circle-fill" style="font-size:24px;color:rgba(255,255,255,.8);z-index:1;"></i></div>';});h+='</div></div>';}
    if(!imgs.length&&!vids.length) h+='<div style="text-align:center;padding:32px;color:var(--muted);"><i class="bi bi-images" style="font-size:28px;opacity:.2;display:block;margin-bottom:6px;"></i>No media</div>';
    h+='</div>';

    // Sub Parts
    h+='<div class="ip-pane" id="ipSubs">';
    if(subs.length){h+='<div class="is"><div class="is-hdr"><i class="bi bi-diagram-3"></i>Sub Parts</div><div style="overflow-x:auto;"><table class="is-tbl"><thead><tr><th>Part</th><th>Code</th><th>Qty</th></tr></thead><tbody>';subs.forEach(function(s){h+='<tr><td style="font-weight:600;">'+esc(s.display_name||'\u2014')+'</td><td>'+esc(s.part_code||'\u2014')+'</td><td>'+(s.quantity||0)+'</td></tr>';});h+='</tbody></table></div></div>';}
    else h+='<div style="text-align:center;padding:32px;color:var(--muted);"><i class="bi bi-diagram-3" style="font-size:28px;opacity:.2;display:block;margin-bottom:6px;"></i>No sub parts</div>';
    h+='</div>';

    $('#infoBody').html(h);
    $('#infoPage').addClass('open');
}
function ipTabClick(el){$('.ip-tab').removeClass('active');$(el).addClass('active');$('.ip-pane').removeClass('active').hide();$('#'+$(el).data('t')).addClass('active').show();}

/* ══════════════════════════════════════════
   VEHICLES
   ══════════════════════════════════════════ */
function openVehicleParts(uuid,name){
    _vMode=true;_vUuid=uuid;_vName=name;showCart();closePanel();
    $('#vTitle').text(name);$('#vBackBar').addClass('show');$('#posHeader').hide();$('.pos-cats').hide();
    var $g=$('#prodGrid');$g.attr('class','pos-grid g-parts');
    $g.html('<div style="grid-column:1/-1;text-align:center;padding:48px;"><div class="spinner-border spinner-border-sm" style="color:var(--primary);"></div></div>');
    $.get(BASE_URL+'/sales/vehicle/'+uuid+'/parts',function(r){
        var parts=(r&&r.status===200&&r.data)?r.data.parts||r.data:[];if(!Array.isArray(parts))parts=[];_vParts=parts;
        if(!parts.length){$g.html('<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted);font-size:12px;">No parts for this vehicle</div>');return;}
        var h='';parts.forEach(function(p){h+=partCard(p);});$g.html(h);
    });
}
function closeVehicleParts(){_vMode=false;_vParts=[];$('#vBackBar').removeClass('show');$('#posHeader').show();$('.pos-cats').show();$('#vPartSearch').val('');_advFilters={};$('#advCount').hide();loadProducts();}
function loadVehiclePartsFiltered(){
    var $g=$('#prodGrid');
    $g.html('<div style="grid-column:1/-1;text-align:center;padding:48px;"><div class="spinner-border spinner-border-sm" style="color:var(--primary);"></div></div>');
    var params=$.extend({search:$('#vPartSearch').val()||''},_advFilters||{});
    $.get(BASE_URL+'/sales/vehicle/'+_vUuid+'/parts',params,function(r){
        var parts=(r&&r.status===200&&r.data)?r.data.parts||r.data:[];if(!Array.isArray(parts))parts=[];
        _vParts=parts;
        if(!parts.length){$g.html('<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted);font-size:12px;">No matching parts</div>');return;}
        var h='';parts.forEach(function(p){h+=partCard(p);});$g.html(h);
    });
}
function filterVehicleParts(q){
    if(!_vParts.length)return;
    q=(q||'').toLowerCase().trim();
    var filtered=q?_vParts.filter(function(p){
        return (p.display_name||'').toLowerCase().indexOf(q)!==-1
            ||(p.part_code||'').toLowerCase().indexOf(q)!==-1
            ||(p.part_internal_id||'').toLowerCase().indexOf(q)!==-1
            ||(p.catalog_name||'').toLowerCase().indexOf(q)!==-1
            ||(p.warehouse_name||'').toLowerCase().indexOf(q)!==-1;
    }):_vParts;
    var $g=$('#prodGrid');
    if(!filtered.length){$g.html('<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted);font-size:12px;">No matching parts</div>');return;}
    var h='';filtered.forEach(function(p){h+=partCard(p);});$g.html(h);
}
function addAllVehicleParts(){
    if(!_vParts.length)return;
    // For each part, load its detail to get all units, then add each unit
    var totalAdded=0,loaded=0,toLoad=_vParts.filter(function(p){return parseInt(p.quantity)>0;});
    if(!toLoad.length)return;
    toLoad.forEach(function(p){
        $.get(BASE_URL+'/sales/part-detail/'+p.uuid,function(res){
            loaded++;
            if(res&&res.status===200&&res.data){
                var locs=res.data.locations||[];
                locs.forEach(function(l){
                    var already=_cart.some(function(c){return c.item_type==='part'&&String(c.id)===String(p.id)&&c.unit_number===l.unit_number;});
                    if(!already){
                        addToCart('part',p.id,p.display_name,p.display_price,1,p.part_code||'',l.warehouse_id||0,l.unit_number,res.data.vat_included);
                        totalAdded++;
                    }
                });
            }
            if(loaded>=toLoad.length) renderCart();
        });
    });
}

/* ══════════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════════ */
function updatePg(total){
    var last=Math.ceil(total/_pp)||1;if(_page>last)_page=last;
    $('#pgInfo').text(_page+' / '+last);
    $('#pgPrev').prop('disabled',_page<=1);$('#pgNext').prop('disabled',_page>=last);
}

/* ══════════════════════════════════════════
   CART
   ══════════════════════════════════════════ */
function addToCart(type,id,name,price,mq,code,wh,unit,vatIncluded){
    if(_cart.some(function(c){return c.item_type===type&&String(c.id)===String(id)&&c.unit_number===unit;}))return;
    _cart.push({item_type:type,id:id,item_name:name,item_code:code,unit_price:parseFloat(price),quantity:1,max_qty:1,total_price:parseFloat(price),discount_amount:0,warehouse_id:wh||null,part_inventory_id:type==='part'?id:null,vehicle_inventory_id:type==='vehicle'?id:null,unit_number:unit||null,vat_included:!!vatIncluded});
    renderCart();
}
function removeFromCart(i){_cart.splice(i,1);renderCart();}
function renderCart(){
    var $i=$('#cItems'),$c=$('#cCnt'),$m=$('#mobCartCnt');
    if(!_cart.length){$i.html('<div class="ci-empty"><i class="bi bi-receipt"></i><p>No items yet</p></div>');updTotals(0);$c.text('0');$m.text('0');return;}
    var h='',sub=0;
    // Group cart items by part name+id
    var groups={},order=[];
    _cart.forEach(function(it,i){
        sub+=it.total_price;
        var key=it.item_type+'_'+it.id;
        if(!groups[key]){groups[key]={name:it.item_name,code:it.item_code,type:it.item_type,id:it.id,units:[],total:0,price:it.unit_price};order.push(key);}
        groups[key].units.push({idx:i,unit:it.unit_number,price:it.total_price});
        groups[key].total+=it.total_price;
    });
    order.forEach(function(key){
        var g=groups[key];
        var ico=g.type==='vehicle'?'bi-truck-front':'bi-gear-wide-connected';
        var unitCnt=g.units.length;
        // Check if this group has VAT included (no tax)
        var isVatFree=g.units.length>0&&_cart[g.units[0].idx]&&_cart[g.units[0].idx].vat_included;
        var borderColor=isVatFree?'var(--green)':'var(--primary)';
        // Group header (clickable to expand)
        h+='<div class="ci-group" onclick="$(this).next().toggle();$(this).find(\'.ci-arrow i\').toggleClass(\'bi-chevron-down bi-chevron-up\');" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card);border-radius:var(--rs);border-left:3px solid '+borderColor+';margin-bottom:2px;cursor:pointer;">';
        h+='<div class="ci-ico"><i class="bi '+ico+'"></i></div>';
        h+='<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(g.name)+'</div>';
        h+='<div style="font-size:10px;color:var(--muted);">'+esc(g.code)+' \u00B7 '+F(g.price)+' ea</div></div>';
        h+='<span style="background:'+borderColor+';color:#fff;border-radius:50%;min-width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">'+unitCnt+'</span>';
        if(isVatFree)h+='<span style="font-size:8px;color:var(--green);font-weight:700;white-space:nowrap;">Tax Inc</span>';
        h+='<div style="font-size:13px;font-weight:700;color:var(--primary);min-width:50px;text-align:right;">'+F(g.total)+'</div>';
        h+='<span class="ci-arrow"><i class="bi bi-chevron-down" style="font-size:12px;color:var(--muted);"></i></span>';
        h+='</div>';
        // Unit rows (collapsed by default if >1 unit)
        h+='<div style="margin-bottom:6px;margin-left:16px;'+(unitCnt>1?'display:none;':'')+'">';
        g.units.forEach(function(u){
            h+='<div class="ci-wrap" data-idx="'+u.idx+'">';
            h+='<div class="ci" style="border-left:2px solid var(--border);margin-left:4px;padding:6px 10px;">';
            h+='<span style="font-size:11px;color:var(--primary);font-weight:700;min-width:36px;">#'+u.unit+'</span>';
            h+='<span style="flex:1;font-size:11px;color:var(--muted);">Unit</span>';
            h+='<span style="font-size:11px;font-weight:600;">'+F(u.price)+'</span>';
            h+='<button class="ci-del-btn" onclick="event.stopPropagation();removeFromCart('+u.idx+')" style="width:24px;height:24px;font-size:11px;"><i class="bi bi-trash3"></i></button>';
            h+='</div>';
            h+='<div class="ci-del-bg" onclick="removeFromCart('+u.idx+')"><i class="bi bi-trash3"></i> Delete</div>';
            h+='</div>';
        });
        h+='</div>';
    });
    $i.html(h);$c.text(_cart.length);$m.text(_cart.length);updTotals(sub);
}
function updTotals(sub){
    // Calculate tax — only on items without vat_included
    var taxableAmount=0,taxFreeCount=0,taxCount=0;
    _cart.forEach(function(c){
        if(c.vat_included){taxFreeCount++;}
        else{taxableAmount+=c.total_price;taxCount++;}
    });
    var taxBreakdown=[],taxTotal=0;
    if(_taxes.length&&taxableAmount>0){
        _taxes.forEach(function(t){
            var pct=parseFloat(t.percentage)||0;
            if(pct<=0)return;
            var amt=parseFloat((taxableAmount*pct/100).toFixed(2));
            taxBreakdown.push({name:t.tax_name,pct:pct,amount:amt});
            taxTotal+=amt;
        });
    }
    var total=sub+taxTotal;
    $('#cSub').text(F(sub));
    // Build tax section
    var $taxArea=$('#cTaxArea');
    if(!$taxArea.length){
        $('#cSub').closest('.cf-row').after('<div id="cTaxArea"></div>');
        $taxArea=$('#cTaxArea');
    }
    var th='';
    if(taxBreakdown.length){
        th+='<div style="padding:4px 0;border-top:1px dashed var(--border);margin-top:4px;">';
        th+='<div style="display:flex;justify-content:space-between;font-size:11px;color:#8b5cf6;font-weight:600;padding:2px 0;"><span><i class="bi bi-receipt-cutoff" style="margin-right:4px;"></i>Tax ('+taxCount+' items)</span><span>'+F(taxTotal)+'</span></div>';
        taxBreakdown.forEach(function(t){
            th+='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);padding:1px 0 1px 16px;"><span>'+esc(t.name)+' ('+t.pct+'%)</span><span>'+F(t.amount)+'</span></div>';
        });
        if(taxFreeCount)th+='<div style="font-size:9px;color:var(--green);padding:2px 0;"><i class="bi bi-check-circle" style="margin-right:3px;"></i>'+taxFreeCount+' item'+(taxFreeCount>1?'s':'')+' Tax included</div>';
        th+='</div>';
    }
    $taxArea.html(th);
    $('#cTotal').text(F(total));$('#cPayAmt').text(F(total));$('#payBtn').prop('disabled',total<=0);
}

/* ══════════════════════════════════════════
   CHECKOUT
   ══════════════════════════════════════════ */
var _coData={sub:0,discount:0,taxable:0,taxes:[],taxTotal:0,total:0};

function openCheckout(){
    if(!_cart.length)return;
    var sub=0;
    _cart.forEach(function(c){sub+=c.total_price;});
    // Group for summary
    var groups={};
    _cart.forEach(function(c){var k=c.item_type+'_'+c.id;if(!groups[k])groups[k]={name:c.item_name,code:c.item_code,cnt:0,total:0,vat:c.vat_included};groups[k].cnt++;groups[k].total+=c.total_price;});
    var itemsH='';
    Object.values(groups).forEach(function(g){
        itemsH+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;">';
        itemsH+='<div style="flex:1;min-width:0;"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(g.name)+'</div>';
        itemsH+='<div style="font-size:10px;color:var(--muted);">'+esc(g.code);
        if(g.vat)itemsH+=' <span style="color:var(--green);">Tax Inc</span>';
        itemsH+='</div></div>';
        itemsH+='<span style="color:var(--primary);font-weight:700;margin:0 8px;">x'+g.cnt+'</span>';
        itemsH+='<span style="font-weight:700;min-width:60px;text-align:right;">'+F(g.total)+'</span></div>';
    });
    $('#coSummary').html(itemsH);
    $('#coItemCount').text(_cart.length+' item'+(_cart.length>1?'s':''));
    _coData.sub=sub;
    // Reset payment UI
    $('.co-pay-btn').removeClass('active').first().addClass('active');
    $('#cardTypeBox,#refBox').hide();
    $('#payRef').val('');
    calcCheckout();
    $('#coPage').addClass('open');
}

function calcCheckout(){
    var sub=_coData.sub;
    var dType=$('#dType').val(),dVal=parseFloat($('#dVal').val())||0;
    var discount=0;
    if(dType==='percent'&&dVal>0)discount=parseFloat((sub*dVal/100).toFixed(2));
    else if(dType==='fixed'&&dVal>0)discount=Math.min(dVal,sub);
    var afterDiscount=sub-discount;

    var taxableAmount=0;
    _cart.forEach(function(c){if(!c.vat_included)taxableAmount+=c.total_price;});
    var taxableAfterDiscount=taxableAmount>0?Math.max(0,taxableAmount-(taxableAmount/sub*discount)):0;

    var taxes=[],taxTotal=0;
    _taxes.forEach(function(t){
        var pct=parseFloat(t.percentage)||0;if(pct<=0)return;
        var amt=parseFloat((taxableAfterDiscount*pct/100).toFixed(2));
        taxes.push({name:t.tax_name,pct:pct,amount:amt});
        taxTotal+=amt;
    });

    var total=parseFloat((afterDiscount+taxTotal).toFixed(2));
    _coData={sub:sub,discount:discount,taxable:taxableAfterDiscount,taxes:taxes,taxTotal:taxTotal,total:total};

    // Render totals in left panel
    var h='';
    h+='<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;"><span class="text-muted">Subtotal</span><span style="font-weight:600;">'+F(sub)+'</span></div>';
    if(discount>0)h+='<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:var(--accent);"><span><i class="bi bi-tag me-1"></i>Discount'+(dType==='percent'?' ('+dVal+'%)':'')+'</span><span style="font-weight:600;">-'+F(discount)+'</span></div>';
    if(taxes.length){
        taxes.forEach(function(t){
            h+='<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;color:#8b5cf6;"><span>'+esc(t.name)+' ('+t.pct+'%)</span><span style="font-weight:600;">'+F(t.amount)+'</span></div>';
        });
    }
    h+='<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:16px;font-weight:800;border-top:2px solid var(--primary);margin-top:6px;"><span>Total</span><span style="color:var(--primary);">'+F(total)+'</span></div>';
    $('#coTotals').html(h);

    // Update right panel total display
    $('#coGrandTotal').text(F(total));
    $('#coPayTotal').text(F(total));

    // Auto-fill amount received with total
    $('#amtRcv').val(F(total));

    // Build quick amount buttons
    var qh='<button class="exact" onclick="$(\'#amtRcv\').val(\''+F(total)+'\');calcChange();">Exact '+F(total)+'</button>';
    // Round up amounts
    var rounds=[50,100,200,500,1000,2000,5000];
    var shown=0;
    rounds.forEach(function(r){
        if(r>=total&&shown<4){
            qh+='<button onclick="$(\'#amtRcv\').val(\''+r+'\');calcChange();">'+r+'</button>';
            shown++;
        }
    });
    $('#quickAmounts').html(qh);

    calcChange();
}

function selPay(el){
    $('.co-pay-btn').removeClass('active');$(el).addClass('active');
    var method=$(el).data('method');
    $('#cardTypeBox').toggle(method==='card');
    $('#refBox').toggle(method==='card' || method==='upi');
    $('#onlineHint').toggle(method==='online');
    $('#linkBox').toggle(method==='link');
    // For non-cash offline modes, amount = exact total (no change)
    if(method==='card'||method==='upi'||method==='online'||method==='link'){
        $('#amtRcv').val(F(_coData.total));
        calcChange();
    }
    // Update footer button label for clarity
    var btnLabel = 'Complete Payment';
    if(method==='online') btnLabel = 'Pay Online';
    else if(method==='link') btnLabel = 'Send Payment Link';
    $('#coComplete').html('<i class="bi bi-check-circle me-1"></i>'+btnLabel+' <span id="coPayTotal" style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');
}
function selCard(el){$('.co-card-btn').removeClass('active');$(el).addClass('active');}

function calcChange(){
    var r=parseFloat($('#amtRcv').val())||0,t=_coData.total,c=r-t;
    var $d=$('#changeDisp');
    if(r<=0){$d.hide();return;}
    $d.show().removeClass('change-pos change-neg');
    if(c>=0){
        $d.addClass('change-pos').html('<i class="bi bi-arrow-return-left me-1"></i>Change: <strong>'+F(c)+'</strong>');
    } else {
        $d.addClass('change-neg').html('<i class="bi bi-exclamation-triangle me-1"></i>Short: <strong>'+F(Math.abs(c))+'</strong>');
    }
}
function doCheckout(autoPrint){
    if(!_cart.length)return;
    var payMethod=$('.co-pay-btn.active').data('method')||'cash';
    // Online gateway and pay-by-link branch off here — they don't use the offline flow
    if(payMethod==='online'){ return doOnlinePayment(); }
    if(payMethod==='link'){ return doPaymentLink(); }

    var rcvAmt=parseFloat($('#amtRcv').val())||0;
    if(rcvAmt<_coData.total){toastr.warning('Amount received ('+F(rcvAmt)+') is less than total ('+F(_coData.total)+'). Please collect full amount.');return;}
    var $b = autoPrint ? $('#coPrint') : $('#coComplete');
    $b.prop('disabled', true).html('<i class="bi bi-hourglass-split"></i> Processing...');
    var items=_cart.map(function(c){return{item_type:c.item_type,part_inventory_id:c.part_inventory_id,vehicle_inventory_id:c.vehicle_inventory_id,warehouse_id:c.warehouse_id,item_name:c.item_name,item_code:c.item_code,quantity:c.quantity,unit_price:c.unit_price,discount_amount:c.discount_amount,unit_number:c.unit_number||null};});
    var cardType=payMethod==='card'?($('.co-card-btn.active').data('card')||''):'';
    var payRef=$('#payRef').val()||null;
    if(cardType&&payRef)payRef=cardType.toUpperCase()+' - '+payRef;
    else if(cardType&&!payRef)payRef=cardType.toUpperCase();
    $.ajax({url:BASE_URL+'/sales/checkout',type:'POST',contentType:'application/json',
        data:JSON.stringify({items:items,customer_id:$('#custId').val()||null,discount_type:$('#dType').val()||null,discount_value:$('#dVal').val()||0,payment_method:payMethod,payment_reference:payRef,amount_paid:parseFloat($('#amtRcv').val())||0,notes:$('#oNotes').val()||null}),
        success:function(r){
            // Reset both footer buttons regardless of which path triggered Save.
            $('#coComplete').prop('disabled',false).html('<i class="bi bi-check-circle me-1"></i>Complete Payment <span id="coPayTotal" style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');
            $('#coPrint').prop('disabled',false).html('<i class="bi bi-printer me-1"></i>Print');
            if(r.status===201||r.status===200){
                $('#coPage').removeClass('open');
                $('#successInfo').html('Order <strong>'+esc(r.data.order_number)+'</strong> \u2014 '+F(r.data.total_amount));
                $('#successOv').css('display','flex');
                window._smsLastOrder = { uuid: r.data.uuid || r.data.order_uuid, number: r.data.order_number };
                // \u2605 Save & Print path: silent-print to the printer assigned to
                //   the "receipt" role in /sales/printer-settings. Falls back
                //   to opening the receipt-preview page in a new tab if no
                //   printer has been wired up yet.
                if (autoPrint && window._smsLastOrder && window._smsLastOrder.uuid) {
                    autoPrintReceipt(window._smsLastOrder.uuid);
                }
                _cart=[];renderCart();
                $('#custId,#custSearch,#dType,#dVal,#payRef,#oNotes').val('');$('#custResult').html('Walk-in customer');
            } else if(r.status===409&&r.data&&r.data.stock_errors){
                // Stock errors — either out-of-stock or held by another cashier
                var errors=r.data.stock_errors;
                var names=errors.map(function(e){
                    var label = '';
                    // Find cart item for readable name
                    var match = _cart.find(function(c){
                        return (String(c.part_inventory_id)===String(e.id)||String(c.vehicle_inventory_id)===String(e.id))
                            && (e.unit==null || c.unit_number===e.unit);
                    });
                    label = (match && match.item_name) || ('Item '+e.id);
                    return label + (e.unit?' #'+e.unit:'') + ' ('+e.error+')';
                });
                posConfirm(r.message || ('Some items are no longer available:\\n\\n'+names.join('\\n')+'\\n\\nRemove them and recalculate?'), function(){
                    errors.forEach(function(e){
                        for(var i=_cart.length-1;i>=0;i--){
                            var c = _cart[i];
                            var idMatch = String(c.part_inventory_id)===String(e.id) || String(c.vehicle_inventory_id)===String(e.id);
                            var unitMatch = e.unit==null || c.unit_number===e.unit;
                            if(idMatch && unitMatch) _cart.splice(i,1);
                        }
                    });
                    renderCart();$('#coPage').removeClass('open');
                    toastr.info('Unavailable items removed. Please review cart.');
                });
            } else toastr.error(r.message||'Failed.');
        },
        error:function(){$b.prop('disabled',false).html('<i class="bi bi-check-circle me-1"></i>Complete Payment <span id="coPayTotal" style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');toastr.error('Failed.');}});
}

/* ══════════════════════════════════════════
   ONLINE PAYMENT (Razorpay / Stripe)
   ══════════════════════════════════════════ */
var _currentTx=null;

function _cartItemsForPayment(){
    return _cart.map(function(c){return{
        item_type:c.item_type, part_inventory_id:c.part_inventory_id, vehicle_inventory_id:c.vehicle_inventory_id,
        warehouse_id:c.warehouse_id, item_name:c.item_name, item_code:c.item_code,
        quantity:c.quantity, unit_price:c.unit_price, discount_amount:c.discount_amount,
        unit_number:c.unit_number||null, vat_included:!!c.vat_included,
    };});
}

function doOnlinePayment(){
    var $b=$('#coComplete');$b.prop('disabled',true).html('<span class="spinner-border spinner-border-sm me-1"></span>Initialising...');
    var body = {
        items: _cartItemsForPayment(),
        customer_id: $('#custId').val()||null,
        discount_type: $('#dType').val()||null,
        discount_value: $('#dVal').val()||0,
    };
    $.ajax({url:BASE_URL+'/sales/payment/init', type:'POST', contentType:'application/json', data: JSON.stringify(body),
        success: function(r){
            if(r.status===409 && r.data && r.data.stock_errors){
                _handleStockConflict(r);
                $b.prop('disabled',false).html('<i class="bi bi-check-circle me-1"></i>Pay Online <span style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');
                return;
            }
            if(r.status!==200 || !r.data){ toastr.error(r.message||'Gateway init failed'); $b.prop('disabled',false).html('<i class="bi bi-check-circle me-1"></i>Pay Online <span style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>'); return; }
            _currentTx = r.data;
            if(r.data.gateway==='razorpay') _openRazorpayCheckout(r.data);
            else if(r.data.gateway==='stripe') _openStripeCheckout(r.data);
            else { toastr.error('Unknown gateway: '+r.data.gateway); $b.prop('disabled',false); }
        },
        error: function(xhr){
            $b.prop('disabled',false).html('<i class="bi bi-check-circle me-1"></i>Pay Online <span style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');
            var msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to initialise payment';
            toastr.error(msg);
        }
    });
}

function _openRazorpayCheckout(tx){
    if(typeof Razorpay==='undefined'){ toastr.error('Razorpay library not loaded.'); return; }
    var rzp = new Razorpay({
        key: tx.public_key,
        order_id: tx.gateway_order_id,
        amount: Math.round(tx.amount*100),
        currency: tx.currency,
        name: 'Sales',
        description: 'Order payment',
        handler: function(resp){
            // Verify on server
            $.ajax({url:BASE_URL+'/sales/payment/verify', type:'POST', contentType:'application/json',
                data: JSON.stringify({
                    tx_uuid: tx.tx_uuid, gateway: 'razorpay',
                    razorpay_order_id: resp.razorpay_order_id,
                    razorpay_payment_id: resp.razorpay_payment_id,
                    razorpay_signature: resp.razorpay_signature,
                }),
                success: function(vr){
                    if(vr.status===200 && vr.data && vr.data.order_uuid){
                        _onPaymentSuccess(vr.data);
                    } else {
                        toastr.error(vr.message||'Payment could not be verified');
                        _resetCheckoutBtn();
                    }
                },
                error: function(){ toastr.error('Verification failed'); _resetCheckoutBtn(); }
            });
        },
        modal: {
            ondismiss: function(){
                // User closed without paying — release holds
                $.post(BASE_URL+'/sales/payment/cancel', { tx_uuid: tx.tx_uuid });
                toastr.info('Payment cancelled — stock released.');
                _resetCheckoutBtn();
            }
        }
    });
    rzp.open();
}

function _openStripeCheckout(tx){
    if(typeof Stripe==='undefined'){ toastr.error('Stripe library not loaded.'); return; }
    // For Stripe we use Payment Intent with a redirect to the gateway-hosted page.
    // Simpler: just call confirmCardPayment with Elements — but that requires Elements setup.
    // Cleanest for POS context: use the Checkout Session URL if link flow, or Payment Intent here.
    // If init returned client_secret, confirm via Stripe.js; otherwise redirect to session URL.
    if(tx.client_secret){
        var stripe = Stripe(tx.public_key);
        // Browser opens stripe-hosted confirm dialog — simplest path for now:
        stripe.confirmPayment({ clientSecret: tx.client_secret, confirmParams: { return_url: window.location.href + '?tx=' + encodeURIComponent(tx.tx_uuid) } })
            .then(function(result){
                if(result.error){
                    toastr.error(result.error.message||'Stripe error');
                    $.post(BASE_URL+'/sales/payment/cancel', { tx_uuid: tx.tx_uuid });
                    _resetCheckoutBtn();
                } else {
                    // success — verify on server
                    $.ajax({url:BASE_URL+'/sales/payment/verify', type:'POST', contentType:'application/json',
                        data: JSON.stringify({ tx_uuid: tx.tx_uuid, gateway: 'stripe', stripe_payment_intent_id: tx.gateway_order_id }),
                        success: function(vr){ if(vr.status===200 && vr.data && vr.data.order_uuid) _onPaymentSuccess(vr.data); else { toastr.error(vr.message||'Verify failed'); _resetCheckoutBtn(); } },
                        error: function(){ toastr.error('Verify failed'); _resetCheckoutBtn(); }
                    });
                }
            });
    } else {
        toastr.error('Stripe: missing client secret.');
        _resetCheckoutBtn();
    }
}

function doPaymentLink(){
    var $b=$('#coComplete');$b.prop('disabled',true).html('<span class="spinner-border spinner-border-sm me-1"></span>Creating link...');
    var body = {
        items: _cartItemsForPayment(),
        customer_id: $('#custId').val()||null,
        discount_type: $('#dType').val()||null,
        discount_value: $('#dVal').val()||0,
        notify_sms: $('#linkNotifySms').is(':checked'),
        notify_email: $('#linkNotifyEmail').is(':checked'),
    };
    $.ajax({url:BASE_URL+'/sales/payment/link', type:'POST', contentType:'application/json', data: JSON.stringify(body),
        success: function(r){
            $b.prop('disabled',false).html('<i class="bi bi-link-45deg me-1"></i>Send Payment Link <span style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');
            if(r.status===409 && r.data && r.data.stock_errors){ _handleStockConflict(r); return; }
            if(r.status!==200 || !r.data){ toastr.error(r.message||'Failed to create link'); return; }
            _currentTx = r.data;
            // Show link in a toast with copy-to-clipboard
            var url = r.data.link_url || '';
            toastr.success('Payment link created — waiting for customer to pay.');
            window.prompt('Copy this link and send to customer:', url);
            // Poll for success
            _pollPaymentStatus(r.data.tx_uuid);
        },
        error: function(xhr){
            $b.prop('disabled',false).html('<i class="bi bi-link-45deg me-1"></i>Send Payment Link <span style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');
            var msg = (xhr.responseJSON && xhr.responseJSON.message) || 'Failed to create link';
            toastr.error(msg);
        }
    });
}

function _pollPaymentStatus(txUuid){
    if(!txUuid) return;
    var tries = 0, max = 60; // 60 * 5s = 5 min (matches hold TTL)
    var timer = setInterval(function(){
        tries++;
        if(tries>max){ clearInterval(timer); toastr.warning('Payment link expired.'); return; }
        $.get(BASE_URL+'/sales/payment/status/'+txUuid, function(r){
            if(r.status!==200 || !r.data) return;
            if(r.data.status==='paid' && r.data.order_uuid){
                clearInterval(timer);
                _onPaymentSuccess({ order_uuid: r.data.order_uuid, order_number: r.data.order_number, total_amount: r.data.amount });
            } else if(r.data.status==='failed' || r.data.status==='cancelled'){
                clearInterval(timer);
                toastr.error('Payment '+r.data.status);
            }
        });
    }, 5000);
}

// Holds the most-recently-completed order so the success-overlay print
// buttons know which receipt to render.
window._smsLastOrder = null;

function _onPaymentSuccess(d){
    $('#coPage').removeClass('open');
    $('#successInfo').html('Order <strong>'+esc(d.order_number||'')+'</strong> — '+F(d.total_amount||_coData.total));
    $('#successOv').css('display','flex');
    window._smsLastOrder = { uuid: d.order_uuid || d.uuid, number: d.order_number || '' };
    _cart=[]; renderCart();
    $('#custId,#custSearch,#dType,#dVal,#payRef,#oNotes').val('');$('#custResult').html('Walk-in customer');
    _currentTx = null;
}

function _resetCheckoutBtn(){
    var m = $('.co-pay-btn.active').data('method')||'cash';
    var label = m==='online'?'Pay Online':(m==='link'?'Send Payment Link':'Complete Payment');
    $('#coComplete').prop('disabled',false).html('<i class="bi bi-check-circle me-1"></i>'+label+' <span style="margin-left:6px;opacity:.8;">'+F(_coData.total)+'</span>');
}

function _handleStockConflict(r){
    var errors = r.data.stock_errors || [];
    var names = errors.map(function(e){
        var match = _cart.find(function(c){return (String(c.part_inventory_id)===String(e.id)||String(c.vehicle_inventory_id)===String(e.id)) && (e.unit==null || c.unit_number===e.unit);});
        return ((match&&match.item_name)||('Item '+e.id)) + (e.unit?' #'+e.unit:'') + ' ('+e.error+')';
    });
    posConfirm(r.message || ('Items unavailable:\n'+names.join('\n')+'\nRemove and retry?'), function(){
        errors.forEach(function(e){
            for(var i=_cart.length-1;i>=0;i--){
                var c=_cart[i];
                if((String(c.part_inventory_id)===String(e.id)||String(c.vehicle_inventory_id)===String(e.id)) && (e.unit==null||c.unit_number===e.unit)) _cart.splice(i,1);
            }
        });
        renderCart(); $('#coPage').removeClass('open');
    });
}

/* ══════════════════════════════════════════
   CUSTOMER
   ══════════════════════════════════════════ */
var _cst;
$(document).on('input','#custSearch',function(){clearTimeout(_cst);var q=$(this).val().trim();if(!q){$('#custResult').html('Walk-in customer');$('#custId').val('');return;}
    _cst=setTimeout(function(){$.get(BASE_URL+'/sales/customers/search',{q:q},function(r){if(!r||r.status!==200||!r.data||!r.data.length){$('#custResult').html('<span style="color:var(--yellow);">Not found</span>');return;}var h='';r.data.forEach(function(c){h+='<a href="#" style="display:inline-block;padding:3px 8px;font-size:11px;color:var(--primary);text-decoration:none;border:1px solid var(--border);border-radius:6px;margin:2px;" onclick="selCust('+c.id+',\''+esc(c.name)+'\',\''+esc(c.phone||'')+'\');return false;">'+esc(c.name)+(c.phone?' ('+c.phone+')':'')+'</a>';});$('#custResult').html(h);});},300);});
function selCust(id,n,p){$('#custId').val(id);$('#custSearch').val(n);$('#custResult').html('<i class="bi bi-check-circle" style="color:var(--green);"></i> '+n+(p?' ('+p+')':''));}
function openNewCust(){$('#ncName,#ncPhone,#ncEmail,#ncAddr,#ncGst,#ncPan').val('');$('#ncType').val('regular');$('#newCustOv').css('display','flex');}
function saveNewCust(){
    var data={name:$('#ncName').val(),phone:$('#ncPhone').val(),email:$('#ncEmail').val(),customer_type:$('#ncType').val(),address:$('#ncAddr').val(),gst_number:$('#ncGst').val(),pan_number:$('#ncPan').val()};
    if(!data.name){toastr.warning('Name required.');return;}
    if(!data.phone){toastr.warning('Phone required.');return;}
    $.ajax({url:BASE_URL+'/sales/customers',type:'POST',contentType:'application/json',data:JSON.stringify(data),success:function(r){
        if(r.status===201||r.status===200){
            var c=r.data;$('#newCustOv').hide();
            selCust(c.id||c.uuid,c.name,c.phone);$('#custSearch').val(c.name);
            toastr.success('Customer created.');
        } else toastr.error(r.message||'Failed.');
    }});
}

/* ══════════════════════════════════════════
   LIGHTBOX
   ══════════════════════════════════════════ */
var _lbItems=[],_lbIdx=0,_lbType='';
function posLightbox(t,url){_lbType=t;_lbItems=[];_lbIdx=0;$('.is-media-item').each(function(){var m=($(this).attr('onclick')||'').match(/posLightbox\('(\w+)','([^']+)'\)/);if(m&&m[1]===t){_lbItems.push(m[2]);if(m[2]===url)_lbIdx=_lbItems.length-1;}});if(!_lbItems.length)_lbItems=[url];lbRender();}
function lbRender(){var u=_lbItems[_lbIdx],bs='width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
    $('#posLbTop').html('<span style="color:rgba(255,255,255,.6);font-size:12px;">'+(_lbIdx+1)+'/'+_lbItems.length+'</span><button onclick="event.stopPropagation();lbDl();" style="'+bs+'"><i class="bi bi-download"></i></button><button onclick="$(\'#posLightbox\').hide();" style="'+bs+'background:rgba(239,68,68,.8);"><i class="bi bi-x-lg"></i></button>');
    $('#posLbContent').html(_lbType==='image'?'<img src="'+esc(u)+'" style="max-width:90vw;max-height:80vh;border-radius:8px;object-fit:contain;" onclick="event.stopPropagation();" alt=""/>':'<video src="'+esc(u)+'" controls autoplay style="max-width:90vw;max-height:80vh;border-radius:8px;" onclick="event.stopPropagation();"></video>');
    var nav='';if(_lbItems.length>1){nav+='<button onclick="event.stopPropagation();if(_lbIdx>0){_lbIdx--;lbRender();}" style="'+bs+(_lbIdx<=0?'opacity:.3;':'')+'"><i class="bi bi-chevron-left"></i></button>';nav+='<button onclick="event.stopPropagation();if(_lbIdx<_lbItems.length-1){_lbIdx++;lbRender();}" style="'+bs+(_lbIdx>=_lbItems.length-1?'opacity:.3;':'')+'"><i class="bi bi-chevron-right"></i></button>';}
    $('#posLbNav').html(nav);$('#posLightbox').css('display','flex');}
function lbDl(){var u=_lbItems[_lbIdx];if(!u)return;var a=document.createElement('a');a.href=u;a.download=u.split('/').pop();document.body.appendChild(a);a.click();document.body.removeChild(a);}

/* ══════════════════════════════════════════
   BARCODE SCANNER — GLOBAL CAPTURE
   Scanner types fast (< 80ms/char) + Enter
   Detected as scan → direct cart add (no search)
   Manual typing → normal search behavior
   ══════════════════════════════════════════ */
var _scanBuf='',_scanTimer=null,_scanTimes=[];
$(document).on('keydown',function(e){
    if(e.ctrlKey||e.altKey||e.metaKey)return;
    var now=Date.now();
    var tag=(e.target.tagName||'').toUpperCase();
    var inInput=(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT');

    if(e.key==='Enter'){
        // Check if buffer looks like a scanner (3+ chars, typed fast)
        if(_scanBuf.length>=3&&_scanTimes.length>=2){
            var avgSpeed=(_scanTimes[_scanTimes.length-1]-_scanTimes[0])/(_scanTimes.length-1);
            if(avgSpeed<80){ // Scanner: avg < 80ms between chars
                e.preventDefault();
                e.stopPropagation();
                var val=_scanBuf.trim();
                _scanBuf='';_scanTimes=[];clearTimeout(_scanTimer);
                // Clear search box if scanner typed into it
                if(inInput)$(e.target).val('');
                handleBarcodeScan(val);
                return;
            }
        }
        // Not a scanner — if in search box, handle as manual Enter
        if(inInput&&$(e.target).attr('id')==='fSearch'){
            var v=$(e.target).val().trim();
            if(v){e.preventDefault();handleBarcodeScan(v);}
        }
        _scanBuf='';_scanTimes=[];clearTimeout(_scanTimer);
        return;
    }

    // Buffer printable characters. `e.key` is undefined for some synthesised
    // events (e.g. browser autofill, IME composition starts) — guard the read
    // so the keydown handler doesn't blow up the whole POS page.
    if(typeof e.key === 'string' && e.key.length === 1){
        _scanBuf+=e.key;
        _scanTimes.push(now);
        clearTimeout(_scanTimer);
        _scanTimer=setTimeout(function(){_scanBuf='';_scanTimes=[];},300);
        // If not in input, focus search box
        if(!inInput){
            var $s=$('#fSearch');
            if($s.length&&$s.is(':visible'))$s.focus();
        }
    }
});

/* ══════════════════════════════════════════
   BARCODE SCAN → DIRECT CART ADD
   Internal ID → add all available units
   Internal ID|Unit → add that specific unit
   ══════════════════════════════════════════ */
function handleBarcodeScan(val){
    toastr.info('<i class="bi bi-upc-scan me-1"></i> Scanning: '+val, '', {timeOut:2000});
    $.get(BASE_URL+'/sales/barcode-scan',{scan_value:val},function(r){
        if(!r||r.status!==200||!r.data||!r.data.length){
            toastr.error(r&&r.message?r.message:'Part not found: "'+val+'"');
            return;
        }
        var added=0,skipped=0;
        r.data.forEach(function(part){
            part.units.forEach(function(u){
                if(_cart.some(function(c){return c.item_type==='part'&&String(c.id)===String(part.id)&&c.unit_number===u.unit_number;})){
                    skipped++;return;
                }
                addToCart('part',part.id,part.name,part.price,1,part.code,u.warehouse_id,u.unit_number,part.vat_included);
                added++;
            });
        });
        if(added>0) toastr.success('<i class="bi bi-cart-check me-1"></i> '+added+' unit'+(added>1?'s':'')+' added');
        if(skipped>0) toastr.info(skipped+' already in cart');
        if(!added&&!skipped) toastr.warning('No available stock for "'+val+'"');
        // Clear search box
        $('#fSearch').val('');_search='';
    }).fail(function(){
        toastr.error('Scan failed. Check connection.');
    });
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
$(function(){
    // Swipe to delete on mobile cart items
    var _swStart=null,_swEl=null;
    $(document).on('touchstart','.ci-wrap',function(e){_swStart=e.originalEvent.touches[0].clientX;_swEl=$(this);$('.ci-wrap').not(this).removeClass('swiped');});
    $(document).on('touchmove','.ci-wrap',function(e){
        if(!_swStart||!_swEl)return;
        var dx=_swStart-e.originalEvent.touches[0].clientX;
        if(dx>40)_swEl.addClass('swiped');
        else if(dx<-20)_swEl.removeClass('swiped');
    });
    $(document).on('touchend',function(){_swStart=null;_swEl=null;});

    // Restore sidebar state
    if(localStorage.getItem('pos_sidebar')==='0'){$('.pos-sidebar').addClass('collapsed');$('.ps-toggle').addClass('show');}
    $.get(BASE_URL+'/sales/warehouses',function(r){if(r&&r.status===200&&r.data)r.data.forEach(function(w){$('#fWarehouse').append('<option value="'+w.id+'">'+esc(w.name)+'</option>');});});
    $.get(BASE_URL+'/sales/taxes',function(r){if(r&&r.status===200&&r.data)_taxes=r.data;});
    loadProducts();
    // Auto-focus search box (scanner types directly here)
    $('#fSearch').focus();
    var st;$('#fSearch').on('input',function(){clearTimeout(st);_search=$(this).val().trim();st=setTimeout(function(){_page=1;if(_vMode)closeVehicleParts();else loadProducts();},300);});
    // Barcode scan: Enter key triggers scan-to-cart
    $('#fSearch').on('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var v=$(this).val().trim();if(v)handleBarcodeScan(v);}});
    // ───── Receipt print handlers (Sale Complete overlay) ─────
    // Open the canonical receipt template (driven by Receipt-tab settings)
    // in a new tab. The page auto-prints when the user clicks the "Print"
    // toolbar button — the Receipt tab settings drive every detail
    // (company block, QR, terms, format, etc.).
    window.successPrintReceipt = function(printType) {
        var d = window._smsLastOrder;
        if (!d || !d.uuid) { toastr.warning('Order info missing — refresh and retry.'); return; }
        var url = '/sales/receipt-preview?order=' + encodeURIComponent(d.uuid)
            + '&print_type=' + encodeURIComponent(printType || 'original');
        window.open(url, '_blank');
    };

    // ═══════════════════════════════════════════════════════════════
    //  Direct cart print — Print button on the Checkout panel
    //
    //  Sends the *current cart* (NOT a saved order) to the printer
    //  assigned to the "receipt" role on /sales/printer-settings via
    //  the local print agent on port 9998. Pure print — no AJAX save,
    //  no stock touch, no order creation. Same agent path the Test
    //  Print button uses.
    //
    //  Logo + UPI QR are embedded directly into the ESC/POS payload.
    // ═══════════════════════════════════════════════════════════════
    var _smsReceiptCache = null;       // cached settings for fast print
    function _loadReceiptSettingsForPrint(cb) {
        // Refresh on every print so the cashier always sees latest values.
        $.get('/sales/settings/data', function(res) {
            _smsReceiptCache = (res && res.data) || {};
            cb(_smsReceiptCache);
        }).fail(function() { cb(_smsReceiptCache || {}); });
    }

    // Convert a Bootstrap Image URL → ESC/POS raster bytes (GS v 0).
    // Returns a Promise<string> with raw bytes; never rejects (resolves '' on
    // any failure so the print still proceeds without the logo).
    function _imgToEscpos(url, maxWidth) {
        return new Promise(function(resolve) {
            if (!url) return resolve('');
            try {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                img.onerror = function() { resolve(''); };
                img.onload = function() {
                    try {
                        maxWidth = maxWidth || 384;       // 80mm thermal max width
                        var w = Math.min(maxWidth, img.naturalWidth || img.width);
                        if (w % 8 !== 0) w = w - (w % 8);  // multiple of 8
                        if (w <= 0) return resolve('');
                        var ratio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height || 1);
                        var h = Math.max(1, Math.floor(w / ratio));
                        var canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        var ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
                        ctx.drawImage(img, 0, 0, w, h);
                        var pixels = ctx.getImageData(0, 0, w, h).data;
                        var bpr = w / 8, bytes = '';
                        for (var y = 0; y < h; y++) {
                            for (var b = 0; b < bpr; b++) {
                                var byte = 0;
                                for (var bit = 0; bit < 8; bit++) {
                                    var x = b * 8 + bit, i = (y * w + x) * 4;
                                    var gray = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
                                    var a = pixels[i+3];
                                    if (a > 128 && gray < 128) byte |= (1 << (7 - bit));
                                }
                                bytes += String.fromCharCode(byte);
                            }
                        }
                        var xL = bpr & 0xff, xH = (bpr >> 8) & 0xff;
                        var yL = h   & 0xff, yH = (h   >> 8) & 0xff;
                        // ESC a 1 (center) + GS v 0 m xL xH yL yH data + LF
                        resolve('\x1ba\x01' + '\x1dv0\x00'
                            + String.fromCharCode(xL) + String.fromCharCode(xH)
                            + String.fromCharCode(yL) + String.fromCharCode(yH)
                            + bytes + '\n');
                    } catch (e) { resolve(''); }
                };
                img.src = url;
            } catch (e) { resolve(''); }
        });
    }

    // ESC/POS QR (GS ( k) — works on most modern thermal printers.
    function _qrEscpos(data) {
        if (!data) return '';
        var fn = '\x1d\x28\x6b';
        // Set model 2
        var setModel = fn + '\x04\x00\x31\x41\x32\x00';
        // Module size = 6 (decent at 80mm)
        var setSize  = fn + '\x03\x00\x31\x43\x06';
        // Error correction level M
        var setEC    = fn + '\x03\x00\x31\x45\x31';
        // Store the payload
        var len = data.length + 3;
        var pL = len & 0xff, pH = (len >> 8) & 0xff;
        var store = fn + String.fromCharCode(pL) + String.fromCharCode(pH)
                  + '\x31\x50\x30' + data;
        // Print
        var pr = fn + '\x03\x00\x31\x51\x30';
        // Center, then back to left
        return '\x1ba\x01' + setModel + setSize + setEC + store + pr + '\n' + '\x1ba\x00';
    }

    // ─── Build ESC/POS bytes from cart + settings ─────────────────
    function _buildCartEscpos(cart, settings, logoBytes) {
        var s = settings || {};
        function pick(key, fallback) {
            return (s[key] && String(s[key]).trim()) ? String(s[key]) : (fallback || '');
        }
        function on(key, def) {
            var v = s[key];
            if (v == null || v === '') return def !== false;
            return v === '1' || v === true || v === 'true';
        }

        var ESC = '\x1b', GS = '\x1d';
        var INIT      = ESC + '@';
        var FONT_A    = ESC + 'M' + '\x00';   // pin Font A (12x24) — 42 cols on 80mm
        // Leave the printer's natural left margin alone — that gives a
        // symmetric ~2mm space on both sides via mechanical print head limits.
        // If a specific printer needs explicit left padding (rare), set
        // `pos_receipt_left_margin_dots` (e.g. 16 ≈ 1.3mm). 0 = flush left.
        var marginDots = parseInt(s.pos_receipt_left_margin_dots);
        var LEFT_MARGIN = (Number.isFinite(marginDots) && marginDots >= 0)
            ? GS + 'L' + String.fromCharCode(marginDots & 0xff)
                       + String.fromCharCode((marginDots >> 8) & 0xff)
            : '';   // empty → don't touch printer's saved/default margin
        var ALIGN_L   = ESC + 'a' + '\x00';
        var ALIGN_C   = ESC + 'a' + '\x01';
        var SIZE_NORM = ESC + '!' + '\x00';
        var SIZE_BIG  = ESC + '!' + '\x30';
        var SIZE_TALL = ESC + '!' + '\x10';
        var BOLD_ON   = ESC + 'E' + '\x01';
        var BOLD_OFF  = ESC + 'E' + '\x00';
        var CUT       = GS  + 'V' + '\x00';

        // 48 cols at Font B is the most common configuration that prints
        // edge-to-edge on 80mm paper, leaving only the printer's natural
        // ~2mm mechanical margin on each side. Settings can override via
        // pos_receipt_print_cols (e.g. 32 for narrow / 42 for Font A).
        var COLS = parseInt(s.pos_receipt_print_cols) || 48;
        if (COLS < 24 || COLS > 64) COLS = 48;
        var SEP  = '-'.repeat(COLS);

        // Pick font based on column width: ≥48 → Font B (small, fills paper),
        // <48 → Font A (default size). This must be set before any printing.
        var FONT_PIN = COLS >= 48
            ? (ESC + 'M' + '\x01')   // Font B
            : (ESC + 'M' + '\x00');  // Font A

        function padR(t, n) { t = String(t || ''); return t.length >= n ? t.slice(0, n) : t + ' '.repeat(n - t.length); }
        function padL(t, n) { t = String(t || ''); return t.length >= n ? t.slice(-n) : ' '.repeat(n - t.length) + t; }
        function row2(l, r) {
            l = String(l || ''); r = String(r || '');
            var space = Math.max(1, COLS - l.length - r.length);
            if (l.length + r.length >= COLS) return l.slice(0, COLS - r.length - 1) + ' ' + r;
            return l + ' '.repeat(space) + r;
        }
        function wrap(t, width) {
            t = String(t || ''); if (!t) return [];
            var out = [], words = t.split(/\s+/), cur = '';
            for (var i = 0; i < words.length; i++) {
                var w = words[i];
                if ((cur + ' ' + w).trim().length > width) { if (cur) out.push(cur); cur = w; }
                else cur = cur ? cur + ' ' + w : w;
            }
            if (cur) out.push(cur);
            return out;
        }
        function fmt(n) { return Number(n || 0).toFixed(2); }

        // ── Settings → display ──
        var company = pick('pos_receipt_company_name', 'Your Company');
        var tagline = pick('pos_receipt_tagline', '');
        var address = pick('pos_receipt_address', '');
        var city    = pick('pos_receipt_city', '');
        var pincode = pick('pos_receipt_pincode', '');
        var phone   = pick('pos_receipt_phone', '');
        var altPh   = pick('pos_receipt_alt_mobile', '');
        var email   = pick('pos_receipt_email', '');
        var website = pick('pos_receipt_website', '');
        var taxLine = pick('pos_receipt_tax_line', '');
        var counter = pick('pos_receipt_counter_no', '');
        var headerTxt = s.pos_receipt_header || '';
        var footerTxt = s.pos_receipt_footer || '';
        var thanks    = s.pos_receipt_thank_you || 'Thank you!';
        var policy    = s.pos_receipt_return_policy || '';
        var terms     = s.pos_receipt_terms || '';
        var upiId     = s.pos_receipt_upi_id || '';
        var upiPayee  = s.pos_receipt_upi_payee_name || company;
        var currency  = s.pos_receipt_currency_symbol || (window.SMS_CURRENCY || 'Rs.');

        var showGst       = on('pos_receipt_show_gst');
        var showCustomer  = on('pos_receipt_show_customer');
        var showCashier   = on('pos_receipt_show_cashier');
        var showInvNum    = on('pos_receipt_show_invoice_number');
        var showDisc      = on('pos_receipt_show_discount');
        var showTaxBd     = on('pos_receipt_show_tax_breakdown');
        var showPay       = on('pos_receipt_show_payment_method');
        var showQr        = on('pos_receipt_show_qr');
        var showTerms     = on('pos_receipt_show_terms', false);
        var showLogo      = on('pos_receipt_show_logo');

        // ── Cart roll-up ──
        var subtotal = 0;
        var lines = (cart || []).map(function(c) {
            var qty  = parseInt(c.quantity) || 1;
            var rate = parseFloat(c.unit_price) || 0;
            var amt  = parseFloat(c.total_price) || (qty * rate);
            subtotal += amt;
            return { name: c.item_name || '', qty: qty, rate: rate, amt: amt };
        });
        var dType = $('#dType').val() || '';
        var dVal  = parseFloat($('#dVal').val()) || 0;
        var discountAmt = 0;
        if (dType === 'percent') discountAmt = subtotal * (dVal / 100);
        else if (dType === 'fixed') discountAmt = dVal;
        if (discountAmt > subtotal) discountAmt = subtotal;
        var taxableBase = subtotal - discountAmt;
        var taxTotal = parseFloat(($('#cTaxArea').data('total') || 0)) || 0;
        // Read parsed tax rows out of #cTaxArea if available.
        var taxRows = [];
        $('#cTaxArea .tax-row').each(function() {
            var nm = $(this).find('.tax-name').text() || '';
            var amt = parseFloat($(this).find('.tax-amt').text().replace(/[^0-9.\-]/g, '')) || 0;
            if (amt > 0) taxRows.push({ name: nm, amount: amt });
            taxTotal += amt;
        });
        if (taxRows.length === 0 && $('#cTotal').length) {
            var totalTxt = parseFloat($('#cTotal').text().replace(/[^0-9.\-]/g, '')) || (taxableBase);
            taxTotal = Math.max(0, totalTxt - taxableBase);
        }
        var grandTotal = taxableBase + taxTotal;

        // Customer chip
        var custName = ($('#custResult').text() || '').trim();
        if (!custName || /walk/i.test(custName)) custName = 'Walk-in';
        var notes = $('#oNotes').val() || '';

        // Date / time
        var d = new Date();
        var dd = String(d.getDate()).padStart(2,'0');
        var mm = String(d.getMonth()+1).padStart(2,'0');
        var yy = d.getFullYear();
        var h = d.getHours(), mi = String(d.getMinutes()).padStart(2,'0');
        var ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
        var dateStr = dd + '-' + mm + '-' + yy;
        var timeStr = String(h).padStart(2,'0') + ':' + mi + ' ' + ap;

        // Column widths scale with paper width.
        //   48 cols (Font B): name=24, qty=4, rate=9, amt=11
        //   42 cols (Font A): name=20, qty=4, rate=8, amt=10
        //   32 cols (narrow): name=14, qty=4, rate=7, amt=7
        var QTY_W  = 4;
        var RATE_W = COLS >= 48 ? 9  : (COLS >= 40 ? 8  : 7);
        var AMT_W  = COLS >= 48 ? 11 : (COLS >= 40 ? 10 : 7);
        var NAME_W = COLS - QTY_W - RATE_W - AMT_W;

        // ── Compose ──
        // 1. INIT — reset the printer to defaults (also restores the
        //    printer's saved left margin, which gives symmetric paper margins).
        // 2. LEFT_MARGIN — only emitted when an explicit override is set in
        //    settings; otherwise we leave the printer's default alone.
        // 3. FONT_PIN — Font A or Font B based on COLS so columns line up.
        var out = INIT + LEFT_MARGIN + FONT_PIN;
        if (showLogo && logoBytes) out += logoBytes;

        out += ALIGN_C + SIZE_BIG + BOLD_ON + company + '\n' + BOLD_OFF + SIZE_NORM;
        if (tagline) out += ALIGN_C + tagline + '\n';
        if (address) wrap(address.replace(/\n/g, ', '), COLS).forEach(function(l){ out += ALIGN_C + l + '\n'; });
        if (city || pincode) out += ALIGN_C + [city, pincode].filter(Boolean).join(' ') + '\n';
        if (phone || altPh)  out += ALIGN_C + 'Mo: ' + [phone, altPh].filter(Boolean).join(' / ') + '\n';
        if (email || website) out += ALIGN_C + [email, website].filter(Boolean).join(' · ') + '\n';
        if (showGst && taxLine) out += ALIGN_C + taxLine + '\n';
        if (headerTxt) out += ALIGN_C + headerTxt + '\n';
        out += ALIGN_L + SEP + '\n';

        // ── Bill / Date / Time / User / Counter ──
        // All four lines print so the cashier or auditor can identify
        // exactly which counter and shift produced this bill.
        if (showInvNum) out += row2('Bill: PREVIEW', 'Date: ' + dateStr) + '\n';
        else            out += row2('', 'Date: ' + dateStr) + '\n';
        out += row2('Time: ' + timeStr,
            showCashier ? ('User: ' + ((window.SMS_USER && SMS_USER.name) || 'Cashier')) : '') + '\n';
        if (counter) out += row2('Counter: ' + counter, '') + '\n';

        // ── Customer block ──
        if (showCustomer) {
            out += SEP + '\n';
            out += 'Customer: ' + custName + '\n';
            // Pull phone / GST out of the cached customer record set when
            // the cashier picked someone (window._smsCurrentCustomer).
            var c = window._smsCurrentCustomer || {};
            if (c.phone)      out += 'Mobile  : ' + c.phone + '\n';
            if (c.gst_number) out += 'GSTIN   : ' + c.gst_number + '\n';
        }

        out += SEP + '\n';
        out += BOLD_ON
             + padR('Item', NAME_W)
             + padL('Qty',  QTY_W)
             + padL('Rate', RATE_W)
             + padL('Amt',  AMT_W) + '\n'
             + BOLD_OFF;
        out += SEP + '\n';

        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i];
            var nameLines = wrap(ln.name, NAME_W);
            if (nameLines.length === 0) nameLines = [''];
            out += padR(nameLines[0], NAME_W)
                 + padL(String(ln.qty), QTY_W)
                 + padL(fmt(ln.rate),  RATE_W)
                 + padL(fmt(ln.amt),   AMT_W) + '\n';
            for (var k = 1; k < nameLines.length; k++) out += '  ' + nameLines[k] + '\n';
        }

        out += SEP + '\n';
        out += row2('Subtotal', currency + ' ' + fmt(subtotal)) + '\n';
        if (showDisc && discountAmt > 0) out += row2('Discount', '- ' + currency + ' ' + fmt(discountAmt)) + '\n';
        if (taxRows.length && showTaxBd) {
            for (var t = 0; t < taxRows.length; t++) {
                out += row2('  ' + taxRows[t].name, currency + ' ' + fmt(taxRows[t].amount)) + '\n';
            }
        } else if (taxTotal > 0) {
            out += row2('Tax', currency + ' ' + fmt(taxTotal)) + '\n';
        }
        out += SEP + '\n';
        out += BOLD_ON + SIZE_TALL + row2('TOTAL', currency + ' ' + fmt(grandTotal)) + '\n' + SIZE_NORM + BOLD_OFF;

        // Notes
        if (notes) {
            out += SEP + '\n';
            wrap(notes, COLS).forEach(function(l){ out += l + '\n'; });
        }

        // QR for UPI
        if (showQr && upiId) {
            var upiUrl = 'upi://pay?pa=' + encodeURIComponent(upiId)
                       + '&pn=' + encodeURIComponent(upiPayee)
                       + '&am=' + fmt(grandTotal)
                       + '&cu=' + (currency === '₹' ? 'INR' : 'USD');
            out += SEP + '\n';
            out += ALIGN_C + 'Scan & Pay (UPI)\n' + ALIGN_L;
            out += _qrEscpos(upiUrl);
            out += ALIGN_C + upiId + '\n' + ALIGN_L;
        }

        out += SEP + '\n';
        if (thanks) out += ALIGN_C + BOLD_ON + thanks + '\n' + BOLD_OFF + ALIGN_L;
        if (policy) wrap(policy, COLS).forEach(function(l){ out += ALIGN_C + l + '\n'; });
        if (showTerms && terms) {
            out += SEP + '\n';
            wrap(terms, COLS).forEach(function(l){ out += l + '\n'; });
        }
        if (footerTxt) {
            out += SEP + '\n';
            wrap(footerTxt, COLS).forEach(function(l){ out += ALIGN_C + l + '\n'; });
            out += ALIGN_L;
        }

        out += '\n\n\n' + CUT;
        return out;
    }

    // ─── Print button click — pure silent print, no save ──────────
    window.cartPrintNow = function() {
        if (!window._cart || !window._cart.length) {
            if (window.toastr) toastr.warning('Cart is empty');
            return;
        }
        var assigned = (window._posPrinters || {}).receipt;
        if (!assigned || !assigned.kind) {
            if (window.toastr) toastr.warning('No receipt printer assigned. Open Printer Settings.');
            return;
        }
        var $btn = $('#coPrint').prop('disabled', true).html('<i class="bi bi-hourglass-split"></i> Printing...');
        function reset(){ $btn.prop('disabled', false).html('<i class="bi bi-printer me-1"></i>Print'); }

        _loadReceiptSettingsForPrint(function(settings) {
            // Try to load logo bitmap; resolves '' on any failure.
            var logoUrl = settings.pos_receipt_logo_url || '';
            _imgToEscpos(logoUrl, 384).then(function(logoBytes) {
                var data = _buildCartEscpos(window._cart, settings, logoBytes);
                $.ajax({
                    url: 'http://localhost:9998/print-to', method: 'POST',
                    contentType: 'application/json', timeout: 12000,
                    data: JSON.stringify({ target: assigned, data: data }),
                }).done(function(r) {
                    reset();
                    if (r && r.ok) {
                        if (window.toastr) toastr.success('Printed on ' + (assigned.name || 'printer'));
                    } else {
                        if (window.toastr) toastr.error((r && r.error) || 'Print failed');
                    }
                }).fail(function(xhr) {
                    reset();
                    var msg = (xhr.responseJSON && xhr.responseJSON.error)
                        || xhr.statusText
                        || 'Print agent unreachable (port 9998). Is it running?';
                    if (window.toastr) toastr.error(msg);
                });
            });
        });
    };

    // ───── Direct silent print to the assigned 80mm receipt printer ─────
    // No popup, no browser print dialog. The receipt is rendered to ESC/POS
    // bytes server-side and POSTed straight to the local print agent on
    // localhost:9998 — exact same path the "Test Print" button uses on
    // /sales/printer-settings.
    window.autoPrintReceipt = function(orderUuid) {
        if (!orderUuid) return;
        var assigned = (window._posPrinters || {}).receipt;
        if (!assigned || !assigned.kind) {
            if (window.toastr) toastr.warning('No receipt printer assigned. Open Printer Settings to assign one.');
            return;
        }
        var label = assigned.name || (assigned.kind + ' printer');
        if (window.toastr) toastr.info('Sending receipt to ' + label + '…');

        // 1. Fetch the ESC/POS payload for this order from the backend.
        $.ajax({
            url: '/sales/orders/' + encodeURIComponent(orderUuid) + '/receipt-escpos',
            method: 'GET', dataType: 'text', timeout: 8000,
        }).done(function(data) {
            // 2. POST to the local print agent — same shape as test-print.
            $.ajax({
                url: 'http://localhost:9998/print-to', method: 'POST',
                contentType: 'application/json', timeout: 10000,
                data: JSON.stringify({ target: assigned, data: data }),
            }).done(function(r) {
                if (r && r.ok) {
                    if (window.toastr) toastr.success('Printed on ' + label);
                } else {
                    if (window.toastr) toastr.error((r && r.error) || 'Print failed on agent');
                }
            }).fail(function(xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error) || xhr.statusText || 'Print agent unreachable (port 9998)';
                if (window.toastr) toastr.error(msg);
            });
        }).fail(function() {
            if (window.toastr) toastr.error('Could not load receipt for printing.');
        });
    };
    // A4 invoice → PDF rendered server-side from the same order data.
    window.successPrintA4 = function() {
        var d = window._smsLastOrder;
        if (!d || !d.uuid) { toastr.warning('Order info missing — refresh and retry.'); return; }
        window.open('/sales/orders/' + d.uuid + '/invoice', '_blank');
    };

    // Re-focus search box after modal close / any click on empty area
    $(document).on('click','.pos-content',function(e){if(!$(e.target).closest('input,select,textarea,button,a,.pc,.ci-wrap').length)$('#fSearch').focus();});
    var vst;$('#vPartSearch').on('input',function(){clearTimeout(vst);vst=setTimeout(function(){loadVehiclePartsFiltered();},300);});
    $('#fWarehouse').on('change',function(){_wh=$(this).val();_page=1;loadProducts();});
    $('#fPerPage').on('change',function(){_pp=parseInt($(this).val())||20;_page=1;loadProducts();});
    $(document).on('keydown',function(e){if(e.key==='Escape'){$('#infoPage').removeClass('open');$('#coOverlay,#successOv,#posLightbox').hide();closePanel();showCart();}
        if($('#posLightbox').is(':visible')){if(e.key==='ArrowLeft'&&_lbIdx>0){_lbIdx--;lbRender();}if(e.key==='ArrowRight'&&_lbIdx<_lbItems.length-1){_lbIdx++;lbRender();}}});
});
