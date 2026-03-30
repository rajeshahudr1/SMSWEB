'use strict';

const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('master-languages/index', {
        page_title:  res.locals.t('master_lang.title', 'Master Languages'),
        activeLink:  'master-languages',
        breadcrumbs: [
            { name: res.locals.t('nav.dashboard', 'Dashboard'), url: '/dashboard' },
            { name: res.locals.t('master_lang.title', 'Master Languages'), url: '/master-languages' },
        ],
        is_super_admin: !!(req.session.user && req.session.user.is_super_admin),
    });
};

exports.organizations = async (req, res) => {
    res.json(await api.get('/master-languages/organizations', req.session.token));
};

exports.paginate = async (req, res) => {
    const result = await api.post('/master-languages/paginate', req.body, req.session.token);
    res.json(result);
};

// DDL data from config/lang/languages.json
exports.availableLanguages = async (req, res) => {
    const result = await api.get('/master-languages/available', req.session.token);
    res.json(result);
};

exports.store = async (req, res) => {
    const result = await api.post('/master-languages', req.body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.show = async (req, res) => {
    const result = await api.get('/master-languages/' + req.params.uuid, req.session.token);
    res.json(result);
};

exports.update = async (req, res) => {
    const result = await api.put('/master-languages/' + req.params.uuid, req.body, req.session.token);
    res.json({ status: result.status, message: result.message, data: result.data || null });
};

exports.destroy = async (req, res) => {
    const result = await api.del('/master-languages/' + req.params.uuid, req.session.token);
    res.json({ status: result.status, message: result.message });
};

exports.toggleStatus = async (req, res) => {
    const result = await api.patch('/master-languages/' + req.params.uuid + '/toggle-status', {}, req.session.token);
    res.json({ status: result.status, message: result.message });
};

exports.usage = async (req, res) => { res.json(await api.get('/master-languages/' + req.params.uuid + '/usage', req.session.token)); };
