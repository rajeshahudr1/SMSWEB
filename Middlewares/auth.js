'use strict';

const i18n = require('../helpers/i18n');
const api  = require('../helpers/api');

// ── How often to re-validate token with API (ms) ──
const TOKEN_CHECK_INTERVAL = 30 * 1000; // 30 seconds — permissions refresh quickly on change

/**
 * requireLogin
 * Basic session check — user must be logged in.
 */
function requireLogin(req, res, next) {
    if (req.session && req.session.user && req.session.token) return next();
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
        return res.status(401).json({ status: 401, success: false, message: 'Session expired. Please login again.', _authExpired: true });
    }
    req.flash('error', 'Please login to continue.');
    res.redirect('/login');
}

/**
 * tokenGuard
 * Validates JWT token with API periodically.
 * - Calls /api/auth/me every TOKEN_CHECK_INTERVAL
 * - If API returns 401 → destroys session → redirects to login
 * - Caches validation timestamp in session to avoid overhead
 *
 * Use AFTER requireLogin:
 *   router.use(requireLogin);
 *   router.use(tokenGuard);
 */
async function tokenGuard(req, res, next) {
    if (!req.session || !req.session.token) return next();

    const now = Date.now();
    const lastCheck = req.session._tokenCheckedAt || 0;

    // Skip if checked recently
    if (now - lastCheck < TOKEN_CHECK_INTERVAL) return next();

    try {
        const result = await api.get('/auth/me', req.session.token);

        if (result._authExpired || result.status === 401) {
            // Token expired or invalid → destroy session
            return _forceLogout(req, res, result.message || 'Session expired. Please login again.');
        }

        // Token is valid — update session check timestamp
        // Also refresh user data from API (in case role/status changed)
        if (result.status === 200 && result.data) {
            req.session.user = result.data.user || req.session.user;
            if (result.data.permissions) req.session.permissions = result.data.permissions;
            if (result.data.menus) req.session.menus = result.data.menus;
            if (result.data.settings) req.session.settings = result.data.settings;
        }
        req.session._tokenCheckedAt = now;
        await new Promise(r => req.session.save(r));
        next();

    } catch (err) {
        // Network error to API — don't logout, just continue with cached session
        console.error('tokenGuard check failed:', err.message);
        next();
    }
}

/**
 * authGuard (combined helper)
 * Use this single middleware instead of requireLogin + tokenGuard separately.
 * Checks session exists AND validates token periodically.
 */
async function authGuard(req, res, next) {
    // Step 1: Basic session check
    if (!req.session || !req.session.user || !req.session.token) {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(401).json({ status: 401, success: false, message: 'Session expired. Please login again.', _authExpired: true });
        }
        req.flash('error', 'Please login to continue.');
        return res.redirect('/login');
    }

    // Step 2: Periodic token validation
    const now = Date.now();
    const lastCheck = req.session._tokenCheckedAt || 0;

    if (now - lastCheck >= TOKEN_CHECK_INTERVAL) {
        try {
            const result = await api.get('/auth/me', req.session.token);

            if (result._authExpired || result.status === 401) {
                return _forceLogout(req, res, result.message || 'Session expired. Please login again.');
            }

            if (result.status === 200 && result.data) {
                req.session.user = result.data.user || req.session.user;
                if (result.data.permissions) req.session.permissions = result.data.permissions;
                if (result.data.subscription_status) req.session.subscription_status = result.data.subscription_status;
            }
            req.session._tokenCheckedAt = now;
            await new Promise(r => req.session.save(r));

        } catch (err) {
            console.error('authGuard check failed:', err.message);
            // Network error — continue with cached session
        }
    }

    // Step 3: Subscription guard — redirect unpaid non-super-admin users
    const subStatus = req.session.subscription_status || 'none';
    const isSuperAdmin = req.session.user && (req.session.user.is_super_admin === 1 || req.session.user.is_super_admin === true);
    const needsSubscription = !isSuperAdmin && ['none', 'expired', 'suspended'].includes(subStatus);
    if (needsSubscription) {
        const fullPath = req.originalUrl || req.path;
        const allowedPrefixes = ['/choose-plan', '/payment', '/profile', '/logout', '/auth', '/subscriptions'];
        const isAllowed = allowedPrefixes.some(p => fullPath === p || fullPath.startsWith(p + '/') || fullPath.startsWith(p + '?'));
        if (!isAllowed) {
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                return res.status(403).json({ status: 403, message: 'Please choose a plan to continue.', redirect: '/choose-plan' });
            }
            return res.redirect('/choose-plan');
        }
    }

    next();
}

