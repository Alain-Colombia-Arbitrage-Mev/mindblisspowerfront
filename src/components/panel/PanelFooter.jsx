export default function PanelFooter() {
  return (
    <footer className="flex justify-center py-2">
      <p className="m-0 text-xs font-light" style={{ color: "#6b7280" }}>
        © {new Date().getFullYear()} Mindbliss Power. Todos los derechos reservados.
      </p>
    </footer>
  );
}
