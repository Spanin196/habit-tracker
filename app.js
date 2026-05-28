'use strict';

const UNITS = ['minutes', 'hours', 'repetitions', 'grams', 'kcal'];
const CATEGORIES = ['mindfulness', 'productivity', 'wellbeing', 'fitness'];

// ── Storage helpers ──────────────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function loadGoals() {
  try { return JSON.parse(localStorage.getItem('ht_goals') || '[]'); }
  catch { return []; }
}

function saveGoals(goals) {
  localStorage.setItem('ht_goals', JSON.stringify(goals));
}

function loadAllProgress() {
  try { return JSON.parse(localStorage.getItem('ht_progress') || '{}'); }
  catch { return {}; }
}

function saveAllProgress(all) {
  localStorage.setItem('ht_progress', JSON.stringify(all));
}

function getTodayProgress() {
  return loadAllProgress()[getToday()] || {};
}

function saveTodayProgress(data) {
  const all = loadAllProgress();
  all[getToday()] = data;
  saveAllProgress(all);
}

// ── Render goal list ─────────────────────────────────────────────────────────

function renderGoals() {
  const goals = loadGoals();
  const progress = getTodayProgress();
  const list = document.getElementById('goal-list');
  const emptyMsg = document.getElementById('empty-msg');

  document.getElementById('date-display').textContent = formatDate(getToday());
  list.innerHTML = '';

  if (goals.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  goals.forEach(goal => {
    const p = progress[goal.id] || { count: 0, completed: false };
    const isReps = goal.unit === 'repetitions';

    const li = document.createElement('li');
    li.className = `goal-item ${goal.category}${p.completed ? ' completed' : ''}`;

    // ── Left: goal info ──
    const infoDiv = document.createElement('div');
    infoDiv.className = `goal-info${isReps ? ' is-reps' : ''}`;

    if (isReps) {
      infoDiv.setAttribute('title', 'Click to add a repetition');
      infoDiv.addEventListener('click', () => handleRepClick(goal.id, goal.quantity));
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'goal-name';
    nameEl.textContent = goal.name;

    const metaEl = document.createElement('div');
    metaEl.className = 'goal-meta';

    const catBadge = document.createElement('span');
    catBadge.className = 'goal-category';
    catBadge.textContent = goal.category;

    const detailEl = document.createElement('span');
    detailEl.className = 'goal-detail';
    if (isReps) {
      detailEl.textContent = `${p.count} / ${goal.quantity} reps`;
    } else {
      detailEl.textContent = `${goal.quantity} ${goal.unit}`;
    }

    metaEl.appendChild(catBadge);
    metaEl.appendChild(detailEl);
    infoDiv.appendChild(nameEl);
    infoDiv.appendChild(metaEl);

    if (isReps) {
      const hint = document.createElement('div');
      hint.className = 'goal-hint';
      hint.textContent = 'Tap to count';
      infoDiv.appendChild(hint);

      const barWrap = document.createElement('div');
      barWrap.className = 'progress-bar-wrap';
      const barFill = document.createElement('div');
      barFill.className = 'progress-bar-fill';
      barFill.style.width = `${Math.min((p.count / goal.quantity) * 100, 100)}%`;
      barWrap.appendChild(barFill);
      infoDiv.appendChild(barWrap);
    }

    // ── Right: checkbox ──
    const label = document.createElement('label');
    label.className = 'goal-checkbox';
    label.setAttribute('aria-label', `Mark "${goal.name}" as done`);

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = p.completed;
    cb.addEventListener('change', () => handleCheckbox(goal.id, cb.checked));

    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';

    label.appendChild(cb);
    label.appendChild(checkmark);

    li.appendChild(infoDiv);
    li.appendChild(label);
    list.appendChild(li);
  });
}

// ── Event handlers ───────────────────────────────────────────────────────────

function handleRepClick(goalId, target) {
  const progress = getTodayProgress();
  const p = progress[goalId] || { count: 0, completed: false };
  if (p.completed) return;
  p.count = Math.min(p.count + 1, target);
  if (p.count >= target) p.completed = true;
  progress[goalId] = p;
  saveTodayProgress(progress);
  renderGoals();
}

function handleCheckbox(goalId, checked) {
  const progress = getTodayProgress();
  const p = progress[goalId] || { count: 0, completed: false };
  p.completed = checked;
  progress[goalId] = p;
  saveTodayProgress(progress);
  renderGoals();
}

// ── Goal form row builder ────────────────────────────────────────────────────

function createGoalRow(goal = null) {
  const div = document.createElement('div');
  div.className = 'goal-row';
  div.dataset.id = goal ? goal.id : genId();

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'goal-name-input';
  nameInput.placeholder = 'e.g. Meditate';
  nameInput.value = goal ? goal.name : '';

  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.className = 'goal-qty-input';
  qtyInput.placeholder = '30';
  qtyInput.min = '1';
  qtyInput.value = goal ? goal.quantity : '';

  const unitSelect = document.createElement('select');
  unitSelect.className = 'goal-unit-select';
  UNITS.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u.charAt(0).toUpperCase() + u.slice(1);
    if (goal && goal.unit === u) opt.selected = true;
    unitSelect.appendChild(opt);
  });

  const catSelect = document.createElement('select');
  catSelect.className = 'goal-cat-select';
  CATEGORIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    if (goal && goal.category === c) opt.selected = true;
    catSelect.appendChild(opt);
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.setAttribute('aria-label', 'Remove habit');
  removeBtn.addEventListener('click', () => div.remove());

  div.appendChild(nameInput);
  div.appendChild(qtyInput);
  div.appendChild(unitSelect);
  div.appendChild(catSelect);
  div.appendChild(removeBtn);

  return div;
}

