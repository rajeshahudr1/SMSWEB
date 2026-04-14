'use strict';
const api      = require('../helpers/api');
const FormData = require('form-data');
const fs       = require('fs');
const multer   = require('multer');
const path     = require('path');
const os       = require('os');

// Temp storage — file is forwarded to API then deleted
const tempUpload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 },  // 10MB max
    fileFilter(req, file, cb) {
        const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
        const ext     = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only JPG, PNG, PDF, DOC or DOCX files are allowed.'));
    },
});

/* ── Clean up temp file ── */
function cleanTemp(file) {
    if (file && file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
    }
}

/* ── Shared session builder ── */
async function buildSession(req, d) {
    req.session.token               = d.token;
    req.session.user                = d.user;
    req.session.permissions         = d.permissions || [];
    req.session.menus               = d.menus       || [];
    req.session.settings            = d.settings    || {};
    req.session.subscription_status = d.subscription_status || 'none';
    return new Promise(r => req.session.save(r));
}

/* ── Build multipart FormData from req.body + optional file ── */
function buildFormData(fields, file) {
    const fd = new FormData();
    Object.keys(fields).forEach(k => {
        if (fields[k] !== undefined && fields[k] !== null) {
            fd.append(k, String(fields[k]));
        }
    });
    if (file) {
        fd.append('address_proof', fs.createReadStream(file.path), {
            filename:    file.originalname,
            contentType: file.mimetype,
        });
    }
    return fd;
}

/* ════════════════════════════════════════
   LOGIN
════════════════════════════════════════ */
exports.loginPage  = (req, res) => res.render('auth/login',  { page_title: 'Login' });
exports.signupPage = (req, res) => res.render('auth/signup', { page_title: 'Create Account' });

exports.loginPost = async (req, res) => {
    const { email, password, panel } = req.body;
    const result = await api.post('/auth/login', { email, password, panel: panel || 'b2b' });
    if (result.status === 200 && result.data) {
        await buildSession(req, result.data);
        const subStatus = result.data.subscription_status || 'none';
        const needsSubscription = (subStatus === 'none' || subStatus === 'expired') && !result.data.user.is_super_admin;
        return res.json({ status: 200, message: 'Login successful.', redirect: needsSubscription ? '/choose-plan' : null });
    }
    return res.json({ status: result.status || 401, message: result.message || 'Invalid email or password.' });
};

/* ════════════════════════════════════════
   SIGNUP — multipart (address_proof file)
════════════════════════════════════════ */
exports.signupPost = [
    // 1. Receive file in web layer
    (req, res, next) => {
        tempUpload.single('address_proof')(req, res, (err) => {
            if (err) return res.json({ status: 422, message: err.message || 'File upload error.' });
            next();
        });
    },
    // 2. Forward to API as multipart
    async (req, res) => {
        try {
            const fd = buildFormData(req.body, req.file);
            const result = await api.postForm('/auth/signup', fd);
            cleanTemp(req.file);
            return res.json({
                status:  result.status,
                message: result.message,
                data:    result.data   || null,
                errors:  result.errors || null,
            });
        } catch (err) {
            cleanTemp(req.file);
            return res.json({ status: 500, message: 'Server error during signup.' });
        }
    },
];

/* ════════════════════════════════════════
   VERIFY EMAIL OTP
════════════════════════════════════════ */
exports.verifyEmailPage = (req, res) =>
    res.render('auth/signup', { page_title: 'Verify Email', prefillEmail: req.query.email || '' });

exports.verifyEmailPost = async (req, res) => {
    const result = await api.post('/auth/verify-email', req.body);
    if (result.status === 200 && result.data) {
        await buildSession(req, result.data);
        const subStatus = result.data.subscription_status || 'none';
        const needsSubscription = (subStatus === 'none' || subStatus === 'expired') && !result.data.user.is_super_admin;
        return res.json({ status: result.status, message: result.message, redirect: needsSubscription ? '/choose-plan' : null });
    }
    return res.json({ status: result.status, message: result.message });
};

exports.resendOtpPost = async (req, res) => {
    const result = await api.post('/auth/resend-otp', { email: req.body.email });
    return res.json({ status: result.status, message: result.message });
};

/* ════════════════════════════════════════
   GOOGLE OAUTH
════════════════════════════════════════ */
exports.googlePost = async (req, res) => {
    const result = await api.post('/auth/google', req.body);
    console.log('[googlePost] API result:', JSON.stringify(result, null, 2));
    if (result.status === 200 && result.data) {
        const d = result.data;
        if (d.profile_complete === false) {
            console.log('[googlePost] new user — temp_token:', d.temp_token, '| google_data:', d.google_data);
            return res.json({
                status: 200, message: result.message,
                data: { profile_complete: false, temp_token: d.temp_token, google_data: d.google_data },
            });
        }
        await buildSession(req, d);
        return res.json({ status: 200, message: 'Google login successful.' });
    }
    return res.json({ status: result.status || 400, message: result.message || 'Google login failed.' });
};

exports.googleCompletePage = (req, res) => {
    const token = req.query.token || '';
    console.log('[googleCompletePage] token from URL:', token ? token.slice(0,30)+'...' : 'EMPTY');
    res.render('auth/google-complete', {
        page_title:     'Complete Your Profile',
        temp_token:     token,
        google_name:    req.query.gname  || '',
        google_email:   req.query.gemail || '',
        google_picture: req.query.gpic   || '',
    });
};

/* GOOGLE COMPLETE — multipart (address_proof file) */
exports.googleCompletePost = [
    (req, res, next) => {
        tempUpload.single('address_proof')(req, res, (err) => {
            if (err) return res.json({ status: 422, message: err.message || 'File upload error.' });
            next();
        });
    },
    async (req, res) => {
        try {
            const fd     = buildFormData(req.body, req.file);
            const result = await api.postForm('/auth/google/complete-profile', fd);
            cleanTemp(req.file);

            if ((result.status === 200 || result.status === 201) && result.data && result.data.token) {
                await buildSession(req, result.data);
                return res.json({ status: 200, message: result.message });
            }
            return res.json({
                status:  result.status || 400,
                message: result.message || 'Setup failed.',
                errors:  result.errors  || null,
            });
        } catch (err) {
            cleanTemp(req.file);
            return res.json({ status: 500, message: 'Server error during setup.' });
        }
    },
];

/* ════════════════════════════════════════
   FORGOT / RESET PASSWORD
════════════════════════════════════════ */
exports.forgotPage = (req, res) => res.render('auth/forgot-password', { page_title: 'Forgot Password' });

exports.forgotPost = async (req, res) => {
    const result = await api.post('/auth/forgot-password', { email: req.body.email });
    return res.json({ status: result.status, message: result.message });
};

exports.resetPage = async (req, res) => {
    const result = await api.get('/auth/reset-password/' + req.params.token);
    if (result.status !== 200) {
        req.flash('error', 'Reset link is invalid or has expired.');
        return res.redirect('/forgot-password');
    }
    res.render('auth/reset-password', { page_title: 'Reset Password', token: req.params.token });
};

exports.resetPost = async (req, res) => {
    const result = await api.post('/auth/reset-password', {
        token: req.body.token, password: req.body.password, confirm_password: req.body.confirm_password,
    });
    return res.json({ status: result.status, message: result.message });
};

/* ════════════════════════════════════════
   LOGOUT
════════════════════════════════════════ */
exports.logout = (req, res) => req.session.destroy(() => res.redirect('/login'));