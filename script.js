    "use strict";

    /* ══════════════════════════════════════════════════
       AIRTABLE CONFIG
       ─ BASE_ID and API_KEY pulled from your class
         directory script.js (same base, same token).
       ─ Change TABLE to the name of your SF Views table.
       ─ Update F{} field names to match your column headers.
    ══════════════════════════════════════════════════ */
    const BASE_ID = 'tbly2pqDVtjTJ6Bt2';
    const API_KEY = 'pat8YgpxMOutcFbk8.8cde4fdfb5d2445441fc11c0b50910415ec2aa0c810811fdfa930bdd892fd70a';
    const TABLE   = 'SF';   // ← change to your SF Views table name

    /* Field name map — change values to match your Airtable column headers */
    const F = {
      name:         'Name',
      description:  'Description',
      neighborhood: 'Neighborhood',
      category:     'Category',   // e.g. "Overlook", "Waterfront", "Park", "Hidden Gem"
      image:        'Image',      // Attachment field
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
            <small style="opacity:.7;">Check TABLE name and field names in the script config.<br>
            Error: ${err.message}</small>
           </div>`;
        console.error('Airtable error:', err);
      }
    }

    /* ══════════════════════════════════════════════════
       BUILD A CARD
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
        : `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70`;

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
       RENDER (filter + sort)
    ══════════════════════════════════════════════════ */
    function renderCards() {
      let records = [...allRecords];

      if (currentFilter !== 'all') {
        records = records.filter(r =>
          (r.fields[F.category] || '').toLowerCase() === currentFilter
        );
      }

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

    /* ══════════════════════════════════════════════════
       HOLOGRAPHIC MOUSE EFFECT
       Ported directly from class directory script.js
    ══════════════════════════════════════════════════ */
    function initHolo() {
      const grid = document.getElementById('card-grid');

      grid.addEventListener('mousemove', (e) => {
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
      });

      grid.addEventListener('mouseleave', () => {
        document.querySelectorAll('.view-card').forEach(card => {
          card.style.setProperty('--ty',  '0deg');
          card.style.setProperty('--tx',  '0deg');
          card.style.setProperty('--opc', '0');
        });
      });
    }

    /* ══════════════════════════════════════════════════
       LIKE / UNLIKE
    ══════════════════════════════════════════════════ */
    function toggleLike(event, id) {
      event.stopPropagation();
      if (!likes[id]) likes[id] = { liked: false, count: 0 };
      likes[id].liked   = !likes[id].liked;
      likes[id].count  += likes[id].liked ? 1 : -1;
      if (likes[id].count < 0) likes[id].count = 0;
      localStorage.setItem('sfviews-likes', JSON.stringify(likes));

      const card = document.querySelector(`[data-id="${id}"]`);
      if (card) {
        card.dataset.likes = likes[id].count;
        const btn = card.querySelector('.card-like');
        btn.classList.toggle('liked', likes[id].liked);
        btn.innerHTML = `${likes[id].liked ? '❤️' : '🤍'} <span id="lc-${id}">${likes[id].count}</span>`;
      }
    }

    /* ══════════════════════════════════════════════════
       MODAL
    ══════════════════════════════════════════════════ */
    function openModal(id) {
      const record = allRecords.find(r => r.id === id);
      if (!record) return;
      const f    = record.fields;
      const imgs = f[F.image];
      const imgUrl = (imgs && imgs[0]) ? imgs[0].url : '';

      document.getElementById('modal-title').textContent    = f[F.name]         || '—';
      document.getElementById('modal-subtitle').textContent = f[F.neighborhood] || '—';
      document.getElementById('modal-badge').textContent    = f[F.category]     || 'View';
      document.getElementById('modal-desc').textContent     = f[F.description]  || '—';
      document.getElementById('modal-time').textContent     = f[F.bestTime]     || '—';
      document.getElementById('modal-likes').textContent    = likes[id]?.count  || 0;
      document.getElementById('modal-photo').style.backgroundImage = imgUrl ? `url('${imgUrl}')` : 'none';

      document.getElementById('detail-modal').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    window.closeModal = function() {
      document.getElementById('detail-modal').classList.remove('open');
      document.body.style.overflow = '';
    };

    window.handleModalClick = function(e) {
      if (e.target === document.getElementById('detail-modal')) closeModal();
    };

    /* ══════════════════════════════════════════════════
       FILTER & SORT CONTROLS
    ══════════════════════════════════════════════════ */
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderCards();
      });
    });

    document.getElementById('sort-select').addEventListener('change', e => {
      currentSort = e.target.value;
      renderCards();
    });

    /* ══════════════════════════════════════════════════
       INIT
    ══════════════════════════════════════════════════ */
    fetchViews();
