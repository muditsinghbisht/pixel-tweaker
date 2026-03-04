const uploadZone = document.getElementById('uploadZone');
const dropBox = document.getElementById('dropBox');
const fileInput = document.getElementById('fileInput');
const mainCanvas = document.getElementById('mainCanvas');
const sourceCanvas = document.getElementById('sourceCanvas');
const tempCanvas = document.getElementById('tempCanvas');
const ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
const sCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

let originalImageData = null;
let currentScale = 1;
let activeFilters = new Set();
let rotation = 0;
let flipH = false, flipV = false;
let rafId = null;

// Upload handlers
dropBox.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => loadFile(e.target.files[0]));

dropBox.addEventListener('dragover', e => { e.preventDefault(); dropBox.classList.add('dragover'); });
dropBox.addEventListener('dragleave', () => dropBox.classList.remove('dragover'));
dropBox.addEventListener('drop', e => {
  e.preventDefault();
  dropBox.classList.remove('dragover');
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});

function loadFile(file) {
  if (!file?.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    sourceCanvas.width = img.naturalWidth;
    sourceCanvas.height = img.naturalHeight;
    sCtx.drawImage(img, 0, 0);
    originalImageData = sCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);

    mainCanvas.width = img.naturalWidth;
    mainCanvas.height = img.naturalHeight;
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;

    URL.revokeObjectURL(url);
    uploadZone.classList.add('hidden');
    fitToScreen();
    applyAll();
  };
  img.src = url;
}

function fitToScreen() {
  const wrap = mainCanvas.parentElement;
  const mw = wrap.clientWidth - 80;
  const mh = wrap.clientHeight - 80;
  const sw = mainCanvas.width / mw;
  const sh = mainCanvas.height / mh;
  const s = Math.max(sw, sh);
  currentScale = s > 1 ? 1 / s : 1;
  applyScale();
}

function applyScale() {
  mainCanvas.style.width = (mainCanvas.width * currentScale) + 'px';
  mainCanvas.style.height = (mainCanvas.height * currentScale) + 'px';
}

function zoom(delta) {
  currentScale = Math.min(8, Math.max(0.05, currentScale + delta));
  applyScale();
}

function resetZoom() { fitToScreen(); }

// Sliders
const controls = ['brightness','contrast','saturation','exposure','gamma','red','green','blue'];
controls.forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    const valEl = document.getElementById(id + 'Val');
    valEl.textContent = id === 'gamma' ? (el.value / 100).toFixed(1) : el.value;
    scheduleApply();
  });
});

function scheduleApply() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(applyAll);
}

function toggleFilter(name) {
  if (activeFilters.has(name)) activeFilters.delete(name);
  else activeFilters.add(name);
  document.getElementById('btn' + name.charAt(0).toUpperCase() + name.slice(1)).classList.toggle('active', activeFilters.has(name));
  scheduleApply();
}

function clamp(v) { return Math.max(0, Math.min(255, v)); }

