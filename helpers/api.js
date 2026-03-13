'use strict';

/**
 * api.js
 * Central helper to make HTTP calls to sms-api (Solution 1).
 * All web controllers use these functions — never call axios directly in controllers.
 *
 * Pattern:
 *   const api = require('../helpers/api');
 *   const result = await api.get('/users', session.token);
 *   const result = await api.post('/auth/login', { email, password });
 */

const axios = require('axios');

const BASE = process.env.API_URL || 'http://localhost:3000/api';

// ── Build axios headers with optional JWT token ──
function headers(token) {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
}

// ── GET request ──────────────────────────────────
async function get(endpoint, token = null, params = {}) {
    try {
        const res = await axios.get(BASE + endpoint, {
            headers: headers(token),
            params,
        });
        return res.data;
    } catch (err) {
        return _handleError(err);
    }
}

// ── POST request ─────────────────────────────────
async function post(endpoint, body = {}, token = null) {
    try {
        const res = await axios.post(BASE + endpoint, body, {
            headers: headers(token),
        });
        return res.data;
    } catch (err) {
        return _handleError(err);
    }
}

// ── POST with file upload (multipart) ────────────
async function postForm(endpoint, formData, token = null) {
    try {
        const res = await axios.post(BASE + endpoint, formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: token ? 'Bearer ' + token : '',
            },
        });
        return res.data;
    } catch (err) {
        return _handleError(err);
    }
}

// ── PUT request ──────────────────────────────────
async function put(endpoint, body = {}, token = null) {
    try {
        const res = await axios.put(BASE + endpoint, body, {
            headers: headers(token),
        });
        return res.data;
    } catch (err) {
        return _handleError(err);
    }
}

// ── DELETE request ───────────────────────────────
async function del(endpoint, token = null) {
    try {
        const res = await axios.delete(BASE + endpoint, {
            headers: headers(token),
        });
        return res.data;
    } catch (err) {
        return _handleError(err);
    }
}

// ── Normalise axios errors into a consistent shape ──
function _handleError(err) {
    if (err.response && err.response.data) {
        return err.response.data; // API returned a structured error
    }
    return { status: 500, success: false, message: 'Could not connect to API server.' };
}

module.exports = { get, post, put, patch, del, postForm };
// ── PATCH request ─────────────────────────────────────────
async function patch(endpoint, body = {}, token = null) {
    try {
        const res = await axios.patch(BASE + endpoint, body, {
            headers: headers(token),
        });
        return res.data;
    } catch (err) {
        return _handleError(err);
    }
}
