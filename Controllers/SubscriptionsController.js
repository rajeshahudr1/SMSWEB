'use strict';
const api = require('../helpers/api');

// ── Choose Plan page ────────────────────────────────────
exports.choosePlan = async (req, res) => {
    res.render('subscriptions/choose-plan', {
        page_title: 'Choose Your Plan',
        activeLink: 'choose-plan',
        breadcrumbs: [{ name: 'Choose Plan', url: '' }],
        hideLayout: true,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
        subscription_status: req.session.subscription_status || 'none',
    });
};

// ── Initiate subscription (proxy) ───────────────────────
exports.initiate = async (req, res) => {
    res.json(await api.post('/subscriptions/initiate', req.body, req.session.token));
};

// ── Payment page ────────────────────────────────────────
exports.paymentPage = async (req, res) => {
    res.render('subscriptions/payment', {
        page_title: 'Complete Payment',
        activeLink: 'payment',
        breadcrumbs: [{ name: 'Choose Plan', url: '/choose-plan' }, { name: 'Payment', url: '' }],
        hideLayout: true,
        subscriptionUuid: req.params.uuid,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    });
};

// ── Stripe create session (proxy) ───────────────────────
exports.stripeCreate = async (req, res) => {
    res.json(await api.post('/payments/stripe/create', req.body, req.session.token));
};

// ── Stripe callback ─────────────────────────────────────
exports.stripeCallback = async (req, res) => {
    try {
        if (!req.query.session_id) {
            return res.render('subscriptions/payment-result', {
                page_title: 'Payment Error', status: 'error',
                heading: 'Payment Error', message: 'No session ID received from Stripe. Please try again.',
                showRetry: true,
            });
        }
        const result = await api.get('/payments/stripe/callback', req.session.token, { session_id: req.query.session_id });
        if (result.status === 200 && result.data && result.data.status === 'paid') {
            req.session.subscription_status = 'active';
            await new Promise(r => req.session.save(r));
            return res.redirect('/subscriptions/success');
        }
        // Payment not yet confirmed (pending)
        return res.render('subscriptions/payment-result', {
            page_title: 'Payment Pending', status: 'pending',
            heading: 'Payment Processing', message: 'Your payment is being processed. This may take a few moments. You will be notified once confirmed.',
            showRetry: true,
        });
    } catch (e) {
        return res.render('subscriptions/payment-result', {
            page_title: 'Payment Failed', status: 'error',
            heading: 'Payment Failed', message: 'Something went wrong while verifying your payment. If money was deducted, it will be refunded automatically. Please try again or contact support.',
            showRetry: true,
        });
    }
};

// ── Razorpay create order (proxy) ───────────────────────
exports.razorpayCreate = async (req, res) => {
    res.json(await api.post('/payments/razorpay/create', req.body, req.session.token));
};

// ── Razorpay verify (proxy) ─────────────────────────────
exports.razorpayVerify = async (req, res) => {
    const result = await api.post('/payments/razorpay/verify', req.body, req.session.token);
    if (result.status === 200) {
        req.session.subscription_status = 'active';
        await new Promise(r => req.session.save(r));
    }
    res.json(result);
};

// ── Success page ────────────────────────────────────────
exports.success = async (req, res) => {
    res.render('subscriptions/success', {
        page_title: 'Subscription Active',
        activeLink: 'subscription-success',
        breadcrumbs: [{ name: 'Subscription Active', url: '' }],
        hideLayout: true,
    });
};

// ── Current subscription (AJAX proxy) ───────────────────
exports.current = async (req, res) => {
    res.json(await api.get('/subscriptions/current', req.session.token));
};

exports.showPending = async (req, res) => {
    res.json(await api.get('/subscriptions/pending/' + req.params.uuid, req.session.token));
};

// ── Plans (AJAX proxy) ──────────────────────────────────
exports.plans = async (req, res) => {
    res.json(await api.get('/subscriptions/plans', req.session.token));
};

// ── Renew (proxy) ───────────────────────────────────────
exports.renew = async (req, res) => {
    res.json(await api.post('/subscriptions/renew', req.body, req.session.token));
};

// ── Reactivate (proxy) ──────────────────────────────────
exports.reactivate = async (req, res) => {
    res.json(await api.post('/subscriptions/reactivate', {}, req.session.token));
};

// ── Cancel (proxy) ──────────────────────────────────────
exports.cancel = async (req, res) => {
    res.json(await api.post('/subscriptions/cancel', req.body, req.session.token));
};

// ── Toggle auto-renew (proxy) ───────────────────────────
exports.toggleAutoRenew = async (req, res) => {
    res.json(await api.patch('/subscriptions/toggle-auto-renew', {}, req.session.token));
};

// ── Invoice PDF download ────────────────────────────────
exports.downloadInvoice = async (req, res) => {
    try {
        const axios = require('axios');
        const API_URL = process.env.API_URL || 'http://localhost:3000/api';
        const response = await axios.get(API_URL + '/subscriptions/invoices/' + req.params.uuid + '/pdf', {
            headers: { Authorization: 'Bearer ' + req.session.token },
            responseType: 'arraybuffer',
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'attachment; filename="invoice.pdf"');
        res.send(Buffer.from(response.data));
    } catch (err) { res.status(500).json({ status: 500, message: 'Failed to download.' }); }
};

// ── Invoices (proxy) ────────────────────────────────────
exports.invoices = async (req, res) => {
    res.json(await api.get('/subscriptions/invoices', req.session.token, req.query));
};

// ── Payment history (proxy) ─────────────────────────────
exports.paymentHistory = async (req, res) => {
    res.json(await api.get('/payments/history', req.session.token, req.query));
};

// ── History events (proxy) ──────────────────────────────
exports.history = async (req, res) => {
    res.json(await api.get('/subscriptions/history', req.session.token));
};

// ═══════════════════════════════════════════════════════
//  SUPER ADMIN
// ═══════════════════════════════════════════════════════
exports.adminIndex = async (req, res) => {
    res.render('subscriptions/admin-index', {
        page_title: 'Subscription Management',
        activeLink: 'subscriptions/admin',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Subscriptions', url: '' }],
    });
};

exports.adminPaginate = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/paginate', req.body, req.session.token));
};

exports.adminShow = async (req, res) => {
    res.json(await api.get('/subscriptions/admin/' + req.params.uuid, req.session.token));
};

exports.adminExtend = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/' + req.params.uuid + '/extend', req.body, req.session.token));
};

exports.adminChangePlan = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/' + req.params.uuid + '/change-plan', req.body, req.session.token));
};

exports.adminCancel = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/' + req.params.uuid + '/cancel', {}, req.session.token));
};

exports.adminActivate = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/' + req.params.uuid + '/activate', {}, req.session.token));
};

exports.adminSuspend = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/' + req.params.uuid + '/suspend', req.body, req.session.token));
};

exports.adminExport = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/export', req.body, req.session.token));
};

exports.adminPaymentReports = async (req, res) => {
    res.render('subscriptions/payment-reports', {
        page_title: 'Payment Reports', activeLink: 'subscriptions/admin',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Payment Reports', url: '' }],
    });
};
exports.adminPaymentReportsData = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/payment-reports', req.body, req.session.token));
};
exports.adminPaymentExport = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/payment-export', req.body, req.session.token));
};

exports.adminAlertSettings = async (req, res) => {
    res.json(await api.get('/subscriptions/admin/alert-settings', req.session.token));
};

exports.adminSaveAlertSettings = async (req, res) => {
    res.json(await api.post('/subscriptions/admin/alert-settings', req.body, req.session.token));
};
