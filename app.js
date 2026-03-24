'use strict';

const ICONS = ['🛒','✅','🎁','🎬','📚','🎄','🍿','📝','🏋️','💊','🧹','🐾','💡','✈️','🎮','🎵','🔨','🪛','🪚','⚙️','🪝','🔩','🌿','🐶','🍕','💰','🏠','🚗','✈️','🎯'];

const CATS = {
  household: { label: 'Household',     bg: 'var(--amber-light)',  text: 'var(--amber)' },
  tasks:     { label: 'Tasks',          bg: 'var(--accent-light)', text: 'var(--accent-text)' },
  gifts:     { label: 'Gifts',          bg: 'var(--pink-light)',   text: 'var(--pink)' },
  media:     { label: 'Media',          bg: 'var(--blue-light)',   text: 'var(--blue)' },
  hardware:  { label: 'Hardware',       bg: 'var(--coral-light)',  text: 'var(--coral)' },
  other:     { label: 'Other',          bg: 'var(--gray-light)',   text: 'var(--gray)' },
};

// ── State ──
let lists = [];
let nid = 1;
let cur = null;
let curTab = '';
let showDone = false;
let selIcon = '📝';
let pendingDelId = null;
let dragCardIdx = null;
let dragItemIdx = null;

// ── Persistence ──
function save() {
  localStorage.setItem('lists_data', JSON.stringify({ lists, nid }));
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem('lists_data'));
    if (d && d.lists) { lists = d.lists; nid = d.nid || (lists.length + 1); return; }
  } catch(e) {}
  // defaults
  lists = [
    { id:1, name:'Groceries',         icon:'🛒', cat:'household', items:{'':[]}, lastUsed: Date.now()-7 },
    { id:2, name:'Daily To-Do',       icon:'✅', cat:'tasks',     items:{'':[]}, lastUsed: Date.now()-6 },
    { id:3, name:'Christmas — Wife',  icon:'🎁', cat:'gifts',     items:{'':[]}, lastUsed: Date.now()-5 },
    { id:4, name:'Christmas — Kid 1', icon:'🎄', cat:'gifts',     items:{'':[]}, lastUsed: Date.now()-4 },
    { id:5, name:'Christmas — Kid 2', icon:'🎄', cat:'gifts',     items:{'':[]}, lastUsed: Date.now()-3 },
    { id:6, name:'Movies to Watch',   icon:'🎬', cat:'media',     items:{'':[]}, lastUsed: Date.now()-2 },
    { id:7, name:'Books to Read',     icon:'📚', cat:'media',     items:{'':[]}, lastUsed: Date.now()-1 },
    { id:8, name:'Hardware Store',    icon:'🔨', cat:'hardware',  items:{'':[]}, lastUsed: Date.now()   },
  ];
  nid = 9;
  save();
}

