'use strict';
const api = require('../helpers/api');
const getLangs = (tk) => api.get('/master-languages/active', tk).then(r => r.status === 200 ? (r.data || []) : []);
const getOrgs  = (tk) => api.get('/vehicle-engines/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []);

exports.index = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('vehicle-engines/index', {
        page_title: res.locals.t ? res.locals.t('vehicle_engines.title') : 'Vehicle Engines',
        activeLink: 'vehicle-engines',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Engines', url: '/vehicle-engines' }],
        organizations: orgs
    });
};

exports.paginate = async (req, res) => { res.json(await api.post('/vehicle-engines/paginate', req.body, req.session.token)); };

exports.create = async (req, res) => {
    const [langs, orgs] = await Promise.all([
        getLangs(req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    res.render('vehicle-engines/form', {
        page_title: 'Add Vehicle Engine', activeLink: 'vehicle-engines',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Engines', url: '/vehicle-engines' }, { name: 'Add', url: '' }],
        record: null, languages: langs, organizations: orgs,
    });
};

exports.edit = async (req, res) => {
    const [r, langs, orgs] = await Promise.all([
        api.get('/vehicle-engines/' + req.params.uuid, req.session.token),
        getLangs(req.session.token),
        req.session.user && req.session.user.is_super_admin ? getOrgs(req.session.token) : Promise.resolve([]),
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/vehicle-engines'); }
    res.render('vehicle-engines/form', {
        page_title: 'Edit Vehicle Engine', activeLink: 'vehicle-engines',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Engines', url: '/vehicle-engines' }, { name: 'Edit', url: '' }],
        record: r.data, languages: langs, organizations: orgs,
    });
};

exports.store = async (req, res) => {
    const result = await api.post('/vehicle-engines', req.body, req.session.token);
    res.json(result);
};

exports.update = async (req, res) => {
    try {
        const axios = require('axios');
        const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.put(BASE + '/vehicle-engines/' + req.params.uuid, req.body, {
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + req.session.token }
        });
        return res.json(r.data);
    } catch(e) {
        return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' });
    }
};

exports.viewData  = async (req, res) => { res.json(await api.get('/vehicle-engines/' + req.params.uuid + '/view', req.session.token)); };
exports.destroy   = async (req, res) => { res.json(await api.del('/vehicle-engines/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/vehicle-engines/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover   = async (req, res) => { res.json(await api.post('/vehicle-engines/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.usage     = async (req, res) => { res.json(await api.get('/vehicle-engines/' + req.params.uuid + '/usage', req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/vehicle-engines/bulk-action', req.body, req.session.token)); };

exports.updateVariants = async (req, res) => {
    res.json(await api.patch('/vehicle-engines/' + req.params.uuid + '/variants', req.body, req.session.token));
};

exports.importSingleRow = async (req, res) => { res.json(await api.post('/vehicle-engines/import/single', req.body, req.session.token)); };

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body); const format = params.format || 'csv';
    const result = await api.post('/vehicle-engines/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') {
        const hd = Object.keys(rows[0]);
        const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="vehicle-engines-${Date.now()}.csv"`);
        return res.send(csv);
    }
    if (format === 'excel') {
        try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Vehicle Engines'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="vehicle-engines-${Date.now()}.xlsx"`); return res.send(buf); }
        catch(e) { return res.json({ status: 200, data: result.data }); }
    }
    return res.json({ status: 200, data: result.data });
};

const FormData = require('form-data');
const fsMod = require('fs');
const multer = require('multer'); const pathMod = require('path'); const os = require('os');
const tempImport = multer({ dest: os.tmpdir(), limits: { fileSize: 5*1024*1024 }, fileFilter(r,f,cb) { cb(null, ['.csv','.xlsx','.xls'].includes(pathMod.extname(f.originalname).toLowerCase())); } });

exports.importData = [(r,s,n) => { tempImport.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.file) return res.json({ status: 422, message: 'No file.' });
        const fd = new FormData();
        fd.append('file', fsMod.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype });
        const r = await api.postForm('/vehicle-engines/import/upload', fd, req.session.token);
        if (req.file.path && fsMod.existsSync(req.file.path)) try { fsMod.unlinkSync(req.file.path); } catch(_) {}
        return res.json(r);
    } catch(e) {
        if (req.file && req.file.path && fsMod.existsSync(req.file.path)) try { fsMod.unlinkSync(req.file.path); } catch(_) {}
        return res.json({ status: 500, message: 'Failed.' });
    }
}];

// AI Translation proxy
exports.aiConfig  = async (req, res) => { res.json(await api.get('/vehicle-engines/ai-config', req.session.token)); };
exports.translate = async (req, res) => { res.json(await api.post('/vehicle-engines/translate', req.body, req.session.token)); };