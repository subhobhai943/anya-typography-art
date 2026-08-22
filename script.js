(() => {
  'use strict';

  const canvas  = document.getElementById('portraitCanvas');
  const ctx     = canvas.getContext('2d', { alpha: false });
  const image   = document.getElementById('sourceImage');
  const sample  = document.createElement('canvas');
  const sCtx    = sample.getContext('2d', { willReadFrequently: true });
  const loader  = document.getElementById('loader');
  const errBox  = document.getElementById('errorMessage');
  const errTxt  = document.getElementById('errorDetail');
  const toggle  = document.getElementById('settingsToggle');
  const panel   = document.getElementById('settingsPanel');
  const speedEl = document.getElementById('speedControl');
  const densEl  = document.getElementById('densityControl');
  const glowEl  = document.getElementById('glowControl');

  let pixels = null, sw = 0, sh = 0;
  let vw = 0, vh = 0, cell = 12;
  let offset = 0, speed = 0.35, glow = 0.5;
  let px = 0.5, py = 0.5;
  let reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let last = performance.now(), raf = 0;

  function fail(msg) {
    cancelAnimationFrame(raf);
    loader.classList.add('is-hidden');
    errTxt.textContent = msg;
    errBox.hidden = false;
  }

  function sampleImage() {
    if (!image.naturalWidth) return;
    const ratio = Math.max(sw / image.naturalWidth, sh / image.naturalHeight);
    const iw = image.naturalWidth  * ratio;
    const ih = image.naturalHeight * ratio;
    sCtx.clearRect(0, 0, sw, sh);
    sCtx.drawImage(image, (sw - iw) / 2, (sh - ih) / 2, iw, ih);
    try {
      pixels = sCtx.getImageData(0, 0, sw, sh).data;
    } catch(e) {
      fail('Canvas security error reading image pixels: ' + e.message);
    }
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth; vh = innerHeight;
    canvas.width  = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = 'middle';
    cell = Number(densEl.value);
    sw = Math.ceil(vw / cell);
    sh = Math.ceil(vh / cell);
    sample.width = sw; sample.height = sh;
    sampleImage();
  }

  function draw() {
    // solid dark background — critical for portrait silhouette contrast
    ctx.fillStyle = '#070509';
    ctx.fillRect(0, 0, vw, vh);
    if (!pixels) return;

    const fontSize = Math.max(7, cell * 0.9);
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const mx = px * sw, my = py * sh;

    for (let gy = 0; gy < sh; gy++) {
      const sy = gy * cell + cell * 0.5;
      for (let gx = 0; gx < sw; gx++) {
        const i = (gy * sw + gx) * 4;
        const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
        const lum = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;

        // HIGH threshold — only draw where the image is clearly bright
        // This is what creates the portrait silhouette against the dark bg
        if (lum < 0.22) continue;

        const near   = Math.max(0, 1 - Math.hypot(gx - mx, gy - my) / 18);
        const alpha  = Math.min(0.95, 0.25 + lum * 0.65 + near * 0.2);
        const sx     = ((gx * cell + offset * (0.5 + lum * 0.6)) % (vw + cell * 4)) - cell * 3;

        ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;
        ctx.shadowColor = `rgba(${r},${g},${b},${glow * (0.15 + lum * 0.5)})`;
        ctx.shadowBlur  = glow * (4 + lum * 12 + near * 14);
        ctx.fillText('ANYA', sx, sy);
      }
    }
    ctx.shadowBlur = 0;
  }

  function frame(now) {
    const dt = Math.min(48, now - last); last = now;
    if (!reduced) { offset -= dt * speed * 0.025; }
    if (Math.abs(offset) > vw + cell * 4) offset = 0;
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!image.naturalWidth) { fail('Image loaded but has zero dimensions.'); return; }
    resize();
    if (!pixels) return; // fail() already called inside sampleImage
    loader.classList.add('is-hidden');
    raf = requestAnimationFrame(frame);
  }

  image.addEventListener('load',  () => start(), { once: true });
  image.addEventListener('error', () => fail('Could not load ./assets/anya.jpg — check the file exists in the repository.'), { once: true });
  if (image.complete && image.naturalWidth) start();

  toggle.addEventListener('click', () => {
    const open = panel.hidden; panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
  speedEl.addEventListener('input', () => speed = Number(speedEl.value));
  glowEl .addEventListener('input', () => glow  = Number(glowEl.value));
  densEl .addEventListener('input', () => resize());
  addEventListener('pointermove', e => { px = e.clientX / Math.max(1,vw); py = e.clientY / Math.max(1,vh); }, { passive:true });
  let resizeTimer = 0;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 140); }, { passive:true });
})();
