'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(path.extname(f.originalname).toLowerCase())); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
const getOrgs = (tk) => api.get('/units/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);
const getLangs = (tk) => api.get('/master-languages/active', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('units/index', { page_title: res.locals.t ? res.locals.t('units.title') : 'Units', activeLink: 'units', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Units', url: '/units' }], organizations: orgs });
};

exports.paginate = async (req, res) => { res.json(await api.post('/units/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    const [orgs, langs] = await Promise.all([
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
        getLangs(req.session.token),
    ]);
    res.render('units/form', {
        page_title: 'Add Unit', activeLink: 'units',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Units', url: '/units' }, { name: 'Add', url: '' }],
        unit: null, organizations: orgs, languages: langs,
    });
};

exports.edit = async (req, res) => {
    const [r, orgs, langs] = await Promise.all([
        api.get('/units/' + req.params.uuid, req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
        getLangs(req.session.token),
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/units'); }
    res.render('units/form', {
        page_title: 'Edit Unit', activeLink: 'units',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Units', url: '/units' }, { name: 'Edit', url: '' }],
        unit: r.data, organizations: orgs, languages: langs,
    });
};

exports.store = async (req, res) => {
    try {
        const r = await api.post('/units', req.body, req.session.token);
        return res.json({ status: r.status, message: r.message, data: r.data || null });
    } catch(e) { return res.json({ status: 500, message: 'Error.' }); }
};

exports.update = async (req, res) => {
    try {
        const r = await api.put('/units/' + req.params.uuid, req.body, req.session.token);
        return res.json({ status: r.status, message: r.message, data: r.data || null });
    } catch(e) { return res.json({ status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/units/' + req.params.uuid + '/view', req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/units/' + req.params.uuid + '/usage', req.session.token)); };
exports.autocomplete = async (req, res) => {
    res.json(await api.get('/units/autocomplete', req.session.token, req.query));
};
exports.destroy = async (req, res) => { res.json(await api.del('/units/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/units/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/units/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/units/bulk-action', req.body, req.session.token)); };

// Import single error row retry
exports.importSingleRow = async (req, res) => {
    const result = await api.post('/units/import/single', req.body, req.session.token);
    res.json(result);
};

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/units/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="units-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Units'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="units-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Units', rows); }
    return res.json({ status: 200, data: result.data });
};

exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { if (!req.file) return res.json({ status: 422, message: 'No file.' }); const fd = new FormData(); fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/units/import/upload', fd, req.session.token); clean(req.file); return res.json(r); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Failed.' }); }
}];
