"use client";

import React, { useEffect, useRef, useState } from "react";

// Official Cloudflare Turnstile test keys (Always passes in managed mode)
const CLOUDFLARE_TEST_SITE_KEY = "1x00000000000000000000AA";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
  resetKey?: number; // Change this prop to force reset the widget
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: any) => void;
          "expired-callback"?: () => void;
          theme?: string;
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function Turnstile({
  onVerify,
  onExpire,
  onError,
  theme = "auto",
  className = "",
  resetKey = 0,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    CLOUDFLARE_TEST_SITE_KEY;

  // 1. Inject Cloudflare Turnstile script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = "cf-turnstile-script";
    let existingScript = document.getElementById(scriptId) as HTMLScriptElement;

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        if (onError) onError("Failed to load Cloudflare Turnstile script");
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setScriptLoaded(true));
    }
  }, [onError]);

  // 2. Render Widget
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    // Remove previous widget if exists
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {}
      widgetIdRef.current = null;
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify(token);
        },
        "expired-callback": () => {
          if (onExpire) onExpire();
        },
        "error-callback": (err: any) => {
          if (onError) onError(typeof err === "string" ? err : "Turnstile error");
        },
        theme,
        size: "flexible",
      });
      widgetIdRef.current = id;
    } catch (err) {
      console.error("Failed to render Cloudflare Turnstile:", err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [scriptLoaded, siteKey, theme, resetKey, onVerify, onExpire, onError]);

  return (
    <div className={`w-full flex justify-center my-3 ${className}`}>
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}
