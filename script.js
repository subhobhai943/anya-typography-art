(() => {
  'use strict';
  const experience = document.querySelector('.experience');
  const canvas = document.getElementById('portraitCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const image = document.getElementById('sourceImage');
  const sample = document.createElement('canvas');
  const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
  const loader = document.getElementById('loader');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const speedControl = document.getElementById('speedControl');
  const densityControl = document.getElementById('densityControl');
  const glowControl = document.getElementById('glowControl');
  const state = { pixels:null, w:0, h:0, vw:0, vh:0, cell:16, offset:0, speed:.35, glow:.45, px:.5, py:.5, reduced:matchMedia('(prefers-reduced-motion: reduce)').matches, last:performance.now(), timer:0, started:false };

  function sampleImage() {
    const ratio = Math.max(state.w / image.naturalWidth, state.h / image.naturalHeight);
    const iw = image.naturalWidth * ratio;
    const ih = image.naturalHeight * ratio;
    sampleCtx.clearRect(0, 0, state.w, state.h);
    sampleCtx.drawImage(image, (state.w - iw) / 2, (state.h - ih) / 2, iw, ih);
    state.pixels = sampleCtx.getImageData(0, 0, state.w, state.h).data;
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    state.vw = innerWidth; state.vh = innerHeight;
    canvas.width = Math.round(state.vw * dpr); canvas.height = Math.round(state.vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.textBaseline = 'middle';
    state.cell = Number(densityControl.value);
    state.w = Math.ceil(state.vw / state.cell); state.h = Math.ceil(state.vh / state.cell);
    sample.width = state.w; sample.height = state.h;
    if (image.naturalWidth) sampleImage();
  }

  function render() {
    ctx.clearRect(0, 0, state.vw, state.vh);
    if (!state.pixels) return;
    ctx.font = `700 ${Math.max(8, state.cell * .9)}px ui-monospace, monospace`;
    const mx = state.px * state.w, my = state.py * state.h;
    for (let y = 0; y < state.h; y++) {
      for (let x = 0; x < state.w; x++) {
        const p = (y * state.w + x) * 4;
        const r = state.pixels[p], g = state.pixels[p + 1], b = state.pixels[p + 2];
        const light = (r * .2126 + g * .7152 + b * .0722) / 255;
        if (light < .08) continue;
        const near = Math.max(0, 1 - Math.hypot(x - mx, y - my) / 18);
        const a = Math.min(.9, .18 + light * .56 + near * .18);
        const dx = ((x * state.cell + state.offset * (.55 + light * .5)) % (state.vw + state.cell * 4)) - state.cell * 3;
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.shadowColor = `rgba(${r},${g},${b},${state.glow * .3})`;
        ctx.shadowBlur = state.glow * (4 + near * 10);
        ctx.fillText('ANYA', dx, y * state.cell + state.cell * .52);
      }
    }
    ctx.shadowBlur = 0;
  }

  function frame(now) {
    const dt = Math.min(48, now - state.last); state.last = now;
    if (!state.reduced) state.offset -= dt * state.speed * .025;
    if (Math.abs(state.offset) > state.vw + state.cell * 4) state.offset = 0;
    render(); requestAnimationFrame(frame);
  }

  function start() {
    if (state.started || !image.naturalWidth) return;
    state.started = true;
    resize(); experience.classList.add('is-rendered'); loader.classList.add('is-hidden'); requestAnimationFrame(frame);
  }

  image.addEventListener('load', start, { once:true });
  if (image.complete) start();
  settingsToggle.addEventListener('click', () => { const open = settingsPanel.hidden; settingsPanel.hidden = !open; settingsToggle.setAttribute('aria-expanded', String(open)); });
  speedControl.addEventListener('input', () => state.speed = Number(speedControl.value));
  glowControl.addEventListener('input', () => state.glow = Number(glowControl.value));
  densityControl.addEventListener('input', () => { resize(); });
  addEventListener('pointermove', e => { state.px = e.clientX / Math.max(1, state.vw); state.py = e.clientY / Math.max(1, state.vh); }, { passive:true });
  addEventListener('resize', () => { clearTimeout(state.timer); state.timer = setTimeout(resize, 140); }, { passive:true });
})();
