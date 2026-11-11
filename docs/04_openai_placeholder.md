# 04_openai_placeholder.md

## 개요
현재 프로젝트에서는 **OpenAI API** 를 활용한 AI 기능이 포함되지 않았습니다. 향후 이미지 설명 자동生成, 사용자의 피드백에 대한 감성 분석 등 AI 연동이 필요할 경우를 대비해 **플레이스홀더** 문서를 작성했습니다.

## 예상 활용 시나리오
1. **이미지 설명 자동 생성** – 사용자가 업로드한 이미지에 대한 텍스트 설명을 생성하여 UI에 표시.
2. **피드백 감성 분석** – 제출된 피드백을 긍정/부정으로 분류해 관리자가 빠르게 파악.
3. **스마트 포맷 추천** – 이미지 특성(해상도, 색상 등)을 분석해 최적의 포맷·품질을 제안.

## 필요 API 키 및 설정
- **OpenAI API Key** 를 `OPENAI_API_KEY` 환경 변수에 저장하고, `.env` 파일에 아래와 같이 추가합니다.

```dotenv
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- **보안**: 키는 절대 코드에 하드코딩하지 말고, `.gitignore` 로 `.env` 를 제외합니다.

## 프론트엔드 연동 가이드 (`app.js` 예시)
```javascript
async function generateImageCaption(blob) {
  const apiKey = window.__ENV?.OPENAI_API_KEY;
  if (!apiKey) return null; // 키가 없으면 건너뜀
  const formData = new FormData();
  formData.append('file', blob, 'image.png');
  const resp = await fetch('https://api.openai.com/v1/images/analysis', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.caption; // 가정: API가 caption 필드 반환
}
```
> **NOTE**: 실제 OpenAI 이미지 분석 엔드포인트는 현재 베타이므로, 사용 전 공식 문서를 확인하세요.

## 서버 사이드 구현 가이드 (`server.js` 예시)
```javascript
// Express 로 프록시 라우터 구현 (CORS 회피 방지)
app.post('/api/openai/caption', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OpenAI 키 없음' });
  // req.body 에서 이미지 파일을 받아 OpenAI 로 전달 후 결과 반환
  // 구현은 생략 (플레이스홀더)
  res.json({ caption: '이미지 설명 예시' });
});
```

## 향후 작업 리스트
- [ ] OpenAI 이미지 분석 API 확인 및 최신 엔드포인트 적용
- [ ] 프론트엔드에서 이미지 변환 후 바로 캡션 요청 로직 추가
- [ ] 에러 처리 및 토스트 메시지(`"AI 서비스를 이용할 수 없습니다."`) 구현
- [ ] 비용 관리(요청당 토큰/이미지 수) 정책 수립
- [ ] 테스트 자동화 (Jest + mock 서버) 구축

> [!TIP] 실제 서비스에 적용하기 전 **비용**과 **응답 시간**을 사전에 측정해 SLA를 정의하는 것이 좋습니다.

