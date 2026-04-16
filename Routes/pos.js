'use strict';
const express = require('express');
const router = express.Router();
const Ctrl = require('../Controllers/PosController');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

// POS Screen
router.get('/', Ctrl.index);
router.get('/products', Ctrl.products);
router.get('/vehicle/:uuid/parts', Ctrl.vehicleParts);
router.post('/validate-stock', Ctrl.validateStock);
router.post('/checkout', Ctrl.checkout);
router.get('/dashboard-data', Ctrl.dashboard);
router.get('/warehouses', Ctrl.warehouses);

// Orders
router.get('/orders', Ctrl.ordersPage);
router.post('/orders/paginate', Ctrl.ordersPaginate);
router.post('/orders/export', Ctrl.ordersExport);
router.get('/orders/:uuid', Ctrl.orderShow);
router.post('/orders/:uuid/cancel', Ctrl.orderCancel);
router.post('/orders/:uuid/payment', Ctrl.orderPayment);
router.get('/orders/:uuid/invoice', Ctrl.orderInvoice);

// Customers
router.get('/customers', Ctrl.customersPage);
router.post('/customers/paginate', Ctrl.customersPaginate);
router.get('/customers/search', Ctrl.customerSearch);
router.get('/customers/:uuid', Ctrl.customerShow);
router.post('/customers', Ctrl.customerStore);
router.put('/customers/:uuid', Ctrl.customerUpdate);
router.delete('/customers/:uuid', Ctrl.customerDestroy);

// Detail views
router.get('/part-detail/:uuid', Ctrl.partDetail);
router.get('/vehicle-detail/:uuid', Ctrl.vehicleDetail);

// Settings
router.get('/settings', Ctrl.settingsPage);
router.get('/settings/data', Ctrl.settingsGet);
router.put('/settings', Ctrl.settingsUpdate);

// Returns
router.get('/returns', Ctrl.returnsPage);
router.post('/returns', Ctrl.returnCreate);
router.post('/returns/paginate', Ctrl.returnsPaginate);
router.get('/returns/:uuid', Ctrl.returnShow);

module.exports = router;
