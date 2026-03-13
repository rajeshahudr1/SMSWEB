'use strict';

/**
 * auth.js (Middleware)
 * Guards web routes — redirects to /login if session missing.
 * Also loads user settings into res.locals so every EJS view can access them.
 */

// ── Require login ─────────────────────────────────
// Use on any route that needs authentication
function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    req.flash('error', 'Please login to continue.');
    res.redirect('/login');
}

// ── Redirect logged-in users away from /login ─────
function guestOnly(req, res, next) {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
}

// ── Permission check middleware factory ───────────
// Usage: router.get('/users', requirePermission('view_users'), UsersCtrl.index)
function requirePermission(permissionName) {
    return function (req, res, next) {
        const perms = req.session.permissions || [];
        const isAdmin = req.session.user && (req.session.user.is_super_admin || req.session.user.is_org_admin);

        if (isAdmin || perms.includes(permissionName)) {
            return next();
        }
        // Ajax request
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(403).json({ status: 403, success: false, message: 'Access denied.' });
        }
        req.flash('error', 'You do not have permission to access this page.');
        res.redirect('/dashboard');
    };
}

// ── Inject session data into all views ───────────
// Called as app-level middleware in index.js (runs on every request)
function injectLocals(req, res, next) {
    const sess         = req.session;
    const user         = sess.user         || null;
    const settings     = sess.settings     || {};
    const permissions  = sess.permissions  || [];
    const menus        = sess.menus        || [];

    // Available in every EJS view
    res.locals.APP_NAME       = process.env.APP_NAME  || 'SMS';
    res.locals.BASE_URL       = process.env.APP_URL   || '';
    res.locals.user           = user;
    res.locals.settings       = settings;
    res.locals.permissions    = permissions;
    res.locals.menus          = menus;
    res.locals.activeLink     = '';
    res.locals.page_title     = '';
    res.locals.breadcrumbs    = [];

    // Helper: check permission in EJS — <%= can('view_users') %>
    res.locals.can = function (perm) {
        if (!user) return false;
        if (user.is_super_admin || user.is_org_admin) return true;
        return permissions.includes(perm);
    };

    // Flash messages
    res.locals.flash_success = req.flash('success')[0] || null;
    res.locals.flash_error   = req.flash('error')[0]   || null;

    next();
}

module.exports = { requireLogin, guestOnly, requirePermission, injectLocals };
