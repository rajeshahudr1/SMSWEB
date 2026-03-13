'use strict';

const express  = require('express');
const router   = express.Router();
const Location = require('../Controllers/LocationController');

// Public — needed for signup and profile forms without auth
router.get('/countries',                       Location.countries);
router.get('/countries/:country_id/states',    Location.states);
router.get('/states/:state_id/cities',         Location.cities);

module.exports = router;
