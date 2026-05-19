# LittleSeed — Vercel 배포 체크리스트

## 1. Supabase 설정

### 1-a. 스키마 실행
```
Supabase Dashboard → SQL Editor → supabase/schema.sql 전체 붙여넣기 → Run
```
이미 실행한 경우 `IF NOT EXISTS` 가 있어서 중복 실행해도 안전합니다.

### 1-b. Auth 리다이렉트 URL 등록
```
Authentication → URL Configuration
  Site URL:       https://littleseed.app
  Redirect URLs:  https://littleseed.app/auth/callback
                  http://localhost:3000/auth/callback
```

### 1-c. 이메일 템플릿 (선택)
```
Authentication → Email Templates → Magic Link
  제목: "Your LittleSeed sign-in link"
  본문에 {{ .ConfirmationURL }} 링크 포함
```

### 1-d. Storage 버킷 확인
```
Storage → coloring (public 버킷)
  ├── svg/     ← 채색 파일 (.svg)
  ├── pdf/     ← PDF 다운로드
  └── thumb/   ← 썸네일 이미지
```

---

## 2. Vercel 설정

### 2-a. 프로젝트 import
```
vercel.com → Add New Project → GitHub 연결 → littleseed 선택
Framework: Next.js (자동감지)
Root Directory: /  (기본값)
```

### 2-b. 환경 변수 등록
Settings → Environment Variables 에서 아래 값을 입력:

| 변수명 | 값 위치 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (**secret**) |
| `NEXT_PUBLIC_BASE_URL` | `https://littleseed.app` |
| `NEXT_PUBLIC_ASSET_BASE_URL` | Supabase Storage public URL (선택) |

> **주의**: `SUPABASE_SERVICE_ROLE_KEY` 는 절대 브라우저에 노출되면 안 됩니다.
> Vercel의 "Sensitive" 체크박스를 꼭 체크하세요.

### 2-c. 배포
```
Deploy 버튼 클릭 → 자동 빌드 시작
```

---

## 3. 커스텀 도메인 (선택)

```
Vercel → Domains → Add → littleseed.app
DNS 레코드 (도메인 호스팅에서):
  A     @       76.76.21.21
  CNAME www     cname.vercel-dns.com
```

---

## 4. 배포 후 확인 체크리스트

- [ ] 홈 페이지 → 시트 목록 표시됨
- [ ] 시트 상세 → SVG 렌더링, PDF 다운로드 동작
- [ ] Sign in 클릭 → 이메일 입력 → 매직 링크 수신 확인
- [ ] 매직 링크 클릭 → 로그인됨, 아바타 표시
- [ ] ❤️ 좋아요, 🔖 저장 버튼 동작
- [ ] /saved 페이지 → 저장된 시트 표시
- [ ] /account/conversions → 변환 이력 표시
- [ ] 콘솔 에러 없음 (브라우저 DevTools)
- [ ] Vercel Functions 에러 없음 (Vercel Dashboard → Functions 탭)

---

## 5. 로컬 개발

```bash
# .env.local 파일 생성 (.env.example 참고)
cp .env.example .env.local
# 값 입력 후:

npm install
npm run dev
# → http://localhost:3000
```

---

## 6. 데이터 정리 SQL (필요시)

```sql
-- 테스트 데이터 삭제
DELETE FROM user_conversions WHERE created_at < NOW() - INTERVAL '30 days';

-- 좋아요 수 재계산 (비상용)
UPDATE coloring_pages p
SET    likes_count = (SELECT COUNT(*) FROM user_likes l WHERE l.page_id = p.id);

-- 사용자 목록 확인
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 20;
```
