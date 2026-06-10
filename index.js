require('dotenv').config();

const express    = require('express');
const path       = require('path');
const bodyParser = require('body-parser');
const session    = require('express-session');
const flash      = require('express-flash');
const engine     = require('ejs-locals');
const chalk      = require('chalk');
const { injectLocals } = require('./Middlewares/auth');
const H          = require('./helpers/helper');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Trust the reverse proxy (Nginx/BT-Panel/Cloudflare) ──
// The app always sits behind Nginx which terminates HTTPS and forwards plain
// HTTP to Node. Trusting the proxy lets Express read the real client IP and
// the original protocol via `X-Forwarded-Proto`. `1` = trust the first hop;
// set TRUST_PROXY=2 if CloudFlare → nginx → node, etc.
app.set('trust proxy', parseInt(process.env.TRUST_PROXY || '1', 10));
app.disable('x-powered-by');

// ── View engine ───────────────────────────────────
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// ── Cross-Origin headers (required for FFmpeg WASM / SharedArrayBuffer) ──
// Skip COEP on any page that loads third-party payment SDKs (Razorpay/Stripe).
// `require-corp` blocks scripts served without `Cross-Origin-Resource-Policy`,
// which Razorpay's checkout.js and Stripe's v3 do not set.
app.use((req, res, next) => {
    const p = req.path || '';
    const isPaymentPage =
        p.startsWith('/subscriptions/payment') ||
        p === '/choose-plan' ||
        p.startsWith('/sales');             // POS checkout uses Razorpay/Stripe inline
    if (!isPaymentPage) {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }
    next();
});

// ── Static files ──────────────────────────────────
// Disable browser caching for static files. The CSS/JS are mostly small,
// the page-loads few, and this saves an entire class of "user reports a bug
// that's already fixed because they're on stale assets" support tickets.
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    setHeaders(res) {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
    },
}));

// ── Body parsers ──────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ── Session ───────────────────────────────────────
app.use(session({
    name:              process.env.SESSION_NAME   || 'sms_session',
    secret:            process.env.SESSION_SECRET || 'changeme_in_production',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        maxAge:   parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        // `secure: true` makes the browser send the cookie ONLY over HTTPS.
        // Behind nginx that works ONLY if nginx forwards `X-Forwarded-Proto:
        // https` AND trust-proxy is on. If either is missing, express-session
        // silently drops the Set-Cookie → browser stores nothing → /dashboard
        // redirects to /login forever. So we default OFF and require an
        // EXPLICIT `COOKIE_SECURE=true` opt-in — set it only after you've
        // confirmed the proxy forwards X-Forwarded-Proto (see SESSION_DEBUG).
        secure:   process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
    },
}));

// ── Session diagnostics ───────────────────────────
// Set SESSION_DEBUG=1 in .env to print one line per request. Tells you
// exactly where login breaks:
//   • cookieSent=false on /dashboard         → browser never stored the cookie
//                                              (secure-cookie / sameSite issue)
//   • cookieSent=true  but hasUser=false     → cookie came back but session
//                                              data was lost in the store
//                                              (MemoryStore restart / PM2 cluster
//                                              → needs a shared DB-backed store)
//   • secure=false while xfproto=https       → trust-proxy/header not effective
// Remove or set SESSION_DEBUG=0 once login works.
if (process.env.SESSION_DEBUG === '1') {
    const sessName = process.env.SESSION_NAME || 'sms_session';
    app.use((req, res, next) => {
        const sid        = req.sessionID ? String(req.sessionID).slice(0, 8) : 'none';
        const hasUser    = !!(req.session && req.session.user);
        const cookieSent = (req.headers.cookie || '').includes(sessName + '=');
        console.log(
            chalk.magenta('[SESSION]'),
            (req.method + ' ' + req.url).padEnd(28),
            '| sid='        + sid,
            '| xfproto='    + (req.headers['x-forwarded-proto'] || '-'),
            '| secure='     + req.secure,
            '| cookieSent=' + cookieSent,
            '| hasUser='    + hasUser,
        );
        next();
    });
}

// ── Flash messages ────────────────────────────────
app.use(flash());

// ── Inject user, settings, i18n into every view ──
app.use(injectLocals);

// ── Expose helpers to all EJS views ──────────────
app.use((req, res, next) => {
    res.locals.H        = H;
    res.locals.settings = req.session.settings || {};
    next();
});

// ── Request logger (development only) ────────────
if (process.env.APP_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()}  ${req.method}  ${req.url}`);
        next();
    });
}

// ── Routes ────────────────────────────────────────
app.use('/', require('./Routes'));

// ── 404 handler ───────────────────────────────────
app.use((req, res) => {
    res.status(404).render('auth/404', { page_title: '404 - Page Not Found' });
});

// ── Error handler ─────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('auth/500', {
        page_title: '500 - Server Error',
        error:      process.env.APP_ENV !== 'production' ? err.message : null,
    });
});

// ── Start ─────────────────────────────────────────
const os = require('os');
function getLocalIps() {
    const ips = [];
    Object.values(os.networkInterfaces()).forEach(ifaces => {
        ifaces.forEach(i => { if (i.family === 'IPv4' && !i.internal) ips.push(i.address); });
    });
    return ips;
}

app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIps();
    console.log(chalk.greenBright(`\n  🚗 SMS Web started`));
    console.log(chalk.cyan(`  URL   : http://localhost:${PORT}`));
    ips.forEach(ip => console.log(chalk.cyan(`          http://${ip}:${PORT}`)));
    console.log(chalk.cyan(`  API   : ${process.env.API_URL || 'http://localhost:3000/api'}\n`));
});