/**
 * handleApiAuth(req, res, result)
 * Call this in any web controller after making an API call.
 * If the API returned 401, this auto-logouts the user.
 * Returns true if auth expired (caller should stop processing).
 *
 * Usage in controllers:
 *   const result = await api.get('/something', req.session.token);
 *   if (handleApiAuth(req, res, result)) return; // stop if logged out
 *   // continue processing...
 */
function handleApiAuth(req, res, result) {
    if (result && (result._authExpired || result.status === 401)) {
        _forceLogout(req, res, result.message || 'Session expired. Please login again.');
        return true;
    }
    return false;
}

/**
 * Force logout — destroy session and redirect to login
 */
function _forceLogout(req, res, message) {
    req.session.destroy(() => {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(401).json({ status: 401, success: false, message, _authExpired: true });
        }
        // For page requests, redirect to login with flash
        // (flash won't work after session destroy, so use query param)
        res.redirect('/login?expired=1');
    });
}

function guestOnly(req, res, next) {
    if (req.session && req.session.user) return res.redirect('/dashboard');
    next();
}

function requirePermission(permissionName) {
    return function (req, res, next) {
        const user = req.session.user;
        if (!user) return res.redirect('/login');
        // Super admin bypasses all
        if (user.is_super_admin) return next();
        // Everyone else (including org admin) must have the permission in their role
        const perms = req.session.permissions || [];
        if (perms.includes(permissionName)) return next();
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(403).json({ status: 403, success: false, message: 'Access denied. You do not have permission.' });
        }
        req.flash('error', 'You do not have permission to access this page.');
        res.redirect('/dashboard');
    };
}

async function injectLocals(req, res, next) {
    try {
        const sess        = req.session;
        const user        = sess.user        || null;
        const settings    = sess.settings    || {};
        const permissions = sess.permissions || [];
        const menus       = sess.menus       || [];

        const lang = settings.language || 'en-US';

        await i18n.preloadLanguage(lang);
        if (lang !== 'en-US') await i18n.preloadLanguage('en-US');

        const t        = i18n.getTranslator(lang);
        const langDict = i18n.getDict(lang);

        const supportedLanguages = await i18n.fetchSupportedLanguages();

        res.locals.APP_NAME            = process.env.APP_NAME || 'SMS';
        res.locals.BASE_URL            = '';
        res.locals.user                = user;
        res.locals.settings            = settings;
        res.locals.permissions         = permissions;
        res.locals.menus               = menus;
        res.locals.activeLink          = '';
        res.locals.page_title          = '';
        res.locals.breadcrumbs         = [];
        res.locals.lang                = lang;
        res.locals.t                   = t;
        res.locals.SUPPORTED_LANGUAGES = supportedLanguages;
        res.locals.langDict_json       = JSON.stringify(langDict);
        res.locals.isRTL               = settings.direction === 'rtl';

        const radiusMap = { none: '0', sm: '4px', md: '8px', lg: '12px', xl: '16px' };
        res.locals.borderRadius = radiusMap[settings.border_radius] || '8px';

        res.locals.can = function (perm) {
            if (!user) return false;
            if (user.is_super_admin) return true;
            // Everyone (including org admin) checks actual role permissions
            return permissions.includes(perm);
        };

        // Helper: can access settings page? Must have view_settings FIRST
        res.locals.canAnySettings = function() {
            if (!user) return false;
            if (user.is_super_admin) return true;
            return permissions.includes('view_settings');
        };

        // Helper: can edit settings? view_settings + edit_settings both needed
        res.locals.canEditSettings = function() {
            if (!user) return false;
            if (user.is_super_admin) return true;
            return permissions.includes('view_settings') && permissions.includes('edit_settings');
        };

        res.locals.flash_success = req.flash('success')[0] || null;
        res.locals.flash_error   = req.flash('error')[0]   || null;

        next();
    } catch (err) {
        next(err);
    }
}

function requireSuperAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.is_super_admin) return next();
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
        return res.status(403).json({ status: 403, success: false, message: 'Access denied. Super admin only.' });
    }
    req.flash('error', 'This section is restricted to super administrators.');
    res.redirect('/dashboard');
}

module.exports = {
    requireLogin,
    tokenGuard,
    authGuard,
    handleApiAuth,
    guestOnly,
    requirePermission,
    requireSuperAdmin,
    injectLocals,
};