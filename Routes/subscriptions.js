'use strict';
const express = require('express');
const router  = express.Router();
const Ctrl    = require('../Controllers/SubscriptionsController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);

// ── User-facing routes ──
router.get('/choose-plan',              Ctrl.choosePlan);
router.get('/plans',                    Ctrl.plans);
router.post('/initiate',                Ctrl.initiate);
router.post('/renew',                   Ctrl.renew);
router.post('/reactivate',              Ctrl.reactivate);
router.get('/pending/:uuid',            Ctrl.showPending);
router.get('/payment/:uuid',            Ctrl.paymentPage);
router.post('/payment/stripe/create',   Ctrl.stripeCreate);
router.get('/payment/stripe/callback',  Ctrl.stripeCallback);
router.post('/payment/razorpay/create', Ctrl.razorpayCreate);
router.post('/payment/razorpay/verify', Ctrl.razorpayVerify);
router.get('/success',                  Ctrl.success);
router.get('/current',                  Ctrl.current);
router.post('/cancel',                  Ctrl.cancel);
router.patch('/toggle-auto-renew',      Ctrl.toggleAutoRenew);
router.get('/invoices',                 Ctrl.invoices);
router.get('/payment-history',          Ctrl.paymentHistory);
router.get('/history',                  Ctrl.history);

// ── Super admin routes ──
router.get('/admin',                        requireSuperAdmin, Ctrl.adminIndex);
router.post('/admin/paginate',              requireSuperAdmin, Ctrl.adminPaginate);
router.post('/admin/export',                requireSuperAdmin, Ctrl.adminExport);
router.get('/admin/alert-settings',         requireSuperAdmin, Ctrl.adminAlertSettings);
router.post('/admin/alert-settings',        requireSuperAdmin, Ctrl.adminSaveAlertSettings);
router.get('/admin/:uuid',                  requireSuperAdmin, Ctrl.adminShow);
router.post('/admin/:uuid/extend',          requireSuperAdmin, Ctrl.adminExtend);
router.post('/admin/:uuid/change-plan',     requireSuperAdmin, Ctrl.adminChangePlan);
router.post('/admin/:uuid/cancel',          requireSuperAdmin, Ctrl.adminCancel);
router.post('/admin/:uuid/activate',        requireSuperAdmin, Ctrl.adminActivate);
router.post('/admin/:uuid/suspend',         requireSuperAdmin, Ctrl.adminSuspend);

module.exports = router;
