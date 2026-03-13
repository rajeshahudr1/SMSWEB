'use strict';

const express   = require('express');
const router    = express.Router();

const Auth      = require('./auth');
const Dashboard = require('./dashboard');
const Users     = require('./users');
const Roles     = require('./roles');
const Profile   = require('./profile');
const Settings  = require('./settings');
const Location  = require('./location');

// Public routes (no login needed)
router.use('/',          Auth);

// Protected routes
router.use('/dashboard', Dashboard);
router.use('/users',     Users);
router.use('/roles',     Roles);
router.use('/profile',   Profile);
router.use('/settings',  Settings);
router.use('/locations', Location);

// Root → redirect
router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

module.exports = router;
