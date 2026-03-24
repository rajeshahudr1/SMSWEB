'use strict';

const api      = require('../helpers/api');
const FormData = require('form-data');
const fs       = require('fs');
const multer   = require('multer');
const path     = require('path');
const os       = require('os');

// Temp upload for image
const tempUpload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only image files are allowed (JPG, PNG, GIF, WEBP).'));
    },
});

// Temp upload for CSV import
const tempImport = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, ['.csv', '.xlsx', '.xls'].includes(ext));
    },
});

function cleanTemp(file) {
    if (file && file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
    }
}

// Helper: load languages for form
const getLanguages = (token) => api.get('/master-languages/active', token).then(r => {
    return r.status === 200 ? (r.data || []) : [];
});

// ── List page ─────────────────────────────────────────────
exports.index = async (req, res) => {
    res.render('part-types/index', {
        page_title:  res.locals.t ? res.locals.t('nav.part_types') : 'Part Types',
        activeLink:  'part-types',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Part Types', url: '/part-types' },
        ],
    });
};

// ── Paginate (POST — AJAX) ────────────────────────────────
exports.paginate = async (req, res) => {
    const result = await api.post('/part-types/paginate', req.body, req.session.token);
    res.json(result);
};

// ── Create page ───────────────────────────────────────────
exports.create = async (req, res) => {
    const languages = await getLanguages(req.session.token);
    res.render('part-types/form', {
        page_title:  'Add Part Type',
        activeLink:  'part-types',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Part Types', url: '/part-types' },
            { name: 'Add', url: '' },
        ],
        partType: null,
        languages,
    });
};

// ── Edit page ─────────────────────────────────────────────
exports.edit = async (req, res) => {
    const [ptResult, languages] = await Promise.all([
        api.get('/part-types/' + req.params.uuid, req.session.token),
        getLanguages(req.session.token),
    ]);
    if (ptResult.status !== 200) {
        req.flash('error', 'Part type not found.');
        return res.redirect('/part-types');
    }
    res.render('part-types/form', {
        page_title:  'Edit Part Type',
        activeLink:  'part-types',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Part Types', url: '/part-types' },
            { name: 'Edit', url: '' },
        ],
        partType:  ptResult.data,
        languages,
    });
};

// ── Store (multipart) ─────────────────────────────────────
exports.store = [
    (req, res, next) => {
        tempUpload.single('image')(req, res, (err) => {
            if (err) return res.json({ status: 422, message: err.message || 'File upload error.' });
            next();
        });
    },
    async (req, res) => {
        try {
            const fd = new FormData();
            Object.keys(req.body).forEach(k => {
                if (req.body[k] !== undefined && req.body[k] !== null) {
                    fd.append(k, String(req.body[k]));
                }
            });
            if (req.file) {
                fd.append('image', fs.createReadStream(req.file.path), {
                    filename:    req.file.originalname,
                    contentType: req.file.mimetype,
                });
            }
            const result = await api.postForm('/part-types', fd, req.session.token);
            cleanTemp(req.file);
            return res.json({ status: result.status, message: result.message, data: result.data || null });
        } catch (err) {
            cleanTemp(req.file);
            return res.json({ status: 500, message: 'Server error.' });
        }
    },
];

// ── Update (multipart) ────────────────────────────────────
exports.update = [
    (req, res, next) => {
        tempUpload.single('image')(req, res, (err) => {
            if (err) return res.json({ status: 422, message: err.message || 'File upload error.' });
            next();
        });
    },
    async (req, res) => {
        try {
            const fd = new FormData();
            Object.keys(req.body).forEach(k => {
                if (req.body[k] !== undefined && req.body[k] !== null) {
                    fd.append(k, String(req.body[k]));
                }
            });
            if (req.file) {
                fd.append('image', fs.createReadStream(req.file.path), {
                    filename:    req.file.originalname,
                    contentType: req.file.mimetype,
                });
            }

            // Use PUT via POST with method override or direct axios put with form
            const axios   = require('axios');
            const BASE    = process.env.API_URL || 'http://localhost:3000/api';
            const headers = { ...fd.getHeaders(), Authorization: 'Bearer ' + req.session.token };
            const r = await axios.put(BASE + '/part-types/' + req.params.uuid, fd, { headers });
            cleanTemp(req.file);
            return res.json(r.data);
        } catch (err) {
            cleanTemp(req.file);
            const d = err.response && err.response.data ? err.response.data : { status: 500, message: 'Update failed.' };
            return res.json(d);
        }
    },
];

// ── View data (AJAX) ──────────────────────────────────────
exports.viewData = async (req, res) => {
    const result = await api.get('/part-types/' + req.params.uuid + '/view', req.session.token);
    res.json(result);
};

// ── Delete ────────────────────────────────────────────────
exports.destroy = async (req, res) => {
    const result = await api.del('/part-types/' + req.params.uuid, req.session.token);
    res.json({ status: result.status, message: result.message });
};

// ── Toggle status ─────────────────────────────────────────
exports.toggleStatus = async (req, res) => {
    const result = await api.patch('/part-types/' + req.params.uuid + '/toggle-status', {}, req.session.token);
    res.json({ status: result.status, message: result.message });
};

// ── Bulk action ───────────────────────────────────────────
exports.bulkAction = async (req, res) => {
    const result = await api.post('/part-types/bulk-action', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

// ── Export ─────────────────────────────────────────────────
exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const format = params.format || 'csv';

    const result = await api.post('/part-types/export/data', params, req.session.token);
    if (!result || result.status !== 200) {
        return res.json({ status: 500, message: 'Export failed.' });
    }

    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data to export.', data: { rows: [] } });

    if (format === 'csv') {
        const headers = Object.keys(rows[0]);
        const csv = [
            headers.join(','),
            ...rows.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="part-types-${Date.now()}.csv"`);
        return res.send(csv);
    }

    if (format === 'excel') {
        try {
            const XLSX = require('xlsx');
            const ws   = XLSX.utils.json_to_sheet(rows);
            const wb   = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Part Types');
            const buf  = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="part-types-${Date.now()}.xlsx"`);
            return res.send(buf);
        } catch (e) {
            return res.json({ status: 200, message: 'Data ready.', data: result.data });
        }
    }

    // pdf/print — return JSON
    return res.json({ status: 200, message: 'Data ready.', data: result.data });
};

// ── Import (multipart) ────────────────────────────────────
exports.importData = [
    (req, res, next) => {
        tempImport.single('file')(req, res, (err) => {
            if (err) return res.json({ status: 422, message: err.message || 'Upload error.' });
            next();
        });
    },
    async (req, res) => {
        try {
            if (!req.file) return res.json({ status: 422, message: 'No file uploaded.' });
            const fd = new FormData();
            fd.append('file', fs.createReadStream(req.file.path), {
                filename:    req.file.originalname,
                contentType: req.file.mimetype,
            });
            const result = await api.postForm('/part-types/import/upload', fd, req.session.token);
            cleanTemp(req.file);
            return res.json(result);
        } catch (err) {
            cleanTemp(req.file);
            return res.json({ status: 500, message: 'Import request failed.' });
        }
    },
];
