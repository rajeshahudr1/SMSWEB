'use strict';
const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('permissions/index', {
        page_title: 'Permissions',
        activeLink: 'permissions',
        breadcrumbs: [{ name:'Dashboard',url:'/dashboard'},{name:'Permissions',url:'/permissions'}],
    });
};

exports.getData = async (req, res) => {
    const params = Object.assign({}, req.query, req.body);
    const result = await api.get('/permissions', req.session.token, params);
    res.json(result);
};

exports.create = async (req, res) => {
    const groups = await api.get('/permissions/groups', req.session.token);
    res.render('permissions/form', {
        page_title:'Add Permission', activeLink:'permissions',
        breadcrumbs:[{name:'Dashboard',url:'/dashboard'},{name:'Permissions',url:'/permissions'},{name:'Add',url:''}],
        permission: null,
        groups: groups.status === 200 ? groups.data : [],
    });
};

exports.edit = async (req, res) => {
    const [permRes, groupsRes] = await Promise.all([
        api.get('/permissions/' + req.params.uuid, req.session.token),
        api.get('/permissions/groups', req.session.token),
    ]);
    if (permRes.status !== 200) return res.send('<div class="alert alert-danger m-3">Permission not found.</div>');
    res.render('permissions/form', {
        page_title:'Edit Permission', activeLink:'permissions',
        breadcrumbs:[{name:'Dashboard',url:'/dashboard'},{name:'Permissions',url:'/permissions'},{name:'Edit',url:''}],
        permission: permRes.data,
        groups: groupsRes.status === 200 ? groupsRes.data : [],
    });
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
