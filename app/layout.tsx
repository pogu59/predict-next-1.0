import type { Metadata } from "next"

import { cn } from "@/lib/utils"

import "./globals.css"

import { pretendard } from "./fonts"
import { HeaderLayout } from "./HeaderLayout"
import { QueryProvider } from "./QueryProvider"

export const metadata: Metadata = {
  title: "Predict",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={cn("font-sans", pretendard.variable)}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0,0"
        />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <HeaderLayout>{children}</HeaderLayout>
        </QueryProvider>
      </body>
    </html>
  )
}
