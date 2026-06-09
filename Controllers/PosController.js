'use strict';
const api    = require('../helpers/api');
const fs     = require('fs');
const path   = require('path');
const multer = require('multer');

// ─── File upload (logo / QR / signature) ────────────────────────────
// Stores under /public/uploads/settings/ with a stable name per org so
// re-uploads overwrite the previous file. Returned URL is suitable for
// directly storing into a `pos_receipt_*_url` setting.
const SETTINGS_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'settings');
try { fs.mkdirSync(SETTINGS_UPLOAD_DIR, { recursive: true }); } catch (_) {}
const settingsUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, SETTINGS_UPLOAD_DIR),
        filename: (req, file, cb) => {
            const orgId = (req.session && req.session.user && req.session.user.organization_id) || 'org';
            const kind  = (req.params.kind || 'file').replace(/[^a-z0-9]/gi, '');
            const ext   = (path.extname(file.originalname) || '.png').toLowerCase();
            cb(null, kind + '-' + orgId + '-' + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },          // 5 MB max
    fileFilter: (req, file, cb) => {
        const ok = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']
            .includes((path.extname(file.originalname) || '').toLowerCase());
        cb(ok ? null : new Error('Only PNG / JPG / WEBP / GIF / SVG allowed'), ok);
    },
});

// POS Screen (full-screen, no layout)
exports.index = (req, res) => {
    const u = req.session && req.session.user || {};
    const user = {
        id: u.id || null,
        name: u.name || u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'User',
        role: u.role_name || u.role || (u.is_super_admin ? 'Super Admin' : 'Operator'),
        email: u.email || '',
    };
    res.render('pos/index', { page_title: 'POS', activeLink: 'pos', user });
};

// POS UI-Kit / theme editor (full-screen, no layout) — authenticated
exports.uikitPage = async (req, res) => {
    let theme = {};
    try {
        const r = await api.get('/pos/theme', req.session.token);
        if (r && r.status === 200 && r.data && r.data.theme) theme = r.data.theme;
    } catch (_) { theme = {}; }
    res.render('pos/uikit', { page_title: 'POS · UI Kit', activeLink: 'pos', savedTheme: theme });
};
exports.themeGet = async (req, res) => { res.json(await api.get('/pos/theme', req.session.token)); };
exports.themeUpdate = async (req, res) => { res.json(await api.put('/pos/theme', req.body, req.session.token)); };

// Printer assignments
exports.printersGet = async (req, res) => { res.json(await api.get('/pos/printers', req.session.token)); };
exports.printersUpdate = async (req, res) => { res.json(await api.put('/pos/printers', req.body, req.session.token)); };

// Printer settings page — render fast, let the JS fetch printers async
exports.printerSettingsPage = (req, res) => {
    res.render('pos/printer-settings', { page_title: 'POS · Printer Settings', activeLink: 'pos-printer-settings', savedPrinters: {} });
};

// Proxies
exports.products = async (req, res) => { res.json(await api.get('/pos/products', req.session.token, req.query)); };
exports.catalogCounts = async (req, res) => { res.json(await api.get('/pos/catalog-counts', req.session.token, req.query)); };
exports.vehicleParts = async (req, res) => { res.json(await api.get('/pos/vehicle/' + req.params.uuid + '/parts', req.session.token, req.query)); };
exports.validateStock = async (req, res) => { res.json(await api.post('/pos/validate-stock', req.body, req.session.token)); };
exports.checkout = async (req, res) => { res.json(await api.post('/pos/checkout', req.body, req.session.token)); };
exports.releaseHolds = async (req, res) => { res.json(await api.post('/pos/release-holds', req.body, req.session.token)); };
exports.activeStockHolds = async (req, res) => { res.json(await api.get('/pos/stock-holds/active', req.session.token)); };
exports.invoiceSettingsGet = async (req, res) => { res.json(await api.get('/pos/invoice-settings', req.session.token)); };
exports.invoiceSettingsUpdate = async (req, res) => { res.json(await api.put('/pos/invoice-settings', req.body, req.session.token)); };

