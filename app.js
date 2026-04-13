// State
let myFighter = null;
let notes = {}; // { "myId:oppId": { strengths, weaknesses, gameplan, rating } }
let cameFromStats = false;

// DOM
const $charSelect = document.getElementById('charSelectScreen');
const $matchups = document.getElementById('matchupsScreen');
const $noteScreen = document.getElementById('noteScreen');
const $header = document.getElementById('appHeader');
const $headerTitle = document.getElementById('headerTitle');
const $headerBack = document.getElementById('headerBack');
const $headerPlaying = document.getElementById('headerPlaying');
const $statsScreen = document.getElementById('statsScreen');
const $statsBtn = document.getElementById('statsBtn');
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
  [$charSelect, $matchups, $noteScreen, $statsScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function showCharSelect() {
  $headerBack.style.display = myFighter !== null ? 'block' : 'none';
  $headerTitle.textContent = 'Choose Your Fighter';
  $headerPlaying.style.display = 'none';
  $statsBtn.style.display = 'none';
  showScreen($charSelect);
  renderCharSelect();
}

function showMatchups() {
  $headerBack.style.display = 'none';
  $headerTitle.textContent = 'Matchups';
  updatePlayingAs();
  $headerPlaying.style.display = 'flex';
  $statsBtn.style.display = 'block';
  showScreen($matchups);
  renderMatchups();
}

function showStats() {
  $headerBack.style.display = 'block';
  $headerTitle.textContent = 'Matchup Stats';
  $statsBtn.style.display = 'none';
  showScreen($statsScreen);
  renderStats();
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
    if (cameFromStats) {
      cameFromStats = false;
      showStats();
    } else {
      showMatchups();
    }
  } else if ($charSelect.classList.contains('active')) {
    showMatchups();
  } else if ($statsScreen.classList.contains('active')) {
    showMatchups();
  }
});

$statsBtn.addEventListener('click', showStats);

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

