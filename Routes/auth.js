'use strict';

const express = require('express');
const router  = express.Router();
const Auth    = require('../Controllers/AuthController');
const { guestOnly } = require('../Middlewares/auth');

// ── Guest-only pages ──────────────────────────────────────
router.get( '/login',                   guestOnly, Auth.loginPage);
router.post('/login',                   guestOnly, Auth.loginPost);

router.get( '/signup',                  guestOnly, Auth.signupPage);
router.post('/signup',                  guestOnly, Auth.signupPost);

router.get( '/verify-email',            guestOnly, Auth.verifyEmailPage);
router.post('/verify-email',            guestOnly, Auth.verifyEmailPost);
router.post('/resend-otp',                         Auth.resendOtpPost);

router.get( '/google-complete',         guestOnly, Auth.googleCompletePage);
router.post('/google-complete',                    Auth.googleCompletePost);
router.post('/auth/google',                        Auth.googlePost);

router.get( '/forgot-password',         guestOnly, Auth.forgotPage);
router.post('/forgot-password',         guestOnly, Auth.forgotPost);
router.get( '/reset-password/:token',   guestOnly, Auth.resetPage);
router.post('/reset-password',          guestOnly, Auth.resetPost);

// ── Logout ────────────────────────────────────────────────
router.get('/logout', Auth.logout);

module.exports = router;

// ── Static legal pages ─────────────────────────────────────
router.get('/terms',   (req, res) => res.render('auth/terms',   { page_title:'Terms & Conditions', APP_NAME: process.env.APP_NAME||'SMS', BASE_URL:'', flash_success:null, flash_error:null }));
router.get('/privacy', (req, res) => res.render('auth/privacy', { page_title:'Privacy Policy',      APP_NAME: process.env.APP_NAME||'SMS', BASE_URL:'', flash_success:null, flash_error:null }));
