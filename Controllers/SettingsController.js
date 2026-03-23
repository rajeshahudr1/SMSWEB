'use strict';

const api  = require('../helpers/api');
const i18n = require('../helpers/i18n');

// ── Show settings page ────────────────────────────
exports.index = async (req, res) => {
    const result = await api.get('/settings', req.session.token);
    res.render('settings/index', {
        page_title:  res.locals.t('settings.title'),
        activeLink:  'settings',
        breadcrumbs: [
            { name: res.locals.t('nav.dashboard'), url: '/dashboard' },
            { name: res.locals.t('settings.title'), url: '/settings' },
        ],
        userSettings:       (result.status === 200) ? result.data : req.session.settings || {},
        supportedLanguages: await i18n.fetchSupportedLanguages(),
    });
};

// ── Save user personal settings ───────────────────
exports.saveUser = async (req, res) => {
    const result = await api.post('/settings/user', req.body, req.session.token);
    if (result.status === 200) {
        // Merge into session so next page render picks up changes without a fresh API call
        req.session.settings = Object.assign(req.session.settings || {}, req.body);
        await new Promise(r => req.session.save(r));
    }
    res.json({ status: result.status, message: result.message });
};

// ── Save org-wide settings (admin only) ───────────
exports.saveOrg = async (req, res) => {
    const result = await api.post('/settings/org', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

// ── Quick theme save (theme panel + header dark toggle) ──
// Only whitelisted keys accepted — all saved to DB via API
exports.saveTheme = async (req, res) => {
    const ALLOWED = [
        'theme_color', 'dark_mode', 'direction', 'border_radius',
        'sidebar_style', 'font_size', 'language',
    ];
    const body = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) body[k] = req.body[k]; });

    if (!Object.keys(body).length) {
        return res.json({ status: 422, message: 'No valid settings provided.' });
    }

    const result = await api.post('/settings/user', body, req.session.token);
    if (result.status === 200) {
        req.session.settings = Object.assign(req.session.settings || {}, body);
        await new Promise(r => req.session.save(r));
    }
    res.json({ status: result.status, message: result.message, settings: req.session.settings });
};

// ── Change language (DB only — no cookies) ────────
// Updates language in DB via API, then refreshes session.settings.
// Requires login because we need a token to call the API.
exports.setLanguage = async (req, res) => {
    const lang      = req.body.lang || req.query.lang || 'en-US';
    const supported = (await i18n.fetchSupportedLanguages()).map(l => l.code);
    const safeLang  = supported.includes(lang) ? lang : 'en-US';

    // Persist to DB via API (requires login token)
    if (req.session.token) {
        const result = await api.post('/settings/user', { language: safeLang }, req.session.token);
        if (result.status === 200) {
            req.session.settings        = req.session.settings || {};
            req.session.settings.language = safeLang;
            await new Promise(r => req.session.save(r));
        }
    } else {
        // Fallback: store in session only (guest — no DB persistence)
        req.session.settings          = req.session.settings || {};
        req.session.settings.language = safeLang;
        await new Promise(r => req.session.save(r));
    }

    // Return JSON (AJAX) or redirect back
    if (req.xhr || (req.headers.accept || '').includes('json')) {
        return res.json({ status: 200, lang: safeLang });
    }
    res.redirect(req.headers.referer || '/dashboard');
};
