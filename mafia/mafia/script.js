




const ROLES = [
  {
    id: 'mafia',
    name: 'Mafia',
    emoji: '🔫',
    required: true,
    desc: 'Eliminate citizens at night. Stay hidden during the day.',
    color: 'mafia'
  },
  {
    id: 'citizen',
    name: 'Citizen',
    emoji: '🏘️',
    required: true,
    desc: 'Find and vote out the Mafia before it\'s too late.',
    color: 'citizen'
  },
  {
    id: 'doctor',
    name: 'Doctor',
    emoji: '💊',
    required: false,
    desc: 'Save one player each night from elimination.',
    color: 'doctor'
  },
  {
    id: 'detective',
    name: 'Detective',
    emoji: '🔍',
    required: false,
    desc: 'Investigate one player each night to learn their role.',
    color: 'detective'
  }
];

const TIMER_DURATION = 5000; 




let state = {
  playerCount: 6,
  playerNames: [],
  roleSelection: {},  
  assignments: [],     
  revealed: new Set(), 
  oneTimeReveal: false,
  autoHideTimer: true,
  soundEnabled: true,
  currentStep: 1
};




const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let dom = {};


function cacheDom() {
  dom = {
    
    screenSetup: $('#screenSetup'),
    screenRoles: $('#screenRoles'),
    screenReveal: $('#screenReveal'),

    
    playerCount: $('#playerCount'),
    playerNamesContainer: $('#playerNamesContainer'),
    btnMinus: $('#btnMinus'),
    btnPlus: $('#btnPlus'),
    btnToRoles: $('#btnToRoles'),

    
    totalPlayersLabel: $('#totalPlayersLabel'),
    assignedCount: $('#assignedCount'),
    neededCount: $('#neededCount'),
    roleCounterBar: $('#roleCounterBar'),
    rolesGrid: $('#rolesGrid'),
    validationError: $('#validationError'),
    validationMsg: $('#validationMsg'),
    btnBackToSetup: $('#btnBackToSetup'),
    btnStartGame: $('#btnStartGame'),
    toggleOnce: $('#toggleOnce'),
    toggleTimer: $('#toggleTimer'),

    
    revealGrid: $('#revealGrid'),
    btnRestart: $('#btnRestart'),

    
    roleModal: $('#roleModal'),
    modalCard: $('#modalCard'),
    modalInner: $('#modalCard').querySelector('.modal-inner'),
    modalIcon: $('#modalIcon'),
    modalPlayerName: $('#modalPlayerName'),
    modalRoleIcon: $('#modalRoleIcon'),
    modalRoleName: $('#modalRoleName'),
    modalRoleDesc: $('#modalRoleDesc'),
    timerBar: $('#timerBar'),
    timerFill: $('#timerFill'),
    btnCloseModal: $('#btnCloseModal'),

    
    loadingOverlay: $('#loadingOverlay'),

    
    btnSound: $('#btnSound'),
    soundOnIcon: $('#soundOn'),
    soundOffIcon: $('#soundOff'),

    
    steps: $$('.step'),
    stepLines: $$('.step-line'),

    
    particles: $('#particles')
  };
}




const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;


function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
}


function playClick() {
  if (!state.soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}


function playReveal() {
  if (!state.soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.3);
  osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.7);

  
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'triangle';
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.4);
  gain2.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  osc2.start(audioCtx.currentTime);
  osc2.stop(audioCtx.currentTime + 0.5);
}


function playError() {
  if (!state.soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.25);
}




function createParticles() {
  const container = dom.particles;
  container.innerHTML = '';
  const count = window.innerWidth < 600 ? 15 : 30;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    container.appendChild(p);
  }
}






function setStep(step) {
  state.currentStep = step;

  dom.steps.forEach((el, i) => {
    const s = i + 1;
    el.classList.toggle('active', s === step);
    el.classList.toggle('completed', s < step);
  });

  dom.stepLines.forEach((line, i) => {
    line.classList.toggle('filled', i + 1 < step);
  });
}


