import { request } from "./client"
import type { ApiInterface, RewardExchange, RewardWallet } from "./types"

const PATHS = {
  me: "/api/reward/me",
  exchanges: "/api/reward/exchanges",
  cancel: (exchangeId: number) => `/api/reward/exchanges/${exchangeId}/cancel`,
} as const

export const rewardApi: ApiInterface["reward"] = {
  me: () => request<RewardWallet>({ method: "GET", url: PATHS.me }),

  requestExchange: (productCode) =>
    request<RewardExchange>({
      method: "POST",
      url: PATHS.exchanges,
      data: { productCode },
    }),

  cancelExchange: (exchangeId) =>
    request<RewardExchange>({ method: "POST", url: PATHS.cancel(exchangeId) }),
}
