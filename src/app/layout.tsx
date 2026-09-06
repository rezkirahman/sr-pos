import type { Metadata } from "next";
import { Outfit, Raleway } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sumber Rejeki - POS & Sistem Toko Cat & Bangunan",
  description: "Sistem Manajemen Backoffice & Kasir POS Toko Cat & Bahan Bangunan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(outfit.variable, ralewayHeading.variable)}
    >
      <body className={cn("font-sans antialiased bg-background text-foreground min-h-screen", outfit.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
