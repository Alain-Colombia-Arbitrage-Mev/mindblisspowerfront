import { createRoot } from "react-dom/client";
import { usePathname } from "./next-stubs.jsx";
import DashboardShell from "../../src/app/dashboard/_components/DashboardShell.jsx";
import OverviewDashboard from "../../src/components/panel/overview/OverviewDashboard.jsx";
import NetworkPage from "../../src/app/dashboard/network/page.jsx";

function Preview() {
  const path = usePathname();
  return <DashboardShell authMode="fixture"><div role="note" className="m-6 border p-3 text-sm" style={{ borderColor: "var(--vp-accent)", color: "var(--vp-accent)" }}>Entorno sintetico. Sin conexion a la base real.</div>
    {path === "/dashboard/network" ? <NetworkPage key={path} /> : path === "/dashboard" ? <OverviewDashboard key={path} /> : <p className="p-6">Vista no incluida en esta prueba.</p>}
  </DashboardShell>;
}
createRoot(document.getElementById("root")).render(<Preview />);
