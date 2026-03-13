'use strict';

const express   = require('express');
const router    = express.Router();
const Settings  = require('../Controllers/SettingsController');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',       Settings.index);
router.post('/user',   Settings.saveUser);
router.post('/org',    Settings.saveOrg);

module.exports = router;
