'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, true); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
function cleanFiles(files) { if (files && files.length) files.forEach(f => clean(f)); }

const getOrgs = (tk) => api.get('/part-inventories/organizations', tk).then(r => r.status === 200 ? (r.data || []) : []).catch(() => []);

exports.index = async (req, res) => {
    var orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('part-inventories/index', {
        page_title: 'Part Inventory', activeLink: 'part-inventories',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Part Inventory', url: '/part-inventories' }],
        organizations: orgs,
    });
};

exports.organizations = async (req, res) => { res.json(await api.get('/part-inventories/organizations', req.session.token)); };
exports.paginate = async (req, res) => { res.json(await api.post('/part-inventories/paginate', req.body, req.session.token)); };
exports.enums = async (req, res) => { res.json(await api.get('/part-inventories/enums', req.session.token)); };
exports.autocomplete = async (req, res) => { res.json(await api.get('/part-inventories/autocomplete?' + new URLSearchParams(req.query).toString(), req.session.token)); };
exports.checkDuplicate = async (req, res) => { res.json(await api.get('/part-inventories/check-duplicate?' + new URLSearchParams(req.query).toString(), req.session.token)); };
exports.subParts = async (req, res) => { res.json(await api.get('/part-inventories/' + req.params.uuid + '/sub-parts', req.session.token)); };

exports.create = async (req, res) => {
    let orgs = [];
    if (req.session.user && req.session.user.is_super_admin) orgs = await getOrgs(req.session.token);
    res.render('part-inventories/form', {
        page_title: 'Add Part', activeLink: 'part-inventories',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Part Inventory', url: '/part-inventories' }, { name: 'Add', url: '' }],
        record: null, organizations: orgs, vehicleId: req.query.vehicle_id || '',
        fromVehicle: req.query.from_vehicle === '1' || !!req.query.vehicle_id,
    });
};

exports.edit = async (req, res) => {
    const [r, orgs] = await Promise.all([
        api.get('/part-inventories/' + req.params.uuid, req.session.token),
        (req.session.user && req.session.user.is_super_admin) ? getOrgs(req.session.token) : Promise.resolve([])
    ]);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/part-inventories'); }
    res.render('part-inventories/form', {
        page_title: 'Edit Part', activeLink: 'part-inventories',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Part Inventory', url: '/part-inventories' }, { name: 'Edit', url: '' }],
        record: r.data, organizations: orgs, vehicleId: '',
    });
};

exports.store = async (req, res) => { res.json(await api.post('/part-inventories', req.body, req.session.token)); };