// Payment gateway proxies
exports.paymentConfigGet = async (req, res) => { res.json(await api.get('/pos/payment/config', req.session.token)); };
exports.paymentConfigUpdate = async (req, res) => { res.json(await api.put('/pos/payment/config', req.body, req.session.token)); };
exports.paymentInit = async (req, res) => { res.json(await api.post('/pos/payment/init', req.body, req.session.token)); };
exports.paymentLink = async (req, res) => { res.json(await api.post('/pos/payment/link', req.body, req.session.token)); };
exports.paymentVerify = async (req, res) => { res.json(await api.post('/pos/payment/verify', req.body, req.session.token)); };
exports.paymentCancel = async (req, res) => { res.json(await api.post('/pos/payment/cancel', req.body, req.session.token)); };
exports.paymentStatus = async (req, res) => { res.json(await api.get('/pos/payment/status/' + req.params.uuid, req.session.token)); };
exports.paymentGateways = async (req, res) => { res.json(await api.get('/pos/payment/gateways', req.session.token)); };
exports.paymentPendingList = async (req, res) => { res.json(await api.get('/pos/payment/pending', req.session.token, req.query)); };
exports.paymentRollback = async (req, res) => { res.json(await api.post('/pos/payment/' + req.params.uuid + '/rollback', req.body, req.session.token)); };
// ── Wallet ──
exports.walletPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    const opts = { page_title: 'Wallet · Wholesale credit', activeLink: 'pos-wallet', breadcrumbs: [] };
    if (isSpa) res.render('pos/wallet', { ...opts, layout: false, _spa: true });
    else       res.render('pos/wallet', opts);
};
// Add / Edit Wholesale Wallet — handles both:
//   GET /sales/wallet/add            (no uuid → blank form, customer picker enabled)
//   GET /sales/wallet/edit/:uuid     (uuid    → load that customer, picker locked)
//
// All the data loading happens client-side via the existing /sales/wallet/customers/:uuid
// JSON endpoint. This controller just renders the shell with the page mode + uuid.
exports.walletEditPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    const uuid = req.params.uuid || '';
    const opts = {
        page_title: uuid ? 'Edit Wholesale Wallet' : 'Add Wholesale Wallet',
        activeLink: 'pos-wallet',
        walletUuid: uuid,
        breadcrumbs: [],
    };
    if (isSpa) res.render('pos/wallet-edit', { ...opts, layout: false, _spa: true });
    else       res.render('pos/wallet-edit', opts);
};
exports.walletStats         = async (req, res) => { res.json(await api.get('/pos/wallet/stats', req.session.token)); };
exports.walletCustomers     = async (req, res) => { res.json(await api.get('/pos/wallet/customers', req.session.token, req.query)); };
exports.walletCustomer      = async (req, res) => { res.json(await api.get('/pos/wallet/customers/' + req.params.uuid, req.session.token)); };
exports.walletEnable        = async (req, res) => { res.json(await api.post('/pos/wallet/customers/' + req.params.uuid + '/enable',   req.body, req.session.token)); };
exports.walletGrant         = async (req, res) => { res.json(await api.post('/pos/wallet/customers/' + req.params.uuid + '/grant',    req.body, req.session.token)); };
exports.walletRecordPayment = async (req, res) => { res.json(await api.post('/pos/wallet/customers/' + req.params.uuid + '/payment',  req.body, req.session.token)); };
exports.walletAdjust        = async (req, res) => { res.json(await api.post('/pos/wallet/customers/' + req.params.uuid + '/adjust',   req.body, req.session.token)); };
exports.walletOnlineLink    = async (req, res) => { res.json(await api.post('/pos/wallet/customers/' + req.params.uuid + '/online-link', req.body, req.session.token)); };
exports.walletSettings      = async (req, res) => { res.json(await api.get ('/pos/wallet/settings', req.session.token)); };
exports.walletSettingsUpd   = async (req, res) => { res.json(await api.put ('/pos/wallet/settings', req.body, req.session.token)); };
exports.walletRecent        = async (req, res) => { res.json(await api.get ('/pos/wallet/transactions/recent', req.session.token)); };

exports.paymentsPendingPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    const opts = { page_title: 'Pending Payments', activeLink: 'pos-payments-pending', breadcrumbs: [] };
    if (isSpa) res.render('pos/payments-pending', { ...opts, layout: false, _spa: true });
    else       res.render('pos/payments-pending', opts);
};
exports.dashboard = async (req, res) => { res.json(await api.get('/pos/dashboard', req.session.token)); };
exports.taxes = async (req, res) => { res.json(await api.get('/pos/taxes', req.session.token)); };
exports.warehouses = async (req, res) => { res.json(await api.get('/pos/warehouses', req.session.token)); };

