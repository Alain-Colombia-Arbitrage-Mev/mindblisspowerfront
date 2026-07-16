"use client";

import { useState } from "react";

import NewsPreviewCard from "@/components/panel/news/NewsPreviewCard";
import NewsSearchPanel from "@/components/panel/news/NewsSearchPanel";
import NewsTable from "@/components/panel/news/NewsTable";

const NEWS = [
  {
    no: 1,
    title: "Actualización cuenta Bancaria para depósitos en Estados Unidos",
    expiration: "30/12/2026",
    pinned: true,
    readConfirmation: true,
    showDaily: true,
    dateline: "Actualización de cuenta bancaria, lunes 1 de junio de 2026",
    headline: "Comunicado importante",
    intro:
      "Estimados líderes, socios y aliados: Les informamos que, con el propósito de continuar fortaleciendo nuestros procesos operativos, a partir de la fecha se realizará la actualización de la cuenta oficial.",
    details: [
      { label: "Banco", value: "Royal Business Bank" },
      { label: "Routing Number", value: "122045037" },
      { label: "Número de Cuenta", value: "2630826054" },
      { label: "Titular", value: "TWISE-HOME INC" },
    ],
    outro:
      "Agradecemos actualizar esta información en sus registros para garantizar la correcta aplicación de los fondos.",
  },
  {
    no: 2,
    title: "Comunicado Oficial: Aplazamiento evento y compra de membresías",
    expiration: "31/12/2026",
    pinned: true,
    readConfirmation: true,
    showDaily: true,
    dateline: "Comunicado oficial",
    headline: "Comunicado importante",
    intro:
      "Comunicado oficial sobre el aplazamiento del evento y el proceso de compra de membresías.",
  },
  {
    no: 3,
    title: "Actualización de cuenta bancaria para depósitos de membresías",
    expiration: "01/02/2026",
    pinned: false,
    readConfirmation: false,
    showDaily: false,
    dateline: "Actualización de cuenta bancaria",
    headline: "Comunicado importante",
    intro: "Actualización de la cuenta bancaria utilizada para depósitos de membresías.",
  },
];

export default function InternalNewsPage() {
  const [selectedNo, setSelectedNo] = useState(NEWS[0]?.no ?? null);
  const selected = NEWS.find((item) => item.no === selectedNo) ?? null;

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <NewsSearchPanel />
      <div className="flex min-h-0 flex-1 flex-col gap-6 xl:flex-row">
        <NewsTable
          items={NEWS}
          selectedNo={selectedNo}
          onSelect={(item) => setSelectedNo(item.no)}
        />
        {selected ? <NewsPreviewCard news={selected} onClose={() => setSelectedNo(null)} /> : null}
      </div>
    </div>
  );
}
