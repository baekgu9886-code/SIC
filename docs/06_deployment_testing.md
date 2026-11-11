# 06_deployment_testing.md

## 개요
본 문서는 **Space Image Converter** 프로젝트를 로컬에서 실행하고, Vercel 또는 Netlify와 같은 정적 호스팅 서비스에 배포하는 전 과정을 단계별로 안내합니다. 모든 명령은 Windows PowerShell 환경을 기준으로 작성되었습니다.

## 1. 로컬 실행 단계
| 단계 | 명령어 | 설명 |
|------|--------|------|
| 1.1 | `cd "C:\Users\SMHRD\Desktop\Space Image Converter"` | 프로젝트 루트 디렉터리로 이동 |
| 1.2 | `npm install` *(패키지가 있다면)* | Node 의존성 설치 (현재는 `express` 만 사용) |
| 1.3 | `node server.js` | 로컬 정적 서버 실행 (기본 포트 `3000`) |
| 1.4 | 브라우저에서 `http://localhost:3000` 접속 | UI 확인 – 이미지 변환, 피드백 전송, 언어 전환이 모두 동작해야 함 |

### 확인 포인트
- **이미지 변환**: 다양한 포맷(JPG, PNG, WebP)과 품질을 조절해 다운로드가 정상인지 확인
- **피드백**: 입력 후 전송 → 리스트 최상단에 표시
- **다국어**: EN ↔ KO 버튼 클릭 시 모든 텍스트가 교체되는지 확인
- **오류 토스트**: 비이미지 파일, 25 MB 초과 파일 등으로 오류가 발생하면 지정된 한국어 토스트가 표시되어야 함

## 2. 환경 변수 설정 (.env)
프로젝트 루트에 `.env` 파일을 만들고 다음과 같이 입력합니다. 실제 Supabase 키가 있는 경우에만 입력하고, 키가 없으면 로컬 Mock가 자동 사용됩니다.
```dotenv
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR-ANON-KEY
# (선택) OpenAI API 키 – 향후 AI 기능을 위해 사용
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
> **주의**: `.env` 파일은 `.gitignore` 에 포함되어 있어 Git에 커밋되지 않도록 합니다.

## 3. 정적 호스팅 서비스에 배포
### 3.1 Vercel 배포
1. Vercel CLI 설치 (전역) `npm i -g vercel`
2. 프로젝트 루트에서 `vercel` 명령 실행
3. 프롬프트에 따라 **`Static Site`** 로 설정 (빌드 명령 없음)
4. 배포가 완료되면 제공된 URL(`https://xxxx.vercel.app`) 에 접속해 정상 동작 확인

### 3.2 Netlify 배포
1. Netlify CLI 설치 `npm i -g netlify-cli`
2. `netlify deploy --dir "C:\Users\SMHRD\Desktop\Space Image Converter" --prod`
3. 안내에 따라 사이트 이름을 지정하고 배포 완료 URL 확인

> **TIP**: 두 서비스 모두 **배포 후 환경 변수**를 UI에서 설정할 수 있습니다. Supabase URL/Key 를 각각 입력해 주면 실제 DB와 연동됩니다.

## 4. CI/CD (선택 사항)
- **GitHub Actions** 를 활용해 `push` 시 자동으로 Vercel에 배포하도록 워크플로우를 구성할 수 있습니다.
- 기본 파일 (`.github/workflows/deploy.yml`) 은 간단히 `vercel --prod` 를 실행하도록 작성합니다.

## 5. 테스트 시나리오 (자동/수동)
| 테스트 번호 | 시나리오 | 기대 결과 |
|------------|----------|-----------|
| T1 | 이미지 파일 `test.jpg` 드래그 | 변환 후 다운로드 파일이 1 s 이내에 생성됨 |
| T2 | `test.png` 를 100 % 품질로 변환 | 파일 크기가 원본보다 작아야 함 |
| T3 | 피드백 입력 후 전송 | 리스트 최상단에 표시, toast `피드백이 전송되었습니다.` 발생 |
| T4 | 한국어 버튼 클릭 | 모든 UI 텍스트가 한글로 교체 |
| T5 | 30 MB 파일 선택 | toast `파일이 너무 큽니다. 25 MB 이하로 압축해주세요.` 표시 |
| T6 | 비이미지 파일(`sample.txt`) 드롭 | toast `제대로된 이미지를 가져오세요 인간` 표시 |
| T7 | Supabase 키 누락 상태에서 피드백 전송 | 로컬스토리지에 저장되고 새로고침 후에도 유지 |

## 6. 유지보수 체크리스트
- `server.js` 포트가 충돌 시 `process.env.PORT` 로 변경
- Supabase 테이블 스키마(`001_create_feedback_table.sql`) 가 최신인지 확인
- `.env.example` 파일을 프로젝트에 포함시켜 새 팀원이 쉽게 설정 가능하도록 함
- 정적 파일(`index.html`, `styles.css`, `app.js`) 의 캐시 전략을 CDN 설정에 맞게 조정 (예: `Cache-Control: max-age=31536000`)

---
**마무리**: 위 가이드를 따라 로컬 검증 → 클라우드 배포 → 운영 테스트를 수행하면 프로젝트가 완전하게 동작합니다. 추가 문의 사항이 있으면 언제든 알려 주세요.

