# Docker 사용법 (predict-next-1.0 프론트엔드)

## 전체 스택으로 같이 띄우기 (권장)

이 프로젝트 자체에는 `docker-compose.yml`이 없다. 대신 백엔드 폴더(`../predict/docker-compose.yml`)가
이 폴더(`../predict-next-1.0`)를 `frontend` 서비스로 빌드하도록 되어 있다. 즉 명령어는
**predict 폴더에서** 실행한다.

```bash
cd ../predict

# 코드 수정 후 다시 빌드해서 띄우기
docker compose up -d --build

# 그냥 다시 띄우기 (재빌드 없음)
docker compose up -d

# 프론트엔드 로그만 보기
docker compose logs -f frontend

# 종료
docker compose down
```

프론트엔드: http://localhost:3000
(백엔드 주소는 빌드 시점에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`으로 고정돼서 이미지에
박힌다. compose의 `frontend.build.args`에서 설정되어 있다.)

## 프론트엔드만 따로 빌드/실행하고 싶을 때

```bash
# 이미지 빌드 (백엔드 주소를 빌드타임에 넣어줘야 함, next.js가 NEXT_PUBLIC_* 값을 빌드 시점에 고정하기 때문)
docker build -t predict-frontend \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 \
  .

# 실행
docker run --rm -p 3000:3000 predict-frontend
```

## 파일 설명

| 파일 | 역할 |
|---|---|
| `Dockerfile` | node:22-alpine으로 npm ci → next build → next start 3단계 빌드 |
| `.dockerignore` | 이미지에 넣지 않을 파일 (node_modules, .next, .env.local, .git 등) |

## 주의할 점

- `NEXT_PUBLIC_API_BASE_URL`은 **런타임이 아니라 빌드타임에 코드에 박히는 값**이다.
  백엔드 주소가 바뀌면(예: 배포 도메인으로 변경) `--build-arg`를 바꿔서 이미지를 다시
  빌드해야 반영된다. 컨테이너를 재시작만 해서는 안 바뀐다.
- `.env.local`(로컬 `next dev`용 백엔드 주소 설정 파일)은 이미지에 안 들어간다. docker
  이미지는 오직 build-arg로 받은 값만 사용한다.
