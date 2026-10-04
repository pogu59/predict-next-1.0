import type { ApiInterface } from "../types"
import { adminCommunityApi } from "./community"
import { adminIssueApi } from "./issue"
import { adminReportApi } from "./report"
import { adminUserApi } from "./user"

export const adminApi: ApiInterface["admin"] = {
  issue: adminIssueApi,
  user: adminUserApi,
  community: adminCommunityApi,
  report: adminReportApi,
}
