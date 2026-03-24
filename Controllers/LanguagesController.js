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
 * POST /languages/remove-key — Remove key from all files (AJAX)
 * Body: { key: "group.key_name" }
 */
exports.removeKey = async (req, res) => {
    const result = await api.post('/languages/remove-key', req.body, req.session.token);
    if (result.status === 200) i18n.clearCache();
    res.json(result);
};

/**
 * GET /languages/ai-config — Which AI providers are configured (AJAX)
 */
exports.aiConfig = async (req, res) => {
    const result = await api.get('/languages/ai-config', req.session.token);
    res.json(result);
};

/**
 * POST /languages/translate-all — AI translate all empty keys (AJAX)
 */
exports.translateAll = async (req, res) => {
    const result = await api.post('/languages/translate-all', req.body, req.session.token);
    res.json(result);
};

/**
 * POST /languages/translate-single — AI translate one key (AJAX)
 */
exports.translateSingle = async (req, res) => {
    const result = await api.post('/languages/translate-single', req.body, req.session.token);
    res.json(result);
};

/**
 * GET /languages/key-usage?key=nav.dashboard
 * Scans all EJS + JS files to find where a translation key is used.
 * Returns: { count, locations: [{ file, line, context, type }] }
 */
exports.keyUsage = async (req, res) => {
    const key = (req.query.key || '').trim();
    if (!key) return res.json({ status: 422, message: 'Key is required.' });

    const fs   = require('fs');
    const path = require('path');
    const baseDir = path.join(__dirname, '..');

    const locations = [];
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
        new RegExp(`t\\(\\s*['"]${escaped}['"]`, 'g'),
        new RegExp(`SMS_T\\(\\s*['"]${escaped}['"]`, 'g'),
        new RegExp(`T\\(\\s*['"]${escaped}['"]`, 'g'),
    ];

    function walk(dir, exts) {
        const files = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
                    files.push(...walk(full, exts));
                } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
                    files.push(full);
                }
            }
        } catch (_) {}
        return files;
    }

    function scanFiles(dir, exts, type) {
        const files = walk(dir, exts);
        for (const filePath of files) {
            try {
                const lines = fs.readFileSync(filePath, 'utf8').split('\n');
                for (let i = 0; i < lines.length; i++) {
                    for (let p = 0; p < patterns.length; p++) {
                        patterns[p].lastIndex = 0;
                        if (patterns[p].test(lines[i])) {
                            locations.push({
                                file:    filePath.replace(baseDir + path.sep, '').replace(/\\/g, '/'),
                                line:    i + 1,
                                context: lines[i].trim().substring(0, 120),
                                type,
                            });
                            break;
                        }
                    }
                }
            } catch (_) {}
        }
    }

    scanFiles(path.join(baseDir, 'views'), ['.ejs'], 'ejs');
    scanFiles(path.join(baseDir, 'public'), ['.js'], 'js');

    res.json({ status: 200, data: { key, count: locations.length, locations } });
};

/**
 * GET /languages/key-usage-all?keys=nav.dashboard,btn.save,...
 * Bulk scan — returns usage count for every key in one call.
 * Returns: { "nav.dashboard": 3, "btn.save": 5, ... }
 */
exports.keyUsageAll = async (req, res) => {
    const fs   = require('fs');
    const path = require('path');
    const baseDir = path.join(__dirname, '..');

    function walk(dir, exts) {
        const files = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
                    files.push(...walk(full, exts));
                } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
                    files.push(full);
                }
            }
        } catch (_) {}
        return files;
    }

    // Read all file contents once
    const allFiles = [
        ...walk(path.join(baseDir, 'views'), ['.ejs']),
        ...walk(path.join(baseDir, 'public'), ['.js']),
    ];
    const allContent = allFiles.map(f => {
        try { return fs.readFileSync(f, 'utf8'); } catch (_) { return ''; }
    }).join('\n');

    const keys = req.query.keys ? req.query.keys.split(',') : [];
    const counts = {};

    for (const key of keys) {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp("(?:t|T|SMS_T)\\(\\s*['\"]" + escaped + "['\"]", 'g');
        const matches = allContent.match(regex);
        counts[key] = matches ? matches.length : 0;
    }

    res.json({ status: 200, data: counts });
};