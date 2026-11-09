"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircleQuestion, MessageSquareText, Network } from "lucide-react";

import ReferralModule from "@/components/member/ReferralModule";

import { PageHeader } from "./executive-ui";

const tools = [
  { icon: BookOpen, title: "Guía para invitar", copy: "Conoce los pasos y las condiciones antes de hacer una invitación.", label: "Ver guía", href: "/dashboard/support" },
  { icon: MessageSquareText, title: "Tu mensaje, a tu manera", copy: "Adapta un ejemplo de invitación con tus propias palabras.", label: "Personalizar mensaje", href: "#invitacion-personal" },
  { icon: MessageCircleQuestion, title: "Resuelve las dudas", copy: "Consulta respuestas sobre la cuenta, la wallet y las membresías.", label: "Ver preguntas frecuentes", href: "/dashboard/support" },
];

export function ReferralsDashboardPage() {
  return (
    <section className="executive-page mb-community-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Comunidad"
          title="Comunidad"
          subtitle="Conecta con personas y comparte a tu manera."
          action={<Link className="executive-button" href="/dashboard">Volver al resumen</Link>}
        />

        <section className="mb-community-intro">
          <div>
            <h2>Invita a tu manera</h2>
            <p>Comparte una invitación personal y deja que cada persona decida.</p>
          </div>
          <div className="mb-community-value">
            <h2>Conectar empieza<br />por compartir.</h2>
            <p>Encuentra recursos para invitar con claridad y acompañar a quienes llegan.</p>
            <strong>Escucha. Comparte. Acompaña.</strong>
          </div>
        </section>

        <section className="mb-community-tools" aria-labelledby="community-tools-title">
          <h2 id="community-tools-title">Herramientas para cada conversación</h2>
          <div>
            {tools.map(({ icon: Icon, title, copy, label, href }) => (
              <article key={title}>
                <span><Icon size={18} /></span>
                <div><h3>{title}</h3><p>{copy}</p></div>
                <Link href={href}>{label} <ArrowRight size={14} /></Link>
              </article>
            ))}
          </div>
        </section>

        <section id="invitacion-personal" className="mb-community-live">
          <div className="mb-community-live-heading">
            <div><h2>Comparte tu enlace real</h2></div>
            <p>Los enlaces y métricas se consultan desde tu cuenta actual.</p>
          </div>
          <ReferralModule />
        </section>

        <section className="mb-community-network">
          <Network size={30} aria-hidden="true" />
          <div><h2>Referidos por niveles</h2><p>Consulta tus referidos y explora cómo se organizan en cada nivel.</p></div>
          <Link className="executive-button" href="/dashboard/network">Ver referidos <ArrowRight size={14} /></Link>
        </section>
      </div>
    </section>
  );
}