// Orders
exports.ordersPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    if (isSpa) res.render('pos/orders', { page_title: 'Sales Orders', activeLink: 'pos-orders', breadcrumbs: [], layout: false, _spa: true });
    else res.render('pos/orders', { page_title: 'Sales Orders', activeLink: 'pos-orders', breadcrumbs: [] });
};
exports.ordersPaginate = async (req, res) => { res.json(await api.post('/pos/orders/paginate', req.body, req.session.token)); };
exports.orderShow = async (req, res) => { res.json(await api.get('/pos/orders/' + req.params.uuid, req.session.token)); };

// GET /sales/orders/:uuid/receipt-escpos
// Builds an ESC/POS byte string from the order + receipt settings + invoice
// profile, then ships it to the caller as text/plain. Frontend POSTs the
// returned string to the local print agent's /print-to endpoint.
exports.orderReceiptEscpos = async (req, res) => {
    const uuid = req.params.uuid;
    const [orderRes, settingsRes, invoiceRes] = await Promise.all([
        api.get('/pos/orders/' + uuid, req.session.token),
        api.get('/pos/settings',       req.session.token),
        api.get('/pos/invoice-settings', req.session.token),
    ]);
    if (!orderRes || orderRes.status !== 200 || !orderRes.data) {
        return res.status(404).type('text/plain').send('Order not found');
    }
    const o = orderRes.data;
    const s = (settingsRes && settingsRes.data) || {};
    const inv = (invoiceRes && invoiceRes.data) || {};

    const ESC = '\x1b', GS = '\x1d';
    const INIT      = ESC + '@';
    const ALIGN_L   = ESC + 'a' + '\x00';
    const ALIGN_C   = ESC + 'a' + '\x01';
    const ALIGN_R   = ESC + 'a' + '\x02';
    const SIZE_NORM = ESC + '!' + '\x00';
    const SIZE_BIG  = ESC + '!' + '\x30';     // 2x width + 2x height
    const SIZE_TALL = ESC + '!' + '\x10';     // 1x width + 2x height
    const BOLD_ON   = ESC + 'E' + '\x01';
    const BOLD_OFF  = ESC + 'E' + '\x00';
    const CUT       = GS  + 'V' + '\x00';     // full cut
    const FEED3     = '\n\n\n';

    const COLS = 32;                          // 80mm at standard font
    const SEP  = '-'.repeat(COLS);

    // Settings → display values (overrides → org row).
    const pick = (key, fallback) => (s[key] && String(s[key]).trim()) ? String(s[key]) : (fallback || '');
    const on   = (key, def) => {
        const v = s[key];
        if (v == null || v === '') return def !== false;
        return v === '1' || v === true || v === 'true';
    };
    const company = pick('pos_receipt_company_name', inv.legal_name || inv.company_name || 'Your Company');
    const tagline = pick('pos_receipt_tagline', '');
    const address = pick('pos_receipt_address', inv.billing_address || inv.address || '');
    const city    = pick('pos_receipt_city', '');
    const pincode = pick('pos_receipt_pincode', inv.zip_code || '');
    const phone   = pick('pos_receipt_phone',   inv.phone || '');
    const altPh   = pick('pos_receipt_alt_mobile', '');
    const taxLine = pick('pos_receipt_tax_line', inv.gst_number ? ('GSTIN: ' + inv.gst_number) : '');
    const counter = pick('pos_receipt_counter_no', '');
    const headerTxt = s.pos_receipt_header || '';
    const footerTxt = s.pos_receipt_footer || '';
    const thanks    = s.pos_receipt_thank_you || 'Thank you for your business!';
    const policy    = s.pos_receipt_return_policy || '';
    const terms     = s.pos_receipt_terms || '';
    const upiId     = s.pos_receipt_upi_id || '';
    const currency  = s.pos_receipt_currency_symbol || 'Rs.';

    // Visibility toggles
    const showGst       = on('pos_receipt_show_gst');
    const showCustomer  = on('pos_receipt_show_customer');
    const showCashier   = on('pos_receipt_show_cashier');
    const showInvNum    = on('pos_receipt_show_invoice_number');
    const showDisc      = on('pos_receipt_show_discount');
    const showTaxBd     = on('pos_receipt_show_tax_breakdown');
    const showPay       = on('pos_receipt_show_payment_method');
    const showTerms     = on('pos_receipt_show_terms', false);

    // ── Helpers ────────────────────────────────────────────────────
    function padR(s, n) { s = String(s || ''); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); }
    function padL(s, n) { s = String(s || ''); return s.length >= n ? s.slice(-n) : ' '.repeat(n - s.length) + s; }
    function center(s) {
        s = String(s || '');
        if (s.length >= COLS) return s.slice(0, COLS);
        const pad = Math.floor((COLS - s.length) / 2);
        return ' '.repeat(pad) + s;
    }
    function wrap(s, width) {
        // Word-wrap a long line into multiple <= width-char lines.
        s = String(s || '');
        if (!s) return [];
        const out = [];
        const words = s.split(/\s+/);
        let cur = '';
        for (const w of words) {
            if ((cur + ' ' + w).trim().length > width) {
                if (cur) out.push(cur);
                cur = w;
            } else {
                cur = cur ? cur + ' ' + w : w;
            }
        }
        if (cur) out.push(cur);
        return out;
    }
    function row2(left, right) {
        // "left .................. right" within COLS chars, both clipped.
        const r = String(right || '');
        const l = String(left || '');
        const space = Math.max(1, COLS - l.length - r.length);
        if (l.length + r.length >= COLS) return l.slice(0, COLS - r.length - 1) + ' ' + r;
        return l + ' '.repeat(space) + r;
    }
    function fmtMoney(n) { return Number(n || 0).toFixed(2); }

    const items = Array.isArray(o.items) ? o.items : [];
    const created = o.created_at ? new Date(o.created_at) : new Date();
    function dt() {
        const dd = String(created.getDate()).padStart(2,'0');
        const mm = String(created.getMonth()+1).padStart(2,'0');
        const yy = created.getFullYear();
        let h = created.getHours(); const mi = String(created.getMinutes()).padStart(2,'0');
        const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
        return { date: dd + '-' + mm + '-' + yy, time: String(h).padStart(2,'0') + ':' + mi + ' ' + ap };
    }
    const t = dt();

    // ── Build the ESC/POS payload ──────────────────────────────────
    let out = INIT;

    // Header — company block
    out += ALIGN_C + SIZE_BIG + BOLD_ON + company + '\n' + BOLD_OFF + SIZE_NORM;
    if (tagline)  out += ALIGN_C + tagline + '\n';
    if (address)  out += wrap(address.replace(/\n/g, ', '), COLS).map(l => ALIGN_C + l + '\n').join('');
    if (city || pincode) out += ALIGN_C + [city, pincode].filter(Boolean).join(' ') + '\n';
    if (phone || altPh)  out += ALIGN_C + 'Mo: ' + [phone, altPh].filter(Boolean).join(' / ') + '\n';
    if (showGst && taxLine) out += ALIGN_C + taxLine + '\n';
    if (headerTxt)          out += ALIGN_C + headerTxt + '\n';
    out += ALIGN_L + SEP + '\n';

    // Bill info
    if (showInvNum) out += row2('Bill: ' + (o.order_number || ''), 'Date: ' + t.date) + '\n';
    else            out += row2('', 'Date: ' + t.date) + '\n';
    out += row2('Time: ' + t.time, showCashier ? ('User: ' + (o._cashier_name || (req.session && req.session.user && req.session.user.name) || '')) : '') + '\n';
    if (counter)   out += 'Counter: ' + counter + '\n';

    // Customer
    if (showCustomer) {
        out += SEP + '\n';
        const cust = o.customer || {};
        const custName = cust.name || o.customer_name || 'Walk-in';
        out += 'Customer: ' + custName + '\n';
        if (cust.phone) out += 'Mobile  : ' + cust.phone + '\n';
        if (cust.gst_number) out += 'GSTIN   : ' + cust.gst_number + '\n';
    }

    out += SEP + '\n';
    // Items header
    out += BOLD_ON + padR('Item', COLS - 18) + padL('Qty', 4) + padL('Rate', 7) + padL('Amt', 7) + '\n' + BOLD_OFF;
    out += SEP + '\n';

    // Item rows
    for (const it of items) {
        const name = String(it.item_name || '');
        const qty  = String(it.quantity || 0);
        const rate = fmtMoney(it.unit_price);
        const amt  = fmtMoney(it.total_price);
        // Wrap name to fit in (COLS - 18) chars; first line includes qty/rate/amt.
        const nameLines = wrap(name, COLS - 18) || [''];
        out += padR(nameLines[0], COLS - 18) + padL(qty, 4) + padL(rate, 7) + padL(amt, 7) + '\n';
        for (let i = 1; i < nameLines.length; i++) out += '  ' + nameLines[i] + '\n';
    }

    out += SEP + '\n';
    // Totals
    out += row2('Subtotal',          currency + ' ' + fmtMoney(o.subtotal)) + '\n';
    if (showDisc && Number(o.discount_amount) > 0) {
        out += row2('Discount',      '- ' + currency + ' ' + fmtMoney(o.discount_amount)) + '\n';
    }
    if (Number(o.tax_total) > 0) {
        if (showTaxBd && o.tax_breakdown) {
            let tb = o.tax_breakdown;
            if (typeof tb === 'string') { try { tb = JSON.parse(tb); } catch (e) { tb = []; } }
            if (Array.isArray(tb)) {
                for (const tx of tb) {
                    out += row2('  ' + tx.tax_name, currency + ' ' + fmtMoney(tx.amount)) + '\n';
                }
            } else {
                out += row2('Tax',   currency + ' ' + fmtMoney(o.tax_total)) + '\n';
            }
        } else {
            out += row2('Tax',       currency + ' ' + fmtMoney(o.tax_total)) + '\n';
        }
    }
    out += SEP + '\n';
    out += BOLD_ON + SIZE_TALL + row2('TOTAL', currency + ' ' + fmtMoney(o.total_amount)) + '\n' + SIZE_NORM + BOLD_OFF;

    // Payment
    if (showPay) {
        out += SEP + '\n';
        out += row2('Payment',  String(o.payment_method || '').toUpperCase()) + '\n';
        out += row2('Paid',     currency + ' ' + fmtMoney(o.amount_paid)) + '\n';
        if (Number(o.amount_due) > 0) {
            out += row2('Balance Due', currency + ' ' + fmtMoney(o.amount_due)) + '\n';
        } else if (Number(o.amount_paid) > Number(o.total_amount)) {
            out += row2('Change', currency + ' ' + fmtMoney(Number(o.amount_paid) - Number(o.total_amount))) + '\n';
        }
    }

    // UPI line
    if (upiId) {
        out += SEP + '\n';
        out += ALIGN_C + 'UPI: ' + upiId + '\n' + ALIGN_L;
    }

    out += SEP + '\n';
    if (thanks) out += ALIGN_C + BOLD_ON + thanks + '\n' + BOLD_OFF + ALIGN_L;
    if (policy) {
        for (const ln of wrap(policy, COLS)) out += ALIGN_C + ln + '\n';
        out += ALIGN_L;
    }
    if (showTerms && terms) {
        out += SEP + '\n';
        for (const ln of wrap(terms, COLS)) out += ln + '\n';
    }
    if (footerTxt) {
        out += SEP + '\n';
        for (const ln of wrap(footerTxt, COLS)) out += ALIGN_C + ln + '\n';
        out += ALIGN_L;
    }

    out += FEED3 + CUT;

    res.type('text/plain').send(out);
};

