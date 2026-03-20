'use strict';

const i18n = require('../helpers/i18n');

function requireLogin(req, res, next) {
    if (req.session && req.session.user) return next();
    req.flash('error', 'Please login to continue.');
    res.redirect('/login');
}

function guestOnly(req, res, next) {
    if (req.session && req.session.user) return res.redirect('/dashboard');
    next();
}

function requirePermission(permissionName) {
    return function (req, res, next) {
        const perms   = req.session.permissions || [];
        const isAdmin = req.session.user && (req.session.user.is_super_admin || req.session.user.is_org_admin);
        if (isAdmin || perms.includes(permissionName)) return next();
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(403).json({ status: 403, success: false, message: 'Access denied.' });
        }
        req.flash('error', 'You do not have permission to access this page.');
        res.redirect('/dashboard');
    };
}

function injectLocals(req, res, next) {
    const sess        = req.session;
    const user        = sess.user        || null;
    const settings    = sess.settings    || {};
    const permissions = sess.permissions || [];
    const menus       = sess.menus       || [];

    // ── Language from session.settings only (DB-backed, no cookies) ──
    const lang     = settings.language || 'en';
    const t        = i18n.getTranslator(lang);
    const langDict = i18n.getDict(lang);

    res.locals.APP_NAME            = process.env.APP_NAME || 'SMS';
    res.locals.BASE_URL            = process.env.APP_URL  || '';
    res.locals.user                = user;
    res.locals.settings            = settings;
    res.locals.permissions         = permissions;
    res.locals.menus               = menus;
    res.locals.activeLink          = '';
    res.locals.page_title          = '';
    res.locals.breadcrumbs         = [];
    res.locals.lang                = lang;
    res.locals.t                   = t;
    res.locals.SUPPORTED_LANGUAGES = i18n.SUPPORTED_LANGUAGES;
    res.locals.langDict_json       = JSON.stringify(langDict);
    res.locals.isRTL               = settings.direction === 'rtl';

    const radiusMap = { none: '0', sm: '4px', md: '8px', lg: '12px', xl: '16px' };
    res.locals.borderRadius = radiusMap[settings.border_radius] || '8px';

    res.locals.can = function (perm) {
        if (!user) return false;
        if (user.is_super_admin || user.is_org_admin) return true;
        return permissions.includes(perm);
    };

    res.locals.flash_success = req.flash('success')[0] || null;
    res.locals.flash_error   = req.flash('error')[0]   || null;

    next();
}

function requireSuperAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.is_super_admin) return next();
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
        return res.status(403).json({ status: 403, success: false, message: 'Access denied. Super admin only.' });
    }
    req.flash('error', 'This section is restricted to super administrators.');
    res.redirect('/dashboard');
}

module.exports = { requireLogin, guestOnly, requirePermission, requireSuperAdmin, injectLocals };