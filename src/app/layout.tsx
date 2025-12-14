import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/provider/provider";
import { geistMono, geistSans, neueHaas, montserrat } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Rice Core Network Admin",
    template: "%s • Rice Core Network",
  },
  description: "Admin dashboard for Rice Core Network",
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
          <main className="bg-[#090311] min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
