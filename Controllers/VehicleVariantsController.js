'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 5*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.jpg','.jpeg','.png','.gif','.webp'].includes(path.extname(f.originalname).toLowerCase())); } });
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(path.extname(f.originalname).toLowerCase())); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
const getLangs = (tk) => api.get('/master-languages/active', tk).then(r => r.status === 200 ? (r.data || []) : []);
const getOrgs = (tk) => api.get('/vehicle-variants/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('vehicle-variants/index', { page_title: res.locals.t ? res.locals.t('vehicle_variants.title') : 'Vehicle Variants', activeLink: 'vehicle-variants', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Variants', url: '/vehicle-variants' }], organizations: orgs });
};

exports.paginate = async (req, res) => { res.json(await api.post('/vehicle-variants/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    const [langs, orgs] = await Promise.all([
        getLangs(req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    res.render('vehicle-variants/form', {
        page_title: 'Add Vehicle Variant', activeLink: 'vehicle-variants',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Variants', url: '/vehicle-variants' }, { name: 'Add', url: '' }],
        partType: null, languages: langs, organizations: orgs,
    });
};

exports.edit = async (req, res) => {
    const [r, langs, orgs] = await Promise.all([
        api.get('/vehicle-variants/' + req.params.uuid, req.session.token),
        getLangs(req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/vehicle-variants'); }
    res.render('vehicle-variants/form', {
        page_title: 'Edit Vehicle Variant', activeLink: 'vehicle-variants',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Variants', url: '/vehicle-variants' }, { name: 'Edit', url: '' }],
        partType: r.data, languages: langs, organizations: orgs,
    });
};

exports.store = [(r,s,n) => { tempUpload.single('image')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { const fd = new FormData(); Object.keys(req.body).forEach(k => { if (req.body[k] != null) fd.append(k, String(req.body[k])); }); if (req.file) fd.append('image', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/vehicle-variants', fd, req.session.token); clean(req.file); return res.json({ status: r.status, message: r.message, data: r.data || null }); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Error.' }); }
}];

exports.update = [(r,s,n) => { tempUpload.single('image')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { const fd = new FormData(); Object.keys(req.body).forEach(k => { if (req.body[k] != null) fd.append(k, String(req.body[k])); }); if (req.file) fd.append('image', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype });
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api'; const h = { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token }; const r = await axios.put(BASE + '/vehicle-variants/' + req.params.uuid, fd, { headers: h }); clean(req.file); return res.json(r.data); } catch(e) { clean(req.file); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];

exports.viewData = async (req, res) => { res.json(await api.get('/vehicle-variants/' + req.params.uuid + '/view', req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/vehicle-variants/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/vehicle-variants/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/vehicle-variants/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/vehicle-variants/' + req.params.uuid + '/usage', req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/vehicle-variants/bulk-action', req.body, req.session.token)); };

// Import single error row retry
exports.importSingleRow = async (req, res) => {
    const result = await api.post('/vehicle-variants/import/single', req.body, req.session.token);
    res.json(result);
};

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const isCheck = params.check === '1' || params.check === 1;

    const result = await api.post('/vehicle-variants/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: result ? result.status : 500, message: result ? result.message : 'Failed.', data: result ? result.data : null });

    // Background mode — always return JSON
    if (result.data && result.data.mode === 'background') {
        return res.json(result);
    }

    // Check mode — just confirm it's inline, don't generate file
    if (isCheck) {
        return res.json({ status: 200, data: { mode: 'inline', total: (result.data.rows || []).length } });
    }

    // Actual file download
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="vehicle-variants-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Vehicle Variants'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="vehicle-variants-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Vehicle Variants', rows); }
    return res.json({ status: 200, data: result.data });
};

exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { if (!req.file) return res.json({ status: 422, message: 'No file.' }); const fd = new FormData(); fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/vehicle-variants/import/upload', fd, req.session.token); clean(req.file); return res.json(r); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Failed.' }); }
}];

// AI Translation
exports.aiConfig = async (req, res) => {
    const result = await api.get('/vehicle-variants/ai-config', req.session.token);
    res.json(result);
};

exports.translate = async (req, res) => {
    const result = await api.post('/vehicle-variants/translate', req.body, req.session.token);
    res.json(result);
};