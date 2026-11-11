(() => {
  const $ = (id) => document.getElementById(id);
  const state = { files: [] };
  const fileInput = $('fileInput');
  const dropzone = $('dropzone');
  const editor = $('editor');
  const fileList = $('fileList');
  const formatSelect = $('formatSelect');
  const qualitySlider = $('qualitySlider');
  const convertButton = $('convertButton');
  const message = $('message');

  $('year').textContent = new Date().getFullYear();
  $('browseButton').addEventListener('click', (event) => { event.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener('change', () => { addFiles([...fileInput.files]); fileInput.value = ''; });

  ['dragenter','dragover'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault(); dropzone.classList.add('dragover');
  }));
  ['dragleave','drop'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault(); dropzone.classList.remove('dragover');
  }));
  dropzone.addEventListener('drop', event => addFiles([...event.dataTransfer.files]));

  qualitySlider.addEventListener('input', () => $('qualityValue').textContent = `${qualitySlider.value}%`);
  $('clearButton').addEventListener('click', () => { state.files = []; render(); message.textContent = ''; });
  convertButton.addEventListener('click', convertAll);

  function addFiles(files) {
    const accepted = files.filter(file => file.type.startsWith('image/'));
    const rejected = files.length - accepted.length;
    accepted.forEach(file => state.files.push({ file, id: crypto.randomUUID() }));
    render();
    message.textContent = rejected ? `${rejected}개 파일은 이미지가 아니어서 제외했습니다.` : '';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  }

  function render() {
    editor.hidden = state.files.length === 0;
    fileList.replaceChildren();
    state.files.forEach(item => {
      const row = document.createElement('div'); row.className = 'file-item';
      const img = document.createElement('img'); img.className = 'thumb'; img.alt = ''; img.src = URL.createObjectURL(item.file);
      const meta = document.createElement('div'); meta.className = 'file-meta';
      const name = document.createElement('div'); name.className = 'file-name'; name.textContent = item.file.name;
      const size = document.createElement('div'); size.className = 'file-size'; size.textContent = formatBytes(item.file.size);
      meta.append(name, size);
      const remove = document.createElement('button'); remove.className = 'remove-file'; remove.type = 'button'; remove.textContent = '삭제';
      remove.setAttribute('aria-label', `${item.file.name} 삭제`);
      remove.addEventListener('click', () => { URL.revokeObjectURL(img.src); state.files = state.files.filter(f => f.id !== item.id); render(); });
      row.append(img, meta, remove); fileList.append(row);
    });
    $('summaryText').textContent = `${state.files.length}개 이미지 선택됨`;
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name}: 이미지를 읽을 수 없습니다.`)); };
      img.src = url;
    });
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob); else reject(new Error('이 형식으로 변환할 수 없습니다.'));
    }, type, quality));
  }

  async function convertAll() {
    if (!state.files.length) return;
    convertButton.disabled = true;
    convertButton.textContent = '변환 중...';
    message.textContent = '브라우저에서 이미지를 변환하고 있습니다.';
    const type = formatSelect.value;
    const quality = Number(qualitySlider.value) / 100;
    let completed = 0;
    try {
      for (const item of state.files) {
        const img = await loadImage(item.file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0);
        let blob = await canvasBlob(canvas, type, quality);
        // Some browsers silently fall back to PNG when WebP encoding is unsupported.
        if (type === 'image/webp' && blob.type !== 'image/webp') throw new Error('이 브라우저는 WebP 인코딩을 지원하지 않습니다.');
        const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
        const outputName = item.file.name.replace(/\.[^.]+$/, '') + '.' + extension;
        downloadBlob(blob, outputName);
        completed++;
        await new Promise(resolve => setTimeout(resolve, 180));
      }
      message.textContent = `${completed}개 이미지 변환 완료! 다운로드를 확인하세요.`;
    } catch (error) {
      message.textContent = error.message || '변환 중 오류가 발생했습니다.';
    } finally {
      convertButton.disabled = false;
      convertButton.innerHTML = '변환 및 다운로드 <span>→</span>';
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
})();
