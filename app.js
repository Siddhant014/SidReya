/* ── THEME ── */
const root = document.documentElement;
const toggleBtn = document.getElementById('theme-toggle');

function setTheme(t) {
  root.setAttribute('data-theme', t);
  toggleBtn.textContent = t === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('theme', t);
}

setTheme(localStorage.getItem('theme') || 'dark');
toggleBtn.addEventListener('click', () =>
  setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
);

/* ── POPULATE STATIC CONTENT ── */
document.getElementById('page-title').textContent =
  `${CONFIG.brideName} & ${CONFIG.groomName}`;

document.getElementById('hero-names').innerHTML =
  `${CONFIG.brideName} <span>&</span> ${CONFIG.groomName}`;

document.getElementById('hero-date').textContent = CONFIG.weddingDate;
document.getElementById('hero-tagline').textContent = CONFIG.tagline || '';
document.getElementById('footer-names').textContent =
  `${CONFIG.brideName} & ${CONFIG.groomName}`;
document.getElementById('footer-date').textContent = CONFIG.weddingDate;

/* ── HELPERS ── */
const driveThumb = id =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
const driveImg = id =>
  `https://lh3.googleusercontent.com/d/${id}`;
const ytThumb = id =>
  `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

function imgEl(src, alt = '', cls = '') {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  if (cls) img.className = cls;
  img.onerror = () => {
    img.replaceWith(placeholder());
  };
  return img;
}

function placeholder() {
  const d = document.createElement('div');
  d.className = 'img-placeholder';
  d.textContent = '📷';
  return d;
}

/* ── SCROLL BUTTONS ── */
document.addEventListener('click', e => {
  const btn = e.target.closest('.scroll-btn');
  if (!btn) return;
  const row = document.getElementById(btn.dataset.target);
  if (!row) return;
  const dir = btn.classList.contains('left') ? -1 : 1;
  row.scrollBy({ left: dir * 320, behavior: 'smooth' });
});

/* ── VIDEO MODAL ── */
const videoModal = document.getElementById('video-modal');
const vmFrame = document.getElementById('vm-frame');
document.getElementById('vm-close').addEventListener('click', closeVideo);
videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideo(); });

function openVideo(ytId) {
  vmFrame.innerHTML =
    `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1"
      allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  videoModal.classList.add('open');
}

function closeVideo() {
  videoModal.classList.remove('open');
  vmFrame.innerHTML = '';
}

/* ── LIGHTBOX ── */
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCounter = document.getElementById('lb-counter');
let lbPhotos = [], lbIndex = 0;

document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
document.getElementById('lb-next').addEventListener('click', () => showLb(lbIndex + 1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) {
    if (videoModal.classList.contains('open') && e.key === 'Escape') closeVideo();
    return;
  }
  if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
  if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  if (e.key === 'Escape') closeLightbox();
});

// Swipe support
let tsX = 0;
lightbox.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tsX;
  if (Math.abs(dx) > 50) showLb(dx < 0 ? lbIndex + 1 : lbIndex - 1);
});

function openLightbox(photos, index) {
  lbPhotos = photos;
  showLb(index);
  lightbox.classList.add('open');
}

function showLb(i) {
  lbIndex = (i + lbPhotos.length) % lbPhotos.length;
  lbImg.src = lbPhotos[lbIndex];
  lbCounter.textContent = `${lbIndex + 1} / ${lbPhotos.length}`;
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lbImg.src = '';
}

/* ── BUILD VIDEOS ROW ── */
function buildVideosRow() {
  const row = document.getElementById('videos-row');
  CONFIG.functions.forEach(fn => {
    if (!fn.youtubeVideoId || fn.youtubeVideoId === 'YOUTUBE_VIDEO_ID') return;
    const card = document.createElement('div');
    card.className = 'card video-card';
    card.innerHTML = `
      <img class="thumb" src="${ytThumb(fn.youtubeVideoId)}"
        alt="${fn.name}" onerror="this.style.background='var(--bg-secondary)'" />
      <div class="play-icon">▶</div>
      <div class="card-label">${fn.emoji} ${fn.name}</div>`;
    card.addEventListener('click', () => openVideo(fn.youtubeVideoId));
    row.appendChild(card);
  });

}

/* ── BUILD FUNCTION BLOCKS ── */
function buildFunctionBlocks() {
  const container = document.getElementById('functions-container');

  CONFIG.functions.forEach(fn => {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = `fn-${fn.id}`;

    // Header
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <h2 class="section-title">
        <span class="emoji">${fn.emoji}</span>${fn.name}
      </h2>
      <a href="function.html?id=${fn.id}" class="view-all-link">View All →</a>`;

    // Scroll row
    const wrap = document.createElement('div');
    wrap.className = 'scroll-row-wrap';
    const rowId = `row-${fn.id}`;
    wrap.innerHTML = `
      <button class="scroll-btn left" data-target="${rowId}">&#8249;</button>
      <div class="scroll-row" id="${rowId}"></div>
      <button class="scroll-btn right" data-target="${rowId}">&#8250;</button>`;

    section.appendChild(header);
    section.appendChild(wrap);
    container.appendChild(section);

    // Populate row
    const row = document.getElementById(rowId);
    const photos = []; // full-res URLs for lightbox

    // Video card first
    if (fn.youtubeVideoId && fn.youtubeVideoId !== 'YOUTUBE_VIDEO_ID') {
    const vc = document.createElement('div');
    vc.className = 'card video-card';
    vc.style.aspectRatio = '3/4';
    vc.innerHTML = `
      <img class="thumb" src="${ytThumb(fn.youtubeVideoId)}"
        alt="${fn.name} video"
        onerror="this.style.background='var(--bg-secondary)'" />
      <div class="play-icon">▶</div>
      <div class="card-label">▶ Play Video</div>`;
    vc.addEventListener('click', () => openVideo(fn.youtubeVideoId));
    row.appendChild(vc);
    }

    // Featured photo cards
    fn.featuredPhotoIds.forEach((id, i) => {
      if (!id || id.startsWith('DRIVE_FILE_ID')) return;
      const fullUrl = driveImg(id);
      photos.push(fullUrl);
      const pc = document.createElement('div');
      pc.className = 'card photo-card';
      const img = imgEl(driveThumb(id), `${fn.name} photo ${i + 1}`);
      pc.appendChild(img);
      pc.addEventListener('click', () => openLightbox(photos, photos.length - 1));
      row.appendChild(pc);
    });
  });
}

/* ── INIT ── */
buildVideosRow();
buildFunctionBlocks();
