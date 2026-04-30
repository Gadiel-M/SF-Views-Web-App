"use strict";
const BASE_ID = 'appuzIP4S09O1J427';
const API_KEY = 'pat8YgpxMOutcFbk8.8cde4fdfb5d2445441fc11c0b50910415ec2aa0c810811fdfa930bdd892fd70a';
const TABLE   = 'SF';

const MAPS_KEY = 'AIzaSyC4MKsKYpbewxQh0AmlP-E5y4-yHMgcK3o';

const F = {
  name:         'Name',
  parking:      'Parking Availability / Accessibility',
  website:      'Website',
  hours:        'Hours of Access',
  neighborhood: 'Neighborhood',
  category:     'Category',
  image:        'Images',
  location:     'Location',
  reviews:      'Reviews',
};

// state
let allRecords    = [];
let currentFilter = 'all';
let currentSort   = 'default';
let likes = JSON.parse(localStorage.getItem('sfviews-likes') || '{}');

// airtable fetching
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

// building card from record
function buildCard(record, index) {
  const f   = record.fields;
  const id  = record.id;

  const name   = f[F.name]         || '---';
  const hood   = f[F.neighborhood] || '---';
  const cat    = (f[F.category]    || 'Spot').toLowerCase();
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

// card rendering with sorting and filtering
function renderCards() {
  let records = [...allRecords];
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

  initHolo();
}

// holo mousemove effect
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

// like stored locally
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

// modal
function openModal(id) {
  const record = allRecords.find(r => r.id === id);
  if (!record) return;
  const f      = record.fields;
  const imgs   = f[F.image];
  const imgUrl = (imgs && imgs[0]) ? imgs[0].url : '';

  document.getElementById('modal-badge').textContent    = f[F.website]      || '---';
  document.getElementById('modal-title').textContent    = f[F.name]         || '---';
  document.getElementById('modal-subtitle').textContent = f[F.neighborhood] || '---';
  document.getElementById('modal-parking').textContent     = f[F.parking]  || '---';
  document.getElementById('modal-hours').textContent     = f[F.hours]     || '---';
  document.getElementById('modal-reviews').textContent     = f[F.reviews]     || '---';
  document.getElementById('modal-likes').textContent    = likes[id]?.count  || 0;
  document.getElementById('modal-photo').style.backgroundImage =
    imgUrl ? `url('${imgUrl}')` : 'none';

    const siteLink   = document.getElementById('modal-site-link');
  const websiteUrl = f[F.website] || '';
 
  if (websiteUrl) {
    siteLink.href           = websiteUrl;
    siteLink.style.display  = 'flex';
  } else {
    siteLink.style.display  = 'none';
  }
  
    const mapQuery = encodeURIComponent(
    f[F.location] || `${f[F.name] || 'San Francisco'}, San Francisco, CA`
  );
  const mapFrame = document.getElementById('modal-map');

  if (MAPS_KEY && MAPS_KEY !== 'AIzaSyC4MKsKYpbewxQh0AmlP-E5y4-yHMgcK3o') {
// Paid Embed API
    mapFrame.src = `https://www.google.com/maps/embed/v1/view?key=${MAPS_KEY}&q=${mapQuery}&zoom=15&maptype=roadmap`;
  } else {
// Free fallback
    mapFrame.src = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  document.getElementById('detail-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('detail-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// close on click
function handleModalClick(e) {
  if (e.target === document.getElementById('detail-modal')) closeModal();
}

// close on escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* sort */
document.getElementById('sort-select').addEventListener('change', e => {
  currentSort = e.target.value;
  renderCards();
});

fetchViews();
