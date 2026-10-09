import { request } from "../client"
import type { AdminExchange, ApiInterface } from "../types"

export const adminExchangeApi: ApiInterface["admin"]["exchange"] = {
  list: ({ status }) =>
    request<AdminExchange[]>({
      method: "GET",
      url: "/api/admin/exchanges",
      params: { status },
    }),

  send: (exchangeId) =>
    request<AdminExchange>({
      method: "POST",
      url: `/api/admin/exchanges/${exchangeId}/send`,
    }),

  reject: (exchangeId, reason) =>
    request<AdminExchange>({
      method: "POST",
      url: `/api/admin/exchanges/${exchangeId}/reject`,
      data: { reason },
    }),
}
