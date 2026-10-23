"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function NavigationDrawer({ open, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener("change", onResize);
    onResize();
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onResize);
      if (dialog.open) dialog.close();
    };
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      id="mobile-dashboard-nav"
      className="vp-nav-drawer"
      aria-label="Navegación principal"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="vp-nav-drawer-content">
        <button
          type="button"
          className="vp-shell-icon vp-nav-close"
          onClick={onClose}
          aria-label="Cerrar menú"
          title="Cerrar menú"
          autoFocus
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
