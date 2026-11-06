
"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

const CONSENT_KEY = "vsc-analytics-consent";
const CONSENT_EVENT = "vsc-consent-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function getConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

function getServerConsent() {
  return null;
}

function useAnalyticsConsent() {
  return useSyncExternalStore(
    subscribe,
    getConsent,
    getServerConsent
  );
}

export function AnalyticsScripts() {
  const consent = useAnalyticsConsent();

  const gtm = process.env.NEXT_PUBLIC_GTM_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (consent !== "granted") return null;

  return (
    <>
      {gtm ? (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm.replace(/[^A-Z0-9-]/gi, "")}');`}
        </Script>
      ) : null}

      {pixel ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel.replace(/[^0-9]/g, "")}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

export function ConsentBanner() {
  const consent = useAnalyticsConsent();

  function choose(value: "granted" | "denied") {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (consent !== null) return null;

  return (
    <div
      className="consent-banner"
      role="dialog"
      aria-label="Analytics preferences"
    >
      <div>
        <strong>Privacy preferences</strong>
        <p>
          Optional analytics help us understand site performance.
          You can accept or decline non-essential tracking.
        </p>
      </div>

      <div className="consent-actions">
        <button
          onClick={() => choose("denied")}
          className="button button-quiet"
        >
          Decline
        </button>

        <button
          onClick={() => choose("granted")}
          className="button button-primary"
        >
          Accept analytics
        </button>
      </div>
    </div>
  );
}
