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
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
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
