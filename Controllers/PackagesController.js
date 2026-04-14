'use strict';
const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('packages/index', {
        page_title: 'Packages', activeLink: 'packages',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Packages', url: '/packages' }],
    });
};

exports.paginate = async (req, res) => { res.json(await api.post('/packages/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    res.render('packages/form', {
        page_title: 'Add Package', activeLink: 'packages',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Packages', url: '/packages' }, { name: 'Add', url: '' }],
        packageData: null,
    });
};

exports.edit = async (req, res) => {
    const r = await api.get('/packages/' + req.params.uuid, req.session.token);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/packages'); }
    res.render('packages/form', {
        page_title: 'Edit Package', activeLink: 'packages',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Packages', url: '/packages' }, { name: 'Edit', url: '' }],
        packageData: r.data,
    });
};

exports.store = async (req, res) => {
    try { const r = await api.post('/packages', req.body, req.session.token); return res.json({ status: r.status, message: r.message, data: r.data || null }); }
    catch (e) { return res.json({ status: 500, message: 'Error.' }); }
};

exports.update = async (req, res) => {
    try { const r = await api.put('/packages/' + req.params.uuid, req.body, req.session.token); return res.json({ status: r.status, message: r.message, data: r.data || null }); }
    catch (e) { return res.json({ status: 500, message: 'Failed.' }); }
};

exports.destroy = async (req, res) => { res.json(await api.del('/packages/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/packages/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/packages/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/packages/bulk-action', req.body, req.session.token)); };
exports.assignOrg = async (req, res) => {
    try { const r = await api.post('/packages/' + req.params.uuid + '/assign-org', req.body, req.session.token); return res.json({ status: r.status, message: r.message }); }
    catch (e) { return res.json({ status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/packages/' + req.params.uuid, req.session.token)); };

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const result = await api.post('/packages/export/data', params, req.session.token);
    res.json(result);
};

// New proxies
exports.roles = async (req, res) => { res.json(await api.get('/packages/roles', req.session.token)); };
exports.roleModules = async (req, res) => { res.json(await api.get('/packages/role-modules', req.session.token, req.query)); };
exports.reorder = async (req, res) => { res.json(await api.post('/packages/reorder', req.body, req.session.token)); };

// Enquiries
exports.enquiries = async (req, res) => {
    res.render('packages/enquiries', { page_title: 'Package Enquiries', activeLink: 'packages/enquiries', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Packages', url: '/packages' }, { name: 'Enquiries', url: '' }] });
};
exports.enquiriesPaginate = async (req, res) => { res.json(await api.post('/packages/enquiries/paginate', req.body, req.session.token)); };
exports.showEnquiry = async (req, res) => { res.json(await api.get('/packages/enquiries/' + req.params.uuid, req.session.token)); };
exports.updateEnquiry = async (req, res) => { res.json(await api.put('/packages/enquiries/' + req.params.uuid, req.body, req.session.token)); };
exports.addEnquiryNote = async (req, res) => { res.json(await api.post('/packages/enquiries/' + req.params.uuid + '/note', req.body, req.session.token)); };
exports.deleteEnquiry = async (req, res) => { res.json(await api.del('/packages/enquiries/' + req.params.uuid, req.session.token)); };
exports.exportEnquiries = async (req, res) => { res.json(await api.post('/packages/enquiries/export', req.body, req.session.token)); };

// Sort order page
exports.sortOrder = async (req, res) => {
    res.render('packages/sort', {
        page_title: 'Sort Packages', activeLink: 'packages',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Packages', url: '/packages' }, { name: 'Sort Order', url: '' }],
    });
};
