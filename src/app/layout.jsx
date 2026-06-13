import "../index.css";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600;700;800&family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
