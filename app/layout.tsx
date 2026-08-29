import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { cn } from "@/lib/utils"

import "./globals.css"

import { HeaderLayout } from "./HeaderLayout"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "My App",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={cn("font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="<https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0,0>"
        />
      </head>
      <body className="font-sans antialiased">
        <HeaderLayout>{children}</HeaderLayout>
      </body>
    </html>
  )
}
