import { request } from "./client"
import type { ApiInterface, UploadResult } from "./types"

export const uploadApi: ApiInterface["upload"] = {
  image: (file) => {
    const form = new FormData()
    form.append("file", file)
    // 인스턴스 기본값이 application/json이라 그대로 두면 axios가 FormData를 JSON으로 직렬화한다.
    // multipart로 지정하면 브라우저가 boundary를 붙여 보낸다.
    return request<UploadResult>({
      method: "POST",
      url: "/api/uploads/images",
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
}
