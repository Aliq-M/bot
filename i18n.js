const i18n = require('i18next');
const Backend = require('i18next-fs-backend');
const { join } = require('path');

i18n.use(Backend).init({
  lng: 'en',
  fallbackLng: 'en',
  backend: {
    loadPath: join(__dirname, 'locales/{{lng}}.json')
  },
  interpolation: {
    escapeValue: false
  }
});

module.exports = i18n;
