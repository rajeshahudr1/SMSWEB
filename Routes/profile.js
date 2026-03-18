'use strict';

const express  = require('express');
const router   = express.Router();
const Profile  = require('../Controllers/ProfileController');
const { requireLogin } = require('../Middlewares/auth');

router.use(requireLogin);

router.get( '/',                 Profile.index);
router.put( '/',                 Profile.update);           // PUT — profile update
router.post('/upload-image',     Profile.uploadImage);
router.post('/change-password',  Profile.changePassword);  // POST — for users with password
router.post('/set-password',     Profile.setPassword);     // POST — for Google users setting first password

module.exports = router;
