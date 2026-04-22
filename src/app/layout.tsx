import type { Metadata } from "next";
import LocalFont from "next/font/local";
import "./globals.css";

const mochiyPopOne = LocalFont({
  src: "./fonts/MochiyPopOne-Regular.ttf",
  display: "swap",
  weight: "400",
  variable: "--font-mochiy-pop-one",
});

export const metadata: Metadata = {
  title: "Praggymatics",
  description: "Learn pragmatics with Praggy!",
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={mochiyPopOne.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
