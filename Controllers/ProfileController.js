'use strict';

const api     = require('../helpers/api');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── Multer — store uploaded image locally, then forward to API ──
const upload = multer({
    dest: path.join(__dirname, '..', 'public', 'uploads', 'temp'),
    limits: { fileSize: (parseInt(process.env.UPLOAD_MAX_MB) || 5) * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'));
        }
    },
});

exports.uploadMiddleware = upload.single('profile_image');

// ── Show profile page ─────────────────────────────
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

// ── Update profile POST ───────────────────────────
exports.update = async (req, res) => {
    const result = await api.put('/profile', req.body, req.session.token);
    if (result.status === 200) {
        // Refresh session user
        req.session.user = Object.assign(req.session.user || {}, result.data);
        req.session.save();
    }
    res.json({ status: result.status, message: result.message });
};

// ── Change password POST ──────────────────────────
exports.changePassword = async (req, res) => {
    const result = await api.put('/profile/change-password', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};
