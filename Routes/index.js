'use strict';
const express = require('express');
const router  = express.Router();
const { authGuard } = require('../Middlewares/auth');

// Public (auth) routes — NO authGuard here
router.use('/', require('./auth'));

// ── All protected routes use authGuard ──
// authGuard = requireLogin + periodic token validation with API
router.use('/dashboard',        authGuard, require('./dashboard'));
router.use('/users',            authGuard, require('./users'));
router.use('/roles',            authGuard, require('./roles'));
router.use('/permissions',      authGuard, require('./permissions'));
router.use('/menus',            authGuard, require('./menus'));
router.use('/profile',          authGuard, require('./profile'));
router.use('/settings',         authGuard, require('./settings'));
router.use('/locations',        authGuard, require('./location'));
router.use('/pages',            authGuard, require('./pages'));
router.use('/languages',        authGuard, require('./languages'));
router.use('/master-languages', authGuard, require('./master-languages'));
router.use('/part-types',       authGuard, require('./part-types'));
router.use('/part-locations',   authGuard, require('./part-locations'));
router.use('/part-groups',      authGuard, require('./part-groups'));
router.use('/part-sides',       authGuard, require('./part-sides'));
router.use('/part-brands',      authGuard, require('./part-brands'));


// Root redirect
router.get('/', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/dashboard');
    res.redirect('/login');
});

module.exports = router;