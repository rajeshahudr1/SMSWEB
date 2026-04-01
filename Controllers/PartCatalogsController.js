'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 5*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.jpg','.jpeg','.png','.gif','.webp'].includes(path.extname(f.originalname).toLowerCase())); } });
const tempMultiUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 5*1024*1024, files: 20 }, fileFilter(r,f,cb) { cb(null, ['.jpg','.jpeg','.png','.gif','.webp'].includes(path.extname(f.originalname).toLowerCase())); } });
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(path.extname(f.originalname).toLowerCase())); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
function cleanFiles(files) { if (files && files.length) files.forEach(function(f) { clean(f); }); }
const getLangs = (tk) => api.get('/master-languages/active', tk).then(r => r.status === 200 ? (r.data || []) : []);
const getOrgs = (tk) => api.get('/part-catalogs/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('part-catalogs/index', { page_title: res.locals.t ? res.locals.t('part_catalogs.title') : 'Part Catalogs', activeLink: 'part-catalogs', breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Part Catalogs', url: '/part-catalogs' }], organizations: orgs });
};

exports.organizations = async (req, res) => {
    res.json(await api.get('/part-catalogs/organizations', req.session.token));
};

exports.paginate = async (req, res) => { res.json(await api.post('/part-catalogs/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    const [langs, orgs] = await Promise.all([
        getLangs(req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    res.render('part-catalogs/form', {
        page_title: 'Add Part Catalog', activeLink: 'part-catalogs',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Part Catalogs', url: '/part-catalogs' }, { name: 'Add', url: '' }],
        partCatalog: null, languages: langs, organizations: orgs,
    });
};

exports.edit = async (req, res) => {
    const [r, langs, orgs] = await Promise.all([
        api.get('/part-catalogs/' + req.params.uuid, req.session.token),
        getLangs(req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/part-catalogs'); }
    res.render('part-catalogs/form', {
        page_title: 'Edit Part Catalog', activeLink: 'part-catalogs',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Part Catalogs', url: '/part-catalogs' }, { name: 'Edit', url: '' }],
        partCatalog: r.data, languages: langs, organizations: orgs,
    });
};

exports.store = [(r,s,n) => { tempMultiUpload.array('images', 20)(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        const fd = new FormData();
        Object.keys(req.body).forEach(k => { if (req.body[k] != null) fd.append(k, String(req.body[k])); });
        if (req.files && req.files.length) {
            req.files.forEach(f => { fd.append('images', fs.createReadStream(f.path), { filename: f.originalname, contentType: f.mimetype }); });
        }
        const r = await api.postForm('/part-catalogs', fd, req.session.token);
        cleanFiles(req.files);
        return res.json({ status: r.status, message: r.message, data: r.data || null });
    } catch(e) { cleanFiles(req.files); return res.json({ status: 500, message: 'Error.' }); }
}];

exports.update = [(r,s,n) => { tempMultiUpload.array('images', 20)(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        const fd = new FormData();
        Object.keys(req.body).forEach(k => { if (req.body[k] != null) fd.append(k, String(req.body[k])); });
        if (req.files && req.files.length) {
            req.files.forEach(f => { fd.append('images', fs.createReadStream(f.path), { filename: f.originalname, contentType: f.mimetype }); });
        }
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api'; const h = { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token };
        const r = await axios.put(BASE + '/part-catalogs/' + req.params.uuid, fd, { headers: h });
        cleanFiles(req.files);
        return res.json(r.data);
    } catch(e) { cleanFiles(req.files); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];

exports.viewData = async (req, res) => { res.json(await api.get('/part-catalogs/' + req.params.uuid + '/view', req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/part-catalogs/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/part-catalogs/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/part-catalogs/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/part-catalogs/bulk-action', req.body, req.session.token)); };
exports.bulkUpdatePercentage = async (req, res) => { res.json(await api.post('/part-catalogs/bulk-percentage', req.body, req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/part-catalogs/' + req.params.uuid + '/usage', req.session.token)); };

// Import single error row retry
exports.importSingleRow = async (req, res) => {
    const result = await api.post('/part-catalogs/import/single', req.body, req.session.token);
    res.json(result);
};

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/part-catalogs/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="part-catalogs-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Part Catalogs'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="part-catalogs-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Part Catalogs', rows); }
    return res.json({ status: 200, data: result.data });
};

exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try { if (!req.file) return res.json({ status: 422, message: 'No file.' }); const fd = new FormData(); fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype }); const r = await api.postForm('/part-catalogs/import/upload', fd, req.session.token); clean(req.file); return res.json(r); } catch(e) { clean(req.file); return res.json({ status: 500, message: 'Failed.' }); }
}];

// AI Translation
exports.aiConfig = async (req, res) => {
    const result = await api.get('/part-catalogs/ai-config', req.session.token);
    res.json(result);
};

exports.translate = async (req, res) => {
    const result = await api.post('/part-catalogs/translate', req.body, req.session.token);
    res.json(result);
};

// Assignable parts paginated
exports.assignablePartsPaginate = async (req, res) => {
    res.json(await api.post('/part-catalogs/assignable-parts', req.body, req.session.token));
};

// Attribute CRUD
exports.companyRoles = async (req, res) => { res.json(await api.get('/part-catalogs/roles/list', req.session.token)); };
exports.deleteAttribute = async (req, res) => { res.json(await api.del('/part-catalogs/attributes/' + req.params.attrId, req.session.token)); };
exports.updateAttribute = async (req, res) => {
    const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
    try { const r = await axios.put(BASE + '/part-catalogs/attributes/' + req.params.attrId, req.body, { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + req.session.token } }); res.json(r.data); }
    catch(e) { res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
};
exports.saveAttributePermissions = async (req, res) => { res.json(await api.post('/part-catalogs/attributes/' + req.params.attrId + '/permissions', req.body, req.session.token)); };

// Assigned Parts
exports.assignedParts = async (req, res) => {
    res.json(await api.get('/part-catalogs/' + req.params.uuid + '/assigned-parts', req.session.token));
};

exports.saveAssignedParts = async (req, res) => {
    res.json(await api.post('/part-catalogs/' + req.params.uuid + '/assigned-parts', req.body, req.session.token));
};

// Multi-image upload
exports.uploadImages = [(r,s,n) => { tempMultiUpload.array('images', 10)(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.files || !req.files.length) return res.json({ status: 422, message: 'No files.' });
        const fd = new FormData();
        req.files.forEach((f, i) => {
            fd.append('images', fs.createReadStream(f.path), { filename: f.originalname, contentType: f.mimetype });
        });
        const axios = require('axios');
        const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const h = { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token };
        const r = await axios.post(BASE + '/part-catalogs/' + req.params.uuid + '/images', fd, { headers: h });
        cleanFiles(req.files);
        return res.json(r.data);
    } catch(e) {
        cleanFiles(req.files);
        return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' });
    }
}];

// Delete image
exports.deleteImage = async (req, res) => {
    const imageId = req.body.image_id;
    if (!imageId) return res.json({ status: 422, message: 'Image ID required.' });
    res.json(await api.del('/part-catalogs/' + req.params.uuid + '/images/' + imageId, req.session.token));
};
