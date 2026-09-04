import type { ApiInterface } from "../types"
import { adminIssueApi } from "./issue"
import { adminUserApi } from "./user"

export const adminApi: ApiInterface["admin"] = {
  issue: adminIssueApi,
  user: adminUserApi,
}
