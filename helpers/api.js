'use strict';

/**
 * api.js
 * Central helper to make HTTP calls to sms-api.
 * All web controllers use these functions — never call axios directly.
 *
 * AUTH SECURITY:
 *   - Every response with status 401 gets _authExpired: true flag
 *   - Web controllers/middleware can check this flag to auto-logout
 *   - AJAX responses with 401 are caught by global handler in app.js
 */

const axios = require('axios');

const BASE = process.env.API_URL || 'http://localhost:3000/api';

// ── Build axios headers with optional JWT token ──
function headers(token) {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
}

// ── Normalise axios errors into a consistent shape ──
function _handleError(err) {
    if (err.response && err.response.data) {
        const data = err.response.data;
        // Mark 401 responses so middleware can auto-logout
        if (err.response.status === 401) {
            data._authExpired = true;
        }
        return data;
    }
    return { status: 500, success: false, message: 'Could not connect to API server.' };
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
async function del(endpoint, token = null, body = {}) {
    try {
        const res = await axios.delete(BASE + endpoint, {
            headers: headers(token),
            data: body,
        });
        return res.data;
    } catch (err) {
        return _handleError(err);
    }
}

// ── PATCH request ────────────────────────────────
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

module.exports = { get, post, put, patch, del, postForm };