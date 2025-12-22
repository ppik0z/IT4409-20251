import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import { ClerkProvider } from '@clerk/nextjs';
import { viVN } from "@clerk/localizations";
import ActiveStatus from "./components/ActiveStatus";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatChoi",
  description: "App chat xịn xò",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
      <html lang="vi">
        <ClerkProvider
          localization={viVN}
          appearance={{
            variables: { colorPrimary: "#2563eb" }
          }}
        >
          <body className={inter.className}>
            <ActiveStatus />
            {children}
          </body>
        </ClerkProvider>
      </html>
    
  );
}