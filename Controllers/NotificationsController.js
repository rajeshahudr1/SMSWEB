'use strict';
const api = require('../helpers/api');

// Page render
exports.page = async (req, res) => {
    res.render('notifications/index', {
        page_title: 'Notifications', activeLink: 'notifications',
        breadcrumbs: [{ name: 'Dashboard', url: '/dashboard' }, { name: 'Notifications', url: '/notifications' }]
    });
};

exports.index = async (req, res) => { res.json(await api.get('/notifications', req.session.token, req.query)); };
exports.unreadCount = async (req, res) => { res.json(await api.get('/notifications/unread-count', req.session.token)); };
exports.show = async (req, res) => { res.json(await api.get('/notifications/' + req.params.uuid, req.session.token)); };
exports.markRead = async (req, res) => { res.json(await api.patch('/notifications/' + req.params.uuid + '/read', {}, req.session.token)); };
exports.markAllRead = async (req, res) => { res.json(await api.post('/notifications/mark-all-read', {}, req.session.token)); };
exports.destroy = async (req, res) => { res.json(await api.del('/notifications/' + req.params.uuid, req.session.token)); };
exports.jobStatus = async (req, res) => { res.json(await api.get('/notifications/job/' + req.params.uuid, req.session.token)); };

// File download proxy
exports.downloadFile = async (req, res) => {
    try {
        const axios = require('axios');
        const BASE = process.env.API_URL || 'http://localhost:3000/api';
        const resp = await axios.get(BASE + '/notifications/' + req.params.uuid + '/download', {
            headers: { Authorization: 'Bearer ' + req.session.token },
            responseType: 'stream'
        });
        // Forward headers
        if (resp.headers['content-type']) res.setHeader('Content-Type', resp.headers['content-type']);
        if (resp.headers['content-disposition']) res.setHeader('Content-Disposition', resp.headers['content-disposition']);
        resp.data.pipe(res);
    } catch (e) {
        res.json({ status: 500, message: 'Download failed.' });
    }
};