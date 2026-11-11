// app.js
// UI·이미지 변환·픽셀 크기 조정·피드백·취소·네온·3D UI 구현 (정리된 버전)

(() => {
  /* ---------- DOM 요소 ---------- */
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const selectButton = document.getElementById('select-button');
  const formatSelect = document.getElementById('format-select');
  const qualitySlider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const previewImg = document.getElementById('preview-img');
  const downloadBtn = document.getElementById('download-button');
  const cancelBtn = document.getElementById('cancel-button');
  const toastContainer = document.getElementById('toast-container');
  const feedbackForm = document.getElementById('feedback-form');
  const feedbackInput = document.getElementById('feedback-input');
  const feedbackList = document.getElementById('feedback-list');
  const langEnBtn = document.getElementById('lang-en');
  const langKoBtn = document.getElementById('lang-ko');

  /* ---------- 전역 상태 ---------- */
  let currentBlob = null; // 변환된 이미지 Blob
  let targetWidth = null; // 사용자가 입력한 가로(px)
  let targetHeight = null; // 사용자가 입력한 세로(px)
  let lockRatio = true; // 비율 유지 여부
  let originalAspect = null; // 원본 이미지 가로/세로 비율

  /* ---------- i18n 데이터 ---------- */
  const i18n = {
    en: {
      'title': 'Space Image Converter',
      'header-title': 'Space Image Converter',
      'tagline': 'No login required, no server transmission, the safest and fastest image converter',
      'converter-title': 'Image Converter',
      'drop-hint': 'Drag your image here',
      'or': 'or',
      'select-button': 'Select Image',
      'format-label': 'Format',
      'format-jpeg': 'JPEG',
      'format-png': 'PNG',
      'format-webp': 'WebP',
      'quality-label': 'Quality (0-100)',
      'download-button': 'Download',
      'cancel-button': 'Cancel Image',
      'feedback-title': 'Feedback',
      'submit-feedback': 'Submit',
      'lang-en': 'EN',
      'lang-ko': 'KO',
      'toast-success': 'Operation successful',
      'toast-error': 'An error occurred',
      'toast-invalid-image': '제대로된 이미지를 가져오세요 인간',
      'toast-file-too-large': '파일이 너무 큽니다. 25 MB 이하로 압축해주세요.',
      'toast-feedback-empty': '피드백을 입력해주세요.',
      'toast-feedback-sent': '피드백이 전송되었습니다.',
      'width-label': 'Width (px)',
      'height-label': 'Height (px)',
      'lock-ratio': 'Lock Ratio',
      'size-invalid': '유효한 크기를 입력해주세요 (1~10000)'
    },
    ko: {
      'title': '스페이스 이미지 변환기',
      'header-title': '스페이스 이미지 변환기',
      'converter-title': '이미지 변환',
      'drop-hint': '이미지를 여기로 끌어다 놓으세요',
      'or': '또는',
      'select-button': '이미지 선택',
      'format-label': '포맷',
      'format-jpeg': 'JPEG',
      'format-png': 'PNG',
      'format-webp': 'WebP',
      'quality-label': '품질 (0-100)',
      'download-button': '다운로드',
      'cancel-button': '이미지 취소',
      'feedback-title': '피드백',
      'submit-feedback': '전송',
      'lang-en': 'EN',
      'lang-ko': 'KO',
      'toast-success': '작업이 성공했습니다',
      'toast-error': '오류가 발생했습니다',
      'toast-invalid-image': '제대로된 이미지를 가져오세요 인간',
      'toast-file-too-large': '파일이 너무 큽니다. 25 MB 이하로 압축해주세요.',
      'toast-feedback-empty': '피드백을 입력해주세요.',
      'toast-feedback-sent': '피드백이 전송되었습니다.',
      'width-label': '가로 (px)',
      'height-label': '세로 (px)',
      'lock-ratio': '비율 유지',
      'size-invalid': '유효한 크기를 입력해주세요 (1~10000)'
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
    if (feedbackInput) {
      feedbackInput.placeholder = lang === 'ko' ? '피드백을 입력하세요...' : 'Enter your feedback...';
    }
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
    URL.revokeObjectURL(a.href);
    showToast(i18n.ko['toast-success'], 'success');
  }

  /* ---------- 이벤트 바인딩 ---------- */
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => e.preventDefault());
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  selectButton.addEventListener('click', () => fileInput.click());

  widthInput?.addEventListener('input', e => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) return;
    targetWidth = val;
    if (lockRatio && targetHeight) {
      targetHeight = Math.round(val / originalAspect);
      heightInput.value = targetHeight;
    }
    drawToCanvas(previewImg);
  });

  heightInput?.addEventListener('input', e => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) return;
    targetHeight = val;
    if (lockRatio && targetWidth) {
      targetWidth = Math.round(val * originalAspect);
      widthInput.value = targetWidth;
    }
    drawToCanvas(previewImg);
  });

  lockRatio && (lockRatio = lockRatio);
  document.getElementById('lock-ratio')?.addEventListener('change', e => lockRatio = e.target.checked);

  formatSelect.addEventListener('change', updateConversion);
  qualitySlider.addEventListener('input', e => {
    qualityValue.textContent = e.target.value;
    updateConversion();
  });

  downloadBtn.addEventListener('click', () => {
    if (!currentBlob) return showToast(i18n.ko['toast-error'], 'error');
    const ext = formatSelect.value.split('/')[1];
    downloadBlob(currentBlob, `converted.${ext}`);
  });

  cancelBtn.addEventListener('click', () => {
    previewImg.src = '';
    previewImg.style.display = 'none';
    currentBlob = null;
    showToast(i18n.ko['toast-success'], 'success');
  });

  feedbackForm?.addEventListener('submit', e => {
    e.preventDefault();
    const text = feedbackInput.value.trim();
    if (!text) return showToast(i18n.ko['toast-feedback-empty'], 'error');
    const li = document.createElement('li');
    li.textContent = text;
    feedbackList.appendChild(li);
    feedbackInput.value = '';
    showToast(i18n.ko['toast-feedback-sent'], 'success');
  });

  langEnBtn?.addEventListener('click', () => applyLanguage('en'));
  langKoBtn?.addEventListener('click', () => applyLanguage('ko'));

  // 초기 언어 설정
  applyLanguage('en');
})();
