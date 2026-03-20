'use strict';

const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('roles/index', {
        page_title:  res.locals.t ? res.locals.t('roles.title') : 'Roles',
        activeLink:  'roles',
        breadcrumbs: [],
    });
};

exports.paginate = async (req, res) => {
    const result = await api.post('/roles/paginate', req.body, req.session.token);
    res.json(result);
};

// Export kept for backward compat (route exists)
exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const format = params.format || 'csv';
    const result = await api.post('/roles/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Export failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });
    if (format === 'csv') {
        const headers = Object.keys(rows[0]);
        const csv = [headers.join(','), ...rows.map(r => headers.map(h => '"' + (r[h]||'').toString().replace(/"/g,'""') + '"').join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="roles-' + Date.now() + '.csv"');
        return res.send(csv);
    }
    return res.json({ status: 200, data: result.data });
};

exports.create = async (req, res) => {
    const perms = await api.get('/permissions', req.session.token, { grouped: 1 });
    res.render('roles/form', {
        page_title:   'Add Role',
        activeLink:   'roles',
        breadcrumbs:  [],
        role:        null,
        permissions: (perms.status === 200) ? perms.data : [],
    });
};

exports.edit = async (req, res) => {
    const roleResult = await api.get('/roles/' + req.params.uuid, req.session.token);
    if (roleResult.status !== 200) {
        return res.send('<div class="alert alert-danger m-3">Role not found.</div>');
    }
    const perms = await api.get('/permissions', req.session.token, { grouped: 1 });
    res.render('roles/form', {
        page_title:  'Edit Role',
        activeLink:  'roles',
        breadcrumbs: [],
        role:        roleResult.data,
        permissions: (perms.status === 200) ? perms.data : [],
    });
};

/**
 * FIX: Express bodyParser with extended:false stores checkbox arrays as
 * "permission_ids[]" (with brackets) but the API expects "permission_ids".
 * This helper normalises the body before forwarding to API.
 */
function _fixBody(body) {
    const fixed = Object.assign({}, body);
    // Map permission_ids[] → permission_ids
    if (fixed['permission_ids[]'] && !fixed.permission_ids) {
        const raw = fixed['permission_ids[]'];
        fixed.permission_ids = Array.isArray(raw) ? raw.map(Number) : [Number(raw)];
        delete fixed['permission_ids[]'];
    }
    // Ensure permission_ids is always an array of integers
    if (fixed.permission_ids && !Array.isArray(fixed.permission_ids)) {
        fixed.permission_ids = [Number(fixed.permission_ids)];
    }
    if (Array.isArray(fixed.permission_ids)) {
        fixed.permission_ids = fixed.permission_ids.map(Number).filter(n => !isNaN(n) && n > 0);
    }
    return fixed;
}

exports.store = async (req, res) => {
    const body   = _fixBody(req.body);
    const result = await api.post('/roles', body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.update = async (req, res) => {
    const body   = _fixBody(req.body);
    const result = await api.put('/roles/' + req.params.uuid, body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.deleteConfirm = async (req, res) => {
    const roleResult = await api.get('/roles/' + req.params.uuid, req.session.token);
    res.render('roles/delete-modal', {
        role: (roleResult.status === 200) ? roleResult.data : null,
    });
};

exports.destroy = async (req, res) => {
    const result = await api.del('/roles/' + req.params.uuid, req.session.token);
    res.json({ status: result.status, message: result.message });
};