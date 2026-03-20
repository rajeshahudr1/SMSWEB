'use strict';

const api    = require('../helpers/api');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

/* ── Multer for profile image upload (forwards to API) ── */
const upload = multer({
    dest: path.join(__dirname, '..', 'public', 'uploads', 'temp'),
    limits: { fileSize: (parseInt(process.env.UPLOAD_MAX_PROFILE_MB) || 2) * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) cb(null, true);
        else cb(new Error('Only image files are allowed.'));
    },
});

/* ── Multer for address proof (accepts images + PDF, up to 10MB) ── */
const proofUpload = multer({
    dest: path.join(__dirname, '..', 'public', 'uploads', 'temp'),
    limits: { fileSize: (parseInt(process.env.UPLOAD_MAX_ADDRESS_PROOF_MB) || 10) * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (/\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(file.originalname)) cb(null, true);
        else cb(new Error('Only JPG, PNG, PDF or DOC files are allowed.'));
    },
});

exports.uploadMiddleware = upload.single('profile_image');

/* ── Show profile page ── */
exports.index = async (req, res) => {
    const result = await api.get('/profile', req.session.token);
    res.render('profile/index', {
        page_title:  'My Profile',
        activeLink:  'profile',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Profile',   url: '/profile' },
        ],
        profile: (result.status === 200) ? result.data : req.session.user,
    });
};

/* ── Update profile — PUT ── */
exports.update = async (req, res) => {
    const result = await api.put('/profile', req.body, req.session.token);
    if (result.status === 200) {
        req.session.user = Object.assign(req.session.user || {}, result.data);
        req.session.save();
    }
    res.json({ status: result.status, message: result.message, errors: result.errors || null });
};

/* ── Upload profile image ── */
exports.uploadImage = [
    (req, res, next) => {
        upload.single('profile_image')(req, res, (err) => {
            if (err) return res.json({ status: 422, message: err.message || 'Upload error.' });
            next();
        });
    },
    async (req, res) => {
        if (!req.file) return res.json({ status: 422, message: 'No image file provided.' });

        const FormData = require('form-data');
        const fd = new FormData();
        fd.append('profile_image', fs.createReadStream(req.file.path), {
            filename:    req.file.originalname,
            contentType: req.file.mimetype,
        });

        const result = await api.postForm('/profile/upload-image', fd, req.session.token);

        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (result.status === 200) {
            req.session.user = Object.assign(req.session.user || {}, result.data);
            req.session.save();
        }
        res.json({ status: result.status, message: result.message });
    },
];

/* ── Change password — POST /profile/change-password ── */
exports.changePassword = async (req, res) => {
    const result = await api.post('/profile/change-password', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

/* ── Upload address proof — POST /profile/upload-address-proof ── */
exports.uploadAddressProof = [
    (req, res, next) => {
        proofUpload.single('address_proof')(req, res, (err) => {
            if (err) return res.json({ status: 422, message: err.message || 'Upload error.' });
            next();
        });
    },
    async (req, res) => {
        if (!req.file) return res.json({ status: 422, message: 'No file selected.' });

        const FormData = require('form-data');
        const fd = new FormData();
        fd.append('address_proof', fs.createReadStream(req.file.path), {
            filename:    req.file.originalname,
            contentType: req.file.mimetype,
        });

        const result = await api.postForm('/profile/upload-address-proof', fd, req.session.token);
        try { fs.unlinkSync(req.file.path); } catch(e) {}
        res.json({ status: result.status, message: result.message, data: result.data || null });
    },
];

/* ── Set password (Google users) — POST /profile/set-password ── */
exports.setPassword = async (req, res) => {
    const result = await api.post('/profile/set-password', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};