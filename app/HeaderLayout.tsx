"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type HeaderLayoutProps = {
  children: React.ReactNode
}

const NAV_LIST = [
  {
    label: "이슈",
    value: "issue",
  },
  {
    label: "마이페이지",
    value: "my",
  },
]

export function HeaderLayout({ children }: HeaderLayoutProps) {
  const router = useRouter()
  return (
    <div className="bg-bg">
      <div className="flex items-center gap-10 bg-headerBg px-6 py-4 font-bold text-white">
        <div className="text-2xl">Predict</div>
        <div className="flex items-center gap-4">
          {NAV_LIST.map((menu) => (
            <Button
              key={menu.value}
              onClick={() => router.push(`/${menu.value}`)}
            >
              {menu.label}
            </Button>
          ))}
        </div>
        <div className="flex-auto" />

        {/* 유저 구현 후 작업 */}
        <div>박지혁 신뢰도: 1000</div>
      </div>
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  )
}
