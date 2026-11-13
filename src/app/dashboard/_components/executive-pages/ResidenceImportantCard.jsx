"use client";

import { ContactRound, Info } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";
import styles from "./residence-important-card.module.css";

/** Informational sidebar from mindbliss.pen / tSzaZ; never starts a wallet action. */
export default function ResidenceImportantCard() {
  const { t, dir } = useI18n();
  return <section className={styles.container} dir={dir} aria-label={t("funding.residenceImportantTitle")} data-design-node="tSzaZ">
    <div className={styles.card}>
      <div className={styles.main}>
        <div className={styles.banner}>
          <img src="/mindbliss/residence/important-banner.svg" width="416" height="220" alt="" aria-hidden="true" />
          <h2 className={styles.title}>{t("funding.residenceImportantTitle")}</h2>
        </div>
        <div className={styles.countryCaption}>
          <span>{t("funding.residenceCountryLabel")}</span><Info aria-hidden="true" />
        </div>
        <p className={styles.copy}>{t("funding.residenceSidebarCopy")}</p>
      </div>
      <div className={styles.requirement}>
        <ContactRound aria-hidden="true" /><p>{t("funding.residenceCountrySsn")}</p>
      </div>
    </div>
  </section>;
}
