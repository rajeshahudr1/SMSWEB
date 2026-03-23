'use strict';
/**
 * i18n.js — SMS Web Multi-Language System
 * ─────────────────────────────────────────────────────────
 * ALL language data comes from the API — nothing hardcoded here.
 *   - Supported languages list: /api/languages/supported
 *   - Translations:            /api/languages/translations/:code
 * Both are cached in memory with 5-minute TTL.
 */

const axios = require('axios');

const API_BASE     = process.env.API_URL || 'http://localhost:3000/api';
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── In-memory caches ──
const transCache = {};  // { code: { data: {}, loadedAt: ts } }
let langListCache = { data: null, loadedAt: 0 };

// ── Fallback (used only if API is unreachable on first request) ──
const FALLBACK_EN = {
    'nav.dashboard': 'Dashboard', 'nav.users': 'Users', 'nav.roles': 'Roles',
    'nav.settings': 'Settings', 'nav.profile': 'My Profile', 'nav.logout': 'Logout',
    'nav.languages': 'Languages',
    'btn.save': 'Save', 'btn.cancel': 'Cancel', 'btn.delete': 'Delete',
    'btn.edit': 'Edit', 'btn.add': 'Add', 'btn.search': 'Search',
    'btn.saving': 'Saving...', 'btn.loading': 'Loading...',
    'general.error': 'Something went wrong.', 'general.loading': 'Loading…',
    'lang.title': 'Language Manager', 'lang.select': 'Select Language',
};
const FALLBACK_LANGS = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

/**
 * Fetch supported languages list from API (cached 5 min).
 */
async function fetchSupportedLanguages() {
    const now = Date.now();
    if (langListCache.data && (now - langListCache.loadedAt) < CACHE_TTL_MS) {
        return langListCache.data;
    }
    try {
        const res = await axios.get(`${API_BASE}/languages/supported`, { timeout: 3000 });
        if (res.data && res.data.status === 200 && Array.isArray(res.data.data)) {
            langListCache = { data: res.data.data, loadedAt: now };
            return res.data.data;
        }
    } catch (e) {
        console.warn('[i18n] Failed to fetch supported languages:', e.message);
    }
    return langListCache.data || FALLBACK_LANGS;
}

/**
 * Get supported languages SYNC (from cache only).
 */
function getSupportedLanguagesSync() {
    return langListCache.data || FALLBACK_LANGS;
}

/**
 * Fetch translations for a language code from API.
 */
async function fetchTranslations(code) {
    try {
        const res = await axios.get(`${API_BASE}/languages/translations/${code}`, { timeout: 3000 });
        if (res.data && res.data.status === 200) return res.data.data;
    } catch (e) {
        console.warn(`[i18n] Failed to fetch translations for "${code}":`, e.message);
    }
    return null;
}

/**
 * Get cached or fresh translations.
 */
async function getTranslationsAsync(code) {
    const now    = Date.now();
    const cached = transCache[code];
    if (cached && (now - cached.loadedAt) < CACHE_TTL_MS) return cached.data;

    const data = await fetchTranslations(code);
    if (data) { transCache[code] = { data, loadedAt: now }; return data; }
    if (cached) return cached.data;
    return FALLBACK_EN;
}

function getTranslationsSync(code) {
    const cached = transCache[code];
    return cached ? cached.data : FALLBACK_EN;
}

/**
 * Preload language + languages list (call in middleware before render).
 */
async function preloadLanguage(code) {
    await fetchSupportedLanguages();
    await getTranslationsAsync(code || 'en');
}

function getTranslator(lang) {
    const dict = getTranslationsSync(lang || 'en');
    const base = getTranslationsSync('en');
    return function t(key, fallback) {
        return dict[key] || base[key] || fallback || key;
    };
}

function getDict(lang) {
    return Object.assign({}, getTranslationsSync('en'), getTranslationsSync(lang || 'en'));
}

/**
 * Clear caches.
 */
function clearCache(code) {
    if (code) { delete transCache[code]; }
    else { Object.keys(transCache).forEach(k => delete transCache[k]); }
    // Also clear languages list cache so new languages show up
    langListCache = { data: null, loadedAt: 0 };
}

module.exports = {
    getTranslator,
    getDict,
    preloadLanguage,
    clearCache,
    getSupportedLanguagesSync,
    fetchSupportedLanguages,
};