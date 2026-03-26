'use strict';
const express = require('express');
const router  = express.Router();
const api     = require('../helpers/api');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

function proxy(apiPath) {
    return async (req, res) => {
        try {
            // Build query string from req.query and pass to API
            const qs = new URLSearchParams(req.query).toString();
            const url = qs ? apiPath + '?' + qs : apiPath;
            const result = await api.get(url, req.session.token);
            res.json(result);
        } catch (e) {
            res.json({ status: 500, message: 'Proxy failed.' });
        }
    };
}

router.get('/vehicle-years/autocomplete',    proxy('/vehicle-years/autocomplete'));
router.get('/vehicle-types/autocomplete',    proxy('/vehicle-types/autocomplete'));
router.get('/vehicle-makes/autocomplete',    proxy('/vehicle-makes/autocomplete'));
router.get('/vehicle-models/autocomplete',   proxy('/vehicle-models/autocomplete'));
router.get('/vehicle-variants/autocomplete', proxy('/vehicle-variants/autocomplete'));
router.get('/vehicle-engines/autocomplete',  proxy('/vehicle-engines/autocomplete'));

module.exports = router;