"use client"

import { useState } from "react"

import { HomeHub } from "@/components/home-hub"
import { IssuesPc, type IssueFilter } from "@/components/issue-feed"

/** 홈 — 모바일은 예측·커뮤니티 프리뷰 허브, PC는 예측 그리드 + 사이드(신용도, 커뮤니티 인기글). */
export default function Home() {
  const [filter, setFilter] = useState<IssueFilter>("open")
  return (
    <>
      <HomeHub />
      <IssuesPc filter={filter} onFilter={setFilter} />
    </>
  )
}
