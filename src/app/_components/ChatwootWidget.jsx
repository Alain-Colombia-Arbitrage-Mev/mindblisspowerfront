"use client";

import { useEffect } from "react";

const CUSTOMER_APP_HOST = "app.mindblisspower.com";
const ADMIN_APP_HOST = "admin.mindblisspower.com";
const DEFAULT_BASE_URL = "https://soporte.mindblisspower.com";
const DEFAULT_WEBSITE_TOKEN = "F6FdM8HdY2GaPJ8Ps9dKFn69";
const SCRIPT_ID = "mindbliss-chatwoot-sdk";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHost(hostname) {
  return String(hostname || "").toLowerCase();
}

function shouldLoadChatwoot(hostname) {
  const host = normalizeHost(hostname);

  if (host === ADMIN_APP_HOST) return false;

  return (
    host === CUSTOMER_APP_HOST ||
    host.endsWith(".sslip.io") ||
    LOCAL_HOSTS.has(host)
  );
}

export default function ChatwootWidget() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (!shouldLoadChatwoot(window.location.hostname)) return;
    if (window.__mindblissChatwootLoaded) return;

    const baseUrl = (
      process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || DEFAULT_BASE_URL
    ).replace(/\/+$/, "");
    const websiteToken =
      process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || DEFAULT_WEBSITE_TOKEN;

    if (!baseUrl || !websiteToken) return;

    window.__mindblissChatwootLoaded = true;
    window.chatwootSettings = {
      position: "right",
      type: "standard",
      launcherTitle: "",
    };

    const initializeChatwoot = () => {
      if (window.chatwootSDK?.run) {
        window.chatwootSDK.run({
          websiteToken,
          baseUrl,
        });
      }
    };

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", initializeChatwoot, { once: true });
      initializeChatwoot();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.async = true;
    script.onload = initializeChatwoot;
    script.onerror = () => {
      window.__mindblissChatwootLoaded = false;
      console.warn("Mindbliss support chat failed to load.");
    };

    document.body.appendChild(script);
  }, []);

  return null;
}