function switchScreen(target) {
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.remove('active');
  }

  
  requestAnimationFrame(() => {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}






function renderPlayerFields() {
  const count = state.playerCount;
  const container = dom.playerNamesContainer;
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'player-name-field';
    div.innerHTML = `
      <span class="field-number">${i + 1}.</span>
      <input type="text"
             class="player-input"
             placeholder="Player ${i + 1}"
             maxlength="20"
             data-index="${i}"
             value="${state.playerNames[i] || ''}"
             id="player-input-${i}">
    `;
    container.appendChild(div);

    
    div.style.opacity = '0';
    div.style.transform = 'translateY(8px)';
    setTimeout(() => {
      div.style.transition = 'all 0.3s ease';
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    }, i * 40);
  }

  
  container.querySelectorAll('.player-input').forEach(input => {
    input.addEventListener('input', (e) => {
      state.playerNames[parseInt(e.target.dataset.index)] = e.target.value.trim();
    });
  });
}


function updatePlayerCount(newCount) {
  newCount = Math.max(4, Math.min(20, newCount));
  state.playerCount = newCount;
  dom.playerCount.value = newCount;

  
  while (state.playerNames.length < newCount) {
    state.playerNames.push('');
  }
  state.playerNames = state.playerNames.slice(0, newCount);

  renderPlayerFields();
}






function initRoleSelection() {
  state.roleSelection = {};
  ROLES.forEach(role => {
    if (role.required) {
      state.roleSelection[role.id] = role.id === 'citizen' ? Math.max(1, state.playerCount - 1) : 1;
    }
  });
}


function renderRolesGrid() {
  const grid = dom.rolesGrid;
  grid.innerHTML = '';

  dom.totalPlayersLabel.textContent = state.playerCount;
  dom.neededCount.textContent = state.playerCount;

  ROLES.forEach(role => {
    const isChecked = role.id in state.roleSelection;
    const qty = state.roleSelection[role.id] || 1;

    const item = document.createElement('div');
    item.className = 'role-item';
    item.dataset.role = role.id;

    item.innerHTML = `
      <div class="role-icon ${role.color}">${role.emoji}</div>
      <div class="role-info">
        <div class="role-name">
          ${role.name}
          ${role.required ? '<span class="role-tag">Required</span>' : ''}
        </div>
        <div class="role-desc">${role.desc}</div>
      </div>
      <div class="role-controls">
        <div class="qty-stepper ${isChecked ? 'visible' : ''}" data-role="${role.id}">
          <button class="qty-btn qty-minus" data-role="${role.id}" aria-label="Decrease ${role.name} count">−</button>
          <span class="qty-value" data-role="${role.id}">${qty}</span>
          <button class="qty-btn qty-plus" data-role="${role.id}" aria-label="Increase ${role.name} count">+</button>
        </div>
        <label class="role-checkbox">
          <input type="checkbox"
                 data-role="${role.id}"
                 ${isChecked ? 'checked' : ''}
                 ${role.required ? 'checked disabled' : ''}
                 id="role-check-${role.id}">
          <span class="checkmark"></span>
        </label>
      </div>
    `;

    grid.appendChild(item);
  });

  
  grid.querySelectorAll('.role-checkbox input').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const roleId = e.target.dataset.role;
      const stepper = grid.querySelector(`.qty-stepper[data-role="${roleId}"]`);

      if (e.target.checked) {
        state.roleSelection[roleId] = 1;
        stepper.classList.add('visible');
      } else {
        delete state.roleSelection[roleId];
        stepper.classList.remove('visible');
      }
      updateRoleCounter();
      playClick();
    });
  });

  grid.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const roleId = e.target.dataset.role;
      if (state.roleSelection[roleId] > 1) {
        state.roleSelection[roleId]--;
        grid.querySelector(`.qty-value[data-role="${roleId}"]`).textContent = state.roleSelection[roleId];
        updateRoleCounter();
        playClick();
      }
    });
  });

  grid.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const roleId = e.target.dataset.role;
      state.roleSelection[roleId]++;
      grid.querySelector(`.qty-value[data-role="${roleId}"]`).textContent = state.roleSelection[roleId];
      updateRoleCounter();
      playClick();
    });
  });

  updateRoleCounter();
}


