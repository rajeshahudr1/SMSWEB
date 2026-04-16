'use strict';
const api = require('../helpers/api');

// POS Screen (full-screen, no layout)
exports.index = (req, res) => {
    res.render('pos/index', { page_title: 'POS', activeLink: 'pos' });
};

// Proxies
exports.products = async (req, res) => { res.json(await api.get('/pos/products', req.session.token, req.query)); };
exports.vehicleParts = async (req, res) => { res.json(await api.get('/pos/vehicle/' + req.params.uuid + '/parts', req.session.token)); };
exports.validateStock = async (req, res) => { res.json(await api.post('/pos/validate-stock', req.body, req.session.token)); };
exports.checkout = async (req, res) => { res.json(await api.post('/pos/checkout', req.body, req.session.token)); };
exports.dashboard = async (req, res) => { res.json(await api.get('/pos/dashboard', req.session.token)); };
exports.warehouses = async (req, res) => { res.json(await api.get('/pos/warehouses', req.session.token)); };

// Orders
exports.ordersPage = (req, res) => { res.render('pos/orders', { page_title: 'Sales Orders', activeLink: 'pos-orders', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Orders', url: '' }] }); };
exports.ordersPaginate = async (req, res) => { res.json(await api.post('/pos/orders/paginate', req.body, req.session.token)); };
exports.orderShow = async (req, res) => { res.json(await api.get('/pos/orders/' + req.params.uuid, req.session.token)); };
exports.orderCancel = async (req, res) => { res.json(await api.post('/pos/orders/' + req.params.uuid + '/cancel', {}, req.session.token)); };
exports.orderInvoice = async (req, res) => {
    try {
        const axios = require('axios');
        const API_URL = process.env.API_URL || 'http://localhost:3000/api';
        const response = await axios.get(API_URL + '/pos/orders/' + req.params.uuid + '/invoice', { headers: { Authorization: 'Bearer ' + req.session.token }, responseType: 'arraybuffer' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'attachment; filename="invoice.pdf"');
        res.send(Buffer.from(response.data));
    } catch (err) { res.status(500).json({ status: 500, message: 'Failed.' }); }
};
exports.orderPayment = async (req, res) => { res.json(await api.post('/pos/orders/' + req.params.uuid + '/payment', req.body, req.session.token)); };
exports.ordersExport = async (req, res) => { res.json(await api.post('/pos/orders/export', req.body, req.session.token)); };

// Customers
exports.customersPage = (req, res) => { res.render('pos/customers', { page_title: 'Customers', activeLink: 'pos-customers', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Customers', url: '' }] }); };
exports.customersPaginate = async (req, res) => { res.json(await api.post('/pos/customers/paginate', req.body, req.session.token)); };
exports.customerSearch = async (req, res) => { res.json(await api.get('/pos/customers/search', req.session.token, req.query)); };
exports.customerShow = async (req, res) => { res.json(await api.get('/pos/customers/' + req.params.uuid, req.session.token)); };
exports.customerStore = async (req, res) => { res.json(await api.post('/pos/customers', req.body, req.session.token)); };
exports.customerUpdate = async (req, res) => { res.json(await api.put('/pos/customers/' + req.params.uuid, req.body, req.session.token)); };
exports.customerDestroy = async (req, res) => { res.json(await api.del('/pos/customers/' + req.params.uuid, req.session.token)); };

// Settings
exports.settingsPage = (req, res) => { res.render('pos/settings', { page_title: 'POS Settings', activeLink: 'pos-settings', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'POS Settings', url: '' }] }); };
exports.settingsGet = async (req, res) => { res.json(await api.get('/pos/settings', req.session.token)); };
exports.settingsUpdate = async (req, res) => { res.json(await api.put('/pos/settings', req.body, req.session.token)); };

// Detail views — single API call (view already includes images, locations, refs, damages, attribute_values)
exports.partDetail = async (req, res) => {
    try {
        const r = await api.get('/part-inventories/' + req.params.uuid + '/view', req.session.token);
        res.json({ status: (r && r.status === 200) ? 200 : 404, data: (r && r.data) || null });
    } catch (e) { res.json({ status: 500, message: 'Failed.' }); }
};
exports.vehicleDetail = async (req, res) => { res.json(await api.get('/vehicle-inventories/' + req.params.uuid, req.session.token)); };

// Returns
exports.returnsPage = (req, res) => { res.render('pos/returns', { page_title: 'Returns', activeLink: 'pos-returns', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Returns', url: '' }] }); };
exports.returnCreate = async (req, res) => { res.json(await api.post('/pos/returns', req.body, req.session.token)); };
exports.returnsPaginate = async (req, res) => { res.json(await api.post('/pos/returns/paginate', req.body, req.session.token)); };
exports.returnShow = async (req, res) => { res.json(await api.get('/pos/returns/' + req.params.uuid, req.session.token)); };
