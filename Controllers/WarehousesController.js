'use strict';
const api = require('../helpers/api');
const getOrgs = (tk) => api.get('/warehouses/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('warehouses/index', {
        page_title: 'Warehouses', activeLink: 'warehouses',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Warehouses', url: '/warehouses' }],
        organizations: orgs,
    });
};

exports.paginate = async (req, res) => { res.json(await api.post('/warehouses/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('warehouses/form', {
        page_title: 'Add Warehouse', activeLink: 'warehouses',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Warehouses', url: '/warehouses' }, { name: 'Add', url: '' }],
        record: null, organizations: orgs,
    });
};

exports.edit = async (req, res) => {
    const [r, orgs] = await Promise.all([
        api.get('/warehouses/' + req.params.uuid, req.session.token),
        (req.session.user && req.session.user.is_super_admin) ? getOrgs(req.session.token) : Promise.resolve([])
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/warehouses'); }
    res.render('warehouses/form', {
        page_title: 'Edit Warehouse', activeLink: 'warehouses',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Warehouses', url: '/warehouses' }, { name: 'Edit', url: '' }],
        record: r.data, organizations: orgs,
    });
};

exports.organizations = async (req, res) => { res.json(await api.get('/warehouses/organizations', req.session.token)); };
exports.autocomplete = async (req, res) => { res.json(await api.get('/warehouses/autocomplete?' + require('querystring').stringify(req.query), req.session.token)); };
exports.store = async (req, res) => { res.json(await api.post('/warehouses', req.body, req.session.token)); };

exports.update = async (req, res) => {
    try {
        const axios = require('axios');
        const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + req.session.token };
        const r = await axios.put(BASE + '/warehouses/' + req.params.uuid, req.body, { headers });
        return res.json(r.data);
    } catch (e) { return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/warehouses/' + req.params.uuid + '/view', req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/warehouses/' + req.params.uuid + '/usage', req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/warehouses/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/warehouses/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/warehouses/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/warehouses/bulk-action', req.body, req.session.token)); };

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/warehouses/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="warehouses-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Warehouses'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="warehouses-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Warehouses', rows); }
    return res.json({ status: 200, data: result.data });
};