// GET /sales/orders/:uuid/view  →  renders the POS-style detail page.
// Pulls the order + receipt settings + invoice profile in one shot so the
// page can render company block, parts table, and totals without an extra
// AJAX round-trip.
exports.orderDetailPage = async (req, res) => {
    const uuid = req.params.uuid;
    const [orderRes, settingsRes, invoiceRes] = await Promise.all([
        api.get('/pos/orders/' + uuid, req.session.token),
        api.get('/pos/settings',       req.session.token),
        api.get('/pos/invoice-settings', req.session.token),
    ]);
    if (!orderRes || orderRes.status !== 200 || !orderRes.data) {
        req.flash && req.flash('error', 'Order not found.');
        return res.redirect('/sales/orders');
    }
    res.render('pos/order-detail', {
        page_title: 'Order ' + (orderRes.data.order_number || uuid),
        activeLink: 'pos-orders',
        order:    orderRes.data,
        settings: (settingsRes && settingsRes.data) || {},
        invoice:  (invoiceRes  && invoiceRes.data)  || {},
        breadcrumbs: [
            { name: 'POS', url: '/sales' },
            { name: 'Orders', url: '/sales/orders' },
            { name: orderRes.data.order_number || 'Order', url: '' },
        ],
    });
};
exports.orderCancel = async (req, res) => { res.json(await api.post('/pos/orders/' + req.params.uuid + '/cancel', {}, req.session.token)); };
async function proxyPdf(apiPath, req, res, fallbackName) {
    try {
        const axios = require('axios');
        const API_URL = process.env.API_URL || 'http://localhost:3000/api';
        const response = await axios.get(API_URL + apiPath, { headers: { Authorization: 'Bearer ' + req.session.token }, responseType: 'arraybuffer' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', response.headers['content-disposition'] || ('inline; filename="' + fallbackName + '"'));
        res.send(Buffer.from(response.data));
    } catch (err) { res.status(500).json({ status: 500, message: 'Failed.' }); }
}
exports.orderInvoice = (req, res) => proxyPdf('/pos/orders/' + req.params.uuid + '/invoice', req, res, 'invoice.pdf');
// Demo A4 preview — no order id, pulls sample data on the API side.
// Linked from the Receipts/Thermal section in /sales/settings.
exports.invoicePreview = (req, res) => proxyPdf('/pos/invoice-preview', req, res, 'invoice-preview.pdf');
exports.orderInvoiceThermal = (req, res) => proxyPdf('/pos/orders/' + req.params.uuid + '/invoice/thermal', req, res, 'receipt.pdf');
exports.orderInvoiceEmail = async (req, res) => { res.json(await api.post('/pos/orders/' + req.params.uuid + '/invoice/email', req.body, req.session.token)); };
exports.orderPayment = async (req, res) => { res.json(await api.post('/pos/orders/' + req.params.uuid + '/payment', req.body, req.session.token)); };
exports.ordersExport = async (req, res) => { res.json(await api.post('/pos/orders/export', req.body, req.session.token)); };

// Customers
exports.customersPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    if (isSpa) res.render('pos/customers', { page_title: 'Customers', activeLink: 'pos-customers', breadcrumbs: [], layout: false, _spa: true });
    else res.render('pos/customers', { page_title: 'Customers', activeLink: 'pos-customers', breadcrumbs: [] });
};
exports.customersPaginate = async (req, res) => { res.json(await api.post('/pos/customers/paginate', req.body, req.session.token)); };
exports.customerSearch = async (req, res) => { res.json(await api.get('/pos/customers/search', req.session.token, req.query)); };
exports.customerShow = async (req, res) => { res.json(await api.get('/pos/customers/' + req.params.uuid, req.session.token)); };
exports.customerStore = async (req, res) => { res.json(await api.post('/pos/customers', req.body, req.session.token)); };
exports.customerUpdate = async (req, res) => { res.json(await api.put('/pos/customers/' + req.params.uuid, req.body, req.session.token)); };
exports.customerDestroy = async (req, res) => { res.json(await api.del('/pos/customers/' + req.params.uuid, req.session.token)); };

// Settings
exports.settingsPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    if (isSpa) res.render('pos/settings', { page_title: 'POS Settings', activeLink: 'pos-settings', breadcrumbs: [], layout: false, _spa: true });
    else res.render('pos/settings', { page_title: 'POS Settings', activeLink: 'pos-settings', breadcrumbs: [] });
};
exports.settingsGet = async (req, res) => { res.json(await api.get('/pos/settings', req.session.token)); };
exports.settingsUpdate = async (req, res) => { res.json(await api.put('/pos/settings', req.body, req.session.token)); };
// Proxy: peek the next invoice number for draft-printing in the POS UI.
exports.nextInvoiceNumber = async (req, res) => { res.json(await api.get('/pos/next-invoice-number', req.session.token)); };

