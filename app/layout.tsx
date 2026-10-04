import type { Metadata } from "next"

import { cn } from "@/lib/utils"
import { ToastProvider } from "@/components/ui/toast"

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
    <html lang="ko" className={cn("font-sans", pretendard.variable)} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <QueryProvider>
          <ToastProvider>
            <HeaderLayout>{children}</HeaderLayout>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
