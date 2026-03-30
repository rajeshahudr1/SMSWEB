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

    // Helper to parse permission array
    function parseIds(key) {
        const raw = fixed[key + '[]'] || fixed[key];
        delete fixed[key + '[]'];
        if (!raw) return [];
        const arr = Array.isArray(raw) ? raw : [raw];
        return [...new Set(arr.map(Number).filter(n => !isNaN(n) && n > 0))];
    }

    fixed.b2b_permission_ids = parseIds('b2b_permission_ids');
    fixed.b2c_permission_ids = parseIds('b2c_permission_ids');

    // Remove old key if exists
    delete fixed.permission_ids;
    delete fixed['permission_ids[]'];

    return fixed;
}

exports.store = async (req, res) => {
    const body   = _fixBody(req.body);
    const result = await api.post('/roles', body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.update = async (req, res) => {
    console.log('RAW BODY:', req.body);  // add this
    const body   = _fixBody(req.body);
    console.log('FIXED BODY:', body);   // add this
    console.log('body',body)
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

exports.usage = async (req, res) => { res.json(await api.get('/roles/' + req.params.uuid + '/usage', req.session.token)); };