// ── Order Drafts ("Save as Draft" feature) ─────────────────────
exports.draftsPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    if (isSpa) res.render('pos/drafts', { page_title: 'Saved Drafts', activeLink: 'pos-drafts', breadcrumbs: [], layout: false, _spa: true });
    else       res.render('pos/drafts', { page_title: 'Saved Drafts', activeLink: 'pos-drafts', breadcrumbs: [] });
};
exports.draftList     = async (req, res) => { res.json(await api.get('/pos/drafts', req.session.token)); };
exports.draftCreate   = async (req, res) => { res.json(await api.post('/pos/drafts', req.body, req.session.token)); };
exports.draftShow     = async (req, res) => { res.json(await api.get('/pos/drafts/' + req.params.uuid, req.session.token)); };
exports.draftUpdate   = async (req, res) => { res.json(await api.put('/pos/drafts/' + req.params.uuid, req.body, req.session.token)); };
exports.draftDestroy  = async (req, res) => { res.json(await api.del('/pos/drafts/' + req.params.uuid, req.session.token)); };

// POST /sales/settings/upload/:kind  (kind = logo | qr | signature | biz_signature | biz_quality)
// Multipart file upload. Saves to /public/uploads/settings/, then PUTs the
// resulting URL into the matching field — either a `pos_receipt_*_url`
// setting (thermal receipt assets) or an `organizations.*` column
// (A4-invoice assets like signature_url, quality_badge_image).
exports.settingsUpload = [settingsUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.json({ status: 422, message: 'No file uploaded.' });
        const kind = (req.params.kind || '').toLowerCase();

        // Map kind → { target, field }. `target` is 'setting' (per-org/user
        // settings table) or 'invoice' (organizations columns updated via
        // the invoice-settings endpoint).
        const map = {
            logo:           { target: 'setting', field: 'pos_receipt_logo_url' },
            qr:             { target: 'setting', field: 'pos_receipt_qr_image_url' },
            signature:      { target: 'setting', field: 'pos_receipt_signature_url' },
            biz_signature:  { target: 'invoice', field: 'signature_url' },
            biz_quality:    { target: 'invoice', field: 'quality_badge_image' },
        };
        const cfg = map[kind];
        if (!cfg) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
            return res.json({ status: 422, message: 'Unknown upload kind: ' + kind });
        }
        const url = '/uploads/settings/' + req.file.filename;
        const update = {}; update[cfg.field] = url;

        const r = (cfg.target === 'invoice')
            ? await api.put('/pos/invoice-settings', update, req.session.token)
            : await api.put('/pos/settings',         update, req.session.token);

        if (!r || r.status !== 200) {
            return res.json({ status: (r && r.status) || 500, message: (r && r.message) || 'Saved file but failed to update setting.' });
        }
        return res.json({ status: 200, message: 'Uploaded.', data: { url, key: cfg.field } });
    } catch (err) {
        return res.json({ status: 500, message: err.message || 'Upload failed.' });
    }
}];

