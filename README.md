# ZALLETS 관리자 앱

파트너 관리·앱 문구 설정·공지사항 관리·신청현황·예약현황을 관리하는
내부 도구입니다. `website/`(Vercel 서버리스 함수 + Postgres)를 그대로
호출하는 별도 클라이언트로, 손님용 앱(`app/`)과 완전히 분리된 프로젝트·
배포입니다 — 손님용 앱 번들에 관리자 코드가 섞이지 않고, 관리자 전용
도메인(예: `admin.zallets.app`)을 따로 붙일 수 있습니다.

**새 백엔드가 없습니다.** 이 앱은 화면만 있고, 실제 읽기/쓰기는 전부
`website/api/*`(특히 `website/api/admin.js`)가 처리합니다. 백엔드 스키마는
`website/README.md` "3. Postgres 연동" 참고.

## 인증

회원 로그인 시스템은 없습니다. 공유 비밀번호(`ADMIN_SECRET`, `website/.env`에
설정된 값과 동일해야 함)를 입력하면 `x-admin-secret` 헤더로 모든 요청에
실어 보냅니다(`src/lib/adminApi.ts`). 비밀번호는 React state에만 두고
`localStorage`에 저장하지 않습니다 — 새로고침하면 다시 입력해야 합니다.

## 구조

```
admin-app/
  src/
    main.tsx                    # createRoot(...).render(<AdminApp />) — 라우터 없음, 이 앱 전체가 관리자용
    index.css                   # @import "tailwindcss";
    lib/adminApi.ts             # website/api/admin.js 호출 클라이언트 (x-admin-secret 헤더)
    components/
      AdminApp.tsx               # 비밀번호 게이트 + 탭바
      AdminPartnersTab.tsx        # 파트너 CRUD + 사진 업로드(Vercel Blob)
      AdminNoticesTab.tsx         # 공지사항 CRUD
      AdminSettingsTab.tsx        # 앱 문구 자유 key-value 에디터
      AdminApplicationsTab.tsx    # 신청현황 + 결제 검증상태 토글
      AdminBookingsTab.tsx        # 예약현황(월별 조회)
  vite.config.ts
  vercel.json                    # /api/:path* → website 배포로 rewrite (CORS 우회)
  package.json
  .env.example
```

## 로컬에서 실행하기

`website/api`는 CORS 헤더를 안 내려주므로, 로컬 개발 중엔 Vite dev 서버가
`/api` 요청을 백엔드로 프록시해서 브라우저 입장에서 same-origin으로
보이게 합니다.

```bash
# 1) 터미널 1 — 백엔드를 로컬에 띄운다 (website/README.md "1. 로컬에서 테스트하기" 참고)
cd website
vercel dev

# 2) 터미널 2 — 관리자 앱
cd admin-app
npm install
cp .env.example .env.local   # API_PROXY_TARGET을 위 백엔드 주소로 채우기
npm run dev
```

로컬에 백엔드를 띄우지 않고 배포된 프로덕션 백엔드를 직접 보고 싶다면
`API_PROXY_TARGET`을 그 배포 도메인으로 설정하면 됩니다.

## Vercel 배포하기

1. Vercel에서 **New Project**로 이 저장소를 가져오고 **Root Directory**를
   `admin-app`으로 지정합니다(손님용 `app/`과는 별개의 프로젝트로
   만듭니다).
2. Framework Preset은 Vite로 자동 감지됩니다.
3. 배포 후 손님용 앱과 다른 도메인(예: `admin.zallets.app`)을 붙이면
   관리자 도구가 검색엔진에 노출되거나 손님이 실수로 접근할 일이 줄어듭니다
   (이미 `vercel.json`에 `X-Robots-Tag: noindex, nofollow`를 넣어뒀습니다).
4. 이 앱 자체는 환경변수가 필요 없습니다(백엔드 인증은 요청 시 입력하는
   `ADMIN_SECRET`으로 처리) — `website` 프로젝트 쪽에 `ADMIN_SECRET`/
   `POSTGRES_URL`/`BLOB_READ_WRITE_TOKEN`이 설정되어 있으면 됩니다.
