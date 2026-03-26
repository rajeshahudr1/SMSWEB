'use strict';
var api = require('../helpers/api');

var getCompanies = function(tk) { return api.get('/part-types/organizations', tk).then(function(r) { return r.status === 200 ? (r.data || []) : []; }).catch(function() { return []; }); };

exports.index = async function(req, res) {
    var organizations = [];
    if (req.session.user && req.session.user.is_super_admin) {
        organizations = await getCompanies(req.session.token);
    }
    var filterData = await api.get('/activity-logs/modules', req.session.token);
    var data = (filterData && filterData.status === 200) ? filterData.data : {};

    res.render('activity-logs/index', {
        page_title: 'Activity Log',
        activeLink: 'activity-logs',
        breadcrumbs: [
            { name: 'Dashboard', url: '/dashboard' },
            { name: 'Activity Log', url: '/activity-logs' },
        ],
        organizations: organizations,
        modules: data.modules || [],
        actions: data.actions || [],
        users: data.users || [],
    });
};

exports.paginate = async function(req, res) { res.json(await api.post('/activity-logs/paginate', req.body, req.session.token)); };
exports.show = async function(req, res) { res.json(await api.get('/activity-logs/' + req.params.id, req.session.token)); };
exports.compare = async function(req, res) { res.json(await api.post('/activity-logs/compare', req.body, req.session.token)); };
exports.recordHistory = async function(req, res) { res.json(await api.get('/activity-logs/record/' + req.params.module + '/' + req.params.uuid, req.session.token)); };
exports.stats = async function(req, res) { res.json(await api.get('/activity-logs/stats', req.session.token)); };

exports.exportData = async function(req, res) {
    var params = Object.assign({}, req.query, req.body);
    var format = params.format || 'csv';
    var result = await api.post('/activity-logs/export/data', params, req.session.token);
    if (!result || result.status !== 200) return res.json({ status: 500, message: 'Failed.' });
    var rows = result.data.rows || [];
    if (!rows.length) return res.json({ status: 200, message: 'No data.', data: { rows: [] } });

    if (format === 'csv') {
        var hd = Object.keys(rows[0]);
        var csv = [hd.join(',')].concat(rows.map(function(r) {
            return hd.map(function(h) { return '"' + ((r[h] || '').toString().replace(/"/g, '""')) + '"'; }).join(',');
        })).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="activity-logs-' + Date.now() + '.csv"');
        return res.send(csv);
    }
    if (format === 'excel') {
        try {
            var X = require('xlsx');
            var ws = X.utils.json_to_sheet(rows);
            var wb = X.utils.book_new();
            X.utils.book_append_sheet(wb, ws, 'Activity Logs');
            var buf = X.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="activity-logs-' + Date.now() + '.xlsx"');
            return res.send(buf);
        } catch (e) { return res.json({ status: 200, data: result.data }); }
    }
    if (format === 'pdf') {
        var pdfExport = require('../helpers/pdfExport');
        return pdfExport.generate(res, 'Activity Logs', rows);
    }
    return res.json({ status: 200, data: result.data });
};