// Receipt preview / Live print
//   /sales/receipt-preview               → preview with sample data
//   /sales/receipt-preview?order=<uuid>  → live receipt for a saved order
//   &print_type=duplicate                → flips the "Original / Duplicate" stamp
//
// Pulls receipt settings + org invoice profile + (optionally) the order
// payload and feeds them all into the receipt EJS.
exports.receiptPreview = async (req, res) => {
    const orderUuid = req.query.order || '';
    const printType = req.query.print_type || '';

    const [settingsRes, invoiceRes, orderRes] = await Promise.all([
        api.get('/pos/settings', req.session.token),
        api.get('/pos/invoice-settings', req.session.token),
        orderUuid ? api.get('/pos/orders/' + orderUuid, req.session.token) : Promise.resolve(null),
    ]);
    const settings = (settingsRes && settingsRes.data) || {};
    const invoice  = (invoiceRes  && invoiceRes.data)  || {};

    let order = null, customer = null;
    if (orderRes && orderRes.status === 200 && orderRes.data) {
        order    = orderRes.data;
        customer = order.customer || (order._customer ? order._customer : null);
    }

    res.render('pos/receipt-preview', {
        layout: false,
        settings,
        invoice,
        order,
        customer,
        org: req.session.organization || {},
        printType: printType || (settings.pos_receipt_default_print_type || 'original'),
        printCount: parseInt(req.query.print_count) || 1,
        page_title: order ? ('Receipt — ' + (order.order_number || orderUuid)) : 'Receipt Preview',
    });
};

