"use client";

import { createElement } from "react";
import { useI18n } from "./LanguageProvider";

export default function LocalizedText({ as = "span", id, htmlId = undefined, values = undefined, children: _children = undefined, ...props }) {
  const { t } = useI18n();
  return createElement(as, { id: htmlId, ...props }, t(id, values));
}
