'use strict';
const api = require('../helpers/api');
const FormData = require('form-data');
const fs = require('fs'); const multer = require('multer'); const path = require('path'); const os = require('os');
const tempUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 50*1024*1024 }, fileFilter(r,f,cb) { cb(null, true); } });
function clean(f) { if (f && f.path && fs.existsSync(f.path)) try { fs.unlinkSync(f.path); } catch(_) {} }
function cleanFiles(files) { if (files && files.length) files.forEach(f => clean(f)); }

exports.index = async (req, res) => {
    res.render('vehicle-inventories/index', {
        page_title: 'Vehicle Inventory', activeLink: 'vehicle-inventories',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Inventory', url: '/vehicle-inventories' }],
    });
};

exports.paginate = async (req, res) => { res.json(await api.post('/vehicle-inventories/paginate', req.body, req.session.token)); };
exports.enums = async (req, res) => { res.json(await api.get('/vehicle-inventories/enums', req.session.token)); };
exports.autocomplete = async (req, res) => { res.json(await api.get('/vehicle-inventories/autocomplete?' + new URLSearchParams(req.query).toString(), req.session.token)); };

exports.create = async (req, res) => {
    res.render('vehicle-inventories/form', {
        page_title: 'Add Vehicle', activeLink: 'vehicle-inventories',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Inventory', url: '/vehicle-inventories' }, { name: 'Add', url: '' }],
        record: null,
    });
};

exports.edit = async (req, res) => {
    const r = await api.get('/vehicle-inventories/' + req.params.uuid, req.session.token);
    if (r.status !== 200) { req.flash('error', 'Not found.'); return res.redirect('/vehicle-inventories'); }
    res.render('vehicle-inventories/form', {
        page_title: 'Edit Vehicle', activeLink: 'vehicle-inventories',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Vehicle Inventory', url: '/vehicle-inventories' }, { name: 'Edit', url: '' }],
        record: r.data,
    });
};

exports.store = async (req, res) => { res.json(await api.post('/vehicle-inventories', req.body, req.session.token)); };

exports.update = async (req, res) => {
    const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
    try { const r = await axios.put(BASE + '/vehicle-inventories/' + req.params.uuid, req.body, { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + req.session.token } }); res.json(r.data); }
    catch(e) { res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
};

exports.viewData = async (req, res) => { res.json(await api.get('/vehicle-inventories/' + req.params.uuid + '/view', req.session.token)); };
exports.usage = async (req, res) => { res.json(await api.get('/vehicle-inventories/' + req.params.uuid + '/usage', req.session.token)); };
exports.partsFull = async (req, res) => { res.json(await api.get('/vehicle-inventories/' + req.params.uuid + '/parts-full', req.session.token)); };

