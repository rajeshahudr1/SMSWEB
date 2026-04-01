'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(path.extname(f.originalname).toLowerCase())); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
const getOrgs = (tk) => api.get('/vehicle-years/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('vehicle-years/index', { page_title: res.locals.t ? res.locals.t('vehicle_years.title') : 'Vehicle Years', activeLink: 'vehicle-years', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Years', url: '/vehicle-years' }], organizations: orgs });
};

exports.paginate = async (req, res) => { res.json(await api.post('/vehicle-years/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    const orgs = req.session.user && req.session.user.is_super_admin ? await getOrgs(req.session.token) : [];
    res.render('vehicle-years/form', {
        page_title: 'Add Vehicle Year', activeLink: 'vehicle-years',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Years', url: '/vehicle-years' }, { name: 'Add', url: '' }],
        partType: null, languages: [], organizations: orgs,
    });
};

exports.edit = async (req, res) => {
    const [r, orgs] = await Promise.all([
        api.get('/vehicle-years/' + req.params.uuid, req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/vehicle-years'); }
    res.render('vehicle-years/form', {
        page_title: 'Edit Vehicle Year', activeLink: 'vehicle-years',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Years', url: '/vehicle-years' }, { name: 'Edit', url: '' }],
        partType: r.data, languages: [], organizations: orgs,
    });
};

exports.store = async (req, res) => {
    const result = await api.post('/vehicle-years', req.body, req.session.token);
    return res.json(result);
};

exports.update = async (req, res) => {
    try {
        const axios = require('axios');
        const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.put(BASE + '/vehicle-years/' + req.params.uuid, req.body, {
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + req.session.token }
        });
        return res.json(r.data);
    } catch(e) {
        return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' });
    }
};

exports.viewData = async (req, res) => { res.json(await api.get('/vehicle-years/' + req.params.uuid + '/view', req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/vehicle-years/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/vehicle-years/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/vehicle-years/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/vehicle-years/' + req.params.uuid + '/usage', req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/vehicle-years/bulk-action', req.body, req.session.token)); };

exports.importSingleRow = async (req, res) => {
    const result = await api.post('/vehicle-years/import/single', req.body, req.session.token);
    res.json(result);
};

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/vehicle-years/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="vehicle-years-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Vehicle Years'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="vehicle-years-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Vehicle Years', rows); }
    return res.json({ status: 200, data: result.data });
};

exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { if (!req.file) return res.json({ status: 422, message: 'No file.' }); const fd = new FormData(); fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/vehicle-years/import/upload', fd, req.session.token); clean(req.file); return res.json(r); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Failed.' }); }
}];
