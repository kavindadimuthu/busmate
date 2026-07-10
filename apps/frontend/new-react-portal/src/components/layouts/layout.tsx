import type { Metadata } from "next";
import "./globals.css";
import ApiSetup from '@/components/ApiSetup';
import { ThemeProvider } from "next-themes";
import { ThemePersonalityProvider } from "@busmate/ui";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "BUSMATE LK - Transportation Management",
  description: "Transportation management dashboard for BUSMATE LK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="default">
      <body className="antialiased font-sans bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ThemePersonalityProvider>
          <ApiSetup />
          {children}
          </ThemePersonalityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
