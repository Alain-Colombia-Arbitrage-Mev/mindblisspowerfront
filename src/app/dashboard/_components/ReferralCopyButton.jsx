"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function ReferralCopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyCode}
      title="Copiar codigo"
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d8dee9] bg-white text-[#344054] transition hover:bg-[#f8fafc]"
    >
      {copied ? <Check className="h-4 w-4 text-[#0f8f78]" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
