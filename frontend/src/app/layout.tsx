import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CampusOne — One Front Door for Everything",
  description: "Enterprise university conversational single front door. Ask once. Get routed right. Get it resolved.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans selection:bg-[var(--accent)]/20 selection:text-[var(--accent)]">
        {children}
      </body>
    </html>
  );
}
