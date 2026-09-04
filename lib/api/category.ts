import { request } from "./client"
import type { ApiInterface, Category } from "./types"

const PATHS = {
  list: "/api/categories",
} as const

export const categoryApi: ApiInterface["category"] = {
  list: () => request<Category[]>({ method: "GET", url: PATHS.list }),
}
