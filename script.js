(() => {
  'use strict';

  const experience = document.querySelector('.experience');
  const canvas = document.getElementById('portraitCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const sourceImage = document.getElementById('sourceImage');
  const sampleCanvas = document.createElement('canvas');
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const loader = document.getElementById('loader');
  const loadingText = document.getElementById('loadingText');
  const errorMessage = document.getElementById('errorMessage');
  const errorDetail = document.getElementById('errorDetail');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const speedControl = document.getElementById('speedControl');
  const densityControl = document.getElementById('densityControl');
  const glowControl = document.getElementById('glowControl');

  const state = { pixels: null, sampleWidth: 0, sampleHeight: 0, cssWidth: 0, cssHeight: 0, dpr: 1, cell: 12, offset: 0, speed: .35, glow: .45, pointerX: .5, pointerY: .5, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, lastTime: performance.now(), resizeTimer: 0 };

  function showError(error) {
    console.error('ANYA portrait error:', error);
    errorDetail.textContent = error && error.message ? error.message : 'The artwork could not process the source image.';
    loader.classList.add('is-hidden');
    errorMessage.hidden = false;
  }

  function processImage() {
    const ratio = Math.max(state.sampleWidth / sourceImage.naturalWidth, state.sampleHeight / sourceImage.naturalHeight);
    const drawWidth = sourceImage.naturalWidth * ratio;
    const drawHeight = sourceImage.naturalHeight * ratio;
    sampleCtx.clearRect(0, 0, state.sampleWidth, state.sampleHeight);
    sampleCtx.drawImage(sourceImage, (state.sampleWidth - drawWidth) / 2, (state.sampleHeight - drawHeight) / 2, drawWidth, drawHeight);
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
    if (sourceImage.complete && sourceImage.naturalWidth) processImage();
  }

  function drawTypography() {
    ctx.fillStyle = '#070509';
    ctx.fillRect(0, 0, state.cssWidth, state.cssHeight);
    if (!state.pixels) return;
    ctx.font = `700 ${Math.max(7, state.cell * .88)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const px = state.pointerX * state.sampleWidth;
    const py = state.pointerY * state.sampleHeight;

    for (let gy = 0; gy < state.sampleHeight; gy++) {
      const y = gy * state.cell + state.cell * .52;
      for (let gx = 0; gx < state.sampleWidth; gx++) {
        const i = (gy * state.sampleWidth + gx) * 4;
        const r = state.pixels[i];
        const g = state.pixels[i + 1];
        const b = state.pixels[i + 2];
        const alpha = state.pixels[i + 3] / 255;
        const brightness = (r * .2126 + g * .7152 + b * .0722) / 255;
        if (alpha < .08 || brightness < .055) continue;
        const boost = Math.max(0, 1 - Math.hypot(gx - px, gy - py) / 20);
        const opacity = Math.min(.96, (.17 + brightness * .76) * alpha + boost * .19);
        const x = ((gx * state.cell + state.offset * (.6 + brightness * .5)) % (state.cssWidth + state.cell * 4)) - state.cell * 3;
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
        ctx.shadowColor = `rgba(${r},${g},${b},${state.glow * (.13 + brightness * .45)})`;
        ctx.shadowBlur = state.glow * (3 + brightness * 10 + boost * 12);
        ctx.fillText('ANYA', x, y);
      }
    }
    ctx.shadowBlur = 0;
  }

  function animate(now) {
    const delta = Math.min(48, now - state.lastTime);
    state.lastTime = now;
    if (!state.reducedMotion) state.offset -= delta * state.speed * .025;
    if (Math.abs(state.offset) > state.cssWidth + state.cell * 4) state.offset = 0;
    drawTypography();
    requestAnimationFrame(animate);
  }

  function start() {
    try {
      resizeCanvas();
      if (!state.pixels) throw new Error('The loaded image has no readable pixel data.');
      experience.classList.add('is-rendered');
      loader.classList.add('is-hidden');
      requestAnimationFrame(animate);
    } catch (error) { showError(error); }
  }

  sourceImage.addEventListener('load', start, { once: true });
  sourceImage.addEventListener('error', () => showError(new Error('Could not load ./assets/anya.jpg.')), { once: true });
  if (sourceImage.complete) { if (sourceImage.naturalWidth) start(); else showError(new Error('Could not load ./assets/anya.jpg.')); }

  settingsToggle.addEventListener('click', () => { const open = settingsPanel.hidden; settingsPanel.hidden = !open; settingsToggle.setAttribute('aria-expanded', String(open)); });
  speedControl.addEventListener('input', () => { state.speed = Number(speedControl.value); });
  glowControl.addEventListener('input', () => { state.glow = Number(glowControl.value); });
  densityControl.addEventListener('input', resizeCanvas);
  window.addEventListener('pointermove', event => { state.pointerX = event.clientX / Math.max(1, state.cssWidth); state.pointerY = event.clientY / Math.max(1, state.cssHeight); }, { passive: true });
  window.addEventListener('resize', () => { clearTimeout(state.resizeTimer); state.resizeTimer = setTimeout(resizeCanvas, 130); }, { passive: true });
})();
