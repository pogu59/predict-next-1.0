# 클라우드 서버 접속 & 재배포

이 프론트엔드는 Vultr VPS에 백엔드 레포(`predict`)와 형제 디렉토리(`~/app/predict-next-1.0`,
`~/app/predict`)로 올라가 있다. 서버를 처음부터 만드는 절차(Vultr 생성, 방화벽, 도메인, `.env`)는
`../predict/DEPLOY.md`에 있다. 여기서는 이미 떠 있는 서버에 **SSH로 접속해서 프론트엔드만
다시 배포**하는 방법만 정리한다.

## SSH 접속

```bash
ssh -i ~/.ssh/predict-vultr root@158.247.247.27
```

- SSH 키: `~/.ssh/predict-vultr` (개인키). 최초 서버 생성 시 `ssh-keygen -t ed25519 -C "predict-vultr"`로
  만들고 공개키(`~/.ssh/predict-vultr.pub`)를 Vultr에 등록해둔 것 — 이미 로컬에 있다면 새로 만들 필요 없음.
- 서버 IP: `158.247.247.27` (Vultr 대시보드 > 인스턴스 상세에서도 확인 가능).
- 접속 계정은 `root` (Vultr Ubuntu 이미지 기본이라 `usermod`/재접속 없이 바로 `docker` 명령 사용 가능).

## 프론트엔드만 재배포

로컬에서 코드 수정 후 `git push`로 GitHub(`main`)에 올렸다면:

```bash
ssh -i ~/.ssh/predict-vultr root@158.247.247.27

cd ~/app/predict-next-1.0 && git pull
cd ~/app/predict
docker compose up -d --build frontend
```

- `frontend` 서비스만 지정해서 재빌드하면 `backend`/`mysql` 컨테이너는 건드리지 않는다.
- 백엔드도 같이 바뀌었다면 `cd ~/app/predict && git pull`도 먼저 해준다.
- 현재 서버는 `--profile prod`(Caddy + HTTPS) 없이 `3000`/`8080` 포트를 직접 열어서 쓰고 있다
  (`http://158.247.247.27:3000`). 도메인 + HTTPS로 옮기려면 `../predict/DEPLOY.md`의 6\~7단계를 따른다.

## 상태 확인

```bash
docker compose ps
docker compose logs -f frontend
```

## 주의할 점

- `NEXT_PUBLIC_API_BASE_URL`은 빌드타임에 코드에 박히는 값이라, 백엔드 주소가 바뀌면 이미지를
  다시 빌드해야 반영된다 (자세한 내용은 `DOCKER.md` 참고).
- SSH 개인키(`~/.ssh/predict-vultr`)는 저장소에 커밋하지 않는다. 팀원과 공유할 땐 별도 채널로.
