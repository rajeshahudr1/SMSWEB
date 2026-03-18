'use strict';

/**
 * helper.js (sms-web)
 * Utility functions for the web (EJS) layer.
 * Date display always uses the user's timezone from session settings.
 */

const moment = require('moment-timezone');

// Default timezone — overridden per-user via settings
const DEFAULT_TZ = process.env.TIMEZONE || 'Asia/Kolkata';

// ── Get timezone from session settings ───────────
// Pass req.session.settings object to get user's tz
function getTZ(settings) {
    return (settings && settings.timezone) ? settings.timezone : DEFAULT_TZ;
}

// ── Format a UTC date from API for display ────────
// Respects user's timezone stored in session settings
function formatDate(date, settings) {
    if (!date) return '-';
    return moment.utc(date).tz(getTZ(settings)).format('DD/MM/YYYY');
}

function formatDateTime(date, settings) {
    if (!date) return '-';
    return moment.utc(date).tz(getTZ(settings)).format('DD/MM/YYYY hh:mm A');
}

function formatTime(date, settings) {
    if (!date) return '-';
    return moment.utc(date).tz(getTZ(settings)).format('hh:mm A');
}

function timeAgo(date, settings) {
    if (!date) return '-';
    const m = moment.utc(date).tz(getTZ(settings));
    return m.fromNow();
}

// ── Format based on user's date_format setting ───
// date_format setting values: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY'
function formatDateSetting(date, settings) {
    if (!date) return '-';
    const fmt = (settings && settings.date_format) ? settings.date_format : 'DD/MM/YYYY';
    return moment.utc(date).tz(getTZ(settings)).format(fmt);
}

// ── Format date+time based on user's date_format + time_format settings ──
function formatDateTimeSetting(date, settings) {
    if (!date) return '-';
    const dateFmt  = (settings && settings.date_format)  ? settings.date_format  : 'DD/MM/YYYY';
    const timeFmt  = (settings && settings.time_format)  ? settings.time_format  : '12h';
    const timePart = timeFmt === '24h' ? 'HH:mm' : 'hh:mm A';
    const fullFmt  = dateFmt + ' ' + timePart;
    return moment.utc(date).tz(getTZ(settings)).format(fullFmt);
}

// ── Asset URL helper ─────────────────────────────
function assetUrl(path) {
    const base = process.env.APP_URL || '';
    return base + '/' + path.replace(/^\//, '');
}

// ── Truncate string ──────────────────────────────
function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
}

// ── Format currency ──────────────────────────────
function currency(amount, symbol) {
    symbol = symbol || '₹';
    if (!amount && amount !== 0) return symbol + '0.00';
    return symbol + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

// ── Capitalise first letter ───────────────────────
function ucFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Status badge HTML ────────────────────────────
function statusBadge(status) {
    if (parseInt(status) === 1) {
        return '<span class="badge bg-success-lt">Active</span>';
    }
    return '<span class="badge bg-danger-lt">Inactive</span>';
}


// ── HTML-escape for safe use in HTML attributes/content ──────
function escape(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}
module.exports = { formatDate, formatDateTime, formatTime, timeAgo, formatDateSetting, formatDateTimeSetting, getTZ, assetUrl, truncate, currency, ucFirst, statusBadge, escape };