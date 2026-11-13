import "../index.css";
import { LanguageProvider } from "@/i18n/LanguageProvider";

export const metadata = {
  title: "Mindbliss Power",
  description: "Portal profesional para miembros de Mindbliss Power.",
  icons: {
    icon: [{ url: "/mindbliss/mindbliss-favicon.png", type: "image/png" }],
    shortcut: "/mindbliss/mindbliss-favicon.png",
    apple: [{ url: "/mindbliss/mindbliss-favicon.png", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "only light",
};

const themeInitScript = `(() => {
  const root = document.documentElement;
  root.dataset.theme = "light";
  root.classList.remove("dark");
  root.style.colorScheme = "only light";
  try { localStorage.setItem("vp-theme", "light"); } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#f3f7f8");
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="light" style={{ colorScheme: "only light" }} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f3f7f8" />
        <script id="vp-theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          rel="preload"
          href="/fonts/manrope-latin-wght.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
