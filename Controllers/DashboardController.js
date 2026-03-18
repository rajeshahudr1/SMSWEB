'use strict';
const api = require('../helpers/api');

exports.index = async (req, res) => {
    const [statsRes, rolesRes] = await Promise.all([
        api.get('/dashboard/stats', req.session.token),
        api.get('/roles?per_page=5', req.session.token),
    ]);

    res.render('dashboard/index', {
        page_title:  res.locals.t ? res.locals.t('nav.dashboard') : 'Dashboard',
        activeLink:  'dashboard',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }],
        stats:       statsRes.status === 200  ? statsRes.data  : {},
        recentRoles: rolesRes.status === 200  ? (rolesRes.data.data || []).slice(0,5) : [],
    });
};
