import type { ApiInterface } from "./types"
import { adminApi } from "./admin"
import { authApi } from "./auth"
import { categoryApi } from "./category"
import { issueApi } from "./issue"
import { postApi } from "./post"
import { uploadApi } from "./upload"
import { userApi } from "./user"

let cached: ApiInterface | null = null

/**
 * 네임스페이스를 하나로 조합하는 팩토리. cached를 모듈 스코프에 두므로 Api()를
 * 몇 번 호출하든 항상 같은 객체를 돌려준다 — 매번 새로 만들 이유가 없고, 각 네임스페이스
 * 구현(issueApi 등)도 client.ts의 axios 인스턴스 하나를 그대로 재사용한다.
 *
 * 새 도메인을 추가할 때: ApiInterface(types.ts)에 타입을 먼저 추가하면, 그 네임스페이스를
 * 아래 객체에 채워 넣지 않는 한 이 파일이 컴파일 에러로 막는다.
 */
export function Api(): ApiInterface {
  if (!cached) {
    cached = {
      category: categoryApi,
      issue: issueApi,
      post: postApi,
      upload: uploadApi,
      auth: authApi,
      user: userApi,
      admin: adminApi,
    }
  }
  return cached
}

export type * from "./types"
