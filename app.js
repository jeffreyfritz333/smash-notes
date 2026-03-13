// State
let myFighter = null;
let notes = {}; // { "myId:oppId": { strengths, weaknesses, gameplan, rating } }
let sleepInterval = null;
let sleepIndex = 0;
let sleepRoster = [];

// DOM
const $charSelect = document.getElementById('charSelectScreen');
const $matchups = document.getElementById('matchupsScreen');
const $noteScreen = document.getElementById('noteScreen');
const $sleepScreen = document.getElementById('sleepScreen');
const $header = document.getElementById('appHeader');
const $headerTitle = document.getElementById('headerTitle');
const $headerBack = document.getElementById('headerBack');
const $headerPlaying = document.getElementById('headerPlaying');
const $sleepBtn = document.getElementById('sleepBtn');
const $toast = document.getElementById('toast');

// Init
function init() {
  loadState();
  if (myFighter !== null) {
    showMatchups();
  } else {
    showCharSelect();
  }
}

// Persistence
function loadState() {
  try {
    const saved = localStorage.getItem('smash-notes-data');
    if (saved) {
      const data = JSON.parse(saved);
      myFighter = data.myFighter ?? null;
      notes = data.notes ?? {};
    }
  } catch (e) { /* ignore */ }
}

function saveState() {
  localStorage.setItem('smash-notes-data', JSON.stringify({ myFighter, notes }));
}

function noteKey(oppId) {
  return myFighter + ':' + oppId;
}

function getNote(oppId) {
  return notes[noteKey(oppId)] || null;
}

function setNote(oppId, data) {
  notes[noteKey(oppId)] = data;
  saveState();
}

function deleteNote(oppId) {
  delete notes[noteKey(oppId)];
  saveState();
}

