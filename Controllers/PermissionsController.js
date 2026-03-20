'use strict';
const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('permissions/index', {
        page_title: 'Permissions',
        activeLink: 'permissions',
        breadcrumbs: [],
    });
};

exports.getData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const result = await api.get('/permissions', req.session.token, params);
    res.json(result);
};

// Proxy: GET /permissions/actions → API /permissions/actions
exports.getActions = async (req, res) => {
    const result = await api.get('/permissions/actions', req.session.token);
    res.json(result);
};

// Proxy: GET /permissions/menus → API /permissions/menus
exports.getMenus = async (req, res) => {
    const result = await api.get('/permissions/menus', req.session.token, req.query);
    res.json(result);
};

// Keep for backward compat (old route /permissions/create)
exports.create = async (req, res) => {
    res.redirect('/permissions');
};

// Keep for backward compat (old route /:uuid/edit)
exports.edit = async (req, res) => {
    res.redirect('/permissions');
};

exports.store = async (req, res) => {
    const result = await api.post('/permissions', req.body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.update = async (req, res) => {
    const result = await api.put('/permissions/' + req.params.uuid, req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

exports.destroy = async (req, res) => {
    const result = await api.del('/permissions/' + req.params.uuid, req.session.token);
    res.json({ status: result.status, message: result.message });
};