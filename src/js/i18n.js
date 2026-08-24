import en from '../locales/en.json';
import ja from '../locales/ja.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import zh from '../locales/zh.json';

const messages = {
  en,
  ja,
  fr,
  es,
  de,
  zh
};

const STORAGE_KEY = 'seiko_lang';

export const i18n = {
  locale: 'en',
  _listeners: [],

  onLocaleChange(cb) {
    if (typeof cb === 'function') this._listeners.push(cb);
  },
  
  init() {
    // 1. Check local storage
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // 2. Fallback to browser language
      const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
      saved = messages[browserLang] ? browserLang : 'en';
    }
    
    this.setLocale(saved);
  },

  setLocale(lang) {
    if (!messages[lang]) lang = 'en';
    this.locale = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    this.translateDOM();
    document.documentElement.lang = lang;
    this._listeners.forEach(cb => {
      try { cb(lang); } catch (e) { console.error(e); }
    });
  },

  t(key, params = {}) {
    const dict = messages[this.locale] || messages['en'];
    let str = dict[key] || messages['en'][key] || key;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(p => {
        str = str.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }
    return str;
  },

  translateDOM() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    const titles = document.querySelectorAll('[data-i18n-title]');
    titles.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    const arias = document.querySelectorAll('[data-i18n-aria-label]');
    arias.forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      if (key) {
        el.setAttribute('aria-label', this.t(key));
      }
    });
  }
};
