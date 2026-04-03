'use strict';
const api = require('../helpers/api');
const getOrgs = (tk) => api.get('/warehouses/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('warehouse-shelves/index', {
        page_title: 'Warehouse Shelves', activeLink: 'warehouse-shelves',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Warehouse Shelves', url: '/warehouse-shelves' }],
        organizations: orgs,
    });
};

exports.paginate = async (req, res) => { res.json(await api.post('/warehouse-shelves/paginate', req.body, req.session.token)); };
exports.autocomplete = async (req, res) => { res.json(await api.get('/warehouse-shelves/autocomplete?' + require('querystring').stringify(req.query), req.session.token)); };

exports.create = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('warehouse-shelves/form', {
        page_title: 'Add Warehouse Shelf', activeLink: 'warehouse-shelves',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Warehouse Shelves', url: '/warehouse-shelves' }, { name: 'Add', url: '' }],
        record: null, organizations: orgs,
    });
};

exports.edit = async (req, res) => {
    const [r, orgs] = await Promise.all([
        api.get('/warehouse-shelves/' + req.params.uuid, req.session.token),
        (req.session.user && req.session.user.is_super_admin) ? getOrgs(req.session.token) : Promise.resolve([])
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/warehouse-shelves'); }
    res.render('warehouse-shelves/form', {
        page_title: 'Edit Warehouse Shelf', activeLink: 'warehouse-shelves',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Warehouse Shelves', url: '/warehouse-shelves' }, { name: 'Edit', url: '' }],
        record: r.data, organizations: orgs,
    });
};

exports.store = async (req, res) => { res.json(await api.post('/warehouse-shelves', req.body, req.session.token)); };

exports.update = async (req, res) => {
    try {
        const axios = require('axios');
        const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + req.session.token };
        const r = await axios.put(BASE + '/warehouse-shelves/' + req.params.uuid, req.body, { headers });
        return res.json(r.data);
    } catch (e) { return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/warehouse-shelves/' + req.params.uuid + '/view', req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/warehouse-shelves/' + req.params.uuid + '/usage', req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/warehouse-shelves/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/warehouse-shelves/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/warehouse-shelves/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/warehouse-shelves/bulk-action', req.body, req.session.token)); };

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/warehouse-shelves/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="warehouse-shelves-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Warehouse Shelves'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="warehouse-shelves-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Warehouse Shelves', rows); }
    return res.json({ status: 200, data: result.data });
};
