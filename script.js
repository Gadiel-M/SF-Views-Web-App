"use strict";

/* ══════════════════════════════════════════════════
   SF VIEWS — script.js

   AIRTABLE CONFIG
   ─ BASE_ID and API_KEY are from your class directory.
   ─ Change TABLE to your SF Views table name.
   ─ Update the F{} field names to match your
     Airtable column headers exactly.
══════════════════════════════════════════════════ */
const BASE_ID = 'app3knV6H85zkGHHn';
const API_KEY = 'patUNR9zih8lRzsj6.9746de26cc7d3ddf1ca83d7766c8a76ccc9b09c61954e51f26dcb18bb946ad4a';
const TABLE   = 'Views'; // ← update to your SF Views table name

/* Field name map — update values to match your Airtable column headers */
const F = {
  name:         'Name',
  description:  'Description',
  neighborhood: 'Neighborhood',
  category:     'Category',  // e.g. "Overlook", "Waterfront", "Park", "Hidden Gem"
  image:        'Image',     // Attachment field
  bestTime:     'Best Time', // e.g. "Sunset", "Golden Hour", "Anytime"
};

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
let allRecords    = [];
let currentFilter = 'all';
let currentSort   = 'default';
let likes = JSON.parse(localStorage.getItem('sfviews-likes') || '{}');

/* ══════════════════════════════════════════════════
   FETCH FROM AIRTABLE
══════════════════════════════════════════════════ */
async function fetchViews() {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
  try {
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    allRecords = data.records || [];
    renderCards();
  } catch (err) {
    document.getElementById('card-grid').innerHTML =
      `<div class="loading-msg" style="color:#ff8080;">
        ⚠️ Could not load Airtable data.<br>
        <small style="opacity:.7;">Check TABLE name and field names in script.js config.<br>
        Error: ${err.message}</small>
       </div>`;
    console.error('Airtable error:', err);
  }
}