// Render: Matchup Stats
function renderStats() {
  const opponents = ROSTER.filter(f => f[0] !== myFighter);
  const groups = { winning: [], even: [], losing: [], unrated: [] };

  opponents.forEach(f => {
    const n = getNote(f[0]);
    const rating = n && n.rating ? n.rating : 'unrated';
    groups[rating].push(f);
  });

  const total = opponents.length;
  const w = groups.winning.length;
  const e = groups.even.length;
  const l = groups.losing.length;
  const u = groups.unrated.length;
  const rated = w + e + l;

  // Conic gradient for donut chart
  const pW = total ? (w / total) * 100 : 0;
  const pE = total ? (e / total) * 100 : 0;
  const pL = total ? (l / total) * 100 : 0;
  const s1 = pW;
  const s2 = s1 + pE;
  const s3 = s2 + pL;
  const donutGradient = total === 0 ? '#333'
    : `conic-gradient(#27ae60 0% ${s1}%, #f39c12 ${s1}% ${s2}%, #e74c3c ${s2}% ${s3}%, #333 ${s3}% 100%)`;

  function renderGroup(fighters) {
    if (fighters.length === 0) return '<div class="stats-empty">None yet</div>';
    return `<div class="roster-grid">${fighters.map(f =>
      `<div class="fighter-card" style="--glow:${f[2]}" data-id="${f[0]}">
        ${fighterAvatarHTML(f[1], f[2], 'card')}
        <div class="fighter-name">${f[1]}</div>
      </div>`
    ).join('')}</div>`;
  }

  $statsScreen.innerHTML = `
    <div class="stats-overview">
      <div class="stats-donut" style="background:${donutGradient}">
        <div class="stats-donut-label">
          <span class="donut-count">${rated}</span>
          <span class="donut-sub">of ${total} rated</span>
        </div>
      </div>
      <div class="stats-legend">
        <div class="stats-legend-item">
          <div class="stats-legend-dot win"></div>
          <span class="stats-legend-count">${w}</span>
          <span class="stats-legend-label">Winning</span>
        </div>
        <div class="stats-legend-item">
          <div class="stats-legend-dot even"></div>
          <span class="stats-legend-count">${e}</span>
          <span class="stats-legend-label">Even</span>
        </div>
        <div class="stats-legend-item">
          <div class="stats-legend-dot lose"></div>
          <span class="stats-legend-count">${l}</span>
          <span class="stats-legend-label">Losing</span>
        </div>
        <div class="stats-legend-item">
          <div class="stats-legend-dot unrated"></div>
          <span class="stats-legend-count">${u}</span>
          <span class="stats-legend-label">Unrated</span>
        </div>
      </div>
    </div>

    <div class="stats-bar-chart">
      <div class="stats-bar-segment win" style="width:${pW}%"></div>
      <div class="stats-bar-segment even" style="width:${pE}%"></div>
      <div class="stats-bar-segment lose" style="width:${pL}%"></div>
      <div class="stats-bar-segment unrated" style="width:${100 - pW - pE - pL}%"></div>
    </div>

    <div class="stats-section">
      <div class="stats-section-header">
        <div class="stats-section-dot win"></div>
        <span class="stats-section-title">Winning</span>
        <span class="stats-section-count">${w} matchup${w !== 1 ? 's' : ''}</span>
      </div>
      ${renderGroup(groups.winning)}
    </div>

    <div class="stats-section">
      <div class="stats-section-header">
        <div class="stats-section-dot even"></div>
        <span class="stats-section-title">Even</span>
        <span class="stats-section-count">${e} matchup${e !== 1 ? 's' : ''}</span>
      </div>
      ${renderGroup(groups.even)}
    </div>

    <div class="stats-section">
      <div class="stats-section-header">
        <div class="stats-section-dot lose"></div>
        <span class="stats-section-title">Losing</span>
        <span class="stats-section-count">${l} matchup${l !== 1 ? 's' : ''}</span>
      </div>
      ${renderGroup(groups.losing)}
    </div>

    <div class="stats-section">
      <div class="stats-section-header">
        <div class="stats-section-dot unrated"></div>
        <span class="stats-section-title">Unrated</span>
        <span class="stats-section-count">${u} matchup${u !== 1 ? 's' : ''}</span>
      </div>
      ${renderGroup(groups.unrated)}
    </div>
  `;

  // Click any fighter card to open its note editor
  $statsScreen.querySelectorAll('.fighter-card').forEach(card => {
    card.addEventListener('click', () => {
      cameFromStats = true;
      showNoteEditor(parseFloat(card.dataset.id));
    });
  });
}

// Render: Note Editor
function renderNoteEditor(oppId, opp) {
  const me = ROSTER.find(f => f[0] === myFighter);
  const existing = getNote(oppId) || {};

  $noteScreen.innerHTML = `
    <div class="matchup-header">
      <div class="vs-stars"></div>
      <div class="vs-lightning"></div>
      <div class="vs-flash"></div>
      <div class="vs-fighter vs-left" style="--glow:${me[2]}">
        ${fighterAvatarHTML(me[1], me[2], 'vs')}
        <div class="fighter-label">${me[1]}</div>
      </div>
      <div class="vs-divider"></div>
      <div class="vs-text">VS.</div>
      <div class="vs-fighter vs-right" style="--glow:${opp[2]}">
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
      <div class="note-editor" id="noteStrengths" contenteditable="true" data-placeholder="e.g. Out-range with fair, edge guard with dair...">${renderNoteBadges(existing.strengths || '')}</div>
    </div>

    <div class="notes-section">
      <label>My Weaknesses (what to watch out for)</label>
      <div class="note-editor" id="noteWeaknesses" contenteditable="true" data-placeholder="e.g. Gets combo'd at low %, careful of grab...">${renderNoteBadges(existing.weaknesses || '')}</div>
    </div>

    <div class="notes-section">
      <label>Gameplan / Tips</label>
      <div class="note-editor" id="noteGameplan" contenteditable="true" data-placeholder="e.g. Play patient, bait approach, punish landing...">${renderNoteBadges(existing.gameplan || '')}</div>
    </div>

    <button class="save-btn" id="saveNote">Save Notes</button>
    ${existing.strengths || existing.weaknesses || existing.gameplan || existing.rating
      ? '<button class="delete-btn" id="deleteNote">Delete Notes</button>'
      : ''}
  `;

  // Set up badge pickers on note editors
  $noteScreen.querySelectorAll('.note-editor').forEach(setupBadgePicker);

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
      strengths: getEditorText('noteStrengths'),
      weaknesses: getEditorText('noteWeaknesses'),
      gameplan: getEditorText('noteGameplan'),
      rating: selectedRating
    });
    toast('Notes saved!');
    if (cameFromStats) { cameFromStats = false; showStats(); }
    else { showMatchups(); }
  });

  // Delete
  const delBtn = document.getElementById('deleteNote');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      deleteNote(oppId);
      toast('Notes deleted');
      if (cameFromStats) { cameFromStats = false; showStats(); }
      else { showMatchups(); }
    });
  }
}

