import { useSyncExternalStore } from "react";

const subscribe = notify => { window.addEventListener("popstate", notify); return () => window.removeEventListener("popstate", notify); };
export function usePathname() { return useSyncExternalStore(subscribe, () => window.location.pathname); }
export function useSearchParams() { return new URLSearchParams(useSyncExternalStore(subscribe, () => window.location.search)); }
export default function Link({ href, children, onClick, ...props }) {
  return <a href={href} {...props} onClick={event => {
    onClick?.(event);
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault(); history.pushState({}, "", href); window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }}>{children}</a>;
}
