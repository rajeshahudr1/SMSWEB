'use strict';

const express  = require('express');
const router   = express.Router();
const Profile  = require('../Controllers/ProfileController');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',                 Profile.index);
router.post('/',                 Profile.update);
router.post('/change-password',  Profile.changePassword);

module.exports = router;
