'use strict';
const api = require('../helpers/api');

// POS Screen (full-screen, no layout)
exports.index = (req, res) => {
    res.render('pos/index', { page_title: 'POS', activeLink: 'pos' });
};

// Proxies
exports.products = async (req, res) => { res.json(await api.get('/pos/products', req.session.token, req.query)); };
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
