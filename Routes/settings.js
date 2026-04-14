'use strict';

const express  = require('express');
const router   = express.Router();
const Settings = require('../Controllers/SettingsController');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

// Guard: must have at least one settings permission (fresh check from API)
async function requireAnySettingsPerm(req, res, next) {
    const u = req.session.user;
    if (!u) return res.redirect('/login');
    if (u.is_super_admin) return next();
    // Force refresh permissions from API for settings page
    try {
        const api = require('../helpers/api');
        const result = await api.get('/auth/me', req.session.token);
        if (result.status === 200 && result.data && result.data.permissions) {
            req.session.permissions = result.data.permissions;
            await new Promise(r => req.session.save(r));
        }
    } catch (_) {}
    const perms = req.session.permissions || [];
    const hasAny = perms.includes('view_settings');
    if (hasAny) return next();
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
        return res.status(403).json({ status: 403, message: 'You do not have permission to access settings.' });
    }
    req.flash('error', 'You do not have permission to access settings.');
    return res.redirect('/dashboard');
}

// Edit guard: must have edit_settings to save
function requireEditSettings(req, res, next) {
    const u = req.session.user;
    if (u && u.is_super_admin) return next();
    const perms = req.session.permissions || [];
    if (perms.includes('edit_settings')) return next();
    return res.status(403).json({ status: 403, message: 'You do not have permission to edit settings.' });
}

// Section-level guard: strip settings keys the user doesn't have permission to edit
const SECTION_KEYS = {
    settings_custom_design: ['theme_color', 'dark_mode', 'direction', 'border_radius', 'sidebar_style', 'font_size', 'text_color', 'icon_color'],
    settings_localization: ['language', 'module_language', 'date_format', 'time_format', 'timezone', 'items_per_page', 'currency_symbol', 'autocomplete_limit'],
    settings_ai_config: ['ai_translation_enabled', 'ai_provider', 'ai_openai_key', 'ai_openai_model', 'ai_gemini_key', 'ai_gemini_model'],
    settings_tax_config: ['tax_enabled', 'tax_rate', 'tax_label', 'tax_number_label', 'tax_number'],
    settings_vehicle_columns: ['vehicle_inventory_list_columns', 'vehicle_inventory_filter_columns'],
    settings_part_columns: ['part_inventory_list_columns', 'part_inventory_filter_columns'],
};
function filterBySection(req, res, next) {
    const u = req.session.user;
    if (u && u.is_super_admin) return next();
    const perms = req.session.permissions || [];
    // Build set of allowed keys
    const allowedKeys = new Set();
    for (const [perm, keys] of Object.entries(SECTION_KEYS)) {
        if (perms.includes(perm)) keys.forEach(k => allowedKeys.add(k));
    }
    // Strip disallowed keys from body
    if (req.body && typeof req.body === 'object') {
        const stripped = [];
        for (const key of Object.keys(req.body)) {
            if (!allowedKeys.has(key)) { stripped.push(key); delete req.body[key]; }
        }
        if (stripped.length && !Object.keys(req.body).length) {
            return res.status(403).json({ status: 403, message: 'You do not have permission to edit these settings.' });
        }
    }
    next();
}

router.get( '/',              requireAnySettingsPerm, Settings.index);
router.post('/user',          requireAnySettingsPerm, requireEditSettings, filterBySection, Settings.saveUser);
router.post('/org',           requireAnySettingsPerm, requireEditSettings, filterBySection, Settings.saveOrg);
router.post('/theme',         requireAnySettingsPerm, requireEditSettings, filterBySection, Settings.saveTheme);
router.post('/language',      Settings.setLanguage);
router.get( '/language',      Settings.setLanguage);

// AI Configuration — requires settings_ai_config
function requireAiPerm(req, res, next) {
    const u = req.session.user;
    if (u && u.is_super_admin) return next();
    const perms = req.session.permissions || [];
    if (perms.includes('settings_ai_config')) return next();
    return res.status(403).json({ status: 403, message: 'You do not have permission to access AI settings.' });
}
router.get( '/ai-config',     requireAnySettingsPerm, requireAiPerm, Settings.getAiConfig);
router.post('/ai-config',     requireAnySettingsPerm, requireEditSettings, requireAiPerm, Settings.saveAiConfig);
router.post('/ai-validate',   requireAnySettingsPerm, requireEditSettings, requireAiPerm, Settings.validateAiKey);

// Tax Configuration — requires settings_tax_config
function requireTaxPerm(req, res, next) {
    const u = req.session.user;
    if (u && u.is_super_admin) return next();
    const perms = req.session.permissions || [];
    if (perms.includes('settings_tax_config')) return next();
    return res.status(403).json({ status: 403, message: 'You do not have permission to access tax settings.' });
}
router.get( '/tax-config',    requireAnySettingsPerm, requireTaxPerm, Settings.getTaxConfig);
router.post('/tax-config',    requireAnySettingsPerm, requireEditSettings, requireTaxPerm, Settings.saveTaxConfig);

module.exports = router;
