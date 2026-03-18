'use strict';

const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('roles/index', {
        page_title:  res.locals.t ? res.locals.t('roles.title') : 'Roles',
        activeLink:  'roles',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Roles',     url: '/roles' },
        ],
    });
};

exports.paginate = async (req, res) => {
    const result = await api.post('/roles/paginate', req.body, req.session.token);
    res.json(result);
};

exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const format = params.format || 'csv';
    const result = await api.post('/roles/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Export failed.' });
    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data to export.', data: { rows: [] } });
    if (format === 'csv') {
        const headers = Object.keys(rows[0]);
        const csv = [headers.join(','), ...rows.map(r => headers.map(h => '"' + (r[h]||'').toString().replace(/"/g,'""') + '"').join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="roles-' + Date.now() + '.csv"');
        return res.send(csv);
    }
    return res.json({ status: 200, message: 'Data ready.', data: result.data });
};

exports.create = async (req, res) => {
    const perms = await api.get('/permissions', req.session.token, { grouped: 1 });
    res.render('roles/form', {
        page_title:   'Add Role',
        activeLink:   'roles',
        breadcrumbs:  [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Roles',     url: '/roles' },
            { name: 'Add Role',  url: '' },
        ],
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
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Roles',     url: '/roles' },
            { name: 'Edit Role', url: '' },
        ],
        role:        roleResult.data,
        permissions: (perms.status === 200) ? perms.data : [],
    });
};

exports.store = async (req, res) => {
    const result = await api.post('/roles', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

exports.update = async (req, res) => {
    const result = await api.put('/roles/' + req.params.uuid, req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
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
