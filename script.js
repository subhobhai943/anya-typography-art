(() => {
  'use strict';

  const canvas = document.getElementById('portraitCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const sampleCanvas = document.createElement('canvas');
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const loader = document.getElementById('loader');
  const loadingText = document.getElementById('loadingText');
  const errorMessage = document.getElementById('errorMessage');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const speedControl = document.getElementById('speedControl');
  const densityControl = document.getElementById('densityControl');
  const glowControl = document.getElementById('glowControl');
  const imageSource = new URL('assets/anya.jpg', window.location.href).href;

  const state = {
    image: null,
    pixels: null,
    sampleWidth: 0,
    sampleHeight: 0,
    cssWidth: 0,
    cssHeight: 0,
    dpr: 1,
    cell: 10,
    offset: 0,
    speed: 0.35,
    glow: 0.45,
    pointerX: 0.5,
    pointerY: 0.5,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    lastTime: performance.now(),
    resizeTimer: 0
  };

  function showError(reason) {
    console.error('ANYA portrait failed to initialize:', reason);
    loader.classList.add('is-hidden');
    errorMessage.hidden = false;
    resizeCanvas();
    drawTypography();
  }

  function loadImage() {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'sync';
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight) {
          reject(new Error('The source image has no readable dimensions.'));
          return;
        }
        resolve(image);
      };
      image.onerror = () => reject(new Error(`Unable to load ${imageSource}`));
      image.src = imageSource;
    });
  }

  // Draw a proportionally cropped source image into a compact sampling canvas.
  function processImage() {
    const ratio = Math.min(state.sampleWidth / state.image.naturalWidth, state.sampleHeight / state.image.naturalHeight);
    const width = state.image.naturalWidth * ratio;
    const height = state.image.naturalHeight * ratio;
    const x = (state.sampleWidth - width) / 2;
    const y = (state.sampleHeight - height) / 2;
    sampleCtx.clearRect(0, 0, state.sampleWidth, state.sampleHeight);
    sampleCtx.drawImage(state.image, x, y, width, height);
    state.pixels = sampleCtx.getImageData(0, 0, state.sampleWidth, state.sampleHeight).data;
  }

  function resizeCanvas() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.cssWidth = window.innerWidth;
    state.cssHeight = window.innerHeight;
    canvas.width = Math.round(state.cssWidth * state.dpr);
    canvas.height = Math.round(state.cssHeight * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.textBaseline = 'middle';

    state.cell = Number(densityControl.value);
    state.sampleWidth = Math.ceil(state.cssWidth / state.cell);
    state.sampleHeight = Math.ceil(state.cssHeight / state.cell);
    sampleCanvas.width = state.sampleWidth;
    sampleCanvas.height = state.sampleHeight;
    if (state.image) processImage();
  }

  function drawTypography() {
    const { cssWidth: width, cssHeight: height, cell, sampleWidth, sampleHeight, pixels } = state;
    ctx.fillStyle = '#070509';
    ctx.fillRect(0, 0, width, height);
    if (!pixels) return;

    const fontSize = Math.max(7, cell * 0.88);
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const word = 'ANYA';
    const pointerGridX = state.pointerX * sampleWidth;
    const pointerGridY = state.pointerY * sampleHeight;

    for (let gy = 0; gy < sampleHeight; gy++) {
      const screenY = gy * cell + cell * 0.52;
      for (let gx = 0; gx < sampleWidth; gx++) {
        const pixelIndex = (gy * sampleWidth + gx) * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        const alpha = pixels[pixelIndex + 3] / 255;
        const brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
        if (alpha < 0.08 || brightness < 0.055) continue;

        const dx = gx - pointerGridX;
        const dy = gy - pointerGridY;
        const cursorLift = Math.max(0, 1 - Math.hypot(dx, dy) / 20);
        const opacity = Math.min(0.96, (0.17 + brightness * 0.76) * alpha + cursorLift * 0.19);
        const x = ((gx * cell + state.offset * (0.6 + brightness * 0.5)) % (width + cell * 4)) - cell * 3;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${state.glow * (0.13 + brightness * 0.45)})`;
        ctx.shadowBlur = state.glow * (3 + brightness * 10 + cursorLift * 12);
        ctx.fillText(word, x, screenY);
      }
    }
    ctx.shadowBlur = 0;
  }

  function animate(now) {
    const delta = Math.min(48, now - state.lastTime);
    state.lastTime = now;
    if (!state.reducedMotion) state.offset -= delta * state.speed * 0.025;
    const wrap = state.cssWidth + state.cell * 4;
    if (Math.abs(state.offset) > wrap) state.offset += wrap;
    drawTypography();
    requestAnimationFrame(animate);
  }

  function handlePointerMove(event) {
    state.pointerX = event.clientX / Math.max(1, state.cssWidth);
    state.pointerY = event.clientY / Math.max(1, state.cssHeight);
  }

  function handleResize() {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(resizeCanvas, 130);
  }

  settingsToggle.addEventListener('click', () => {
    const willOpen = settingsPanel.hidden;
    settingsPanel.hidden = !willOpen;
    settingsToggle.setAttribute('aria-expanded', String(willOpen));
  });
  speedControl.addEventListener('input', () => { state.speed = Number(speedControl.value); });
  glowControl.addEventListener('input', () => { state.glow = Number(glowControl.value); });
  densityControl.addEventListener('input', resizeCanvas);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });

  async function init() {
    try {
      loadingText.textContent = 'LOADING ANYA...';
      state.image = await loadImage();
      resizeCanvas();
      loader.classList.add('is-hidden');
      requestAnimationFrame(animate);
    } catch (error) {
      showError(error);
    }
  }

  init();
})();
