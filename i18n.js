const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

i18next.use(Backend).init({
  fallbackLng: 'en',
  lng: 'en',
  backend: {
    loadPath: path.join(__dirname, 'locales', '{{lng}}.json'),
  },
  debug: true,
});

module.exports = i18next;
