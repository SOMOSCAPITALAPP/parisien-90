const measurementId = "G-J5T3G7GEF2";
const consentKey = "parisien90-google-analytics-consent";

const getLocale = () => document.documentElement.lang === "pt-BR" ? "br" : "fr";

const labels = {
  fr: {
    title: "Mesure d'audience",
    text: "Avec votre accord, Parisien 90 utilise Google Analytics pour comprendre les pages les plus lues et améliorer le site.",
    accept: "Accepter",
    refuse: "Refuser",
    details: "En savoir plus"
  },
  br: {
    title: "Medição de audiência",
    text: "Com a sua autorização, o Parisien 90 usa o Google Analytics para entender as páginas mais lidas e melhorar o site.",
    accept: "Aceitar",
    refuse: "Recusar",
    details: "Saiba mais"
  }
};

let isGoogleAnalyticsEnabled = false;

const loadGoogleAnalytics = () => {
  if (isGoogleAnalyticsEnabled || !measurementId) return;
  isGoogleAnalyticsEnabled = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("config", measurementId, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
};

export const trackGoogleAnalyticsEvent = (name, properties = {}) => {
  if (isGoogleAnalyticsEnabled) window.gtag?.("event", name, properties);
};

export const initGoogleAnalytics = () => {
  const consent = window.localStorage.getItem(consentKey);
  if (consent === "granted") {
    loadGoogleAnalytics();
    return;
  }
  if (consent === "denied") return;

  const locale = getLocale();
  const copy = labels[locale];
  const banner = document.createElement("aside");
  banner.className = "analytics-consent";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", copy.title);
  banner.innerHTML = `<div><strong>${copy.title}</strong><p>${copy.text}</p><a href="/cookies/">${copy.details}</a></div><div class="analytics-consent-actions"><button type="button" data-analytics-consent="denied">${copy.refuse}</button><button type="button" class="primary-action compact-action" data-analytics-consent="granted">${copy.accept}</button></div>`;
  banner.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-analytics-consent]")?.dataset.analyticsConsent;
    if (!choice) return;
    window.localStorage.setItem(consentKey, choice);
    if (choice === "granted") loadGoogleAnalytics();
    banner.remove();
  });
  document.body.append(banner);
};
