# 북내면, 마을마다 이야기 — 이야기 우체통 (GitHub + Vercel)

정적 사이트(`public/index.html`) + Vercel 서버리스 함수(`api/letters.js`)로 **이야기 우체통**이 실제로 동작합니다.
보내 주신 이야기는 서버에 저장되어 바로 ① 우체통 벽, ② 그 마을의 읽기 화면 끝, ③ 표지 금당천의 작은 점으로 나타납니다.

```
├─ public/index.html   사이트 전체 (약도·사진 포함, 우체통이 /api/letters 호출)
├─ api/letters.js      GET 목록 · POST 저장 · DELETE 관리자 삭제
├─ api/_store.js       저장소 (Upstash Redis 연결 시 영구, 아니면 메모리)
├─ package.json / vercel.json / .env.example
```

## 배포 (약 10분)

### 1. GitHub
1. github.com → 새 저장소 생성 (예: `bukne-archive`)
2. **zip을 그대로 올리지 말고 압축을 푼 뒤**, 폴더 안의 `api`, `public`, `package.json`, `vercel.json`을 한 번에 드래그해 업로드 → Commit
   (터미널이 편하시면: `git init && git add . && git commit -m "이야기 우체통" && git branch -M main && git remote add origin <주소> && git push -u origin main`)

### 2. Vercel
1. vercel.com → Add New… → Project → 그 저장소 Import → 설정 그대로 Deploy
2. `https://<프로젝트명>.vercel.app` 이 나오면 이미 우체통이 동작합니다 (단, 저장소 연결 전에는 서버가 잠들면 사라집니다)

### 3. 영구 저장소 (무료 플랜 있음)
1. Vercel 프로젝트 → **Storage** → Create Database → **Upstash (Redis)** → Create → Connect
2. `KV_REST_API_URL`, `KV_REST_API_TOKEN` 이 자동으로 들어갑니다
3. Deployments → 최신 배포 → **Redeploy** 한 번
4. 이야기를 하나 넣고 새로고침해도 남아 있으면 완료

### 4. 관리자 (선택)
- Settings → Environment Variables 에 `ADMIN_TOKEN=원하는비밀번호` 추가 후 Redeploy
- 연락처까지 포함해 전체 보기: `curl "https://<주소>/api/letters?full=1" -H "x-admin-token: 비밀번호"`
- 삭제: `curl -X DELETE "https://<주소>/api/letters?id=<id>" -H "x-admin-token: 비밀번호"`

## API
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/letters?n=300` | 도착한 이야기 목록 (연락처 제외) |
| POST | `/api/letters` | `{village, place, story, from, contact}` · 5~600자, 1분 6통 제한, 금칙어 필터 |
| DELETE | `/api/letters?id=` | 관리자 삭제 |

## 책의 QR
책 각 장의 "이야기 우체통" QR은 마을별 주소로 바로 연결됩니다.
`https://<주소>/#v=가정1리` 처럼 마을 이름을 붙이면 그 마을의 읽기 화면이 열립니다.

## 로컬 실행
```bash
npm i -g vercel
npm install
vercel dev   # http://localhost:3000
```
