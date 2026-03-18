'use strict';
const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('menus/index', {
        page_title:  'Menu Manager',
        activeLink:  'menus',
        breadcrumbs: [{ name:'Dashboard',url:'/dashboard'},{ name:'Menu Manager',url:'/menus'}],
    });
};

// Data endpoint for tree (called by menus.js AJAX)
exports.getData = async (req, res) => {
    const { panel_type = 'b2b', tree = '1' } = req.query;
    const result = await api.get(`/menus?panel_type=${panel_type}&tree=${tree}`, req.session.token);
    res.json(result);
};

exports.create = async (req, res) => {
    // Load all menus for parent_id dropdown
    const menusRes = await api.get('/menus?panel_type=both&tree=false', req.session.token);
    const permsRes = await api.get('/permissions/groups', req.session.token);
    res.render('menus/form', {
        page_title:  'Add Menu Item',
        activeLink:  'menus',
        breadcrumbs: [{ name:'Dashboard',url:'/dashboard'},{ name:'Menu Manager',url:'/menus'},{ name:'Add',url:''}],
        menu:        null,
        allMenus:    menusRes.status === 200 ? menusRes.data : [],
        permGroups:  permsRes.status === 200 ? permsRes.data : [],
    });
};

exports.edit = async (req, res) => {
    const [menuRes, menusRes, permsRes] = await Promise.all([
        api.get('/menus/' + req.params.uuid, req.session.token),
        api.get('/menus?panel_type=both&tree=false', req.session.token),
        api.get('/permissions/groups', req.session.token),
    ]);
    if (menuRes.status !== 200) return res.send('<div class="alert alert-danger m-3">Menu not found.</div>');
    res.render('menus/form', {
        page_title:  'Edit Menu Item',
        activeLink:  'menus',
        breadcrumbs: [{ name:'Dashboard',url:'/dashboard'},{ name:'Menu Manager',url:'/menus'},{ name:'Edit',url:''}],
        menu:       menuRes.data,
        allMenus:   menusRes.status === 200 ? menusRes.data : [],
        permGroups: permsRes.status === 200 ? permsRes.data : [],
    });
};

exports.store = async (req, res) => {
    const result = await api.post('/menus', req.body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.update = async (req, res) => {
    const result = await api.put('/menus/' + req.params.uuid, req.body, req.session.token);
    res.json({ status: result.status, message: result.message });
};

exports.destroy = async (req, res) => {
    const result = await api.del('/menus/' + req.params.uuid, req.session.token);
    res.json({ status: result.status, message: result.message });
};

exports.toggleVisibility = async (req, res) => {
    const result = await api.patch('/menus/' + req.params.uuid + '/toggle-visibility', {}, req.session.token);
    res.json({ status: result.status, message: result.message });
};
