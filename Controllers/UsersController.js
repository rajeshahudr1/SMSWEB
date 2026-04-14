'use strict';

const api  = require('../helpers/api');

// ── helpers ──────────────────────────────────────────────
// Load roles for DDL — always exclude is_super_role (nobody assigns super admin via UI)
const getRoles = async (token) => {
    const r = await api.get('/roles?per_page=200', token);
    const roles = r.status === 200 ? (r.data.data || r.data) : [];
    return Array.isArray(roles) ? roles.filter(role => !role.is_super_role) : [];
};

// ── List page ─────────────────────────────────────────────
exports.index = async (req, res) => {
    const roles = await getRoles(req.session.token);
    res.render('users/index', {
        page_title:  res.locals.t ? res.locals.t('users.title') : 'Users',
        activeLink:  'users',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Users',     url: '/users' },
        ],
        roles: Array.isArray(roles) ? roles : [],
        is_super_admin: !!(req.session.user && req.session.user.is_super_admin),
    });
};

exports.organizations = async (req, res) => {
    res.json(await api.get('/users/organizations', req.session.token));
};

// ── Paginate (POST — AJAX from users.js) ─────────────────
exports.paginate = async (req, res) => {
    const result = await api.post('/users/paginate', req.body, req.session.token);
    res.json(result);
};

// ── Export (GET — forward filters to API, then build CSV/Excel) ──
exports.exportData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const format = params.format || 'csv';

    // Fetch all matching data from API
    const result = await api.post('/users/export/data', params, req.session.token);
    if (!result || result.status !== 200) {
        return res.json({ status: 500, message: 'Export failed.' });
    }

    const rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data to export.', data: { rows: [] } });

    if (format === 'csv') {
        const headers = Object.keys(rows[0]);
        const csv = [
            headers.join(','),
            ...rows.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.csv"`);
        return res.send(csv);
    }

    if (format === 'excel') {
        try {
            const XLSX = require('xlsx');
            const ws   = XLSX.utils.json_to_sheet(rows);
            const wb   = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Users');
            const buf  = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.xlsx"`);
            return res.send(buf);
        } catch(e) {
            // xlsx not installed — fallback to JSON for client-side PDF
            return res.json({ status: 200, message: 'Excel ready.', data: result.data });
        }
    }

    // For pdf/print — return JSON for client-side generation
    return res.json({ status: 200, message: 'Data ready.', data: result.data });
};

// ── Import (POST multipart) ───────────────────────────────
exports.importData = async (req, res) => {
    try {
        if (!req.file) return res.json({ status: 422, message: 'No file uploaded.' });

        const FormData = require('form-data');
        const fs       = require('fs');
        const fd       = new FormData();
        fd.append('file', fs.createReadStream(req.file.path), {
            filename:    req.file.originalname,
            contentType: req.file.mimetype,
        });

        const result = await api.postForm('/users/import/upload', fd, req.session.token);
        try { fs.unlinkSync(req.file.path); } catch(e) {}
        return res.json(result);
    } catch(err) {
        return res.json({ status: 500, message: 'Import request failed.' });
    }
};

// ── Bulk action ────────────────────────────────────────────
exports.bulkAction = async (req, res) => {
    const result = await api.post('/users/bulk-action', req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

// ── Create (offcanvas form page) ────────────────────────────
exports.create = async (req, res) => {
    const isSA = !!(req.session.user && req.session.user.is_super_admin);
    const [roles, countries, orgsResult] = await Promise.all([
        getRoles(req.session.token),
        api.get('/locations/countries', req.session.token).then(r => r.status === 200 ? r.data : []),
        isSA ? api.get('/users/organizations', req.session.token) : Promise.resolve({ data: [] }),
    ]);
    res.render('users/form', {
        page_title: 'Add User', activeLink: 'users',
        breadcrumbs: [{ name:'Dashboard',url:'/dashboard'},{name:'Users',url:'/users'},{name:'Add User',url:''}],
        user: null, roles, countries,
        is_super_admin: isSA, organizations: orgsResult.data || [],
    });
};

// ── View data (AJAX — for view modal with user + perms + menus) ─────
exports.viewData = async (req, res) => {
    const result = await api.get('/users/' + req.params.uuid + '/view', req.session.token);
    res.json(result);
};

// ── Edit form ────────────────────────────────────────────────
exports.edit = async (req, res) => {
    const isSA = !!(req.session.user && req.session.user.is_super_admin);
    const [userResult, roles, countries, orgsResult] = await Promise.all([
        api.get('/users/' + req.params.uuid, req.session.token),
        getRoles(req.session.token),
        api.get('/locations/countries', req.session.token).then(r => r.status === 200 ? r.data : []),
        isSA ? api.get('/users/organizations', req.session.token) : Promise.resolve({ data: [] }),
    ]);
    if (userResult.status !== 200) return res.send('<div class="alert alert-danger m-3">User not found.</div>');
    res.render('users/form', {
        page_title: 'Edit User', activeLink: 'users',
        breadcrumbs: [{ name:'Dashboard',url:'/dashboard'},{name:'Users',url:'/users'},{name:'Edit User',url:''}],
        user: userResult.data, roles, countries,
        is_super_admin: isSA, organizations: orgsResult.data || [],
    });
};

// ── Store / Update / Delete / Toggle ────────────────────────
exports.store = async (req, res) => {
    const result = await api.post('/users', req.body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.update = async (req, res) => {
    const result = await api.put('/users/' + req.params.uuid, req.body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.toggleStatus = async (req, res) => {
    const result = await api.patch('/users/' + req.params.uuid + '/toggle-status', {}, req.session.token);
    res.json({ status: result.status, message: result.message });
};

exports.deleteConfirm = async (req, res) => {
    const userResult = await api.get('/users/' + req.params.uuid, req.session.token);
    res.render('users/delete-modal', { user: (userResult.status === 200) ? userResult.data : null });
};

exports.destroy = async (req, res) => {
    const result = await api.del('/users/' + req.params.uuid, req.session.token);
    res.json({ status: result.status, message: result.message });
};