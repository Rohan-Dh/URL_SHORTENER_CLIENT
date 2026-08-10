import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "NestSMS URL Shortener",
  description: "Shorten any link in seconds, powered by NestSMS.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased flex min-h-screen flex-col`}>
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 sm:px-6 py-4">
            {/* Mark is landscape (~1.62:1) — sized by its own ratio, never
                forced square, so it isn't distorted. prefers-color-scheme
                swaps to the white variant in dark mode so it stays legible. */}
            <picture>
              <source srcSet="/nest-icon-white.png" media="(prefers-color-scheme: dark)" />
              <img src="/nest-icon-black.png" alt="NestSMS" width={52} height={32} className="h-7 w-auto" />
            </picture>
            <span className="font-bold tracking-tight">NEST SMS</span>
            <span className="text-muted-foreground text-sm border-l border-border pl-2 ml-1">
              URL Shortener
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/80 py-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} NestNepal. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
