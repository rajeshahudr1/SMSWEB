'use strict';
const express = require('express');
const router = express.Router();
const Ctrl = require('../Controllers/PosController');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

// POS Screen
router.get('/', Ctrl.index);
router.get('/ui-kit', Ctrl.uikitPage);
router.get('/theme', Ctrl.themeGet);
router.put('/theme', Ctrl.themeUpdate);
router.get('/printer-settings', Ctrl.printerSettingsPage);
router.get('/printers', Ctrl.printersGet);
router.put('/printers', Ctrl.printersUpdate);
router.get('/catalog-counts', Ctrl.catalogCounts);
router.get('/products', Ctrl.products);
router.get('/vehicle/:uuid/parts', Ctrl.vehicleParts);
router.get('/barcode-scan', Ctrl.barcodeScan);
router.post('/validate-stock', Ctrl.validateStock);
router.post('/checkout', Ctrl.checkout);
router.post('/release-holds', Ctrl.releaseHolds);
router.get('/stock-holds/active', Ctrl.activeStockHolds);
router.get('/invoice-settings', Ctrl.invoiceSettingsGet);
router.put('/invoice-settings', Ctrl.invoiceSettingsUpdate);

// Payment Gateway
router.get('/payment/config',   Ctrl.paymentConfigGet);
router.put('/payment/config',   Ctrl.paymentConfigUpdate);
router.post('/payment/init',    Ctrl.paymentInit);
router.post('/payment/link',    Ctrl.paymentLink);
router.post('/payment/verify',  Ctrl.paymentVerify);
router.post('/payment/cancel',  Ctrl.paymentCancel);
router.get('/payment/status/:uuid', Ctrl.paymentStatus);
router.get('/dashboard-data', Ctrl.dashboard);
router.get('/warehouses', Ctrl.warehouses);
router.get('/taxes', Ctrl.taxes);

// Orders
router.get('/orders', Ctrl.ordersPage);
router.post('/orders/paginate', Ctrl.ordersPaginate);
router.post('/orders/export', Ctrl.ordersExport);
// JSON endpoint (used by the orders list popup, search, refresh, etc.)
router.get('/orders/:uuid', Ctrl.orderShow);
// Full POS-style detail page (POS layout, parts breakdown, action buttons)
router.get('/orders/:uuid/view', Ctrl.orderDetailPage);
// ESC/POS bytes for direct silent thermal printing via the local print agent.
router.get('/orders/:uuid/receipt-escpos', Ctrl.orderReceiptEscpos);
router.post('/orders/:uuid/cancel', Ctrl.orderCancel);
router.post('/orders/:uuid/payment', Ctrl.orderPayment);
router.get('/orders/:uuid/invoice', Ctrl.orderInvoice);
router.get('/orders/:uuid/invoice/thermal', Ctrl.orderInvoiceThermal);
router.post('/orders/:uuid/invoice/email', Ctrl.orderInvoiceEmail);

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
router.get('/next-invoice-number', Ctrl.nextInvoiceNumber);
// File uploads for receipt assets — kind = logo | qr | signature
router.post('/settings/upload/:kind', Ctrl.settingsUpload);
router.get('/receipt-preview', Ctrl.receiptPreview);

// Returns
router.get('/returns', Ctrl.returnsPage);
router.post('/returns', Ctrl.returnCreate);
router.post('/returns/paginate', Ctrl.returnsPaginate);
router.get('/returns/:uuid', Ctrl.returnShow);

// Label Printer (proxy to API)
const api = require('../helpers/api');
router.get('/label-printer/status', async (req, res) => { res.json(await api.get('/label-printer/status', req.session.token)); });
router.get('/label-printer/config', async (req, res) => { res.json(await api.get('/label-printer/config', req.session.token)); });
router.post('/label-printer/config', async (req, res) => { res.json(await api.post('/label-printer/config', req.body, req.session.token)); });
router.post('/label-printer/test', async (req, res) => { res.json(await api.post('/label-printer/test', req.body, req.session.token)); });
router.post('/label-printer/qr-internal-id', async (req, res) => { res.json(await api.post('/label-printer/qr-internal-id', req.body, req.session.token)); });
router.post('/label-printer/qr-unit-location', async (req, res) => { res.json(await api.post('/label-printer/qr-unit-location', req.body, req.session.token)); });
router.post('/label-printer/barcode-location', async (req, res) => { res.json(await api.post('/label-printer/barcode-location', req.body, req.session.token)); });

module.exports = router;
