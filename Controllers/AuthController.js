'use strict';

const api = require('../helpers/api');

// ════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════
exports.loginPage = (req, res) => {
    res.render('auth/login', { page_title: 'Login' });
};

exports.loginPost = async (req, res) => {
    const { email, password, panel } = req.body;
    const result = await api.post('/auth/login', { email, password, panel: panel || 'b2b' });

    if (result.status === 200 && result.data) {
        const d = result.data;
        req.session.token       = d.token;
        req.session.user        = d.user;
        req.session.permissions = d.permissions || [];
        req.session.menus       = d.menus       || [];
        req.session.settings    = d.settings    || {};
        return req.session.save(() => res.json({ status: 200, message: 'Login successful.' }));
    }

    // API might return 403 when email unverified
    const status = result.status || 401;
    return res.json({ status, message: result.message || 'Invalid email or password.' });
};

// ════════════════════════════════════════════
//  SIGNUP (email) — 3-step
// ════════════════════════════════════════════
exports.signupPage = (req, res) => {
    res.render('auth/signup', { page_title: 'Create Account' });
};

exports.signupPost = async (req, res) => {
    const result = await api.post('/auth/signup', req.body);
    return res.json({ status: result.status, message: result.message, data: result.data || null });
};

// ════════════════════════════════════════════
//  VERIFY EMAIL OTP
// ════════════════════════════════════════════
exports.verifyEmailPage = (req, res) => {
    res.render('auth/signup', {
        page_title: 'Verify Email',
        prefillEmail: req.query.email || '',
    });
};

exports.verifyEmailPost = async (req, res) => {
    const result = await api.post('/auth/verify-email', req.body);

    if (result.status === 200 && result.data) {
        const d = result.data;
        req.session.token       = d.token;
        req.session.user        = d.user;
        req.session.permissions = d.permissions || [];
        req.session.menus       = d.menus       || [];
        req.session.settings    = d.settings    || {};
        return req.session.save(() => res.json({ status: 200, message: result.message }));
    }
    return res.json({ status: result.status, message: result.message });
};

exports.resendOtpPost = async (req, res) => {
    const result = await api.post('/auth/resend-otp', { email: req.body.email });
    return res.json({ status: result.status, message: result.message });
};

// ════════════════════════════════════════════
//  GOOGLE OAUTH
// ════════════════════════════════════════════
exports.googlePost = async (req, res) => {
    const result = await api.post('/auth/google', req.body);

    if (result.status === 200 && result.data) {
        const d = result.data;

        // New Google user — needs profile completion
        if (d.profile_complete === false) {
            return res.json({
                status:  200,
                message: result.message,
                data: {
                    profile_complete: false,
                    temp_token:  d.temp_token,
                    google_data: d.google_data,
                },
            });
        }

        // Existing user — create session
        req.session.token       = d.token;
        req.session.user        = d.user;
        req.session.permissions = d.permissions || [];
        req.session.menus       = d.menus       || [];
        req.session.settings    = d.settings    || {};
        return req.session.save(() => res.json({ status: 200, message: 'Google login successful.' }));
    }
    return res.json({ status: result.status || 400, message: result.message || 'Google login failed.' });
};

exports.googleCompletePage = (req, res) => {
    const token = req.query.token || '';
    // Decode payload (no verify — API will verify on POST)
    let googleData = {};
    try {
        const parts = token.split('.');
        if (parts[1]) {
            googleData = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        }
    } catch (e) { /* ignore */ }

    res.render('auth/google-complete', {
        page_title:     'Complete Your Profile',
        temp_token:     token,
        google_name:    googleData.name    || '',
        google_email:   googleData.email   || '',
        google_picture: googleData.picture || '',
    });
};

exports.googleCompletePost = async (req, res) => {
    const result = await api.post('/auth/google/complete-profile', req.body);

    if (result.status === 200 && result.data) {
        const d = result.data;
        req.session.token       = d.token;
        req.session.user        = d.user;
        req.session.permissions = d.permissions || [];
        req.session.menus       = d.menus       || [];
        req.session.settings    = d.settings    || {};
        return req.session.save(() => res.json({ status: 200, message: 'Setup complete.' }));
    }
    return res.json({ status: result.status || 400, message: result.message || 'Setup failed.' });
};

// ════════════════════════════════════════════
//  FORGOT / RESET PASSWORD
// ════════════════════════════════════════════
exports.forgotPage = (req, res) => {
    res.render('auth/forgot-password', { page_title: 'Forgot Password' });
};

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
    res.render('auth/reset-password', {
        page_title: 'Reset Password',
        token:      req.params.token,
    });
};

exports.resetPost = async (req, res) => {
    const result = await api.post('/auth/reset-password', {
        token:            req.body.token,
        password:         req.body.password,
        confirm_password: req.body.confirm_password,
    });
    return res.json({ status: result.status, message: result.message });
};

// ════════════════════════════════════════════
//  LOGOUT
// ════════════════════════════════════════════
exports.logout = (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
};