exports.pdf = async (req, res) => {
    const r = await api.get('/vehicle-inventories/' + req.params.uuid + '/view', req.session.token);
    if (!r || r.status !== 200) return res.status(404).send('Not found');

    // Fetch all parts of this vehicle WITH full details in a single bulk-loaded API call
    let parts = [];
    try {
        const partsResp = await api.get('/vehicle-inventories/' + req.params.uuid + '/parts-full', req.session.token);
        if (partsResp && partsResp.status === 200 && Array.isArray(partsResp.data)) {
            parts = partsResp.data;
        }
    } catch (e) { /* parts are optional */ }

    const record = Object.assign({}, r.data, { parts });

    // If ?preview=1, render the HTML template (for debugging)
    if (req.query.preview) {
        return res.render('vehicle-inventories/pdf', { record, layout: false });
    }

    // Render EJS to HTML string using fs.readFileSync + ejs.render (avoids callback issues)
    const ejs = require('ejs');
    const templatePath = path.join(__dirname, '..', 'views', 'vehicle-inventories', 'pdf.ejs');
    const template = fs.readFileSync(templatePath, 'utf8');
    const html = ejs.render(template, { record, filename: templatePath });

    // Convert to PDF via shared Puppeteer pool (singleton browser)
    try {
        const { htmlToPdf } = require('../helpers/puppeteerPool');
        const t0 = Date.now();
        const pdfBuf = await htmlToPdf(html);
        console.log('Vehicle PDF generated in', Date.now() - t0, 'ms, size:', pdfBuf.length, 'bytes');

        if (!pdfBuf || pdfBuf.length < 100) {
            return res.status(500).send('PDF generation produced empty file');
        }

        const fileName = 'Vehicle_' + (r.data.vehicle_internal_id || r.data.registration_plate_no || req.params.uuid) + '.pdf';
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="' + fileName + '"',
            'Content-Length': pdfBuf.length
        });
        return res.end(pdfBuf);
    } catch (e) {
        console.error('PDF generation error:', e);
        return res.status(500).send('PDF generation failed: ' + e.message);
    }
};
exports.destroy = async (req, res) => { res.json(await api.del('/vehicle-inventories/' + req.params.uuid, req.session.token)); };
exports.toggleStatus = async (req, res) => { res.json(await api.patch('/vehicle-inventories/' + req.params.uuid + '/toggle-status', {}, req.session.token)); };
exports.recover = async (req, res) => { res.json(await api.post('/vehicle-inventories/' + req.params.uuid + '/recover', {}, req.session.token)); };
exports.bulkAction = async (req, res) => { res.json(await api.post('/vehicle-inventories/bulk-action', req.body, req.session.token)); };
exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const format = params.format || 'csv';
    const isCheck = params.check === '1' || params.check === 1;

    const result = await api.post('/vehicle-inventories/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: result ? result.status : 500, message: result ? result.message : 'Failed.', data: result ? result.data : null });

    // Background mode — pass JSON through to frontend
    if (result.data && result.data.mode === 'background') return res.json(result);

    // Check mode — pass through API response (inline or background)
    if (isCheck) return res.json(result);

    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') { const hd = Object.keys(rows[0]); const csv = [hd.join(','), ...rows.map(r => hd.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n'); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', `attachment; filename="vehicle-inventory-${Date.now()}.csv"`); return res.send(csv); }
    if (format === 'excel') { try { const X = require('xlsx'); const ws = X.utils.json_to_sheet(rows); const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Inventory'); const buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' }); res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="vehicle-inventory-${Date.now()}.xlsx"`); return res.send(buf); } catch(e) { return res.json({ status: 200, data: result.data }); } }
    if (format === 'pdf') { const pdfExport = require('../helpers/pdfExport'); return pdfExport.generate(res, 'Vehicle Inventory', rows); }
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
        const r = await axios.post(BASE + '/vehicle-inventories/' + req.params.uuid + '/images', fd, { headers: { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token } });
        cleanFiles(req.files); return res.json(r.data);
    } catch(e) { cleanFiles(req.files); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];
exports.deleteImage = async (req, res) => { res.json(await api.del('/vehicle-inventories/' + req.params.uuid + '/images/' + req.body.image_id, req.session.token)); };
exports.replaceImage = [(r,s,n) => { tempUpload.single('image')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.file) return res.json({ status: 422, message: 'No file.' });
        const fd = new FormData();
        fd.append('image', fs.createReadStream(req.file.path), { filename: req.file.originalname || 'edited.png', contentType: req.file.mimetype });
        if (req.body.edit_actions) fd.append('edit_actions', req.body.edit_actions);
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.post(BASE + '/vehicle-inventories/' + req.params.uuid + '/images/' + req.params.imageId + '/replace', fd, { headers: { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token } });
        clean(req.file); return res.json(r.data);
    } catch(e) { clean(req.file); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];
exports.reorderImages = async (req, res) => { res.json(await api.post('/vehicle-inventories/' + req.params.uuid + '/images/reorder', req.body, req.session.token)); };

// Videos
exports.uploadVideos = [(r,s,n) => { tempUpload.array('videos', 10)(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.files || !req.files.length) return res.json({ status: 422, message: 'No files.' });
        const fd = new FormData();
        req.files.forEach(f => { fd.append('videos', fs.createReadStream(f.path), { filename: f.originalname, contentType: f.mimetype }); });
        if (req.body.edit_actions) fd.append('edit_actions', req.body.edit_actions);
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.post(BASE + '/vehicle-inventories/' + req.params.uuid + '/videos', fd, { headers: { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token } });
        cleanFiles(req.files); return res.json(r.data);
    } catch(e) { cleanFiles(req.files); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];
exports.deleteVideo = async (req, res) => { res.json(await api.del('/vehicle-inventories/' + req.params.uuid + '/videos/' + req.body.video_id, req.session.token)); };
exports.reorderVideos = async (req, res) => { res.json(await api.post('/vehicle-inventories/' + req.params.uuid + '/videos/reorder', req.body, req.session.token)); };

// Documents
exports.uploadDocument = [(r,s,n) => { tempUpload.single('file')(r,s,(e) => { if (e) return s.json({ status: 422, message: e.message }); n(); }); }, async (req, res) => {
    try {
        if (!req.file) return res.json({ status: 422, message: 'No file.' });
        const fd = new FormData();
        fd.append('file', fs.createReadStream(req.file.path), { filename: req.file.originalname, contentType: req.file.mimetype });
        fd.append('document_type', req.body.document_type || '');
        fd.append('comment', req.body.comment || '');
        const axios = require('axios'); const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const r = await axios.post(BASE + '/vehicle-inventories/' + req.params.uuid + '/documents', fd, { headers: { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token } });
        clean(req.file); return res.json(r.data);
    } catch(e) { clean(req.file); return res.json(e.response && e.response.data ? e.response.data : { status: 500, message: 'Failed.' }); }
}];
exports.deleteDocument = async (req, res) => { res.json(await api.del('/vehicle-inventories/' + req.params.uuid + '/documents/' + req.body.doc_id, req.session.token)); };

// Settings
exports.getSettings = async (req, res) => { res.json(await api.get('/vehicle-inventories/settings', req.session.token)); };
exports.saveSettings = async (req, res) => { res.json(await api.post('/vehicle-inventories/settings', req.body, req.session.token)); };
exports.saveListColumns = async (req, res) => { res.json(await api.post('/vehicle-inventories/list-columns', req.body, req.session.token)); };
