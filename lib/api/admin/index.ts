import type { ApiInterface } from "../types"
import { adminCommunityApi } from "./community"
import { adminCrewApi } from "./crew"
import { adminIssueApi } from "./issue"
import { adminReportApi } from "./report"
import { adminUserApi } from "./user"

export const adminApi: ApiInterface["admin"] = {
  issue: adminIssueApi,
  user: adminUserApi,
  community: adminCommunityApi,
  crew: adminCrewApi,
  report: adminReportApi,
}
