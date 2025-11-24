# CAFELOGIC

**Cafe-Based Review Workflow Automation Engine**

맘카페 리뷰 작업을 자동화하는 내부 WebApp입니다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Authentication**: 자체 구현 (JWT + bcrypt)
- **Deployment**: Railway

## 주요 기능

### 인증 시스템
- 자체 구현 인증 (Clerk 사용 안 함)
- 관리자 계정: `admin` / `250801`
- 리뷰어 계정: `reviewer001` 등 / `1234` (기본 비밀번호)
- JWT 기반 세션 관리
- Role 기반 라우팅

### 관리자 기능
- 리뷰어 계정 생성 및 관리
- 카페 리스트 관리
- 작업 생성 및 관리
- 작업 승인/거부
- 정산 관리

### 리뷰어 기능
- 작업 목록 조회
- 마감일 D-Day 표시
- 작업 제출
- 마이페이지 (통계 및 정산 내역)

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-change-in-production
```

### 3. 데이터베이스 초기화

애플리케이션을 처음 실행하면 자동으로 데이터베이스 스키마가 생성됩니다.

또는 수동으로 `lib/db.ts`의 `initDatabase()` 함수를 호출할 수 있습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## Railway 배포

### 1. Railway 프로젝트 생성
- Railway 대시보드에서 "New Project" 선택
- GitHub 저장소 연결

### 2. PostgreSQL 추가
- Railway 대시보드에서 "New" → "Database" → "Add PostgreSQL" 선택
- `DATABASE_URL` 환경 변수가 자동으로 설정됩니다

### 3. 환경 변수 설정
Railway 대시보드에서 다음 환경 변수를 설정하세요:
- `DATABASE_URL`: PostgreSQL 연결 문자열 (자동 설정됨)
- `JWT_SECRET`: JWT 서명에 사용할 비밀 키

### 4. 배포
- GitHub에 푸시하면 자동으로 배포됩니다
- 또는 Railway 대시보드에서 "Deploy" 버튼 클릭

## 데이터베이스 스키마

### reviewers (리뷰어 계정)
- `id`: UUID (Primary Key)
- `username`: TEXT (Unique)
- `password_hash`: TEXT
- `nickname`: TEXT
- `unit_price`: INTEGER (정산 단가)
- `created_at`: TIMESTAMP

### admins (관리자 계정)
- `id`: UUID (Primary Key)
- `username`: TEXT (Unique)
- `password_hash`: TEXT
- `created_at`: TIMESTAMP

### cafes (카페 리스트)
- `id`: UUID (Primary Key)
- `name`: TEXT
- `level`: TEXT (SS/S/A/B/C)
- `allow_review`: BOOLEAN
- `allow_business_name`: BOOLEAN
- `allow_after_post`: BOOLEAN
- `require_approval`: BOOLEAN
- `notes`: TEXT

### tasks (작업 테이블)
- `id`: UUID (Primary Key)
- `reviewer_id`: UUID (Foreign Key → reviewers)
- `cafe_id`: UUID (Foreign Key → cafes)
- `task_type`: TEXT (질문/후기/댓글/정보)
- `assigned_at`: TIMESTAMP
- `deadline`: DATE
- `cafe_link`: TEXT
- `business_name`: TEXT
- `place_address`: TEXT
- `need_photo`: BOOLEAN
- `special_note`: TEXT
- `title_guide`: TEXT
- `content_guide`: TEXT
- `comment_guide`: TEXT
- `submit_link`: TEXT
- `status`: TEXT (pending/ongoing/submitted/approved/rejected)
- `approved_at`: TIMESTAMP
- `settlement_amount`: INTEGER

### settlements (월별 정산)
- `id`: UUID (Primary Key)
- `reviewer_id`: UUID (Foreign Key → reviewers)
- `month`: TEXT (YYYY-MM)
- `task_count`: INTEGER
- `total_amount`: INTEGER

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 관리자
- `POST /api/admin/reviewers/create` - 리뷰어 생성
- `GET /api/admin/reviewers/list` - 리뷰어 목록
- `POST /api/admin/cafes/create` - 카페 생성
- `GET /api/admin/cafes/list` - 카페 목록
- `POST /api/admin/tasks/create` - 작업 생성
- `GET /api/admin/tasks/list` - 작업 목록
- `POST /api/admin/tasks/approve` - 작업 승인
- `POST /api/admin/tasks/reject` - 작업 거부

### 리뷰어
- `GET /api/reviewer/tasks/list` - 작업 목록
- `POST /api/reviewer/tasks/submit` - 작업 제출
- `GET /api/reviewer/mypage/summary` - 마이페이지 요약

## 라이선스

내부 사용 전용

