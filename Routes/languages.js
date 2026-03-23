'use strict';

const express  = require('express');
const router   = express.Router();
const Lang     = require('../Controllers/LanguagesController');
const { requireLogin, requireSuperAdmin } = require('../Middlewares/auth');

router.use(requireLogin);
router.use(requireSuperAdmin);

router.get('/',            Lang.index);
router.post('/add-key',    Lang.addKey);       // before :code
router.get('/:code',       Lang.get);
router.put('/:code',       Lang.save);

module.exports = router;