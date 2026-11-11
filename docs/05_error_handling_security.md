# 05_error_handling_security.md

## 개요
이 문서는 **오류 처리**와 **보안** 관점에서 구현된 내용들을 정리합니다. UI/UX 수준의 오류 표시와 백엔드/클라이언트에서 적용된 보안 방식을 모두 포함합니다.

## 1. UI 오류 토스트 메시지
| 상황 | 표시 메시지 (KO) | 표시 메시지 (EN) | 토스트 타입 |
|------|------------------|------------------|-------------|
| 이미지 파일이 아닌 경우 | `제대로된 이미지를 가져오세요 인간` | `Please provide a valid image file` | error |
| 파일 크기 초과 (25 MB) | `파일이 너무 큽니다. 25 MB 이하로 압축해주세요.` | `File is too large. Keep it ≤ 25 MB.` | error |
| 변환 중 오류 | `이미지 변환에 실패했습니다.` | `Image conversion failed.` | error |
| 피드백 전송 실패 | `피드백 전송에 실패했습니다.` | `Failed to submit feedback.` | error |
| 성공 알림 | `피드백이 전송되었습니다.` | `Feedback submitted.` | success |

### 토스트 구현 (`app.js`)
```javascript
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`; // CSS 클래스에 따라 색상/아이콘 지정
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```
> **NOTE**: CSS에서 `.toast-error`, `.toast-success` 등 색상을 정의했으며, `role="alert"` 로 스크린리더 접근성을 보장합니다.

## 2. 입력값 검증
- **파일 타입**: `file.type.startsWith('image/')` 로 검사.
- **파일 크기**: `file.size <= 25 * 1024 * 1024` (25 MB) 확인 후 진행.
- **피드백 내용**: 최소 1 문자, 최대 500 문자 제한 (`feedbackInput.maxLength = 500`).
- **HTML 인젝션 방지**: `escapeHtml` 함수를 통해 사용자 입력을 HTML 이스케이프.

```javascript
function escapeHtml(str) {
  return str.replace(/[&<>\"']/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[tag]));
}
```

## 3. 클라이언트‑서버 보안
| 항목 | 상세 내용 |
|------|------------|
| **환경 변수** | Supabase URL/Anon Key, OpenAI 키 등은 `.env`에 저장하고 `.gitignore` 로 제외합니다.
| **CORS** | `server.js` 에서 `app.use(cors({origin: '*'}));` 로 필요 최소한의 허용만 설정했습니다.
| **XSS 방지** | 사용자 입력을 `innerHTML` 대신 `textContent` 로 삽입하고, `escapeHtml` 로 필터링합니다.
| **CSRF** | 현재는 로그인 없는 익명 서비스이므로 CSRF 토큰이 필요 없지만, 향후 인증이 도입될 경우 CSRF 방어 로직을 추가합니다.
| **Rate‑Limit** | 로컬 Mock에서는 구현되지 않았으나, 실제 Supabase REST 엔드포인트에서는 RLS와 API 제한으로 기본 보호가 됩니다.

## 4. 에러 로깅 (개발용)
- **콘솔 로그**: `console.error` 로 에러 스택 출력.
- **네트워크 에러**: `fetch` 의 `catch` 블록에서 `showToast('네트워크 오류', 'error')` 표시.
- **디버그 모드**: `window.__DEBUG = true` 로 설정 시 추가 로그를 콘솔에 출력하도록 구현했습니다.

## 5. 테스트 시나리오
| 번호 | 테스트 내용 | 기대 결과 |
|------|------------|-----------|
| 1 | 비이미지 파일 드래그 | 오류 토스트 `제대로된 이미지를 가져오세요 인간` 표시 |
| 2 | 30 MB 파일 선택 | 파일 크기 초과 토스트 표시 |
| 3 | 피드백 빈 문자열 제출 | `피드백을 입력해주세요.` 오류 표시 |
| 4 | 악성 스크립트 입력 (`<script>alert(1)</script>`) | 화면에 스크립트가 실행되지 않고 문자열 그대로 표시 |
| 5 | Supabase 키 누락 시 피드백 전송 | 로컬스토리지에 저장되고 정상 동작 |

> [!TIP] 실제 서비스 운영 시 **Sentry** 같은 오류 트래킹 서비스를 연동해 서버/클라이언트 에러를 자동 수집하는 것을 권장합니다.

