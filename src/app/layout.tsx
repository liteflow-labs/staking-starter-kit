import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Starter Kit",
  description: "Starter kit for a Liteflow application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-muted/50`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blur-xl -z-10" />
        <Providers cookie={(await headers()).get("cookie") || ""}>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="text-center text-sm text-muted-foreground py-8 flex justify-center items-center gap-1">
              Powered by{" "}
              <Link href="https://liteflow.com">
                <Image
                  src="/liteflow.svg"
                  alt="Liteflow Logo"
                  width={96}
                  height={24}
                />
              </Link>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