// Navigation
function showScreen(screen) {
  [$charSelect, $matchups, $noteScreen, $sleepScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function showCharSelect() {
  $headerBack.style.display = myFighter !== null ? 'block' : 'none';
  $headerTitle.textContent = 'Choose Your Fighter';
  $headerPlaying.style.display = 'none';
  showScreen($charSelect);
  renderCharSelect();
}

function showMatchups() {
  $headerBack.style.display = 'none';
  $headerTitle.textContent = 'Matchups';
  updatePlayingAs();
  $headerPlaying.style.display = 'flex';
  showScreen($matchups);
  renderMatchups();
}

function showNoteEditor(oppId) {
  const opp = ROSTER.find(f => f[0] === oppId);
  if (!opp) return;
  $headerBack.style.display = 'block';
  $headerTitle.textContent = 'vs ' + opp[1];
  showScreen($noteScreen);
  renderNoteEditor(oppId, opp);
}

$headerBack.addEventListener('click', () => {
  if ($noteScreen.classList.contains('active')) {
    showMatchups();
  } else if ($charSelect.classList.contains('active')) {
    showMatchups();
  }
});

// Render: Character Select
function renderCharSelect() {
  const grid = $charSelect.querySelector('.roster-grid');
  const search = $charSelect.querySelector('.search-bar');
  search.value = '';

  function render(filter) {
    const filtered = filter
      ? ROSTER.filter(f => f[1].toLowerCase().includes(filter.toLowerCase()))
      : ROSTER;
    grid.innerHTML = filtered.map(f => `
      <div class="fighter-card" style="--glow:${f[2]}" data-id="${f[0]}">
        ${fighterAvatarHTML(f[1], f[2], 'card')}
        <div class="fighter-num">#${displayNum(f[0])}</div>
        <div class="fighter-name">${f[1]}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.fighter-card').forEach(card => {
      card.addEventListener('click', () => {
        myFighter = parseFloat(card.dataset.id);
        saveState();
        showMatchups();
      });
    });
  }

  render();
  search.addEventListener('input', () => render(search.value));
}

// Render: Matchups Grid
function renderMatchups() {
  const grid = $matchups.querySelector('.roster-grid');
  const search = $matchups.querySelector('.search-bar');
  const statsBar = $matchups.querySelector('.stats-bar');
  search.value = '';

  // Stats
  const opponents = ROSTER.filter(f => f[0] !== myFighter);
  let wins = 0, losses = 0, evens = 0;
  opponents.forEach(f => {
    const n = getNote(f[0]);
    if (n) {
      if (n.rating === 'winning') wins++;
      else if (n.rating === 'losing') losses++;
      else if (n.rating === 'even') evens++;
    }
  });
  statsBar.innerHTML = `
    <span class="win">${wins} Winning</span>
    <span class="even">${evens} Even</span>
    <span class="lose">${losses} Losing</span>
    <span>${opponents.length - wins - losses - evens} Unrated</span>
  `;

  function render(filter) {
    const filtered = filter
      ? opponents.filter(f => f[1].toLowerCase().includes(filter.toLowerCase()))
      : opponents;
    grid.innerHTML = filtered.map(f => {
      const n = getNote(f[0]);
      const hasNotes = n && (n.strengths || n.weaknesses || n.gameplan);
      const badge = n && n.rating
        ? `<span class="matchup-badge ${n.rating}">${n.rating === 'winning' ? 'W' : n.rating === 'losing' ? 'L' : 'E'}</span>`
        : '';
      return `
        <div class="fighter-card${hasNotes ? ' has-notes' : ''}" style="--glow:${f[2]}" data-id="${f[0]}">
          ${fighterAvatarHTML(f[1], f[2], 'card')}
          <div class="fighter-num">#${displayNum(f[0])}</div>
          <div class="fighter-name">${f[1]}</div>
          ${badge}
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.fighter-card').forEach(card => {
      card.addEventListener('click', () => {
        showNoteEditor(parseFloat(card.dataset.id));
      });
    });
  }

  render();
  search.addEventListener('input', () => render(search.value));

  // Change character links
  $matchups.querySelectorAll('.change-char').forEach(link => {
    link.onclick = () => showCharSelect();
  });
}

// Render: Note Editor
function renderNoteEditor(oppId, opp) {
  const me = ROSTER.find(f => f[0] === myFighter);
  const existing = getNote(oppId) || {};

  $noteScreen.innerHTML = `
    <div class="matchup-header">
      <div class="vs-stars"></div>
      <div class="vs-fighter" style="--glow:${me[2]}">
        ${fighterAvatarHTML(me[1], me[2], 'vs')}
        <div class="fighter-label">${me[1]}</div>
      </div>
      <div class="vs-divider"></div>
      <div class="vs-text">VS.</div>
      <div class="vs-fighter" style="--glow:${opp[2]}">
        ${fighterAvatarHTML(opp[1], opp[2], 'vs')}
        <div class="fighter-label">${opp[1]}</div>
      </div>
    </div>

    <div class="notes-section">
      <label>Matchup Feel</label>
      <div class="rating-group">
        <button class="rating-btn${existing.rating === 'winning' ? ' selected' : ''}" data-rating="winning">Winning</button>
        <button class="rating-btn${existing.rating === 'even' ? ' selected' : ''}" data-rating="even">Even</button>
        <button class="rating-btn${existing.rating === 'losing' ? ' selected' : ''}" data-rating="losing">Losing</button>
      </div>
    </div>

    <div class="notes-section">
      <label>My Strengths (what works for me)</label>
      <textarea id="noteStrengths" placeholder="e.g. Out-range with fair, edge guard with dair...">${existing.strengths || ''}</textarea>
    </div>

    <div class="notes-section">
      <label>My Weaknesses (what to watch out for)</label>
      <textarea id="noteWeaknesses" placeholder="e.g. Gets combo'd at low %, careful of grab...">${existing.weaknesses || ''}</textarea>
    </div>

    <div class="notes-section">
      <label>Gameplan / Tips</label>
      <textarea id="noteGameplan" placeholder="e.g. Play patient, bait approach, punish landing...">${existing.gameplan || ''}</textarea>
    </div>

    <button class="save-btn" id="saveNote">Save Notes</button>
    ${existing.strengths || existing.weaknesses || existing.gameplan || existing.rating
      ? '<button class="delete-btn" id="deleteNote">Delete Notes</button>'
      : ''}
  `;

  // Rating buttons
  let selectedRating = existing.rating || null;
  $noteScreen.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $noteScreen.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
      if (selectedRating === btn.dataset.rating) {
        selectedRating = null;
      } else {
        selectedRating = btn.dataset.rating;
        btn.classList.add('selected');
      }
    });
  });

  // Save
  document.getElementById('saveNote').addEventListener('click', () => {
    setNote(oppId, {
      strengths: document.getElementById('noteStrengths').value.trim(),
      weaknesses: document.getElementById('noteWeaknesses').value.trim(),
      gameplan: document.getElementById('noteGameplan').value.trim(),
      rating: selectedRating
    });
    toast('Notes saved!');
    showMatchups();
  });

  // Delete
  const delBtn = document.getElementById('deleteNote');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      deleteNote(oppId);
      toast('Notes deleted');
      showMatchups();
    });
  }
}