function updateRoleCounter() {
  const total = Object.values(state.roleSelection).reduce((a, b) => a + b, 0);
  dom.assignedCount.textContent = total;

  dom.roleCounterBar.classList.remove('match', 'mismatch');
  if (total === state.playerCount) {
    dom.roleCounterBar.classList.add('match');
  } else {
    dom.roleCounterBar.classList.add('mismatch');
  }

  
  dom.validationError.classList.remove('show');
}


function validateRoles() {
  const total = Object.values(state.roleSelection).reduce((a, b) => a + b, 0);

  if (total !== state.playerCount) {
    dom.validationMsg.textContent = `You have ${total} role${total !== 1 ? 's' : ''} selected, but there are ${state.playerCount} players. Please adjust.`;
    dom.validationError.classList.add('show');
    playError();
    return false;
  }

  return true;
}






function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


function buildRolesArray() {
  const roles = [];
  for (const [roleId, count] of Object.entries(state.roleSelection)) {
    const roleDef = ROLES.find(r => r.id === roleId);
    for (let i = 0; i < count; i++) {
      roles.push({ ...roleDef });
    }
  }
  return shuffle(roles);
}


function assignRoles() {
  
  state.playerNames = state.playerNames.map((name, i) =>
    name || `Player ${i + 1}`
  );

  const shuffledRoles = buildRolesArray();
  state.assignments = state.playerNames.map((name, i) => ({
    name,
    role: shuffledRoles[i]
  }));
  state.revealed = new Set();
}






function renderRevealGrid() {
  const grid = dom.revealGrid;
  grid.innerHTML = '';

  state.assignments.forEach((assignment, i) => {
    const card = document.createElement('div');
    card.className = 'reveal-player-card';
    card.dataset.index = i;

    const initials = assignment.name.split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    card.innerHTML = `
      <div class="reveal-avatar">${initials}</div>
      <div class="reveal-player-name">${assignment.name}</div>
      <div class="reveal-status">Tap to reveal</div>
    `;

    
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px) scale(0.95)';
    setTimeout(() => {
      card.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
    }, i * 60 + 100);

    card.addEventListener('click', () => openRoleModal(i));
    grid.appendChild(card);
  });
}




let timerTimeout = null;
let timerInterval = null;


function openRoleModal(index) {
  
  if (state.oneTimeReveal && state.revealed.has(index)) {
    return;
  }

  const assignment = state.assignments[index];
  const role = assignment.role;

  initAudio();
  playClick();

  
  const initials = assignment.name.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  dom.modalIcon.textContent = initials;
  dom.modalPlayerName.textContent = assignment.name;

  
  dom.modalRoleIcon.className = `modal-role-icon ${role.color}`;
  dom.modalRoleIcon.textContent = role.emoji;
  dom.modalRoleName.className = `modal-role-name ${role.color}`;
  dom.modalRoleName.textContent = role.name;
  dom.modalRoleDesc.textContent = role.desc;

  
  dom.modalInner.classList.remove('flipped');

  
  dom.timerBar.classList.remove('active');
  dom.timerFill.style.width = '100%';
  dom.timerFill.style.transition = 'none';
  clearTimeout(timerTimeout);
  clearInterval(timerInterval);

  
  dom.roleModal.classList.add('active');
  dom.roleModal.dataset.playerIndex = index;

  
  const flipHandler = () => {
    dom.modalCard.removeEventListener('click', flipHandler);
    flipCard(index);
  };
  dom.modalCard.addEventListener('click', flipHandler);
}


