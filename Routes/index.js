'use strict';
const express = require('express');
const router  = express.Router();

// Public (auth) routes
router.use('/', require('./auth'));

// Protected routes
router.use('/dashboard',   require('./dashboard'));
router.use('/users',       require('./users'));
router.use('/roles',       require('./roles'));
router.use('/permissions', require('./permissions'));
router.use('/menus',       require('./menus'));
router.use('/profile',     require('./profile'));
router.use('/settings',    require('./settings'));
router.use('/locations',   require('./location'));

// Root redirect
router.get('/', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/dashboard');
    res.redirect('/login');
});

module.exports = router;