// Detail views — single API call (view already includes images, locations, refs, damages, attribute_values)
// Barcode scan — find parts by internal_id, optionally with unit_number
exports.barcodeScan = async (req, res) => {
    try {
        const { scan_value } = req.query;
        if (!scan_value) return res.json({ status: 422, message: 'No scan value.' });

        // Parse: "INTERNAL_ID" or "INTERNAL_ID|UNIT_NUM"
        const parts = scan_value.split('|');
        const internalId = parts[0];
        const unitNum = parts[1] ? parseInt(parts[1]) : null;

        // Search by exact internal_id
        const r = await api.get('/pos/products', req.session.token, {
            type: 'part', search: internalId, per_page: 50
        });
        if (!r || r.status !== 200 || !r.data || !r.data.parts) {
            return res.json({ status: 404, message: 'Part not found.' });
        }

        // Filter exact match on internal_id
        const matches = r.data.parts.filter(p =>
            (p.part_internal_id || '').toLowerCase() === internalId.toLowerCase()
        );
        if (!matches.length) return res.json({ status: 404, message: 'Part "' + internalId + '" not found.' });

        // For each match, get available units
        const results = [];
        for (const m of matches) {
            const detail = await api.get('/part-inventories/' + m.uuid + '/view', req.session.token);
            if (detail && detail.status === 200 && detail.data) {
                let locs = (detail.data.locations || []).filter(l => !l.unit_status || parseInt(l.unit_status) === 1);
                // If specific unit requested, filter to that unit only
                if (unitNum) locs = locs.filter(l => parseInt(l.unit_number) === unitNum);
                if (locs.length) {
                    results.push({
                        id: m.id, uuid: m.uuid, name: m.catalog_name || m.part_code || 'Part',
                        code: m.part_code || '', internal_id: m.part_internal_id || '',
                        price: m.display_price, quantity: parseInt(m.quantity) || 0,
                        vat_included: !!detail.data.vat_included,
                        units: locs.map(l => ({
                            unit_number: l.unit_number, warehouse_id: l.warehouse_id || 0,
                            location_code: l.location_code || '', warehouse_name: l.warehouse_name || ''
                        }))
                    });
                }
            }
        }

        if (!results.length) {
            return res.json({ status: 404, message: unitNum
                ? 'Unit #' + unitNum + ' not available for "' + internalId + '".'
                : 'No available units for "' + internalId + '".'
            });
        }

        return res.json({ status: 200, data: results, unit_filter: unitNum });
    } catch (e) { res.json({ status: 500, message: 'Scan failed.' }); }
};

