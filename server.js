// server.js
// 이 파일은 정적 파일 서버 역할을 합니다. 프로젝트 폴더 내의 HTML/CSS/JS 파일들을
// 브라우저에서 접근할 수 있도록 포트를 열어줍니다.
// 사용법: `node server.js` 를 실행하면 기본 포트 3000(또는 환경변수 PORT)에서 서비스가 시작됩니다.

const express = require('express');
const path = require('path');
const cors = require('cors');

// 환경 변수에서 PORT 를 읽고 없으면 3000 으로 기본값 설정
const PORT = process.env.PORT || 3000;

const app = express();

// CORS 설정 – 모든 출처 허용 (정적 파일만 제공하므로 최소화)
app.use(cors({origin: '*'}));

// 정적 파일 제공: 현재 디렉터리(프로젝트 루트) 전체를 서빙
app.use(express.static(path.join(__dirname)));

// 라우트: 기본 경로('/') 로 접근하면 index.html 반환
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

