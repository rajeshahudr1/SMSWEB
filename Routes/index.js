'use strict';
const express = require('express');
const router  = express.Router();
const { authGuard } = require('../Middlewares/auth');

// Public (auth) routes — NO authGuard here
router.use('/', require('./auth'));
// Public location routes (needed for signup/google-complete pages before login)
router.use('/locations', require('./location'));

// ── All protected routes use authGuard ──
// authGuard = requireLogin + periodic token validation with API
router.use('/dashboard',        authGuard, require('./dashboard'));
router.use('/users',            authGuard, require('./users'));
router.use('/roles',            authGuard, require('./roles'));
router.use('/permissions',      authGuard, require('./permissions'));
router.use('/menus',            authGuard, require('./menus'));
router.use('/profile',          authGuard, require('./profile'));
router.use('/settings',         authGuard, require('./settings'));
// locations already mounted publicly above for signup/google-complete
router.use('/pages',            authGuard, require('./pages'));
router.use('/languages',        authGuard, require('./languages'));
router.use('/master-languages', authGuard, require('./master-languages'));

// Part Catalog
router.use('/part-types',       authGuard, require('./part-types'));
router.use('/part-locations',   authGuard, require('./part-locations'));
router.use('/part-groups',      authGuard, require('./part-groups'));
router.use('/part-sides',       authGuard, require('./part-sides'));
router.use('/part-brands',      authGuard, require('./part-brands'));
router.use('/part-catalogs',    authGuard, require('./part-catalogs'));

// Vehicle Catalog
router.use('/vehicle-categories', authGuard, require('./vehicle-categories'));
router.use('/vehicle-fuels',      authGuard, require('./vehicle-fuels'));
router.use('/vehicle-years',      authGuard, require('./vehicle-years'));
router.use('/vehicle-types',      authGuard, require('./vehicle-types'));
router.use('/vehicle-makes',      authGuard, require('./vehicle-makes'));
router.use('/vehicle-models',     authGuard, require('./vehicle-models'));
router.use('/vehicle-variants',   authGuard, require('./vehicle-variants'));
router.use('/vehicle-engines',    authGuard, require('./vehicle-engines'));
router.use('/vehicle-inventories', authGuard, require('./vehicle-inventories'));

// Warehouse
router.use('/warehouses',        authGuard, require('./warehouses'));
router.use('/warehouse-zones',   authGuard, require('./warehouse-zones'));
router.use('/warehouse-shelves', authGuard, require('./warehouse-shelves'));
router.use('/warehouse-racks',   authGuard, require('./warehouse-racks'));
router.use('/warehouse-bins',    authGuard, require('./warehouse-bins'));

// Vehicle Autocomplete (shared proxy — serves all /vehicle-*/autocomplete routes)
router.use('/', authGuard, require('./vehicle-autocomplete'));
// Part Autocomplete (shared proxy — serves all /part-*/autocomplete routes)
router.use('/', authGuard, require('./part-autocomplete'));

router.use('/notifications', authGuard, require('./notifications'));

// location
router.use('/countries', authGuard, require('./countries'));
router.use('/states',    authGuard, require('./states'));
router.use('/cities',    authGuard, require('./cities'));

// Activity Logs
router.use('/activity-logs', authGuard, require('./activity-logs'));


// Root redirect
router.get('/', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/dashboard');
    res.redirect('/login');
});

module.exports = router;