// ── Home view ──
function renderHome() {
  const sorted = [...lists].sort((a,b) => b.lastUsed - a.lastUsed);
  const container = document.getElementById('lists-container');
  container.innerHTML = '';
  sorted.forEach(l => {
    const c = CATS[l.cat] || CATS.other;
    const all = Object.values(l.items).flat();
    const active = all.filter(i => !i.done).length;
    const total = all.length;
    const meta = total === 0 ? 'Empty' : active === 0 ? 'All done ✓' : `${active} item${active !== 1 ? 's' : ''} remaining`;

    const card = document.createElement('div');
    card.className = 'list-card';
    card.draggable = true;
    card.dataset.id = l.id;
    card.innerHTML = `
      <div class="card-actions">
        <button class="act-btn" data-rename="${l.id}" title="Rename">✎</button>
        <button class="act-btn danger" data-delete="${l.id}" title="Delete">✕</button>
      </div>
      <div class="card-row1">
        <span class="card-icon">${l.icon}</span>
        <span class="card-badge" style="background:${c.bg};color:${c.text}">${c.label}</span>
      </div>
      <div class="card-name">${l.name}</div>
      <div class="card-meta">${meta}</div>
    `;

    card.addEventListener('click', e => {
      if (e.target.closest('.act-btn')) return;
      openList(l.id);
    });
    card.querySelector('[data-rename]').addEventListener('click', e => { e.stopPropagation(); startRenameCard(l.id); });
    card.querySelector('[data-delete]').addEventListener('click', e => { e.stopPropagation(); askDelete(l.id); });

    // Long press for mobile actions
    let pressTimer;
    card.addEventListener('touchstart', () => { pressTimer = setTimeout(() => card.classList.toggle('show-actions'), 500); }, { passive: true });
    card.addEventListener('touchend', () => clearTimeout(pressTimer), { passive: true });

    // Drag
    card.addEventListener('dragstart', e => {
      dragCardIdx = lists.findIndex(x => x.id === l.id);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      document.querySelectorAll('.list-card').forEach(c => c.classList.remove('dragging','drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      document.querySelectorAll('.list-card').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
    });
    card.addEventListener('drop', e => { e.preventDefault(); dropCard(l.id); });

    container.appendChild(card);
  });
}

function dropCard(tgtId) {
  if (dragCardIdx === null) return;
  const tgtIdx = lists.findIndex(x => x.id === tgtId);
  const [moved] = lists.splice(dragCardIdx, 1);
  const newTgt = lists.findIndex(x => x.id === tgtId);
  lists.splice(newTgt, 0, moved);
  const now = Date.now();
  lists.forEach((l, i) => l.lastUsed = now - i * 10);
  save(); renderHome();
}

function startRenameCard(id) {
  const l = lists.find(x => x.id === id);
  const nameEl = document.querySelector(`.list-card[data-id="${id}"] .card-name`);
  const inp = document.createElement('input');
  inp.value = l.name;
  inp.style.cssText = 'font-size:16px;font-weight:500;color:var(--text);border:none;border-bottom:1.5px solid var(--accent);background:none;outline:none;width:100%;font-family:DM Sans,sans-serif;padding:0';
  inp.onclick = e => e.stopPropagation();
  inp.onblur = () => { const v = inp.value.trim(); if (v) l.name = v; save(); renderHome(); };
  inp.onkeydown = e => { if (e.key === 'Enter' || e.key === 'Escape') inp.blur(); e.stopPropagation(); };
  nameEl.replaceWith(inp); inp.focus(); inp.select();
}

function askDelete(id) {
  pendingDelId = id;
  const l = lists.find(x => x.id === id);
  document.getElementById('del-msg').textContent = `"${l.name}" and all its items will be permanently deleted.`;
  openOverlay('del-overlay');
}
function confirmDelete() {
  if (pendingDelId === null) return;
  lists = lists.filter(l => l.id !== pendingDelId);
  pendingDelId = null;
  save(); closeOverlay('del-overlay'); renderHome();
}

// ── Detail view ──
function openList(id) {
  cur = lists.find(l => l.id === id);
  cur.lastUsed = Date.now();
  curTab = Object.keys(cur.items)[0];
  showDone = false;
  save();
  showView('detail');
  document.getElementById('detail-icon').textContent = cur.icon;
  document.getElementById('detail-title').textContent = cur.name;
  document.getElementById('detail-title').style.display = '';
  document.getElementById('detail-title-input').style.display = 'none';
  renderTabs(); renderItems();
}

function goHome() { showView('home'); renderHome(); }

function startRenameDetail() {
  const span = document.getElementById('detail-title');
  const inp = document.getElementById('detail-title-input');
  inp.value = cur.name;
  span.style.display = 'none';
  inp.style.display = '';
  inp.focus(); inp.select();
}
function commitRename() {
  const v = document.getElementById('detail-title-input').value.trim();
  if (v) cur.name = v;
  document.getElementById('detail-title').textContent = cur.name;
  document.getElementById('detail-title').style.display = '';
  document.getElementById('detail-title-input').style.display = 'none';
  save();
}

// ── Tabs ──
function renderTabs() {
  const keys = Object.keys(cur.items);
  const row = document.getElementById('tabs-row');
  if (keys.length <= 1 && keys[0] === '') { row.innerHTML = ''; return; }
  row.innerHTML = keys.map(k =>
    `<button class="tab-btn${curTab===k?' active':''}" data-tab="${k}">${k || 'All'}</button>`
  ).join('') + `<button class="tab-btn add-tab">+ Tab</button>`;
  row.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { curTab = b.dataset.tab; renderTabs(); renderItems(); }));
  row.querySelector('.add-tab').addEventListener('click', () => {
    const n = prompt('Tab name:'); if (!n) return;
    cur.items[n] = []; curTab = n; save(); renderTabs(); renderItems();
  });
}

// ── Items ──
function renderItems() {
  const items = cur.items[curTab] || [];
  const active = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  const peek = document.getElementById('done-peek');
  peek.textContent = done.length === 0 ? '' : showDone ? `Hide completed (${done.length})` : `Show (${done.length})`;

  const body = document.getElementById('items-body');
  if (active.length === 0 && (!showDone || done.length === 0)) {
    body.innerHTML = '<div class="empty-state">Nothing here yet — add your first item below</div>';
    return;
  }
  let html = '';
  active.forEach(item => { html += itemHTML(item, items.indexOf(item)); });
  if (showDone && done.length) {
    html += `<hr class="sep"><div class="section-head">Completed</div>`;
    done.forEach(item => { html += itemHTML(item, items.indexOf(item), true); });
  }
  body.innerHTML = html;

  body.querySelectorAll('.item-row').forEach(row => {
    const idx = parseInt(row.dataset.idx);
    row.querySelector('.checkbox').addEventListener('click', () => toggleItem(idx));
    row.querySelector('.item-del').addEventListener('click', () => deleteItem(idx));
    const label = row.querySelector('.item-label');
    if (label) label.addEventListener('dblclick', () => startEditItem(idx));

    row.addEventListener('dragstart', e => { dragItemIdx = idx; row.classList.add('dragging-item'); e.dataTransfer.effectAllowed = 'move'; });
    row.addEventListener('dragend', () => body.querySelectorAll('.item-row').forEach(r => r.classList.remove('dragging-item','drag-over-item')));
    row.addEventListener('dragover', e => { e.preventDefault(); body.querySelectorAll('.item-row').forEach(r => r.classList.remove('drag-over-item')); row.classList.add('drag-over-item'); });
    row.addEventListener('drop', e => { e.preventDefault(); dropItem(idx); });
  });
}

