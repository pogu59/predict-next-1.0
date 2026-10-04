import { request } from "../client"
import type { AdminReport, ApiInterface } from "../types"

export const adminReportApi: ApiInterface["admin"]["report"] = {
  // 대상(게시글/댓글)별로 묶인 신고 목록. id는 그 대상의 가장 최근 신고 id다.
  list: ({ status }) => request<AdminReport[]>({ method: "GET", url: "/api/admin/reports", params: { status } }),

  reject: (reportId) => request<void>({ method: "POST", url: `/api/admin/reports/${reportId}/reject` }),

  removeContent: (reportId) =>
    request<void>({ method: "POST", url: `/api/admin/reports/${reportId}/remove-content` }),
}