// Helpers

// Character portrait paths - tries colorful portrait first, falls back to stock icon
function fighterImagePath(name) {
  const aliases = {
    'Pyra/Mythra': 'Pyra-Mythra'
  };
  const fileName = aliases[name] || name;
  return 'images/portraits/' + encodeURIComponent(fileName) + '.png';
}
function fighterStockPath(name) {
  const aliases = {
    'Pyra/Mythra': 'Pyra-Mythra'
  };
  const fileName = aliases[name] || name;
  return 'images/stock/' + encodeURIComponent(fileName) + '.png';
}

// Series badge mapping: character name → badge filename
// Badge filenames reference extracted files from badges.jpg
const SERIES_BADGE = {
  'Mario': 'mario', 'Luigi': 'mario', 'Peach': 'mario', 'Daisy': 'mario',
  'Rosalina & Luma': 'mario', 'Bowser': 'mario', 'Bowser Jr.': 'mario',
  'Dr. Mario': 'mario', 'Piranha Plant': 'mario',
  'Yoshi': 'metroid',  // file contains Yoshi egg
  'Wario': 'wario',
  'Donkey Kong': 'donkey-kong', 'Diddy Kong': 'donkey-kong',
  'Link': 'zelda', 'Zelda': 'zelda', 'Sheik': 'zelda',
  'Ganondorf': 'zelda', 'Young Link': 'zelda', 'Toon Link': 'zelda',
  'Samus': 'xenoblade', 'Dark Samus': 'xenoblade',  // file contains Screw Attack
  'Zero Suit Samus': 'xenoblade', 'Ridley': 'xenoblade',
  'Kirby': 'star-fox', 'Meta Knight': 'star-fox',  // file contains Warp Star
  'King Dedede': 'star-fox',
  'Fox': 'minecraft', 'Falco': 'minecraft', 'Wolf': 'minecraft',  // file contains Fox head
  'Pikachu': 'rob', 'Pichu': 'rob', 'Jigglypuff': 'rob',  // file contains Pokeball
  'Mewtwo': 'rob', 'Pokemon Trainer': 'rob', 'Lucario': 'rob',
  'Greninja': 'rob', 'Incineroar': 'rob',
  'Ness': 'pikmin', 'Lucas': 'pikmin',  // file contains Earth (EarthBound)
  'Captain Falcon': 'f-zero',
  'Marth': 'fire-emblem', 'Lucina': 'fire-emblem', 'Roy': 'fire-emblem',
  'Chrom': 'fire-emblem', 'Ike': 'fire-emblem', 'Robin': 'fire-emblem',
  'Corrin': 'fire-emblem', 'Byleth': 'fire-emblem',
  'Pit': 'duck-hunt', 'Dark Pit': 'duck-hunt', 'Palutena': 'duck-hunt', // file contains Kid Icarus wings
  'Ice Climbers': 'ice-climber',
  'Snake': 'metal-gear',
  'Sonic': 'punch-out',  // file contains Sonic head
  'Villager': 'animal-crossing', 'Isabelle': 'animal-crossing',
  'Olimar': 'pokemon',  // file contains Pikmin flower
  'Mr. Game & Watch': 'game-watch',
  'R.O.B.': 'mega-man',  // closest match
  'Pac-Man': 'sonic',  // file contains Pac-Man shape
  'Mega Man': 'mega-man',
  'Ryu': 'street-fighter', 'Ken': 'street-fighter',
  'Little Mac': 'smash',  // placeholder
  'Wii Fit Trainer': 'wii-fit',
  'Duck Hunt': 'kid-icarus',  // file contains duck bird
  'Cloud': 'final-fantasy', 'Sephiroth': 'final-fantasy',
  'Bayonetta': 'bayonetta',
  'Shulk': 'kirby',  // closest - has cross/Monado-like shape
  'Inkling': 'arms',  // file contains squid
  'Simon': 'castlevania', 'Richter': 'castlevania',
  'King K. Rool': 'donkey-kong',
  'Joker': 'persona',
  'Hero': 'dragon-quest',
  'Banjo & Kazooie': 'smash',  // file contains Jiggy puzzle
  'Terry': 'mother',  // closest match (Fatal Fury star)
  'Min Min': 'arms',  // placeholder
  'Steve': 'minecraft',  // reusing fox file as placeholder
  'Pyra/Mythra': 'fire-emblem',  // placeholder
  'Kazuya': 'street-fighter',  // Tekken - closest
  'Sora': 'pac-man',  // file contains crown (Kingdom Hearts)
  'Mii Brawler': 'mii', 'Mii Swordfighter': 'mii', 'Mii Gunner': 'mii',
};