function itemHTML(item, idx, faded) {
  return `<div class="item-row" draggable="true" data-idx="${idx}" style="${faded?'opacity:0.45':''}">
    <div class="drag-pip"><span></span><span></span><span></span></div>
    <div class="checkbox${item.done?' checked':''}"></div>
    <span class="item-label${item.done?' done':''}">${escHtml(item.text)}</span>
    <button class="item-del">✕</button>
  </div>`;
}

function escHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function toggleItem(i) { cur.items[curTab][i].done = !cur.items[curTab][i].done; save(); renderItems(); }
function deleteItem(i) { cur.items[curTab].splice(i, 1); save(); renderItems(); }

function dropItem(tgtIdx) {
  const items = cur.items[curTab];
  if (dragItemIdx === null || dragItemIdx === tgtIdx) return;
  const [moved] = items.splice(dragItemIdx, 1);
  const adj = dragItemIdx < tgtIdx ? tgtIdx - 1 : tgtIdx;
  items.splice(adj, 0, moved);
  dragItemIdx = null; save(); renderItems();
}

function startEditItem(idx) {
  const body = document.getElementById('items-body');
  const row = body.querySelector(`[data-idx="${idx}"]`);
  if (!row) return;
  const label = row.querySelector('.item-label');
  const inp = document.createElement('input');
  inp.className = 'item-edit';
  inp.value = cur.items[curTab][idx].text;
  inp.ondblclick = e => e.stopPropagation();
  inp.onblur = () => { const v = inp.value.trim(); if (v) cur.items[curTab][idx].text = v; save(); renderItems(); };
  inp.onkeydown = e => { if (e.key === 'Enter' || e.key === 'Escape') inp.blur(); };
  label.replaceWith(inp); inp.focus(); inp.select();
}

function addItem() {
  const inp = document.getElementById('entry-input');
  const t = inp.value.trim(); if (!t) return;
  if (!cur.items[curTab]) cur.items[curTab] = [];
  cur.items[curTab].push({ text: t, done: false });
  inp.value = ''; save(); renderItems();
}

// ── New list modal ──
function openNewList() {
  selIcon = '📝';
  document.getElementById('nl-name').value = '';
  const picker = document.getElementById('nl-icons');
  picker.innerHTML = ICONS.map(ic => `<div class="icon-opt${ic===selIcon?' sel':''}" data-icon="${ic}">${ic}</div>`).join('');
  picker.querySelectorAll('.icon-opt').forEach(el => {
    el.addEventListener('click', () => {
      selIcon = el.dataset.icon;
      picker.querySelectorAll('.icon-opt').forEach(e => e.classList.toggle('sel', e.dataset.icon === selIcon));
    });
  });
  openOverlay('new-list-overlay');
  setTimeout(() => document.getElementById('nl-name').focus(), 100);
}

function createList() {
  const n = document.getElementById('nl-name').value.trim();
  const cat = document.getElementById('nl-cat').value;
  if (!n) return;
  lists.unshift({ id: nid++, name: n, icon: selIcon, cat, items: { '': [] }, lastUsed: Date.now() });
  save(); closeOverlay('new-list-overlay'); renderHome();
}

// ── Overlay helpers ──
function openOverlay(id) { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

// ── View switcher ──
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(name + '-view').classList.add('active');
  document.getElementById('fab').style.display = name === 'home' ? '' : 'none';
  document.getElementById('entry-bar').style.display = name === 'detail' ? '' : 'none';
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  load();
  renderHome();
  showView('home');

  document.getElementById('fab').addEventListener('click', openNewList);
  document.getElementById('back-btn').addEventListener('click', goHome);
  document.getElementById('detail-title').addEventListener('click', startRenameDetail);
  document.getElementById('detail-title-input').addEventListener('blur', commitRename);
  document.getElementById('detail-title-input').addEventListener('keydown', e => { if (e.key==='Enter'||e.key==='Escape') commitRename(); });
  document.getElementById('done-peek').addEventListener('click', () => { showDone = !showDone; renderItems(); });
  document.getElementById('entry-add').addEventListener('click', addItem);
  document.getElementById('entry-input').addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });

  document.getElementById('nl-create').addEventListener('click', createList);
  document.getElementById('nl-cancel').addEventListener('click', () => closeOverlay('new-list-overlay'));
  document.getElementById('del-confirm').addEventListener('click', confirmDelete);
  document.getElementById('del-cancel').addEventListener('click', () => closeOverlay('del-overlay'));

  document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }
});
