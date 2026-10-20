/**
 * Basic consent mode: Google is not loaded until explicit analytics consent.
 * No automatic click/form/scroll events: disable Enhanced Measurement in the existing stream
 * before enabling PUBLIC_GA4_ENABLED. See docs/05 security/privacy review.
 */
export const MEASUREMENT_ID = 'G-2ZGM4PZ4DK';
export const PRODUCTION_ORIGIN = 'https://indysewerresource.com';
const KEY = 'isr.analytics.v1';
const MAX_AGE = 180 * 86400000;
const TITLES = {
  '/': 'Indy Sewer Resource',
  '/about/': 'How Indy Sewer Resource works',
  '/lawrence-sewer-lateral-repair/': 'Lawrence sewer lateral repair resource',
};
/** @param {string} href @param {string} referrer */
export function safePageData(href, referrer) {
  const url = new URL(href);
  if (url.origin !== PRODUCTION_ORIGIN || !Object.hasOwn(TITLES, url.pathname)) return null;
  /** @type {Record<string, string>} */
  const data = {
    page_location: PRODUCTION_ORIGIN + url.pathname,
    page_title: TITLES[/** @type {keyof typeof TITLES} */ (url.pathname)],
    page_referrer: '',
  };
  try {
    const ref = new URL(referrer);
    const allowed = ['google.com', 'www.google.com', 'bing.com', 'www.bing.com', 'nextdoor.com', 'www.nextdoor.com', 'facebook.com', 'www.facebook.com', 'indysewerresource.com'];
    if (ref.protocol === 'https:' && allowed.includes(ref.hostname)) data.page_referrer = ref.origin + '/';
  } catch { /* Missing/unapproved referrer is deliberately omitted. */ }
  // Exact vocabularies: arbitrary UTM text, click IDs, fragments, queries, and personal data
  // never enter our payload. Extend only with reviewed campaign names.
  const campaign = [
    ['utm_source', 'campaign_source', ['google', 'bing', 'facebook', 'nextdoor', 'newsletter']],
    ['utm_medium', 'campaign_medium', ['organic', 'cpc', 'paid_social', 'email', 'referral']],
    ['utm_campaign', 'campaign_name', ['launch', 'lawrence-guide', 'sewer-resource']],
  ];
  for (const row of campaign) {
    const key = /** @type {string} */ (row[0]);
    const target = /** @type {string} */ (row[1]);
    const allowed = /** @type {string[]} */ (row[2]);
    const value = url.searchParams.get(key);
    if (value && allowed.includes(value)) data[target] = value;
  }
  return data;
}

/** @param {Storage} storage @param {number} now */
export function readChoice(storage, now) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || 'null');
    if (value && ['allow', 'deny', 'internal'].includes(value.choice) &&
        Number.isFinite(value.at) && value.at <= now && now - value.at < MAX_AGE) return value.choice;
  } catch { /* Storage unavailable/corrupt: no consent. */ }
  return 'deny';
}

/** @param {Window & typeof globalThis} win @param {Document} doc */
export function startAnalytics(win, doc) {
  const panel = doc.querySelector('[data-ga4-consent]');
  const pageData = safePageData(win.location.href, doc.referrer);
  if (!panel || panel.getAttribute('data-ga4-enabled') !== 'true' || !pageData) return;
  const privacySignal = () => win.navigator.doNotTrack === '1' ||
    /** @type {Navigator & {globalPrivacyControl?: boolean}} */ (win.navigator).globalPrivacyControl === true;
  let storage;
  try { storage = win.localStorage; } catch { return; }
  let choice = readChoice(storage, Date.now());
  // Explicit operator opt-out, with no geographical/IP exclusions.
  if (new URL(win.location.href).searchParams.get('analytics') === 'internal') {
    choice = 'internal';
    try { storage.setItem(KEY, JSON.stringify({ choice, at: Date.now() })); } catch { return; }
  }
  const globals = /** @type {typeof win & {dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: string]: unknown}} */ (win);
  const disableKey = 'ga-disable-' + MEASUREMENT_ID;
  let loaded = false;
  let pageSent = false;
  /** @type {HTMLScriptElement | null} */
  let tag = null;
  const status = doc.getElementById('analytics-status');
  const setStatus = () => {
    if (status) status.textContent = privacySignal() ? 'Analytics off: your browser privacy signal is respected.' :
      choice === 'allow' ? 'Analytics allowed on this browser.' :
      choice === 'internal' ? 'Internal testing: analytics excluded on this browser.' : 'Optional analytics off.';
  };
  const clearCookies = () => {
    for (const name of ['_ga', '_ga_2ZGM4PZ4DK']) {
      for (const domain of ['', '; Domain=indysewerresource.com', '; Domain=.indysewerresource.com']) {
        doc.cookie = name + '=; Max-Age=0; Path=/; Secure; SameSite=Lax' + domain;
      }
    }
  };
  const sendPage = () => {
    if (choice !== 'allow' || privacySignal() || pageSent || !globals.gtag) return;
    pageSent = true;
    globals.gtag('event', 'page_view', { ...pageData, send_to: MEASUREMENT_ID });
  };
  const apply = () => {
    const allowed = choice === 'allow' && !privacySignal();
    globals[disableKey] = !allowed;
    if (!allowed) {
      clearCookies();
      if (tag) tag.remove();
      setStatus();
      return;
    }
    if (!loaded) {
      loaded = true;
      globals.dataLayer = globals.dataLayer || [];
      globals.gtag = function () { globals.dataLayer?.push(arguments); };
      globals.gtag('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      });
      globals.gtag('consent', 'update', { analytics_storage: 'granted' });
      globals.gtag('js', new Date());
      // Apply safe locations before config; no free-text form or document title is read.
      globals.gtag('set', { ...pageData, ads_data_redaction: true, url_passthrough: false });
      globals.gtag('config', MEASUREMENT_ID, {
        ...pageData, send_page_view: false, allow_google_signals: false,
        allow_ad_personalization_signals: false, cookie_expires: MAX_AGE / 1000,
        cookie_update: false, cookie_domain: 'none',
      });
      tag = doc.createElement('script');
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
      // No page_view is queued until the library has loaded and consent still holds.
      tag.addEventListener('load', sendPage, { once: true });
      tag.addEventListener('error', () => {
        if (status) status.textContent = 'Analytics could not load. You can continue using this site.';
      }, { once: true });
      doc.head.append(tag);
    } else {
      sendPage();
    }
    setStatus();
  };
  for (const button of panel.querySelectorAll('[data-analytics-choice]')) {
    button.addEventListener('click', () => {
      const next = button.getAttribute('data-analytics-choice');
      if (!next || !['allow', 'deny', 'internal'].includes(next)) return;
      try { storage.setItem(KEY, JSON.stringify({ choice: next, at: Date.now() })); } catch { return; }
      choice = next;
      // Withdrawing consent reloads after disabling the destination so an already-loaded
      // third-party library is removed from the execution context.
      const shouldReload = loaded && choice !== 'allow';
      apply();
      if (shouldReload) win.location.reload();
    });
  }
  win.addEventListener('storage', (event) => {
    if (event.key !== KEY) return;
    choice = readChoice(storage, Date.now());
    globals[disableKey] = true;
    win.location.reload();
  });
  apply();
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') startAnalytics(window, document);
