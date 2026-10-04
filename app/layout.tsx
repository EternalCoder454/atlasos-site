import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

/* The system's own two faces: IBM Plex Sans for the interface, JetBrains
   Mono for code. Both variable, so one file each. */
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.title,
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: "/",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "The AtlasOS desktop: a menu bar on top, a floating dock, and Dolphin over the sakura wallpaper",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0e0c24",
  colorScheme: "dark",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  url: siteUrl,
  applicationCategory: "OperatingSystem",
  operatingSystem: "Linux",
  description: site.description,
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  codeRepository: site.repo,
};

/* Runs before the first paint: with motion allowed, html.motion puts the
   below-the-fold parts in their starting places (globals.css), so they
   don't show and then jump. If components/motion.tsx hasn't started four
   seconds later (blocked, or a very slow connection), the class comes off
   and the page shows as it is. */
const motionGate = `(function(){var d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: no-preference)").matches)return;d.classList.add("motion");setTimeout(function(){if(!d.classList.contains("motion-on"))d.classList.remove("motion")},4000)})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plex.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionGate }} />
        {/* Umami (analytics.eterneon.net): cookieless page views. Caddy
            serves the script and its endpoint at /_p/ on this host, so the
            policy's 'self' covers both; data-domains keeps dev and preview
            hosts out of the numbers. */}
        <script defer src="/_p/p.js" data-website-id="4f36100d-43ce-4068-83af-5946b53e1e1e" data-domains="atlasos.eterneon.net" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
