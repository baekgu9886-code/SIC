# PixelShrink — 이미지 포맷 변환 & 압축기

HTML / CSS / Vanilla JavaScript로 구성한 브라우저 기반 이미지 변환기 스타터 프로젝트입니다.

## 실행 방법
1. 압축을 푼 폴더를 VS Code 또는 Antigravity에서 엽니다.
2. `index.html`을 브라우저에서 열거나 VS Code Live Server로 실행합니다.
3. 이미지를 선택하거나 드래그 앤 드롭합니다.
4. WebP / JPG / PNG 형식과 품질을 선택하고 **변환 및 다운로드**를 누릅니다.

별도 서버나 npm 설치가 필요하지 않습니다.

## 파일 구조
```text
browser-image-converter/
├── index.html
├── styles.css
├── app.js
├── ANTIGRAVITY.md
├── README.md
└── assets/
```

## 현재 구현
- 이미지 다중 선택 및 드래그 앤 드롭
- 파일 목록 및 개별/전체 삭제
- WebP, PNG, JPG 출력
- JPG/WebP 품질 조절
- Canvas API 기반 로컬 변환 및 다운로드
- 반응형 다크 UI
- 광고 슬롯 자리 표시자

## 알아둘 점
- 이미지는 서버로 업로드되지 않습니다.
- PNG 인코딩은 브라우저 Canvas API에서 품질 슬라이더를 표준 지원하지 않습니다.
- JPG는 투명 배경을 표현할 수 없어 흰색 배경으로 합성됩니다.
- WebP 인코딩 지원 여부는 브라우저에 따라 다를 수 있습니다.
- 여러 파일 다운로드는 브라우저 설정에 따라 다운로드 허용 확인이 나타날 수 있습니다.

## 다음 개발 추천
1. 변환 전/후 파일 크기와 절감률 표시
2. 변환 완료 후 ZIP 일괄 다운로드
3. 이미지 리사이즈 및 최대 용량 목표 기능
4. 광고 영역 및 개인정보 처리 안내 페이지
5. SEO 메타 태그, 사이트맵, 파비콘
