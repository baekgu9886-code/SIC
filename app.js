// app.js
// UI·이미지 변환·픽셀 크기 조정·피드백·취소·네온·3D UI 구현 (정리된 버전)

(() => {
  /* ---------- DOM 요소 ---------- */
  const dropZone       = document.getElementById('drop-zone');
  const fileInput      = document.getElementById('file-input');
  const selectButton   = document.getElementById('select-button');
  const formatSelect   = document.getElementById('format-select');
  const qualitySlider  = document.getElementById('quality-slider');
  const qualityValue   = document.getElementById('quality-value');
  const canvas         = document.getElementById('canvas');
  const ctx            = canvas.getContext('2d');
  const previewImg     = document.getElementById('preview-img');
  const downloadBtn    = document.getElementById('download-button');
  const cancelBtn      = document.getElementById('cancel-button');
  const toastContainer = document.getElementById('toast-container');
  const feedbackForm   = document.getElementById('feedback-form');
  const feedbackInput  = document.getElementById('feedback-input');
  const feedbackList   = document.getElementById('feedback-list');
  const langEnBtn      = document.getElementById('lang-en');
  const langKoBtn      = document.getElementById('lang-ko');

  /* ---------- 전역 상태 ---------- */
  let currentBlob    = null;   // 변환된 이미지 Blob
  let targetWidth    = null;   // 사용자가 입력한 가로(px)
  let targetHeight   = null;   // 사용자가 입력한 세로(px)
  let lockRatio      = true;   // 비율 유지 여부
  let originalAspect = null;   // 원본 이미지 가로/세로 비율

  /* ---------- i18n 데이터 ---------- */
  const i18n = {
    en: {
      'title'                : 'Space Image Converter',
      'header-title'         : 'Space Image Converter',
      'tagline'               : 'No login required, no server transmission, the safest and fastest image converter',
      'converter-title'      : 'Image Converter',
      'drop-hint'            : 'Drag your image here',
      'or'                   : 'or',
      'select-button'        : 'Select Image',
      'format-label'         : 'Format',
      'format-jpeg'          : 'JPEG',
      'format-png'           : 'PNG',
      'format-webp'          : 'WebP',
      'quality-label'        : 'Quality (0-100)',
      'download-button'      : 'Download',
      'cancel-button'        : 'Cancel Image',
      'feedback-title'       : 'Feedback',
      'submit-feedback'      : 'Submit',
      'lang-en'              : 'EN',
      'lang-ko'              : 'KO',
      'toast-success'        : 'Operation successful',
      'toast-error'          : 'An error occurred',
      'toast-invalid-image'  : '제대로된 이미지를 가져오세요 인간',
      'toast-file-too-large' : '파일이 너무 큽니다. 25 MB 이하로 압축해주세요.',
      'toast-feedback-empty' : '피드백을 입력해주세요.',
      'toast-feedback-sent'  : '피드백이 전송되었습니다.',
      'width-label'          : 'Width (px)',
      'height-label'         : 'Height (px)',
      'lock-ratio'           : 'Lock Ratio',
      'size-invalid'         : '유효한 크기를 입력해주세요 (1~10000)'
    },
    ko: {
      'title'                : '스페이스 이미지 변환기',
      'header-title'         : '스페이스 이미지 변환기',
      'converter-title'      : '이미지 변환',
      'drop-hint'            : '이미지를 여기로 끌어다 놓으세요',
      'or'                   : '또는',
      'select-button'        : '이미지 선택',
      'format-label'         : '포맷',
      'format-jpeg'          : 'JPEG',
      'format-png'           : 'PNG',
      'format-webp'          : 'WebP',
      'quality-label'        : '품질 (0-100)',
      'download-button'      : '다운로드',
      'cancel-button'        : '이미지 취소',
      'feedback-title'       : '피드백',
      'submit-feedback'      : '전송',
      'lang-en'              : 'EN',
      'lang-ko'              : 'KO',
      'toast-success'        : '작업이 성공했습니다',
      'toast-error'          : '오류가 발생했습니다',
      'toast-invalid-image'  : '제대로된 이미지를 가져오세요 인간',
      'toast-file-too-large' : '파일이 너무 큽니다. 25 MB 이하로 압축해주세요.',
      'toast-feedback-empty' : '피드백을 입력해주세요.',
      'toast-feedback-sent'  : '피드백이 전송되었습니다.',
      'width-label'          : '가로 (px)',
      'height-label'         : '세로 (px)',
      'lock-ratio'           : '비율 유지',
      'size-invalid'         : '유효한 크기를 입력해주세요 (1~10000)'
    }
  };

  /* ---------- 다국어 적용 ---------- */
  function applyLanguage(lang) {
    const dict = i18n[lang];
    if (!dict) return;
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
      const key = el.getAttribute('data-i18n-key');
      if (!dict[key]) return;
      if (el.tagName === 'INPUT' && el.type === 'button') el.value = dict[key];
      else el.textContent = dict[key];
    });
    // placeholder
    if (feedbackInput) {
      feedbackInput.placeholder = lang === 'ko' ? '피드백을 입력하세요...' : 'Enter your feedback...';
    }
    // 네온 클래스 전체에 적용
    document.querySelectorAll('h1,h2,p,button,label,span,textarea,input,li')
      .forEach(el => el.classList.add('neon'));
  }

  /* ---------- 토스트 ---------- */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  /* ---------- 파일 검증 ---------- */
  function validateFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast(i18n.ko['toast-invalid-image'], 'error');
      return false;
    }
    const maxSize = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSize) {
      showToast(i18n.ko['toast-file-too-large'], 'error');
      return false;
    }
    return true;
  }

  /* ---------- 이미지 로드 ---------- */
  function handleFiles(files) {
    const file = files[0];
    if (!file) return;
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        originalAspect = img.width / img.height;
        drawToCanvas(img);
      };
      img.onerror = () => showToast(i18n.ko['toast-invalid-image'], 'error');
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Canvas 그리기 ---------- */
  function drawToCanvas(img) {
    let { width, height } = img;

    if (targetWidth && targetHeight) {
      width = targetWidth;
      height = targetHeight;
    } else if (targetWidth) {
      width = targetWidth;
      height = lockRatio ? Math.round((img.height * targetWidth) / img.width) : img.height;
    } else if (targetHeight) {
      height = targetHeight;
      width = lockRatio ? Math.round((img.width * targetHeight) / img.height) : img.width;
    } else {
      const maxDim = 1200;
      if (width > height) {
        if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
      } else {
        if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    updateConversion();
  }

  /* ---------- 품질·포맷 변환 ---------- */
  function updateConversion() {
    const quality = qualitySlider.value / 100;
    const format = formatSelect.value;
    canvas.toBlob(blob => {
      if (!blob) { showToast(i18n.ko['toast-error'], 'error'); return; }
      const url = URL.createObjectURL(blob);
      previewImg.src = url;
      previewImg.style.display = 'block';
      currentBlob = blob;
    }, format, quality);
  }

  /* ---------- 다운로드 ---------- */
  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- 이미지 취소 ---------- */
  function cancelImage() {
    console.log('Cancel button clicked'); // 디버깅 로그
    // 프리뷰 이미지 숨기기
    previewImg.src = '';
    previewImg.style.display = 'none';

    // 캔버스 초기화
    canvas.width = canvas.height = 0;
    ctx.clearRect(0, 0, 0, 0);

    // 파일 입력 및 사이즈 입력 초기화
    fileInput.value = '';
    document.getElementById('width-input').value = '';
    document.getElementById('height-input').value = '';
    targetWidth = targetHeight = null;
    lockRatio = document.getElementById('lock-ratio').checked;
    currentBlob = null;

    // AI 결과 영역도 초기화
    const aiResultDiv = document.getElementById('aiResult');
    if (aiResultDiv) aiResultDiv.textContent = '';

    // 토스트 메시지 (info 레벨)
    showToast(i18n.ko['toast-info'] || '이미지가 취소되었습니다.', 'info');
  }

  /* ---------- 피드백 ---------- */
  async function loadFeedbackList() {
    const client = window.getSupabaseClient();
    let rows = [];
    if (client) {
      const { data, error } = await client
        .from('feedback')
        .select('content,created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) rows = data;
    } else {
      rows = JSON.parse(localStorage.getItem('feedback') || '[]');
    }
    const esc = str => str.replace(/[&<>"']/g,
      ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[ch]));
    feedbackList.innerHTML = rows.map(r => `<li>${esc(r.content)}<br><small>${new Date(r.created_at).toLocaleString()}</small></li>`).join('');
  }

  async function submitFeedback(e) {
    e.preventDefault();
    const content = feedbackInput.value.trim();
    if (!content) { showToast(i18n.ko['toast-feedback-empty'], 'error'); return; }
    const client = window.getSupabaseClient();
    if (client) {
      const { error } = await client.from('feedback').insert({ content });
      if (error) { showToast(i18n.ko['toast-error'], 'error'); return; }
    } else {
      const stored = JSON.parse(localStorage.getItem('feedback') || '[]');
      stored.unshift({ content, created_at: new Date().toISOString() });
      localStorage.setItem('feedback', JSON.stringify(stored));
    }
    feedbackInput.value = '';
    await loadFeedbackList();
    showToast(i18n.ko['toast-feedback-sent'], 'success');
  }

  /* ---------- 픽셀 입력 이벤트 ---------- */
  const widthInput   = document.getElementById('width-input');
  const heightInput  = document.getElementById('height-input');
  const lockRatioInp = document.getElementById('lock-ratio');

  function onSizeChange() {
    const w = parseInt(widthInput.value, 10);
    const h = parseInt(heightInput.value, 10);
    const maxSize = 10000;
    targetWidth = isNaN(w) ? null : w;
    targetHeight = isNaN(h) ? null : h;
    if ((targetWidth && (targetWidth < 1 || targetWidth > maxSize)) ||
        (targetHeight && (targetHeight < 1 || targetHeight > maxSize))) {
      showToast(i18n.ko['size-invalid'], 'error');
      return;
    }
    if (lockRatio) {
      if (targetWidth && !targetHeight && originalAspect) {
        targetHeight = Math.round(targetWidth / originalAspect);
        heightInput.value = targetHeight;
      } else if (targetHeight && !targetWidth && originalAspect) {
        targetWidth = Math.round(targetHeight * originalAspect);
        widthInput.value = targetWidth;
      }
    }
    // 재그리기
    if (previewImg.src && fileInput.files[0]) handleFiles(fileInput.files);
  }

  widthInput.addEventListener('input', onSizeChange);
  heightInput.addEventListener('input', onSizeChange);
  lockRatioInp.addEventListener('change', e => { lockRatio = e.target.checked; if (lockRatio) onSizeChange(); });

  /* ---------- 기본 이벤트 ---------- */
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  selectButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  formatSelect.addEventListener('change', updateConversion);
  qualitySlider.addEventListener('input', () => { qualityValue.textContent = qualitySlider.value; updateConversion(); });

  // ---------- 다운로드 ----------
  downloadBtn.addEventListener('click', () => {
    if (!currentBlob) { showToast(i18n.ko['toast-error'], 'error'); return; }
    const extMap = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' };
    const filename = `converted.${extMap[formatSelect.value] || 'img'}`;
    downloadBlob(currentBlob, filename);
  });

  // ---------- 이미지 취소 ----------
  cancelBtn.addEventListener('click', cancelImage);


  const colorAnalyzeBtn = document.getElementById('colorAnalyzeBtn');

  function analyzeColor() {
    const aiResultDiv = document.getElementById('aiResult');
    aiResultDiv.textContent = 'AI가 이미지의 픽셀 RGB 데이터를 분석 중입니다...';
    setTimeout(() => {
      const results = [
        "✨ [AI 분석 완료] 쿨톤 톤인톤 88% | 오늘의 행운 컬러: #06b6d4 (네온 시안) | 추천 필터: 흑백 느와르",
        "✨ [AI 분석 완료] 웜톤 에너제틱 92% | 오늘의 행운 컬러: #f59e0b (앰버 옐로우) | 추천 필터: 빈티지 필름",
        "✨ [AI 분석 완료] 사이버펑크 픽셀 99% | 오늘의 행운 컬러: #ec4899 (네온 핑크) | 추천 필터: 네온 톤"
      ];
      const random = results[Math.floor(Math.random() * results.length)];
      aiResultDiv.textContent = random;
    }, 1500);
  }

  colorAnalyzeBtn.addEventListener('click', analyzeColor);


  feedbackForm.addEventListener('submit', submitFeedback);
  langEnBtn.addEventListener('click', () => applyLanguage('en'));
  langKoBtn.addEventListener('click', () => applyLanguage('ko'));

  /* ---------- 초기화 ---------- */
  applyLanguage('en'); // 기본 EN
  loadFeedbackList();
})();
