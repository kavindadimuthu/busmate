import ApiSetup from '@/components/ApiSetup';
import { ThemeProvider } from "@/lib/theme";
import { ThemePersonalityProvider } from "@busmate/ui";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
