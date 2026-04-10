'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(path.extname(f.originalname).toLowerCase())); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
const getOrgs = (tk) => api.get('/lers/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);
const getLangs = (tk) => api.get('/master-languages/active', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.autocomplete = async (req, res) => { res.json(await api.get('/lers/autocomplete?' + new URLSearchParams(req.query).toString(), req.session.token)); };

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('lers/index', { page_title: 'LER Codes', activeLink: 'lers', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'LER Codes', url: '/lers' }], organizations: orgs });
};

exports.paginate = async (req, res) => { res.json(await api.post('/lers/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    const [orgs, langs] = await Promise.all([
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
        getLangs(req.session.token),
    ]);
    res.render('lers/form', {
        page_title: 'Add LER', activeLink: 'lers',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'LER Codes', url: '/lers' }, { name: 'Add', url: '' }],
        ler: null, organizations: orgs, languages: langs,
    });
};

exports.edit = async (req, res) => {
    const [r, orgs, langs] = await Promise.all([
        api.get('/lers/' + req.params.uuid, req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
        getLangs(req.session.token),
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/lers'); }
    res.render('lers/form', {
        page_title: 'Edit LER', activeLink: 'lers',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'LER Codes', url: '/lers' }, { name: 'Edit', url: '' }],
        ler: r.data, organizations: orgs, languages: langs,
    });
};

exports.store = async (req, res) => {
    try {
        const r = await api.post('/lers', req.body, req.session.token);
        return res.json({ status: r.status, message: r.message, data: r.data || null });
    } catch(e) { return res.json({ status: 500, message: 'Error.' }); }
};

exports.update = async (req, res) => {
    try {
        const r = await api.put('/lers/' + req.params.uuid, req.body, req.session.token);
        return res.json({ status: r.status, message: r.message, data: r.data || null });
    } catch(e) { return res.json({ status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/lers/' + req.params.uuid, req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/lers/' + req.params.uuid + '/usage', req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/lers/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/lers/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/lers/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/lers/bulk-action', req.body, req.session.token)); };

// Import single error row retry
exports.importSingleRow = async (req, res) => {
    const result = await api.post('/lers/import/single', req.body, req.session.token);
    res.json(result);
};

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/lers/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="lers-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'LER Codes'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="lers-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'LER Codes', rows); }
    return res.json({ status: 200, data: result.data });
};

exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { if (!req.file) return res.json({ status: 422, message: 'No file.' }); const fd = new FormData(); fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/lers/import/upload', fd, req.session.token); clean(req.file); return res.json(r); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Failed.' }); }
}];
