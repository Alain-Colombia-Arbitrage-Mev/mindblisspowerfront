"use client";

import { CheckCircle2, IdCard, LifeBuoy, Package, ShoppingBag, Sparkles } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

const moduleConfigs = {
products: {
    eyebrow: "Productos",
    title: "Productos",
    subtitle: "Catalogo operativo de productos y servicios disponibles para miembros de Mindbliss Power.",
    action: { label: "Ver membresías", href: "/dashboard/packages", icon: Package },
    metrics: [
      { label: "Productos", value: "3", detail: "categorias", icon: ShoppingBag, tone: "accent" },
      { label: "Activos", value: "1", detail: "disponible", icon: CheckCircle2, tone: "success" },
      { label: "Proximos", value: "2", detail: "en preparacion", icon: Sparkles, tone: "warning" },
      { label: "Soporte", value: "24h", detail: "canal interno", icon: LifeBuoy, tone: "info" },
    ],
    cards: [
      { title: "Membresia", text: "Acceso al portal, perfil, red, referidos y reportes de actividad.", icon: IdCard, status: "Activo" },
      { title: "Membresías", text: "Catalogo conectado a backend para planes disponibles.", icon: Package, status: "Disponible" },
      { title: "Servicios", text: "Productos adicionales se publicaran cuando esten listos para operacion.", icon: ShoppingBag, status: "Proximo" },
    ],
    tableTitle: "Catalogo",
    tableIcon: ShoppingBag,
    columns: ["Producto", "Categoria", "Estado", "Accion"],
    rows: [
      ["Portal miembro", "Plataforma", "Activo", "Usar"],
      ["Membresías", "Plan", "Disponible", "Revisar"],
      ["Servicios premium", "Soporte", "Proximo", "Pendiente"],
    ],
  }
};

export function ProductsDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.products} />;
}
