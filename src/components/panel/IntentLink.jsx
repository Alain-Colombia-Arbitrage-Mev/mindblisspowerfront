"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Keep Next's navigation, accessibility and cache invalidation behavior. Only
// shell prefetch admission changes: viewport exposure alone is not intent.
export default function IntentLink({ href, prefetch = undefined, onMouseEnter = undefined, onFocus = undefined, onTouchStart = undefined, ...props }) {
  const [intentHref, setIntentHref] = useState(null);
  useEffect(() => { setIntentHref(null); }, [href]);

  const activate = event => {
    if (event.defaultPrevented || typeof document === "undefined"
      || document.visibilityState !== "visible"
      || typeof navigator === "undefined" || navigator.onLine === false) return;
    setIntentHref(href);
  };

  return (
    <Link
      {...props}
      href={href}
      prefetch={prefetch !== false && intentHref === href ? null : false}
      onMouseEnter={event => { onMouseEnter?.(event); activate(event); }}
      onFocus={event => { onFocus?.(event); activate(event); }}
      onTouchStart={event => { onTouchStart?.(event); activate(event); }}
    />
  );
}
