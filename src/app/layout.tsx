import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Opositalia — Oposiciones médicas con IA",
  description:
    "Plataforma de preparación de oposiciones médicas con plan adaptativo, sesiones guiadas e IA.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2B5BA8",
};

// Aplica la paleta guardada antes del primer paint (evita FOUC).
// React no gestiona data-theme: queda fuera de la hidratación.
const themeInit = `(function(){try{var t=localStorage.getItem("opositalia-theme");var v=["cielo","salvia","arena","niebla","noche"];document.documentElement.dataset.theme=v.indexOf(t)>-1?t:"cielo"}catch(e){document.documentElement.dataset.theme="cielo"}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="es"
        data-theme="cielo"
        suppressHydrationWarning
        className={`${inter.variable} ${lora.variable} h-full antialiased`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        </head>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