exports.partDetail = async (req, res) => {
    try {
        const [r, holds] = await Promise.all([
            api.get('/part-inventories/' + req.params.uuid + '/view', req.session.token),
            api.get('/pos/stock-holds/active', req.session.token),
        ]);
        if (r && r.status === 200 && r.data) {
            const heldByOther = (holds && holds.status === 200 && holds.data && holds.data.parts) || {};
            const heldByMe    = (holds && holds.status === 200 && holds.data && holds.data.mine && holds.data.mine.parts) || {};
            if (r.data.locations) {
                // Hide sold units (unit_status=2) and units locked by OTHER cashiers
                r.data.locations = r.data.locations.filter(l => {
                    if (l.unit_status && parseInt(l.unit_status) !== 1) return false;
                    const k = r.data.id + '_' + l.unit_number;
                    if (heldByOther[k]) return false;
                    return true;
                });
                // Annotate units held by THIS user so the UI can show them as "held by you"
                r.data.locations.forEach(l => {
                    const k = r.data.id + '_' + l.unit_number;
                    if (heldByMe[k]) l._held_by_me = true;
                });
            }
        }
        res.json({ status: (r && r.status === 200) ? 200 : 404, data: (r && r.data) || null });
    } catch (e) { res.json({ status: 500, message: 'Failed.' }); }
};
exports.vehicleDetail = async (req, res) => { res.json(await api.get('/vehicle-inventories/' + req.params.uuid, req.session.token)); };

// Returns
exports.returnsPage = (req, res) => {
    const isSpa = !!(req.xhr || req.headers['x-spa'] === '1');
    if (isSpa) res.render('pos/returns', { page_title: 'Returns', activeLink: 'pos-returns', breadcrumbs: [], layout: false, _spa: true });
    else res.render('pos/returns', { page_title: 'Returns', activeLink: 'pos-returns', breadcrumbs: [] });
};
exports.returnCreate = async (req, res) => { res.json(await api.post('/pos/returns', req.body, req.session.token)); };
exports.returnsPaginate = async (req, res) => { res.json(await api.post('/pos/returns/paginate', req.body, req.session.token)); };
exports.returnShow = async (req, res) => { res.json(await api.get('/pos/returns/' + req.params.uuid, req.session.token)); };