exports.update = async (req, res) => {
    const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
    try { const r = await axios.put(BASE + '/part-inventories/' + req.params.uuid, req.body, { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + req.session.token } }); res.json(r.data); }
    catch(e) { res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/part-inventories/' + req.params.uuid + '/view', req.session.token)); };

exports.pdf = async (req, res) => {
    const r = await api.get('/part-inventories/' + req.params.uuid, req.session.token);
    if (!r || r.status !== 200) return res.status(404).send('Not found');
    // Load attributes + sub-parts in parallel (not bundled in /show)
    let attributes = [], sub_parts = [];
    try {
        const [a, s] = await Promise.all([
            api.get('/part-inventories/' + req.params.uuid + '/attributes', req.session.token),
            api.get('/part-inventories/' + req.params.uuid + '/sub-parts',  req.session.token),
        ]);
        if (a && a.status === 200) attributes = (a.data && a.data.attributes) || (Array.isArray(a.data) ? a.data : []);
        if (s && s.status === 200 && Array.isArray(s.data)) sub_parts = s.data;
    } catch (e) {}
    const record = Object.assign({}, r.data, { attributes, sub_parts });

    if (req.query.preview) return res.render('part-inventories/pdf', { record, layout: false });

    const ejs = require('ejs');
    const templatePath = path.join(__dirname, '..', 'views', 'part-inventories', 'pdf.ejs');
    const template = fs.readFileSync(templatePath, 'utf8');
    const html = ejs.render(template, { record, filename: templatePath });

    try {
        const { htmlToPdf } = require('../helpers/puppeteerPool');
        const t0 = Date.now();
        const pdfBuf = await htmlToPdf(html);
        console.log('Part PDF generated in', Date.now() - t0, 'ms, size:', pdfBuf.length, 'bytes');
        if (!pdfBuf || pdfBuf.length < 100) return res.status(500).send('PDF generation produced empty file');
        const fileName = 'Part_' + (record.part_code || req.params.uuid) + '.pdf';
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + fileName + '"', 'Content-Length': pdfBuf.length });
        return res.end(pdfBuf);
    } catch (e) {
        return res.status(500).send('PDF generation failed: ' + e.message);
    }
};
exports.usage = async (req, res) => { res.json(await api.get('/part-inventories/' + req.params.uuid + '/usage', req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/part-inventories/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/part-inventories/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/part-inventories/bulk-action', req.body, req.session.token)); };
exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const format = params.format || 'csv';
    const isCheck = params.check === '1' || params.check === 1;

    const result = await api.post('/part-inventories/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: result ? result.status : 500, message: result ? result.message : 'Failed.', data: result ? result.data : null });

    // Background mode — always pass JSON through to frontend
    if (result.data && result.data.mode === 'background') return res.json(result);

    // Check mode — pass through API response (inline or background)
    if (isCheck) return res.json(result);

    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="part-inventory-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Inventory'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="part-inventory-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Part Inventory', rows); }
    return res.json({ status: 200, data: result.data });
};

// Images
exports.uploadImages = [(r,s,n) => { tempUpload.array('images', 20)(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.files || !req.files.length) return res.json({ status: 422, message: 'No files.' });
        const fd = new FormData();
        req.files.forEach(f => { fd.append('images', fs.createReadStream(f.path), { filename: f.originalname, contentType: f.mimetype }); });
        if (req.body.edit_actions) fd.append('edit_actions', req.body.edit_actions);
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.post(BASE + '/part-inventories/' + req.params.uuid + '/images', fd, { headers: { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token } });
        cleanFiles(req.files); return res.json(r.data);
    } catch(e) { cleanFiles(req.files); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];
exports.deleteImage = async (req, res) => { res.json(await api.del('/part-inventories/' + req.params.uuid + '/images/' + req.body.image_id, req.session.token)); };
exports.replaceImage = [(r,s,n) => { tempUpload.single('image')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.file) return res.json({ status: 422, message: 'No file.' });
        const fd = new FormData();
        fd.append('image', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype });
        if (req.body.edit_actions) fd.append('edit_actions', req.body.edit_actions);
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.post(BASE + '/part-inventories/' + req.params.uuid + '/images/' + req.params.imageId + '/replace', fd, { headers: { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token } });
        clean(req.file); return res.json(r.data);
    } catch(e) { clean(req.file); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];
exports.reorderImages = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/images/reorder', req.body, req.session.token)); };

// Videos
exports.uploadVideos = [(r,s,n) => { tempUpload.array('videos', 10)(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.files || !req.files.length) return res.json({ status: 422, message: 'No files.' });
        const fd = new FormData();
        req.files.forEach(f => { fd.append('videos', fs.createReadStream(f.path), { filename: f.originalname, contentType: f.mimetype }); });
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.post(BASE + '/part-inventories/' + req.params.uuid + '/videos', fd, { headers: { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token } });
        cleanFiles(req.files); return res.json(r.data);
    } catch(e) { cleanFiles(req.files); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];
exports.deleteVideo = async (req, res) => { res.json(await api.del('/part-inventories/' + req.params.uuid + '/videos/' + req.body.video_id, req.session.token)); };
exports.reorderVideos = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/videos/reorder', req.body, req.session.token)); };

// Locations
exports.getLocations = async (req, res) => { res.json(await api.get('/part-inventories/' + req.params.uuid + '/locations', req.session.token)); };
exports.saveLocation = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/locations', req.body, req.session.token)); };
exports.bulkSaveLocations = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/locations/bulk', req.body, req.session.token)); };
exports.deleteLocation = async (req, res) => { res.json(await api.del('/part-inventories/' + req.params.uuid + '/locations/' + req.body.location_id, req.session.token)); };

// Settings
exports.getSettings = async (req, res) => { res.json(await api.get('/part-inventories/settings', req.session.token)); };
exports.saveSettings = async (req, res) => { res.json(await api.post('/part-inventories/settings', req.body, req.session.token)); };
exports.saveListColumns = async (req, res) => { res.json(await api.post('/part-inventories/list-columns', req.body, req.session.token)); };

// Organizations
exports.organizations = async (req, res) => { res.json(await api.get('/part-inventories/organizations', req.session.token)); };

// References
exports.getReferences = async (req, res) => { res.json(await api.get('/part-inventories/' + req.params.uuid + '/references', req.session.token)); };
exports.saveReference = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/references', req.body, req.session.token)); };
exports.bulkSaveReferences = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/references/bulk', req.body, req.session.token)); };
exports.deleteReference = async (req, res) => { res.json(await api.del('/part-inventories/' + req.params.uuid + '/references/' + req.body.reference_id, req.session.token)); };

// Damages
exports.getDamages = async (req, res) => { res.json(await api.get('/part-inventories/' + req.params.uuid + '/damages', req.session.token)); };
exports.saveDamage = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/damages', req.body, req.session.token)); };
exports.bulkSaveDamages = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/damages/bulk', req.body, req.session.token)); };
exports.deleteDamage = async (req, res) => { res.json(await api.del('/part-inventories/' + req.params.uuid + '/damages/' + req.body.damage_id, req.session.token)); };

// Attributes
exports.getAttributes = async (req, res) => { res.json(await api.get('/part-inventories/' + req.params.uuid + '/attributes', req.session.token)); };
exports.saveAttributes = async (req, res) => { res.json(await api.post('/part-inventories/' + req.params.uuid + '/attributes', req.body, req.session.token)); };
