"use client"

import { useState } from "react"

type CategoryProps = {
  label: string
  value: "all" | "politics" | "sport" | "eSport" | "economy" | "weather"
}

const CATEGORIES: CategoryProps[] = [
  {
    label: "전체",
    value: "all",
  },
  {
    label: "정치",
    value: "politics",
  },
  {
    label: "스포츠",
    value: "sport",
  },
  {
    label: "E스포츠",
    value: "eSport",
  },
  {
    label: "경제",
    value: "economy",
  },
  {
    label: "날씨",
    value: "weather",
  },
]

export default function IssuePage() {
  const [category, setCategory] = useState(CATEGORIES[0].value)

  return (
    <div>
      <div>
        <div className="">카테고리</div>
        <div>
          {CATEGORIES.map((category) => (
            <div
              key={category.value}
              onClick={() => setCategory(category.value)}
            >
              {category.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