function readGoalsFromContainer(container) {
  const rows = container.querySelectorAll('.goal-row');
  const goals = [];

  for (const row of rows) {
    const name = row.querySelector('.goal-name-input').value.trim();
    const qty = parseInt(row.querySelector('.goal-qty-input').value, 10);
    const unit = row.querySelector('.goal-unit-select').value;
    const category = row.querySelector('.goal-cat-select').value;

    if (!name) {
      row.querySelector('.goal-name-input').focus();
      alert('Please enter a name for each habit.');
      return null;
    }
    if (!qty || qty < 1) {
      row.querySelector('.goal-qty-input').focus();
      alert('Please enter a valid target (at least 1) for each habit.');
      return null;
    }

    goals.push({ id: row.dataset.id, name, quantity: qty, unit, category });
  }

  return goals;
}

// ── Setup modal ──────────────────────────────────────────────────────────────

function showSetupModal() {
  const container = document.getElementById('setup-goals-container');
  container.innerHTML = '';
  container.appendChild(createGoalRow());
  document.getElementById('setup-modal').classList.remove('hidden');
}

document.getElementById('add-setup-goal-btn').addEventListener('click', () => {
  document.getElementById('setup-goals-container').appendChild(createGoalRow());
});

document.getElementById('save-setup-btn').addEventListener('click', () => {
  const container = document.getElementById('setup-goals-container');
  if (container.querySelectorAll('.goal-row').length === 0) {
    alert('Please add at least one habit.');
    return;
  }
  const goals = readGoalsFromContainer(container);
  if (!goals) return;
  saveGoals(goals);
  document.getElementById('setup-modal').classList.add('hidden');
  renderGoals();
});

// ── Edit modal ───────────────────────────────────────────────────────────────

document.getElementById('edit-btn').addEventListener('click', () => {
  const goals = loadGoals();
  const container = document.getElementById('edit-goals-container');
  container.innerHTML = '';
  goals.forEach(g => container.appendChild(createGoalRow(g)));
  document.getElementById('edit-modal').classList.remove('hidden');
});

document.getElementById('add-edit-goal-btn').addEventListener('click', () => {
  document.getElementById('edit-goals-container').appendChild(createGoalRow());
});

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
  document.getElementById('edit-modal').classList.add('hidden');
});

document.getElementById('save-edit-btn').addEventListener('click', () => {
  const container = document.getElementById('edit-goals-container');
  if (container.querySelectorAll('.goal-row').length === 0) {
    alert('Please keep at least one habit.');
    return;
  }
  const goals = readGoalsFromContainer(container);
  if (!goals) return;
  saveGoals(goals);
  document.getElementById('edit-modal').classList.add('hidden');
  renderGoals();
});

// Close edit modal when clicking the backdrop
document.getElementById('edit-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('edit-modal')) {
    document.getElementById('edit-modal').classList.add('hidden');
  }
});

// ── Dark mode ────────────────────────────────────────────────────────────────

const darkBtn = document.getElementById('dark-mode-btn');

function applyDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled);
  darkBtn.textContent = enabled ? '🌙' : '☀️';
}

darkBtn.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('ht_dark', !isDark);
  applyDarkMode(!isDark);
});

// ── Init ─────────────────────────────────────────────────────────────────────

function init() {
  applyDarkMode(localStorage.getItem('ht_dark') === 'true');
  const goals = loadGoals();
  if (goals.length === 0) {
    showSetupModal();
  } else {
    renderGoals();
  }
}

init();
