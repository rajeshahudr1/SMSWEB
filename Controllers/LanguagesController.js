'use strict';

const api  = require('../helpers/api');
const i18n = require('../helpers/i18n');

/**
 * GET /languages — Show language editor page
 */
exports.index = async (req, res) => {
    const result = await api.get('/languages', req.session.token);
    res.render('languages/index', {
        page_title:  res.locals.t('lang.title') || 'Language Manager',
        activeLink:  'languages',
        breadcrumbs: [
            { name: res.locals.t('nav.dashboard'), url: '/dashboard' },
            { name: res.locals.t('lang.title') || 'Languages', url: '/languages' },
        ],
        languages: (result.status === 200) ? result.data : [],
    });
};

/**
 * GET /languages/:code — Get translations (AJAX)
 */
exports.get = async (req, res) => {
    const result = await api.get(`/languages/${req.params.code}`, req.session.token);
    res.json(result);
};

/**
 * PUT /languages/:code — Save translations (AJAX)
 */
exports.save = async (req, res) => {
    const result = await api.put(`/languages/${req.params.code}`, req.body, req.session.token);
    if (result.status === 200) i18n.clearCache(req.params.code);
    res.json(result);
};

/**
 * POST /languages/add-key — Add new key to all files (AJAX)
 */
exports.addKey = async (req, res) => {
    const result = await api.post('/languages/add-key', req.body, req.session.token);
    if (result.status === 200) i18n.clearCache();
    res.json(result);
};

/**
 * DELETE /languages/remove-key — Remove key from all files (AJAX)
 */
exports.removeKey = async (req, res) => {
    const result = await api.del('/languages/remove-key', req.session.token);
    // For delete with body, use post as fallback
    res.json(result);
};