// Sleep / Showcase
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startSleep() {
  stopSleep();
  sleepRoster = shuffleArray(ROSTER);
  sleepIndex = 0;
  $header.style.display = 'none';
  showScreen($sleepScreen);
  renderSleepFighter(true);
  sleepInterval = setInterval(() => cycleSleep(), 4000);
}

function stopSleep() {
  if (sleepInterval) {
    clearInterval(sleepInterval);
    sleepInterval = null;
  }
}

function wakeSleep() {
  stopSleep();
  $header.style.display = '';
  // Clear sleep stage animations
  const stage = $sleepScreen.querySelector('.sleep-stage');
  stage.querySelector('.sleep-fighter-active').innerHTML = '';
  stage.querySelector('.sleep-fighter-exit').innerHTML = '';
  if (myFighter !== null) {
    showMatchups();
  } else {
    showCharSelect();
  }
}

function renderSleepFighter(immediate) {
  const f = sleepRoster[sleepIndex];
  const stage = $sleepScreen.querySelector('.sleep-stage');
  const active = stage.querySelector('.sleep-fighter-active');

  stage.style.setProperty('--glow', f[2]);

  active.innerHTML = `
    <div class="sleep-number">#${displayNum(f[0])}</div>
    <img class="sleep-portrait" src="${fighterImagePath(f[1])}"
         onerror="this.style.display='none'">
    <div class="sleep-name">${f[1]}</div>
  `;

  if (!immediate) {
    active.classList.remove('sleep-enter');
    void active.offsetWidth; // force reflow
    active.classList.add('sleep-enter');
  }
}

function cycleSleep() {
  const stage = $sleepScreen.querySelector('.sleep-stage');
  const active = stage.querySelector('.sleep-fighter-active');
  const exit = stage.querySelector('.sleep-fighter-exit');

  // Move current to exit slot
  exit.innerHTML = active.innerHTML;
  exit.classList.remove('sleep-exit');
  void exit.offsetWidth;
  exit.classList.add('sleep-exit');

  // Advance
  sleepIndex = (sleepIndex + 1) % sleepRoster.length;
  if (sleepIndex === 0) sleepRoster = shuffleArray(ROSTER);

  renderSleepFighter(false);

  // Clean up exit after animation
  setTimeout(() => { exit.innerHTML = ''; exit.classList.remove('sleep-exit'); }, 800);
}

$sleepBtn.addEventListener('click', startSleep);
$sleepScreen.addEventListener('click', wakeSleep);

// Helpers
function fighterImagePath(name) {
  const aliases = {
    'Mii Brawler': 'Mii Fighters',
    'Mii Swordfighter': 'Mii Fighters',
    'Mii Gunner': 'Mii Fighters',
    'Pyra/Mythra': 'Pyra-Mythra'
  };
  const fileName = aliases[name] || name;
  return 'images/characters/' + encodeURIComponent(fileName) + '.png';
}

function fighterAvatarHTML(name, color, size) {
  const cls = size === 'mini' ? 'mini-avatar' : 'fighter-avatar';
  const imgCls = size === 'vs' ? 'vs-portrait' : (size === 'mini' ? 'mini-img' : 'avatar-img');
  return `<div class="${cls}" style="background:${color}">
    <img class="${imgCls}" src="${fighterImagePath(name)}" alt="${name}"
         onerror="var p=this.parentElement;this.remove();p.textContent='${fighterInitials(name)}'">
  </div>`;
}

function updatePlayingAs() {
  const me = ROSTER.find(f => f[0] === myFighter);
  if (!me) return;
  $headerPlaying.innerHTML = `
    ${fighterAvatarHTML(me[1], me[2], 'mini')}
    ${me[1]}
  `;
}

function fighterInitials(name) {
  return name.split(/[\s&\/]+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function displayNum(n) {
  return Number.isInteger(n) ? n : n.toFixed(1).replace('.', 'e');
}

function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  setTimeout(() => $toast.classList.remove('show'), 2000);
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Boot
init();
