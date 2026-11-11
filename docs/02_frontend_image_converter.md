# 02_frontend_image_converter.md

## 개요
이 문서는 브라우저에서 동작하는 이미지 변환 UI와 핵심 로직을 상세히 설명합니다. UI는 **드래그 앤 드롭**과 **파일 선택 버튼** 두 가지 방식으로 이미지를 로드하고, 슬라이더를 통해 품질 및 포맷을 선택한 뒤 **다운로드** 버튼으로 변환된 이미지를 저장합니다.

## 주요 컴포넌트
| 컴포넌트 | 역할 | 핵심 변수/함수 |
|----------|------|----------------|
| `#drop-zone` | 이미지 파일을 드래그‑드롭 받을 영역 | `handleDrop(event)` |
| `#file-input` (hidden) | 파일 선택 버튼 클릭 시 작동하는 `<input type="file">` | `fileInput.click()` |
| `#select-button` | 사용자가 파일 선택 UI를 열도록 하는 버튼 | `selectButton.addEventListener('click', ...)` |
| `#quality-slider` | JPEG/WEBP 품질을 0‑100 사이로 조절 | `qualityValue` |
| `#format-select` | 출력 포맷(WebP, PNG, JPEG) 선택 | `outputFormat` |
| `#download-button` | 변환된 Blob을 다운로드 | `downloadBlob(blob, filename)` |
| `#toast` | 오류·성공 알림 표시 (toast) | `showToast(message, type)` |
| `#feedback-form` | 피드백 입력 및 전송 UI | `submitFeedback(event)` |

## 이미지 로드 흐름
1. **드래그 앤 드롭** 혹은 **버튼 클릭**으로 파일을 선택합니다.
2. `handleFiles(files)` 가 호출되어 파일 타입(`image/*`)을 검사합니다.
3. 유효하지 않은 파일이면 `showToast('제대로된 이미지를 가져오세요 인간', 'error')` 로 오류를 표시하고 함수를 종료합니다.
4. 유효하면 `FileReader` 로 데이터를 읽어 `Image` 객체에 로드합니다.
5. 이미지가 로드된 후 `drawToCanvas(img)` 를 호출해 `<canvas>`에 그립니다. 여기서 원본 비율을 유지하면서 최대 너비/높이(1200px) 로 리사이즈합니다.
6. 사용자가 품질·포맷 슬라이더를 조정하면 `updateConversion()` 가 실행되어 현재 캔버스 데이터를 `canvas.toBlob()` 로 변환합니다.
7. 변환이 완료되면 `downloadBlob` 로 다운로드 링크를 생성하고 자동 클릭합니다.

## 핵심 코드 스니펫 (app.js)
```javascript
function handleFiles(files) {
  const file = files[0];
  if (!file.type.startsWith('image/')) {
    showToast('제대로된 이미지를 가져오세요 인간', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => drawToCanvas(img);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function drawToCanvas(img) {
  const maxDim = 1200; // 최대 크기 제한
  let { width, height } = img;
  if (width > height) {
    if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
  } else {
    if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
  }
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  updateConversion();
}

function updateConversion() {
  const quality = qualitySlider.value / 100; // 0~1
  const format = formatSelect.value; // 'image/jpeg', 'image/webp', 'image/png'
  canvas.toBlob(blob => {
    previewImg.src = URL.createObjectURL(blob);
    currentBlob = blob; // 전역 변수에 저장
  }, format, quality);
}
```

## UI 텍스트 다국어 처리
`i18n` 객체에 EN/KO 문자열을 정의하고, `applyLanguage(lang)` 함수가 모든 요소(`data-i18n-key`)에 매핑된 텍스트를 삽입합니다. 언어 버튼(`#lang-en`, `#lang-ko`) 클릭 시 `applyLanguage('en')` 혹은 `applyLanguage('ko')` 를 호출합니다.

## 접근성 및 UX 고려사항
- 드롭존은 `role="button"` 과 `aria-label` 을 지정해 키보드 접근성을 보장합니다.
- 슬라이더와 셀렉트 박스는 `<label>` 로 감싸고 `for` 속성을 연결해 스크린 리더가 읽을 수 있게 합니다.
- 토스트는 `role="alert"` 로 설정하고 자동 사라지도록 타이머를 둡니다.
- 이미지 미리보기(`#preview`)는 `alt` 속성을 빈 문자열(`""`) 로 두어 장식용임을 표시합니다.

## 참고 파일 목록
- `index.html` – UI 마크업 및 `data-i18n-key` 지정
- `styles.css` – 다크 테마 및 레이아웃 정의
- `app.js` – 위 로직 전체 구현
- `supabaseClient.js` – 피드백 저장용 클라이언트 (Mock 포함)

> [!NOTE] 이 문서는 프론트엔드 구현 세부사항을 이해하고, 향후 확장(예: 추가 포맷, 배치 처리) 시 참고하도록 작성되었습니다.

