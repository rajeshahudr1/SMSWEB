'use strict';
const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('menus/index', {
        page_title: 'Menu Manager',
        activeLink: 'menus',
        // No breadcrumbs — index.ejs has its own page-header with action buttons
    });
};

exports.getData = async (req, res) => {
    const { panel_type = 'b2b', tree = '1' } = req.query;
    const result = await api.get(`/menus?panel_type=${panel_type}&tree=${tree}`, req.session.token);
    res.json(result);
};

exports.getFlat = async (req, res) => {
    // panel_type=all → API returns every menu regardless of panel filter
    const result = await api.get('/menus?panel_type=all&tree=false', req.session.token);
    res.json(result);
};

exports.create = async (req, res) => {
    const [menusRes, permsRes] = await Promise.all([
        api.get('/menus?panel_type=all&tree=false', req.session.token),
        api.get('/permissions/groups', req.session.token),
    ]);

    const allMenus   = menusRes.status === 200 ? menusRes.data : [];
    const permGroups = permsRes.status === 200 ? permsRes.data : []; // array of strings

    // Pre-select parent if passed
    let preselectedParent = null;
    if (req.query.parent_id) {
        preselectedParent = allMenus.find(m => String(m.id) === String(req.query.parent_id)) || null;
    }

    // Current panel from JS tab selection (b2b or b2c), defaults to b2b
    const currentPanel = req.query.panel || 'b2b';

    // Filter allMenus to only those visible in the active panel
    // (panel_type = currentPanel OR panel_type = 'both')
    const panelMenus = allMenus.filter(m =>
        m.panel_type === currentPanel || m.panel_type === 'both'
    );

    // Compute next sort_order = max(siblings.sort_order) + 1
    const parentId = preselectedParent ? preselectedParent.id : null;
    const siblings = panelMenus.filter(m =>
        parentId === null ? !m.parent_id : String(m.parent_id) === String(parentId)
    );
    const nextSortOrder = siblings.length
        ? Math.max(...siblings.map(m => parseInt(m.sort_order) || 0)) + 1
        : 1;

    const takenOrders = siblings.map(m => parseInt(m.sort_order) || 0);

    res.render('menus/form', {
        page_title: 'Add Menu', activeLink: 'menus',
        menu: null, allMenus: panelMenus, permGroups, preselectedParent,
        nextSortOrder, takenOrders, currentPanel,
    });
};

exports.edit = async (req, res) => {
    const [menuRes, menusRes, permsRes] = await Promise.all([
        api.get('/menus/' + req.params.uuid, req.session.token),
        api.get('/menus?panel_type=all&tree=false', req.session.token),
        api.get('/permissions/groups', req.session.token),
    ]);
    if (menuRes.status !== 200)
        return res.send('<div class="alert alert-danger m-3">Menu not found.</div>');

    const editMenu   = menuRes.data;
    const allMenus_e = menusRes.status === 200 ? menusRes.data : [];

    // Current panel from JS tab selection — edit form shows this as context
    const currentPanel = req.query.panel || editMenu.panel_type || 'b2b';

    // Filter menus for parent dropdown to current panel only
    const panelMenus_e = allMenus_e.filter(m =>
        m.panel_type === currentPanel || m.panel_type === 'both'
    );

    // Compute siblings at same level to know what sort orders are taken
    const siblings_e = panelMenus_e.filter(m =>
        editMenu.parent_id
            ? String(m.parent_id) === String(editMenu.parent_id)
            : !m.parent_id
    ).filter(m => m.id !== editMenu.id); // exclude self

    const takenOrders = siblings_e.map(m => parseInt(m.sort_order) || 0);

    res.render('menus/form', {
        page_title: 'Edit Menu', activeLink: 'menus',
        menu: editMenu,
        allMenus:   panelMenus_e,
        permGroups: permsRes.status === 200 ? permsRes.data : [],
        preselectedParent: null,
        nextSortOrder: editMenu.sort_order || 1,
        takenOrders, currentPanel,
    });
};

exports.store = async (req, res) => {
    const r = await api.post('/menus', req.body, req.session.token);
    res.json({ status: r.status, message: r.message, data: r.data || null });
};

exports.update = async (req, res) => {
    const r = await api.put('/menus/' + req.params.uuid, req.body, req.session.token);
    res.json({ status: r.status, message: r.message });
};

exports.destroy = async (req, res) => {
    const r = await api.del('/menus/' + req.params.uuid, req.session.token);
    res.json({ status: r.status, message: r.message });
};

exports.toggleVisibility = async (req, res) => {
    const r = await api.patch('/menus/' + req.params.uuid + '/toggle-visibility', {}, req.session.token);
    res.json({ status: r.status, message: r.message });
};

exports.move = async (req, res) => {
    const r = await api.post('/menus/' + req.params.uuid + '/move', req.body, req.session.token);
    res.json({ status: r.status, message: r.message, data: r.data || null });
};

exports.reorder = async (req, res) => {
    const r = await api.post('/menus/reorder', req.body, req.session.token);
    res.json({ status: r.status, message: r.message });
};