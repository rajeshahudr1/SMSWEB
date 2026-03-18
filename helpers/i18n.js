'use strict';
/**
 * i18n.js — SMS Web Multi-Language System
 * ─────────────────────────────────────────────────────────
 * Usage in EJS  :  <%- t('nav.dashboard') %>
 * Usage in JS   :  window.SMS_T('nav.dashboard')
 *
 * Add a new language:
 *   1. Add a new key block in TRANSLATIONS below
 *   2. Add the option in SUPPORTED_LANGUAGES array
 *   3. Add flag + name in the header dropdown
 * ─────────────────────────────────────────────────────────
 */

const TRANSLATIONS = {

  /* ══════════════════════════════════════════════ ENGLISH */
  en: {
    // Navigation
    'nav.dashboard':     'Dashboard',
    'nav.users':         'Users',
    'nav.roles':         'Roles',
    'nav.settings':      'Settings',
    'nav.profile':       'My Profile',
    'nav.logout':        'Logout',
    'nav.notifications': 'Notifications',
    'nav.no_notif':      'No new notifications',
    'nav.view_all':      'View all',

    // Buttons
    'btn.save':          'Save',
    'btn.cancel':        'Cancel',
    'btn.delete':        'Delete',
    'btn.edit':          'Edit',
    'btn.add':           'Add',
    'btn.search':        'Search',
    'btn.export':        'Export',
    'btn.import':        'Import',
    'btn.reset':         'Reset',
    'btn.close':         'Close',
    'btn.confirm':       'Confirm',
    'btn.back':          'Back',
    'btn.next':          'Next',
    'btn.submit':        'Submit',
    'btn.saving':        'Saving...',
    'btn.loading':       'Loading...',
    'btn.apply':         'Apply',

    // Dashboard
    'dash.welcome':        'Welcome back',
    'dash.total_users':    'Total Users',
    'dash.vehicles_today': 'Vehicles Today',
    'dash.roles':          'Roles',
    'dash.permissions':    'Permissions',
    'dash.quick_actions':  'Quick Actions',
    'dash.recent':         'Recent Activity',
    'dash.storage':        'Storage Used',
    'dash.org':            'Organisation',
    'dash.role':           'Role',
    'dash.panel':          'Panel',

    // Users
    'users.title':         'Users',
    'users.add':           'Add User',
    'users.edit':          'Edit User',
    'users.delete':        'Delete User',
    'users.name':          'Name',
    'users.email':         'Email',
    'users.phone':         'Phone',
    'users.role':          'Role',
    'users.panel':         'Panel',
    'users.status':        'Status',
    'users.actions':       'Actions',
    'users.active':        'Active',
    'users.inactive':      'Inactive',
    'users.verified':      'Verified',
    'users.not_verified':  'Unverified',
    'users.bulk_action':   'Bulk Action',
    'users.select_action': 'Select Action',
    'users.activate':      'Activate',
    'users.deactivate':    'Deactivate',
    'users.no_users':      'No users found',
    'users.search_ph':     'Search name, email, phone…',
    'users.import_tmpl':   'Download CSV template',
    'users.total':         'Total users',

    // Roles
    'roles.title':       'Roles',
    'roles.add':         'Add Role',
    'roles.edit':        'Edit Role',
    'roles.delete':      'Delete Role',
    'roles.name':        'Role Name',
    'roles.permissions': 'Permissions',
    'roles.no_roles':    'No roles found',
    'roles.panel_type':  'Panel Type',

    // Settings
    'settings.title':         'Settings',
    'settings.appearance':    'Theme & Appearance',
    'settings.theme_color':   'Theme Colour',
    'settings.dark_mode':     'Dark Mode',
    'settings.light_mode':    'Light Mode',
    'settings.font_size':     'Font Size',
    'settings.font_small':    'Small (12px)',
    'settings.font_medium':   'Medium (14px)',
    'settings.font_large':    'Large (16px)',
    'settings.layout':        'Layout',
    'settings.direction':     'Direction',
    'settings.ltr':           'Left to Right (LTR)',
    'settings.rtl':           'Right to Left (RTL)',
    'settings.border_radius': 'Border Radius',
    'settings.sidebar_style': 'Sidebar Theme',
    'settings.sidebar_dark':  'Dark',
    'settings.sidebar_light': 'Light',
    'settings.localization':  'Localisation',
    'settings.language':      'Language',
    'settings.date_format':   'Date Format',
    'settings.timezone':      'Timezone',
    'settings.per_page':      'Items per Page',
    'settings.save':          'Save Settings',
    'settings.reset':         'Reset to Default',
    'settings.saved':         'Settings saved successfully.',
    'settings.reset_done':    'Settings reset to default.',
    'settings.preview':       'Preview',
    'settings.changes_note':  'Changes take effect immediately across all pages.',

    // Theme Customise Panel (Tabler-style)
    'theme.title':        'Customise',
    'theme.subtitle':     'Personalise your interface',
    'theme.color':        'Accent Colour',
    'theme.mode':         'Mode',
    'theme.dark':         'Dark',
    'theme.light':        'Light',
    'theme.direction':    'Direction',
    'theme.ltr':          'LTR',
    'theme.rtl':          'RTL',
    'theme.radius':       'Border Radius',
    'theme.radius_none':  'None',
    'theme.radius_sm':    'Small',
    'theme.radius_md':    'Medium',
    'theme.radius_lg':    'Large',
    'theme.radius_xl':    'Extra Large',
    'theme.font':         'Font Size',
    'theme.sidebar':      'Sidebar',
    'theme.save':         'Save Preferences',
    'theme.reset':        'Reset',

    // Auth
    'auth.login':        'Sign in',
    'auth.logout':       'Logout',
    'auth.signup':       'Create account',
    'auth.email':        'Email address',
    'auth.password':     'Password',
    'auth.forgot':       'Forgot password?',
    'auth.remember':     'Keep me signed in',
    'auth.no_account':   'New to SMS?',
    'auth.have_account': 'Already have an account?',

    // General
    'general.yes':       'Yes',
    'general.no':        'No',
    'general.na':        '—',
    'general.all':       'All',
    'general.none':      'None',
    'general.select':    '-- Select --',
    'general.created':   'Created',
    'general.updated':   'Updated',
    'general.deleted':   'Deleted',
    'general.error':     'Something went wrong. Please try again.',
    'general.no_data':   'No data found.',
    'general.loading':   'Loading…',
    'general.copyright': 'Scrap Management System',
    'general.showing':   'Showing',
    'general.of':        'of',
    'general.results':   'results',
    'general.page':      'Page',
    'general.filters':   'Filters',
    'general.clear':     'Clear',
  },

  /* ══════════════════════════════════════════════ HINDI */
  hi: {
    // Navigation
    'nav.dashboard':     'डैशबोर्ड',
    'nav.users':         'उपयोगकर्ता',
    'nav.roles':         'भूमिकाएं',
    'nav.settings':      'सेटिंग्स',
    'nav.profile':       'मेरी प्रोफाइल',
    'nav.logout':        'लॉग आउट',
    'nav.notifications': 'सूचनाएं',
    'nav.no_notif':      'कोई नई सूचना नहीं',
    'nav.view_all':      'सभी देखें',

    // Buttons
    'btn.save':          'सहेजें',
    'btn.cancel':        'रद्द करें',
    'btn.delete':        'हटाएं',
    'btn.edit':          'संपादित करें',
    'btn.add':           'जोड़ें',
    'btn.search':        'खोजें',
    'btn.export':        'निर्यात',
    'btn.import':        'आयात',
    'btn.reset':         'रीसेट',
    'btn.close':         'बंद करें',
    'btn.confirm':       'पुष्टि करें',
    'btn.back':          'वापस',
    'btn.next':          'अगला',
    'btn.submit':        'जमा करें',
    'btn.saving':        'सहेजा जा रहा है...',
    'btn.loading':       'लोड हो रहा है...',
    'btn.apply':         'लागू करें',

    // Dashboard
    'dash.welcome':        'वापस स्वागत है',
    'dash.total_users':    'कुल उपयोगकर्ता',
    'dash.vehicles_today': 'आज के वाहन',
    'dash.roles':          'भूमिकाएं',
    'dash.permissions':    'अनुमतियां',
    'dash.quick_actions':  'त्वरित क्रियाएं',
    'dash.recent':         'हाल की गतिविधि',
    'dash.storage':        'स्टोरेज उपयोग',
    'dash.org':            'संगठन',
    'dash.role':           'भूमिका',
    'dash.panel':          'पैनल',

    // Users
    'users.title':         'उपयोगकर्ता',
    'users.add':           'उपयोगकर्ता जोड़ें',
    'users.edit':          'उपयोगकर्ता संपादित करें',
    'users.delete':        'उपयोगकर्ता हटाएं',
    'users.name':          'नाम',
    'users.email':         'ईमेल',
    'users.phone':         'फोन',
    'users.role':          'भूमिका',
    'users.panel':         'पैनल',
    'users.status':        'स्थिति',
    'users.actions':       'क्रियाएं',
    'users.active':        'सक्रिय',
    'users.inactive':      'निष्क्रिय',
    'users.verified':      'सत्यापित',
    'users.not_verified':  'असत्यापित',
    'users.bulk_action':   'थोक क्रिया',
    'users.select_action': 'क्रिया चुनें',
    'users.activate':      'सक्रिय करें',
    'users.deactivate':    'निष्क्रिय करें',
    'users.no_users':      'कोई उपयोगकर्ता नहीं मिला',
    'users.search_ph':     'नाम, ईमेल, फोन खोजें…',
    'users.import_tmpl':   'CSV टेम्पलेट डाउनलोड करें',
    'users.total':         'कुल उपयोगकर्ता',

    // Roles
    'roles.title':       'भूमिकाएं',
    'roles.add':         'भूमिका जोड़ें',
    'roles.edit':        'भूमिका संपादित करें',
    'roles.delete':      'भूमिका हटाएं',
    'roles.name':        'भूमिका का नाम',
    'roles.permissions': 'अनुमतियां',
    'roles.no_roles':    'कोई भूमिका नहीं मिली',
    'roles.panel_type':  'पैनल प्रकार',

    // Settings
    'settings.title':         'सेटिंग्स',
    'settings.appearance':    'थीम और रूप',
    'settings.theme_color':   'थीम रंग',
    'settings.dark_mode':     'डार्क मोड',
    'settings.light_mode':    'लाइट मोड',
    'settings.font_size':     'फ़ॉन्ट आकार',
    'settings.font_small':    'छोटा (12px)',
    'settings.font_medium':   'मध्यम (14px)',
    'settings.font_large':    'बड़ा (16px)',
    'settings.layout':        'लेआउट',
    'settings.direction':     'दिशा',
    'settings.ltr':           'बाएं से दाएं (LTR)',
    'settings.rtl':           'दाएं से बाएं (RTL)',
    'settings.border_radius': 'बॉर्डर रेडियस',
    'settings.sidebar_style': 'साइडबार थीम',
    'settings.sidebar_dark':  'डार्क',
    'settings.sidebar_light': 'लाइट',
    'settings.localization':  'स्थानीयकरण',
    'settings.language':      'भाषा',
    'settings.date_format':   'दिनांक प्रारूप',
    'settings.timezone':      'टाइमज़ोन',
    'settings.per_page':      'प्रति पृष्ठ आइटम',
    'settings.save':          'सेटिंग्स सहेजें',
    'settings.reset':         'डिफ़ॉल्ट पर रीसेट करें',
    'settings.saved':         'सेटिंग्स सफलतापूर्वक सहेजी गईं।',
    'settings.reset_done':    'सेटिंग्स डिफ़ॉल्ट पर रीसेट हो गई।',
    'settings.preview':       'पूर्वावलोकन',
    'settings.changes_note':  'परिवर्तन तुरंत सभी पृष्ठों पर लागू होते हैं।',

    // Theme Customise Panel
    'theme.title':        'कस्टमाइज़ करें',
    'theme.subtitle':     'अपना इंटरफेस व्यक्तिगत बनाएं',
    'theme.color':        'थीम रंग',
    'theme.mode':         'मोड',
    'theme.dark':         'डार्क',
    'theme.light':        'लाइट',
    'theme.direction':    'दिशा',
    'theme.ltr':          'LTR',
    'theme.rtl':          'RTL',
    'theme.radius':       'बॉर्डर रेडियस',
    'theme.radius_none':  'कोई नहीं',
    'theme.radius_sm':    'छोटा',
    'theme.radius_md':    'मध्यम',
    'theme.radius_lg':    'बड़ा',
    'theme.radius_xl':    'बहुत बड़ा',
    'theme.font':         'फ़ॉन्ट आकार',
    'theme.sidebar':      'साइडबार',
    'theme.save':         'प्राथमिकताएं सहेजें',
    'theme.reset':        'रीसेट',

    // Auth
    'auth.login':        'साइन इन करें',
    'auth.logout':       'लॉग आउट',
    'auth.signup':       'खाता बनाएं',
    'auth.email':        'ईमेल पता',
    'auth.password':     'पासवर्ड',
    'auth.forgot':       'पासवर्ड भूल गए?',
    'auth.remember':     'मुझे साइन इन रखें',
    'auth.no_account':   'SMS पर नए हैं?',
    'auth.have_account': 'पहले से खाता है?',

    // General
    'general.yes':       'हां',
    'general.no':        'नहीं',
    'general.na':        '—',
    'general.all':       'सभी',
    'general.none':      'कोई नहीं',
    'general.select':    '-- चुनें --',
    'general.created':   'बनाया गया',
    'general.updated':   'अपडेट किया गया',
    'general.deleted':   'हटाया गया',
    'general.error':     'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
    'general.no_data':   'कोई डेटा नहीं मिला।',
    'general.loading':   'लोड हो रहा है…',
    'general.copyright': 'स्क्रैप प्रबंधन प्रणाली',
    'general.showing':   'दिखा रहे हैं',
    'general.of':        'में से',
    'general.results':   'परिणाम',
    'general.page':      'पृष्ठ',
    'general.filters':   'फ़िल्टर',
    'general.clear':     'साफ़ करें',
  },
};

function getTranslator(lang = 'en') {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const base  = TRANSLATIONS['en'];
  return function t(key, fallback) {
    return dict[key] || base[key] || fallback || key;
  };
}

function getDict(lang = 'en') {
  return Object.assign({}, TRANSLATIONS['en'], TRANSLATIONS[lang] || {});
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',   nativeName: 'हिन्दी',  flag: '🇮🇳' },
];

module.exports = { getTranslator, getDict, SUPPORTED_LANGUAGES, TRANSLATIONS };
