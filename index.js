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

// ── View engine ───────────────────────────────────
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// ── Static files ──────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

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
        secure:   process.env.APP_ENV === 'production',
    },
}));

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
app.listen(PORT, () => {
    console.log(chalk.greenBright(`\n  🚗 SMS Web started on port ${chalk.white.bold(PORT)}`));
    console.log(chalk.cyan(`  App URL : ${process.env.APP_URL || 'http://localhost:' + PORT}`));
    console.log(chalk.cyan(`  API URL : ${process.env.API_URL || 'http://localhost:3000/api'}\n`));
});
