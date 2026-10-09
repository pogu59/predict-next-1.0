import type { ApiInterface } from "../types"
import { adminCommunityApi } from "./community"
import { adminExchangeApi } from "./exchange"
import { adminIssueApi } from "./issue"
import { adminMissionApi } from "./mission"
import { adminReportApi } from "./report"
import { adminUserApi } from "./user"

export const adminApi: ApiInterface["admin"] = {
  issue: adminIssueApi,
  user: adminUserApi,
  community: adminCommunityApi,
  report: adminReportApi,
  mission: adminMissionApi,
  exchange: adminExchangeApi,
}
