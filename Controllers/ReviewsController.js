'use strict';
const api = require('../helpers/api');

exports.index = async (req, res) => {
    res.render('reviews/index', {
        page_title: 'Reviews',
        activeLink: 'reviews',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Reviews', url: '' }],
    });
};

exports.paginate = async (req, res) => {
    res.json(await api.post('/reviews/admin/list', req.body, req.session.token));
};

exports.update = async (req, res) => {
    res.json(await api.put('/reviews/admin/' + req.params.uuid, req.body, req.session.token));
};

exports.destroy = async (req, res) => {
    res.json(await api.del('/reviews/admin/' + req.params.uuid, req.session.token));
};
