/**
 * Web Label Printer
 * Preference order per print call:
 *   1. Server API  (/sales/label-printer/*) — works from ANY device (mobile, tablet, PC)
 *                  when the admin has set a network printer IP in POS Settings.
 *   2. Local Print Agent (http://localhost:9998) — USB fallback when agent is running
 *                  on the same PC as the browser.
 *   3. Prompt the user to download SMS-Print-Agent.exe — last resort.
 *
 * qr-helper.js just calls WebLabelPrinter.printQrInternalId / .printQrUnit / .printBarcode;
 * this module picks the right transport automatically.
 */
var WebLabelPrinter = (function() {
    var AGENT_URL = 'http://localhost:9998';
    var _agentKnownRunning = null;   // null = unknown, true/false after first probe
    var _serverConfigured = null;    // null = unknown, true/false after first probe

    async function checkAgent() {
        try {
            var res = await fetch(AGENT_URL + '/status', { method: 'GET', mode: 'cors' });
            if (!res.ok) return { running: false };
            var data = await res.json();
            _agentKnownRunning = true;
            return { running: true, printerReady: !!data.printer_connected };
        } catch (e) {
            _agentKnownRunning = false;
            return { running: false };
        }
    }

    async function checkServer() {
        try {
            var res = await fetch('/sales/label-printer/config', { method: 'GET' });
            if (!res.ok) { _serverConfigured = false; return { configured: false }; }
            var body = await res.json();
            var cfg = (body && body.data) || {};
            var configured = cfg.type === 'network' && !!cfg.ip;
            _serverConfigured = configured;
            return { configured: configured, config: cfg };
        } catch (e) {
            _serverConfigured = false;
            return { configured: false };
        }
    }

    async function autoConnect() {
        // Silent probe — fire both in parallel to populate state fast
        await Promise.all([checkServer(), checkAgent()]);
        return _serverConfigured || _agentKnownRunning;
    }

    async function sendViaServer(payload) {
        var url;
        if (payload.type === 'id') url = '/sales/label-printer/qr-internal-id';
        else if (payload.type === 'unit') url = '/sales/label-printer/qr-unit-location';
        else if (payload.type === 'barcode') url = '/sales/label-printer/barcode-location';
        else throw new Error('Invalid print type');
        var res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.body || {})
        });
        var data;
        try { data = await res.json(); } catch (e) { data = {}; }
        if (!res.ok || data.status !== 200) {
            throw new Error((data && data.message) || 'Server print failed');
        }
        return true;
    }

    async function sendViaAgent(payload) {
        var agentPayload;
        if (payload.type === 'id') agentPayload = { type: 'id', internal_id: payload.body.internal_id };
        else if (payload.type === 'unit') agentPayload = { type: 'unit', internal_id: payload.body.internal_id, unit_number: payload.body.unit_number };
        else if (payload.type === 'barcode') agentPayload = { type: 'barcode', location_code: payload.body.location_code };
        else throw new Error('Invalid print type');
        var res = await fetch(AGENT_URL + '/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(agentPayload)
        });
        var data;
        try { data = await res.json(); } catch (e) { data = {}; }
        if (!res.ok || !data.ok) throw new Error((data && data.error) || 'Agent print failed');
        return true;
    }

    /**
     * Main entry — tries server first, then local agent, then prompts user to install.
     */
    async function sendPrint(payload) {
        // 1. Server path (works from any device for network printer)
        if (_serverConfigured === null) await checkServer();
        if (_serverConfigured) {
            try { return await sendViaServer(payload); }
            catch (e) {
                // Fall through to agent if server can't reach the printer
                console.warn('[LabelPrinter] Server print failed, trying local agent:', e.message);
            }
        }

        // 2. Local agent path (USB on this PC)
        if (_agentKnownRunning === null) await checkAgent();
        if (_agentKnownRunning) {
            try { return await sendViaAgent(payload); }
            catch (e) {
                console.warn('[LabelPrinter] Agent print failed:', e.message);
                throw e;
            }
        }

        // 3. Neither is available — prompt to download agent (only works on Windows client)
        var msg = 'Label printer not configured.\n\n' +
                  'Option 1: Ask admin to set a network printer IP in POS Settings.\n' +
                  'Option 2: Download SMS-Print-Agent.exe (USB printer on this PC).\n\n' +
                  'Click OK to download the USB agent, or Cancel to close.';
        if (confirm(msg)) {
            window.location.href = '/downloads/SMS-Print-Agent.exe';
        }
        throw new Error('Printer not available.');
    }

    function printQrInternalId(internalId) {
        return sendPrint({ type: 'id', body: { internal_id: internalId } });
    }
    function printQrUnit(internalId, unitNum) {
        return sendPrint({ type: 'unit', body: { internal_id: internalId, unit_number: unitNum } });
    }
    function printBarcode(locationCode) {
        return sendPrint({ type: 'barcode', body: { location_code: locationCode } });
    }

    function isConnected() { return !!(_serverConfigured || _agentKnownRunning); }
    function isSupported() { return true; }

    return {
        autoConnect: autoConnect,
        sendRaw: function(zpl) {
            // Raw ZPL only supported via agent currently
            return sendViaAgent({ type: 'raw', body: { zpl: zpl } });
        },
        printQrInternalId: printQrInternalId,
        printQrUnit: printQrUnit,
        printBarcode: printBarcode,
        isConnected: isConnected,
        isSupported: isSupported,
        checkAgent: checkAgent,
        checkServer: checkServer
    };
})();
