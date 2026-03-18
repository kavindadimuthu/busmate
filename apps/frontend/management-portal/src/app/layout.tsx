import type { Metadata } from "next";
import "./globals.css";
import {AsgardeoProvider} from '@asgardeo/nextjs/server';
import ApiSetup from '@/components/ApiSetup';
import { ThemeProvider } from "next-themes";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ApiSetup />
          <AsgardeoProvider
            preferences={{
              theme: {
                inheritFromBranding: false,
                mode: "light"
              }
            }}
          >
            {children as any}
          </AsgardeoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