function fighterBadgePath(name) {
  const badge = SERIES_BADGE[name];
  return badge ? 'images/badges/' + badge + '.png' : null;
}

// Visual theme per character — determines font + text effects on grid tiles
const FIGHTER_THEME = {
  // Playful: bouncy comic style
  'Mario': 'playful', 'Luigi': 'playful', 'Peach': 'playful', 'Daisy': 'playful',
  'Bowser': 'playful', 'Bowser Jr.': 'playful', 'Rosalina & Luma': 'playful',
  'Dr. Mario': 'playful', 'Piranha Plant': 'playful', 'Yoshi': 'playful',
  'Wario': 'playful', 'Donkey Kong': 'playful', 'Diddy Kong': 'playful',
  'King K. Rool': 'playful', 'Banjo & Kazooie': 'playful',
  // Medieval: elegant gold serif
  'Link': 'medieval', 'Zelda': 'medieval', 'Sheik': 'medieval',
  'Ganondorf': 'medieval', 'Young Link': 'medieval', 'Toon Link': 'medieval',
  'Pit': 'medieval', 'Dark Pit': 'medieval', 'Palutena': 'medieval',
  // Pixel: 8-bit blocky metallic
  'Mega Man': 'pixel', 'Mr. Game & Watch': 'pixel', 'R.O.B.': 'pixel',
  'Pac-Man': 'pixel', 'Steve': 'pixel', 'Duck Hunt': 'pixel',
  // Sci-fi: futuristic neon glow
  'Samus': 'scifi', 'Dark Samus': 'scifi', 'Zero Suit Samus': 'scifi',
  'Ridley': 'scifi', 'Fox': 'scifi', 'Falco': 'scifi', 'Wolf': 'scifi',
  'Shulk': 'scifi', 'Pyra/Mythra': 'scifi', 'Olimar': 'scifi',
  // Electric: bold energy glow
  'Pikachu': 'electric', 'Pichu': 'electric', 'Mewtwo': 'electric',
  'Pokemon Trainer': 'electric', 'Lucario': 'electric',
  'Greninja': 'electric', 'Incineroar': 'electric',
  // Noble: regal serif
  'Marth': 'noble', 'Lucina': 'noble', 'Roy': 'noble', 'Chrom': 'noble',
  'Ike': 'noble', 'Robin': 'noble', 'Corrin': 'noble', 'Byleth': 'noble',
  // Martial: bold impact
  'Ryu': 'martial', 'Ken': 'martial', 'Terry': 'martial',
  'Kazuya': 'martial', 'Little Mac': 'martial', 'Min Min': 'martial',
  'Captain Falcon': 'martial',
  // Edgy: angular stylish
  'Joker': 'edgy', 'Bayonetta': 'edgy', 'Inkling': 'edgy',
  // Stealth: dark military
  'Snake': 'stealth',
  // Speed: slanted fast
  'Sonic': 'speed',
  // Fantasy: dramatic silver
  'Cloud': 'fantasy', 'Sephiroth': 'fantasy', 'Hero': 'fantasy', 'Sora': 'fantasy',
  'Simon': 'fantasy', 'Richter': 'fantasy',
  // Cute: soft bubbly
  'Kirby': 'cute', 'King Dedede': 'cute', 'Meta Knight': 'cute',
  'Jigglypuff': 'cute', 'Isabelle': 'cute', 'Villager': 'cute',
  'Ice Climbers': 'cute',
  // Retro: warm nostalgic pixel
  'Ness': 'retro', 'Lucas': 'retro',
  // Clean: minimal modern
  'Wii Fit Trainer': 'clean',
  'Mii Brawler': 'clean', 'Mii Swordfighter': 'clean', 'Mii Gunner': 'clean',
};

