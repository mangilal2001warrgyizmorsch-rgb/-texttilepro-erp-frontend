import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DefaultProviders } from "@/components/providers/default";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TextilePro ERP",
  description: "Textile Dyeing & Printing ERP — Factory Overview",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      
      <body className={`${inter.className} antialiased`}>
        <DefaultProviders>{children}</DefaultProviders>
      </body>
    </html>
  );
}
