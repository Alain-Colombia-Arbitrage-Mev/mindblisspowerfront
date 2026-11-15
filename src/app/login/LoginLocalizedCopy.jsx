"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/LanguageProvider";
import { authEntryAllowed } from '@/lib/auth-entry-policy.mjs';

export function LoginHeading() {
  const { t } = useI18n();
  return <div className="auth-form-heading"><h2>{t("auth.login")}</h2><p>{t("auth.loginCopy")}</p></div>;
}

export function LoginAccountLinks({ registrationHref, emailOtpOnly }) {
  const { t } = useI18n();
  return <div className="auth-account-links">
    {authEntryAllowed() ? <div className="auth-registration-link"><span>{t("auth.noAccount")}</span><Link href={registrationHref}>{emailOtpOnly ? t("auth.createNow") : t("auth.createAccount")}</Link></div> : null}
    <Link className="auth-otp-recovery-link auth-desktop-recovery-link" href="/forgot-password">
      {emailOtpOnly ? t("auth.changePassword") : t("auth.recoverPassword")}
    </Link>
  </div>;
}

