'use strict';

const api = require('../helpers/api');

// ── Dashboard home ────────────────────────────────
exports.index = async (req, res) => {
    // Fetch summary stats from API
    const stats = await api.get('/dashboard/stats', req.session.token);

    res.render('dashboard/index', {
        page_title:  'Dashboard',
        activeLink:  'dashboard',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }],
        stats:       (stats.status === 200) ? stats.data : {},
    });
};