function applyAll() {
  if (!originalImageData) return;

  const src = originalImageData;
  const w = src.width, h = src.height;
  const out = new ImageData(w, h);
  const d = src.data, o = out.data;

  const brightness = +document.getElementById('brightness').value;
  const contrast   = +document.getElementById('contrast').value;
  const saturation = +document.getElementById('saturation').value / 100;
  const exposure   = +document.getElementById('exposure').value / 100;
  const gamma      = document.getElementById('gamma').value / 100;
  const rShift     = +document.getElementById('red').value;
  const gShift     = +document.getElementById('green').value;
  const bShift     = +document.getElementById('blue').value;

  const contrastF = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];

    // Exposure (multiply)
    if (exposure !== 0) {
      const ef = Math.pow(2, exposure);
      r = clamp(r * ef); g = clamp(g * ef); b = clamp(b * ef);
    }

    // Brightness
    r = clamp(r + brightness); g = clamp(g + brightness); b = clamp(b + brightness);

    // Contrast
    r = clamp(contrastF * (r - 128) + 128);
    g = clamp(contrastF * (g - 128) + 128);
    b = clamp(contrastF * (b - 128) + 128);

    // Saturation (via luminance)
    const lum = 0.299*r + 0.587*g + 0.114*b;
    r = clamp(lum + (r - lum) * (1 + saturation));
    g = clamp(lum + (g - lum) * (1 + saturation));
    b = clamp(lum + (b - lum) * (1 + saturation));

    // RGB channel shift
    r = clamp(r + rShift); g = clamp(g + gShift); b = clamp(b + bShift);

    // Gamma
    if (gamma !== 1) {
      r = clamp(Math.pow(r/255, 1/gamma) * 255);
      g = clamp(Math.pow(g/255, 1/gamma) * 255);
      b = clamp(Math.pow(b/255, 1/gamma) * 255);
    }

    // Filters
    if (activeFilters.has('grayscale')) {
      const gray = 0.299*r + 0.587*g + 0.114*b;
      r = g = b = gray;
    }
    if (activeFilters.has('sepia')) {
      const or=r,og=g,ob=b;
      r = clamp(or*0.393 + og*0.769 + ob*0.189);
      g = clamp(or*0.349 + og*0.686 + ob*0.168);
      b = clamp(or*0.272 + og*0.534 + ob*0.131);
    }
    if (activeFilters.has('invert')) {
      r = 255 - r; g = 255 - g; b = 255 - b;
    }
    if (activeFilters.has('posterize')) {
      const levels = 4;
      r = Math.round(r / (255/levels)) * (255/levels);
      g = Math.round(g / (255/levels)) * (255/levels);
      b = Math.round(b / (255/levels)) * (255/levels);
    }

    o[i] = r; o[i+1] = g; o[i+2] = b; o[i+3] = a;
  }

  // Pixelate filter (block-based)
  if (activeFilters.has('pixelate')) {
    const block = 8;
    for (let y = 0; y < h; y += block) {
      for (let x = 0; x < w; x += block) {
        let sr=0,sg=0,sb=0,count=0;
        for (let py=0; py<block && y+py<h; py++) for (let px=0; px<block && x+px<w; px++) {
          const idx=((y+py)*w+(x+px))*4;
          sr+=o[idx]; sg+=o[idx+1]; sb+=o[idx+2]; count++;
        }
        sr=sr/count|0; sg=sg/count|0; sb=sb/count|0;
        for (let py=0; py<block && y+py<h; py++) for (let px=0; px<block && x+px<w; px++) {
          const idx=((y+py)*w+(x+px))*4;
          o[idx]=sr; o[idx+1]=sg; o[idx+2]=sb;
        }
      }
    }
  }

  ctx.putImageData(out, 0, 0);

  // Vignette overlay
  if (activeFilters.has('vignette')) {
    const grad = ctx.createRadialGradient(w/2, h/2, h*0.25, w/2, h/2, h*0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

// Pixel inspector
mainCanvas.addEventListener('mousemove', e => {
  if (!originalImageData) return;
  const rect = mainCanvas.getBoundingClientRect();
  const px = Math.floor((e.clientX - rect.left) / currentScale);
  const py = Math.floor((e.clientY - rect.top) / currentScale);
  const w = mainCanvas.width, h = mainCanvas.height;
  if (px < 0 || py < 0 || px >= w || py >= h) return;

  document.getElementById('coords').textContent = `x: ${px}  y: ${py}`;

  const pixel = ctx.getImageData(px, py, 1, 1).data;
  const [r,g,b,a] = pixel;
  const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  document.getElementById('swatch').style.background = `rgb(${r},${g},${b})`;
  document.getElementById('pixelData').innerHTML =
    `<span>X</span> ${px}  <span>Y</span> ${py}<br>` +
    `<span>R</span> ${r}  <span>G</span> ${g}  <span>B</span> ${b}<br>` +
    `<span>A</span> ${a}  <span>α</span> ${(a/255).toFixed(2)}<br>` +
    `<span>HEX</span> ${hex}<br>` +
    `<span>HSL</span> ${rgbToHsl(r,g,b)}`;
});

function rgbToHsl(r,g,b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if (max===min) { h=s=0; }
  else {
    const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){ case r:h=(g-b)/d+(g<b?6:0);break; case g:h=(b-r)/d+2;break; case b:h=(r-g)/d+4;break; }
    h/=6;
  }
  return `${Math.round(h*360)}° ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}

function rotateImage(deg) {
  if (!originalImageData) return;
  rotation = (rotation + deg + 360) % 360;
  const tmp = new OffscreenCanvas(originalImageData.width, originalImageData.height);
  const tc = tmp.getContext('2d');
  tc.putImageData(originalImageData, 0, 0);
  const [ow, oh] = [originalImageData.width, originalImageData.height];
  const [nw, nh] = deg % 180 !== 0 ? [oh, ow] : [ow, oh];
  const nc = new OffscreenCanvas(nw, nh);
  const nc2 = nc.getContext('2d');
  nc2.translate(nw/2, nh/2);
  nc2.rotate(deg * Math.PI/180);
  nc2.drawImage(tmp, -ow/2, -oh/2);
  const newData = nc2.getImageData(0, 0, nw, nh);
  originalImageData = newData;
  sourceCanvas.width = mainCanvas.width = tempCanvas.width = nw;
  sourceCanvas.height = mainCanvas.height = tempCanvas.height = nh;
  fitToScreen();
  applyAll();
}

function flipImage(dir) {
  if (!originalImageData) return;
  const w = originalImageData.width, h = originalImageData.height;
  const tmp = new OffscreenCanvas(w, h);
  const tc = tmp.getContext('2d');
  tc.putImageData(originalImageData, 0, 0);
  const nc = new OffscreenCanvas(w, h);
  const nc2 = nc.getContext('2d');
  if (dir === 'h') { nc2.scale(-1,1); nc2.drawImage(tmp, -w, 0); }
  else { nc2.scale(1,-1); nc2.drawImage(tmp, 0, -h); }
  originalImageData = nc2.getImageData(0, 0, w, h);
  applyAll();
}

function resetAll() {
  controls.forEach(id => {
    const el = document.getElementById(id);
    el.value = id === 'gamma' ? 100 : 0;
    const valEl = document.getElementById(id + 'Val');
    valEl.textContent = id === 'gamma' ? '1.0' : '0';
  });
  activeFilters.clear();
  ['grayscale','sepia','invert','posterize','pixelate','vignette'].forEach(f => {
    document.getElementById('btn' + f.charAt(0).toUpperCase() + f.slice(1)).classList.remove('active');
  });
  applyAll();
}

function downloadImage() {
  if (!originalImageData) return;
  const link = document.createElement('a');
  link.download = 'pixl-export.png';
  link.href = mainCanvas.toDataURL('image/png');
  link.click();
}