function fighterAvatarHTML(name, color, size) {
  const cls = size === 'mini' ? 'mini-avatar' : 'fighter-avatar';
  const badgePath = (size === 'card') ? fighterBadgePath(name) : null;
  const badgeHTML = badgePath
    ? `<img class="series-badge" src="${badgePath}" alt="" onerror="this.remove()">`
    : '';

  if (size === 'card') {
    // Grid tiles: themed initials as the primary visual
    const theme = FIGHTER_THEME[name] || 'clean';
    const initials = fighterInitials(name);
    return `<div class="${cls}" style="background:${color}">
      <span class="fighter-initials theme-${theme}">${initials}</span>
      ${badgeHTML}
    </div>`;
  }

  // VS header and mini avatar: keep portrait images
  const imgCls = size === 'vs' ? 'vs-portrait' : 'mini-img';
  const stockSrc = fighterStockPath(name);
  return `<div class="${cls}" style="background:${color}">
    <img class="${imgCls}" src="${fighterImagePath(name)}" alt="${name}"
         onerror="this.onerror=function(){var p=this.parentElement;this.remove();p.textContent='${fighterInitials(name)}'};this.src='${stockSrc}'">
    ${badgeHTML}
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

// ── Smash term badge picker ──────────────────────────────

const SMASH_TERMS = [
  // Aerials (blue)
  { term: 'nair', cat: 'aerial' },
  { term: 'fair', cat: 'aerial' },
  { term: 'bair', cat: 'aerial' },
  { term: 'dair', cat: 'aerial' },
  { term: 'up air', cat: 'aerial' },
  { term: 'down air', cat: 'aerial' },
  // Specials (purple)
  { term: 'neutral b', cat: 'special' },
  { term: 'side b', cat: 'special' },
  { term: 'up b', cat: 'special' },
  { term: 'down b', cat: 'special' },
  // Tilts (green)
  { term: 'f-tilt', cat: 'tilt' },
  { term: 'u-tilt', cat: 'tilt' },
  { term: 'd-tilt', cat: 'tilt' },
  // Smash attacks (orange)
  { term: 'f-smash', cat: 'smash-atk' },
  { term: 'u-smash', cat: 'smash-atk' },
  { term: 'd-smash', cat: 'smash-atk' },
  // Other (red)
  { term: 'grab', cat: 'other' },
  { term: 'jab', cat: 'other' },
  { term: 'dash attack', cat: 'other' },
  { term: 'edge guard', cat: 'other' },
  { term: 'spike', cat: 'other' },
  { term: 'gimp', cat: 'other' },
];

// Sort longest first so "up air" matches before "air"
SMASH_TERMS.sort((a, b) => b.term.length - a.term.length);

const TERM_REGEX = new RegExp(
  '\\b(' + SMASH_TERMS.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi'
);
const TERM_MAP = {};
SMASH_TERMS.forEach(t => { TERM_MAP[t.term.toLowerCase()] = t.cat; });

// Render plain text with badge spans for Smash terms
function renderNoteBadges(text) {
  if (!text) return '';
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Wrap badges and ensure text nodes exist between them for cursor navigation
  const result = escaped.replace(TERM_REGEX, (match) => {
    const cat = TERM_MAP[match.toLowerCase()] || 'other';
    return `\u200B<span class="inline-badge ${cat}" contenteditable="false">${match}</span>\u200B`;
  });
  return result;
}

// Extract plain text from a contenteditable editor
function getEditorText(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  // Clone to manipulate without affecting DOM
  const clone = el.cloneNode(true);
  // Replace badge spans with their text
  clone.querySelectorAll('.inline-badge').forEach(b => {
    b.replaceWith(b.textContent);
  });
  // Get text, normalizing whitespace from any <br>/<div> line breaks
  return (clone.innerText || clone.textContent || '').replace(/[\u200B\u00A0]/g, ' ').replace(/  +/g, ' ').trim();
}

function insertBadgeAtCursor(editor, term, cat) {
  editor.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  // Add space before if needed
  const prev = range.startContainer;
  const off = range.startOffset;
  if (prev.nodeType === Node.TEXT_NODE && off > 0 && prev.textContent[off - 1] !== ' ') {
    const spBefore = document.createTextNode(' ');
    range.insertNode(spBefore);
    range.setStartAfter(spBefore);
    range.collapse(true);
  }

  // Insert badge
  const badge = document.createElement('span');
  badge.className = `inline-badge ${cat}`;
  badge.contentEditable = 'false';
  badge.textContent = term;
  range.insertNode(badge);

  // Insert a zero-width space + regular space after badge so cursor has a landing spot
  const after = document.createTextNode('\u00A0');
  badge.after(after);

  // Place cursor after the space
  const newRange = document.createRange();
  newRange.setStartAfter(after);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

// Re-highlight terms when user types them manually
function rehighlightEditor(editor) {
  const text = getEditorText(editor.id);
  if (!TERM_REGEX.test(text)) return; // no terms to highlight

  // Save cursor position roughly
  const sel = window.getSelection();
  let cursorOffset = 0;
  if (sel.rangeCount) {
    const preRange = document.createRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
    cursorOffset = preRange.toString().length;
  }

  // Re-render
  editor.innerHTML = renderNoteBadges(text);

  // Restore cursor
  restoreCursor(editor, cursorOffset);
}

function restoreCursor(editor, offset) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let pos = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (pos + node.length >= offset) {
      const range = document.createRange();
      range.setStart(node, Math.min(offset - pos, node.length));
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    pos += node.length;
  }
}

function setupBadgePicker(editor) {
  const wrap = document.createElement('div');
  wrap.className = 'textarea-wrap';
  editor.parentNode.insertBefore(wrap, editor);
  wrap.appendChild(editor);

  const picker = document.createElement('div');
  picker.className = 'badge-picker';
  picker.innerHTML = SMASH_TERMS.map(t =>
    `<span class="term-badge ${t.cat}" data-term="${t.term}" data-cat="${t.cat}">${t.term}</span>`
  ).join('');
  wrap.appendChild(picker);

  picker.querySelectorAll('.term-badge').forEach(badge => {
    badge.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevent editor blur
    });
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      insertBadgeAtCursor(editor, badge.dataset.term, badge.dataset.cat);
    });
  });

  // Re-highlight when user types terms manually (on pause)
  let debounce = null;
  editor.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => rehighlightEditor(editor), 800);
  });
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Boot
init();