/* ══════════════════════════════════════════════════
   BUILD A SINGLE CARD
══════════════════════════════════════════════════ */
function buildCard(record, index) {
  const f   = record.fields;
  const id  = record.id;

  const name   = f[F.name]         || 'Unnamed Spot';
  const hood   = f[F.neighborhood] || '';
  const cat    = (f[F.category]    || 'View').toLowerCase();
  const imgs   = f[F.image];
  const imgUrl = (imgs && imgs[0])
    ? imgs[0].url
    : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70';

  const likeCount = likes[id]?.count || 0;
  const isLiked   = likes[id]?.liked || false;

  return `
    <div class="view-card"
         style="--bg-img:url('${imgUrl}'); animation-delay:${index * 0.06}s;"
         data-id="${id}" data-category="${cat}" data-name="${name}" data-likes="${likeCount}"
         onclick="openModal('${id}')">

      <div class="card-overlay"></div>
      <div class="card-category">${cat}</div>

      <button class="card-like ${isLiked ? 'liked' : ''}"
              onclick="toggleLike(event,'${id}')">
        ${isLiked ? '❤️' : '🤍'}
        <span id="lc-${id}">${likeCount}</span>
      </button>

      <div class="card-glass-footer">
        <div class="card-name">${name}</div>
        <div class="card-neighborhood">${hood}</div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════
   RENDER CARDS (applies current filter + sort)
══════════════════════════════════════════════════ */
function renderCards() {
  let records = [...allRecords];

  // Filter
  if (currentFilter !== 'all') {
    records = records.filter(r =>
      (r.fields[F.category] || '').toLowerCase() === currentFilter
    );
  }

  // Sort
  if (currentSort === 'liked') {
    records.sort((a, b) => (likes[b.id]?.count || 0) - (likes[a.id]?.count || 0));
  } else if (currentSort === 'az') {
    records.sort((a, b) =>
      (a.fields[F.name] || '').localeCompare(b.fields[F.name] || ''));
  }

  const grid = document.getElementById('card-grid');
  grid.innerHTML = records.length
    ? records.map((r, i) => buildCard(r, i)).join('')
    : `<div class="loading-msg">No spots found for this filter.</div>`;

  initHolo(); // re-bind holo effect after DOM update
}

/* ══════════════════════════════════════════════════
   HOLOGRAPHIC MOUSE EFFECT
   Ported from Cohort #34 class directory script.js
══════════════════════════════════════════════════ */
function initHolo() {
  const grid = document.getElementById('card-grid');

  // Use a named handler so we can remove the old one before adding a new one,
  // preventing duplicate listeners after each renderCards() call.
  grid.removeEventListener('mousemove', onGridMouseMove);
  grid.removeEventListener('mouseleave', onGridMouseLeave);
  grid.addEventListener('mousemove', onGridMouseMove);
  grid.addEventListener('mouseleave', onGridMouseLeave);
}

function onGridMouseMove(e) {
  const card = e.target.closest('.view-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const lp   = 50 + ((e.clientX - rect.left) / rect.width  - 0.5) * 66;
  const tp   = 50 + ((e.clientY - rect.top)  / rect.height - 0.5) * 66;
  const ty   = ((tp - 50) / 2) * -0.4;
  const tx   = ((lp - 50) / 2) *  0.4;
  const opc  = 0.15 + Math.abs((lp - 50) + (tp - 50)) * 0.0025;
  card.style.setProperty('--ty',  `${ty}deg`);
  card.style.setProperty('--tx',  `${tx}deg`);
  card.style.setProperty('--lp',  `${lp}%`);
  card.style.setProperty('--tp',  `${tp}%`);
  card.style.setProperty('--opc', opc);
}

function onGridMouseLeave() {
  document.querySelectorAll('.view-card').forEach(card => {
    card.style.setProperty('--ty',  '0deg');
    card.style.setProperty('--tx',  '0deg');
    card.style.setProperty('--opc', '0');
  });
}

/* ══════════════════════════════════════════════════
   LIKE / UNLIKE
   Persisted in localStorage so likes survive page refresh
══════════════════════════════════════════════════ */
function toggleLike(event, id) {
  event.stopPropagation(); // prevent card click → modal
  if (!likes[id]) likes[id] = { liked: false, count: 0 };
  likes[id].liked   = !likes[id].liked;
  likes[id].count  += likes[id].liked ? 1 : -1;
  if (likes[id].count < 0) likes[id].count = 0;
  localStorage.setItem('sfviews-likes', JSON.stringify(likes));

  // Update button without re-rendering the whole grid
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.dataset.likes = likes[id].count;
    const btn = card.querySelector('.card-like');
    btn.classList.toggle('liked', likes[id].liked);
    btn.innerHTML = `${likes[id].liked ? '❤️' : '🤍'} <span id="lc-${id}">${likes[id].count}</span>`;
  }
}

/* ══════════════════════════════════════════════════
   MODAL — open / close
══════════════════════════════════════════════════ */
function openModal(id) {
  const record = allRecords.find(r => r.id === id);
  if (!record) return;
  const f      = record.fields;
  const imgs   = f[F.image];
  const imgUrl = (imgs && imgs[0]) ? imgs[0].url : '';

  document.getElementById('modal-title').textContent    = f[F.name]         || '—';
  document.getElementById('modal-subtitle').textContent = f[F.neighborhood] || '—';
  document.getElementById('modal-badge').textContent    = f[F.category]     || 'View';
  document.getElementById('modal-desc').textContent     = f[F.description]  || '—';
  document.getElementById('modal-time').textContent     = f[F.bestTime]     || '—';
  document.getElementById('modal-likes').textContent    = likes[id]?.count  || 0;
  document.getElementById('modal-photo').style.backgroundImage =
    imgUrl ? `url('${imgUrl}')` : 'none';

  document.getElementById('detail-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('detail-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// Close on backdrop click
function handleModalClick(e) {
  if (e.target === document.getElementById('detail-modal')) closeModal();
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ══════════════════════════════════════════════════
   FILTER BUTTONS
══════════════════════════════════════════════════ */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderCards();
  });
});

/* ══════════════════════════════════════════════════
   SORT SELECT
══════════════════════════════════════════════════ */
document.getElementById('sort-select').addEventListener('change', e => {
  currentSort = e.target.value;
  renderCards();
});

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
fetchViews();
