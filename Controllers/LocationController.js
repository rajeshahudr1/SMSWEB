'use strict';

const api = require('../helpers/api');

// GET /locations/countries
exports.countries = async (req, res) => {
    const result = await api.get('/locations/countries', null, req.query);
    res.json(result);
};

// GET /locations/countries/:country_id/states
exports.states = async (req, res) => {
    const result = await api.get('/locations/countries/' + req.params.country_id + '/states');
    res.json(result);
};

// GET /locations/states/:state_id/cities
exports.cities = async (req, res) => {
    const result = await api.get('/locations/states/' + req.params.state_id + '/cities', null, req.query);
    res.json(result);
};
