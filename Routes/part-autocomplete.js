'use strict';
const express = require('express');
const router  = express.Router();
const api     = require('../helpers/api');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

function proxy(apiPath) {
    return async (req, res) => {
        try {
            const qs = new URLSearchParams(req.query).toString();
            const url = qs ? apiPath + '?' + qs : apiPath;
            const result = await api.get(url, req.session.token);
            res.json(result);
        } catch (e) {
            res.json({ status: 500, message: 'Proxy failed.' });
        }
    };
}

router.get('/part-types/autocomplete',     proxy('/part-types/autocomplete'));
router.get('/part-locations/autocomplete', proxy('/part-locations/autocomplete'));
router.get('/part-groups/autocomplete',    proxy('/part-groups/autocomplete'));
router.get('/part-sides/autocomplete',     proxy('/part-sides/autocomplete'));
router.get('/part-brands/autocomplete',    proxy('/part-brands/autocomplete'));
router.get('/part-catalogs/autocomplete',  proxy('/part-catalogs/autocomplete'));

module.exports = router;
