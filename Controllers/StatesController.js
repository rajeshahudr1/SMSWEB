'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(path.extname(f.originalname).toLowerCase())); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }

exports.index = async (req, res) => {
    res.render('states/index', { page_title: 'States', activeLink: 'states', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'States', url: '/states' }] });
};
exports.paginate = async (req, res) => { res.json(await api.post('/states/paginate', req.body, req.session.token)); };
exports.create = async (req, res) => {
    res.render('states/form', { page_title: 'Add', activeLink: 'states', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'States', url: '/states' }, { name: 'Add', url: '' }], record: null });
};
exports.edit = async (req, res) => {
    const r = await api.get('/states/' + req.params.uuid, req.session.token);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/states'); }
    res.render('states/form', { page_title: 'Edit', activeLink: 'states', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'States', url: '/states' }, { name: 'Edit', url: '' }], record: r.data });
};
exports.store = async (req, res) => { res.json(await api.post('/states', req.body, req.session.token)); };
exports.update = async (req, res) => { res.json(await api.put('/states/' + req.params.uuid, req.body, req.session.token)); };
exports.viewData = async (req, res) => { res.json(await api.get('/states/' + req.params.uuid, req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/states/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/states/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/states/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/states/' + req.params.uuid + '/usage', req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/states/bulk-action', req.body, req.session.token)); };
exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    if (params.check === '1') {
        const result = await api.post('/states/export/data', params, req.session.token);
        return res.json(result);
    }
    const result = await api.post('/states/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"` ).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="states-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'States'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="states-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'States', rows); }
    return res.json({ status: 200, data: result.data });
};
exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { if (!req.file) return res.json({ status: 422, message: 'No file.' }); const fd = new FormData(); fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/states/import/upload', fd, req.session.token); clean(req.file); return res.json(r); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Failed.' }); }
}];
exports.importSingleRow = async (req, res) => { res.json(await api.post('/states/import/single', req.body, req.session.token)); };
exports.autocomplete = async (req, res) => { res.json(await api.get('/states/autocomplete', req.session.token, req.query)); };