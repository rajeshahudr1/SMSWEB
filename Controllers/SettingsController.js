'use strict';

const api = require('../helpers/api');

// ── Show settings page ────────────────────────────
exports.index = async (req, res) => {
    const result = await api.get('/settings', req.session.token);
    res.render('settings/index', {
        page_title:  'Settings',
        activeLink:  'settings',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Settings',  url: '/settings' },
        ],
        userSettings: (result.status === 200) ? result.data : req.session.settings || {},
    });
};

// ── Save user personal settings ───────────────────
exports.saveUser = async (req, res) => {
    const result = await api.post('/settings/user', req.body, req.session.token);
    if (result.status === 200) {
        // Immediately update session so every page reflects new settings
        req.session.settings = Object.assign(req.session.settings || {}, req.body);
        req.session.save();
    }
    res.json({ status: result.status, message: result.message });
};

// ── Save org-wide settings (admin only) ───────────
exports.saveOrg = async (req, res) => {
    const result = await api.post('/settings/org', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};
