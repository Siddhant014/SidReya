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

/* ── HELPERS ── */
const driveThumb = id => `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
const driveImg   = id => `https://lh3.googleusercontent.com/d/${id}`;

function placeholder() {
  const d = document.createElement('div');
  d.className = 'img-placeholder';
  d.textContent = '📷';
  return d;
}

/* ── GET FUNCTION FROM URL ── */
const params = new URLSearchParams(window.location.search);
const fnId   = params.get('id');
const fn     = CONFIG.functions.find(f => f.id === fnId);

if (!fn) { window.location.href = 'index.html'; }

/* ── STATIC CONTENT ── */
document.getElementById('page-title').textContent  = `${fn.name} — Wedding`;
document.getElementById('fn-title').textContent    = `${fn.emoji} ${fn.name}`;
document.getElementById('footer-names').textContent =
  `${CONFIG.brideName} & ${CONFIG.groomName}`;
document.getElementById('footer-date').textContent = CONFIG.weddingDate;

/* ── VIDEO MODAL ── */
const videoModal = document.getElementById('video-modal');
const vmFrame    = document.getElementById('vm-frame');
document.getElementById('vm-close').addEventListener('click', closeVideo);
videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideo(); });

function openVideo(ytId) {
  vmFrame.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1"
    allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  videoModal.classList.add('open');
}
function closeVideo() {
  videoModal.classList.remove('open');
  vmFrame.innerHTML = '';
}

/* ── LIGHTBOX ── */
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lb-img');
const lbCounter = document.getElementById('lb-counter');
let lbPhotos = [], lbIndex = 0;

document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
document.getElementById('lb-next').addEventListener('click', () => showLb(lbIndex + 1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (lightbox.classList.contains('open')) {
    if (e.key === 'ArrowLeft')  showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    if (e.key === 'Escape')     closeLightbox();
  } else if (videoModal.classList.contains('open') && e.key === 'Escape') {
    closeVideo();
  }
});

let tsX = 0;
lightbox.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tsX;
  if (Math.abs(dx) > 50) showLb(dx < 0 ? lbIndex + 1 : lbIndex - 1);
});

function openLightbox(photos, index) {
  lbPhotos = photos; showLb(index);
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

/* ── FEATURED GRID ── */
const featuredGrid = document.getElementById('featured-grid');
const featuredUrls = [];

fn.featuredPhotoIds.forEach((id, i) => {
  if (!id || id.startsWith('DRIVE_FILE_ID')) return;
  const fullUrl = driveImg(id);
  featuredUrls.push(fullUrl);

  const item = document.createElement('div');
  item.className = 'grid-item';
  const img = document.createElement('img');
  img.src = driveThumb(id);
  img.alt = `${fn.name} ${i + 1}`;
  img.onerror = () => img.replaceWith(placeholder());
  item.appendChild(img);
  item.addEventListener('click', () => openLightbox(featuredUrls, featuredUrls.length - 1));
  featuredGrid.appendChild(item);
});

/* ── GOOGLE DRIVE API — FULL GRID ── */
let nextPageToken = null;
let isFetching    = false;
let allFetched    = false;
let gridPhotos    = [];

const photoGrid   = document.getElementById('photo-grid');
const gridLoader  = document.getElementById('grid-loader');
const gridError   = document.getElementById('grid-error');
const photoCount  = document.getElementById('photo-count');
const triggerWrap = document.getElementById('view-all-trigger');
const fullSection = document.getElementById('full-grid-section');

async function fetchPage() {
  if (isFetching || allFetched) return;
  if (!fn.driveFolderId || fn.driveFolderId === 'DRIVE_FOLDER_ID') return;

  isFetching = true;
  gridLoader.style.display = 'flex';
  gridError.style.display  = 'none';

  try {
    const p = new URLSearchParams({
      q: `'${fn.driveFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'nextPageToken, files(id,name)',
      pageSize: 30,
      key: CONFIG.googleApiKey,
      ...(nextPageToken && { pageToken: nextPageToken })
    });

    const res  = await fetch(`https://www.googleapis.com/drive/v3/files?${p}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    nextPageToken = data.nextPageToken || null;
    if (!nextPageToken) allFetched = true;

    (data.files || []).forEach(file => {
      const fullUrl = driveImg(file.id);
      gridPhotos.push(fullUrl);

      const item = document.createElement('div');
      item.className = 'grid-item';
      const img = document.createElement('img');
      img.src = driveThumb(file.id);
      img.alt = file.name;
      img.loading = 'lazy';
      img.onerror = () => img.replaceWith(placeholder());
      item.appendChild(img);
      item.addEventListener('click', () => openLightbox(gridPhotos, gridPhotos.length - 1));
      photoGrid.appendChild(item);
    });

    // Update count & show trigger after first fetch
    if (gridPhotos.length > 0) {
      photoCount.textContent = allFetched
        ? gridPhotos.length
        : `${gridPhotos.length}+`;
      triggerWrap.style.display = 'block';
    }

  } catch {
    gridError.style.display = 'block';
  } finally {
    isFetching = false;
    gridLoader.style.display = 'none';
  }
}

/* ── VIEW ALL BUTTON ── */
document.getElementById('view-all-btn').addEventListener('click', () => {
  fullSection.style.display = 'block';
  requestAnimationFrame(() => {
    fullSection.classList.add('visible');
    fullSection.scrollIntoView({ behavior: 'smooth' });
  });
  triggerWrap.style.display = 'none';
});

/* ── INFINITE SCROLL (lazy load more) ── */
const sentinel = document.createElement('div');
photoGrid.after(sentinel);

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) fetchPage();
}, { rootMargin: '200px' });

observer.observe(sentinel);

/* ── INIT: fetch first page for count ── */
fetchPage();
