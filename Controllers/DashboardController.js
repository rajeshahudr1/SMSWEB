'use strict';
const api = require('../helpers/api');

const getOrgs = (tk) => api.get('/part-types/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []).catch(() => []);

exports.index = async (req, res) => {
    var organizations = [];
    if (req.session.user && req.session.user.is_super_admin) {
        organizations = await getOrgs(req.session.token);
    }
    res.render('dashboard/index', {
        page_title:  'Dashboard',
        activeLink:  'dashboard',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }],
        organizations: organizations,
    });
};

exports.stats = async (req, res) => {
    try {
        var params = [];
        if (req.query.company_id) params.push('company_id=' + encodeURIComponent(req.query.company_id));
        if (req.query.date_from) params.push('date_from=' + encodeURIComponent(req.query.date_from));
        if (req.query.date_to) params.push('date_to=' + encodeURIComponent(req.query.date_to));
        var qs = params.length ? '?' + params.join('&') : '';
        var result = await api.get('/dashboard/stats' + qs, req.session.token);
        return res.json(result);
    } catch (e) {
        return res.json({ status: 500, message: 'Failed to fetch stats.' });
    }
};