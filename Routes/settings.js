'use strict';

const express  = require('express');
const router   = express.Router();
const Settings = require('../Controllers/SettingsController');
const { requireLogin } = require('../Middlewares/auth');

// All settings routes require login — language saved to DB needs a token
router.use(requireLogin);

router.get( '/',          Settings.index);
router.post('/user',      Settings.saveUser);
router.post('/org',       Settings.saveOrg);
router.post('/theme',     Settings.saveTheme);     // theme panel quick save
router.post('/language',  Settings.setLanguage);   // language switcher (header dropdown)
router.get( '/language',  Settings.setLanguage);   // language switcher (GET fallback)

module.exports = router;
