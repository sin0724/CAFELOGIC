# Railway 배포 가이드

이 가이드는 CAFELOGIC을 Railway에 배포하는 방법을 안내합니다.

## 사전 준비

1. **GitHub 저장소 준비**
   - 코드를 GitHub에 푸시해야 합니다
   - Railway는 GitHub 저장소와 연결하여 자동 배포합니다

2. **Railway 계정 생성**
   - [Railway](https://railway.app)에 가입하세요
   - GitHub 계정으로 로그인하는 것을 권장합니다

## 배포 단계

### 1단계: Railway 프로젝트 생성

1. Railway 대시보드에서 **"New Project"** 클릭
2. **"Deploy from GitHub repo"** 선택
3. GitHub 저장소 선택 및 연결
4. 프로젝트 이름 설정 (예: `cafelogic`)

### 2단계: PostgreSQL 데이터베이스 추가

1. Railway 프로젝트 대시보드에서 **"New"** 버튼 클릭
2. **"Database"** → **"Add PostgreSQL"** 선택
3. PostgreSQL 서비스가 생성되면 `DATABASE_URL` 환경 변수가 자동으로 설정됩니다

### 3단계: 환경 변수 설정

Railway 프로젝트의 **"Variables"** 탭에서 다음 환경 변수를 추가하세요:

#### 필수 환경 변수

```
JWT_SECRET=your-very-secure-random-secret-key-here
```

**JWT_SECRET 생성 방법:**
- 온라인 랜덤 문자열 생성기 사용
- 또는 터미널에서: `openssl rand -base64 32`
- 최소 32자 이상의 랜덤 문자열 권장

#### 자동 설정되는 환경 변수

- `DATABASE_URL`: PostgreSQL 추가 시 자동 설정됨

### 4단계: 배포 설정 확인

`railway.json` 파일이 이미 프로젝트에 포함되어 있습니다:
- 빌드 명령: `npm run build`
- 시작 명령: `npm start`

### 5단계: 배포 실행

1. **자동 배포 (권장)**
   - GitHub에 코드를 푸시하면 자동으로 배포됩니다
   - Railway가 변경사항을 감지하고 자동으로 빌드 및 배포합니다

2. **수동 배포**
   - Railway 대시보드에서 **"Deploy"** 버튼 클릭

### 6단계: 데이터베이스 초기화

배포가 완료되면 다음 URL에 접속하여 데이터베이스를 초기화하세요:

```
https://your-app-name.railway.app/api/init
```

또는 Railway 대시보드의 **"Deployments"** 탭에서 배포된 서비스의 URL을 확인하세요.

### 7단계: 도메인 설정 (선택사항)

1. Railway 프로젝트의 **"Settings"** 탭으로 이동
2. **"Generate Domain"** 클릭하여 무료 Railway 도메인 생성
3. 또는 **"Custom Domain"**에서 자신의 도메인 연결

## 배포 후 확인사항

### ✅ 체크리스트

- [ ] Railway 대시보드에서 배포 상태가 "Active"인지 확인
- [ ] `/api/init` 엔드포인트로 데이터베이스 초기화 완료
- [ ] `/auth/login` 페이지 접속 가능
- [ ] 관리자 계정으로 로그인 테스트 (admin / 250801)
- [ ] 리뷰어 계정 생성 및 로그인 테스트

### 문제 해결

#### 배포 실패 시
1. Railway 대시보드의 **"Deployments"** 탭에서 로그 확인
2. 빌드 오류가 있는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인

#### 데이터베이스 연결 오류
1. `DATABASE_URL` 환경 변수가 올바르게 설정되었는지 확인
2. PostgreSQL 서비스가 실행 중인지 확인
3. `/api/test-db` 엔드포인트로 연결 테스트

#### 로그인 오류
1. `JWT_SECRET` 환경 변수가 설정되었는지 확인
2. 쿠키 설정이 올바른지 확인 (HTTPS 환경)

## 비용 정보

- Railway는 무료 티어를 제공합니다 (월 $5 크레딧)
- PostgreSQL은 무료 티어에서 사용 가능합니다
- 트래픽이 많아지면 유료 플랜으로 업그레이드가 필요할 수 있습니다

## 보안 권장사항

1. **JWT_SECRET**: 강력한 랜덤 문자열 사용
2. **HTTPS**: Railway는 자동으로 HTTPS를 제공합니다
3. **환경 변수**: 민감한 정보는 절대 코드에 하드코딩하지 마세요
4. **데이터베이스**: 프로덕션 환경에서는 정기적인 백업을 권장합니다

## 업데이트 배포

코드를 업데이트한 후:
1. GitHub에 푸시하면 자동으로 재배포됩니다
2. 또는 Railway 대시보드에서 **"Redeploy"** 버튼 클릭

---

**배포 완료 후 서버를 끄지 않아도 Railway에서 24/7 운영됩니다!** 🚀

