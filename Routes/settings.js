'use strict';

const express  = require('express');
const router   = express.Router();
const Settings = require('../Controllers/SettingsController');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',              Settings.index);
router.post('/user',          Settings.saveUser);
router.post('/org',           Settings.saveOrg);
router.post('/theme',         Settings.saveTheme);
router.post('/language',      Settings.setLanguage);
router.get( '/language',      Settings.setLanguage);

// AI Configuration
router.get( '/ai-config',     Settings.getAiConfig);
router.post('/ai-config',     Settings.saveAiConfig);
router.post('/ai-validate',   Settings.validateAiKey);

// Tax Configuration
router.get( '/tax-config',    Settings.getTaxConfig);
router.post('/tax-config',    Settings.saveTaxConfig);

module.exports = router;
