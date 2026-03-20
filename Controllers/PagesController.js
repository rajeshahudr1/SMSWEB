'use strict';
const api = require('../helpers/api');

// ── List all pages ──────────────────────────────────────────
exports.index = async (req, res) => {
    const result = await api.get('/pages', req.session.token);
    res.render('pages/index', {
        page_title:  'Legal Pages',
        activeLink:  'pages',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Legal Pages', url: '/pages' },
        ],
        pages: (result.status === 200) ? result.data : [],
    });
};

// ── Edit form ───────────────────────────────────────────────
exports.edit = async (req, res) => {
    const result = await api.get('/pages/' + req.params.uuid, req.session.token);
    if (result.status !== 200) {
        req.flash('error', 'Page not found.');
        return res.redirect('/pages');
    }
    res.render('pages/form', {
        page_title:  'Edit: ' + result.data.title,
        activeLink:  'pages',
        breadcrumbs: [
            { name: 'Dashboard',   url: '/dashboard' },
            { name: 'Legal Pages', url: '/pages' },
            { name: 'Edit',        url: '' },
        ],
        page: result.data,
    });
};

// ── Update (AJAX) ───────────────────────────────────────────
exports.update = async (req, res) => {
    const result = await api.put('/pages/' + req.params.uuid, req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

// ── Public: Terms page ──────────────────────────────────────
exports.termsPublic = async (req, res) => {
    let pageData = null;
    try {
        const result = await api.get('/pages/public/terms');
        if (result && result.status === 200 && result.data) {
            pageData = result.data;
        }
    } catch (err) {
        console.log('[termsPublic] API error:', err.message);
    }
    res.render('auth/terms', {
        page_title:    'Terms & Conditions',
        APP_NAME:      process.env.APP_NAME || 'SMS',
        BASE_URL:      '',
        flash_success: null,
        flash_error:   null,
        pageData:      pageData,
    });
};

// ── Public: Privacy page ────────────────────────────────────
exports.privacyPublic = async (req, res) => {
    let pageData = null;
    try {
        const result = await api.get('/pages/public/privacy');
        if (result && result.status === 200 && result.data) {
            pageData = result.data;
        }
    } catch (err) {
        console.log('[privacyPublic] API error:', err.message);
    }
    res.render('auth/privacy', {
        page_title:    'Privacy Policy',
        APP_NAME:      process.env.APP_NAME || 'SMS',
        BASE_URL:      '',
        flash_success: null,
        flash_error:   null,
        pageData:      pageData,
    });
};
