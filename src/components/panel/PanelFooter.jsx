export default function PanelFooter() {
  return (
    <footer className="flex justify-center py-2">
      <p className="m-0 text-xs font-light" style={{ color: "var(--vp-muted)" }}>
        © {new Date().getFullYear()} Mindbliss Power. Todos los derechos reservados.
      </p>
    </footer>
  );
}
