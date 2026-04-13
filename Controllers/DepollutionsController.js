'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(path.extname(f.originalname).toLowerCase())); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
const getOrgs = (tk) => api.get('/depollutions/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('depollutions/index', { page_title: 'Depollutions', activeLink: 'depollutions', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Depollutions', url: '/depollutions' }], organizations: orgs });
};

exports.paginate = async (req, res) => { res.json(await api.post('/depollutions/paginate', req.body, req.session.token)); };
exports.groupByLer = async (req, res) => { res.json(await api.get('/depollutions/group-by-ler', req.session.token, req.query)); };
exports.groupByLerDetail = async (req, res) => { res.json(await api.get('/depollutions/group-by-ler-detail', req.session.token, req.query)); };
exports.bulkUpdateWastage = async (req, res) => { res.json(await api.post('/depollutions/bulk-update-wastage', req.body, req.session.token)); };
exports.exportGroupByLer = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/depollutions/export-group-ler', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="depollutions-group-ler-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Group by LER'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="depollutions-group-ler-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    return res.json({ status: 200, data: result.data });
};

exports.create = async (req, res) => {
    const orgs = req.session.user && req.session.user.is_super_admin ? await getOrgs(req.session.token) : [];
    res.render('depollutions/form', {
        page_title: 'Add Depollution', activeLink: 'depollutions',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Depollutions', url: '/depollutions' }, { name: 'Add', url: '' }],
        depollution: null, organizations: orgs,
    });
};

exports.edit = async (req, res) => {
    const [r, orgs] = await Promise.all([
        api.get('/depollutions/' + req.params.uuid, req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/depollutions'); }
    res.render('depollutions/form', {
        page_title: 'Edit Depollution', activeLink: 'depollutions',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Depollutions', url: '/depollutions' }, { name: 'Edit', url: '' }],
        depollution: r.data, organizations: orgs,
    });
};

exports.store = async (req, res) => {
    try {
        const r = await api.post('/depollutions', req.body, req.session.token);
        return res.json({ status: r.status, message: r.message, data: r.data || null });
    } catch(e) { return res.json({ status: 500, message: 'Error.' }); }
};

exports.update = async (req, res) => {
    try {
        const r = await api.put('/depollutions/' + req.params.uuid, req.body, req.session.token);
        return res.json({ status: r.status, message: r.message, data: r.data || null });
    } catch(e) { return res.json({ status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/depollutions/' + req.params.uuid, req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/depollutions/' + req.params.uuid, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/depollutions/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/depollutions/bulk-action', req.body, req.session.token)); };

// Import single error row retry
exports.importSingleRow = async (req, res) => {
    const result = await api.post('/depollutions/import/single', req.body, req.session.token);
    res.json(result);
};

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/depollutions/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="depollutions-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Depollutions'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="depollutions-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Depollutions', rows); }
    return res.json({ status: 200, data: result.data });
};

exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { if (!req.file) return res.json({ status: 422, message: 'No file.' }); const fd = new FormData(); fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/depollutions/import/upload', fd, req.session.token); clean(req.file); return res.json(r); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Failed.' }); }
}];
