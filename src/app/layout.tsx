import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/provider/provider";
import { geistMono, geistSans, neueHaas, montserrat } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Rice Core",
    template: "%s • Rice Core",
  },
  icons: {
    icon: "/favicon.ico",
  },
  description: "Rice Core",
  openGraph: {
    title: "Rice Core",
    description: "Rice Core is a platform for investing.",
    url: "https://ricecore.online",
    siteName: "Rice Core",
    images: [
      { url: "/logo/logo-square.jpeg" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${neueHaas.variable} ${montserrat.variable} dark`}
      suppressHydrationWarning
    >
      <body className="antialiased font-neue" suppressHydrationWarning>
        <Providers>
          <main className=" min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