function flipCard(index) {
  dom.modalInner.classList.add('flipped');
  playReveal();

  
  if (state.autoHideTimer) {
    dom.timerBar.classList.add('active');

    
    requestAnimationFrame(() => {
      dom.timerFill.style.transition = `width ${TIMER_DURATION}ms linear`;
      dom.timerFill.style.width = '0%';
    });

    timerTimeout = setTimeout(() => {
      closeRoleModal();
    }, TIMER_DURATION);
  }
}


function closeRoleModal() {
  const index = parseInt(dom.roleModal.dataset.playerIndex);

  
  state.revealed.add(index);

  
  const card = dom.revealGrid.querySelector(`[data-index="${index}"]`);
  if (card) {
    card.classList.add('revealed');
    card.querySelector('.reveal-status').textContent = 'Revealed';
  }

  
  clearTimeout(timerTimeout);
  clearInterval(timerInterval);

  
  dom.roleModal.classList.remove('active');
  dom.modalInner.classList.remove('flipped');

  playClick();
}






function showLoading(duration = 2000) {
  return new Promise(resolve => {
    dom.loadingOverlay.classList.add('active');
    setTimeout(() => {
      dom.loadingOverlay.classList.remove('active');
      resolve();
    }, duration);
  });
}




function bindEvents() {
  
  dom.btnMinus.addEventListener('click', () => {
    initAudio();
    playClick();
    updatePlayerCount(state.playerCount - 1);
  });

  dom.btnPlus.addEventListener('click', () => {
    initAudio();
    playClick();
    updatePlayerCount(state.playerCount + 1);
  });

  dom.playerCount.addEventListener('change', (e) => {
    updatePlayerCount(parseInt(e.target.value) || 4);
  });

  
  dom.btnToRoles.addEventListener('click', () => {
    initAudio();
    playClick();

    
    state.playerNames = [];
    dom.playerNamesContainer.querySelectorAll('.player-input').forEach(input => {
      state.playerNames.push(input.value.trim());
    });

    initRoleSelection();
    renderRolesGrid();
    switchScreen(dom.screenRoles);
    setStep(2);
  });

  
  dom.btnBackToSetup.addEventListener('click', () => {
    playClick();
    switchScreen(dom.screenSetup);
    setStep(1);
  });

  
  dom.btnStartGame.addEventListener('click', async () => {
    initAudio();

    
    state.oneTimeReveal = dom.toggleOnce.checked;
    state.autoHideTimer = dom.toggleTimer.checked;

    if (!validateRoles()) return;

    playClick();

    
    await showLoading(2200);

    
    assignRoles();
    renderRevealGrid();
    switchScreen(dom.screenReveal);
    setStep(3);
  });

  
  dom.btnCloseModal.addEventListener('click', (e) => {
    e.stopPropagation();
    closeRoleModal();
  });

  
  dom.roleModal.addEventListener('click', (e) => {
    if (e.target === dom.roleModal) {
      closeRoleModal();
    }
  });

  
  dom.btnRestart.addEventListener('click', () => {
    playClick();
    resetGame();
  });

  
  dom.btnSound.addEventListener('click', () => {
    initAudio();
    state.soundEnabled = !state.soundEnabled;
    dom.soundOnIcon.style.display = state.soundEnabled ? '' : 'none';
    dom.soundOffIcon.style.display = state.soundEnabled ? 'none' : '';
    if (state.soundEnabled) playClick();
  });

  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.roleModal.classList.contains('active')) {
      closeRoleModal();
    }
  });
}




function resetGame() {
  state.playerNames = [];
  state.roleSelection = {};
  state.assignments = [];
  state.revealed = new Set();
  state.playerCount = 6;
  dom.playerCount.value = 6;

  renderPlayerFields();
  switchScreen(dom.screenSetup);
  setStep(1);
}




function init() {
  cacheDom();
  createParticles();
  renderPlayerFields();
  bindEvents();
  setStep(1);
}


document.addEventListener('DOMContentLoaded', init);
