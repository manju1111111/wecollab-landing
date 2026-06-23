import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wecollab.in"),
  title: "Wecollab — Find the Right Creator for Every Campaign",
  description:
    "Connect with verified creators that match your brand, audience, and campaign goals. AI matching, advanced filters, and enterprise-ready workflows.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://www.wecollab.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.wecollab.in/discover?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "WeCollab",
    "url": "https://www.wecollab.in",
    "logo": "https://www.wecollab.in/assets/logo.jpg",
    "sameAs": [
      "https://instagram.com/wecollab",
      "https://youtube.com/wecollab",
      "https://linkedin.com/company/wecollab"
    ]
  };

  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fafbff] text-slate-900">
        {children}
      </body>
    </html>
  );
}
