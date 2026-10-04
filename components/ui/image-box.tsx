import { Image as ImageIcon } from "lucide-react"
import Image from "next/image"

import { cn } from "@/lib/utils"

type ImageBoxProps = {
  src?: string | null
  alt?: string
  /** 크기·라운드는 호출부가 정한다(부모 영역을 가득 채운다). */
  className?: string
  iconSize?: number
}

/**
 * 업로드 이미지 영역. 이미지가 없으면 #F3F3F1 배경 + 중앙 image 아이콘(#C9C9CE) 플레이스홀더.
 * 업로드 URL은 출처 도메인이 정해져 있지 않아(blob/외부 스토리지) 최적화 없이 그린다.
 */
export function ImageBox({ src, alt = "", className, iconSize = 24 }: ImageBoxProps) {
  return (
    <div className={cn("relative overflow-hidden bg-track", className)}>
      {src ? (
        <Image src={src} alt={alt} fill unoptimized sizes="100vw" className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <ImageIcon className="text-disabled-ink" style={{ width: iconSize, height: iconSize }} />
        </div>
      )}
    </div>
  )
}
