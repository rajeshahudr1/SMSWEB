/* POS Printer Settings — Scan / Assign / Save.
   Talks directly to the local print-agent at http://localhost:9998, plus the
   SMS backend at /sales/printers to persist the assignments per-user-per-org. */
(function(){
  var AGENT = 'http://localhost:9998';
  var ROLES = ['receipt', 'label', 'invoice_a4', 'barcode', 'qr'];
  var _discovered = [];
  var _assignments = (window.SMS_SAVED_PRINTERS || {});
  var _dirty = false;

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function printerKey(p){
    if (!p) return '';
    if (p.kind === 'usb') return 'usb:' + (p.vendorId||'') + ':' + (p.productId||'');
    if (p.kind === 'windows') return 'win:' + (p.name||'');
    if (p.kind === 'network') return 'net:' + (p.host||'') + ':' + (p.port||9100);
    return '';
  }
  function toastr_(t,m){ if(window.toastr) (window.toastr[t]||window.toastr.info)(m); }
  function setDirty(v){ _dirty = v; document.getElementById('btnSave').disabled = !v; }

  function setStatus(kind, html){
    var $s = $('#agentStatus');
    $s.removeClass('ok err wait').addClass(kind);
    $s.html(html);
  }

  function checkAgent(){
    setStatus('wait', '<i class="bi bi-hourglass-split"></i> Checking print agent…');
    $.ajax({ url: AGENT + '/status', method: 'GET', timeout: 2500 })
      .done(function(r){
        setStatus('ok', '<i class="bi bi-check-circle-fill"></i> Print agent v'+(r.version||'?')+' running · '+(r.detected_count||0)+' USB printer(s) detected');
      })
      .fail(function(){
        setStatus('err', '<i class="bi bi-exclamation-triangle-fill"></i> Print agent NOT running at <code>'+AGENT+'</code>. Install &amp; launch <b>SMS-Print-Agent.exe</b> on this PC.');
      });
  }

  function scanPrinters(){
    var $btn = $('#btnScan').prop('disabled', true).html('<span class="spinner-border spinner-border-sm" style="width:14px;height:14px;"></span> Scanning…');
    $('#discoveredBody').html('<div class="psp-empty"><span class="spinner-border text-primary"></span><div style="margin-top:8px;">Scanning local printers…</div></div>');
    $.ajax({ url: AGENT + '/scan', method: 'GET', timeout: 8000 })
      .done(function(r){
        _discovered = (r && r.printers) || [];
        renderDiscovered();
        renderRoleSelects();
      })
      .fail(function(){
        $('#discoveredBody').html('<div class="psp-empty"><i class="bi bi-exclamation-triangle"></i>Could not reach the print agent. Make sure it is running.</div>');
        toastr_('error', 'Agent not reachable');
      })
      .always(function(){ $btn.prop('disabled', false).html('<i class="bi bi-search"></i> Scan printers'); });
  }

  function renderDiscovered(){
    $('#discoveredCount').text(_discovered.length);
    if (!_discovered.length){
      $('#discoveredBody').html('<div class="psp-empty"><i class="bi bi-printer-fill"></i>No online printers found. Check USB connections and try again.</div>');
      return;
    }
    var h = '';
    _discovered.forEach(function(p){
      /* Build a compact "what is this printer" description per kind */
      var bits = [];
      if (p.kind === 'usb'){
        if (p.vendorId && p.productId) bits.push('<span style="font-family:var(--pv2-font-mono);">VID ' + esc(p.vendorId) + ' · PID ' + esc(p.productId) + '</span>');
        bits.push('<span style="color:var(--pv2-success);"><i class="bi bi-usb-plug"></i> USB</span>');
      } else if (p.kind === 'windows'){
        if (p.driver) bits.push(esc(p.driver));
        if (p.port)   bits.push('<span style="font-family:var(--pv2-font-mono);">' + esc(p.port) + '</span>');
        /* Tag the underlying port type so the user can tell USB-installed vs IP/WSD */
        if (p.portKind === 'network' && p.host){
          bits.push('<span style="color:var(--pv2-success);"><i class="bi bi-wifi"></i> ' + esc(p.host) + '</span>');
        } else if (p.portKind === 'usb'){
          bits.push('<span style="color:var(--pv2-brand);"><i class="bi bi-usb-plug"></i> USB</span>');
        } else if (p.portKind === 'wsd'){
          bits.push('<span style="color:var(--pv2-muted);"><i class="bi bi-broadcast"></i> WSD</span>');
        }
        if (p.shared && p.shareName) bits.push('<span style="color:var(--pv2-muted);">shared: ' + esc(p.shareName) + '</span>');
      } else if (p.kind === 'network'){
        bits.push('<span style="font-family:var(--pv2-font-mono);color:var(--pv2-success);"><i class="bi bi-wifi"></i> ' + esc(p.host) + ':' + esc(p.port || 9100) + '</span>');
      }
      var details = bits.join(' · ') || '—';

      h += '<div class="psp-tr">'
        + '<div class="nm">'+esc(p.name)+'</div>'
        + '<div><span class="psp-kind '+esc(p.kind)+'">'+esc(p.kind)+'</span></div>'
        + '<div class="dt">'+details+'</div>'
        + '<div><span class="psp-chip">'+esc(p.suggested_role||'other')+'</span></div>'
        + '<div style="text-align:right;"><button class="psp-btn ghost" data-test="'+esc(printerKey(p))+'" style="padding:5px 10px;font-size:11px;"><i class="bi bi-broadcast"></i> Test</button></div>'
      + '</div>';
    });
    $('#discoveredBody').html(h);
  }

  function optionLabel(p){
    /* Human-readable "which printer is this" label for dropdowns */
    var tag = '';
    if (p.kind === 'usb') tag = 'USB ' + (p.vendorId||'') + ':' + (p.productId||'');
    else if (p.kind === 'network') tag = 'WiFi ' + (p.host||'') + ':' + (p.port||9100);
    else if (p.kind === 'windows'){
      if (p.portKind === 'network' && p.host) tag = 'WiFi ' + p.host;
      else if (p.portKind === 'usb') tag = 'USB';
      else if (p.portKind === 'wsd') tag = 'WSD';
      else tag = p.port || '';
    }
    return tag ? (p.name + '  —  ' + tag) : p.name;
  }

  function renderRoleSelects(){
    var assignedCount = 0;
    ROLES.forEach(function(role){
      var $card = $('.psp-role[data-role="'+role+'"]');
      var $sel = $card.find('.psp-role-sel').empty().append('<option value="">— Not configured —</option>');
      _discovered.forEach(function(p){
        var k = printerKey(p);
        $sel.append('<option value="'+esc(k)+'">'+esc(optionLabel(p))+'</option>');
      });
      var current = _assignments[role];
      var key = current ? printerKey(current) : '';
      if (key) $sel.val(key);
      var hasMatch = key && _discovered.some(function(x){ return printerKey(x) === key; });
      updateRoleStatus($card, hasMatch ? current : null);
      if (hasMatch) assignedCount++;
    });
    $('#assignedCnt').text(assignedCount + ' / ' + ROLES.length);
  }

  function updateRoleStatus($card, printer){
    var $st = $card.find('.psp-role-status');
    if (printer){
      $st.removeClass('off').addClass('on').html('<i class="bi bi-check-lg"></i> ' + (printer.name || 'Active'));
      $card.addClass('assigned');
    } else {
      $st.removeClass('on').addClass('off').text('Not set');
      $card.removeClass('assigned');
    }
  }

  function gatherAssignments(){
    var out = {};
    ROLES.forEach(function(role){
      var $card = $('.psp-role[data-role="'+role+'"]');
      var k = $card.find('.psp-role-sel').val();
      if (!k) return;
      var p = _discovered.find(function(x){ return printerKey(x) === k; });
      if (!p) return;
      out[role] = {
        kind: p.kind, name: p.name,
        vendorId: p.vendorId, productId: p.productId,
        host: p.host, port: p.port
      };
    });
    return out;
  }

  function saveAssignments(){
    var printers = gatherAssignments();
    $('#btnSave').prop('disabled', true).html('<span class="spinner-border spinner-border-sm" style="width:14px;height:14px;"></span> Saving…');
    $.ajax({
      url: '/sales/printers', method: 'PUT',
      contentType: 'application/json', data: JSON.stringify({ printers: printers })
    }).done(function(r){
      if (r && r.status === 200){
        _assignments = (r.data && r.data.printers) || printers;
        setDirty(false);
        toastr_('success', 'Printer assignments saved');
      } else toastr_('error', (r && r.message) || 'Save failed');
    }).fail(function(){ toastr_('error', 'Save failed'); })
      .always(function(){ $('#btnSave').html('<i class="bi bi-check-lg"></i> Save assignments'); });
  }

  function testPrinter(printer, forceRole){
    if (!printer){ toastr_('warning','Select a printer first'); return; }
    /* Pick test payload by role / suggested_role — ZPL for label printers,
       ESC/POS for receipt printers, plain text for A4. Fixes "test prints
       nothing" on ZPL label printers that were being sent ESC/POS bytes. */
    var role = forceRole || printer.role || printer.suggested_role || '';
    var nameLower = String(printer.name||'').toLowerCase() + ' ' + String(printer.driver||'').toLowerCase();
    var isLabel = role === 'label' || role === 'barcode' || role === 'qr'
                  || /zpl|zebra|sewoo|lk-b|tsc|godex|label|barcode/.test(nameLower)
                  || (printer.kind === 'usb' && printer.vendorId === '0525');
    var data;
    if (isLabel){
      /* ZPL II test label — fits 50×25mm */
      data = '^XA\n^MMT\n^PW400\n^LL200\n'
           + '^FO20,30^A0N,34,34^FDSMS Print Test^FS\n'
           + '^FO20,80^A0N,22,22^FD' + (printer.name||'Printer') + '^FS\n'
           + '^FO20,130^BY2,2,40^BCN,40,Y,N,N^FDTEST1234^FS\n'
           + '^XZ\n';
    } else {
      /* ESC/POS test receipt */
      data = '\x1b@'                              // init
           + '\x1b!\x30SMS PRINT TEST\n'          // double-size
           + '\x1b!\x00--------------------------------\n'
           + 'Printer: ' + (printer.name||'?') + '\n'
           + 'Kind:    ' + (printer.kind||'?') + '\n'
           + 'Status:  OK\n'
           + '--------------------------------\n\n\n\n'
           + '\x1dV\x00';                         // full cut
    }
    $.ajax({
      url: AGENT + '/print-to', method: 'POST', contentType: 'application/json',
      data: JSON.stringify({ target: printer, data: data })
    }).done(function(r){
      if (r && r.ok) toastr_('success', 'Test sent to ' + printer.name);
      else toastr_('error', (r && r.error) || 'Test failed');
    }).fail(function(xhr){
      var msg = (xhr.responseJSON && xhr.responseJSON.error) || xhr.statusText || 'Agent unreachable';
      toastr_('error', msg);
    });
  }

  /* Events */
  $(document).on('click', '#btnScan', scanPrinters);
  $(document).on('click', '#btnSave', saveAssignments);
  $(document).on('change', '.psp-role-sel', function(){
    setDirty(true);
    var $card = $(this).closest('.psp-role');
    var k = $(this).val();
    var p = k ? _discovered.find(function(x){ return printerKey(x) === k; }) : null;
    updateRoleStatus($card, p);
  });
  $(document).on('click', '.role-clear', function(){
    var $card = $(this).closest('.psp-role');
    $card.find('.psp-role-sel').val('').trigger('change');
  });
  $(document).on('click', '.role-test', function(){
    var $card = $(this).closest('.psp-role');
    var role = $card.data('role');
    var k = $card.find('.psp-role-sel').val();
    if (!k) { toastr_('warning', 'Pick a printer for this role first'); return; }
    testPrinter(_discovered.find(function(x){ return printerKey(x) === k; }), role);
  });
  $(document).on('click', '[data-test]', function(){
    var k = $(this).attr('data-test');
    testPrinter(_discovered.find(function(x){ return printerKey(x) === k; }));
  });

  /* Network printer modal */
  function openNp(){
    $('#npModal').addClass('open');
    $('#netScanResult').html('Click <b>Scan</b> to find printers on your local network automatically.');
  }
  function closeNp(){ $('#npModal').removeClass('open'); }
  /* Dynamic LAN scan — finds all hosts on the local /24 listening on 9100 */
  $(document).on('click', '#btnScanNet', function(){
    var $btn = $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm" style="width:12px;height:12px;"></span> Scanning…');
    $('#netScanResult').html('<span class="spinner-border spinner-border-sm" style="width:14px;height:14px;"></span> Scanning local network (5–10 seconds)…');
    $.ajax({ url: AGENT + '/scan-network', method: 'GET', timeout: 25000 })
      .done(function(r){
        var list = (r && r.printers) || [];
        if (!list.length){
          $('#netScanResult').html('<span style="color:var(--pv2-warning);"><i class="bi bi-exclamation-triangle"></i> No network printers found on your subnet. You can still enter the IP manually below.</span>');
          return;
        }
        var h = '<div style="font-size:11.5px;color:var(--pv2-muted);margin-bottom:6px;">Found ' + list.length + ' printer(s). Click one to use it:</div>';
        h += '<div style="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow:auto;">';
        list.forEach(function(p){
          var label = (p.name && p.name !== p.ip) ? p.name + '  —  ' + p.ip : p.ip;
          h += '<button type="button" class="psp-btn net-pick" data-ip="'+esc(p.ip)+'" data-port="'+esc(p.port||9100)+'" data-name="'+esc(p.name||'')+'" '
            + 'style="justify-content:flex-start;padding:7px 10px;font-size:12px;text-align:left;">'
            + '<i class="bi bi-printer" style="color:var(--pv2-brand);"></i> '
            + esc(label)
            + ' <span style="margin-left:auto;color:var(--pv2-muted);font-size:10.5px;font-family:var(--pv2-font-mono);">:' + esc(p.port||9100) + '</span>'
            + '</button>';
        });
        h += '</div>';
        $('#netScanResult').html(h);
      })
      .fail(function(){ $('#netScanResult').html('<span style="color:var(--pv2-danger);"><i class="bi bi-exclamation-triangle"></i> Scan failed — is the agent running?</span>'); })
      .always(function(){ $btn.prop('disabled', false).html('<i class="bi bi-search"></i> Scan'); });
  });
  /* Click a discovered network printer → prefill the form */
  $(document).on('click', '.net-pick', function(){
    var ip = $(this).attr('data-ip');
    var port = $(this).attr('data-port');
    var name = $(this).attr('data-name');
    $('#npHost').val(ip);
    $('#npPort').val(port);
    if (name && !$('#npName').val()) $('#npName').val(name);
    else if (!$('#npName').val()) $('#npName').val('Network ' + ip);
    toastr_('success', 'Selected ' + (name || ip));
  });
  $(document).on('click', '#btnAddNet', openNp);
  $(document).on('click', '#npClose, #npCancel', closeNp);
  $(document).on('click', '#npModal', function(e){ if (e.target === this) closeNp(); });
  $(document).on('click', '#btnTestNet', function(){
    var host = String($('#npHost').val() || '').trim();
    var port = parseInt($('#npPort').val()) || 9100;
    if (!host){ toastr_('warning', 'Enter an IP address'); return; }
    $.ajax({ url: AGENT + '/test-network', method:'POST', contentType:'application/json',
             data: JSON.stringify({ host:host, port:port }) })
      .done(function(r){ if (r && r.ok) toastr_('success', 'Reachable'); else toastr_('error', (r && r.error)||'Not reachable'); })
      .fail(function(xhr){ toastr_('error', (xhr.responseJSON && xhr.responseJSON.error)||'Not reachable'); });
  });
  $(document).on('click', '#btnSaveNet', function(){
    var host = String($('#npHost').val() || '').trim();
    var port = parseInt($('#npPort').val()) || 9100;
    var name = String($('#npName').val() || '').trim() || (host + ':' + port);
    var role = $('#npRole').val();
    if (!host){ toastr_('warning','Enter an IP address'); return; }
    $.ajax({ url: AGENT + '/add-network-printer', method:'POST', contentType:'application/json',
             data: JSON.stringify({ host:host, port:port, name:name, role:role }) })
      .done(function(r){
        if (r && r.ok){ toastr_('success','Network printer added'); closeNp(); scanPrinters(); }
        else toastr_('error', (r && r.error)||'Failed');
      })
      .fail(function(xhr){ toastr_('error', (xhr.responseJSON && xhr.responseJSON.error)||'Failed'); });
  });

  /* Init — page renders instantly; all network work happens async in parallel */
  $(function(){
    _assignments = window.SMS_SAVED_PRINTERS || {};
    /* Fetch saved assignments in background so the page is usable immediately */
    $.ajax({ url:'/sales/printers', method:'GET', timeout:5000 })
      .done(function(r){
        if (r && r.status===200 && r.data && r.data.printers){
          _assignments = r.data.printers;
          renderRoleSelects();
        }
      });
    checkAgent();
    /* Auto-scan only if the agent confirms running, via a small probe first */
    $.ajax({ url: AGENT + '/status', method: 'GET', timeout: 1200 })
      .done(function(){ scanPrinters(); })
      .fail(function(){ /* agent isn't up; user will click Scan manually when ready */ });
  });
})();
